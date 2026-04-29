/**
 * Named theme presets — each is a partial `spec.theme` payload (entries become
 * `--key: value` CSS custom properties on the renderer root). Tokens not listed
 * here keep their `:root` defaults from `apps/web/src/index.css`.
 *
 * Usage in a SiteSpec:
 *   spec.theme = themePresets.dark
 *   // or merge: spec.theme = { ...themePresets.dark, primary: '#ff00ff' }
 */
export const themePresets: Record<string, Record<string, string>> = {
    /**
     * Default light palette — present so editors / LLM can explicitly reset.
     * Values mirror the `:root` defaults in `index.css`.
     */
    light: {
        primary:          '#2D5BFF',
        secondary:        '#1A1B3A',
        accent:           '#FF6B6B',
        alt_primary:      '#14B8A6',
        alt_secondary:    '#0F766E',
        background:       '#F8FAFC',
        surface:          '#FFFFFF',
        surface_elevated: '#FFFFFF',
        text:             '#1A1B3A',
        muted_text:       '#64748B',
        inverted_text:    '#FFFFFF',
        border_subtle:    'rgba(0, 0, 0, 0.08)',
        gradient_hero:    'linear-gradient(135deg, #2D5BFF 0%, #1A1B3A 100%)',
        gradient_subtle:  'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
    },

    /**
     * Dark palette — coherent across all module tokens. The renderer applies
     * these as inline CSS vars; existing modules render correctly because
     * they all consume `var(--*)` exclusively.
     */
    dark: {
        primary:          '#5B7CFF',
        secondary:        '#E2E8F0',
        accent:           '#FF8A8A',
        alt_primary:      '#2DD4BF',
        alt_secondary:    '#14B8A6',
        background:       '#0B0D1A',
        surface:          '#13162B',
        surface_elevated: '#1A1F3A',
        text:             '#F1F5F9',
        muted_text:       '#94A3B8',
        inverted_text:    '#0B0D1A',
        border_subtle:    'rgba(255, 255, 255, 0.10)',
        gradient_hero:    'linear-gradient(135deg, #5B7CFF 0%, #1A1F3A 100%)',
        gradient_subtle:  'linear-gradient(180deg, #13162B 0%, #0B0D1A 100%)',
    },
};

export type ThemePresetName = keyof typeof themePresets;

export function getThemePreset(name: string): Record<string, string> | undefined {
    return themePresets[name];
}

export function listThemePresets(): string[] {
    return Object.keys(themePresets);
}
