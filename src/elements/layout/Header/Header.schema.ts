import { z } from 'zod';
import type { ModuleMeta } from '../../../builder/types';
import { LinkSchema } from '../../shared/schemas';

export const HeaderPropsSchema = z.object({
    title:    z.string(),
    subtitle: z.string().optional(),
    icon:     z.string().optional(),
    links:    z.array(LinkSchema).optional(),
});

export type HeaderProps = z.infer<typeof HeaderPropsSchema>;

export const HeaderDefaults: HeaderProps = {
    title: 'My Website',
    subtitle: 'A tagline',
};

export const HeaderMeta: ModuleMeta = {
    name: 'Header',
    category: 'layout',
    description: 'Page header with brand (title + optional subtitle/icon) and optional navigation links.',
    tags: ['header', 'nav', 'branding'],
};
