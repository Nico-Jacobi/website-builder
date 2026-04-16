import './SectionShell.css';
import type { ReactNode } from 'react';
import type { Tone } from '../../builder/types';

interface SectionShellProps {
    tone?: Tone;
    children: ReactNode;
}

/**
 * Thin layout wrapper that applies a visual background and text color
 * based on the block's `tone` field from the SiteSpec.
 *
 * When `tone` is undefined, the shell renders as a transparent pass-through
 * with no background or color override — the module manages its own styling.
 *
 * Padding is NOT set here — each module controls its own vertical spacing
 * via its CSS (typically through the shared .section class in App.css).
 */
export function SectionShell({ tone, children }: SectionShellProps) {
    return (
        <div data-tone={tone ?? undefined}>
            {children}
        </div>
    );
}
