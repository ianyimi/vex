"use client";

import {
  type ArrayField,
  type ArrayType,
  type BaseFieldMeta,
  type ComponentContributionInput,
  type InputComponentProps,
  ADMIN_FIELDS,
  arrayItemLabel,
  arrayPluralLabel,
  BUILTIN_CONTRIBUTION_IDS,
  SLOT_IDS,
  isObjectShapedArrayItem,
  withArrayItemId,
} from "@vexcms/core";
import type { TypedFieldApi } from "./createFieldInput";
import { useContext, useRef, useState } from "react";
import { AppFormContext } from "./AppFormContext";
import { VexConfigContext } from "../../context";
import { Button } from "../ui/button";
import { Droppable, Draggable, DragHandle } from "../ui/dnd";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronsDownUpIcon,
  ChevronsUpDownIcon,
  CopyIcon,
  TrashIcon,
} from "lucide-react";
import { ActionsMenu, HeaderAction, SurfacedAction, type ActionPlacement } from "./ActionsMenu";
import { useCompactForm } from "./FormCompactContext";
import { fieldToInputComponent } from "../fields/registry";
import { FormError } from "./FormError";
import { FormDescription } from "./FormDescription";
import { HideFieldLabelContext } from "./FormLabel";
import { SlotOutlet } from "../slots/SlotOutlet";
import { ArrayItemHeaderContext, type ArrayItemsOpenSignal } from "./ArrayItemHeaderContext";
import type { ReactHKT } from "../../adapter";
import type { VexResourceSlug } from "@vexcms/core";

