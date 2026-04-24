import type { ZodType } from 'zod';
import type { ModuleMeta, ContentField } from '../types';

/**
 * React-freie Beschreibung eines Moduls. Backend + Frontend konsumieren
 * diese Struktur; Frontend komponiert sie zur Laufzeit mit einer React-
 * Komponente zu einer `ModuleDefinition`.
 */
export interface ModuleSpec<P = unknown> {
    meta:          ModuleMeta;
    propsSchema:   ZodType<P>;
    defaults:      P;
    contentFields?: ContentField[];
}

// Per-Modul-Re-Exports (Schema, Defaults, Meta, ContentFields, ModuleSpec).
export * from './Header';
export * from './HeroBanner';
export * from './Container';
export * from './Footer';
export * from './FooterSimple';
export * from './TextBlock';
export * from './MediaText';
export * from './CardRow';
export * from './CardGrid';
export * from './Spotlight';
export * from './RecommendationRow';
export * from './StatRow';
export * from './ImageBlock';
export * from './Gallery';

import { HeaderModuleSpec       } from './Header';
import { HeroBannerModuleSpec   } from './HeroBanner';
import { ContainerModuleSpec    } from './Container';
import { FooterModuleSpec       } from './Footer';
import { FooterSimpleModuleSpec } from './FooterSimple';
import { TextBlockModuleSpec    } from './TextBlock';
import { MediaTextModuleSpec    } from './MediaText';
import { CardRowModuleSpec      } from './CardRow';
import { CardGridModuleSpec     } from './CardGrid';
import { SpotlightModuleSpec    } from './Spotlight';
import { RecommendationRowModuleSpec } from './RecommendationRow';
import { StatRowModuleSpec      } from './StatRow';
import { ImageBlockModuleSpec   } from './ImageBlock';
import { GalleryModuleSpec      } from './Gallery';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const allSpecs: ModuleSpec<any>[] = [
    HeaderModuleSpec, HeroBannerModuleSpec, ContainerModuleSpec,
    FooterModuleSpec, FooterSimpleModuleSpec, TextBlockModuleSpec,
    MediaTextModuleSpec, CardRowModuleSpec, CardGridModuleSpec,
    SpotlightModuleSpec, RecommendationRowModuleSpec, StatRowModuleSpec,
    ImageBlockModuleSpec, GalleryModuleSpec,
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sharedModuleRegistry: Record<string, ModuleSpec<any>> =
    Object.fromEntries(allSpecs.map((s) => [s.meta.name, s]));

export function getSharedModule(name: string): ModuleSpec | undefined {
    return sharedModuleRegistry[name];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function listSharedModules(): ModuleSpec<any>[] {
    return allSpecs;
}
