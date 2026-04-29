import { z } from 'zod';
import { BlockSpecSchema, SiteChromeSchema } from '../schemas';
import { SitemapSchema } from '../sitemap';

/** Output of mode 'initial': Landing-Page blocks + sitemap (+ optional theme + optional chrome). */
export const LandingOutputSchema = z.object({
    theme:        z.record(z.string(), z.string()).optional(),
    chrome:       SiteChromeSchema.optional(),
    blocks:       z.array(BlockSpecSchema),
    sitemap:      SitemapSchema,
    _explanation: z.string().optional(),
});
export type LandingOutput = z.infer<typeof LandingOutputSchema>;

/** Output of mode 'subpage': content blocks only — no theme, no chrome, no sitemap. */
export const SubpageOutputSchema = z.object({
    blocks:       z.array(BlockSpecSchema),
    _explanation: z.string().optional(),
});
export type SubpageOutput = z.infer<typeof SubpageOutputSchema>;

/** Output of mode 'refine': updated page blocks (optional theme + optional chrome). */
export const PageRefineOutputSchema = z.object({
    theme:        z.record(z.string(), z.string()).optional(),
    blocks:       z.array(BlockSpecSchema),
    chrome:       SiteChromeSchema.optional(),
    _explanation: z.string().optional(),
});
export type PageRefineOutput = z.infer<typeof PageRefineOutputSchema>;

/** Output of mode 'refine-chrome': only the chrome object. */
export const ChromeRefineOutputSchema = z.object({
    chrome:       SiteChromeSchema,
    _explanation: z.string().optional(),
});
export type ChromeRefineOutput = z.infer<typeof ChromeRefineOutputSchema>;

/** Ein Planungs-Eintrag pro Subpage, produziert von Phase A.5. */
export const ContentPlanEntrySchema = z.object({
    path:             z.string(),
    focus:            z.array(z.string()),
    avoid:            z.array(z.string()),
    suggestedModules: z.array(z.string()).optional(),
});
export type ContentPlanEntry = z.infer<typeof ContentPlanEntrySchema>;

/** Output von mode 'plan': ein ContentPlan-Eintrag pro Subpage. */
export const ContentPlanOutputSchema = z.object({
    pages:        z.array(ContentPlanEntrySchema),
    _explanation: z.string().optional(),
});
export type ContentPlanOutput = z.infer<typeof ContentPlanOutputSchema>;
export type ContentPlan = ContentPlanOutput;
