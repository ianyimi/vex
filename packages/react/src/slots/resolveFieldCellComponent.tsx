import type { ComponentType } from "react";
import type {
  AdminDataField,
  DataFieldType,
  CellComponentProps,
  ComponentOverrideInput,
} from "@vexcms/core";
import type { ReactHKT } from "../adapter";
import { fieldToCellComponent } from "../fields/registry";
import { ComponentErrorBoundary } from "./ComponentErrorBoundary";

/**
 * Composes the final Cell component for one field: built-in → root per-type `fields.<type>.Cell`
 * chain → this field instance's own `admin.components.Cell` chain. Identical composition to
 * {@link resolveFieldComponent}, over `fieldToCellComponent`/`CellComponentProps`.
 * `getCollectionColumnDefs` (`packages/react/src/components/fields/index.tsx`, unchanged call
 * site) calls this instead of the bare registry lookup, which is how Step 17's "DataTable cells
 * resolve `field.cell` through the registry" requirement is met with no `DataTable.tsx` edit.
 *
 * @throws {Error} When `fieldType` has no registered built-in.
 * @returns The composed Cell component for this field type and override chain.
 */
export function resolveFieldCellComponent(props: {
  fieldType: DataFieldType;
  rootOverrides:
    | ComponentOverrideInput<ReactHKT, CellComponentProps<AdminDataField>>[]
    | undefined;
  fieldOverrides:
    | ComponentOverrideInput<ReactHKT, CellComponentProps<AdminDataField>>[]
    | undefined;
}): ComponentType<CellComponentProps<AdminDataField>> {
  const builtin = fieldToCellComponent(props.fieldType);
  if (!builtin) {
    throw new Error(`Missing component for field type '${props.fieldType}'`);
  }
  const chain = [
    ...(props.rootOverrides ?? []),
    ...(props.fieldOverrides ?? []),
  ];
  return chain.reduce<ComponentType<CellComponentProps<AdminDataField>>>(
    (RenderDefault, override) => {
      const Override = override.component;
      function Composed(p: CellComponentProps<AdminDataField>) {
        return (
          <ComponentErrorBoundary id={override.id} fallback={<RenderDefault {...p} />}>
            <Override {...p} renderDefault={RenderDefault} />
          </ComponentErrorBoundary>
        );
      }
      Composed.displayName = `FieldCellOverride(${override.id})`;
      return Composed;
    },
    builtin,
  );
}
