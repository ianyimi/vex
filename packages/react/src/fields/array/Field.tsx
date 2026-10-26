"use client";

import { useContext } from "react";
import type { AnyFieldApi } from "@tanstack/react-form";
import type { ArrayField as ArrayFieldDef, ArrayType } from "@vexcms/core";
import {
  ADMIN_FIELDS,
  arrayItemLabel,
  arrayPluralLabel,
  BUILTIN_CONTRIBUTION_IDS,
  isObjectShapedArrayItem,
  SLOT_IDS,
  withArrayItemId,
  type ComponentContributionInput,
  type FieldComponentProps,
} from "@vexcms/core";
import { ArrowDownIcon, ArrowUpIcon, CopyIcon, TrashIcon } from "lucide-react";
import { ArrayField, GroupField, useFieldContext } from "../../forms";
import type { ReactHKT } from "../../adapter";
import { VexConfigContext } from "../../config";
import { SlotOutlet } from "../../slots/SlotOutlet";
import { ActionsMenu, SurfacedAction, type ActionPlacement } from "../../ui/ActionsMenu";
import { RenderFields } from "../RenderFields";
import { fieldToFieldComponent } from "../registry";
import { AdminFieldBinding } from "../AdminFieldBinding";

/**
 * Props the `array.item.actions` slot's contributed component receives —
 * unchanged from `FormArray.tsx`'s own `ArrayItemActionsProps`.
 */
