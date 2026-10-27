import type { ComponentType } from "react";
import type {
  DataFieldType,
  ComponentOverrideInput,
  FieldComponentProps,
} from "@vexcms/core";
import type { ReactHKT } from "../adapter";
import { fieldToFieldComponent } from "../fields/registry";
import { ComponentErrorBoundary } from "./ComponentErrorBoundary";

/**
 * Composes the final admin `Field` component for one field: built-in → root
 * per-type `fields.<type>.Field` chain → this field instance's own
 * `admin.components.Field` chain, each override's `renderDefault` resolving
 * to the previous stage (S3) — same composition `resolveFieldInputComponent`
 * used for `Input` before this step. The field instance's/root's `Input`
 * override chain is NOT composed here: each built-in `Field.tsx` resolves it
 * itself via `useFieldControlOverride`, threading the result into the
 * `@vexcms/react/form` field component's own `renderControl` prop — a
 * `Field` override that wants to keep the resolved `Input` override calls
 * `renderDefault` rather than re-deriving it.
 *
 * @throws {Error} When `fieldType` has no registered built-in.
 * @returns The composed `Field` component for this field type and override chain.
 */
export function resolveFieldComponent(props: {
  fieldType: DataFieldType;
  rootOverrides: ComponentOverrideInput<ReactHKT, FieldComponentProps>[] | undefined;
  fieldOverrides: ComponentOverrideInput<ReactHKT, FieldComponentProps>[] | undefined;
}): ComponentType<FieldComponentProps> {
  const builtin = fieldToFieldComponent(props.fieldType);
  if (!builtin) {
    throw new Error(`Missing component for field type '${props.fieldType}'`);
  }
  const chain = [...(props.rootOverrides ?? []), ...(props.fieldOverrides ?? [])];
  return chain.reduce<ComponentType<FieldComponentProps>>((RenderDefault, override) => {
    const Override = override.component;
    function Composed(p: FieldComponentProps) {
      return (
        <ComponentErrorBoundary id={override.id} fallback={<RenderDefault {...p} />}>
          <Override {...p} renderDefault={RenderDefault} />
        </ComponentErrorBoundary>
      );
    }
    Composed.displayName = `FieldOverride(${override.id})`;
    return Composed;
  }, builtin);
}
