import { EventEmitter } from 'events';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db/client';
import type { Sitemap } from '@website-builder/shared';
import { insertPage, replacePageBlocksTx, replacePageBlocks, setPageStatus, getPageId } from './sites/pageOps';
import { generateLandingAndSitemap } from './llm/generateLandingAndSitemap';
import type { LandingAndSitemapResult } from './llm/generateLandingAndSitemap';
import { generateSubpage } from './llm/generateSubpage';
import { planSubpages } from './llm/planSubpages';
import { withLimit } from './llm/concurrencyLimit';
import type { PageStatus } from './sites/pageOps';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type JobEvent =
    | { type: 'landing_started' }
    | { type: 'landing_done'; sitemap: Sitemap }
    | { type: 'subpage_started'; path: string }
    | { type: 'subpage_done'; path: string }
    | { type: 'subpage_failed'; path: string; reason: string }
    | { type: 'complete' }
    | { type: 'error'; reason: string };

export type JobPhase = 'idle' | 'landing' | 'subpages' | 'done';

export interface GenerationJobHandle {
    identifier: string;
    events: EventEmitter;
    snapshot(): {
        phase: JobPhase;
        pages: Array<{ path: string; status: PageStatus }>;
    };
}

// ---------------------------------------------------------------------------
// In-memory registry
// ---------------------------------------------------------------------------

const jobs = new Map<string, GenerationJobHandle>();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Starts a full multi-page generation job for the given site.
 * Idempotent: returns the existing handle if a job is already running.
 */
export function startGenerationJob(
    identifier: string,
    userPrompt: string,
): GenerationJobHandle {
    const existing = jobs.get(identifier);
    if (existing) return existing;

    const events = new EventEmitter();
    let phase: JobPhase = 'idle';
    const pageStatuses = new Map<string, PageStatus>();

    const handle: GenerationJobHandle = {
        identifier,
        events,
        snapshot() {
            return {
                phase,
                pages: Array.from(pageStatuses.entries()).map(([path, status]) => ({
                    path,
                    status,
                })),
            };
        },
    };

    jobs.set(identifier, handle);

    void runJob(identifier, userPrompt, events, {
        setPhase(p: JobPhase) {
            phase = p;
        },
        setPageStatus(path: string, status: PageStatus) {
            pageStatuses.set(path, status);
        },
    }).finally(() => {
        phase = 'done';
        scheduleCleanup(identifier);
    });

    return handle;
}

/**
 * Returns the current job handle for a site, if one exists.
 * Used by SSE reconnect and by regenerateSubpage.
 */
export function getJob(identifier: string): GenerationJobHandle | undefined {
    return jobs.get(identifier);
}

/**
 * Creates a minimal job handle for a site that has no active generation job.
 * Used by regenerateSubpage when called after server restart.
 */
export function createOnlySubpageJob(identifier: string): GenerationJobHandle {
    const events = new EventEmitter();
    const handle: GenerationJobHandle = {
        identifier,
        events,
        snapshot: () => ({ phase: 'subpages', pages: [] }),
    };
    jobs.set(identifier, handle);
    scheduleCleanup(identifier);
    return handle;
}

// ---------------------------------------------------------------------------
// Internal job runner
// ---------------------------------------------------------------------------

interface JobStateCallbacks {
    setPhase(p: JobPhase): void;
    setPageStatus(path: string, status: PageStatus): void;
}

