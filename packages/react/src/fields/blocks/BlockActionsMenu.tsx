"use client";

import { ClipboardCopyIcon, CopyIcon, ArrowUpToLineIcon, ArrowDownToLineIcon, ArrowUpIcon, ArrowDownIcon, TrashIcon, ClipboardPasteIcon } from "lucide-react";
import type { ComponentContributionInput } from "@vexcms/core";
import { BUILTIN_CONTRIBUTION_IDS, SLOT_IDS } from "@vexcms/core";
import type { ReactHKT } from "../../adapter";
import { DropdownMenuItem } from "../../ui/dropdown-menu";
import { ActionsMenu, SurfacedAction, type ActionPlacement } from "../../ui/ActionsMenu";
import { SlotOutlet } from "../../slots/SlotOutlet";
import { useContext } from "react";
import { VexConfigContext } from "../../config";
import { useCompactForm } from "../../forms/FormCompactContext";

/**
 * Props for the `BlockActionsMenu` component.
 *
 * @see {@link BlockActionsMenu}
 */
export interface BlockActionsMenuProps {
  index: number;
  count: number;
  readOnly: boolean;
  canAdd: boolean;
  blockLabel: string;
  onDuplicate: () => void;
  onInsertAbove: () => void;
  onInsertBelow: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  /** Copies this single block to the block clipboard. Never gated on `readOnly` — copying does not mutate the field. */
  onCopy: () => void;
  /** Pastes the current block clipboard contents above this block. */
  onPasteAbove: () => void;
  /** Pastes the current block clipboard contents below this block. */
  onPasteBelow: () => void;
  /** Whether the clipboard has at least one block this field accepts and pasting it would not exceed `max`. */
  canPaste: boolean;
}

/** Props every `blocks.item.actions` contribution receives. */
export interface BlockItemActionProps extends BlockActionsMenuProps {
  /** The surface this render is for — the slot renders once per surface. */
  placement: ActionPlacement;
}

/**
 * Built-in `blocks.item.actions` contributions, in menu order — copy,
 * duplicate, move up/down, insert above/below, paste above/below, remove.
 * Duplicate, move up/down and remove render as header icons while the form
 * column is wide and as menu items while it is compact; copy, insert and
 * paste live in the menu only. Built once (not
 * per-render) as a module-level array keyed by the handlers each
 * contribution's component reads straight off its received props. `onCopy`
 * is never gated on `readOnly` — copying does not mutate the field, so it
 * must stay reachable even on a read-only document (the trigger itself is
 * never disabled).
 */
export const builtinItemActions: ComponentContributionInput<ReactHKT, BlockItemActionProps>[] = [
  {
    id: BUILTIN_CONTRIBUTION_IDS.block.duplicate,
    component: (p) => (
      <SurfacedAction
        placement={p.placement}
        icon={<CopyIcon className="size-4" />}
        label="Duplicate"
        ariaLabel={`Duplicate block ${p.index + 1}`}
        disabled={p.readOnly || !p.canAdd}
        onClick={p.onDuplicate}
      />
    ),
  },
  {
    id: BUILTIN_CONTRIBUTION_IDS.block.moveUp,
    component: (p) => (
      <SurfacedAction
        placement={p.placement}
        icon={<ArrowUpIcon className="size-4" />}
        label="Move up"
        ariaLabel={`Move block ${p.index + 1} up`}
        disabled={p.readOnly || p.index === 0}
        onClick={p.onMoveUp}
      />
    ),
  },
  {
    id: BUILTIN_CONTRIBUTION_IDS.block.moveDown,
    component: (p) => (
      <SurfacedAction
        placement={p.placement}
        icon={<ArrowDownIcon className="size-4" />}
        label="Move down"
        ariaLabel={`Move block ${p.index + 1} down`}
        disabled={p.readOnly || p.index === p.count - 1}
        onClick={p.onMoveDown}
      />
    ),
  },
  {
    id: BUILTIN_CONTRIBUTION_IDS.block.insertAbove,
    component: (p) =>
      p.placement === "menu" ? (
        <DropdownMenuItem disabled={p.readOnly || !p.canAdd} onClick={p.onInsertAbove}>
          <ArrowUpToLineIcon className="size-4" />
          Insert above
        </DropdownMenuItem>
      ) : null,
  },
  {
    id: BUILTIN_CONTRIBUTION_IDS.block.insertBelow,
    component: (p) =>
      p.placement === "menu" ? (
        <DropdownMenuItem disabled={p.readOnly || !p.canAdd} onClick={p.onInsertBelow}>
          <ArrowDownToLineIcon className="size-4" />
          Insert below
        </DropdownMenuItem>
      ) : null,
  },
  {
    id: BUILTIN_CONTRIBUTION_IDS.block.copy,
    component: (p) =>
      p.placement === "menu" ? (
        <DropdownMenuItem onClick={p.onCopy}>
          <ClipboardCopyIcon className="size-4" />
          Copy
        </DropdownMenuItem>
      ) : null,
  },
  {
    id: BUILTIN_CONTRIBUTION_IDS.block.pasteAbove,
    component: (p) =>
      p.placement === "menu" ? (
        <DropdownMenuItem disabled={p.readOnly || !p.canPaste} onClick={p.onPasteAbove}>
          <ClipboardPasteIcon className="size-4" />
          Paste above
        </DropdownMenuItem>
      ) : null,
  },
  {
    id: BUILTIN_CONTRIBUTION_IDS.block.pasteBelow,
    component: (p) =>
      p.placement === "menu" ? (
        <DropdownMenuItem disabled={p.readOnly || !p.canPaste} onClick={p.onPasteBelow}>
          <ClipboardPasteIcon className="size-4" />
          Paste below
        </DropdownMenuItem>
      ) : null,
  },
  {
    id: BUILTIN_CONTRIBUTION_IDS.block.remove,
    component: (p) => (
      <SurfacedAction
        placement={p.placement}
        icon={<TrashIcon className="size-4" />}
        label="Remove"
        ariaLabel={`Remove block ${p.index + 1}`}
        disabled={p.readOnly}
        onClick={p.onRemove}
        destructive
      />
    ),
  },
];

