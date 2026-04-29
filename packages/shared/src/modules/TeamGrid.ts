import { z } from 'zod';
import type { ModuleMeta, ContentField } from '../types';
import type { ModuleSpec } from './index';
import { LinkSchema } from '../schemas';

export const TeamMemberSchema = z.object({
    name:       z.string(),
    role:       z.string(),
    bio:        z.string().optional(),
    photoQuery: z.string().optional(),
    photoSrc:   z.string().optional(),
    photoAlt:   z.string().optional(),
    links:      z.array(LinkSchema).optional(),
});
export type TeamMember = z.infer<typeof TeamMemberSchema>;

export const TeamGridPropsSchema = z.object({
    heading:    z.string().optional(),
    subheading: z.string().optional(),
    members:    z.array(TeamMemberSchema).min(1),
});

export type TeamGridProps = z.infer<typeof TeamGridPropsSchema>;

export const TeamGridDefaults: TeamGridProps = {
    heading:    'Meet the team',
    subheading: 'A small group of designers and engineers shipping the future.',
    members: [
        { name: 'Ada Lovelace', role: 'CEO',          photoQuery: 'professional headshot woman' },
        { name: 'Alan Turing',  role: 'CTO',          photoQuery: 'professional headshot man' },
        { name: 'Grace Hopper', role: 'Head of Eng',  photoQuery: 'professional headshot woman' },
        { name: 'Linus Torv',   role: 'Lead Designer', photoQuery: 'professional headshot man' },
    ],
};

export const TeamGridMeta: ModuleMeta = {
    name:        'TeamGrid',
    category:    'content',
    description: 'A responsive grid of team members with photo, name, role, optional bio and social links.',
    icon:        'Users',
    tags:        ['team', 'about', 'people', 'staff'],
};

export const TeamGridContentFields: ContentField[] = [];

export const TeamGridModuleSpec: ModuleSpec<TeamGridProps> = {
    meta:          TeamGridMeta,
    propsSchema:   TeamGridPropsSchema,
    defaults:      TeamGridDefaults,
    contentFields: TeamGridContentFields,
};
