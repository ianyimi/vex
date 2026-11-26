"use client";

import { type ComponentOverrideInput, type CheckboxField as CheckboxFieldDef } from "@vexcms/core";
import type { AnyFieldApi } from "@tanstack/react-form";
import { CheckboxField, useFieldContext } from "../../forms";
import type { FieldControlProps, FieldComponentProps } from "@vexcms/core";
import type { ReactHKT } from "../../adapter";
import { Checkbox } from "../../ui/checkbox";
import { useFieldControlOverride } from "../useFieldControlOverride";
import { AdminFieldBinding } from "../AdminFieldBinding";
import { useNullToggle } from "../useNullToggle";

/**
 * Checkbox admin field's own render body — reads the `FieldApi` provided by
 * the enclosing `AdminFieldBinding` via `useFieldContext()` to compute the
 * null-toggle state/handler (via {@link useNullToggle}) the app form's
 * `CheckboxField` forwards to `NullFieldToggle`, and maps `fieldDef` to
 * `@vexcms/react/form`'s `CheckboxField` props.
 *
 * @param props - {@link FieldComponentProps} narrowed to `CheckboxField`.
 * @returns `CheckboxField`, configured for this field instance.
 */
function CheckboxFieldAdminInner(props: FieldComponentProps<{}, CheckboxFieldDef>) {
  const field = useFieldContext<boolean | null>();
  const { isNull, onIsNullChange } = useNullToggle({
    field,
    nullable: props.fieldDef.nullable,
    emptyValue: () => props.fieldDef.defaultValue,
  });
  function renderBareControl(controlProps: FieldControlProps<boolean>) {
    return (
      <Checkbox
        id={controlProps.id}
        required={props.fieldDef.required}
        readOnly={controlProps.readOnly}
        disabled={controlProps.readOnly}
        checked={controlProps.value ?? false}
        onCheckedChange={(checked) => controlProps.onChange(Boolean(checked))}
        onBlur={controlProps.onBlur}
        aria-invalid={controlProps.invalid}
        aria-describedby={controlProps.describedBy}
      />
    );
  }
  const overrideControl = useFieldControlOverride<boolean>({
    fieldType: props.fieldDef.type,
    fieldOverrides: props.fieldDef.admin.components.Input as
      | ComponentOverrideInput<ReactHKT, FieldControlProps<boolean>>[]
      | undefined,
    defaultControl: renderBareControl,
  });
  return (
    <CheckboxField
      label={props.fieldDef.label || props.name}
      description={props.fieldDef.description}
      required={props.fieldDef.required}
      readOnly={props.readOnly || props.fieldDef.admin.readOnly}
      index={props.index}
      renderControl={overrideControl}
      isNull={isNull}
      onIsNullChange={onIsNullChange}
    />
  );
}

/**
 * Checkbox admin field — binds `props.name` to the nearest `<AppForm>` (or
 * an explicit `field` prop) via `AdminFieldBinding`, then renders the app
 * form's `CheckboxField`.
 *
 * @param props - {@link FieldComponentProps} narrowed to `CheckboxField`.
 * @returns `CheckboxField`, configured for this field instance.
 */
export function CheckboxFieldAdmin(props: FieldComponentProps<{}, CheckboxFieldDef> & { field?: AnyFieldApi }) {
  return (
    <AdminFieldBinding name={props.name} field={props.field}>
      <CheckboxFieldAdminInner {...props} />
    </AdminFieldBinding>
  );
}