/** Props the array item-actions slot's contributed component receives. */
interface ArrayItemActionsProps {
  itemIndex: number;
  itemCount: number;
  readOnly: boolean;
  atMax: boolean;
  itemLabel: string;
  /** The surface this render is for — the slot renders once per surface. */
  placement: ActionPlacement;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

/**
 * Built-in `array.item.actions` contributions — duplicate, move up/down,
 * remove — each rendered through `SurfacedAction`: as icon buttons beside the
 * item while the form column is wide, or (`useCompactForm()`) as items in the
 * item's ⋯ menu while it is compact — never both. Sourced through `SlotOutlet`
 * so a project/plugin can add its own actions alongside them via
 * `admin.components.array.itemActions`; they receive the same `placement`.
 */
const builtinItemActions: ComponentContributionInput<ReactHKT, ArrayItemActionsProps>[] = [
  {
    id: BUILTIN_CONTRIBUTION_IDS.array.duplicate,
    component: (p) => (
      <SurfacedAction
        placement={p.placement}
        icon={<CopyIcon className="size-4" />}
        label="Duplicate"
        ariaLabel={`Duplicate item ${p.itemIndex + 1} from ${p.itemLabel}`}
        disabled={p.readOnly || p.atMax}
        onClick={p.onDuplicate}
      />
    ),
  },
  {
    id: BUILTIN_CONTRIBUTION_IDS.array.moveUp,
    component: (p) => (
      <SurfacedAction
        placement={p.placement}
        icon={<ArrowUpIcon className="size-4" />}
        label="Move up"
        ariaLabel={`Move item ${p.itemIndex + 1} up`}
        disabled={p.readOnly || p.itemIndex === 0}
        onClick={p.onMoveUp}
      />
    ),
  },
  {
    id: BUILTIN_CONTRIBUTION_IDS.array.moveDown,
    component: (p) => (
      <SurfacedAction
        placement={p.placement}
        icon={<ArrowDownIcon className="size-4" />}
        label="Move down"
        ariaLabel={`Move item ${p.itemIndex + 1} down`}
        disabled={p.readOnly || p.itemIndex === p.itemCount - 1}
        onClick={p.onMoveDown}
      />
    ),
  },
  {
    id: BUILTIN_CONTRIBUTION_IDS.array.remove,
    component: (p) => (
      <SurfacedAction
        placement={p.placement}
        icon={<TrashIcon className="size-4" />}
        label="Remove"
        ariaLabel={`Remove item ${p.itemIndex + 1} from ${p.itemLabel}`}
        disabled={p.readOnly}
        onClick={p.onRemove}
        destructive
      />
    ),
  },
];

/**
 * Reads an object-shaped array item's own stored `id`, when present — a
 * one-off type-guarded read, not a cast, since `item` is an arbitrary array
 * value (string/number/boolean/object) whose shape the compiler cannot know.
 *
 * @param item - The raw array item value.
 * @returns The item's `id`, or `undefined` when `item` isn't an object, or
 *   has no string `id`.
 */
function getStoredItemId(item: unknown): string | undefined {
  if (item === null || typeof item !== "object" || !("id" in item)) return undefined;
  return typeof item.id === "string" ? item.id : undefined;
}

/**
 * Renders an array field as a dynamic list with add/duplicate/move/remove controls.
 *
 * This component renders inside an `ArrayFieldInput` (which wraps a TanStack Form
 * array field with `mode="array"`). It maps over `field.state.value` and renders
 * each item as a sub-field using `form.Field name={\`${name}[${i}]\`}`.
 *
 * Array items are raw values (string/number/boolean/object), not objects with a
 * stable `id` — unlike `FormBlocks`' `GenericBlock` items. A `useRef`-held parallel
 * key array supplies stable React/drag identity per slot: every push, duplicate,
 * remove, move, and reorder updates the key array in lockstep with the TanStack
 * Form array mutation, in the same synchronous step. An object-shaped item
 * (`isObjectShapedArrayItem`) keys by its own stored `id` instead, once it has one.
 *
 * @example
 * ```tsx
 * const ArrayFieldInput = createFieldInput<ArrayType[], ArrayField<VexResourceSlug, ArrayType>>(
 *   ({ name, fieldDef, field, submissionAttempts }) => (
 *     <div className="flex flex-col gap-1.5">
 *       <FormArray
 *         name={name}
 *         field={field}
 *         fieldDef={fieldDef}
 *         readOnly={fieldDef.admin.readOnly}
 *         submissionAttempts={submissionAttempts}
 *       />
 *     </div>
 *   ),
 *   "array" // mode
 * )
 * ```
 *
 * @param props - Component props.
 * @returns The array's items list (draggable, with per-item duplicate/move/remove
 *   controls — on the item's own accordion header for group items — Collapse
 *   all / Expand all for group items, and an add button below the items), or
 *   a "No <plural> yet." message when empty.
 * @throws {Error} When rendered outside `<AppForm>`, or when `fieldDef.items.type`
 *   has no registered input component.
 */
export function FormArray<
  TArrayType extends ArrayType = string,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
>({
  collection,
  name,
  field,
  fieldDef,
  index,
  readOnly,
  submissionAttempts,
}: InputComponentProps<TFieldMeta, ArrayField<VexResourceSlug, TArrayType, TFieldMeta>> & {
  field: TypedFieldApi<TArrayType[]>;
  submissionAttempts: number;
}) {
  const form = useContext(AppFormContext);
  // Raw, nullable context read (not `useVexConfig()`) — `FormArray` mounts in
  // test harnesses with no `VexConfigProvider`; a missing project config just
  // means no project-level `array.itemActions` additions, the same escape
  // hatch `useVexAccess()` uses for RBAC.
  const config = useContext(VexConfigContext);
  // `config.admin.components.array.itemActions` is typed against the
  // framework-erased `ComponentHKT` on the plain core `VexClientConfig`
  // type this component receives — every component actually stored there
  // was authored through this React adapter's own field factories, so the
  // values are genuinely `ReactHKT`-shaped at runtime (same escape hatch
  // `RenderFields`' own `FieldSlotOutlet` uses for `field.beforeInput`/`afterInput`).
  const projectItemActions = config?.admin.components.array.itemActions as unknown as
    | ComponentContributionInput<ReactHKT, ArrayItemActionsProps>[]
    | undefined;
  const compact = useCompactForm();

  if (!form) {
    throw new Error(
      `FormArray "${name}" must be rendered inside <AppForm> or have a form context available.`,
    );
  }

  const itemFieldDef = fieldDef.items;
  const ItemInput = fieldToInputComponent(itemFieldDef.type);

  if (!ItemInput) {
    throw new Error("invalid array.items field type set");
  }

  function getNewItemDefault() {
    return itemFieldDef.defaultValue as TArrayType;
  }

  const items = field.state.value ?? [];
  const maxValue = fieldDef.max?.[0];
  const atMax = maxValue !== undefined && items.length >= maxValue;

  const keysRef = useRef<string[]>([]);
  const [openSignal, setOpenSignal] = useState<ArrayItemsOpenSignal>({ version: 0, open: true });
  if (keysRef.current.length < items.length) {
    keysRef.current = [
      ...keysRef.current,
      ...Array.from({ length: items.length - keysRef.current.length }, () => crypto.randomUUID()),
    ];
  } else if (keysRef.current.length > items.length) {
    keysRef.current = keysRef.current.slice(0, items.length);
  }

  function handleAdd() {
    keysRef.current = [...keysRef.current, crypto.randomUUID()];
    field.pushValue(withArrayItemId({ item: getNewItemDefault(), itemField: itemFieldDef }));
  }

  function handleDuplicate(itemIndex: number) {
    const source = (field.getValue() ?? [])[itemIndex];
    const duplicate =
      typeof source === "object" && source !== null
        ? withArrayItemId({
            // Drop the source's own id first — withArrayItemId only FILLS IN a
            // missing id, it never replaces an existing one, and a duplicate must
            // never share its source's id (same requirement cloneBlockWithFreshIds
            // enforces for block duplication).
            item: { ...(source as Record<string, unknown>), id: undefined },
            itemField: itemFieldDef,
          })
        : source;
    const newKeys = [...keysRef.current];
    newKeys.splice(itemIndex + 1, 0, crypto.randomUUID());
    keysRef.current = newKeys;
    field.insertValue(itemIndex + 1, duplicate as TArrayType);
  }

  function handleRemove(itemIndex: number) {
    const newKeys = [...keysRef.current];
    newKeys.splice(itemIndex, 1);
    keysRef.current = newKeys;
    field.removeValue(itemIndex);
  }

  function handleMoveUp(itemIndex: number) {
    if (itemIndex === 0) return;
    const newKeys = [...keysRef.current];
    [newKeys[itemIndex - 1], newKeys[itemIndex]] = [newKeys[itemIndex]!, newKeys[itemIndex - 1]!];
    keysRef.current = newKeys;
    field.moveValue(itemIndex, itemIndex - 1);
  }

  function handleMoveDown(itemIndex: number) {
    if (itemIndex === items.length - 1) return;
    const newKeys = [...keysRef.current];
    [newKeys[itemIndex + 1], newKeys[itemIndex]] = [newKeys[itemIndex]!, newKeys[itemIndex + 1]!];
    keysRef.current = newKeys;
    field.moveValue(itemIndex, itemIndex + 1);
  }

  function handleReorder(from: number, to: number) {
    const newKeys = [...keysRef.current];
    const [moved] = newKeys.splice(from, 1);
    newKeys.splice(to, 0, moved!);
    keysRef.current = newKeys;
    field.moveValue(from, to);
  }

  const itemsHaveHeader = itemFieldDef.type === ADMIN_FIELDS.group.type;

  function collapseControls(placement: ActionPlacement) {
    return (
      <>
        <HeaderAction
          placement={placement}
          icon={<ChevronsDownUpIcon className="size-4" />}
          label="Collapse all"
          onClick={() => setOpenSignal((signal) => ({ version: signal.version + 1, open: false }))}
        />
        <HeaderAction
          placement={placement}
          icon={<ChevronsUpDownIcon className="size-4" />}
          label="Expand all"
          onClick={() => setOpenSignal((signal) => ({ version: signal.version + 1, open: true }))}
        />
      </>
    );
  }

  return (
    <div
      role="group"
      aria-labelledby={`${name}-label`}
      aria-disabled={readOnly}
      className="flex flex-col gap-3 rounded-sm border-2 px-3 py-2"
    >
      <div className="flex flex-col gap-1">
        <div className="flex min-h-8 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span
              id={`${name}-label`}
              className="relative flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
            >
              {index !== undefined ? `[${index + 1}] - ` : ""}
              {fieldDef.label || name}
              {fieldDef.required && <span className="text-red-500">*</span>}
            </span>
            {items.length > 0 && (
              <span className="text-xs text-muted-foreground tabular-nums">
                {items.length}
                {maxValue !== undefined ? `/${maxValue}` : ""} {arrayPluralLabel(fieldDef)}
              </span>
            )}
          </div>
          {itemsHaveHeader && items.length > 0 &&
            (compact ? (
              <ActionsMenu label={`${fieldDef.label || name} actions`}>
                {collapseControls("menu")}
              </ActionsMenu>
            ) : (
              <div className="flex shrink-0 items-center gap-1">{collapseControls("inline")}</div>
            ))}
        </div>
        <FormDescription field={fieldDef} />
      </div>
      {items.length > 0 ? (
        <Droppable id={name} wrapperKey={name} onReorder={handleReorder}>
          {items.map((_, itemIndex) => {
            const rawItem = items[itemIndex];
            const storedId = getStoredItemId(rawItem);
            const itemKey =
              isObjectShapedArrayItem(itemFieldDef) && storedId !== undefined
                ? storedId
                : (keysRef.current[itemIndex] ?? String(itemIndex));
            const dragHandle = <DragHandle disabled={readOnly} />;
            const actionProps = {
              itemIndex,
              itemCount: items.length,
              readOnly,
              atMax,
              itemLabel: fieldDef.label || name,
              onDuplicate: () => handleDuplicate(itemIndex),
              onMoveUp: () => handleMoveUp(itemIndex),
              onMoveDown: () => handleMoveDown(itemIndex),
              onRemove: () => handleRemove(itemIndex),
            };
            const itemActions = compact ? (
              <ActionsMenu label={`Item ${itemIndex + 1} actions`}>
                <SlotOutlet
                  slotId={SLOT_IDS.array.itemActions}
                  builtins={builtinItemActions}
                  contributions={projectItemActions}
                  contributedProps={{ ...actionProps, placement: "menu" } satisfies ArrayItemActionsProps}
                  conditionName={`${name}[${itemIndex}]`}
                />
              </ActionsMenu>
            ) : (
              <SlotOutlet
                slotId={SLOT_IDS.array.itemActions}
                builtins={builtinItemActions}
                contributions={projectItemActions}
                contributedProps={{ ...actionProps, placement: "inline" } satisfies ArrayItemActionsProps}
                conditionName={`${name}[${itemIndex}]`}
              />
            );
            const itemInput = (
              <form.Field name={`${name}[${itemIndex}]`}>
                {(subField) => (
                  <ItemInput
                    name={`${subField.name}`}
                    collection={collection}
                    fieldDef={itemFieldDef}
                    index={itemIndex}
                    readOnly={readOnly}
                  />
                )}
              </form.Field>
            );
            return (
              // `isDragDisabled` when read-only, so @hello-pangea/dnd nulls this
              // item's `dragHandleProps` and stops expecting a registered handle.
              // Without it the read-only `DragHandle` renders an inert div with no
              // handle props while the `Draggable` is still registered, and the
              // library logs "Unable to find drag handle" invariants on every
              // read-only render.
              <Draggable
                key={itemKey}
                id={`${name}-${itemKey}`}
                index={itemIndex}
                isDragDisabled={readOnly}
              >
                {itemsHaveHeader ? (
                  <ArrayItemHeaderContext.Provider
                    value={{ dragHandle, actions: itemActions, openSignal }}
                  >
                    <HideFieldLabelContext.Provider value={false}>{itemInput}</HideFieldLabelContext.Provider>
                  </ArrayItemHeaderContext.Provider>
                ) : (
                  <div className="flex items-start gap-2">
                    <div className="flex h-8 shrink-0 items-center gap-2">
                      {dragHandle}
                      <span className="w-4 text-center font-mono text-xs text-muted-foreground tabular-nums">
                        {itemIndex + 1}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <HideFieldLabelContext.Provider value>{itemInput}</HideFieldLabelContext.Provider>
                    </div>
                    <div className="flex h-8 shrink-0 items-center">{itemActions}</div>
                  </div>
                )}
              </Draggable>
            );
          })}
        </Droppable>
      ) : (
        <p className="text-muted-foreground text-sm">No {arrayPluralLabel(fieldDef)} yet.</p>
      )}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          disabled={readOnly || atMax}
          variant="outline"
          size="sm"
          onClick={handleAdd}
          icon="Plus"
        >
          Add {arrayItemLabel(fieldDef)}
        </Button>
        {atMax && (
          <span className="text-xs text-muted-foreground">
            Maximum {maxValue} {arrayPluralLabel(fieldDef)} reached
          </span>
        )}
      </div>

      <FormError field={field} submissionAttempts={submissionAttempts} />
    </div>
  );
}
