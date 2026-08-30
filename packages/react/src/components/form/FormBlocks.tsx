"use client";

import { ComponentPropsWithRef, useContext, useState } from "react";
import {
  type BlocksField,
  type BlockConfig,
  type InputComponentProps,
  type GenericBlock,
  BaseFieldMeta,
} from "@vexcms/core";
import type { TypedFieldApi } from "./createFieldInput";
import { AppFormContext } from "./AppFormContext";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { TrashIcon, LayersIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { fieldToInputComponent } from "../fields";
import { Icon } from "../Icon";
import { cn } from "../../styles/utils";
import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { Accordion, AccordionContent, AccordionItem } from "../ui/accordion";
import { FormError } from "./FormError";
import { Draggable, DragHandle, Droppable } from "../ui/dnd";

/**
 * Props for the `FormBlocks` component.
 *
 * @see {@link FormBlocks}
 */
export interface FormBlocksProps {
  /** The field key name from the collection config, e.g. `"body"`. */
  name: string;
  /**
   * The TanStack Form array field API in `mode="array"`.
   *
   * `field.state.value` is the block item array. `pushValue` / `removeValue`
   * handle add and remove.
   */
  field: TypedFieldApi<GenericBlock[]>;
  /** The resolved blocks field definition. */
  fieldDef: BlocksField;
  /** Whether all controls are read-only. Propagated to every sub-field. */
  readOnly: boolean;
  /** Number of form submissions — passed through for validation error display. */
  submissionAttempts: number;
  /** Additional class names for the outer container. */
  className?: string;
}

/** Builds the default value object for a new block of the given type. */
function buildDefaultBlock(blockDef: BlockConfig): GenericBlock {
  const fieldDefaults = Object.fromEntries(
    Object.entries(blockDef.fields).map(([key, subField]) => [key, subField.defaultValue ?? null]),
  );
  return {
    blockType: blockDef.blockType,
    blockName: blockDef.label,
    id: crypto.randomUUID(),
    ...fieldDefaults,
  };
}

/**
 * Computes which block IDs should start open in the accordion.
 *
 * If `admin.defaultCollapsed` is true, all blocks start collapsed (returns []).
 * Otherwise, all blocks start open.
 */
function computeDefaultOpenBlocks(items: GenericBlock[], defaultCollapsed: boolean): string[] {
  if (defaultCollapsed) return [];
  // All blocks open by default
  return items.map((item) => item.id as string);
}

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
            <p className="text-muted-foreground py-6 text-center text-sm">No blocks found</p>
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
                          <Icon name="Check" className="text-primary-foreground size-3" />
                        )}
                      </div>
                    )}
                    <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-sm">
                      {blockDef.admin?.icon ? (
                        <Icon
                          name={blockDef.admin.icon as any}
                          className="text-muted-foreground size-4"
                        />
                      ) : (
                        <LayersIcon className="text-muted-foreground size-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{blockDef.label}</p>
                      <p className="text-muted-foreground truncate text-xs">
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
            <span className="text-muted-foreground text-sm">{selectedBlocks.size} selected</span>
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
// FormBlocks
// ---------------------------------------------------------------------------

/**
 * Renders a blocks field as a simple accordion list with a searchable block picker.
 *
 * All blocks share a single `Accordion multiple={true}` — multiple items can be
 * open at the same time. Each block is an `AccordionItem` with its `id` as the
 * item value (stable across reorders).
 *
 * **Default open state:**
 * - If `fieldDef.admin.defaultCollapsed` is `true`, all blocks start collapsed.
 * - Otherwise, blocks start open if their `admin.defaultOpen` is not `false` (default: true).
 *
 * The header row (order number, chevron, type badge) is the `AccordionTrigger`
 * — the `blockName` input is a sibling that does NOT trigger the accordion
 * (uses `e.stopPropagation()`).
 *
 * **Drag-and-drop** is not included yet. The `FormArray` pattern will be
 * abstracted into reusable `Draggable`, `DragHandle`, and `DroppableList`
 * components in a future spec step.
 *
 * `blockType`, `blockName`, and `id` are never rendered as editable sub-field inputs.
 *
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
}: InputComponentProps<TFieldMeta, BlocksField<TFieldMeta>> & {
  field: TypedFieldApi<GenericBlock[]>;
  submissionAttempts: number;
  /** Whether the block editor modal is open (driven by URL param). */
  modalOpen: boolean;
  /** Opens the block editor modal (sets URL param). */
  openEditor: () => void;
  /** Closes the block editor modal (clears URL param). */
  closeEditor: () => void;
} & ComponentPropsWithRef<"div">) {
  const form = useContext(AppFormContext);

  if (!form) {
    throw new Error(
      `FormBlocks "${name}" must be rendered inside <AppForm> or have a form context available.`,
    );
  }

  const items = (field.state.value ?? []) as GenericBlock[];
  const blockDefMap = new Map(fieldDef.blocks.map((b) => [b.blockType, b]));
  const { singular, plural } = fieldDef.labels;
  const atMax = !!fieldDef.max && items.length >= fieldDef.max;

  const defaultOpenBlockIds = computeDefaultOpenBlocks(items, fieldDef.admin.defaultCollapsed);

  function handleAdd(blockDef: BlockConfig) {
    field.pushValue(buildDefaultBlock(blockDef));
  }

  function updateBlockName(index: number, blockName: string) {
    const current = items[index];
    if (!current) return;
    const updated = [...items];
    updated[index] = { ...current, blockName: blockName };
    field.handleChange(updated);
  }

  // NOTE: an unfinished hoist of the per-block `canEdit` hook lived here. It was
  // unused (the inner `usePermission` at the block level shadows it) and removed
  // to unblock typecheck. Completing the hoist is a behaviour decision, not a
  // mechanical move: the inner call omits `scope`, so it defaults to `all`
  // (pessimistic — a per-document rule disables the controls), whereas the
  // hoisted version passed `scope: "any"` (optimistic — controls stay enabled).
  // Pick one deliberately, then move the single call out of the render callback
  // to also settle the Rules-of-Hooks violation at line ~344.
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Empty state */}
      {items.length === 0 && (
        <div className="border-border rounded-sm border-2 border-dashed py-8 text-center">
          <LayersIcon className="text-muted-foreground mx-auto mb-2 size-8" />
          <p className="text-muted-foreground text-sm">No {plural} yet.</p>
        </div>
      )}

      {/* Block list — single shared Accordion */}
      {items.length > 0 && (
        <Accordion multiple={true} defaultValue={defaultOpenBlockIds} className="w-full">
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
                    className="border-destructive/40 text-destructive rounded-sm border px-3 py-2 text-sm"
                  >
                    Unknown block type: <code>{blockSlug}</code>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      disabled={readOnly}
                      onClick={() => field.removeValue(index)}
                      className="ml-2"
                    >
                      <TrashIcon className="size-3.5" />
                    </Button>
                  </div>
                );
              }

              const subFields = Object.entries(blockDef.fields);

              return (
                <Draggable key={itemKey} id={`${name}-${itemKey}`} index={index}>
                  <AccordionItem
                    value={itemKey}
                    className={cn(
                      "rounded-sm border-t border-r-2 border-l-2 border-border bg-background overflow-hidden",
                      index === 0 && "border-t-2",
                      index === items.length - 1 && "border-b-2",
                    )}
                  >
                    {/* Header row: DragHandle and remove button are siblings of the
                        Trigger, never nested inside it. @hello-pangea/dnd blocks drags
                        that start inside a <button> parent, so the DragHandle must live
                        outside AccordionPrimitive.Trigger. */}
                    <AccordionPrimitive.Header className="bg-muted/40 flex items-center gap-2 px-3 py-2">
                      <DragHandle disabled={!readOnly} />
                      <AccordionPrimitive.Trigger className="group/accordion-trigger focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-center gap-2 rounded-md border border-transparent outline-none focus-visible:ring-3 aria-disabled:pointer-events-none aria-disabled:opacity-50">
                        {/* Order number */}
                        <span className="text-muted-foreground w-4 shrink-0 text-center font-mono text-xs tabular-nums">
                          {index + 1}
                        </span>
                        {/* Type badge */}
                        <div className="shrink-0 p-0.5">
                          <span className="text-muted-foreground bg-muted shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px]">
                            {blockDef.blockType}
                          </span>
                        </div>
                        {/* blockName input */}
                        <div className="min-w-[50%] flex-1 sm:min-w-[60%]">
                          <Input
                            type="text"
                            value={(item.blockName as string) ?? ""}
                            onChange={(e) => updateBlockName(index, e.target.value)}
                            disabled={readOnly}
                            placeholder={blockDef.label ?? blockDef.blockType}
                            className="placeholder:text-muted-foreground w-full truncate border-none bg-transparent p-0 text-sm font-medium outline-none focus:ring-0 disabled:opacity-50"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <ChevronDownIcon className="text-muted-foreground pointer-events-none ml-auto size-4 shrink-0 self-center group-aria-expanded/accordion-trigger:hidden" />
                        <ChevronUpIcon className="text-muted-foreground pointer-events-none hidden size-4 shrink-0 self-center group-aria-expanded/accordion-trigger:inline" />
                      </AccordionPrimitive.Trigger>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        disabled={readOnly}
                        onClick={() => field.removeValue(index)}
                        className="text-muted-foreground hover:text-destructive shrink-0 transition-colors duration-300"
                        aria-label={`Remove ${blockDef.label} block`}
                      >
                        <TrashIcon className="size-3.5" />
                      </Button>
                    </AccordionPrimitive.Header>

                    {/* Sub-fields content */}
                    <AccordionContent className="px-3 pt-3">
                      <div className="flex flex-col gap-4 pt-3">
                        {subFields.length === 0 ? (
                          <p className="text-muted-foreground text-sm italic">
                            This block has no configurable fields.
                          </p>
                        ) : (
                          subFields.map(([fieldKey, subFieldDef]) => {
                            const SubInput = fieldToInputComponent(subFieldDef.type);
                            if (!SubInput) return null;
                            return (
                              <SubInput
                                key={fieldKey}
                                name={`${name}[${index}].${fieldKey}`}
                                fieldDef={subFieldDef as any}
                                collection={collection}
                                readOnly={readOnly || subFieldDef.admin.readOnly}
                              />
                            );
                          })
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Draggable>
              );
            })}
          </Droppable>
        </Accordion>
      )}

      {/* Add button */}
      {!readOnly && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (fieldDef.blocks.length === 1) {
                return handleAdd(fieldDef.blocks[0]!);
              }
              openEditor();
            }}
            disabled={atMax}
            icon="Plus"
          >
            Add {singular}
          </Button>
          {atMax && (
            <span className="text-muted-foreground text-xs">
              Maximum {fieldDef.max} {plural} reached
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
          closeEditor();
        }}
        onSelect={handleAdd}
        multiselect={true}
      />
    </div>
  );
}
