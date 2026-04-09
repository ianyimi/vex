import {
  InputComponentProps,
  AdminField,
  CollectionConfig,
} from "@vexcms/core";
import { ComponentPropsWithRef, ComponentType } from "react";
import { TextFieldInput } from "./text";
import { ADMIN_FIELDS, type AdminFieldType } from "@vexcms/core";
import { cn } from "../../styles/utils";

export * from "./text";

/**
 * Maps every `AdminFieldType` string to its corresponding input component.
 *
 * Mirrors `reactAdapter.fields` — both must be kept in sync when a new
 * field type is added to `@vexcms/core`.
 */
export const fieldInputComponents: Record<
  AdminFieldType,
  ComponentType<InputComponentProps<AdminField>>
> = {
  [ADMIN_FIELDS.text.type]: TextFieldInput,
};

/**
 * Renders all field input components for a collection's fields.
 *
 * Iterates `fields`, looks up the matching input component from
 * `fieldInputComponents`, and renders each one. Fields whose type has no
 * registered component are skipped. All remaining `div` props (e.g.
 * `className`) are forwarded to the wrapping `<div>`.
 *
 * Must be rendered inside `<AppForm>` — each input reads the TanStack Form
 * instance from `AppFormContext`.
 *
 * @param props - Component props.
 * @param props.fields - The `fields` object from a `CollectionConfig`.
 * @param props.className - Optional CSS class merged with the base `"relative"` class.
 * @returns A `<div>` containing one input component per field in the collection.
 *
 * @example
 * ```tsx
 * <AppForm form={form}>
 *   <RenderFieldInputComponents fields={collection.fields} className="flex flex-col gap-4" />
 * </AppForm>
 * ```
 */
export function RenderFieldInputComponents(
  props: { fields: CollectionConfig["fields"] } & ComponentPropsWithRef<"div">,
) {
  const { fields, className, ...divProps } = props;
  return (
    <div className={cn("relative", className)} {...divProps}>
      {Object.entries(fields).map(([fieldKey, field]) => {
        const FieldInput = fieldInputComponents[field.type];
        if (!FieldInput) return null;
        return (
          <FieldInput
            key={field.label || field.type}
            name={fieldKey}
            fieldDef={field}
            readOnly={field.admin.readOnly}
          />
        );
      })}
    </div>
  );
}

/**
 * Returns the input component registered for a given field type, or
 * `undefined` if none is registered.
 *
 * Used by `CollectionEditView` to render one input per field without
 * importing each component directly.
 *
 * @param field - The `AdminFieldType` string (e.g. `"text"`).
 * @returns The matching `ComponentType`, or `undefined` if the type is unknown.
 */
export function fieldToInputComponent(field: AdminFieldType) {
  return fieldInputComponents[field];
}
