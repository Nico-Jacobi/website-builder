import {
    Menu, Rocket, Box, PanelBottom,
    Type, Newspaper, LayoutGrid, Rows3, Sparkles,
    Quote, BarChart3, Megaphone, Grid3x3, Building2,
    Image as ImageIcon, Images,
    Layout, FileText,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ModuleMeta } from '@website-builder/shared';

/**
 * Allow-listed Lucide icons addressable by name from `ModuleMeta.icon`.
 * Unknown names fall back via category; keeping this a closed set avoids
 * surprises when a typo creeps into module metadata.
 */
const ICONS: Record<string, LucideIcon> = {
    Menu, Rocket, Box, PanelBottom,
    Type, Newspaper, LayoutGrid, Rows3, Sparkles,
    Quote, BarChart3, Megaphone, Grid3x3, Building2,
    Image: ImageIcon, Images,
    Layout, FileText,
};

/**
 * Category-level fallback when a module doesn't declare `meta.icon`
 * (or declares an unknown value).
 */
const FALLBACK_BY_CATEGORY: Record<string, LucideIcon> = {
    layout:  Layout,
    content: FileText,
    media:   ImageIcon,
};

/**
 * Resolves a chrome icon for a module from its meta declaration.
 *
 * Resolution order:
 *   1. `meta.icon` → matching entry in the ICONS whitelist
 *   2. `meta.category` → `FALLBACK_BY_CATEGORY`
 *   3. `Box` as ultimate fallback
 *
 * Returns a LucideIcon component (not a string) so callers can render
 * it directly: `const Icon = getModuleIcon(meta); return <Icon />;`.
 */
export function getModuleIcon(meta: ModuleMeta): LucideIcon {
    if (meta.icon && ICONS[meta.icon]) return ICONS[meta.icon];
    return FALLBACK_BY_CATEGORY[meta.category] ?? Box;
}
