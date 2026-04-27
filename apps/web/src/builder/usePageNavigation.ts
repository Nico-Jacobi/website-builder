import { useParams, useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * Reads the optional `:pagePath` URL param (URL-encoded, no leading slash)
 * and returns the decoded path with a leading slash.
 * Falls back to '/' when no pagePath param is present.
 */
export function useActivePagePath(): string {
    const { pagePath } = useParams<{ pagePath?: string }>();
    return pagePath ? '/' + decodeURIComponent(pagePath) : '/';
}

/**
 * Returns a navigate callback that routes to the correct page path within the
 * current site. The path is encoded so '/' remains the root and '/about'
 * becomes '/editor/:id/about' (or '/site/:id/about').
 */
export function useNavigateToPage(identifier: string, mode: 'editor' | 'site') {
    const navigate = useNavigate();
    return useCallback(
        (path: string) => {
            const encoded = path === '/' ? '' : encodeURIComponent(path.slice(1));
            navigate(`/${mode}/${identifier}${encoded ? '/' + encoded : ''}`);
        },
        [navigate, identifier, mode],
    );
}