export interface ArrayItemActionsProps {
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
 * remove — each rendered through `SurfacedAction`. Ported verbatim from
 * `FormArray.tsx:65-119`.
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
 * Renders a scalar (non-object) array item's own admin field, resolved from
 * the registry the same way a top-level leaf field is — the item type's
 * `*FieldAdmin` component mounted against the item's own `name` path, with
 * no `fieldset`/label chrome of its own (the enclosing `ArrayFieldAdmin`'s
 * row already supplies drag handle, index and item actions). `index` still
 * reaches the control's own (visually hidden) label, so a screen reader
 * still announces each item's position even though the digit is only shown
 * visually in the row's gutter.
 *
 * @param props - The item's form path (`name`), its field definition, its
 *   position in the array, the enclosing collection/global (forwarded
 *   unchanged), and whether the array (and therefore the item) is read-only.
 * @returns The item type's admin field, mounted at `name`.
 */
function PrimitiveArrayItemControl(props: {
  name: string;
  itemType: ArrayFieldDef<any, ArrayType>["items"];
  index: number;
  readOnly: boolean;
  collection: FieldComponentProps["collection"];
}) {
  const ItemFieldAdmin = fieldToFieldComponent(props.itemType.type);
  if (!ItemFieldAdmin) {
    throw new Error("invalid array.items field type set");
  }
  return (
    <ItemFieldAdmin
      name={props.name}
      fieldDef={props.itemType}
      index={props.index}
      readOnly={props.readOnly}
      collection={props.collection}
    />
  );
}

/**
 * The array field's own render body — reads the `FieldApi` provided by the
 * enclosing `AdminFieldBinding` via `useFieldContext()`, and maps `fieldDef`
 * to the app form's `ArrayField`: item labels, `renderItem` (each item's
 * child fields via `RenderFields`, unwrapped for a primitive item type,
 * grouped for an object-shaped one via `isObjectShapedArrayItem`), and the
 * `array.item.actions` slot (built-ins + project contributions via
 * `SlotOutlet`). Duplicate/move/remove are implemented here directly
 * against the field's imperative API — `ArrayField` itself owns no item
 * mutation beyond `add`/`reorder`, by design (every item action is this
 * caller's own).
 *
 * @param props - {@link FieldComponentProps} narrowed to `ArrayField`, for this item's own level of nesting.
 * @returns The array's `ArrayField` body, wrapped in a labelled group.
 */
function ArrayFieldAdminInner(props: FieldComponentProps<{}, ArrayFieldDef<any, ArrayType>>) {
  const field = useFieldContext<ArrayType[]>();
  const config = useContext(VexConfigContext);
  const projectItemActions = config?.admin.components.array.itemActions as unknown as
    | ComponentContributionInput<ReactHKT, ArrayItemActionsProps>[]
    | undefined;

  const itemFieldDef = props.fieldDef.items;
  const items: ArrayType[] = field.state.value ?? [];
  const maxValue = props.fieldDef.max?.[0];
  const atMax = maxValue !== undefined && items.length >= maxValue;
  const readOnly = props.readOnly || props.fieldDef.admin.readOnly;
  const itemsHaveOwnHeader = itemFieldDef.type === ADMIN_FIELDS.group.type;

  return (
    <div role="group" aria-labelledby={`${field.name}-label`} aria-disabled={readOnly}>
      <ArrayField
        label={props.fieldDef.label || props.name}
        description={props.fieldDef.description}
        required={props.fieldDef.required}
        index={props.index}
        itemLabel={arrayItemLabel(props.fieldDef)}
        pluralLabel={arrayPluralLabel(props.fieldDef)}
        max={maxValue}
        readOnly={readOnly}
        itemsHaveOwnHeader={itemsHaveOwnHeader}
        createItem={() =>
          withArrayItemId({ item: itemFieldDef.defaultValue as ArrayType, itemField: itemFieldDef })
        }
        cloneItem={(item) =>
          withArrayItemId({
            item:
              typeof item === "object" && item !== null
                ? { ...(item as Record<string, unknown>), id: undefined }
                : item,
            itemField: itemFieldDef,
          })
        }
        getStoredId={(item) => {
          if (!isObjectShapedArrayItem(itemFieldDef)) return undefined;
          if (typeof item !== "object" || item === null || !("id" in item)) return undefined;
          return typeof item.id === "string" ? item.id : undefined;
        }}
        renderItem={({ name: itemName, index }) =>
          itemFieldDef.type === ADMIN_FIELDS.group.type ? (
            <AdminFieldBinding name={itemName}>
              <GroupField
                label={itemFieldDef.label || itemName}
                description={itemFieldDef.description}
                index={index}
                fieldCount={Object.keys(itemFieldDef.fields).length}
                defaultOpen={!itemFieldDef.admin.defaultCollapsed}
              >
                <RenderFields
                  fields={itemFieldDef.fields}
                  collection={props.collection}
                  namePrefix={itemName}
                  readOnly={readOnly}
                />
              </GroupField>
            </AdminFieldBinding>
          ) : (
            <PrimitiveArrayItemControl
              name={itemName}
              itemType={itemFieldDef}
              index={index}
              readOnly={readOnly}
              collection={props.collection}
            />
          )
        }
        itemActions={({ index, itemCount, placement, onDuplicate, onMoveUp, onMoveDown, onRemove }) => {
          const slot = (
            <SlotOutlet
              slotId={SLOT_IDS.array.itemActions}
              builtins={builtinItemActions}
              contributions={projectItemActions}
              contributedProps={{
                itemIndex: index,
                itemCount,
                readOnly,
                atMax,
                itemLabel: props.fieldDef.label || props.name,
                placement,
                onDuplicate,
                onMoveUp,
                onMoveDown,
                onRemove,
              }}
              conditionName={`${field.name}[${index}]`}
            />
          );
          return placement === "menu" ? (
            <ActionsMenu label={`Item ${index + 1} actions`}>{slot}</ActionsMenu>
          ) : (
            slot
          );
        }}
      />
    </div>
  );
}

/**
 * Array admin field — binds `props.name` to the nearest `<AppForm>` (or an
 * explicit `field` prop) via `AdminFieldBinding`, then renders the app
 * form's `ArrayField` configured for this field instance.
 *
 * @param props - {@link FieldComponentProps} narrowed to `ArrayField`.
 * @returns The app form's `ArrayField`, configured for this field instance.
 */
export function ArrayFieldAdmin(
  props: FieldComponentProps<{}, ArrayFieldDef<any, ArrayType>> & { field?: AnyFieldApi },
) {
  return (
    <AdminFieldBinding name={props.name} field={props.field}>
      <ArrayFieldAdminInner {...props} />
    </AdminFieldBinding>
  );
}
