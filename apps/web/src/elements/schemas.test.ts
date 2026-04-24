import { describe, expect, it } from 'vitest';

// ---- All schemas + defaults from shared (source of truth) ----
import {
    LinkSchema, CardSchema,
    HeaderPropsSchema, HeaderDefaults,
    HeroBannerPropsSchema, HeroBannerDefaults,
    ContainerPropsSchema, ContainerDefaults,
    FooterPropsSchema, FooterDefaults, FooterColumnSchema,
    FooterSimplePropsSchema, FooterSimpleDefaults,
    TextBlockPropsSchema, TextBlockDefaults,
    MediaTextPropsSchema, MediaTextDefaults,
    CardRowPropsSchema, CardRowDefaults,
    CardGridPropsSchema, CardGridDefaults,
    SpotlightPropsSchema, SpotlightDefaults,
    RecommendationRowPropsSchema, RecommendationRowDefaults, RecommendationSchema,
    StatRowPropsSchema, StatRowDefaults, StatSchema,
    ImageBlockPropsSchema, ImageBlockDefaults,
    GalleryPropsSchema, GalleryDefaults, GalleryImageSchema,
} from '@website-builder/shared';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Shorthand — returns true when safeParse succeeds. */
const parses = (schema: { safeParse: (v: unknown) => { success: boolean } }, value: unknown) =>
    schema.safeParse(value).success;

/** Shorthand — returns true when safeParse fails. */
const fails = (schema: { safeParse: (v: unknown) => { success: boolean } }, value: unknown) =>
    !schema.safeParse(value).success;

// ===========================================================================
// Shared schemas
// ===========================================================================

describe('LinkSchema', () => {
    it('parses a valid link', () => {
        expect(parses(LinkSchema, { label: 'Home', href: '/home' })).toBe(true);
    });

    it('accepts empty strings (Zod default)', () => {
        expect(parses(LinkSchema, { label: '', href: '' })).toBe(true);
    });

    it('rejects missing label', () => {
        expect(fails(LinkSchema, { href: '/home' })).toBe(true);
    });

    it('rejects missing href', () => {
        expect(fails(LinkSchema, { label: 'Home' })).toBe(true);
    });

    it('rejects non-string label', () => {
        expect(fails(LinkSchema, { label: 42, href: '/' })).toBe(true);
    });

    it('rejects non-string href', () => {
        expect(fails(LinkSchema, { label: 'Home', href: true })).toBe(true);
    });

    it('strips unknown fields', () => {
        const result = LinkSchema.parse({ label: 'A', href: '/a', extra: 'gone' });
        expect(result).toEqual({ label: 'A', href: '/a' });
        expect((result as Record<string, unknown>).extra).toBeUndefined();
    });

    it('rejects null', () => {
        expect(fails(LinkSchema, null)).toBe(true);
    });
});

describe('CardSchema', () => {
    it('parses with all fields', () => {
        expect(parses(CardSchema, {
            imageSrc: 'https://img.co/1', imageAlt: 'photo', title: 'T', body: 'B',
        })).toBe(true);
    });

    it('parses with only required field (title)', () => {
        expect(parses(CardSchema, { title: 'Only title' })).toBe(true);
    });

    it('rejects missing title', () => {
        expect(fails(CardSchema, { body: 'no title' })).toBe(true);
    });

    it('rejects non-string title', () => {
        expect(fails(CardSchema, { title: 123 })).toBe(true);
    });

    it('accepts empty string title', () => {
        expect(parses(CardSchema, { title: '' })).toBe(true);
    });

    it('strips unknown fields', () => {
        const result = CardSchema.parse({ title: 'X', unknown: true });
        expect((result as Record<string, unknown>).unknown).toBeUndefined();
    });

    it('parses with imageQuery', () => {
        expect(parses(CardSchema, { title: 'T', imageQuery: 'coffee' })).toBe(true);
    });
});

// ===========================================================================
// Module schemas
// ===========================================================================

