import type { ComponentType } from "react";
import {
  type AdminField,
  type AdminDataField,
  type DataFieldType,
  type BaseFieldMeta,
  type CellComponentProps,
  type CellRow,
  type DisplayComponentProps,
  type FieldComponentProps,
  type FilterInputProps,
} from "@vexcms/core";
import { reactAdapter } from "../adapter";

/**
 * Returns the BUILT-IN admin field component registered for a field type via
 * `reactAdapter.fields` — the one source of truth both this and
 * {@link fieldToCellComponent} derive from. Does NOT resolve override chains —
 * callers that need the fully-resolved component use `resolveFieldComponent`
 * (this step's renamed `resolveFieldComponent.tsx`) instead; this stays
 * the "what is the TRUE default" primitive that chain's innermost
 * `renderDefault` composes from.
 *
 * @param field - The `DataFieldType` string to look up — UI field types (`tabs`/`collapsible`/
 *   `row`/`ui`) never reach this registry, since they have no renderable Field/Cell.
 * @returns The registered component, or `undefined` for an unregistered type.
 */
export function fieldToFieldComponent(
  field: DataFieldType,
): ComponentType<FieldComponentProps<BaseFieldMeta, AdminField>> | undefined {
  return reactAdapter.fields[field]?.field as
    ComponentType<FieldComponentProps<BaseFieldMeta, AdminField>> | undefined;
}

/**
 * Returns the BUILT-IN cell component registered for a field type via `reactAdapter.fields`. Same
 * single-source-of-truth replacement as {@link fieldToFieldComponent}; `getCollectionColumnDefs`'s
 * existing call site is unchanged — it already resolves overrides for free once this function's
 * caller (`resolveFieldCellComponent`, used by `getCollectionColumnDefs`) composes the chain.
 *
 * @param field - The `DataFieldType` string to look up — UI field types never reach this registry.
 * @returns The registered component, or `undefined` for an unregistered type.
 */
export function fieldToCellComponent(
  field: DataFieldType,
): ComponentType<CellComponentProps<AdminDataField>> | undefined {
  return reactAdapter.fields[field]?.cell as
    ComponentType<CellComponentProps<AdminDataField>> | undefined;
}

/**
 * Returns the BUILT-IN filter row value control registered for a field
 * type via `reactAdapter.fields`. Same single-source-of-
 * truth shape as {@link fieldToFieldComponent}/{@link fieldToCellComponent},
 * but OPTIONAL by design — `json`/`richtext`/`array`/`blocks`/`group`
 * (and every UI-only type) register none, so `ListViewFilterBuilder.tsx`'s
 * call site renders a stable placeholder cell instead when this returns
 * `undefined`.
 *
 * @param field - The `DataFieldType` string to look up.
 * @returns The registered component, or `undefined` when this type has no filter value control.
 */
export function fieldToFilterInputComponent(
  field: DataFieldType,
): ComponentType<FilterInputProps<AdminDataField>> | undefined {
  return reactAdapter.fields[field]?.filterInput as
    ComponentType<FilterInputProps<AdminDataField>> | undefined;
}

/**
 * Adapts a `CellComponentProps`-shaped Cell into a `DisplayComponentProps`-
 * shaped component — the fallback {@link fieldToDisplayComponent} renders
 * for any type with no registered `display` of its own. Wraps `document`
 * into the fake single-row `CellRow` a Cell expects, forces
 * `isTitleField: false` (a Display never renders as an edit-view link —
 * its caller's own "Open" affordance already covers navigation), and
 * passes an empty `fieldKey` (every Cell actually reached through this
 * fallback — the "may delegate" scalar types per the polish round's own
 * decision — reads `props.value`, never `row.original[fieldKey]`; the
 * richer types that DO key off `fieldKey`, relationship/upload, register
 * their own dedicated `display` and never reach this adapter).
 *
 * @param Cell - The registered Cell component to adapt.
 * @returns A component accepting {@link DisplayComponentProps} that renders `Cell`.
 */
function cellAsDisplay<TField extends AdminDataField>(
  Cell: ComponentType<CellComponentProps<TField>>,
): ComponentType<DisplayComponentProps<TField>> {
  function CellAsDisplay(props: DisplayComponentProps<TField>) {
    const row = { original: props.document } as unknown as CellRow;
    return (
      <Cell
        value={props.value}
        row={row}
        fieldDef={props.field}
        fieldKey=""
        isTitleField={false}
        collection={props.collection}
      />
    );
  }
  return CellAsDisplay;
}

/**
 * Returns the BUILT-IN read-only display component registered for a field
 * type via `reactAdapter.fields` (polish round), falling back to
 * {@link fieldToCellComponent}'s own registered Cell (adapted via
 * {@link cellAsDisplay}) when no `display` is registered — every data
 * field type resolves to SOMETHING here, unlike {@link fieldToFilterInputComponent}'s
 * genuine `undefined` case.
 *
 * @param field - The `DataFieldType` string to look up.
 * @returns The registered (or Cell-derived) display component, or `undefined`
 *   only when the type has neither a `display` nor a `cell` registered.
 */
export function fieldToDisplayComponent(
  field: DataFieldType,
): ComponentType<DisplayComponentProps<AdminDataField>> | undefined {
  const registered = reactAdapter.fields[field]?.display as
    | ComponentType<DisplayComponentProps<AdminDataField>>
    | undefined;
  if (registered) return registered;
  const Cell = fieldToCellComponent(field);
  return Cell ? cellAsDisplay(Cell) : undefined;
}
