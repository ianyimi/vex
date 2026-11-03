"use client";

import { useContext } from "react";
import { resolveFieldMask, type ComponentOverrideInput, type NumberField as NumberFieldDef } from "@vexcms/core";
import type { AnyFieldApi } from "@tanstack/react-form";
import { NumberField } from "../../forms";
import type { FieldControlProps, FieldComponentProps } from "@vexcms/core";
import type { ReactHKT } from "../../adapter";
import { Input } from "../../ui/input";
import { useFieldMask } from "../useFieldMask";
import { useFieldControlOverride } from "../useFieldControlOverride";
import { VexConfigContext } from "../../config/VexConfigContext";
import { AdminFieldBinding } from "../AdminFieldBinding";

/**
 * Number admin field — maps `fieldDef` to `@vexcms/react/form`'s `NumberField` props.
 *
 * @param props - {@link FieldComponentProps} narrowed to `NumberField`.
 * @returns `NumberField`, configured for this field instance.
 */
export function NumberFieldAdmin(props: FieldComponentProps<{}, NumberFieldDef> & { field?: AnyFieldApi }) {
  const config = useContext(VexConfigContext);
  const mask = resolveFieldMask({
    fieldType: props.fieldDef.type,
    fieldMask: props.fieldDef.admin.mask,
    inputMasks: config?.fields.inputMasks ?? {},
  });
  const maskRef = useFieldMask({ mask });
  function renderMaskedControl(controlProps: FieldControlProps<number>) {
    return (
      <Input
        id={controlProps.id}
        ref={maskRef}
        disabled={controlProps.readOnly}
        type="text"
        defaultValue={controlProps.value !== undefined ? String(controlProps.value) : ""}
        onInput={(e) => {
          const raw = e.currentTarget.value;
          controlProps.onChange(raw === "" ? (undefined as unknown as number) : Number(raw));
        }}
        onBlur={controlProps.onBlur}
        placeholder={props.fieldDef.admin.placeholder}
        readOnly={controlProps.readOnly}
        aria-required={props.fieldDef.required}
        aria-invalid={controlProps.invalid}
        aria-describedby={controlProps.describedBy}
      />
    );
  }
  function renderBareControl(controlProps: FieldControlProps<number>) {
    return (
      <Input
        id={controlProps.id}
        disabled={controlProps.readOnly}
        type="number"
        step={props.fieldDef.step}
        min={props.fieldDef.min?.[0]}
        max={props.fieldDef.max?.[0]}
        value={controlProps.value ?? 0}
        onChange={(e) =>
          controlProps.onChange(
            e.target.value === "" ? (undefined as unknown as number) : Number(e.target.value),
          )
        }
        onBlur={controlProps.onBlur}
        placeholder={props.fieldDef.admin.placeholder}
        readOnly={controlProps.readOnly}
        aria-required={props.fieldDef.required}
        aria-invalid={controlProps.invalid}
        aria-describedby={controlProps.describedBy}
      />
    );
  }
  const overrideControl = useFieldControlOverride<number>({
    fieldType: props.fieldDef.type,
    fieldOverrides: props.fieldDef.admin.components.Input as
      | ComponentOverrideInput<ReactHKT, FieldControlProps<number>>[]
      | undefined,
    defaultControl: mask ? renderMaskedControl : renderBareControl,
  });
  return (
    <AdminFieldBinding name={props.name} field={props.field}>
      <NumberField
        label={props.fieldDef.label || props.name}
        description={props.fieldDef.description}
        required={props.fieldDef.required}
        readOnly={props.readOnly || props.fieldDef.admin.readOnly}
      index={props.index}
        placeholder={props.fieldDef.admin.placeholder}
        step={props.fieldDef.step}
        min={props.fieldDef.min?.[0]}
        max={props.fieldDef.max?.[0]}
        renderControl={overrideControl ?? (mask ? renderMaskedControl : undefined)}
      />
    </AdminFieldBinding>
  );
}
