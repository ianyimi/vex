import { InputComponentProps, AdminField } from "@vexcms/core";
import { ComponentType } from "react";
import { TextFieldInput } from "./text";
import { ADMIN_FIELDS, type AdminFieldType } from "@vexcms/core";

export * from "./text";

/**
 * Local map from field type string to its input component.
 * Mirrors `reactAdapter.fields` — both live in `@vexcms/react`.
 * Add a new entry here whenever a new field type is added to core.
 */
export const fieldInputs: Record<
  AdminFieldType,
  ComponentType<InputComponentProps<AdminField>>
> = {
  [ADMIN_FIELDS.text.type]: TextFieldInput,
};

/**
 * (field: {@link AdminFieldType}) => {@link ComponentType}
 * @param field The {@link AdminFieldType}
 * @returns A React {@link ComponentType}
 */
export function fieldToInputComponent(field: AdminFieldType) {
  return fieldInputs[field];
}
