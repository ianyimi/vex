"use client";

import { ComponentPropsWithRef, type ReactNode, useContext, useEffect, useRef, useState } from "react";
import {
  type BlocksField,
  type BlockConfig,
  type InputComponentProps,
  type GenericBlock,
  type ComponentContributionInput,
  BaseFieldMeta,
  buildDefaultBlock,
  cloneBlockWithFreshIds,
  coerceBlockToDefinition,
  CRUD_ACTIONS,
  PERMISSION_SCOPES,
  BUILTIN_CONTRIBUTION_IDS,
  SLOT_IDS,
} from "@vexcms/core";
import type { TypedFieldApi } from "./createFieldInput";
import { AppFormContext } from "./AppFormContext";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  ChevronsDownUpIcon,
  ChevronsUpDownIcon,
  CircleAlert,
  ClipboardCopyIcon,
  ClipboardPasteIcon,
  LayersIcon,
  ReplaceAllIcon,
  TrashIcon,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { DropdownMenuSeparator } from "../ui/dropdown-menu";
import { ActionsMenu, HeaderAction, type ActionPlacement } from "./ActionsMenu";
import { useMeasuredCompact } from "./FormCompactContext";
import { RenderFields } from "./RenderFields";
import { Icon } from "../Icon";
import { cn } from "../../styles/utils";
import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { Accordion, AccordionContent, AccordionItem, AccordionTriggerChevron } from "../ui/accordion";
import { FormError } from "./FormError";
import { Draggable, DragHandle, Droppable } from "../ui/dnd";
import { usePermission, useFieldErrorCount, useBlockClipboard, useFailedSubmitAttempt } from "../../hooks";
import { BlockActionsMenu } from "./BlockActionsMenu";
import { SlotOutlet } from "../slots/SlotOutlet";
import { VexConfigContext } from "../../context";
import { toast } from "sonner";
import type { ReactHKT } from "../../adapter";
import type { VexResourceSlug } from "@vexcms/core";

/**
 * Props for the `FormBlocks` component.
 *
 * @see {@link FormBlocks}
 */
export interface FormBlocksProps<TFieldMeta extends BaseFieldMeta = BaseFieldMeta>
  extends InputComponentProps<TFieldMeta, BlocksField<VexResourceSlug, TFieldMeta>> {
  /**
   * The TanStack Form array field API in `mode="array"`.
   *
   * `field.state.value` is the block item array. `pushValue`/`insertValue`/
   * `removeValue`/`moveValue` handle add, insert-at-index, remove, and reorder.
   */
  field: TypedFieldApi<GenericBlock[]>;
  /** Number of form submissions — passed through for validation error display. */
  submissionAttempts: number;
  /** Additional class names for the outer container. */
  className?: string;
  /** Whether the block editor modal is open (driven by URL param). */
  modalOpen: boolean;
  /** Opens the block editor modal (sets URL param). */
  openEditor: () => void;
  /** Closes the block editor modal (clears URL param). */
  closeEditor: () => void;
  /** The field's label, rendered on the header row ahead of the block count. */
  label: ReactNode;
}

/**
 * Computes which block IDs should start open in the accordion.
 *
 * A block starts closed when the field's own `admin.defaultCollapsed` is
 * true, OR when that specific block type's `admin.defaultCollapsed` is true.
 *
 * @param props - Input props.
 * @returns The block IDs that should be open by default.
 */
