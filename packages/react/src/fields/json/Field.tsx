"use client";

import { type ComponentOverrideInput, type JsonField as JsonFieldDef } from "@vexcms/core";
import type { AnyFieldApi } from "@tanstack/react-form";
import { JsonField, useFieldContext } from "../../forms";
import type { FieldControlProps, FieldComponentProps } from "@vexcms/core";
import type { ReactHKT } from "../../adapter";
import { JsonEditor } from "../../ui/JsonEditor";
import { useFieldControlOverride } from "../useFieldControlOverride";
import { AdminFieldBinding } from "../AdminFieldBinding";

/**
 * JSON admin field's own render body — reads the `FieldApi` provided by the
 * enclosing `AdminFieldBinding` to compute the null-toggle state/handler
 * when `fieldDef.nullable`, and maps `fieldDef` to `@vexcms/react/form`'s
 * `JsonField` props.
 *
 * @param props - {@link FieldComponentProps} narrowed to `JsonField`.
 * @returns `JsonField`, configured for this field instance.
 */
function JsonFieldAdminInner(props: FieldComponentProps<{}, JsonFieldDef>) {
  const field = useFieldContext<unknown>();
  const isNull = Boolean(props.fieldDef.nullable) && field.state.value === null;
  const onIsNullChange = props.fieldDef.nullable
    ? (nextIsNull: boolean) => field.handleChange(nextIsNull ? null : props.fieldDef.defaultValue)
    : undefined;
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
    <JsonField
      label={props.fieldDef.label || props.name}
      description={props.fieldDef.description}
      required={props.fieldDef.required}
      readOnly={props.readOnly || props.fieldDef.admin.readOnly}
      index={props.index}
      placeholder={props.fieldDef.admin.placeholder}
      renderControl={overrideControl}
      isNull={isNull}
      onIsNullChange={onIsNullChange}
    />
  );
}

/**
 * JSON admin field — binds `props.name` to the nearest `<AppForm>` (or an
 * explicit `field` prop) via `AdminFieldBinding`, then renders the field's
 * own body.
 *
 * @param props - {@link FieldComponentProps} narrowed to `JsonField`.
 * @returns `JsonField`, configured for this field instance.
 */
export function JsonFieldAdmin(props: FieldComponentProps<{}, JsonFieldDef> & { field?: AnyFieldApi }) {
  return (
    <AdminFieldBinding name={props.name} field={props.field}>
      <JsonFieldAdminInner {...props} />
    </AdminFieldBinding>
  );
}
