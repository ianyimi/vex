"use client";

import { useContext } from "react";
import {
  isInt64NumberField,
  resolveFieldMask,
  type ComponentOverrideInput,
  type Float64NumberField,
  type Int64NumberField,
  type NumberField as NumberFieldDef,
} from "@vexcms/core";
import type { AnyFieldApi } from "@tanstack/react-form";
import { NumberField, BigintNumberControl } from "../../forms";
import type { FieldControlProps, FieldComponentProps } from "@vexcms/core";
import type { ReactHKT } from "../../adapter";
import { Input } from "../../ui/input";
import { useFieldMask } from "../useFieldMask";
import { useFieldControlOverride } from "../useFieldControlOverride";
import { VexConfigContext } from "../../config/VexConfigContext";
import { AdminFieldBinding } from "../AdminFieldBinding";

function Int64NumberFieldAdmin(props: FieldComponentProps<{}, Int64NumberField> & { field?: AnyFieldApi }) {
  function renderInt64Control(controlProps: FieldControlProps<bigint>) {
    return (
      <BigintNumberControl
        {...controlProps}
        placeholder={props.fieldDef.admin.placeholder}
        required={props.fieldDef.required}
      />
    );
  }
  const overrideControl = useFieldControlOverride<bigint>({
    fieldType: props.fieldDef.type,
    fieldOverrides: props.fieldDef.admin.components.Input as
      | ComponentOverrideInput<ReactHKT, FieldControlProps<bigint>>[]
      | undefined,
    defaultControl: renderInt64Control,
  });
  return (
    <AdminFieldBinding name={props.name} field={props.field}>
      <NumberField
        bigint
        label={props.fieldDef.label || props.name}
        description={props.fieldDef.description}
        required={props.fieldDef.required}
        readOnly={props.readOnly || props.fieldDef.admin.readOnly}
        index={props.index}
        placeholder={props.fieldDef.admin.placeholder}
        min={props.fieldDef.min?.[0]}
        max={props.fieldDef.max?.[0]}
        renderControl={overrideControl}
      />
    </AdminFieldBinding>
  );
}

function Float64NumberFieldAdmin(props: FieldComponentProps<{}, Float64NumberField> & { field?: AnyFieldApi }) {
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
        defaultValue={controlProps.value !== undefined && controlProps.value !== null ? String(controlProps.value) : ""}
        onFocus={(e) => e.currentTarget.select()}
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
        value={controlProps.value ?? ""}
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

/**
 * Number admin field — maps `fieldDef` to `@vexcms/react/form`'s `NumberField` props.
 * Dispatches to {@link Int64NumberFieldAdmin} or {@link Float64NumberFieldAdmin} by
 * `schema.validator` — each mounts its own fixed hook set, so switching between them
 * (stable for a given field instance, driven by the collection config, never by
 * per-render state) never calls a different NUMBER of hooks the way branching
 * inside one component's body would.
 *
 * @param props - {@link FieldComponentProps} narrowed to `NumberField`.
 * @returns `NumberField`, configured for this field instance.
 */
export function NumberFieldAdmin(props: FieldComponentProps<{}, NumberFieldDef> & { field?: AnyFieldApi }) {
  const { renderDefault: _renderDefault, ...rest } = props;
  if (isInt64NumberField(props.fieldDef)) {
    return <Int64NumberFieldAdmin {...rest} fieldDef={props.fieldDef} />;
  }
  return <Float64NumberFieldAdmin {...rest} fieldDef={props.fieldDef} />;
}