function computeDefaultOpenBlocks(props: {
  items: GenericBlock[];
  fieldDefaultCollapsed: boolean;
  blockDefMap: Map<string, BlockConfig>;
}): string[] {
  const { items, fieldDefaultCollapsed, blockDefMap } = props;
  if (fieldDefaultCollapsed) return [];
  return items
    .filter((item) => !blockDefMap.get(item.blockType as string)?.admin?.defaultCollapsed)
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
 * @param props - The clipboard's blocks and the target field's block
 *   definitions keyed by `blockType`.
 * @returns The accepted, paste-ready blocks plus counts for the paste's
 *   toast summary.
 */
function resolvePasteCandidates(props: {
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
 *
 * @param props - The paste outcome to summarize.
 */
function toastPasteOutcome(props: {
  acceptedCount: number;
  skipped: number;
  droppedKeys: number;
}): void {
  if (props.acceptedCount === 0) {
    toast.error("Nothing in the clipboard matches this field's block types.");
    return;
  }
  const parts = [
    `Pasted ${props.acceptedCount} block${props.acceptedCount === 1 ? "" : "s"}.`,
  ];
  if (props.skipped > 0) {
    parts.push(
      `Skipped ${props.skipped} unsupported block${props.skipped === 1 ? "" : "s"}.`,
    );
  }
  if (props.droppedKeys > 0) {
    parts.push(
      `Dropped ${props.droppedKeys} field${props.droppedKeys === 1 ? "" : "s"} not in this block's definition.`,
    );
  }
  toast(parts.join(" "));
}

/**
 * Header-row width (px) from which the blocks field's header actions render
 * inline beside its label instead of in a ⋯ menu — room for the label and
 * count plus five text buttons.
 */
const BLOCKS_HEADER_INLINE_MIN_PX = 640;

/**
 * Props passed to every `blocks.header.actions` contribution — rendered as
 * label-row buttons (before Collapse all / Expand all) while the header has
 * room, and as `DropdownMenuItem`s in the field's ⋯ menu (below Collapse all /
 * Expand all and a separator) when it does not (`placement`). Replace all only requests its confirmation dialog: the dialog
 * lives in `FormBlocks` itself, since menu content unmounts when the menu
 * closes.
 */
interface BlocksHeaderActionsProps {
  itemCount: number;
  canCopyAll: boolean;
  canPaste: boolean;
  canReplaceAll: boolean;
  pasteCount: number;
  singular: string;
  plural: string;
  /** The surface this render is for — label-row buttons or ⋯ menu items. */
  placement: ActionPlacement;
  onCopyAll: () => void;
  onPasteAppend: () => void;
  onReplaceAllRequest: () => void;
}

/**
 * Built-in `blocks.header.actions` contributions — Copy all, Paste
 * (append), Replace all. Built once (not per-render); the field's own
 * Collapse all / Expand all stay local-state-only, not contributions — they
 * have no plugin-relevant extension point.
 */
const builtinHeaderActions: ComponentContributionInput<ReactHKT, BlocksHeaderActionsProps>[] = [
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

// ---------------------------------------------------------------------------
// Block Picker Dialog
// ---------------------------------------------------------------------------

function BlockPickerDialog(props: {
  blockDefs: BlockConfig[];
  open: boolean;
  multiselect?: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (blockDef: BlockConfig) => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedBlocks, setSelectedBlocks] = useState<Set<string>>(new Set());
  const filtered = props.blockDefs.filter(
    (b) =>
      b.label?.toLowerCase().includes(search.toLowerCase()) ||
      b.blockType.toLowerCase().includes(search.toLowerCase()),
  );

  function toggleBlock(blockType: string) {
    setSelectedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(blockType)) {
        next.delete(blockType);
      } else {
        next.add(blockType);
      }
      return next;
    });
  }

  function handleAddBlocks() {
    const selectedBlockDefs = props.blockDefs.filter((b) => selectedBlocks.has(b.blockType));
    selectedBlockDefs.forEach((blockDef) => props.onSelect(blockDef));
    setSelectedBlocks(new Set());
    setSearch("");
    props.onOpenChange(false);
  }

  function handleAddBlock(blockDef: BlockConfig) {
    props.onSelect(blockDef);
    props.onOpenChange(false);
    setSearch("");
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="w-full max-w-sm p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle>Add block</DialogTitle>
          <DialogDescription>
            {props.multiselect ? "Select one or more blocks" : "Select a block"}
          </DialogDescription>
        </DialogHeader>
        <div className="px-4 pb-2">
          <Input
            iconLeft={{ name: "Search" }}
            placeholder="Search blocks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="max-h-72 overflow-y-auto px-2 pb-3">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No blocks found</p>
          ) : (
            <div className="space-y-0.5">
              {filtered.map((blockDef) => {
                const isSelected = selectedBlocks.has(blockDef.blockType);
                return (
                  <button
                    key={blockDef.blockType}
                    type="button"
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left hover:bg-muted transition-colors",
                      isSelected && "bg-muted",
                    )}
                    onClick={() => {
                      if (props.multiselect) {
                        toggleBlock(blockDef.blockType);
                      } else {
                        handleAddBlock(blockDef);
                      }
                    }}
                  >
                    {props.multiselect && (
                      <div
                        className={cn(
                          "size-4 rounded border border-input flex items-center justify-center shrink-0",
                          isSelected && "bg-primary border-primary",
                        )}
                      >
                        {isSelected && (
                          <Icon name="Check" className="size-3 text-primary-foreground" />
                        )}
                      </div>
                    )}
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-muted">
                      {blockDef.admin?.icon ? (
                        <Icon
                          name={blockDef.admin.icon as any}
                          className="size-4 text-muted-foreground"
                        />
                      ) : (
                        <LayersIcon className="size-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{blockDef.label}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {blockDef.blockType}
                        {Object.keys(blockDef.fields).length > 0 &&
                          ` · ${Object.keys(blockDef.fields).length} field${
                            Object.keys(blockDef.fields).length === 1 ? "" : "s"
                          }`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {props.multiselect && selectedBlocks.size > 0 && (
          <div className="flex items-center justify-between border-t px-4 pt-2 pb-4">
            <span className="text-sm text-muted-foreground">{selectedBlocks.size} selected</span>
            <Button onClick={handleAddBlocks} size="sm">
              Add {selectedBlocks.size} block{selectedBlocks.size === 1 ? "" : "s"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Block Accordion Item
// ---------------------------------------------------------------------------

/**
 * Renders one block's accordion item: drag handle, order number, type badge,
 * a collapsed-with-errors marker, the `blockName` input, and the per-block
 * `BlockActionsMenu`.
 *
 * Its own component — one instance per block — so `useFieldErrorCount` can
 * be called unconditionally regardless of how many sibling blocks exist (a
 * hook call inside the parent's `.map` would violate Rules of Hooks whenever
 * a block is added or removed).
 *
 * @param props - Component props.
 * @returns The block's `AccordionItem`, wrapped in a `Draggable`.
 */
function BlockAccordionItem(props: {
  name: string;
  index: number;
  count: number;
  item: GenericBlock;
  blockDef: BlockConfig;
  collection: InputComponentProps["collection"];
  readOnly: boolean;
  // Gates only the actions-menu trigger — the document's own `readOnly`,
  // NOT combined with field-update permission. `BlockActionsMenu`'s
  // individual items (not the trigger) are what gate on permission, via
  // `canAdd` below — the trigger itself must stay clickable under a lacked
  // permission so the caller can SEE which actions are disabled and why.
  menuReadOnly: boolean;
  canAdd: boolean;
  isOpen: boolean;
  onUpdateBlockName: (blockName: string) => void;
  onDuplicate: () => void;
  onInsertAbove: () => void;
  onInsertBelow: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onCopy: () => void;
  onPasteAbove: () => void;
  onPasteBelow: () => void;
  canPaste: boolean;
  onOpen: () => void;
}) {
  const itemKey = props.item.id as string;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const errorCount = useFieldErrorCount({ names: [`${props.name}[${props.index}]`] });
  const subFields = Object.entries(props.blockDef.fields);
  const failedSubmitAttempt = useFailedSubmitAttempt();
  useEffect(() => {
    if (failedSubmitAttempt > 0 && errorCount > 0) props.onOpen();
  }, [failedSubmitAttempt]);

  return (
    <Draggable id={`${props.name}-${itemKey}`} index={props.index} isDragDisabled={props.readOnly}>
      <AccordionItem
        value={itemKey}
        className={cn(
          "rounded-sm border-t border-r-2 border-l-2 border-border bg-background overflow-hidden",
          props.index === 0 && "border-t-2",
          props.index === props.count - 1 && "border-b-2",
        )}
      >
        <AccordionPrimitive.Header className="flex items-center gap-2 bg-muted/40 px-3 py-2">
          <DragHandle disabled={props.readOnly} />
          <AccordionPrimitive.Trigger
            ref={triggerRef}
            data-slot="accordion-trigger"
            className="peer/accordion-trigger flex min-w-0 flex-1 items-center gap-2 rounded-md border border-transparent outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:pointer-events-none aria-disabled:opacity-50"
          >
            <span className="w-4 shrink-0 text-center font-mono text-xs text-muted-foreground tabular-nums">
              {props.index + 1}
            </span>
            <div className="hidden shrink-0 p-0.5 @lg/form:block">
              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                {props.blockDef.blockType}
              </span>
            </div>
            {!props.isOpen && errorCount > 0 && (
              <CircleAlert className="size-3.5 shrink-0 text-destructive" />
            )}
            <div className="min-w-0 flex-1">
              <Input
                type="text"
                value={(props.item.blockName as string) ?? ""}
                onChange={(e) => props.onUpdateBlockName(e.target.value)}
                disabled={props.readOnly}
                placeholder={props.blockDef.label ?? props.blockDef.blockType}
                className="w-full truncate border-none bg-transparent p-0 text-sm font-medium outline-none placeholder:text-muted-foreground focus:ring-0 disabled:opacity-50"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </AccordionPrimitive.Trigger>
          <BlockActionsMenu
            index={props.index}
            count={props.count}
            readOnly={props.menuReadOnly}
            canAdd={props.canAdd}
            blockLabel={props.blockDef.label ?? props.blockDef.blockType}
            onDuplicate={props.onDuplicate}
            onInsertAbove={props.onInsertAbove}
            onInsertBelow={props.onInsertBelow}
            onMoveUp={props.onMoveUp}
            onMoveDown={props.onMoveDown}
            onRemove={props.onRemove}
            onCopy={props.onCopy}
            onPasteAbove={props.onPasteAbove}
            onPasteBelow={props.onPasteBelow}
            canPaste={props.canPaste}
          />
          <AccordionTriggerChevron triggerRef={triggerRef} />
        </AccordionPrimitive.Header>

        <AccordionContent className="px-3 pt-3" keepMounted={errorCount > 0}>
          <div className="flex flex-col gap-4 pt-3">
            {subFields.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                This block has no configurable fields.
              </p>
            ) : (
              <RenderFields
                fields={props.blockDef.fields}
                collection={props.collection}
                namePrefix={`${props.name}[${props.index}]`}
                readOnly={props.readOnly}
              />
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Draggable>
  );
}

// ---------------------------------------------------------------------------
// FormBlocks
// ---------------------------------------------------------------------------

/**
 * Renders a blocks field as a simple accordion list with a searchable block
 * picker, per-block duplicate/insert/move/remove actions, collapse-all/
 * expand-all controls, and an `n/max` block-count indicator.
 *
 * All blocks share a single `Accordion multiple={true}` — multiple items can
 * be open at the same time. Each block is an `AccordionItem` with its `id`
 * as the item value (stable across reorders).
 *
 * A block starts collapsed when the field's own `admin.defaultCollapsed` is
 * true, or when that block type's own `admin.defaultCollapsed` is true.
 *
 * Opening a block is NAVIGATION, not editing — the accordion trigger is
 * never disabled. Every other control (drag handle, blockName input, the
 * actions menu, Add, Collapse/Expand all) is disabled when `readOnly` OR the
 * current caller lacks update permission on `collection`.
 *
 * `blockType`, `blockName`, and `id` are never rendered as editable sub-field inputs.
 *
 * @param props - Component props.
 * @returns The accordion of blocks with a searchable block picker for adding new ones.
 * @throws {Error} When rendered outside `<AppForm>` and no form context is available.
 */
export function FormBlocks<TFieldMeta extends BaseFieldMeta = BaseFieldMeta>({
  collection,
  name,
  field,
  fieldDef,
  readOnly,
  submissionAttempts,
  className,
  modalOpen,
  openEditor,
  closeEditor,
  label,
}: FormBlocksProps<TFieldMeta> & ComponentPropsWithRef<"div">) {
  const form = useContext(AppFormContext);

  if (!form) {
    throw new Error(
      `FormBlocks "${name}" must be rendered inside <AppForm> or have a form context available.`,
    );
  }

  const items = (field.state.value ?? []) as GenericBlock[];
  const blockDefMap = new Map(fieldDef.blocks.map((b) => [b.blockType, b]));
  const { singular, plural } = fieldDef.labels;
  const maxValue = fieldDef.max?.[0];
  const atMax = maxValue !== undefined && items.length >= maxValue;

  const canEdit = usePermission({
    resource: collection.slug,
    action: CRUD_ACTIONS.update,
    scope: PERMISSION_SCOPES.any,
  });
  const effectiveReadOnly = readOnly || !canEdit;

  const { clipboard, copyBlocks } = useBlockClipboard();
  const [replaceAllOpen, setReplaceAllOpen] = useState(false);
  const pasteCandidates = resolvePasteCandidates({
    blocks: clipboard?.blocks ?? [],
    blockDefMap,
  });
  const pasteWouldExceedMax =
    maxValue !== undefined &&
    items.length + pasteCandidates.accepted.length > maxValue;
  const replaceWouldExceedMax =
    maxValue !== undefined && pasteCandidates.accepted.length > maxValue;
  const canPaste =
    !effectiveReadOnly &&
    pasteCandidates.accepted.length > 0 &&
    !pasteWouldExceedMax;
  const canReplaceAll =
    !effectiveReadOnly &&
    pasteCandidates.accepted.length > 0 &&
    !replaceWouldExceedMax;
  // Raw, nullable context read (not `useVexConfig()`) — `FormBlocks` mounts
  // in test harnesses with no `VexConfigProvider`; a missing project config
  // just means no project-level `blocks.headerActions` additions, the same
  // escape hatch `BlockActionsMenu` uses for `blocks.itemActions`.
  const config = useContext(VexConfigContext);
  const projectHeaderActions = config?.admin.components.blocks.headerActions as unknown as
    | ComponentContributionInput<ReactHKT, BlocksHeaderActionsProps>[]
    | undefined;

  // Controlled accordion open-state. `items` can populate asynchronously
  // (the owning document loading after first mount) and Base UI's Accordion
  // warns when an *uncontrolled* `defaultValue` changes after init — so this
  // tracks which item ids have already been accounted for and opens any
  // newly-appeared ones (first load, or a block just added) according to
  // `admin.defaultCollapsed`, while the user's manual toggles persist.
  const itemIdsKey = items.map((item) => item.id as string).join(",");
  const [openBlockIds, setOpenBlockIds] = useState<string[]>(() =>
    computeDefaultOpenBlocks({
      items,
      fieldDefaultCollapsed: fieldDef.admin.defaultCollapsed,
      blockDefMap,
    }),
  );
  const [trackedIdsKey, setTrackedIdsKey] = useState(itemIdsKey);
  if (itemIdsKey !== trackedIdsKey) {
    const trackedIds = new Set(trackedIdsKey ? trackedIdsKey.split(",") : []);
    const newItems = items.filter((item) => !trackedIds.has(item.id as string));
    setTrackedIdsKey(itemIdsKey);
    if (newItems.length > 0 && !fieldDef.admin.defaultCollapsed) {
      const newOpenIds = newItems
        .filter((item) => !blockDefMap.get(item.blockType as string)?.admin?.defaultCollapsed)
        .map((item) => item.id as string);
      if (newOpenIds.length > 0) {
        setOpenBlockIds((prev) => [...prev, ...newOpenIds]);
      }
    }
  }

  const insertCursorRef = useRef<number | undefined>(undefined);

  function requestInsert(index: number | undefined) {
    insertCursorRef.current = index;
    if (fieldDef.blocks.length === 1) {
      handleAddBlock(fieldDef.blocks[0]!);
      return;
    }
    openEditor();
  }

  function handleAddBlock(blockDef: BlockConfig) {
    const insertAt = insertCursorRef.current;
    if (insertAt === undefined) {
      field.pushValue(buildDefaultBlock({ blockDef }));
      return;
    }
    field.insertValue(insertAt, buildDefaultBlock({ blockDef }));
    insertCursorRef.current = insertAt + 1;
  }

  function updateBlockName(index: number, blockName: string) {
    const current = items[index];
    if (!current) return;
    const updated = [...items];
    updated[index] = { ...current, blockName };
    field.handleChange(updated);
  }

  function handleCopyAll() {
    copyBlocks({ blocks: items });
    toast(`Copied ${items.length} block${items.length === 1 ? "" : "s"}.`);
  }

  function handleCopyBlock(block: GenericBlock) {
    copyBlocks({ blocks: [block] });
    toast(
      `Copied "${(block.blockName as string) || (block.blockType as string)}".`,
    );
  }

  function handlePasteAppend() {
    if (!canPaste) return;
    field.handleChange([...items, ...pasteCandidates.accepted]);
    toastPasteOutcome({
      acceptedCount: pasteCandidates.accepted.length,
      skipped: pasteCandidates.skipped,
      droppedKeys: pasteCandidates.droppedKeys,
    });
  }

  function handlePasteAt(index: number, position: "above" | "below") {
    if (!canPaste) return;
    const insertIndex = position === "above" ? index : index + 1;
    const updated = [...items];
    updated.splice(insertIndex, 0, ...pasteCandidates.accepted);
    field.handleChange(updated);
    toastPasteOutcome({
      acceptedCount: pasteCandidates.accepted.length,
      skipped: pasteCandidates.skipped,
      droppedKeys: pasteCandidates.droppedKeys,
    });
  }

  function handleReplaceAll() {
    if (!canReplaceAll) return;
    field.handleChange(pasteCandidates.accepted);
    setReplaceAllOpen(false);
    toastPasteOutcome({
      acceptedCount: pasteCandidates.accepted.length,
      skipped: pasteCandidates.skipped,
      droppedKeys: pasteCandidates.droppedKeys,
    });
  }

  function handleDuplicate(index: number) {
    const source = items[index];
    const blockDef = source ? blockDefMap.get(source.blockType as string) : undefined;
    if (!source || !blockDef) return;
    field.insertValue(index + 1, cloneBlockWithFreshIds({ block: source, blockDef }));
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    field.moveValue(index, index - 1);
  }

  function handleMoveDown(index: number) {
    if (index === items.length - 1) return;
    field.moveValue(index, index + 1);
  }

  function handleRemove(index: number) {
    field.removeValue(index);
  }

  function handleCollapseAll() {
    setOpenBlockIds([]);
  }

  function handleExpandAll() {
    setOpenBlockIds(items.map((item) => item.id as string));
  }

  const headerRef = useRef<HTMLDivElement>(null);
  const headerCompact = useMeasuredCompact(headerRef, BLOCKS_HEADER_INLINE_MIN_PX);

  function headerActions(placement: ActionPlacement) {
    const contributed = (
      <SlotOutlet
        slotId={SLOT_IDS.blocks.headerActions}
        builtins={builtinHeaderActions}
        contributions={projectHeaderActions}
        contributedProps={{
          itemCount: items.length,
          canCopyAll: items.length > 0,
          canPaste,
          canReplaceAll,
          pasteCount: pasteCandidates.accepted.length,
          singular,
          plural,
          placement,
          onCopyAll: handleCopyAll,
          onPasteAppend: handlePasteAppend,
          onReplaceAllRequest: () => setReplaceAllOpen(true),
        }}
      />
    );
    const collapseControls = (
      <>
        <HeaderAction
          placement={placement}
          icon={<ChevronsDownUpIcon className="size-4" />}
          label="Collapse all"
          disabled={effectiveReadOnly}
          onClick={handleCollapseAll}
        />
        <HeaderAction
          placement={placement}
          icon={<ChevronsUpDownIcon className="size-4" />}
          label="Expand all"
          disabled={effectiveReadOnly}
          onClick={handleExpandAll}
        />
      </>
    );
    if (placement === "menu") {
      return (
        <>
          {collapseControls}
          <DropdownMenuSeparator />
          {contributed}
        </>
      );
    }
    return (
      <>
        {contributed}
        {collapseControls}
      </>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div ref={headerRef} className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {label}
          {items.length > 0 && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {items.length}
              {maxValue !== undefined ? `/${maxValue}` : ""} {plural}
            </span>
          )}
        </div>
        {items.length > 0 &&
          (headerCompact ? (
            <ActionsMenu label={`${fieldDef.label || name} actions`}>{headerActions("menu")}</ActionsMenu>
          ) : (
            <div className="flex shrink-0 items-center gap-1">{headerActions("inline")}</div>
          ))}
      </div>
      <AlertDialog open={replaceAllOpen} onOpenChange={setReplaceAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace all {plural}?</AlertDialogTitle>
            <AlertDialogDescription>
              This replaces all {items.length} current {items.length === 1 ? singular : plural} with{" "}
              {pasteCandidates.accepted.length} from the clipboard. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReplaceAll}>Replace all</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {items.length === 0 && (
        <div className="rounded-sm border-2 border-dashed border-border py-8 text-center">
          <LayersIcon className="mx-auto mb-2 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No {plural} yet.</p>
          {canPaste && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={handlePasteAppend}
            >
              Paste {pasteCandidates.accepted.length} {plural}
            </Button>
          )}
        </div>
      )}

      {items.length > 0 && (
        <Accordion multiple={true} value={openBlockIds} onValueChange={setOpenBlockIds} className="w-full">
          <Droppable
            id={name}
            div={{ className: "gap-0" }}
            onReorder={(from, to) => {
              field.moveValue(from, to);
            }}
          >
            {items.map((item, index) => {
              const blockSlug = item.blockType as string;
              const blockDef = blockDefMap.get(blockSlug);
              const itemKey = (item.id as string) ?? String(index);

              if (!blockDef) {
                return (
                  <div
                    key={itemKey}
                    className="rounded-sm border border-destructive/40 px-3 py-2 text-sm text-destructive"
                  >
                    Unknown block type: <code>{blockSlug}</code>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      disabled={effectiveReadOnly}
                      onClick={() => field.removeValue(index)}
                      className="ml-2"
                    >
                      <TrashIcon className="size-3.5" />
                    </Button>
                  </div>
                );
              }

              return (
                <BlockAccordionItem
                  key={itemKey}
                  name={name}
                  index={index}
                  count={items.length}
                  item={item}
                  blockDef={blockDef}
                  collection={collection}
                  readOnly={effectiveReadOnly}
                  menuReadOnly={readOnly}
                  canAdd={!atMax && canEdit}
                  isOpen={openBlockIds.includes(itemKey)}
                  onUpdateBlockName={(blockName) => updateBlockName(index, blockName)}
                  onDuplicate={() => handleDuplicate(index)}
                  onInsertAbove={() => requestInsert(index)}
                  onInsertBelow={() => requestInsert(index + 1)}
                  onMoveUp={() => handleMoveUp(index)}
                  onMoveDown={() => handleMoveDown(index)}
                  onRemove={() => handleRemove(index)}
                  onCopy={() => handleCopyBlock(item)}
                  onPasteAbove={() => handlePasteAt(index, "above")}
                  onPasteBelow={() => handlePasteAt(index, "below")}
                  canPaste={canPaste}
                  onOpen={() =>
                    setOpenBlockIds((open) => (open.includes(itemKey) ? open : [...open, itemKey]))
                  }
                />
              );
            })}
          </Droppable>
        </Accordion>
      )}

      {!effectiveReadOnly && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => requestInsert(undefined)}
            disabled={atMax}
            icon="Plus"
          >
            Add {singular}
          </Button>
          {atMax && (
            <span className="text-xs text-muted-foreground">
              Maximum {maxValue} {plural} reached
            </span>
          )}
        </div>
      )}

      <FormError field={field} submissionAttempts={submissionAttempts} />

      <BlockPickerDialog
        blockDefs={fieldDef.blocks}
        open={modalOpen}
        onOpenChange={(open) => {
          if (open) {
            openEditor();
            return;
          }
          insertCursorRef.current = undefined;
          closeEditor();
        }}
        onSelect={handleAddBlock}
        multiselect={true}
      />
    </div>
  );
}
