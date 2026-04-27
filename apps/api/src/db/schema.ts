import { sql } from 'drizzle-orm';
import {
    type AnyPgColumn,
    boolean,
    index,
    integer,
    jsonb,
    pgTable,
    primaryKey,
    text,
    timestamp,
    uniqueIndex,
    uuid,
} from 'drizzle-orm/pg-core';
import type { BlockSpec } from '@website-builder/shared';

// --- Phase 1: multi-site content storage -----------------------------------

export const sites = pgTable('sites', {
    id:            uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    identifier:    text('identifier').notNull().unique(),
    name:          text('name').notNull(),
    /** CSS-variable overrides applied at :root (SiteSpec.theme). */
    theme:         jsonb('theme').$type<Record<string, string> | null>(),
    /** Beim Create gesetzt, NULL nach erster Generation (Auto-Clear in addBlock). */
    initialPrompt: text('initial_prompt'),
    /** Site-wide chrome: shared Header and Footer blocks (null until first generation). */
    chrome:        jsonb('chrome').$type<{ header?: BlockSpec; footer?: BlockSpec } | null>(),
    /** Ordered sitemap entries generated alongside the landing page. */
    sitemap:       jsonb('sitemap').$type<Array<{ path: string; title: string; intent: string }> | null>(),
    createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const pages = pgTable(
    'pages',
    {
        id:        uuid('id').primaryKey().default(sql`gen_random_uuid()`),
        siteId:    uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
        path:      text('path').notNull(), // "/", "/about"
        metaDesc:  text('meta_desc'),
        published: boolean('published').notNull().default(false),
        /** Generation status: 'pending' | 'generating' | 'ready' | 'failed' */
        status:    text('status').notNull().default('pending'),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => ({
        sitePathIdx: uniqueIndex('pages_site_path_unique').on(t.siteId, t.path),
    }),
);

/**
 * One block = one rendered module instance.
 * `structProps` holds only layout/variant fields; editable content lives in
 * `blockContent`. `parentBlockId` is set for nested blocks (Container.children).
 */
export const pageBlocks = pgTable('page_blocks', {
    id:             uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    pageId:         uuid('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
    parentBlockId:  uuid('parent_block_id').references((): AnyPgColumn => pageBlocks.id, { onDelete: 'cascade' }),
    slot:           text('slot'), // reserved for future multi-slot modules
    position:       integer('position').notNull(),
    type:           text('type').notNull(), // must exist in the client's module registry
    tone:           text('tone'), // BlockSpec.tone
    structProps:    jsonb('struct_props').notNull().$type<Record<string, unknown>>(),
});

export const assets = pgTable('assets', {
    id:         uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    siteId:     uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
    storageKey: text('storage_key').notNull(), // URL, S3 key, or local path
    mime:       text('mime').notNull(),
    width:      integer('width'),
    height:     integer('height'),
    source:     text('source').notNull(), // 'upload' | 'pixabay' | 'ai'
    sourceMeta: jsonb('source_meta').$type<Record<string, unknown> | null>(),
    createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Per-field editable content. PK = (blockId, fieldPath).
 * For `image_ref` type, both `textValue` (the imageQuery string) and `assetId`
 * (resolved image) may be set; the renderer uses `assetId` to populate the
 * module's image-URL sibling field.
 */
export const blockContent = pgTable(
    'block_content',
    {
        blockId:   uuid('block_id').notNull().references(() => pageBlocks.id, { onDelete: 'cascade' }),
        fieldPath: text('field_path').notNull(),
        valueType: text('value_type').notNull(), // 'text' | 'rich_text' | 'url' | 'image_ref'
        textValue: text('text_value'),
        assetId:   uuid('asset_id').references(() => assets.id, { onDelete: 'set null' }),
    },
    (t) => ({
        pk: primaryKey({ columns: [t.blockId, t.fieldPath] }),
    }),
);

/**
 * Chat-Messages für den interaktiven Editor. Ein Eintrag pro User- oder
 * Assistant-Turn (oder System-Hinweis). Cascade-Delete über `site_id`.
 */
export const siteMessages = pgTable(
    'site_messages',
    {
        id:        uuid('id').primaryKey().default(sql`gen_random_uuid()`),
        siteId:    uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
        role:      text('role').notNull(), // 'user' | 'assistant' | 'system'
        content:   text('content').notNull(),
        metadata:  jsonb('metadata').$type<Record<string, unknown> | null>(),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => ({
        siteIdIdx: index('site_messages_site_id_idx').on(t.siteId, t.createdAt),
    }),
);

// --- Reserved for later phases (auth, forms) -------------------------------

export const users = pgTable('users', {
    id:           uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    email:        text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const siteMembers = pgTable(
    'site_members',
    {
        siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
        userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
        role:   text('role').notNull(), // 'admin' | 'editor'
    },
    (t) => ({
        pk: primaryKey({ columns: [t.siteId, t.userId] }),
    }),
);

export const sessions = pgTable('sessions', {
    id:        uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId:    uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});

export const formDefinitions = pgTable('form_definitions', {
    id:      uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    blockId: uuid('block_id').notNull().references(() => pageBlocks.id, { onDelete: 'cascade' }),
    schema:  jsonb('schema').notNull(),
});

export const formSubmissions = pgTable('form_submissions', {
    id:          uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    formDefId:   uuid('form_def_id').notNull().references(() => formDefinitions.id, { onDelete: 'cascade' }),
    data:        jsonb('data').notNull(),
    ip:          text('ip'),
    createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
