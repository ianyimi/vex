"use client";

import { type ComponentOverrideInput, type BytesField as BytesFieldDef } from "@vexcms/core";
import type { AnyFieldApi } from "@tanstack/react-form";
import { BytesField, BytesControl } from "../../forms";
import type { FieldControlProps, FieldComponentProps } from "@vexcms/core";
import type { ReactHKT } from "../../adapter";
import { useFieldControlOverride } from "../useFieldControlOverride";
import { AdminFieldBinding } from "../AdminFieldBinding";

/**
 * Bytes admin field — maps `fieldDef` to `@vexcms/react/form`'s `BytesField` props.
 *
 * @param props - {@link FieldComponentProps} narrowed to `BytesField`.
 * @returns `BytesField`, configured for this field instance.
 */
export function BytesFieldAdmin(props: FieldComponentProps<{}, BytesFieldDef> & { field?: AnyFieldApi }) {
  function renderBareControl(controlProps: FieldControlProps<ArrayBuffer | undefined>) {
    return (
      <BytesControl
        {...controlProps}
        maxSize={props.fieldDef.maxSize}
        accept={props.fieldDef.accept}
        required={props.fieldDef.required}
      />
    );
  }
  const overrideControl = useFieldControlOverride<ArrayBuffer | undefined>({
    fieldType: props.fieldDef.type,
    fieldOverrides: props.fieldDef.admin.components.Input as
      | ComponentOverrideInput<ReactHKT, FieldControlProps<ArrayBuffer | undefined>>[]
      | undefined,
    defaultControl: renderBareControl,
  });
  return (
    <AdminFieldBinding name={props.name} field={props.field}>
      <BytesField
        label={props.fieldDef.label || props.name}
        description={props.fieldDef.description}
        required={props.fieldDef.required}
        readOnly={props.readOnly || props.fieldDef.admin.readOnly}
        index={props.index}
        maxSize={props.fieldDef.maxSize}
        accept={props.fieldDef.accept}
        renderControl={overrideControl}
      />
    </AdminFieldBinding>
  );
}
