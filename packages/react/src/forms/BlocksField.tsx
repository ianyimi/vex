"use client";

import type { ReactNode } from "react";
import { Activity, useEffect, useRef, useState } from "react";
import { useStore } from "@tanstack/react-form";
import {
  CheckIcon,
  ChevronsDownUpIcon,
  ChevronsUpDownIcon,
  CircleAlert,
  LayersIcon,
  TrashIcon,
} from "lucide-react";
import { useFieldContext, useFormContext } from "./formContext";
import { FormFieldLayout } from "./FormFieldLayout";
import { useArrayItems, type ArrayItemsField } from "./useArrayItems";
import { useCompactForm } from "./FormCompactContext";
import { useFieldErrorCount, useFailedSubmitAttempt } from "./useFieldErrorCount";
import { ActionsMenu, HeaderAction, type ActionPlacement } from "../ui/ActionsMenu";
import { Droppable, Draggable, DragHandle } from "../ui/dnd";
import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { Accordion, AccordionItem, AccordionContent, AccordionTriggerChevron } from "../ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { DropdownMenuSeparator } from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { FieldDescription } from "../ui/field";
import type { BaseFormFieldProps } from "./types";
import { cn } from "../utils/cn";

/** One block type the picker can insert — plain data, no core `BlockConfig` dependency. */
export interface BlockTypeOption<TBlock> {
  type: string;
  label: string;
  icon?: ReactNode;
  defaultCollapsed?: boolean;
  fieldCount?: number;
  newBlock: () => TBlock;
}

/**
 * The minimal shape every block item carries — structurally identical to
 * `GenericBlock` from `@vexcms/core`, redeclared here so `forms/` never
 * imports from core's block-specific types (every other field/type stays
 * generic over `TBlock`).
 */
export interface GenericBlockItem {
  id: string;
  blockType: string;
  blockName?: string;
}

/** Mutators a header action can use to apply a clipboard paste/replace while keeping `itemKeys` in sync. */
export interface BlocksHeaderClipboardMutators<TBlock> {
  /** Appends several blocks at the tail (Paste append). */
  pushMany: (blocks: TBlock[]) => void;
  /** Replaces the whole blocks array (Replace all). */
  replaceAll: (blocks: TBlock[]) => void;
}

/** Everything one block item's actions need to mutate the field through `BlocksField`'s own key-tracking hook instance. */
export interface BlocksItemActionsProps<TBlock> {
  index: number;
  itemCount: number;
  readOnly: boolean;
  /** Whether another item can still be added/duplicated/inserted/pasted in without exceeding `max`. */
  canAdd: boolean;
  /** Undefined when the caller omitted `cloneBlock` — duplicating a block needs a fresh-ids clone the hook cannot synthesize itself. */
  onDuplicate: (() => void) | undefined;
  onInsertAbove: () => void;
  onInsertBelow: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  /** Inserts several blocks starting at `position` (e.g. Paste above/below), keeping `itemKeys` in sync. */
  insertAt: (position: number, blocks: TBlock[]) => void;
}

/** Props for {@link BlocksField}. */
export interface BlocksFieldProps<TBlock extends GenericBlockItem> extends BaseFormFieldProps<TBlock[]> {
  blockTypes: BlockTypeOption<TBlock>[];
  max?: number;
  /** Singular display label for the Add button and item-count badge. Defaults to `"block"`. */
  itemLabelSingular?: string;
  /** Plural display label for the empty state and max-reached text. Defaults to `"blocks"`. */
  itemLabelPlural?: string;
  /** Renders one block's own fields, given its form-path `name`, position and type. */
  renderBlock: (props: { name: string; index: number; block: TBlock; blockType: BlockTypeOption<TBlock> }) => ReactNode;
  /** Controlled picker-open state; omit for an internally-managed (uncontrolled) picker. */
  picker?: { open: boolean; onOpenChange: (open: boolean) => void };
  /** Per-item actions — resolved against this hook instance's own mutators, so a keyboard action can never desync `itemKeys` from array order. */
  itemActions?: (props: BlocksItemActionsProps<TBlock>) => ReactNode;
  /** Field-level actions (Copy all/Paste/Replace all) — resolved against this hook instance's clipboard mutators. */
  headerActions?: (mutators: BlocksHeaderClipboardMutators<TBlock>) => ReactNode;
  /**
   * Clones a block for the built-in Duplicate item action, with a fresh
   * `id` (and fresh ids on any of its own nested blocks). Omit to drop
   * Duplicate from the built-in item actions entirely — this entry never
   * reads `fieldDef`/`blockDef`, so it cannot synthesize a clone itself.
   */
  cloneBlock?: (block: TBlock) => TBlock;
}

