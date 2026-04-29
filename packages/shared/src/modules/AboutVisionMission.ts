import { z } from 'zod';
import type { ModuleMeta, ContentField } from '../types';
import type { ModuleSpec } from './index';

const StatementSchema = z.object({
    label: z.string(),
    body:  z.string(),
});

export const AboutVisionMissionPropsSchema = z.object({
    heading:           z.string().optional(),
    vision:            StatementSchema,
    mission:           StatementSchema,
    founderPhotoQuery: z.string().optional(),
    founderPhotoSrc:   z.string().optional(),
    founderPhotoAlt:   z.string().optional(),
    founderName:       z.string().optional(),
    founderRole:       z.string().optional(),
});

export type AboutVisionMissionProps = z.infer<typeof AboutVisionMissionPropsSchema>;

export const AboutVisionMissionDefaults: AboutVisionMissionProps = {
    heading: 'About us',
    vision: {
        label: 'Our vision',
        body:  'A world where teams of any size can ship beautiful software without compromise — where the tools fade into the background and the work shines.',
    },
    mission: {
        label: 'Our mission',
        body:  'Build the most thoughtful, opinionated, and joyful tools in our category. Earn trust through craft and stay close to the customers who trust us.',
    },
    founderName: 'Ada Lovelace',
    founderRole: 'Founder & CEO',
};

export const AboutVisionMissionMeta: ModuleMeta = {
    name:        'AboutVisionMission',
    category:    'content',
    description: 'A two-column block presenting company vision and mission, with optional founder card below.',
    icon:        'Target',
    tags:        ['about', 'vision', 'mission', 'company'],
};

export const AboutVisionMissionContentFields: ContentField[] = [
    { path: 'heading',           type: 'text' },
    { path: 'vision.label',      type: 'text' },
    { path: 'vision.body',       type: 'rich_text' },
    { path: 'mission.label',     type: 'text' },
    { path: 'mission.body',      type: 'rich_text' },
    { path: 'founderName',       type: 'text' },
    { path: 'founderRole',       type: 'text' },
    { path: 'founderPhotoAlt',   type: 'text' },
    { path: 'founderPhotoQuery', type: 'image_ref' },
    { path: 'founderPhotoSrc',   type: 'image_ref' },
];

export const AboutVisionMissionModuleSpec: ModuleSpec<AboutVisionMissionProps> = {
    meta:          AboutVisionMissionMeta,
    propsSchema:   AboutVisionMissionPropsSchema,
    defaults:      AboutVisionMissionDefaults,
    contentFields: AboutVisionMissionContentFields,
};
