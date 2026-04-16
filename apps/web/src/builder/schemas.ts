/**
 * Re-export of the shared spec schemas. The schemas themselves live in
 * `@website-builder/shared` so the API can import them without pulling in
 * React. Existing imports like `import { SiteSpecSchema } from './schemas'`
 * keep working through this barrel.
 */
export { BlockSpecSchema, SiteSpecSchema } from '@website-builder/shared';
export type { BlockSpec, SiteSpec } from '@website-builder/shared';