/**
 * Built-ins that render as header icons while the form column is wide — and
 * so are left out of the ⋯ menu then, so no action shows on both surfaces.
 */
const SURFACED_BLOCK_ACTION_IDS = [
  BUILTIN_CONTRIBUTION_IDS.block.duplicate,
  BUILTIN_CONTRIBUTION_IDS.block.moveUp,
  BUILTIN_CONTRIBUTION_IDS.block.moveDown,
  BUILTIN_CONTRIBUTION_IDS.block.remove,
];

/**
 * Per-block actions. While the form column is wide (`useCompactForm()` is
 * false): duplicate, move up/down and remove as header icons, and a ⋯ menu
 * with only insert above/below, copy and paste above/below. While compact:
 * no icons, and the ⋯ menu lists every action in the order duplicate,
 * move up/down, insert above/below, copy, paste above/below, remove. An
 * action never shows on both.
 *
 * Rendered as a sibling of the block's `AccordionPrimitive.Trigger`, never
 * nested inside it (the trigger is itself a button). The menu trigger is
 * never disabled by `readOnly` — Copy must stay reachable on a read-only
 * document; individual mutating actions gate on `readOnly` themselves.
 * Both surfaces render `SLOT_IDS.blocks.itemActions` through `SlotOutlet`,
 * once per `placement`: a project's `{ id, hidden: true }` hides a built-in
 * on both, while project-added actions render in the menu only.
 *
 * @param props - Component props.
 * @returns The header action buttons (when wide) and the actions dropdown.
 */
export function BlockActionsMenu(props: BlockActionsMenuProps) {
  const { blockLabel } = props;
  // Raw, nullable context read (not `useVexConfig()`) — `BlockActionsMenu`
  // mounts in test harnesses with no `VexConfigProvider`; a missing project
  // config just means no project-level `blocks.itemActions` additions, the
  // same escape hatch `useVexAccess()` uses for RBAC.
  const config = useContext(VexConfigContext);
  // `config.admin.components.blocks.itemActions` is typed against the
  // framework-erased `ComponentHKT` on the plain core `VexClientConfig`
  // type this component receives — every component actually stored there
  // was authored through this React adapter's own field factories, so the
  // values are genuinely `ReactHKT`-shaped at runtime (same escape hatch
  // `RenderFields`' own `FieldSlotOutlet` uses for `field.beforeInput`/`afterInput`).
  const projectContributions = config?.admin.components.blocks.itemActions as unknown as
    | ComponentContributionInput<ReactHKT, BlockItemActionProps>[]
    | undefined;
  const projectHideDirectives = projectContributions?.filter(
    (contribution) => contribution.component === undefined,
  );
  const compact = useCompactForm();
  const projectHiddenIds = new Set(projectHideDirectives?.map((directive) => directive.id));
  const menuContributions: ComponentContributionInput<ReactHKT, BlockItemActionProps>[] = compact
    ? (projectContributions ?? [])
    : [
        ...(projectContributions ?? []),
        ...SURFACED_BLOCK_ACTION_IDS.filter((id) => !projectHiddenIds.has(id)).map((id) => ({
          id,
          hidden: true as const,
        })),
      ];
  const inlineProps: BlockItemActionProps = { ...props, placement: "inline" };
  const menuProps: BlockItemActionProps = { ...props, placement: "menu" };
  return (
    <>
      {!compact && (
        <SlotOutlet
          slotId={SLOT_IDS.blocks.itemActions}
          builtins={builtinItemActions}
          contributions={projectHideDirectives}
          contributedProps={inlineProps}
        />
      )}
      <ActionsMenu label={`${blockLabel} actions`}>
        <SlotOutlet
          slotId={SLOT_IDS.blocks.itemActions}
          builtins={builtinItemActions}
          contributions={menuContributions}
          contributedProps={menuProps}
        />
      </ActionsMenu>
    </>
  );
}
