"use client";

import { type ComponentOverrideInput, type CheckboxField as CheckboxFieldDef } from "@vexcms/core";
import type { AnyFieldApi } from "@tanstack/react-form";
import { CheckboxField } from "../../forms";
import type { FieldControlProps, FieldComponentProps } from "@vexcms/core";
import type { ReactHKT } from "../../adapter";
import { Checkbox } from "../../ui/checkbox";
import { useFieldControlOverride } from "../useFieldControlOverride";
import { AdminFieldBinding } from "../AdminFieldBinding";

/**
 * Checkbox admin field — maps `fieldDef` to `@vexcms/react/form`'s `CheckboxField` props.
 *
 * @param props - {@link FieldComponentProps} narrowed to `CheckboxField`.
 * @returns `CheckboxField`, configured for this field instance.
 */
export function CheckboxFieldAdmin(props: FieldComponentProps<{}, CheckboxFieldDef> & { field?: AnyFieldApi }) {
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
    <AdminFieldBinding name={props.name} field={props.field}>
      <CheckboxField
        label={props.fieldDef.label || props.name}
        description={props.fieldDef.description}
        required={props.fieldDef.required}
        readOnly={props.readOnly || props.fieldDef.admin.readOnly}
      index={props.index}
        renderControl={overrideControl}
      />
    </AdminFieldBinding>
  );
}
