"use client";

import { useContext } from "react";
import { resolveFieldMask, type ComponentOverrideInput, type TextField as TextFieldDef } from "@vexcms/core";
import type { AnyFieldApi } from "@tanstack/react-form";
import { TextField } from "../../forms";
import type { FieldControlProps, FieldComponentProps } from "@vexcms/core";
import type { ReactHKT } from "../../adapter";
import { Input } from "../../ui/input";
import { useFieldMask } from "../useFieldMask";
import { useFieldControlOverride } from "../useFieldControlOverride";
import { VexConfigContext } from "../../config/VexConfigContext";
import { AdminFieldBinding } from "../AdminFieldBinding";

/**
 * Text admin field — maps `fieldDef` to `@vexcms/react/form`'s `TextField` props.
 *
 * @param props - {@link FieldComponentProps} narrowed to `TextField`.
 * @returns `TextField`, configured for this field instance.
 */
export function TextFieldAdmin(props: FieldComponentProps<{}, TextFieldDef> & { field?: AnyFieldApi }) {
  const config = useContext(VexConfigContext);
  const mask = resolveFieldMask({
    fieldType: props.fieldDef.type,
    fieldMask: props.fieldDef.admin.mask,
    inputMasks: config?.fields.inputMasks ?? {},
  });
  const maskRef = useFieldMask({ mask });
  function renderMaskedControl(controlProps: FieldControlProps<string>) {
    return (
      <Input
        id={controlProps.id}
        ref={maskRef}
        disabled={controlProps.readOnly}
        type="text"
        defaultValue={controlProps.value}
        onInput={(e) => controlProps.onChange(e.currentTarget.value)}
        onBlur={controlProps.onBlur}
        placeholder={props.fieldDef.admin.placeholder}
        readOnly={props.fieldDef.admin.readOnly}
        aria-required={props.fieldDef.required}
        aria-invalid={controlProps.invalid}
        aria-describedby={controlProps.describedBy}
      />
    );
  }
  function renderBareControl(controlProps: FieldControlProps<string>) {
    return (
      <Input
        id={controlProps.id}
        disabled={controlProps.readOnly}
        type="text"
        value={controlProps.value}
        onChange={(e) => controlProps.onChange(e.target.value)}
        onBlur={controlProps.onBlur}
        placeholder={props.fieldDef.admin.placeholder}
        readOnly={props.fieldDef.admin.readOnly}
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
    defaultControl: mask ? renderMaskedControl : renderBareControl,
  });
  return (
    <AdminFieldBinding name={props.name} field={props.field}>
      <TextField
        label={props.fieldDef.label || props.name}
        description={props.fieldDef.description}
        required={props.fieldDef.required}
        readOnly={props.readOnly || props.fieldDef.admin.readOnly}
      index={props.index}
        placeholder={props.fieldDef.admin.placeholder}
        maxLength={props.fieldDef.max?.[0]}
        renderControl={overrideControl ?? (mask ? renderMaskedControl : renderBareControl)}
      />
    </AdminFieldBinding>
  );
}
