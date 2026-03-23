"use client";

import { useState, useCallback } from "react";
import type { ArrayFieldDef, ObjectFieldDef, VexField } from "@vexcms/core";
import { toTitleCase, generateFormDefaultValues } from "@vexcms/core";
import { Label } from "../../ui/label";
import { Button } from "../../ui/button";
import {
  Collapsible,
  CollapsibleContent,
} from "../../ui/collapsible";
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
  CopyPlus,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type { RenderFieldCallback } from "./BlocksField";

interface ArrayFieldProps {
  field: {
    state: { value: unknown; meta: { errors: unknown[] } };
    handleChange: (value: unknown) => void;
  };
  fieldDef: ArrayFieldDef;
  name: string;
  renderField?: RenderFieldCallback;
}

function generateKey(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Each array item is wrapped with metadata for naming and keying */
interface ArrayItem {
  _key: string;
  itemName?: string;
  value: unknown;
}

function wrapItems(raw: unknown[]): ArrayItem[] {
  return raw.map((value) => {
    // If the value already has _key (from blocks or previous wrap), preserve it
    if (value && typeof value === "object" && "_key" in (value as any)) {
      const { _key, itemName, ...rest } = value as any;
      return { _key, itemName, value: rest };
    }
    return { _key: generateKey(), value };
  });
}

function unwrapItems(items: ArrayItem[]): unknown[] {
  return items.map((item) => item.value);
}

function createDefaultItem(innerField: VexField): unknown {
  if (innerField.type === "object") {
    return generateFormDefaultValues({ fields: (innerField as ObjectFieldDef).fields });
  }
  switch (innerField.type) {
    case "text": return (innerField as any).defaultValue ?? "";
    case "number": return (innerField as any).defaultValue ?? 0;
    case "checkbox": return (innerField as any).defaultValue ?? false;
    case "select": return (innerField as any).defaultValue ?? "";
    default: return undefined;
  }
}

function getItemPreview(item: ArrayItem, innerField: VexField, index: number, singularLabel: string): string {
  if (item.itemName) return item.itemName;
  if (innerField.type === "object") {
    const obj = item.value as Record<string, unknown> | undefined;
    if (obj) {
      // Show first text field value as preview
      for (const [, subField] of Object.entries((innerField as ObjectFieldDef).fields)) {
        if ((subField as VexField).type === "text") {
          const key = Object.keys((innerField as ObjectFieldDef).fields).find(
            (k) => (innerField as ObjectFieldDef).fields[k] === subField,
          );
          if (key && obj[key]) return String(obj[key]);
        }
      }
    }
  } else if (typeof item.value === "string" && item.value) {
    return item.value;
  }
  return `${singularLabel} ${index + 1}`;
}

function ArrayField({ field, fieldDef, name, renderField }: ArrayFieldProps) {
  const rawItems = (field.state.value as unknown[]) ?? [];
  const label = fieldDef.label ?? toTitleCase(name);
  const description = fieldDef.admin?.description ?? fieldDef.description;
  const readOnly = fieldDef.admin?.readOnly ?? false;
  const innerField = fieldDef.items;
  const isObjectArray = innerField.type === "object";
  const singularLabel = fieldDef.labels?.singular ?? "item";
  const pluralLabel = fieldDef.labels?.plural ?? "items";
  const droppableId = `array-${name}`;

  // Wrap raw values into keyed items
  const [items, setItemsState] = useState<ArrayItem[]>(() => wrapItems(rawItems));

  // Sync items back to the form field
  const setItems = useCallback(
    (next: ArrayItem[]) => {
      setItemsState(next);
      field.handleChange(unwrapItems(next));
    },
    [field],
  );

  // Re-sync if external value changes (e.g., form reset)
  if (rawItems.length !== items.length || (rawItems.length === 0 && items.length > 0)) {
    const wrapped = wrapItems(rawItems);
    if (JSON.stringify(wrapped.map((w) => w.value)) !== JSON.stringify(items.map((w) => w.value))) {
      setItemsState(wrapped);
    }
  }

  // Collapse state for object items
  const [openItems, setOpenItems] = useState<Set<string>>(
    () => new Set(items.map((item) => item._key)),
  );

  const toggleItem = useCallback((key: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    const allOpen = items.every((item) => openItems.has(item._key));
    if (allOpen) {
      setOpenItems(new Set());
    } else {
      setOpenItems(new Set(items.map((item) => item._key)));
    }
  }, [items, openItems]);

  const addItem = useCallback(() => {
    const newValue = createDefaultItem(innerField);
    const newItem: ArrayItem = { _key: generateKey(), value: newValue };
    const next = [...items, newItem];
    setItems(next);
    setOpenItems((prev) => new Set([...prev, newItem._key]));
  }, [items, setItems, innerField]);

  const removeItem = useCallback(
    (key: string) => {
      setItems(items.filter((item) => item._key !== key));
      setOpenItems((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    },
    [items, setItems],
  );

  const duplicateAbove = useCallback(
    (index: number) => {
      const item = items[index];
      if (!item) return;
      const copy: ArrayItem = { _key: generateKey(), itemName: item.itemName, value: structuredClone(item.value) };
      const next = [...items];
      next.splice(index, 0, copy);
      setItems(next);
      setOpenItems((prev) => new Set([...prev, copy._key]));
    },
    [items, setItems],
  );

  const duplicateBelow = useCallback(
    (index: number) => {
      const item = items[index];
      if (!item) return;
      const copy: ArrayItem = { _key: generateKey(), itemName: item.itemName, value: structuredClone(item.value) };
      const next = [...items];
      next.splice(index + 1, 0, copy);
      setItems(next);
      setOpenItems((prev) => new Set([...prev, copy._key]));
    },
    [items, setItems],
  );

  const updateItemValue = useCallback(
    (key: string, value: unknown) => {
      setItems(items.map((item) => (item._key === key ? { ...item, value } : item)));
    },
    [items, setItems],
  );

  const updateObjectField = useCallback(
    (key: string, subFieldName: string, subValue: unknown) => {
      setItems(
        items.map((item) => {
          if (item._key !== key) return item;
          const current = (item.value as Record<string, unknown>) ?? {};
          return { ...item, value: { ...current, [subFieldName]: subValue } };
        }),
      );
    },
    [items, setItems],
  );

  const updateItemName = useCallback(
    (key: string, itemName: string) => {
      setItems(items.map((item) => (item._key === key ? { ...item, itemName } : item)));
    },
    [items, setItems],
  );

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      const from = result.source.index;
      const to = result.destination.index;
      if (from === to) return;
      const next = Array.from(items);
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      setItems(next);
    },
    [items, setItems],
  );

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Label>
            {label}
            {fieldDef.required && (
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
          {items.length > 0 && (
            <>
              <span className="text-xs text-muted-foreground mr-1">
                {items.length}{" "}
                {items.length === 1 ? singularLabel : pluralLabel}
              </span>
              {isObjectArray && (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={toggleAll}
                  className="text-muted-foreground"
                >
                  <ChevronsUpDown className="size-3.5" />
                  <span className="ml-1">
                    {items.every((item) => openItems.has(item._key))
                      ? "Collapse all"
                      : "Expand all"}
                  </span>
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="rounded-lg border-2 border-dashed border-border bg-muted/20 p-3">
        {items.length === 0 ? (
          <div className="py-6 text-center">
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
                  {items.map((item, index) => (
                    <Draggable
                      key={item._key}
                      draggableId={item._key}
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
                          {isObjectArray ? (
                            <ObjectArrayItem
                              item={item}
                              index={index}
                              innerField={innerField as ObjectFieldDef}
                              isOpen={openItems.has(item._key)}
                              onToggle={() => toggleItem(item._key)}
                              onRemove={() => removeItem(item._key)}
                              onDuplicateAbove={() => duplicateAbove(index)}
                              onDuplicateBelow={() => duplicateBelow(index)}
                              onFieldChange={(subFieldName, subValue) =>
                                updateObjectField(item._key, subFieldName, subValue)
                              }
                              onItemNameChange={(itemName) =>
                                updateItemName(item._key, itemName)
                              }
                              readOnly={readOnly}
                              dragHandleProps={draggableProvided.dragHandleProps ?? undefined}
                              renderField={renderField}
                              singularLabel={singularLabel}
                            />
                          ) : (
                            <SimpleArrayItem
                              item={item}
                              index={index}
                              innerField={innerField}
                              onRemove={() => removeItem(item._key)}
                              onDuplicateAbove={() => duplicateAbove(index)}
                              onDuplicateBelow={() => duplicateBelow(index)}
                              onValueChange={(value) => updateItemValue(item._key, value)}
                              readOnly={readOnly}
                              dragHandleProps={draggableProvided.dragHandleProps ?? undefined}
                              renderField={renderField}
                              name={name}
                            />
                          )}
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

        {/* Add item button */}
        {!readOnly && (
          <div className="mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={addItem}
              disabled={fieldDef.max != null && items.length >= fieldDef.max}
            >
              <Plus className="size-4 mr-1" />
              Add {singularLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Object Array Item (collapsible, draggable, with item name)
// ---------------------------------------------------------------------------

function ObjectArrayItem(props: {
  item: ArrayItem;
  index: number;
  innerField: ObjectFieldDef;
  isOpen: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onDuplicateAbove: () => void;
  onDuplicateBelow: () => void;
  onFieldChange: (subFieldName: string, subValue: unknown) => void;
  onItemNameChange: (name: string) => void;
  readOnly: boolean;
  dragHandleProps: Record<string, any> | undefined;
  renderField?: RenderFieldCallback;
  singularLabel: string;
}) {
  const objValue = (props.item.value as Record<string, unknown>) ?? {};
  const preview = getItemPreview(props.item, props.innerField, props.index, props.singularLabel);

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
            {props.index + 1}
          </span>

          {/* Chevron */}
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

          {/* Item name input */}
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={props.item.itemName ?? ""}
              onChange={(e) => props.onItemNameChange(e.target.value)}
              disabled={props.readOnly}
              className="w-full bg-transparent text-sm font-medium border-none outline-none focus:ring-0 p-0 truncate placeholder:text-muted-foreground"
              placeholder={preview}
            />
          </div>

          {/* Action buttons */}
          {!props.readOnly && (
            <div className="flex items-center gap-0.5 shrink-0">
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

              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground hover:text-destructive"
                title="Remove item"
                onClick={props.onRemove}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Sub-fields */}
        <CollapsibleContent>
          <div className="p-4 space-y-4 border-t">
            {Object.entries(props.innerField.fields).map(
              ([subName, subFieldDef]) => {
                const f = subFieldDef as VexField;
                const subValue = objValue[subName];

                if (props.renderField) {
                  return (
                    <div key={subName}>
                      {props.renderField({
                        field: {
                          state: { value: subValue, meta: { errors: [] } },
                          handleChange: (v: unknown) =>
                            props.onFieldChange(subName, v),
                        },
                        fieldDef: f,
                        name: subName,
                      })}
                    </div>
                  );
                }

                return (
                  <div key={subName} className="space-y-2">
                    <Label>{f.label ?? toTitleCase(subName)}</Label>
                    <input
                      type="text"
                      value={String(subValue ?? "")}
                      onChange={(e) => props.onFieldChange(subName, e.target.value)}
                      disabled={props.readOnly}
                      className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                    />
                  </div>
                );
              },
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ---------------------------------------------------------------------------
// Simple Array Item (non-object, draggable)
// ---------------------------------------------------------------------------

function SimpleArrayItem(props: {
  item: ArrayItem;
  index: number;
  innerField: VexField;
  onRemove: () => void;
  onDuplicateAbove: () => void;
  onDuplicateBelow: () => void;
  onValueChange: (value: unknown) => void;
  readOnly: boolean;
  dragHandleProps: Record<string, any> | undefined;
  renderField?: RenderFieldCallback;
  name: string;
}) {
  return (
    <div className="flex items-center gap-2 border rounded-lg bg-background px-3 py-2">
      {/* Drag handle */}
      <div
        {...props.dragHandleProps}
        className="shrink-0 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="size-4 text-muted-foreground" />
      </div>

      {/* Order number */}
      <span className="text-xs font-mono text-muted-foreground tabular-nums w-5 text-center shrink-0">
        {props.index + 1}
      </span>

      {/* Field */}
      <div className="flex-1">
        {props.renderField ? (
          props.renderField({
            field: {
              state: { value: props.item.value, meta: { errors: [] } },
              handleChange: (v: unknown) => props.onValueChange(v),
            },
            fieldDef: props.innerField,
            name: `${props.name}[${props.index}]`,
          })
        ) : (
          <input
            type="text"
            value={String(props.item.value ?? "")}
            onChange={(e) => props.onValueChange(e.target.value)}
            disabled={props.readOnly}
            className="w-full h-9 rounded-md border bg-background px-3 text-sm"
          />
        )}
      </div>

      {/* Action buttons */}
      {!props.readOnly && (
        <div className="flex items-center gap-0.5 shrink-0">
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

          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-destructive"
            title="Remove item"
            onClick={props.onRemove}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

export { ArrayField, type ArrayFieldProps };
