"use client";

import { ComponentPropsWithRef, useContext, useState } from "react";
import {
  type BlocksField,
  type BlockConfig,
  type InputComponentProps,
  type GenericBlock,
} from "@vexcms/core";
import type { TypedFieldApi } from "./createFieldInput";
import { AppFormContext } from "./AppFormContext";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { TrashIcon, PlusIcon, SearchIcon, LayersIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { fieldToInputComponent } from "../fields";
import { Icon } from "../Icon";
import { cn } from "../../styles/utils";
import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "../ui/accordion";
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
    Object.entries(blockDef.fields).map(([key, subField]) => [
      key,
      subField.defaultValue ?? null,
    ]),
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
function computeDefaultOpenBlocks(
  items: GenericBlock[],
  defaultCollapsed: boolean,
): string[] {
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
  onOpenChange: (open: boolean) => void;
  onSelect: (blockDef: BlockConfig) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = props.blockDefs.filter(
    (b) =>
      b.label?.toLowerCase().includes(search.toLowerCase()) ||
      b.blockType.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="w-full max-w-sm p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle>Add block</DialogTitle>
          <DialogDescription>Select a block type to add</DialogDescription>
        </DialogHeader>
        <div className="px-4 pb-2">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search blocks…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
        </div>
        <div className="px-2 pb-3 max-h-72 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No blocks found
            </p>
          ) : (
            <div className="space-y-0.5">
              {filtered.map((blockDef) => (
                <button
                  key={blockDef.blockType}
                  type="button"
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left hover:bg-muted transition-colors"
                  onClick={() => {
                    props.onSelect(blockDef);
                    props.onOpenChange(false);
                    setSearch("");
                  }}
                >
                  <div className="size-8 rounded-sm bg-muted flex items-center justify-center shrink-0">
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
                    <p className="text-sm font-medium truncate">
                      {blockDef.label}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {blockDef.blockType}
                      {Object.keys(blockDef.fields).length > 0 &&
                        ` · ${Object.keys(blockDef.fields).length} field${
                          Object.keys(blockDef.fields).length === 1 ? "" : "s"
                        }`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
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
export function FormBlocks({
  name,
  field,
  fieldDef,
  readOnly,
  submissionAttempts,
  className,
}: InputComponentProps<BlocksField> & {
  field: TypedFieldApi<GenericBlock[]>;
  submissionAttempts: number;
} & ComponentPropsWithRef<"div">) {
  const form = useContext(AppFormContext);
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!form) {
    throw new Error(
      `FormBlocks "${name}" must be rendered inside <AppForm> or have a form context available.`,
    );
  }

  const items = (field.state.value ?? []) as GenericBlock[];
  const blockDefMap = new Map(fieldDef.blocks.map((b) => [b.blockType, b]));
  const { singular, plural } = fieldDef.labels;
  const atMax = fieldDef.max !== undefined && items.length >= fieldDef.max;

  const defaultOpenBlockIds = computeDefaultOpenBlocks(
    items,
    fieldDef.admin.defaultCollapsed,
  );

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

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Empty state */}
      {items.length === 0 && (
        <div className="rounded-sm border-2 border-dashed border-border py-8 text-center">
          <LayersIcon className="size-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No {plural} yet.</p>
        </div>
      )}

      {/* Block list — single shared Accordion */}
      {items.length > 0 && (
        <Accordion
          multiple={true}
          defaultValue={defaultOpenBlockIds}
          className="w-full"
        >
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
                    {!readOnly && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => field.removeValue(index)}
                        className="ml-2"
                      >
                        <TrashIcon className="size-3.5" />
                      </Button>
                    )}
                  </div>
                );
              }

              const subFields = Object.entries(blockDef.fields);

              return (
                <Draggable
                  key={itemKey}
                  id={`${name}-${itemKey}`}
                  index={index}
                >
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
                    <AccordionPrimitive.Header className="flex items-center gap-2 px-3 py-2 bg-muted/40">
                      <DragHandle />
                      <AccordionPrimitive.Trigger className="group/accordion-trigger flex flex-1 items-center gap-2 rounded-md border border-transparent outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:pointer-events-none aria-disabled:opacity-50">
                        {/* Order number */}
                        <span className="text-xs font-mono text-muted-foreground tabular-nums w-4 text-center shrink-0">
                          {index + 1}
                        </span>
                        {/* Type badge */}
                        <div className="p-0.5 shrink-0">
                          <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                            {blockDef.blockType}
                          </span>
                        </div>
                        {/* blockName input */}
                        <div className="flex-1 min-w-[50%] sm:min-w-[60%]">
                          <Input
                            type="text"
                            value={(item.blockName as string) ?? ""}
                            onChange={(e) =>
                              updateBlockName(index, e.target.value)
                            }
                            disabled={readOnly}
                            placeholder={blockDef.label ?? blockDef.blockType}
                            className="w-full bg-transparent text-sm font-medium border-none outline-none focus:ring-0 p-0 truncate placeholder:text-muted-foreground disabled:opacity-50"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <ChevronDownIcon className="ml-auto size-4 text-muted-foreground pointer-events-none self-center shrink-0 group-aria-expanded/accordion-trigger:hidden" />
                        <ChevronUpIcon className="size-4 text-muted-foreground pointer-events-none self-center hidden shrink-0 group-aria-expanded/accordion-trigger:inline" />
                      </AccordionPrimitive.Trigger>
                      {!readOnly && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => field.removeValue(index)}
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          aria-label={`Remove ${blockDef.label} block`}
                        >
                          <TrashIcon className="size-3.5" />
                        </Button>
                      )}
                    </AccordionPrimitive.Header>

                    {/* Sub-fields content */}
                    <AccordionContent className="px-3 pt-3">
                      <div className="flex flex-col gap-4 pt-3">
                        {subFields.length === 0 ? (
                          <p className="text-sm text-muted-foreground italic">
                            This block has no configurable fields.
                          </p>
                        ) : (
                          subFields.map(([fieldKey, subFieldDef]) => {
                            const SubInput = fieldToInputComponent(
                              subFieldDef.type,
                            );
                            if (!SubInput) return null;
                            return (
                              <SubInput
                                key={fieldKey}
                                name={`${name}[${index}].${fieldKey}`}
                                fieldDef={subFieldDef as any}
                                readOnly={
                                  readOnly || subFieldDef.admin.readOnly
                                }
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
          {fieldDef.blocks.length === 1 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAdd(fieldDef.blocks[0]!)}
              disabled={atMax}
            >
              <PlusIcon className="size-4 inline mb-0.5 mr-1" />
              Add {singular}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPickerOpen(true)}
              disabled={atMax}
            >
              <PlusIcon className="size-4 inline mb-0.5 mr-1" />
              Add {singular}
            </Button>
          )}
          {atMax && (
            <span className="text-xs text-muted-foreground">
              Maximum {fieldDef.max} {plural} reached
            </span>
          )}
        </div>
      )}

      <FormError field={field} submissionAttempts={submissionAttempts} />

      <BlockPickerDialog
        blockDefs={fieldDef.blocks}
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleAdd}
      />
    </div>
  );
}