// ---------------------------------------------------------------------------
// 1. Header
// ---------------------------------------------------------------------------

describe('HeaderPropsSchema', () => {
    it('parses defaults', () => {
        expect(parses(HeaderPropsSchema, HeaderDefaults)).toBe(true);
    });

    it('parses with all fields populated', () => {
        expect(parses(HeaderPropsSchema, {
            title: 'Site', subtitle: 'Tag', icon: '/icon.svg',
            links: [{ label: 'A', href: '/a' }],
        })).toBe(true);
    });

    it('parses with only required field (title)', () => {
        expect(parses(HeaderPropsSchema, { title: 'Minimal' })).toBe(true);
    });

    it('rejects missing title', () => {
        expect(fails(HeaderPropsSchema, {})).toBe(true);
    });

    it('rejects non-string title', () => {
        expect(fails(HeaderPropsSchema, { title: 42 })).toBe(true);
    });

    it('rejects links with invalid entries', () => {
        expect(fails(HeaderPropsSchema, {
            title: 'S', links: [{ label: 'no href' }],
        })).toBe(true);
    });

    it('accepts empty links array', () => {
        expect(parses(HeaderPropsSchema, { title: 'S', links: [] })).toBe(true);
    });

    it('rejects links as non-array', () => {
        expect(fails(HeaderPropsSchema, { title: 'S', links: 'not-array' })).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// 2. HeroBanner
// ---------------------------------------------------------------------------

describe('HeroBannerPropsSchema', () => {
    it('parses defaults', () => {
        expect(parses(HeroBannerPropsSchema, HeroBannerDefaults)).toBe(true);
    });

    it('parses with all fields populated', () => {
        expect(parses(HeroBannerPropsSchema, {
            heading: 'Hi', subheading: 'Sub',
            background: '#000', minHeight: 550, backgroundImage: 'https://example.com/bg.jpg',
        })).toBe(true);
    });

    it('parses with only required field (heading)', () => {
        expect(parses(HeroBannerPropsSchema, { heading: 'Hello' })).toBe(true);
    });

    it('applies default minHeight in component when omitted', () => {
        const result = HeroBannerPropsSchema.parse({ heading: 'Hello' });
        expect(result.minHeight).toBeUndefined();
    });

    it('rejects missing heading', () => {
        expect(fails(HeroBannerPropsSchema, { minHeight: 480 })).toBe(true);
    });

    it('rejects invalid minHeight (too low)', () => {
        expect(fails(HeroBannerPropsSchema, { heading: 'H', minHeight: 100 })).toBe(true);
    });

    it('rejects invalid minHeight (too high)', () => {
        expect(fails(HeroBannerPropsSchema, { heading: 'H', minHeight: 1000 })).toBe(true);
    });

    it('accepts valid minHeight values', () => {
        expect(parses(HeroBannerPropsSchema, { heading: 'H', minHeight: 400 })).toBe(true);
        expect(parses(HeroBannerPropsSchema, { heading: 'H', minHeight: 600 })).toBe(true);
    });

    it('rejects numeric minHeight outside range', () => {
        expect(fails(HeroBannerPropsSchema, { heading: 'H', minHeight: 100 })).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// 3. Container
// ---------------------------------------------------------------------------

describe('ContainerPropsSchema', () => {
    it('parses defaults', () => {
        expect(parses(ContainerPropsSchema, ContainerDefaults)).toBe(true);
    });

    it('parses with all fields populated', () => {
        expect(parses(ContainerPropsSchema, {
            children: [{ type: 'TextBlock', props: { body: 'hi' } }],
            background: '#fff', paddingY: 'lg', maxWidth: 800,
            scrollable: true, maxHeight: 600,
        })).toBe(true);
    });

    it('rejects empty children array (min 1)', () => {
        expect(fails(ContainerPropsSchema, { children: [] })).toBe(true);
    });

    it('rejects missing children', () => {
        expect(fails(ContainerPropsSchema, {})).toBe(true);
    });

    it('rejects children as non-array', () => {
        expect(fails(ContainerPropsSchema, { children: 'oops' })).toBe(true);
    });

    it('rejects child without type', () => {
        expect(fails(ContainerPropsSchema, {
            children: [{ props: { body: 'hi' } }],
        })).toBe(true);
    });

    it('rejects child without props', () => {
        expect(fails(ContainerPropsSchema, {
            children: [{ type: 'TextBlock' }],
        })).toBe(true);
    });

    it('accepts all valid paddingY values', () => {
        for (const v of ['none', 'sm', 'md', 'lg']) {
            expect(parses(ContainerPropsSchema, {
                children: [{ type: 'X', props: {} }], paddingY: v,
            })).toBe(true);
        }
    });

    it('rejects invalid paddingY value', () => {
        expect(fails(ContainerPropsSchema, {
            children: [{ type: 'X', props: {} }], paddingY: 'xl',
        })).toBe(true);
    });

    it('rejects non-number maxWidth', () => {
        expect(fails(ContainerPropsSchema, {
            children: [{ type: 'X', props: {} }], maxWidth: '800',
        })).toBe(true);
    });

    it('rejects non-boolean scrollable', () => {
        expect(fails(ContainerPropsSchema, {
            children: [{ type: 'X', props: {} }], scrollable: 'yes',
        })).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// 4. Footer
// ---------------------------------------------------------------------------

describe('FooterPropsSchema', () => {
    it('parses defaults', () => {
        expect(parses(FooterPropsSchema, FooterDefaults)).toBe(true);
    });

    it('parses with all fields populated', () => {
        expect(parses(FooterPropsSchema, {
            tagline: 'Tag', copyright: '(c) 2026',
            columns: [{ heading: 'Col', links: [{ label: 'L', href: '/' }] }],
        })).toBe(true);
    });

    it('parses with no fields (all optional)', () => {
        expect(parses(FooterPropsSchema, {})).toBe(true);
    });

    it('rejects column with empty links array (min 1)', () => {
        expect(fails(FooterPropsSchema, {
            columns: [{ heading: 'Col', links: [] }],
        })).toBe(true);
    });

    it('rejects column with invalid link', () => {
        expect(fails(FooterPropsSchema, {
            columns: [{ links: [{ label: 'no href' }] }],
        })).toBe(true);
    });

    it('accepts column without heading', () => {
        expect(parses(FooterPropsSchema, {
            columns: [{ links: [{ label: 'L', href: '/' }] }],
        })).toBe(true);
    });

    it('accepts empty columns array', () => {
        expect(parses(FooterPropsSchema, { columns: [] })).toBe(true);
    });
});

describe('FooterColumnSchema', () => {
    it('parses valid column', () => {
        expect(parses(FooterColumnSchema, {
            heading: 'Help', links: [{ label: 'FAQ', href: '/faq' }],
        })).toBe(true);
    });

    it('rejects missing links', () => {
        expect(fails(FooterColumnSchema, { heading: 'Help' })).toBe(true);
    });

    it('rejects empty links (min 1)', () => {
        expect(fails(FooterColumnSchema, { links: [] })).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// 5. FooterSimple
// ---------------------------------------------------------------------------

describe('FooterSimplePropsSchema', () => {
    it('parses defaults', () => {
        expect(parses(FooterSimplePropsSchema, FooterSimpleDefaults)).toBe(true);
    });

    it('parses with all fields populated', () => {
        expect(parses(FooterSimplePropsSchema, {
            tagline: 'Tag', copyright: '(c)',
            links: [{ label: 'Privacy', href: '/p' }],
        })).toBe(true);
    });

    it('parses with no fields (all optional)', () => {
        expect(parses(FooterSimplePropsSchema, {})).toBe(true);
    });

    it('rejects invalid link in array', () => {
        expect(fails(FooterSimplePropsSchema, {
            links: [{ label: 'Missing href' }],
        })).toBe(true);
    });

    it('accepts empty links array', () => {
        expect(parses(FooterSimplePropsSchema, { links: [] })).toBe(true);
    });

    it('rejects non-string tagline', () => {
        expect(fails(FooterSimplePropsSchema, { tagline: 42 })).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// 6. TextBlock
// ---------------------------------------------------------------------------

describe('TextBlockPropsSchema', () => {
    it('parses defaults', () => {
        expect(parses(TextBlockPropsSchema, TextBlockDefaults)).toBe(true);
    });

    it('parses with all fields populated', () => {
        expect(parses(TextBlockPropsSchema, {
            heading: 'H', body: 'B', subtext: 'S', align: 'center',
        })).toBe(true);
    });

    it('parses with only required field (body)', () => {
        expect(parses(TextBlockPropsSchema, { body: 'text' })).toBe(true);
    });

    it('applies default align when omitted', () => {
        const result = TextBlockPropsSchema.parse({ body: 'text' });
        expect(result.align).toBe('left');
    });

    it('rejects missing body', () => {
        expect(fails(TextBlockPropsSchema, { heading: 'H' })).toBe(true);
    });

    it('rejects non-string body', () => {
        expect(fails(TextBlockPropsSchema, { body: false })).toBe(true);
    });

    it('accepts all valid align values', () => {
        for (const v of ['left', 'center', 'right']) {
            expect(parses(TextBlockPropsSchema, { body: 'B', align: v })).toBe(true);
        }
    });

    it('rejects invalid align value', () => {
        expect(fails(TextBlockPropsSchema, { body: 'B', align: 'justify' })).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// 7. MediaText
// ---------------------------------------------------------------------------

describe('MediaTextPropsSchema', () => {
    it('parses defaults', () => {
        expect(parses(MediaTextPropsSchema, MediaTextDefaults)).toBe(true);
    });

    it('parses with all fields populated', () => {
        expect(parses(MediaTextPropsSchema, {
            imageQuery: 'barista latte', imageSrc: '/img.png', imageAlt: 'alt', heading: 'H',
            body: 'B', imagePosition: 'right',
        })).toBe(true);
    });

    it('parses with only required fields', () => {
        expect(parses(MediaTextPropsSchema, {
            imageQuery: 'test photo', imageAlt: 'alt', body: 'B',
        })).toBe(true);
    });

    it('applies default imagePosition when omitted', () => {
        const result = MediaTextPropsSchema.parse({
            imageQuery: 'test photo', imageAlt: 'alt', body: 'B',
        });
        expect(result.imagePosition).toBe('left');
    });

    it('rejects missing imageQuery', () => {
        expect(fails(MediaTextPropsSchema, { imageAlt: 'alt', body: 'B' })).toBe(true);
    });

    it('rejects missing imageAlt', () => {
        expect(fails(MediaTextPropsSchema, { imageQuery: 'test photo', body: 'B' })).toBe(true);
    });

    it('rejects missing body', () => {
        expect(fails(MediaTextPropsSchema, { imageQuery: 'test photo', imageAlt: 'alt' })).toBe(true);
    });

    it('accepts both valid imagePosition values', () => {
        const base = { imageQuery: 'test photo', imageAlt: 'a', body: 'B' };
        expect(parses(MediaTextPropsSchema, { ...base, imagePosition: 'left' })).toBe(true);
        expect(parses(MediaTextPropsSchema, { ...base, imagePosition: 'right' })).toBe(true);
    });

    it('rejects invalid imagePosition', () => {
        expect(fails(MediaTextPropsSchema, {
            imageQuery: 'test photo', imageAlt: 'a', body: 'B', imagePosition: 'center',
        })).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// 8. CardRow
// ---------------------------------------------------------------------------

describe('CardRowPropsSchema', () => {
    it('parses defaults', () => {
        expect(parses(CardRowPropsSchema, CardRowDefaults)).toBe(true);
    });

    it('parses with fully populated cards', () => {
        expect(parses(CardRowPropsSchema, {
            cards: [{ title: 'T', body: 'B', imageSrc: '/i.png', imageAlt: 'A' }],
        })).toBe(true);
    });

    it('rejects empty cards array (min 1)', () => {
        expect(fails(CardRowPropsSchema, { cards: [] })).toBe(true);
    });

    it('rejects missing cards', () => {
        expect(fails(CardRowPropsSchema, {})).toBe(true);
    });

    it('rejects card without title', () => {
        expect(fails(CardRowPropsSchema, { cards: [{ body: 'B' }] })).toBe(true);
    });

    it('accepts card with only title (minimal card)', () => {
        expect(parses(CardRowPropsSchema, { cards: [{ title: 'T' }] })).toBe(true);
    });

    it('accepts multiple cards', () => {
        expect(parses(CardRowPropsSchema, {
            cards: [{ title: 'A' }, { title: 'B' }, { title: 'C' }],
        })).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// 9. CardGrid
// ---------------------------------------------------------------------------

describe('CardGridPropsSchema', () => {
    it('parses defaults', () => {
        expect(parses(CardGridPropsSchema, CardGridDefaults)).toBe(true);
    });

    it('parses with all fields populated', () => {
        expect(parses(CardGridPropsSchema, {
            cards: [{ title: 'T', body: 'B', imageSrc: '/i.png', imageAlt: 'A' }],
            columns: 2,
        })).toBe(true);
    });

    it('applies default columns when omitted', () => {
        const result = CardGridPropsSchema.parse({ cards: [{ title: 'T' }] });
        expect(result.columns).toBe(3);
    });

    it('rejects empty cards array (min 1)', () => {
        expect(fails(CardGridPropsSchema, { cards: [] })).toBe(true);
    });

    it('rejects missing cards', () => {
        expect(fails(CardGridPropsSchema, {})).toBe(true);
    });

    it('accepts columns = 2', () => {
        expect(parses(CardGridPropsSchema, { cards: [{ title: 'T' }], columns: 2 })).toBe(true);
    });

    it('accepts columns = 3', () => {
        expect(parses(CardGridPropsSchema, { cards: [{ title: 'T' }], columns: 3 })).toBe(true);
    });

    it('rejects columns = 1 (not in union)', () => {
        expect(fails(CardGridPropsSchema, { cards: [{ title: 'T' }], columns: 1 })).toBe(true);
    });

    it('rejects columns = 5 (not in union)', () => {
        expect(fails(CardGridPropsSchema, { cards: [{ title: 'T' }], columns: 5 })).toBe(true);
    });

    it('rejects columns as string', () => {
        expect(fails(CardGridPropsSchema, { cards: [{ title: 'T' }], columns: '3' })).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// 10. Spotlight
// ---------------------------------------------------------------------------

describe('SpotlightPropsSchema', () => {
    const base = {
        image: 'https://example.com/photo.jpg',
        title: 'Our founder',
        body: 'A short story.',
    };

    it('parses defaults', () => {
        expect(parses(SpotlightPropsSchema, SpotlightDefaults)).toBe(true);
    });

    it('parses with all fields populated', () => {
        expect(parses(SpotlightPropsSchema, {
            ...base,
            imageAlt: 'Portrait',
            eyebrow: 'About us',
            caption: '— Max Müller',
            imagePosition: 'right',
        })).toBe(true);
    });

    it('parses with only required fields (image, title, body)', () => {
        expect(parses(SpotlightPropsSchema, base)).toBe(true);
    });

    it('applies default imagePosition when omitted', () => {
        const result = SpotlightPropsSchema.parse(base);
        expect(result.imagePosition).toBe('left');
    });

    it('rejects missing title', () => {
        expect(fails(SpotlightPropsSchema, { image: base.image, body: 'B' })).toBe(true);
    });

    it('rejects missing body', () => {
        expect(fails(SpotlightPropsSchema, { image: base.image, title: 'T' })).toBe(true);
    });

    it('accepts both valid imagePosition values', () => {
        expect(parses(SpotlightPropsSchema, { ...base, imagePosition: 'left' })).toBe(true);
        expect(parses(SpotlightPropsSchema, { ...base, imagePosition: 'right' })).toBe(true);
    });

    it('rejects invalid imagePosition', () => {
        expect(fails(SpotlightPropsSchema, { ...base, imagePosition: 'center' })).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// 10b. RecommendationRow
// ---------------------------------------------------------------------------

describe('RecommendationSchema', () => {
    const base = { name: 'Alex', rating: 4.5, quote: 'Great.' };

    it('parses with only required fields', () => {
        expect(parses(RecommendationSchema, base)).toBe(true);
    });

    it('parses with all fields populated', () => {
        expect(parses(RecommendationSchema, {
            ...base,
            source: 'Verified customer',
            image: 'https://example.com/a.jpg',
            imageAlt: 'Portrait of Alex',
        })).toBe(true);
    });

    it('rejects missing name', () => {
        expect(fails(RecommendationSchema, { rating: 5, quote: 'Q' })).toBe(true);
    });

    it('rejects missing rating', () => {
        expect(fails(RecommendationSchema, { name: 'A', quote: 'Q' })).toBe(true);
    });

    it('rejects missing quote', () => {
        expect(fails(RecommendationSchema, { name: 'A', rating: 5 })).toBe(true);
    });

    it('rejects rating below 0', () => {
        expect(fails(RecommendationSchema, { ...base, rating: -1 })).toBe(true);
    });

    it('rejects rating above 5', () => {
        expect(fails(RecommendationSchema, { ...base, rating: 5.5 })).toBe(true);
    });

    it('accepts rating = 0 and rating = 5 (boundaries)', () => {
        expect(parses(RecommendationSchema, { ...base, rating: 0 })).toBe(true);
        expect(parses(RecommendationSchema, { ...base, rating: 5 })).toBe(true);
    });

    it('accepts half-star ratings', () => {
        expect(parses(RecommendationSchema, { ...base, rating: 3.5 })).toBe(true);
    });

    it('rejects non-number rating', () => {
        expect(fails(RecommendationSchema, { ...base, rating: '5' })).toBe(true);
    });
});

describe('RecommendationRowPropsSchema', () => {
    it('parses defaults', () => {
        expect(parses(RecommendationRowPropsSchema, RecommendationRowDefaults)).toBe(true);
    });

    it('parses with heading and items', () => {
        expect(parses(RecommendationRowPropsSchema, {
            heading: 'Reviews',
            items: [{ name: 'A', rating: 5, quote: 'Q' }],
        })).toBe(true);
    });

    it('parses without heading (optional)', () => {
        expect(parses(RecommendationRowPropsSchema, {
            items: [{ name: 'A', rating: 5, quote: 'Q' }],
        })).toBe(true);
    });

    it('rejects empty items array (min 1)', () => {
        expect(fails(RecommendationRowPropsSchema, { items: [] })).toBe(true);
    });

    it('rejects missing items', () => {
        expect(fails(RecommendationRowPropsSchema, {})).toBe(true);
    });

    it('rejects items as non-array', () => {
        expect(fails(RecommendationRowPropsSchema, { items: 'oops' })).toBe(true);
    });

    it('rejects item with invalid rating', () => {
        expect(fails(RecommendationRowPropsSchema, {
            items: [{ name: 'A', rating: 7, quote: 'Q' }],
        })).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// 11. StatRow
// ---------------------------------------------------------------------------

describe('StatSchema', () => {
    it('parses valid stat', () => {
        expect(parses(StatSchema, { value: '99%', label: 'Uptime' })).toBe(true);
    });

    it('rejects missing value', () => {
        expect(fails(StatSchema, { label: 'Uptime' })).toBe(true);
    });

    it('rejects missing label', () => {
        expect(fails(StatSchema, { value: '99%' })).toBe(true);
    });

    it('rejects non-string value', () => {
        expect(fails(StatSchema, { value: 99, label: 'Uptime' })).toBe(true);
    });

    it('rejects non-string label', () => {
        expect(fails(StatSchema, { value: '99', label: true })).toBe(true);
    });
});

describe('StatRowPropsSchema', () => {
    it('parses defaults', () => {
        expect(parses(StatRowPropsSchema, StatRowDefaults)).toBe(true);
    });

    it('parses with all fields populated', () => {
        expect(parses(StatRowPropsSchema, {
            stats: [{ value: '10k', label: 'Users' }], align: 'left',
        })).toBe(true);
    });

    it('applies default align when omitted', () => {
        const result = StatRowPropsSchema.parse({
            stats: [{ value: '1', label: 'X' }],
        });
        expect(result.align).toBe('center');
    });

    it('rejects empty stats array (min 1)', () => {
        expect(fails(StatRowPropsSchema, { stats: [] })).toBe(true);
    });

    it('rejects missing stats', () => {
        expect(fails(StatRowPropsSchema, {})).toBe(true);
    });

    it('rejects stat with missing fields', () => {
        expect(fails(StatRowPropsSchema, {
            stats: [{ value: '1' }],
        })).toBe(true);
    });

    it('accepts both valid align values', () => {
        const base = { stats: [{ value: '1', label: 'X' }] };
        expect(parses(StatRowPropsSchema, { ...base, align: 'left' })).toBe(true);
        expect(parses(StatRowPropsSchema, { ...base, align: 'center' })).toBe(true);
    });

    it('rejects invalid align value', () => {
        expect(fails(StatRowPropsSchema, {
            stats: [{ value: '1', label: 'X' }], align: 'right',
        })).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// 12. ImageBlock
// ---------------------------------------------------------------------------

describe('ImageBlockPropsSchema', () => {
    it('parses defaults', () => {
        expect(parses(ImageBlockPropsSchema, ImageBlockDefaults)).toBe(true);
    });

    it('parses with all fields populated', () => {
        expect(parses(ImageBlockPropsSchema, {
            imageQuery: 'modern office', src: '/img.png', alt: 'photo', caption: 'A photo',
            objectFit: 'contain', maxHeight: 300,
        })).toBe(true);
    });

    it('parses with only required fields (imageQuery, alt)', () => {
        expect(parses(ImageBlockPropsSchema, { imageQuery: 'test photo', alt: 'a' })).toBe(true);
    });

    it('applies default objectFit when omitted', () => {
        const result = ImageBlockPropsSchema.parse({ imageQuery: 'test photo', alt: 'a' });
        expect(result.objectFit).toBe('cover');
    });

    it('applies default maxHeight when omitted', () => {
        const result = ImageBlockPropsSchema.parse({ imageQuery: 'test photo', alt: 'a' });
        expect(result.maxHeight).toBe(480);
    });

    it('rejects missing imageQuery', () => {
        expect(fails(ImageBlockPropsSchema, { alt: 'a' })).toBe(true);
    });

    it('rejects missing alt', () => {
        expect(fails(ImageBlockPropsSchema, { imageQuery: 'test photo' })).toBe(true);
    });

    it('accepts all valid objectFit values', () => {
        for (const v of ['cover', 'contain', 'fill']) {
            expect(parses(ImageBlockPropsSchema, { imageQuery: 'test photo', alt: 'a', objectFit: v })).toBe(true);
        }
    });

    it('rejects invalid objectFit value', () => {
        expect(fails(ImageBlockPropsSchema, { imageQuery: 'test photo', alt: 'a', objectFit: 'none' })).toBe(true);
    });

    it('rejects non-number maxHeight', () => {
        expect(fails(ImageBlockPropsSchema, { imageQuery: 'test photo', alt: 'a', maxHeight: '480' })).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// 13. Gallery
// ---------------------------------------------------------------------------

const img = (n: number) => ({ imageQuery: `test photo ${n}`, src: '', alt: `Image ${n}` });

describe('GalleryImageSchema', () => {
    it('parses valid image', () => {
        expect(parses(GalleryImageSchema, { imageQuery: 'test photo', alt: 'A' })).toBe(true);
    });

    it('parses with optional caption', () => {
        expect(parses(GalleryImageSchema, { imageQuery: 'test photo', alt: 'A', caption: 'Cap' })).toBe(true);
    });

    it('rejects missing imageQuery', () => {
        expect(fails(GalleryImageSchema, { alt: 'A' })).toBe(true);
    });

    it('rejects missing alt', () => {
        expect(fails(GalleryImageSchema, { imageQuery: 'test photo' })).toBe(true);
    });

    it('rejects non-string caption', () => {
        expect(fails(GalleryImageSchema, { imageQuery: 'test photo', alt: 'A', caption: 42 })).toBe(true);
    });
});

describe('GalleryPropsSchema', () => {
    it('parses defaults', () => {
        expect(parses(GalleryPropsSchema, GalleryDefaults)).toBe(true);
    });

    it('parses with all fields populated', () => {
        expect(parses(GalleryPropsSchema, {
            images: [
                { imageQuery: 'nature one', src: '/1.png', alt: 'One', caption: 'C1' },
                { imageQuery: 'nature two', src: '/2.png', alt: 'Two', caption: 'C2' },
                { imageQuery: 'nature three', src: '/3.png', alt: 'Three' },
            ],
            columns: 3,
            gap: 'lg',
        })).toBe(true);
    });

    it('rejects fewer than 2 images (min 2)', () => {
        expect(fails(GalleryPropsSchema, { images: [img(1)] })).toBe(true);
    });

    it('rejects empty images array', () => {
        expect(fails(GalleryPropsSchema, { images: [] })).toBe(true);
    });

    it('accepts exactly 2 images (min boundary)', () => {
        expect(parses(GalleryPropsSchema, { images: [img(1), img(2)] })).toBe(true);
    });

    it('accepts exactly 4 images (max boundary)', () => {
        expect(parses(GalleryPropsSchema, {
            images: [img(1), img(2), img(3), img(4)],
        })).toBe(true);
    });

    it('rejects more than 4 images (max 4)', () => {
        expect(fails(GalleryPropsSchema, {
            images: [img(1), img(2), img(3), img(4), img(5)],
        })).toBe(true);
    });

    it('rejects missing images', () => {
        expect(fails(GalleryPropsSchema, {})).toBe(true);
    });

    it('applies default columns when omitted', () => {
        const result = GalleryPropsSchema.parse({ images: [img(1), img(2)] });
        expect(result.columns).toBe(2);
    });

    it('applies default gap when omitted', () => {
        const result = GalleryPropsSchema.parse({ images: [img(1), img(2)] });
        expect(result.gap).toBe('md');
    });

    it('accepts columns = 2', () => {
        expect(parses(GalleryPropsSchema, { images: [img(1), img(2)], columns: 2 })).toBe(true);
    });

    it('accepts columns = 3', () => {
        expect(parses(GalleryPropsSchema, { images: [img(1), img(2)], columns: 3 })).toBe(true);
    });

    it('rejects columns = 1 (not in union)', () => {
        expect(fails(GalleryPropsSchema, { images: [img(1), img(2)], columns: 1 })).toBe(true);
    });

    it('rejects columns = 4 (not in union)', () => {
        expect(fails(GalleryPropsSchema, { images: [img(1), img(2)], columns: 4 })).toBe(true);
    });

    it('accepts all valid gap values', () => {
        for (const g of ['sm', 'md', 'lg']) {
            expect(parses(GalleryPropsSchema, { images: [img(1), img(2)], gap: g })).toBe(true);
        }
    });

    it('rejects invalid gap value', () => {
        expect(fails(GalleryPropsSchema, { images: [img(1), img(2)], gap: 'xl' })).toBe(true);
    });

    it('rejects image with invalid structure inside array', () => {
        expect(fails(GalleryPropsSchema, {
            images: [img(1), { imageQuery: 'test', src: '/x.png' }],  // missing alt
        })).toBe(true);
    });
});
