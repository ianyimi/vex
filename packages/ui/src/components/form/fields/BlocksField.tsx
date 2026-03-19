"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { BlocksFieldDef, BlockDef, VexField } from "@vexcms/core";
import { toTitleCase } from "@vexcms/core";
import { Label } from "../../ui/label";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import {
  Collapsible,
  CollapsibleContent,
} from "../../ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../ui/dialog";
import { useVexField } from "../../../hooks/useVexField";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  GripVertical,
  ChevronsUpDown,
  Search,
  Layers,
  CopyPlus,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface BlockInstance {
  blockType: string;
  blockName?: string;
  _key: string;
  [field: string]: unknown;
}

function generateKey(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ---------------------------------------------------------------------------
// localStorage helpers for collapse state persistence
// ---------------------------------------------------------------------------

function getStorageKey(fieldName: string): string {
  // Include pathname so different documents don't clash
  const path =
    typeof window !== "undefined" ? window.location.pathname : "";
  return `vex-blocks-collapse:${path}:${fieldName}`;
}

function loadCollapseState(fieldName: string): Set<string> | null {
  try {
    const raw = localStorage.getItem(getStorageKey(fieldName));
    if (!raw) return null;
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return new Set(arr as string[]);
  } catch {
    // Ignore corrupt data
  }
  return null;
}

function saveCollapseState(fieldName: string, openKeys: Set<string>): void {
  try {
    localStorage.setItem(
      getStorageKey(fieldName),
      JSON.stringify([...openKeys]),
    );
  } catch {
    // Ignore quota errors
  }
}

// ---------------------------------------------------------------------------
// Block instance creation
// ---------------------------------------------------------------------------

function createBlockInstance(props: {
  blockDef: BlockDef;
}): BlockInstance {
  const instance: BlockInstance = {
    blockType: props.blockDef.slug,
    blockName: props.blockDef.label,
    _key: generateKey(),
  };
  for (const [fieldName, field] of Object.entries(props.blockDef.fields)) {
    const f = field as VexField;
    switch (f.type) {
      case "text":
        instance[fieldName] = f.defaultValue ?? "";
        break;
      case "number":
        instance[fieldName] = f.defaultValue ?? 0;
        break;
      case "checkbox":
        instance[fieldName] = f.defaultValue ?? false;
        break;
      case "select":
        instance[fieldName] = f.hasMany
          ? f.defaultValue
            ? [f.defaultValue]
            : []
          : f.defaultValue ?? "";
        break;
      case "date":
        instance[fieldName] = f.defaultValue ?? 0;
        break;
      case "imageUrl":
        instance[fieldName] = f.defaultValue ?? "";
        break;
      case "relationship":
        instance[fieldName] = f.hasMany ? [] : "";
        break;
      case "json":
        instance[fieldName] = {};
        break;
      case "richtext":
        instance[fieldName] = [];
        break;
      case "array":
        instance[fieldName] = [];
        break;
      case "blocks":
        instance[fieldName] = [];
        break;
      default:
        instance[fieldName] = undefined;
    }
  }
  return instance;
}

function duplicateBlock(block: BlockInstance): BlockInstance {
  return { ...structuredClone(block), _key: generateKey() };
}

// ---------------------------------------------------------------------------
// Block Picker Dialog
// ---------------------------------------------------------------------------

function BlockPickerDialog(props: {
  blockDefs: BlockDef[];
  onSelect: (blockDef: BlockDef) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = props.blockDefs.filter(
    (b) =>
      b.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.slug.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="w-full max-w-md p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Add Block</DialogTitle>
          <DialogDescription>Select a block type to add</DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search blocks..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchTerm(e.target.value)
              }
              className="pl-9"
              autoFocus
            />
          </div>
        </div>
        <div className="px-3 pb-4 max-h-[300px] overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No blocks found
            </p>
          ) : (
            <div className="space-y-1">
              {filtered.map((blockDef) => (
                <button
                  key={blockDef.slug}
                  type="button"
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left hover:bg-muted transition-colors"
                  onClick={() => {
                    props.onSelect(blockDef);
                    props.onOpenChange(false);
                    setSearchTerm("");
                  }}
                >
                  <div className="size-8 rounded bg-muted flex items-center justify-center shrink-0">
                    <Layers className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {blockDef.label}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {blockDef.slug}
                      {Object.keys(blockDef.fields).length > 0 &&
                        ` · ${Object.keys(blockDef.fields).length} field${Object.keys(blockDef.fields).length === 1 ? "" : "s"}`}
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
// Single Block Item (collapsible, draggable)
// ---------------------------------------------------------------------------

function BlockItem(props: {
  block: BlockInstance;
  blockDef: BlockDef | undefined;
  index: number;
  totalCount: number;
  isOpen: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onDuplicateAbove: () => void;
  onDuplicateBelow: () => void;
  onFieldChange: (fieldName: string, value: unknown) => void;
  onBlockNameChange: (name: string) => void;
  readOnly: boolean;
  dragHandleProps: Record<string, any> | undefined;
}) {
  if (!props.blockDef) return null;

  const orderNumber = props.index + 1;
  const blockName = (props.block.blockName as string) ?? "";

  return (
    <Collapsible open={props.isOpen}>
      <div className="border rounded-lg overflow-hidden bg-background">
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 hover:bg-muted transition-colors">
          {/* Drag handle */}
          <div
            {...props.dragHandleProps}
            className="shrink-0 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="size-4 text-muted-foreground" />
          </div>

          {/* Order number */}
          <span className="text-xs font-mono text-muted-foreground tabular-nums w-5 text-center shrink-0">
            {orderNumber}
          </span>

          {/* Chevron — toggles collapse */}
          <button
            type="button"
            className="shrink-0 p-0.5 rounded hover:bg-muted-foreground/10"
            onClick={props.onToggle}
          >
            {props.isOpen ? (
              <ChevronDown className="size-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-4 text-muted-foreground" />
            )}
          </button>

          {/* Block type badge — left of name */}
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0 font-mono">
            {props.blockDef.slug}
          </span>

          {/* Block name input */}
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={blockName}
              onChange={(e) => props.onBlockNameChange(e.target.value)}
              disabled={props.readOnly}
              className="w-full bg-transparent text-sm font-medium border-none outline-none focus:ring-0 p-0 truncate placeholder:text-muted-foreground"
              placeholder={props.blockDef.label}
            />
          </div>

          {/* Action buttons */}
          {!props.readOnly && (
            <div className="flex items-center gap-0.5 shrink-0">
              {/* Duplicate above */}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground hover:text-foreground"
                title="Duplicate above"
                onClick={props.onDuplicateAbove}
              >
                <div className="flex flex-col items-center -space-y-1.5">
                  <ArrowUp className="size-2.5" />
                  <CopyPlus className="size-3" />
                </div>
              </Button>

              {/* Duplicate below */}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground hover:text-foreground"
                title="Duplicate below"
                onClick={props.onDuplicateBelow}
              >
                <div className="flex flex-col items-center -space-y-1.5">
                  <CopyPlus className="size-3" />
                  <ArrowDown className="size-2.5" />
                </div>
              </Button>

              {/* Delete */}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground hover:text-destructive"
                title="Remove block"
                onClick={props.onRemove}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Fields */}
        <CollapsibleContent>
          <div className="p-4 space-y-4 border-t">
            {Object.keys(props.blockDef.fields).length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                This block has no fields.
              </p>
            ) : (
              Object.entries(props.blockDef.fields).map(
                ([fieldName, fieldDef]) => {
                  const f = fieldDef as VexField;
                  const value = props.block[fieldName];

                  return (
                    <BlockFieldInput
                      key={fieldName}
                      fieldName={fieldName}
                      fieldDef={f}
                      value={value}
                      onChange={(v) => props.onFieldChange(fieldName, v)}
                      readOnly={props.readOnly}
                    />
                  );
                },
              )
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ---------------------------------------------------------------------------
// Block Field Input — renders an appropriate input for a block's field
// ---------------------------------------------------------------------------

function BlockFieldInput(props: {
  fieldName: string;
  fieldDef: VexField;
  value: unknown;
  onChange: (value: unknown) => void;
  readOnly: boolean;
}) {
  const label = props.fieldDef.label ?? toTitleCase(props.fieldName);
  const description =
    props.fieldDef.admin?.description ?? props.fieldDef.description;

  switch (props.fieldDef.type) {
    case "text":
      return (
        <div className="space-y-2">
          <Label>
            {label}
            {props.fieldDef.required && (
              <span className="text-destructive ml-1">*</span>
            )}
          </Label>
          <Input
            value={(props.value as string) ?? ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              props.onChange(e.target.value)
            }
            placeholder={props.fieldDef.admin?.placeholder}
            disabled={props.readOnly}
            maxLength={props.fieldDef.maxLength}
          />
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      );

    case "number":
      return (
        <div className="space-y-2">
          <Label>
            {label}
            {props.fieldDef.required && (
              <span className="text-destructive ml-1">*</span>
            )}
          </Label>
          <Input
            type="number"
            value={(props.value as string | number) ?? ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              props.onChange(
                e.target.value === "" ? undefined : Number(e.target.value),
              )
            }
            disabled={props.readOnly}
            min={props.fieldDef.min}
            max={props.fieldDef.max}
            step={props.fieldDef.step}
          />
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      );

    case "checkbox":
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!props.value}
            onChange={(e) => props.onChange(e.target.checked)}
            disabled={props.readOnly}
            className="size-4 rounded border"
          />
          <Label>{label}</Label>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      );

    case "select":
      return (
        <div className="space-y-2">
          <Label>
            {label}
            {props.fieldDef.required && (
              <span className="text-destructive ml-1">*</span>
            )}
          </Label>
          <select
            value={(props.value as string) ?? ""}
            onChange={(e) => props.onChange(e.target.value)}
            disabled={props.readOnly}
            className="w-full h-9 rounded-md border bg-background px-3 text-sm"
          >
            <option value="">Select...</option>
            {props.fieldDef.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      );

    default:
      return (
        <div className="space-y-2">
          <Label>{label}</Label>
          <div className="rounded-md border p-3 bg-muted/30">
            <p className="text-xs text-muted-foreground">
              Field type &quot;{props.fieldDef.type}&quot; is not yet supported
              inside blocks.
            </p>
          </div>
        </div>
      );
  }
}

// ---------------------------------------------------------------------------
// Main BlocksField Component
// ---------------------------------------------------------------------------

interface BlocksFieldProps {
  name: string;
  field?: any;
  fieldDef?: BlocksFieldDef;
}

function BlocksField({
  name,
  field: legacyField,
  fieldDef: propFieldDef,
}: BlocksFieldProps) {
  const vexField = legacyField ? null : useVexField<BlockInstance[]>({ name });

  const value: BlockInstance[] = legacyField
    ? legacyField.state.value ?? []
    : vexField!.value ?? [];
  const setValue = legacyField
    ? (v: BlockInstance[]) => legacyField.handleChange(v)
    : (v: BlockInstance[]) => vexField!.setValue(v);

  const fieldDef = (propFieldDef ?? vexField?.fieldDef) as
    | BlocksFieldDef
    | undefined;
  const label = fieldDef?.label ?? toTitleCase(name);
  const description = fieldDef?.admin?.description ?? fieldDef?.description;
  const readOnly = legacyField
    ? fieldDef?.admin?.readOnly ?? false
    : vexField!.readOnly;
  const blockDefs = fieldDef?.blocks ?? [];

  // Collapse state — initialized from localStorage, falls back to all-open
  const [openBlocks, setOpenBlocks] = useState<Set<string>>(() => {
    const saved = loadCollapseState(name);
    if (saved) return saved;
    return new Set(value.map((b) => b._key));
  });
  const [pickerOpen, setPickerOpen] = useState(false);

  // Persist collapse state to localStorage on changes
  const openBlocksRef = useRef(openBlocks);
  openBlocksRef.current = openBlocks;
  useEffect(() => {
    saveCollapseState(name, openBlocksRef.current);
  }, [openBlocks, name]);

  const blockDefMap = new Map(blockDefs.map((b) => [b.slug, b]));

  const toggleBlock = useCallback((key: string) => {
    setOpenBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    const allOpen = value.every((b) => openBlocks.has(b._key));
    if (allOpen) {
      setOpenBlocks(new Set());
    } else {
      setOpenBlocks(new Set(value.map((b) => b._key)));
    }
  }, [value, openBlocks]);

  const addBlock = useCallback(
    (blockDef: BlockDef) => {
      const instance = createBlockInstance({ blockDef });
      const next = [...value, instance];
      setValue(next);
      setOpenBlocks((prev) => new Set([...prev, instance._key]));
    },
    [value, setValue],
  );

  const removeBlock = useCallback(
    (key: string) => {
      setValue(value.filter((b) => b._key !== key));
      setOpenBlocks((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    },
    [value, setValue],
  );

  const duplicateBlockAbove = useCallback(
    (index: number) => {
      const block = value[index];
      if (!block) return;
      const copy = duplicateBlock(block);
      const next = [...value];
      next.splice(index, 0, copy);
      setValue(next);
      setOpenBlocks((prev) => new Set([...prev, copy._key]));
    },
    [value, setValue],
  );

  const duplicateBlockBelow = useCallback(
    (index: number) => {
      const block = value[index];
      if (!block) return;
      const copy = duplicateBlock(block);
      const next = [...value];
      next.splice(index + 1, 0, copy);
      setValue(next);
      setOpenBlocks((prev) => new Set([...prev, copy._key]));
    },
    [value, setValue],
  );

  const updateBlockField = useCallback(
    (key: string, fieldName: string, fieldValue: unknown) => {
      setValue(
        value.map((b) =>
          b._key === key ? { ...b, [fieldName]: fieldValue } : b,
        ),
      );
    },
    [value, setValue],
  );

  const updateBlockName = useCallback(
    (key: string, blockName: string) => {
      setValue(
        value.map((b) => (b._key === key ? { ...b, blockName } : b)),
      );
    },
    [value, setValue],
  );

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      const from = result.source.index;
      const to = result.destination.index;
      if (from === to) return;

      const next = Array.from(value);
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      setValue(next);
    },
    [value, setValue],
  );

  const singularLabel = fieldDef?.labels?.singular ?? "block";
  const pluralLabel = fieldDef?.labels?.plural ?? "blocks";
  const droppableId = `blocks-${name}`;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Label>
            {label}
            {fieldDef?.required && (
              <span className="text-destructive ml-1">*</span>
            )}
          </Label>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {value.length > 0 && (
            <>
              <span className="text-xs text-muted-foreground mr-1">
                {value.length}{" "}
                {value.length === 1 ? singularLabel : pluralLabel}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={toggleAll}
                className="text-muted-foreground"
              >
                <ChevronsUpDown className="size-3.5" />
                <span className="ml-1">
                  {value.every((b) => openBlocks.has(b._key))
                    ? "Collapse all"
                    : "Expand all"}
                </span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Drop area container */}
      <div className="rounded-lg border-2 border-dashed border-border bg-muted/20 p-3">
        {value.length === 0 ? (
          <div className="py-6 text-center">
            <Layers className="size-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No {pluralLabel} added yet.
            </p>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId={droppableId}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`space-y-2 transition-colors rounded-md ${
                    snapshot.isDraggingOver
                      ? "bg-primary/5 ring-2 ring-primary/20"
                      : ""
                  }`}
                >
                  {value.map((block, index) => (
                    <Draggable
                      key={block._key}
                      draggableId={block._key}
                      index={index}
                      isDragDisabled={readOnly}
                    >
                      {(draggableProvided, draggableSnapshot) => (
                        <div
                          ref={draggableProvided.innerRef}
                          {...draggableProvided.draggableProps}
                          className={`${
                            draggableSnapshot.isDragging
                              ? "shadow-lg ring-2 ring-primary/30 rounded-lg"
                              : ""
                          }`}
                        >
                          <BlockItem
                            block={block}
                            blockDef={blockDefMap.get(block.blockType)}
                            index={index}
                            totalCount={value.length}
                            isOpen={openBlocks.has(block._key)}
                            onToggle={() => toggleBlock(block._key)}
                            onRemove={() => removeBlock(block._key)}
                            onDuplicateAbove={() => duplicateBlockAbove(index)}
                            onDuplicateBelow={() => duplicateBlockBelow(index)}
                            onFieldChange={(fieldName, fieldValue) =>
                              updateBlockField(
                                block._key,
                                fieldName,
                                fieldValue,
                              )
                            }
                            onBlockNameChange={(blockName) =>
                              updateBlockName(block._key, blockName)
                            }
                            readOnly={readOnly}
                            dragHandleProps={
                              draggableProvided.dragHandleProps ?? undefined
                            }
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}

        {/* Add block button — inside the drop area */}
        {!readOnly && blockDefs.length > 0 && (
          <div className={value.length > 0 ? "mt-3" : ""}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full bg-background"
              onClick={() => setPickerOpen(true)}
            >
              <Plus className="size-4" />
              Add {singularLabel}
            </Button>
          </div>
        )}
      </div>

      {/* Block picker dialog */}
      {!readOnly && blockDefs.length > 0 && (
        <BlockPickerDialog
          blockDefs={blockDefs}
          onSelect={addBlock}
          open={pickerOpen}
          onOpenChange={setPickerOpen}
        />
      )}
    </div>
  );
}

export { BlocksField };
