import type { SiteSpec, BlockSpec } from '@website-builder/shared';
import type { LogCollector } from './logCollector';
import { fetchPixabayImage } from '../images/pixabay';

/**
 * Post-Processor for a validated SiteSpec: fills every image URL slot with
 * a real photo from Pixabay (PIXABAY_API_KEY must be set in the API env).
 *
 * All image fetches run in parallel. The module-aware tree walk handles
 * nested Container children.
 */

interface ImageSlot {
    readonly imageQuery: string;
    readonly width: number;
    readonly height: number;
    readonly label: string;
    readonly apply: (url: string) => void;
}

export async function fillImages(spec: SiteSpec, collector: LogCollector): Promise<SiteSpec> {
    collector.log('step', 'Bilder für Platzhalter suchen…');

    const slots: ImageSlot[] = [];
    collectFromBlocks(spec.blocks, slots, []);

    if (slots.length === 0) {
        collector.log('info', 'Keine Bild-Slots in der Spec — nichts zu tun');
        return spec;
    }

    const key = process.env.PIXABAY_API_KEY;
    if (!key || key.trim() === '') {
        collector.log('warn', 'PIXABAY_API_KEY nicht gesetzt — Bilder werden übersprungen');
        return spec;
    }
    collector.log('info', `${slots.length} Bild-Slot(s) gefunden — Provider: Pixabay`);

    const results = await Promise.allSettled(
        slots.map((slot) => resolveSlot(slot)),
    );

    results.forEach((result, idx) => {
        const slot = slots[idx];
        if (result.status === 'fulfilled') {
            slot.apply(result.value.url);
            const shortUrl = result.value.url.replace(/^https?:\/\/[^/]+/, '').slice(0, 60);
            collector.log('ok', `  ${slot.label} → ${shortUrl}`);
        } else {
            collector.log('warn', `  ${slot.label} → Fehler: ${String(result.reason)}`);
        }
    });

    const ok = results.filter((r) => r.status === 'fulfilled').length;
    collector.log('ok', `${ok}/${slots.length} Bild(er) via Pixabay eingefügt`);
    return spec;
}

async function resolveSlot(slot: ImageSlot): Promise<{ url: string; query: string }> {
    const query = slot.imageQuery || 'photography';
    const url = await fetchPixabayImage(query);
    return { url, query };
}

function hasUrl(value: unknown): boolean {
    return typeof value === 'string' && value.trim() !== '';
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
            if (!hasUrl(props.backgroundImage)) {
                slots.push({
                    imageQuery: typeof props.imageQuery === 'string' ? props.imageQuery : '',
                    width: 1600, height: 700,
                    label: `${where}.backgroundImage`,
                    apply: (url) => { props.backgroundImage = url; },
                });
            }
            break;
        }

        case 'ImageBlock': {
            if (!hasUrl(props.src)) {
                slots.push({
                    imageQuery: typeof props.imageQuery === 'string' ? props.imageQuery : '',
                    width: 1200, height: 480,
                    label: `${where}.src`,
                    apply: (url) => { props.src = url; },
                });
            }
            break;
        }

        case 'MediaText': {
            if (!hasUrl(props.imageSrc)) {
                slots.push({
                    imageQuery: typeof props.imageQuery === 'string' ? props.imageQuery : '',
                    width: 800, height: 600,
                    label: `${where}.imageSrc`,
                    apply: (url) => { props.imageSrc = url; },
                });
            }
            break;
        }

        case 'Spotlight': {
            if (
                !hasUrl(props.image) &&
                typeof props.imageQuery === 'string' &&
                props.imageQuery !== ''
            ) {
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
                        if (
                            !hasUrl(entry.src) &&
                            typeof entry.imageQuery === 'string' &&
                            entry.imageQuery !== ''
                        ) {
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
                        if (
                            !hasUrl(entry.imageSrc) &&
                            typeof entry.imageQuery === 'string' &&
                            entry.imageQuery !== ''
                        ) {
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
