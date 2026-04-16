import { z } from 'zod';
import type { ModuleMeta } from '../../../builder/types';

/** A single image entry in the gallery. */
export const GalleryImageSchema = z.object({
    /** Keywords describing the desired photo (e.g. "mountain landscape sunset"). Filled automatically into src — do not provide a URL. */
    imageQuery: z.string(),
    /** Populated automatically from imageQuery — leave empty. */
    src:        z.string().default(''),
    /** Descriptive alt text for screen-reader accessibility. */
    alt:        z.string(),
    /** Optional caption rendered below the image in a figcaption. */
    caption:    z.string().optional(),
});
export type GalleryImage = z.infer<typeof GalleryImageSchema>;

export const GalleryPropsSchema = z.object({
    /**
     * Optional heading displayed above the gallery grid.
     */
    heading: z.string().optional(),

    /**
     * Optional smaller subheading below the heading (e.g. descriptive text).
     */
    subheading: z.string().optional(),

    /**
     * Images to display in the gallery grid.
     * Must contain at least 2 and at most 4 items.
     */
    images: z.array(GalleryImageSchema).min(2).max(4),

    /**
     * Number of grid columns on desktop (> 640 px).
     * Drives data-columns attribute → CSS custom property --gallery-cols.
     * Always 1 column on mobile. Defaults to 2.
     */
    columns: z.union([z.literal(2), z.literal(3)]).default(2),

    /**
     * Gap between grid cells.
     * Drives data-gap attribute → CSS custom property --gallery-gap.
     * Accepts 'sm', 'md', or 'lg'. Defaults to 'md'.
     */
    gap: z.enum(['sm', 'md', 'lg']).default('md'),
}).refine(
    (v) => v.images.length % v.columns === 0,
    {
        message: 'Anzahl der Bilder muss ein Vielfaches der Spalten sein',
    },
);

export type GalleryProps = z.infer<typeof GalleryPropsSchema>;

export const GalleryDefaults: GalleryProps = {
    images: [
        { imageQuery: 'gallery image one', src: '', alt: 'Gallery image one', caption: 'Caption for image one' },
        { imageQuery: 'gallery image two', src: '', alt: 'Gallery image two', caption: 'Caption for image two' },
    ],
    columns: 2,
    gap: 'md',
};

export const GalleryMeta: ModuleMeta = {
    name: 'Gallery',
    category: 'media',
    description: 'Responsive CSS-grid photo gallery of 2–4 images with configurable columns and gap. Use for portfolios, showcases, or photo collections.',
    tags: ['gallery', 'grid', 'images', 'photos', 'media', 'caption'],
};
