/**
 * Per-module content-field declarations. This is the data the backend needs
 * to split incoming props into `struct` (stored inline per block) and
 * `content` (stored per (block, field_path) in `block_content`).
 *
 * The web-side registry imports from this file, so both client and server
 * share one source of truth.
 */
import type { ContentField } from './types';

export const HeaderContentFields: ContentField[] = [
    { path: 'title',         type: 'text' },
    { path: 'subtitle',      type: 'text' },
    { path: 'links[].label', type: 'text' },
    { path: 'links[].href',  type: 'url'  },
    { path: 'icon',          type: 'image_ref' },
];

export const HeroBannerContentFields: ContentField[] = [
    { path: 'heading',         type: 'text' },
    { path: 'subheading',      type: 'text' },
    { path: 'imageQuery',      type: 'image_ref' },
    { path: 'backgroundImage', type: 'image_ref' },
];

export const FooterContentFields: ContentField[] = [
    { path: 'tagline',                 type: 'text' },
    { path: 'copyright',               type: 'text' },
    { path: 'columns[].heading',       type: 'text' },
    { path: 'columns[].links[].label', type: 'text' },
    { path: 'columns[].links[].href',  type: 'url'  },
];

export const FooterSimpleContentFields: ContentField[] = [
    { path: 'tagline',       type: 'text' },
    { path: 'copyright',     type: 'text' },
    { path: 'links[].label', type: 'text' },
    { path: 'links[].href',  type: 'url'  },
];

export const TextBlockContentFields: ContentField[] = [
    { path: 'eyebrow', type: 'text' },
    { path: 'heading', type: 'text' },
    { path: 'body',    type: 'text' },
    { path: 'subtext', type: 'text' },
];

export const CardRowContentFields: ContentField[] = [
    { path: 'cards[].title',      type: 'text' },
    { path: 'cards[].body',       type: 'text' },
    { path: 'cards[].imageAlt',   type: 'text' },
    { path: 'cards[].imageQuery', type: 'image_ref' },
    { path: 'cards[].imageSrc',   type: 'image_ref' },
];

export const CardGridContentFields: ContentField[] = [
    { path: 'cards[].title',      type: 'text' },
    { path: 'cards[].body',       type: 'text' },
    { path: 'cards[].imageAlt',   type: 'text' },
    { path: 'cards[].imageQuery', type: 'image_ref' },
    { path: 'cards[].imageSrc',   type: 'image_ref' },
];

export const MediaTextContentFields: ContentField[] = [
    { path: 'heading',    type: 'text' },
    { path: 'body',       type: 'text' },
    { path: 'imageAlt',   type: 'text' },
    { path: 'imageQuery', type: 'image_ref' },
    { path: 'imageSrc',   type: 'image_ref' },
];

export const SpotlightContentFields: ContentField[] = [
    { path: 'eyebrow',    type: 'text' },
    { path: 'title',      type: 'text' },
    { path: 'body',       type: 'text' },
    { path: 'caption',    type: 'text' },
    { path: 'imageAlt',   type: 'text' },
    { path: 'imageQuery', type: 'image_ref' },
    { path: 'image',      type: 'image_ref' },
];

export const StatRowContentFields: ContentField[] = [
    { path: 'stats[].value', type: 'text' },
    { path: 'stats[].label', type: 'text' },
];

export const RecommendationRowContentFields: ContentField[] = [
    { path: 'heading',          type: 'text' },
    { path: 'items[].name',     type: 'text' },
    { path: 'items[].source',   type: 'text' },
    { path: 'items[].quote',    type: 'text' },
    { path: 'items[].imageAlt', type: 'text' },
    { path: 'items[].image',    type: 'image_ref' },
];

export const ImageBlockContentFields: ContentField[] = [
    { path: 'alt',        type: 'text' },
    { path: 'caption',    type: 'text' },
    { path: 'imageQuery', type: 'image_ref' },
    { path: 'src',        type: 'image_ref' },
];

export const GalleryContentFields: ContentField[] = [
    { path: 'heading',             type: 'text' },
    { path: 'subheading',          type: 'text' },
    { path: 'images[].alt',        type: 'text' },
    { path: 'images[].caption',    type: 'text' },
    { path: 'images[].imageQuery', type: 'image_ref' },
    { path: 'images[].src',        type: 'image_ref' },
];

/**
 * Module type → contentFields map. The server uses this to split/merge
 * props without needing to import every module's React component.
 * Modules not in this map are treated as "all struct, no content"
 * (e.g. Container, which only holds nested blocks).
 */
export const moduleContentFields: Readonly<Record<string, ContentField[]>> = {
    Header:             HeaderContentFields,
    HeroBanner:         HeroBannerContentFields,
    Footer:             FooterContentFields,
    FooterSimple:       FooterSimpleContentFields,
    TextBlock:          TextBlockContentFields,
    CardRow:            CardRowContentFields,
    CardGrid:           CardGridContentFields,
    MediaText:          MediaTextContentFields,
    Spotlight:          SpotlightContentFields,
    StatRow:            StatRowContentFields,
    RecommendationRow:  RecommendationRowContentFields,
    ImageBlock:         ImageBlockContentFields,
    Gallery:            GalleryContentFields,
};
