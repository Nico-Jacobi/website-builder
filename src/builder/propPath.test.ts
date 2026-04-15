import { describe, expect, it } from 'vitest';
import { parsePath, setNestedProp } from './propPath';

describe('parsePath', () => {
    it('splits dot notation', () => {
        expect(parsePath('heading')).toEqual(['heading']);
        expect(parsePath('content.body')).toEqual(['content', 'body']);
    });

    it('splits bracket notation into numeric indices', () => {
        expect(parsePath('cards[0]')).toEqual(['cards', 0]);
        expect(parsePath('cards[12]')).toEqual(['cards', 12]);
    });

    it('mixes dot and bracket notation', () => {
        expect(parsePath('cards[0].title')).toEqual(['cards', 0, 'title']);
        expect(parsePath('columns[1].links[0].label')).toEqual([
            'columns',
            1,
            'links',
            0,
            'label',
        ]);
    });
});

describe('setNestedProp', () => {
    it('sets a top-level key', () => {
        const input = { title: 'a', body: 'b' };
        const out = setNestedProp(input, 'title', 'z');
        expect(out).toEqual({ title: 'z', body: 'b' });
    });

    it('does not mutate the input', () => {
        const input = { cards: [{ title: 'a' }] };
        const out = setNestedProp(input, 'cards[0].title', 'z');
        expect(input).toEqual({ cards: [{ title: 'a' }] });
        expect(out).not.toBe(input);
        expect((out.cards as unknown[])[0]).not.toBe(
            (input.cards as unknown[])[0],
        );
    });

    it('updates a deeply nested value', () => {
        const input = {
            columns: [
                { links: [{ label: 'a', href: '/a' }] },
                { links: [{ label: 'b', href: '/b' }] },
            ],
        };
        const out = setNestedProp(input, 'columns[1].links[0].label', 'B!');
        expect(out).toEqual({
            columns: [
                { links: [{ label: 'a', href: '/a' }] },
                { links: [{ label: 'B!', href: '/b' }] },
            ],
        });
    });

    it('leaves sibling array entries referentially identical', () => {
        const input = {
            cards: [{ title: 'a' }, { title: 'b' }, { title: 'c' }],
        };
        const out = setNestedProp(input, 'cards[1].title', 'B');
        const outCards = out.cards as unknown[];
        const inCards = input.cards as unknown[];
        expect(outCards[0]).toBe(inCards[0]);
        expect(outCards[2]).toBe(inCards[2]);
        expect(outCards[1]).not.toBe(inCards[1]);
    });
});
