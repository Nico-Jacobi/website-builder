import { z } from 'zod';
import type { ModuleMeta, ContentField } from '../types';
import type { ModuleSpec } from './index';

export const ContactPropsSchema = z.object({
    heading:        z.string().default('Get in touch'),
    body:           z.string().optional(),
    nameLabel:      z.string().default('Name'),
    emailLabel:     z.string().default('Email'),
    messageLabel:   z.string().default('Message'),
    buttonLabel:    z.string().default('Send message'),
    successMessage: z.string().default("Thanks! We'll be in touch soon."),
    submitUrl:      z.string().optional(),
});

export type ContactProps = z.infer<typeof ContactPropsSchema>;

export const ContactDefaults: ContactProps = {
    heading:        'Get in touch',
    body:           "Have a question or want to work together? Drop us a line and we'll get back to you within one business day.",
    nameLabel:      'Name',
    emailLabel:     'Email',
    messageLabel:   'Message',
    buttonLabel:    'Send message',
    successMessage: "Thanks! We'll be in touch soon.",
};

export const ContactMeta: ModuleMeta = {
    name:        'Contact',
    category:    'content',
    description: 'A contact form with name, email, and message fields. Submissions are stored and can be reviewed in the admin portal.',
    icon:        'MessageSquare',
    tags:        ['contact', 'form', 'message', 'email', 'inquiry'],
};

export const ContactContentFields: ContentField[] = [
    { path: 'heading',        type: 'text' },
    { path: 'body',           type: 'rich_text' },
    { path: 'nameLabel',      type: 'text' },
    { path: 'emailLabel',     type: 'text' },
    { path: 'messageLabel',   type: 'text' },
    { path: 'buttonLabel',    type: 'text' },
    { path: 'successMessage', type: 'text' },
];

export const ContactModuleSpec: ModuleSpec<ContactProps> = {
    meta:          ContactMeta,
    propsSchema:   ContactPropsSchema,
    defaults:      ContactDefaults,
    contentFields: ContactContentFields,
};
