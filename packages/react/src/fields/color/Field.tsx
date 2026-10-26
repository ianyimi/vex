"use client";

import { type ComponentOverrideInput, type ColorField as ColorFieldDef } from "@vexcms/core";
import type { AnyFieldApi } from "@tanstack/react-form";
import { ColorField } from "../../forms";
import type { FieldControlProps, FieldComponentProps } from "@vexcms/core";
import type { ReactHKT } from "../../adapter";
import { Input } from "../../ui/input";
import { useFieldControlOverride } from "../useFieldControlOverride";
import { AdminFieldBinding } from "../AdminFieldBinding";

/**
 * Colour admin field — maps `fieldDef` to `@vexcms/react/form`'s `ColorField` props.
 *
 * @param props - {@link FieldComponentProps} narrowed to `ColorField`.
 * @returns `ColorField`, configured for this field instance.
 */
export function ColorFieldAdmin(props: FieldComponentProps<{}, ColorFieldDef> & { field?: AnyFieldApi }) {
  function renderBareControl(controlProps: FieldControlProps<string>) {
    return (
      <Input
        id={controlProps.id}
        type="text"
        className="font-mono"
        disabled={controlProps.readOnly}
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
    defaultControl: renderBareControl,
  });
  return (
    <AdminFieldBinding name={props.name} field={props.field}>
      <ColorField
        label={props.fieldDef.label || props.name}
        description={props.fieldDef.description}
        required={props.fieldDef.required}
        readOnly={props.readOnly || props.fieldDef.admin.readOnly}
      index={props.index}
        format={props.fieldDef.format}
        themeColors={props.fieldDef.themeColors}
        placeholder={props.fieldDef.admin.placeholder}
        renderControl={overrideControl}
      />
    </AdminFieldBinding>
  );
}
