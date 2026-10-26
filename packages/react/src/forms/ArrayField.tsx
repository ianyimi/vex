"use client";

import type { ReactNode } from "react";
import { useStore } from "@tanstack/react-form";
import { ChevronsDownUpIcon, ChevronsUpDownIcon } from "lucide-react";
import { useFieldContext, useFormContext } from "./formContext";
import { FormFieldLayout, HideFieldLabelContext } from "./FormFieldLayout";
import { useArrayItems, type ArrayItemsField } from "./useArrayItems";
import { ArrayItemHeaderContext } from "./ArrayItemHeaderContext";
import { useCompactForm } from "./FormCompactContext";
import { ActionsMenu, HeaderAction, type ActionPlacement } from "../ui/ActionsMenu";
import { Droppable, Draggable, DragHandle } from "../ui/dnd";
import { Button } from "../ui/button";
import type { BaseFormFieldProps } from "./types";

/** Props for {@link ArrayField}. */
export interface ArrayFieldProps<TItem> extends BaseFormFieldProps<TItem[]> {
  /** Singular noun for the "Add <itemLabel>" button, e.g. `"Tag"`. */
  itemLabel: string;
  /** Plural noun for counts/empty state, e.g. `"tags"`. */
  pluralLabel: string;
  max?: number;
  createItem: () => TItem;
  cloneItem?: (item: TItem) => TItem;
  /**
   * When an item already carries its own persisted id, returning it here
   * keys the item by that stored id instead of a synthetic one — see
   * `UseArrayItemsOptions.getStoredId`.
   */
  getStoredId?: (item: TItem) => string | undefined;
  /** Renders one item's fields, given its form-path `name` and position. */
  renderItem: (props: { name: string; index: number; item: TItem }) => ReactNode;
  /**
   * `true` when an item renders its OWN header (a nested `GroupField`
   * consuming `ArrayItemHeaderContext`) — the gutter drag-handle/index-number
   * row is skipped in favor of that. Defaults to `false` (the gutter row).
   */
  itemsHaveOwnHeader?: boolean;
  /**
   * Per-item actions (duplicate, move, remove, …) — already-resolved nodes,
   * never a slot id. `onDuplicate`/`onMoveUp`/`onMoveDown`/`onRemove` call
   * straight into this `ArrayField`'s own `useArrayItems` instance, so the
   * caller's mutating action always stays in lockstep with `itemKeys`
   * instead of desyncing item identity from array order.
   */
  itemActions?: (props: {
    index: number;
    itemCount: number;
    placement: ActionPlacement;
    onDuplicate: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onRemove: () => void;
  }) => ReactNode;
  /** Field-level actions rendered beside the label, ahead of Collapse all / Expand all. */
  headerActions?: ReactNode;
}

/**
 * A dynamic list field bound to the nearest `<form.AppField name="..." mode="array">`.
 * Owns add/duplicate/remove/move/reorder (via {@link useArrayItems}), the
 * compact-width ⋯ menu, collapse/expand all, and the empty/max states; the
 * caller supplies each item's own fields through `renderItem`.
 *
 * @param props - See {@link ArrayFieldProps} and {@link BaseFormFieldProps}.
 * @returns The field header, item list (or empty state), add control and error.
 */
