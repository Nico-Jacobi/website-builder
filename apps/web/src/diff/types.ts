/**
 * Patch-operation types for the interactive editor's diff engine.
 *
 * A `PatchOp` is the unit of change that the diff engine emits when comparing
 * two `SiteSpec`s and that plan 06 later translates into backend calls. It is
 * deliberately decoupled from the HTTP surface — the diff engine is a pure
 * module that knows nothing about routes.
 */

import type { BlockSpec } from '@website-builder/shared';

export type PatchOp =
    | {
          type: 'updateField';
          blockId: string;
          path: string;
          value: unknown;
          previousValue: unknown;
      }
    | {
          type: 'updateTone';
          blockId: string;
          tone: string | null;
          previousTone: string | null;
      }
    | {
          type: 'addBlock';
          block: BlockSpec;
          parentBlockId: string | null;
          position: number;
      }
    | { type: 'removeBlock'; blockId: string }
    | {
          type: 'moveBlock';
          blockId: string;
          newParentBlockId: string | null;
          newPosition: number;
      }
    | {
          type: 'updateTheme';
          theme: Record<string, string> | null;
          previousTheme: Record<string, string> | null;
      };

export interface RejectedOp {
    op: PatchOp;
    reason: 'inline-edit-conflict';
    blockId: string;
}

/**
 * Key used by the inline-edit tracker to mark a block (or a specific field
 * inside a block) as "the user just touched this — don't let the LLM
 * overwrite it". Conventions:
 *   - `${blockId}:${fieldPath}` — a specific leaf was edited inline
 *   - `${blockId}:__tone`       — the block's tone was changed inline
 *   - `${blockId}`              — the block is structurally protected
 */
export type InlineEditedKey = string;

export interface ConflictResult {
    apply: PatchOp[];
    rejected: RejectedOp[];
}
