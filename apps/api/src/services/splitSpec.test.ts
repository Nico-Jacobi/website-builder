import { describe, expect, it } from 'vitest';
import type { SiteSpec } from '@website-builder/shared';
import { splitSpec } from './splitSpec';

describe('splitSpec', () => {
    it('flattens a Header + TextBlock site and extracts content per block', () => {
        const spec: SiteSpec = {
            theme: { primary: '#f06' },
            blocks: [
                {
                    type: 'Header',
                    props: { title: 'Hi', subtitle: 'Sub', links: [{ label: 'Home', href: '/' }] },
                },
                {
                    type: 'TextBlock',
                    tone: 'muted',
                    props: { heading: 'H', body: 'B', align: 'center' },
                },
            ],
        };

        const result = splitSpec(spec);

        expect(result.theme).toEqual({ primary: '#f06' });
        expect(result.blocks).toHaveLength(2);

        const header = result.blocks[0]!;
        expect(header.type).toBe('Header');
        expect(header.parentTempId).toBeNull();
        expect(header.position).toBe(0);
        expect(header.structProps).toEqual({ links: [{}] }); // both label and href extracted
        expect(header.content.map((c) => c.fieldPath).sort()).toEqual([
            'links[0].href',
            'links[0].label',
            'subtitle',
            'title',
        ]);

        const text = result.blocks[1]!;
        expect(text.type).toBe('TextBlock');
        expect(text.tone).toBe('muted');
        expect(text.structProps).toEqual({ align: 'center' }); // heading/body extracted
    });

    it('flattens Container.children into sibling rows with parentTempId', () => {
        const spec: SiteSpec = {
            blocks: [
                {
                    type: 'Container',
                    props: {
                        paddingY: 'md',
                        children: [
                            { type: 'TextBlock', props: { body: 'inner' } },
                        ],
                    },
                },
            ],
        };

        const result = splitSpec(spec);

        expect(result.blocks).toHaveLength(2);
        const container = result.blocks[0]!;
        const inner = result.blocks[1]!;

        expect(container.type).toBe('Container');
        expect(container.parentTempId).toBeNull();
        expect(container.structProps).toEqual({ paddingY: 'md' });
        expect(container.structProps['children']).toBeUndefined();

        expect(inner.type).toBe('TextBlock');
        expect(inner.parentTempId).toBe(container.tempId);
        expect(inner.position).toBe(0);
    });
});
