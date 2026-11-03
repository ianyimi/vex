"use client";

import { type ComponentOverrideInput, type TextareaField as TextareaFieldDef } from "@vexcms/core";
import type { AnyFieldApi } from "@tanstack/react-form";
import { TextareaField } from "../../forms";
import type { FieldControlProps, FieldComponentProps } from "@vexcms/core";
import type { ReactHKT } from "../../adapter";
import { Textarea } from "../../ui/textarea";
import { useFieldControlOverride } from "../useFieldControlOverride";
import { AdminFieldBinding } from "../AdminFieldBinding";

/**
 * Textarea admin field — maps `fieldDef` to `@vexcms/react/form`'s `TextareaField` props.
 *
 * @param props - {@link FieldComponentProps} narrowed to `TextareaField`.
 * @returns `TextareaField`, configured for this field instance.
 */
export function TextareaFieldAdmin(props: FieldComponentProps<{}, TextareaFieldDef> & { field?: AnyFieldApi }) {
  function renderBareControl(controlProps: FieldControlProps<string>) {
    return (
      <Textarea
        id={controlProps.id}
        disabled={controlProps.readOnly}
        rows={props.fieldDef.rows}
        value={controlProps.value}
        onChange={(e) => controlProps.onChange(e.target.value)}
        onBlur={controlProps.onBlur}
        placeholder={props.fieldDef.admin.placeholder}
        readOnly={controlProps.readOnly}
        aria-required={props.fieldDef.required}
        aria-invalid={controlProps.invalid}
        aria-describedby={controlProps.describedBy}
      />
    );
  }
  const overrideControl = useFieldControlOverride<string>({
    fieldType: props.fieldDef.type,
    fieldOverrides: props.fieldDef.admin.components.Input as
      | ComponentOverrideInput<ReactHKT, FieldControlProps<string>>[]
      | undefined,
    defaultControl: renderBareControl,
  });
  return (
    <AdminFieldBinding name={props.name} field={props.field}>
      <TextareaField
        label={props.fieldDef.label || props.name}
        description={props.fieldDef.description}
        required={props.fieldDef.required}
        readOnly={props.readOnly || props.fieldDef.admin.readOnly}
      index={props.index}
        placeholder={props.fieldDef.admin.placeholder}
        rows={props.fieldDef.rows}
        maxLength={props.fieldDef.max?.[0]}
        renderControl={overrideControl}
      />
    </AdminFieldBinding>
  );
}
