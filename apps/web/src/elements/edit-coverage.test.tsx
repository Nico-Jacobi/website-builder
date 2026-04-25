import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import type { ReactNode } from 'react';
import {
    EditModeStateContext,
    EditModeActionsContext,
    BlockIndexContext,
    AutoSaveContext,
} from '../builder/editModeStore';
import { getModule } from '../builder/registry';
import { moduleContentFields } from '@website-builder/shared';

afterEach(cleanup);

function EditModeWrapper({ children }: { children: ReactNode }) {
    return (
        <EditModeStateContext.Provider value={{ isEditMode: true }}>
            <EditModeActionsContext.Provider
                value={{
                    updateBlock: () => {},
                    setIsEditMode: () => {},
                    addItem: () => {},
                    removeItem: () => {},
                    reorderBlocks: () => {},
                    addBlock: () => {},
                    removeBlock: () => {},
                }}
            >
                <BlockIndexContext.Provider value={0}>
                    <AutoSaveContext.Provider value={null}>
                        {children}
                    </AutoSaveContext.Provider>
                </BlockIndexContext.Provider>
            </EditModeActionsContext.Provider>
        </EditModeStateContext.Provider>
    );
}

describe('Edit-Mode Text Coverage', () => {
    for (const [moduleName, fields] of Object.entries(moduleContentFields)) {
        const mod = getModule(moduleName);
        if (!mod) continue;

        // Alt-text fields are edited via the image modal, not via contentEditable
        const altTextPaths = ['alt', 'imageAlt'];
        const textFields = fields.filter(
            (f) => f.type === 'text' && !altTextPaths.includes(f.path) && !f.path.endsWith('Alt') && !f.path.endsWith('.alt'),
        );
        if (textFields.length === 0) continue;

        // Count only fields that are expected to render given the module defaults:
        // - Flat fields (no []) always render (component shows placeholders in edit mode)
        // - Array fields (containing []) render once per default item; skip if no items
        const defaults = mod.defaults as Record<string, unknown>;
        const expectedCount = textFields.reduce((acc, f) => {
            if (!f.path.includes('[]')) return acc + 1;
            // Find the top-level array name (e.g. "cards[].title" → "cards")
            const arrayName = f.path.split('[').at(0)!;
            const arr = defaults[arrayName];
            return acc + (Array.isArray(arr) && arr.length > 0 ? 1 : 0);
        }, 0);

        if (expectedCount === 0) continue;

        describe(moduleName, () => {
            it(`renders data-edit-mode="text" for ${expectedCount} visible text fields`, () => {
                const Component = mod.Component;
                const { container } = render(
                    <EditModeWrapper>
                        <Component {...mod.defaults} />
                    </EditModeWrapper>,
                );

                const editableCount = container.querySelectorAll(
                    '[data-edit-mode="text"]',
                ).length;

                expect(editableCount).toBeGreaterThanOrEqual(expectedCount);
            });
        });
    }
});

describe('Edit-Mode Image Coverage', () => {
    for (const [moduleName, fields] of Object.entries(moduleContentFields)) {
        const mod = getModule(moduleName);
        if (!mod) continue;

        // UI paths only — filter out LLM-only imageQuery paths
        const imageFields = fields.filter(
            (f) => f.type === 'image_ref' && !f.path.endsWith('Query'),
        );
        if (imageFields.length === 0) continue;

        describe(moduleName, () => {
            it(`renders .edit__image-btn for image_ref UI paths`, () => {
                const Component = mod.Component;
                const { container } = render(
                    <EditModeWrapper>
                        <Component {...mod.defaults} />
                    </EditModeWrapper>,
                );

                const imageButtons = container.querySelectorAll('.edit__image-btn');
                expect(imageButtons.length).toBeGreaterThanOrEqual(1);
            });
        });
    }
});
