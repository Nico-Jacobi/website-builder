import { z } from 'zod';
import { SiteSpecSchema } from './schemas';
import type { ModuleDefinition, ModuleLLMDescriptor, RegistryLLMSurface } from './types';

// ── Layout (5) ────────────────────────────────────────────────────────────────
import { HeaderModule      } from '../elements/layout/Header';
import { HeroBannerModule  } from '../elements/layout/HeroBanner';
import { ContainerModule   } from '../elements/layout/Container';
import { FooterModule      } from '../elements/layout/Footer';
import { FooterSimpleModule } from '../elements/layout/FooterSimple';

// ── Content (7) ───────────────────────────────────────────────────────────────
import { TextBlockModule          } from '../elements/content/TextBlock';
import { MediaTextModule          } from '../elements/content/MediaText';
import { CardRowModule            } from '../elements/content/CardRow';
import { SpotlightModule          } from '../elements/content/Spotlight';
import { RecommendationRowModule  } from '../elements/content/RecommendationRow';
import { StatRowModule            } from '../elements/content/StatRow';
import { CardGridModule           } from '../elements/content/CardGrid';

// ── Media (2) ─────────────────────────────────────────────────────────────────
import { ImageBlockModule  } from '../elements/media/ImageBlock';
import { GalleryModule     } from '../elements/media/Gallery';

/**
 * The module registry: every website part the builder knows about.
 *
 * To add a new module:
 *   1. Create src/elements/<category>/<Name>/ with Name.tsx, Name.css, Name.schema.ts, index.ts
 *      Categories: layout | content | media
 *   2. Import its <Name>Module here
 *   3. Add it to the `modules` array below — no other file needs to change
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyModule = ModuleDefinition<any>;

const modules: AnyModule[] = [
    // Layout
    HeaderModule,
    HeroBannerModule,
    ContainerModule,
    FooterModule,
    FooterSimpleModule,
    // Content
    TextBlockModule,
    MediaTextModule,
    CardRowModule,
    SpotlightModule,
    RecommendationRowModule,
    StatRowModule,
    CardGridModule,
    // Media
    ImageBlockModule,
    GalleryModule,
];

export const registry: Record<string, AnyModule> = Object.fromEntries(
    modules.map((m) => [m.meta.name, m]),
);

export function getModule(name: string): AnyModule | undefined {
    return registry[name];
}

export function listModules(): AnyModule[] {
    return modules;
}

/**
 * Projects the registry into a shape that an LLM (or any external consumer)
 * can use to produce valid SiteSpecs:
 *
 *   - One `ModuleLLMDescriptor` per registered module, each containing the
 *     module's meta fields and its propsSchema rendered as JSON Schema.
 *   - The full `SiteSpecSchema` rendered as JSON Schema, so the consumer
 *     knows the outer shape (theme + blocks array).
 *
 * This is the single place that couples "registry content" to the JSON
 * Schema surface. The LLM call layer (not part of this feature) composes
 * this into its system prompt.
 */
function stripSchema(raw: Record<string, unknown>): Record<string, unknown> {
    const { $schema, ...rest } = raw;
    void $schema;
    return rest;
}

export function getRegistryLLMSurface(): RegistryLLMSurface {
    const modules: ModuleLLMDescriptor[] = listModules().map((m) => ({
        name:        m.meta.name,
        category:    m.meta.category,
        description: m.meta.description,
        ...(m.meta.tags ? { tags: m.meta.tags } : {}),
        propsJSONSchema: stripSchema(z.toJSONSchema(m.propsSchema) as Record<string, unknown>),
    }));

    const siteSpec = z.toJSONSchema(SiteSpecSchema) as Record<string, unknown>;

    return {
        $schema: siteSpec['$schema'] as string,
        modules,
        siteSpecJSONSchema: stripSchema(siteSpec),
    };
}