async function runJob(
    identifier: string,
    userPrompt: string,
    events: EventEmitter,
    state: JobStateCallbacks,
): Promise<void> {
    try {
        state.setPhase('landing');
        events.emit('event', { type: 'landing_started' } satisfies JobEvent);

        const phaseA = await generateLandingAndSitemap(userPrompt);
        await persistLandingPhase(identifier, phaseA);

        // Mark landing page as ready in snapshot
        state.setPageStatus('/', 'ready');
        events.emit('event', { type: 'landing_done', sitemap: phaseA.sitemap } satisfies JobEvent);

        const subpageEntries = phaseA.sitemap.filter((e) => e.path !== '/');

        if (subpageEntries.length === 0) {
            events.emit('event', { type: 'complete' } satisfies JobEvent);
            return;
        }

        // Phase A.5 — Content planning (optional, best-effort)
        let contentPlanPages: import('@website-builder/shared').ContentPlanEntry[] = [];
        if (subpageEntries.length > 0) {
            const planResult = await planSubpages({
                userPrompt,
                landingBlocks: phaseA.landingBlocks,
                sitemap: phaseA.sitemap,
                theme: phaseA.theme,
                chrome: phaseA.chrome,
            });
            contentPlanPages = planResult.plan?.pages ?? [];
        }

        state.setPhase('subpages');

        // Initialise snapshot with pending status for all subpages
        for (const entry of subpageEntries) {
            state.setPageStatus(entry.path, 'pending');
        }

        const subpageResults = await withLimit(3, subpageEntries, async (entry) => {
            state.setPageStatus(entry.path, 'generating');
            const pageId = await getPageId(identifier, entry.path);
            await setPageStatus(pageId, 'generating');
            events.emit('event', { type: 'subpage_started', path: entry.path } satisfies JobEvent);

            try {
                const contentPlan = contentPlanPages.find(p => p.path === entry.path);
                const sub = await generateSubpage({
                    userPrompt,
                    theme: phaseA.theme,
                    chrome: phaseA.chrome,
                    sitemap: phaseA.sitemap,
                    pageBrief: entry,
                    contentPlan,
                });
                await replacePageBlocks(identifier, entry.path, sub.blocks);
                await setPageStatus(pageId, 'ready');
                state.setPageStatus(entry.path, 'ready');
                events.emit('event', { type: 'subpage_done', path: entry.path } satisfies JobEvent);
            } catch (error) {
                await setPageStatus(pageId, 'failed');
                state.setPageStatus(entry.path, 'failed');
                events.emit('event', {
                    type: 'subpage_failed',
                    path: entry.path,
                    reason: String(error),
                } satisfies JobEvent);
                throw error; // re-throw so withLimit records it as { ok: false }
            }
        });

        const anyFailed = subpageResults.some((r) => !r.ok);
        if (anyFailed) {
            const failCount = subpageResults.filter((r) => !r.ok).length;
            events.emit('event', {
                type: 'error',
                reason: `${failCount} page(s) failed to generate — use Retry in the sidebar.`,
            } satisfies JobEvent);
        } else {
            events.emit('event', { type: 'complete' } satisfies JobEvent);
        }
    } catch (error) {
        events.emit('event', { type: 'error', reason: String(error) } satisfies JobEvent);
    }
}

// ---------------------------------------------------------------------------
// persistLandingPhase
// ---------------------------------------------------------------------------

async function persistLandingPhase(
    identifier: string,
    phase: LandingAndSitemapResult,
): Promise<void> {
    // Resolve siteId from the human-readable identifier slug
    const site = await db.query.sites.findFirst({
        where: (s, { eq: eqFn }) => eqFn(s.identifier, identifier),
        columns: { id: true },
    });
    if (!site) throw new Error(`site not found: ${identifier}`);
    const siteId = site.id;

    await db.transaction(async (tx) => {
        // Update theme + sitemap + chrome on the site row (atomic)
        await tx
            .update(schema.sites)
            .set({
                theme: phase.theme ?? null,
                sitemap: phase.sitemap,
                chrome: phase.chrome,
            })
            .where(eq(schema.sites.identifier, identifier));

        // Ensure a pages row exists for every sitemap entry
        for (const entry of phase.sitemap) {
            const status: PageStatus = entry.path === '/' ? 'ready' : 'pending';
            await insertPage(tx, siteId, entry, status);
        }

        // Write landing page blocks (transactional)
        await replacePageBlocksTx(tx, identifier, '/', phase.landingBlocks);
    });
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

function scheduleCleanup(identifier: string): void {
    setTimeout(
        () => {
            jobs.delete(identifier);
        },
        5 * 60 * 1000,
    );
}
