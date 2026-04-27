import type { SiteChrome, Link } from '@website-builder/shared';

/**
 * Returns a copy of `chrome` with all nav/footer links that point to one of
 * `removedPaths` filtered out.  Returns `undefined` when chrome is falsy.
 * The result is reference-equal to the input when nothing changed.
 */
export function cleanupSitemapLinks(
    chrome: SiteChrome | undefined | null,
    removedPaths: string[],
): SiteChrome | undefined {
    if (!chrome) return undefined;

    const filterLinks = (links?: Link[]) =>
        links?.filter((l) => !removedPaths.includes(l.href));

    const newHeader = chrome.header && {
        ...chrome.header,
        props: {
            ...chrome.header.props,
            links: filterLinks(chrome.header.props?.links as Link[] | undefined),
        },
    };

    const newFooter = chrome.footer && {
        ...chrome.footer,
        props: {
            ...chrome.footer.props,
            columns: (
                chrome.footer.props?.columns as
                    | Array<{ title?: string; links: Link[] }>
                    | undefined
            )?.map((col) => ({
                ...col,
                links: filterLinks(col.links) ?? [],
            })),
        },
    };

    return {
        header: newHeader,
        footer: newFooter,
    };
}
