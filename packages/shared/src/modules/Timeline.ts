import { z } from 'zod';
import type { ModuleMeta, ContentField } from '../types';
import type { ModuleSpec } from './index';

export const TimelineEntrySchema = z.object({
    date:  z.string(),
    title: z.string(),
    body:  z.string().optional(),
    icon:  z.string().optional(),
});
export type TimelineEntry = z.infer<typeof TimelineEntrySchema>;

export const TimelinePropsSchema = z.object({
    heading:    z.string().optional(),
    subheading: z.string().optional(),
    entries:    z.array(TimelineEntrySchema).min(1),
});

export type TimelineProps = z.infer<typeof TimelinePropsSchema>;

export const TimelineDefaults: TimelineProps = {
    heading:    'Our journey',
    subheading: 'A few of the milestones along the way.',
    entries: [
        { date: '2022',     title: 'Founded',          body: 'Two cofounders, one rented coworking desk, and a stubborn idea.' },
        { date: '2023',     title: 'First 100 users',  body: 'Launched in private beta and saw the first wave of customer love.' },
        { date: '2024',     title: 'Series A',         body: 'Raised funding to grow the team and accelerate the roadmap.' },
        { date: 'Today',    title: 'Trusted by 10k+',  body: 'Helping teams of every size ship with confidence.' },
    ],
};

export const TimelineMeta: ModuleMeta = {
    name:        'Timeline',
    category:    'content',
    description: 'A vertical timeline of dated milestones with rail and dots. Useful for company history, roadmaps, and changelogs.',
    icon:        'GitCommitHorizontal',
    tags:        ['timeline', 'history', 'milestones', 'roadmap'],
};

export const TimelineContentFields: ContentField[] = [
    { path: 'heading',          type: 'text' },
    { path: 'subheading',       type: 'text' },
    { path: 'entries[].date',   type: 'text' },
    { path: 'entries[].title',  type: 'text' },
    { path: 'entries[].body',   type: 'rich_text' },
];

export const TimelineModuleSpec: ModuleSpec<TimelineProps> = {
    meta:          TimelineMeta,
    propsSchema:   TimelinePropsSchema,
    defaults:      TimelineDefaults,
    contentFields: TimelineContentFields,
};
