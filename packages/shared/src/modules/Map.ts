import { z } from 'zod';
import type { ModuleMeta, ContentField } from '../types';
import type { ModuleSpec } from './index';

export const MapPropsSchema = z.object({
    /**
     * Plain-text search term used to look up the location on the map.
     * Examples: "Berlin, Germany", "Eiffel Tower, Paris", "1600 Pennsylvania Ave, Washington DC".
     * Keep it specific enough that the first Google Maps result is correct.
     */
    location: z.string(),
    /** Optional heading displayed above the map. */
    heading: z.string().optional(),
    /** Map height preset. */
    height: z.enum(['sm', 'md', 'lg']).optional().default('md'),
});

export type MapProps = z.infer<typeof MapPropsSchema>;

export const MapDefaults: MapProps = {
    location: 'Berlin, Germany',
    heading: undefined,
    height: 'md',
};

export const MapMeta: ModuleMeta = {
    name: 'Map',
    category: 'content',
    description:
        'Embeds an interactive Google Maps view centred on a location. ' +
        'Provide a plain-text search term such as a city name, address, or landmark — ' +
        'no coordinates or API key required.',
    icon: 'MapPin',
    tags: ['map', 'location', 'address', 'google maps', 'directions'],
};

export const MapContentFields: ContentField[] = [
    { path: 'heading',  type: 'text' },
    { path: 'location', type: 'text' },
];

export const MapModuleSpec: ModuleSpec<MapProps> = {
    meta:          MapMeta,
    propsSchema:   MapPropsSchema,
    defaults:      MapDefaults,
    contentFields: MapContentFields,
};