export function ArrayField<TItem>(props: ArrayFieldProps<TItem>): ReactNode {
  const field = useFieldContext<TItem[]>();
  const form = useFormContext();
  const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts);
  const {
    items,
    itemKeys,
    atMax,
    openSignal,
    collapseAll,
    expandAll,
    add,
    duplicate,
    remove,
    moveUp,
    moveDown,
    reorder,
  } = useArrayItems({
    field: field as unknown as ArrayItemsField<TItem>,
    createItem: props.createItem,
    cloneItem: props.cloneItem,
    max: props.max,
    getStoredId: props.getStoredId,
  });
  const compact = useCompactForm();
  const label = props.label ?? field.name;

  function collapseExpandControls(placement: ActionPlacement): ReactNode {
    return (
      <>
        <HeaderAction placement={placement} icon={<ChevronsDownUpIcon className="size-4" />} label="Collapse all" onClick={collapseAll} />
        <HeaderAction placement={placement} icon={<ChevronsUpDownIcon className="size-4" />} label="Expand all" onClick={expandAll} />
      </>
    );
  }

  const showHeaderActions = props.headerActions !== undefined || (props.itemsHaveOwnHeader && items.length > 0);

  return (
    <FormFieldLayout
      id={field.name}
      description={props.description}
      field={field}
      submissionAttempts={submissionAttempts}
      className={props.className}
    >
      <div className="flex flex-col gap-3 rounded-sm border-2 px-3 py-2">
        <div className="flex min-h-8 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span
              id={`${field.name}-label`}
              className="relative flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
            >
              {props.index !== undefined ? `[${props.index + 1}] - ` : ""}
              {label}
              {props.required && <span className="text-red-500">*</span>}
            </span>
            {items.length > 0 && (
              <span className="text-xs text-muted-foreground tabular-nums">
                {items.length}
                {props.max !== undefined ? `/${props.max}` : ""} {props.pluralLabel}
              </span>
            )}
          </div>
          {showHeaderActions &&
            (compact ? (
              <ActionsMenu label={`${label} actions`}>
                {props.headerActions}
                {props.itemsHaveOwnHeader && items.length > 0 && collapseExpandControls("menu")}
              </ActionsMenu>
            ) : (
              <div className="flex shrink-0 items-center gap-1">
                {props.headerActions}
                {props.itemsHaveOwnHeader && items.length > 0 && collapseExpandControls("inline")}
              </div>
            ))}
        </div>
        {items.length > 0 ? (
          <Droppable id={field.name} onReorder={reorder}>
            {items.map((item, index) => {
              const itemName = `${field.name}[${index}]`;
              const itemActionsNode = props.itemActions?.({
                index,
                itemCount: items.length,
                placement: compact ? "menu" : "inline",
                onDuplicate: () => duplicate(index),
                onMoveUp: () => moveUp(index),
                onMoveDown: () => moveDown(index),
                onRemove: () => remove(index),
              });
              const dragHandle = <DragHandle disabled={Boolean(props.readOnly)} />;
              return (
                <Draggable key={itemKeys[index]} id={`${field.name}-${itemKeys[index]}`} index={index} isDragDisabled={Boolean(props.readOnly)}>
                  {props.itemsHaveOwnHeader ? (
                    <ArrayItemHeaderContext.Provider value={{ dragHandle, actions: itemActionsNode, openSignal }}>
                      <HideFieldLabelContext.Provider value={false}>
                        {props.renderItem({ name: itemName, index, item })}
                      </HideFieldLabelContext.Provider>
                    </ArrayItemHeaderContext.Provider>
                  ) : (
                    <div className="flex items-start gap-2">
                      <div className="flex h-8 shrink-0 items-center gap-2">
                        {dragHandle}
                        <span className="w-4 text-center font-mono text-xs text-muted-foreground tabular-nums">{index + 1}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <HideFieldLabelContext.Provider value={true}>
                          {props.renderItem({ name: itemName, index, item })}
                        </HideFieldLabelContext.Provider>
                      </div>
                      <div className="flex h-8 shrink-0 items-center">{itemActionsNode}</div>
                    </div>
                  )}
                </Draggable>
              );
            })}
          </Droppable>
        ) : (
          <p className="text-muted-foreground text-sm">No {props.pluralLabel} yet.</p>
        )}
        <div className="flex items-center gap-2">
          <Button type="button" disabled={Boolean(props.readOnly) || atMax} variant="outline" size="sm" onClick={add} icon="Plus">
            Add {props.itemLabel}
          </Button>
          {atMax && (
            <span className="text-xs text-muted-foreground">
              Maximum {props.max} {props.pluralLabel} reached
            </span>
          )}
        </div>
      </div>
    </FormFieldLayout>
  );
}
