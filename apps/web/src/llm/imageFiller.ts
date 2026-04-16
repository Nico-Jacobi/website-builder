import type { SiteSpec, BlockSpec } from '../builder/schemas';
import { log } from './logger';

/**
 * Post-processor for a validated SiteSpec: replaces every image-URL field
 * with a real photo from Pixabay (VITE_PIXABAY_API_KEY must be set in .env).
 *
 *   Pixabay API
 *      → actual keyword search, CORS-enabled from browser, free up to 5000 req/day
 *      → returns a different photo per slot even for identical keywords (via offset)
 *
 * All image fetches run in parallel.  Every decision is written to the
 * generation log so the BuilderPage panel shows which query drove each image.
 */

// ---------------------------------------------------------------------------
// Provider detection
// ---------------------------------------------------------------------------

function pixabayKey(): string {
    return (import.meta.env.VITE_PIXABAY_API_KEY as string | undefined) ?? '';
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ImageSlot {
    readonly imageQuery: string;
    readonly width: number;
    readonly height: number;
    readonly label: string;
    readonly apply: (url: string) => void;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function fillImages(spec: SiteSpec): Promise<SiteSpec> {
    log('step', 'Bilder für Platzhalter suchen…');

    const slots: ImageSlot[] = [];
    collectFromBlocks(spec.blocks, slots, []);

    if (slots.length === 0) {
        log('info', 'Keine Bild-Slots in der Spec — nichts zu tun');
        return spec;
    }

    const key = pixabayKey();
    if (!key) {
        log('warn', 'VITE_PIXABAY_API_KEY nicht gesetzt — Bilder werden übersprungen');
        return spec;
    }
    log('info', `${slots.length} Bild-Slot(s) gefunden — Provider: Pixabay`);

    const results = await Promise.allSettled(
        slots.map((slot) => resolveSlot(slot, key)),
    );

    results.forEach((result, idx) => {
        const slot = slots[idx];
        if (result.status === 'fulfilled') {
            slot.apply(result.value.url);
            const shortUrl = result.value.url.replace(/^https?:\/\/[^/]+/, '').slice(0, 60);
            log('ok', `  ${slot.label} → ${shortUrl}`);
        } else {
            log('warn', `  ${slot.label} → Fehler: ${String(result.reason)}`);
        }
    });

    const ok = results.filter((r) => r.status === 'fulfilled').length;
    log('ok', `${ok}/${slots.length} Bild(er) via Pixabay eingefügt`);
    return spec;
}

async function resolveSlot(
    slot: ImageSlot,
    pixabayApiKey: string,
): Promise<{ url: string; query: string }> {
    const query = slot.imageQuery || 'photography';
    const url = await fetchPixabay(query, pixabayApiKey);
    return { url, query };
}

// ---------------------------------------------------------------------------
// Collector — module-aware tree walk
// ---------------------------------------------------------------------------

function collectFromBlocks(blocks: BlockSpec[], slots: ImageSlot[], path: string[]): void {
    blocks.forEach((block, i) => {
        collectFromBlock(block, slots, [...path, `${block.type}[${i}]`]);
    });
}

function collectFromBlock(block: BlockSpec, slots: ImageSlot[], path: string[]): void {
    const props = block.props;
    const where = path.join(' > ');

    switch (block.type) {
        case 'HeroBanner': {
            slots.push({
                imageQuery: typeof props.imageQuery === 'string' ? props.imageQuery : '',
                width: 1600, height: 700,
                label: `${where}.backgroundImage`,
                apply: (url) => { props.backgroundImage = url; },
            });
            break;
        }

        case 'ImageBlock': {
            slots.push({
                imageQuery: typeof props.imageQuery === 'string' ? props.imageQuery : '',
                width: 1200, height: 480,
                label: `${where}.src`,
                apply: (url) => { props.src = url; },
            });
            break;
        }

        case 'MediaText': {
            slots.push({
                imageQuery: typeof props.imageQuery === 'string' ? props.imageQuery : '',
                width: 800, height: 600,
                label: `${where}.imageSrc`,
                apply: (url) => { props.imageSrc = url; },
            });
            break;
        }

        case 'Spotlight': {
            if (typeof props.imageQuery === 'string' && props.imageQuery !== '') {
                slots.push({
                    imageQuery: props.imageQuery,
                    width: 800, height: 900,
                    label: `${where}.image`,
                    apply: (url) => { props.image = url; },
                });
            }
            break;
        }

        case 'Gallery': {
            const images = props.images;
            if (Array.isArray(images)) {
                images.forEach((img, idx) => {
                    if (img && typeof img === 'object') {
                        const entry = img as { src: string; imageQuery?: unknown };
                        if (typeof entry.imageQuery === 'string' && entry.imageQuery !== '') {
                            slots.push({
                                imageQuery: entry.imageQuery,
                                width: 800, height: 600,
                                label: `${where}.images[${idx}].src`,
                                apply: (url) => { entry.src = url; },
                            });
                        }
                    }
                });
            }
            break;
        }

        case 'CardRow':
        case 'CardGrid': {
            const cards = props.cards;
            if (Array.isArray(cards)) {
                cards.forEach((card, idx) => {
                    if (card && typeof card === 'object') {
                        const entry = card as { imageSrc: string; imageQuery?: unknown };
                        if (typeof entry.imageQuery === 'string' && entry.imageQuery !== '') {
                            slots.push({
                                imageQuery: entry.imageQuery,
                                width: 600, height: 400,
                                label: `${where}.cards[${idx}].imageSrc`,
                                apply: (url) => { entry.imageSrc = url; },
                            });
                        }
                    }
                });
            }
            break;
        }

        case 'Container': {
            const children = props.children;
            if (Array.isArray(children)) {
                collectFromBlocks(children as BlockSpec[], slots, path);
            }
            break;
        }

        default:
            break;
    }
}

// ---------------------------------------------------------------------------
// Pixabay provider
// ---------------------------------------------------------------------------

/**
 * Calls the Pixabay API and returns a photo URL for the given query.
 *
 * Pixabay has CORS headers (Access-Control-Allow-Origin: *) specifically to
 * support browser-side API calls, so no proxy is needed.
 *
 * `slotIndex` is used as the result offset (page=1, per_page=20, picks
 * index % 20) so multiple slots with the same keyword get different photos.
 */
async function fetchPixabay(
    query: string,
    apiKey: string,
): Promise<string> {
    const params = new URLSearchParams({
        key: apiKey,
        q: query,
        image_type: 'photo',
        orientation: 'horizontal',
        safesearch: 'true',
        per_page: '3',
        page: '1',
    });
    const resp = await fetch(`https://pixabay.com/api/?${params}`);
    if (!resp.ok) throw new Error(`Pixabay ${resp.status}`);

    const data = await resp.json() as { hits?: { webformatURL: string }[] };
    const hits = data.hits ?? [];
    if (hits.length === 0) {
        throw new Error(`Pixabay: keine Ergebnisse für "${query}"`);
    }

    return hits[0].webformatURL;
}