function BlockPickerDialog<TBlock extends GenericBlockItem>(props: {
  blockTypes: BlockTypeOption<TBlock>[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Confirmed selection, filtered to `props.blockTypes`' OWN registration order — not click order. */
  onConfirm: (blockTypes: BlockTypeOption<TBlock>[]) => void;
}): ReactNode {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const filtered = props.blockTypes.filter(
    (blockType) =>
      blockType.label.toLowerCase().includes(search.toLowerCase()) ||
      blockType.type.toLowerCase().includes(search.toLowerCase()),
  );

  function reset(): void {
    setSearch("");
    setSelected(new Set());
  }

  function toggleSelected(type: string): void {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  function handleConfirm(): void {
    const inRegistrationOrder = props.blockTypes.filter((blockType) => selected.has(blockType.type));
    reset();
    props.onConfirm(inRegistrationOrder);
  }

  return (
    <Dialog
      open={props.open}
      onOpenChange={(open) => {
        if (!open) reset();
        props.onOpenChange(open);
      }}
    >
      <DialogContent className="w-full max-w-sm p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle>Add block</DialogTitle>
          <DialogDescription>Select one or more blocks</DialogDescription>
        </DialogHeader>
        <div className="px-4 pb-2">
          <Input
            iconLeft={{ name: "Search" }}
            placeholder="Search blocks…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            autoFocus
          />
        </div>
        <div className="max-h-72 overflow-y-auto px-2 pb-3">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No blocks found</p>
          ) : (
            <div className="space-y-0.5">
              {filtered.map((blockType) => {
                const isSelected = selected.has(blockType.type);
                return (
                  <button
                    key={blockType.type}
                    type="button"
                    aria-pressed={isSelected}
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-muted ${isSelected ? "bg-muted" : ""}`}
                    onClick={() => toggleSelected(blockType.type)}
                  >
                    <div
                      className={`flex size-4 shrink-0 items-center justify-center rounded border border-input ${isSelected ? "border-primary bg-primary" : ""}`}
                    >
                      {isSelected && <CheckIcon className="size-3 text-primary-foreground" />}
                    </div>
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-muted">
                      {blockType.icon ?? <LayersIcon className="size-4 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{blockType.label}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {blockType.type}
                        {blockType.fieldCount !== undefined &&
                          ` · ${blockType.fieldCount} field${blockType.fieldCount === 1 ? "" : "s"}`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {selected.size > 0 && (
          <div className="flex items-center justify-between border-t px-4 pt-2 pb-4">
            <span className="text-sm text-muted-foreground">{selected.size} selected</span>
            <Button type="button" size="sm" onClick={handleConfirm}>
              Add {selected.size} block{selected.size === 1 ? "" : "s"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Renders one block's accordion item: drag handle, order number, type badge,
 * block name input and its own fields, plus the item actions node the
 * caller (`BlocksField`) already resolved via `itemActions`. Auto-opens on
 * a failed submit if it holds an error, mirroring `GroupField`'s own guarantee.
 *
 * @returns The block's `AccordionItem`, wrapped in a `Draggable`.
 */
function BlocksFieldItem<TBlock extends GenericBlockItem>(props: {
  name: string;
  index: number;
  itemsKey: string;
  itemCount: number;
  block: TBlock;
  blockType: BlockTypeOption<TBlock>;
  readOnly: boolean;
  isOpen: boolean;
  itemActionsNode: ReactNode;
  renderBlock: BlocksFieldProps<TBlock>["renderBlock"];
  onUpdateBlockName: (blockName: string) => void;
  onOpen: () => void;
}): ReactNode {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const errorCount = useFieldErrorCount({ names: [`${props.name}[${props.index}]`] });
  const failedSubmitAttempt = useFailedSubmitAttempt();
  useEffect(() => {
    if (failedSubmitAttempt > 0 && errorCount > 0) props.onOpen();
  }, [failedSubmitAttempt]);

  return (
    <Draggable id={`${props.name}-${props.itemsKey}`} index={props.index} isDragDisabled={props.readOnly}>
      <AccordionItem
        value={props.block.id}
        className={cn(
          "rounded-sm border-t border-r-2 border-l-2 border-border bg-background overflow-hidden",
          props.index === 0 && "border-t-2",
          props.index === props.itemCount - 1 && "border-b-2",
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
                {props.blockType.type}
              </span>
            </div>
            {!props.isOpen && errorCount > 0 && <CircleAlert className="size-3.5 shrink-0 text-destructive" />}
            <div className="min-w-0 flex-1">
              <Input
                type="text"
                value={props.block.blockName ?? ""}
                onChange={(e) => props.onUpdateBlockName(e.target.value)}
                disabled={props.readOnly}
                placeholder={props.blockType.label}
                className="w-full truncate border-none bg-transparent p-0 text-sm font-medium outline-none placeholder:text-muted-foreground focus:ring-0 disabled:opacity-50"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </AccordionPrimitive.Trigger>
          {props.itemActionsNode}
          <AccordionTriggerChevron triggerRef={triggerRef} />
        </AccordionPrimitive.Header>
        <AccordionContent className="px-3 pt-3" keepMounted={errorCount > 0}>
          <div className="flex flex-col gap-4 pt-3">
            {props.renderBlock({ name: `${props.name}[${props.index}]`, index: props.index, block: props.block, blockType: props.blockType })}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Draggable>
  );
}

/**
 * An accordion-list blocks field bound to the nearest `<form.AppField
 * name="..." mode="array">`: add/duplicate/remove/move/reorder/insert (via
 * `useArrayItems`), the compact-width ⋯ menu, collapse/expand all, and the
 * empty/max states. Every mutation — including the caller's own item/header
 * actions — is routed through this one `useArrayItems` instance so the
 * item's React/drag key (`itemKeys`) never desyncs from array order,
 * regardless of which action triggered the change.
 *
 * @param props - See {@link BlocksFieldProps} and {@link BaseFormFieldProps}.
 * @returns The field header, item accordion (or empty state), add control and error.
 */
export function BlocksField<TBlock extends GenericBlockItem>(props: BlocksFieldProps<TBlock>): ReactNode {
  const field = useFieldContext<TBlock[]>();
  const form = useFormContext();
  const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts);
  const blockTypeMap = new Map(props.blockTypes.map((blockType) => [blockType.type, blockType]));
  const itemLabelSingular = props.itemLabelSingular ?? "block";
  const itemLabelPlural = props.itemLabelPlural ?? "blocks";
  const { items, itemKeys, atMax, duplicate, remove, moveUp, moveDown, reorder, pushMany, insertMany, replaceAll } =
    useArrayItems({
      field: field as unknown as ArrayItemsField<TBlock>,
      createItem: () => {
        throw new Error("BlocksField items are added through the picker, not a bare createItem");
      },
      cloneItem: props.cloneBlock,
      max: props.max,
    });
  const label = props.label ?? field.name;

  const [openIds, setOpenIds] = useState<string[]>(() =>
    items.filter((block) => !blockTypeMap.get(block.blockType)?.defaultCollapsed).map((block) => block.id),
  );

  const [internalPickerOpen, setInternalPickerOpen] = useState(false);
  const pickerOpen = props.picker?.open ?? internalPickerOpen;
  const setPickerOpen = props.picker?.onOpenChange ?? setInternalPickerOpen;

  const insertCursorRef = useRef<number | undefined>(undefined);

  function insertBlock(blockType: BlockTypeOption<TBlock>): void {
    const newBlock = blockType.newBlock();
    if (insertCursorRef.current === undefined) {
      pushMany([newBlock]);
    } else {
      insertMany(insertCursorRef.current, [newBlock]);
      insertCursorRef.current += 1;
    }
    if (!blockType.defaultCollapsed) setOpenIds((open) => [...open, newBlock.id]);
  }

  function handleConfirmSelection(blockTypes: BlockTypeOption<TBlock>[]): void {
    for (const blockType of blockTypes) insertBlock(blockType);
    setPickerOpen(false);
  }

  function updateBlockName(index: number, blockName: string): void {
    const current = items[index];
    if (!current) return;
    const updated = [...items];
    updated[index] = { ...current, blockName };
    field.handleChange(updated);
  }

  function requestInsert(index: number | undefined): void {
    insertCursorRef.current = index;
    if (props.blockTypes.length === 1) {
      insertBlock(props.blockTypes[0]!);
      return;
    }
    setPickerOpen(true);
  }

  const compact = useCompactForm();

  function collapseExpandControls(placement: ActionPlacement): ReactNode {
    return (
      <>
        <HeaderAction placement={placement} icon={<ChevronsDownUpIcon className="size-4" />} label="Collapse all" disabled={Boolean(props.readOnly)} onClick={() => setOpenIds([])} />
        <HeaderAction placement={placement} icon={<ChevronsUpDownIcon className="size-4" />} label="Expand all" disabled={Boolean(props.readOnly)} onClick={() => setOpenIds(items.map((block) => block.id))} />
      </>
    );
  }

  const headerActionsNode = props.headerActions?.({ pushMany, replaceAll });

  return (
    <FormFieldLayout id={field.name} field={field} submissionAttempts={submissionAttempts} className={props.className}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span id={`${field.name}-label`} className="text-sm leading-none font-medium">
                {props.index !== undefined ? `[${props.index + 1}] - ` : ""}
                {label}
                {props.required && <span className="text-red-500">*</span>}
              </span>
              {items.length > 0 && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {items.length}
                  {props.max !== undefined ? `/${props.max}` : ""} {itemLabelPlural}
                </span>
              )}
            </div>
            {(headerActionsNode !== undefined || items.length > 0) && (
              <div className="flex shrink-0 items-center gap-1">
                {!compact && items.length > 0 && collapseExpandControls("inline")}
                {(headerActionsNode !== undefined || compact) && (
                  <ActionsMenu label={`${label} actions`}>
                    {compact && items.length > 0 && collapseExpandControls("menu")}
                    {compact && items.length > 0 && headerActionsNode !== undefined && <DropdownMenuSeparator />}
                    {headerActionsNode}
                  </ActionsMenu>
                )}
              </div>
            )}
          </div>
          <Activity mode={props.description ? "visible" : "hidden"}>
            <FieldDescription id={`${field.name}-description`} data-slot="form-description">
              {props.description}
            </FieldDescription>
          </Activity>
        </div>

        {items.length === 0 && (
          <div className="rounded-sm border-2 border-dashed border-border py-8 text-center">
            <LayersIcon className="mx-auto mb-2 size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No {itemLabelPlural} yet.</p>
          </div>
        )}

        {items.length > 0 && (
          <Accordion multiple={true} value={openIds} onValueChange={setOpenIds} className="w-full">
            <Droppable id={field.name} div={{ className: "gap-0" }} onReorder={reorder}>
              {items.map((block, index) => {
                const blockType = blockTypeMap.get(block.blockType);
                if (!blockType) {
                  return (
                    <div key={block.id} className="rounded-sm border border-destructive/40 px-3 py-2 text-sm text-destructive">
                      Unknown block type: <code>{block.blockType}</code>
                      <Button type="button" variant="ghost" size="icon-xs" disabled={Boolean(props.readOnly)} onClick={() => remove(index)} className="ml-2">
                        <TrashIcon className="size-3.5" />
                      </Button>
                    </div>
                  );
                }
                const itemActionsNode = props.itemActions?.({
                  index,
                  itemCount: items.length,
                  readOnly: Boolean(props.readOnly),
                  canAdd: !atMax,
                  onDuplicate: props.cloneBlock ? () => duplicate(index) : undefined,
                  onInsertAbove: () => requestInsert(index),
                  onInsertBelow: () => requestInsert(index + 1),
                  onMoveUp: () => moveUp(index),
                  onMoveDown: () => moveDown(index),
                  onRemove: () => remove(index),
                  insertAt: (position, blocks) => insertMany(position, blocks),
                });
                return (
                  <BlocksFieldItem
                    key={itemKeys[index]}
                    name={field.name}
                    index={index}
                    itemsKey={itemKeys[index]!}
                    itemCount={items.length}
                    block={block}
                    blockType={blockType}
                    readOnly={Boolean(props.readOnly)}
                    isOpen={openIds.includes(block.id)}
                    itemActionsNode={itemActionsNode}
                    renderBlock={props.renderBlock}
                    onUpdateBlockName={(blockName) => updateBlockName(index, blockName)}
                    onOpen={() => setOpenIds((open) => (open.includes(block.id) ? open : [...open, block.id]))}
                  />
                );
              })}
            </Droppable>
          </Accordion>
        )}

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => requestInsert(undefined)} disabled={Boolean(props.readOnly) || atMax} icon="Plus">
            Add {itemLabelSingular}
          </Button>
          {atMax && <span className="text-xs text-muted-foreground">Maximum {props.max} {itemLabelPlural} reached</span>}
        </div>
      </div>

      <BlockPickerDialog
        blockTypes={props.blockTypes}
        open={pickerOpen}
        onOpenChange={(open) => {
          if (!open) insertCursorRef.current = undefined;
          setPickerOpen(open);
        }}
        onConfirm={handleConfirmSelection}
      />
    </FormFieldLayout>
  );
}
