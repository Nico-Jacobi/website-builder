import { useCallback, type ReactNode } from 'react';
import { isInternalPath } from '@website-builder/shared';
import type { SiteSpec, Sitemap } from '@website-builder/shared';
import Renderer from './Renderer';

interface PreviewSurfaceProps {
    spec: SiteSpec;
    sitemap?: Sitemap;
    editMode: boolean;
    onNavigate?: (path: string) => void;
    children?: ReactNode;
}

/**
 * Wraps the Renderer with a click-interceptor for in-preview navigation.
 *
 * In preview mode (editMode=false): clicks on internal `<a>` tags are
 * intercepted and delegated to `onNavigate` instead of triggering a full
 * page reload. External links, mailto:, tel: etc. pass through unchanged.
 *
 * In edit mode (editMode=true): the handler does nothing — EditModeContext
 * (Plan 05) owns click handling for selection.
 */
export function PreviewSurface({
    spec,
    sitemap,
    editMode,
    onNavigate,
    children,
}: PreviewSurfaceProps) {
    const handleClick = useCallback(
        (e: React.MouseEvent) => {
            if (editMode) return;

            const anchor = (e.target as HTMLElement).closest('a');
            if (!anchor) return;
            const href = anchor.getAttribute('href');
            if (!href || !sitemap) return;
            if (!isInternalPath(href, sitemap)) return;

            e.preventDefault();
            onNavigate?.(href);
        },
        [editMode, sitemap, onNavigate],
    );

    return (
        <div
            className="preview-surface"
            data-edit-mode={editMode}
            onClick={handleClick}
        >
            <Renderer spec={spec} />
            {children}
        </div>
    );
}
