"use client";

import { toast } from "sonner";
import type { BlockConfig, ComponentContributionInput, GenericBlock } from "@vexcms/core";
import { BUILTIN_CONTRIBUTION_IDS, cloneBlockWithFreshIds, coerceBlockToDefinition } from "@vexcms/core";
import { ClipboardCopyIcon, ClipboardPasteIcon, ReplaceAllIcon } from "lucide-react";
import type { ReactHKT } from "../../adapter";
import { HeaderAction, type ActionPlacement } from "../../ui/ActionsMenu";

/**
 * Computes which block IDs should start open in the accordion. A block
 * starts closed when the field's own `admin.defaultCollapsed` is true, OR
 * when that specific block type's `admin.defaultCollapsed` is true.
 *
 * @returns The ids of blocks that should start open.
 */
export function computeDefaultOpenBlocks(props: {
  items: GenericBlock[];
  fieldDefaultCollapsed: boolean;
  blockDefMap: Map<string, BlockConfig>;
}): string[] {
  if (props.fieldDefaultCollapsed) return [];
  return props.items
    .filter((item) => !props.blockDefMap.get(item.blockType as string)?.admin?.defaultCollapsed)
    .map((item) => item.id as string);
}

/**
 * Matches clipboard blocks against the target field's block definitions by
 * `blockType`. Unknown `blockType`s are skipped; known blocks are coerced to
 * the target definition (unknown keys dropped, missing keys defaulted) and
 * get fresh ids (nested blocks too) so pasting never collides with an
 * existing item's id — including re-pasting into the field it was copied
 * from.
 *
 * @returns The accepted (coerced, re-id'd) blocks plus skip/drop counts.
 */
export function resolvePasteCandidates(props: {
  blocks: GenericBlock[];
  blockDefMap: Map<string, BlockConfig>;
}): { accepted: GenericBlock[]; skipped: number; droppedKeys: number } {
  let skipped = 0;
  let droppedKeys = 0;
  const accepted: GenericBlock[] = [];
  for (const block of props.blocks) {
    const blockDef = props.blockDefMap.get(block.blockType as string);
    if (!blockDef) {
      skipped += 1;
      continue;
    }
    const coerced = coerceBlockToDefinition({ block, blockDef });
    droppedKeys += coerced.droppedKeys.length;
    accepted.push(cloneBlockWithFreshIds({ block: coerced.block, blockDef }));
  }
  return { accepted, skipped, droppedKeys };
}

/**
 * Summarizes a paste outcome as a single toast — accepted count, plus how
 * many clipboard blocks were skipped (unsupported `blockType`) and how many
 * fields were dropped off the accepted blocks (not part of the target
 * block's definition).
 */
export function toastPasteOutcome(props: { acceptedCount: number; skipped: number; droppedKeys: number }): void {
  if (props.acceptedCount === 0) {
    toast.error("Nothing in the clipboard matches this field's block types.");
    return;
  }
  const parts = [`Pasted ${props.acceptedCount} block${props.acceptedCount === 1 ? "" : "s"}.`];
  if (props.skipped > 0) {
    parts.push(`Skipped ${props.skipped} unsupported block${props.skipped === 1 ? "" : "s"}.`);
  }
  if (props.droppedKeys > 0) {
    parts.push(`Dropped ${props.droppedKeys} field${props.droppedKeys === 1 ? "" : "s"} not in this block's definition.`);
  }
  toast(parts.join(" "));
}

/** Props passed to every `blocks.header.actions` contribution. */
export interface BlocksHeaderActionsProps {
  itemCount: number;
  canCopyAll: boolean;
  canPaste: boolean;
  canReplaceAll: boolean;
  pasteCount: number;
  singular: string;
  plural: string;
  placement: ActionPlacement;
  onCopyAll: () => void;
  onPasteAppend: () => void;
  onReplaceAllRequest: () => void;
}

/**
 * Built-in `blocks.header.actions` contributions — Copy all, Paste
 * (append), Replace all. Ported verbatim from `FormBlocks.tsx:213-250`.
 */
export const builtinHeaderActions: ComponentContributionInput<ReactHKT, BlocksHeaderActionsProps>[] = [
  {
    id: BUILTIN_CONTRIBUTION_IDS.blocksHeader.copyAll,
    component: (p) => (
      <HeaderAction
        placement={p.placement}
        icon={<ClipboardCopyIcon className="size-4" />}
        label="Copy all"
        disabled={!p.canCopyAll}
        onClick={p.onCopyAll}
      />
    ),
  },
  {
    id: BUILTIN_CONTRIBUTION_IDS.blocksHeader.pasteAppend,
    component: (p) => (
      <HeaderAction
        placement={p.placement}
        icon={<ClipboardPasteIcon className="size-4" />}
        label="Paste"
        disabled={!p.canPaste}
        onClick={p.onPasteAppend}
      />
    ),
  },
  {
    id: BUILTIN_CONTRIBUTION_IDS.blocksHeader.replaceAll,
    component: (p) => (
      <HeaderAction
        placement={p.placement}
        icon={<ReplaceAllIcon className="size-4" />}
        label="Replace all"
        disabled={!p.canReplaceAll}
        onClick={p.onReplaceAllRequest}
      />
    ),
  },
];
