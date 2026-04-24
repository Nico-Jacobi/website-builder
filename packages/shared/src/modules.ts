/**
 * Legacy-Re-Export: Der alte Ort der pro-Modul `ContentField[]`-Listen.
 * Die Inhalte leben jetzt in `./modules/<Name>.ts` zusammen mit dem
 * zugehörigen Zod-Schema, Meta und Defaults. Diese Datei bleibt als
 * Pfad-Kompatibilität — Konsumenten importieren weiter aus `./modules`
 * bzw. `@website-builder/shared`.
 */
export * from './modules/index';

import { sharedModuleRegistry } from './modules/index';
import type { ContentField } from './types';

/**
 * Module type → contentFields map. Aggregiert aus der Spec-Registry.
 * Bestehender Konsument: `apps/api/src/routes/sites.ts` (Content-Patch-Endpoint).
 */
export const moduleContentFields: Readonly<Record<string, ContentField[]>> =
    Object.fromEntries(
        Object.entries(sharedModuleRegistry)
            .filter(([, s]) => s.contentFields !== undefined)
            .map(([name, s]) => [name, s.contentFields!]),
    );
