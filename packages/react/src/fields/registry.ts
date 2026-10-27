import type { ComponentType } from "react";
import {
  type AdminField,
  type AdminDataField,
  type DataFieldType,
  type BaseFieldMeta,
  type CellComponentProps,
  type FieldComponentProps,
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
