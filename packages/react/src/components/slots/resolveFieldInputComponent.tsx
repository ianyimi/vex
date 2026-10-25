import type { ComponentType } from "react";
import type {
  DataFieldType,
  ComponentOverrideInput,
  InputComponentProps,
} from "@vexcms/core";
import type { ReactHKT } from "../../adapter";
import { fieldToInputComponent } from "../fields/registry";

/**
 * Composes the final Input component for one field: built-in → root per-type `fields.<type>.Input`
 * chain → this field instance's own `admin.components.Input` chain, each override's `renderDefault`
 * resolving to the previous stage (S3). Memoized by its caller (`FieldSlotOutlet`, step 11) on the
 * same dependency array the field's own `admin.components.Input` and the root config's
 * `admin.components.fields[type]` change with.
 *
 * @throws {Error} When `fieldType` has no registered built-in (same failure mode the deleted
 *   `RenderFieldInputComponents` and the old `fieldToInputComponent` callers already threw).
 * @returns The composed Input component for this field type and override chain.
 */
export function resolveFieldInputComponent(props: {
  fieldType: DataFieldType;
  rootOverrides:
    ComponentOverrideInput<ReactHKT, InputComponentProps>[] | undefined;
  fieldOverrides:
    ComponentOverrideInput<ReactHKT, InputComponentProps>[] | undefined;
}): ComponentType<InputComponentProps> {
  const builtin = fieldToInputComponent(props.fieldType);
  if (!builtin) {
    throw new Error(`Missing component for field type '${props.fieldType}'`);
  }
  const chain = [
    ...(props.rootOverrides ?? []),
    ...(props.fieldOverrides ?? []),
  ];
  return chain.reduce<ComponentType<InputComponentProps>>(
    (renderDefault, override) => {
      const Override = override.component;
      function Composed(p: InputComponentProps) {
        return <Override {...p} renderDefault={renderDefault} />;
      }
      Composed.displayName = `FieldInputOverride(${override.id})`;
      return Composed;
    },
    builtin,
  );
}
