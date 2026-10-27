"use client";

import { type ComponentOverrideInput, type JsonField as JsonFieldDef } from "@vexcms/core";
import type { AnyFieldApi } from "@tanstack/react-form";
import { JsonField } from "../../forms";
import type { FieldControlProps, FieldComponentProps } from "@vexcms/core";
import type { ReactHKT } from "../../adapter";
import { JsonEditor } from "../../ui/JsonEditor";
import { useFieldControlOverride } from "../useFieldControlOverride";
import { AdminFieldBinding } from "../AdminFieldBinding";

/**
 * JSON admin field — maps `fieldDef` to `@vexcms/react/form`'s `JsonField` props.
 *
 * @param props - {@link FieldComponentProps} narrowed to `JsonField`.
 * @returns `JsonField`, configured for this field instance.
 */
export function JsonFieldAdmin(props: FieldComponentProps<{}, JsonFieldDef> & { field?: AnyFieldApi }) {
  function renderBareControl(controlProps: FieldControlProps<unknown>) {
    return (
      <JsonEditor
        id={controlProps.id}
        value={JSON.stringify(controlProps.value ?? null, null, 2)}
        onChange={(text) => {
          try {
            controlProps.onChange(JSON.parse(text));
          } catch {
            // left uncommitted — the override's own control owns parse-error surfacing
          }
        }}
        onBlur={controlProps.onBlur}
        readOnly={controlProps.readOnly}
        placeholder={props.fieldDef.admin.placeholder}
        aria-invalid={controlProps.invalid}
        aria-describedby={controlProps.describedBy}
        aria-required={props.fieldDef.required}
      />
    );
  }
  const overrideControl = useFieldControlOverride<unknown>({
    fieldType: props.fieldDef.type,
    fieldOverrides: props.fieldDef.admin.components.Input as
      | ComponentOverrideInput<ReactHKT, FieldControlProps<unknown>>[]
      | undefined,
    defaultControl: renderBareControl,
  });
  return (
    <AdminFieldBinding name={props.name} field={props.field}>
      <JsonField
        label={props.fieldDef.label || props.name}
        description={props.fieldDef.description}
        required={props.fieldDef.required}
        readOnly={props.readOnly || props.fieldDef.admin.readOnly}
        index={props.index}
        placeholder={props.fieldDef.admin.placeholder}
        renderControl={overrideControl}
      />
    </AdminFieldBinding>
  );
}
