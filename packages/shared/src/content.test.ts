import { describe, expect, it } from 'vitest';
import { splitProps, mergeProps } from './content';
import type { ContentField } from './types';

describe('splitProps / mergeProps', () => {
    it('extracts a top-level text field', () => {
        const fields: ContentField[] = [{ path: 'title', type: 'text' }];
        const props = { title: 'Hello', align: 'center' };

        const { struct, content } = splitProps(fields, props);

        expect(struct).toEqual({ align: 'center' });
        expect(content).toEqual([
            { path: 'title', type: 'text', value: 'Hello' },
        ]);
    });

    it('leaves struct-only props untouched when no content fields apply', () => {
        const fields: ContentField[] = [{ path: 'missingField', type: 'text' }];
        const props = { columns: 3, paddingY: 'md' };

        const { struct, content } = splitProps(fields, props);

        expect(struct).toEqual(props);
        expect(content).toEqual([]);
    });

    it('extracts fields under a single wildcard array', () => {
        const fields: ContentField[] = [
            { path: 'cards[].title', type: 'text' },
            { path: 'cards[].imageQuery', type: 'image_ref' },
        ];
        const props = {
            cards: [
                { title: 'A', imageQuery: 'cat', imageSrc: 'http://x/a.jpg' },
                { title: 'B', imageQuery: 'dog', imageSrc: 'http://x/b.jpg' },
            ],
            columns: 2,
        };

        const { struct, content } = splitProps(fields, props);

        expect(struct).toEqual({
            cards: [
                { imageSrc: 'http://x/a.jpg' },
                { imageSrc: 'http://x/b.jpg' },
            ],
            columns: 2,
        });
        expect(content).toEqual([
            { path: 'cards[0].title', type: 'text', value: 'A' },
            { path: 'cards[1].title', type: 'text', value: 'B' },
            { path: 'cards[0].imageQuery', type: 'image_ref', value: 'cat' },
            { path: 'cards[1].imageQuery', type: 'image_ref', value: 'dog' },
        ]);
    });

    it('extracts through nested wildcard arrays (columns[].links[].label)', () => {
        const fields: ContentField[] = [
            { path: 'columns[].links[].label', type: 'text' },
            { path: 'columns[].links[].href', type: 'url' },
        ];
        const props = {
            columns: [
                { heading: 'Product', links: [{ label: 'Features', href: '#f' }] },
                { heading: 'Company', links: [{ label: 'About', href: '#a' }, { label: 'Blog', href: '#b' }] },
            ],
        };

        const { struct, content } = splitProps(fields, props);

        expect(struct).toEqual({
            columns: [
                { heading: 'Product', links: [{}] },
                { heading: 'Company', links: [{}, {}] },
            ],
        });
        expect(content.map(c => c.path).sort()).toEqual([
            'columns[0].links[0].href',
            'columns[0].links[0].label',
            'columns[1].links[0].href',
            'columns[1].links[0].label',
            'columns[1].links[1].href',
            'columns[1].links[1].label',
        ]);
    });

    it('roundtrips: merge(split(props)) deep-equals original props', () => {
        const fields: ContentField[] = [
            { path: 'heading', type: 'text' },
            { path: 'subheading', type: 'text' },
            { path: 'imageQuery', type: 'image_ref' },
            { path: 'cards[].title', type: 'text' },
            { path: 'cards[].body', type: 'text' },
            { path: 'cards[].imageQuery', type: 'image_ref' },
            { path: 'columns[].heading', type: 'text' },
            { path: 'columns[].links[].label', type: 'text' },
            { path: 'columns[].links[].href', type: 'url' },
        ];
        const props = {
            heading: 'Welcome',
            subheading: 'Do things',
            imageQuery: 'landscape',
            minHeight: 480, // struct
            cards: [
                { title: 'Fast', body: 'Very.', imageQuery: 'rocket', imageSrc: 'http://x.jpg' },
                { title: 'Safe', body: 'Also.', imageQuery: 'shield', imageSrc: 'http://y.jpg' },
            ],
            columns: [
                { heading: 'Nav', links: [{ label: 'Home', href: '/' }, { label: 'Docs', href: '/d' }] },
            ],
        };

        const { struct, content } = splitProps(fields, props);
        const merged = mergeProps(struct, content);

        expect(merged).toEqual(props);
    });

    it('does not mutate the input props', () => {
        const fields: ContentField[] = [{ path: 'cards[].title', type: 'text' }];
        const props = { cards: [{ title: 'A' }, { title: 'B' }] };
        const snapshot = structuredClone(props);

        splitProps(fields, props);

        expect(props).toEqual(snapshot);
    });

    it('handles missing optional content fields gracefully', () => {
        const fields: ContentField[] = [
            { path: 'overline', type: 'text' },
            { path: 'heading', type: 'text' },
            { path: 'body', type: 'text' },
        ];
        // No overline in props
        const props = { heading: 'H', body: 'B', align: 'left' };

        const { struct, content } = splitProps(fields, props);

        expect(struct).toEqual({ align: 'left' });
        expect(content).toEqual([
            { path: 'heading', type: 'text', value: 'H' },
            { path: 'body', type: 'text', value: 'B' },
        ]);
    });
});
