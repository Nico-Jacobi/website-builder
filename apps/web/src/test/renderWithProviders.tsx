import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';
import { EditModeProvider } from '../builder/EditModeContext';
import type { SiteSpec } from '../builder/schemas';

const EMPTY_SPEC: SiteSpec = { blocks: [] };

interface ProviderOptions {
    spec?: SiteSpec;
    onSpecChange?: (spec: SiteSpec) => void;
}

/**
 * Renders a component wrapped in EditModeProvider.
 * Useful for testing modules that use edit-mode hooks.
 */
export function renderWithProviders(
    ui: ReactElement,
    {
        spec = EMPTY_SPEC,
        onSpecChange = () => {},
        ...renderOptions
    }: ProviderOptions & Omit<RenderOptions, 'wrapper'> = {},
) {
    function Wrapper({ children }: { children: React.ReactNode }) {
        return (
            <EditModeProvider spec={spec} onSpecChange={onSpecChange}>
                {children}
            </EditModeProvider>
        );
    }

    return render(ui, { wrapper: Wrapper, ...renderOptions });
}
