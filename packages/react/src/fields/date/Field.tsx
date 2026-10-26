"use client";

import { useCallback, useMemo } from "react";
import { type ComponentOverrideInput, type DateField as DateFieldDef } from "@vexcms/core";
import type { AnyFieldApi } from "@tanstack/react-form";
import { DateField } from "../../forms";
import type { FieldControlProps, FieldComponentProps } from "@vexcms/core";
import type { ReactHKT } from "../../adapter";
import { DateTimePicker } from "../../ui/datetime/date-picker";
import { useFieldControlOverride } from "../useFieldControlOverride";
import { AdminFieldBinding } from "../AdminFieldBinding";

/**
 * Date admin field — maps `fieldDef` to `@vexcms/react/form`'s `DateField` props.
 *
 * @param props - {@link FieldComponentProps} narrowed to `DateField`.
 * @returns `DateField`, configured for this field instance.
 */
export function DateFieldAdmin(props: FieldComponentProps<{}, DateFieldDef> & { field?: AnyFieldApi }) {
  function renderBareControl(controlProps: FieldControlProps<number | undefined>) {
    return <DateBareControl controlProps={controlProps} fieldDef={props.fieldDef} name={props.name} />;
  }
  const overrideControl = useFieldControlOverride<number | undefined>({
    fieldType: props.fieldDef.type,
    fieldOverrides: props.fieldDef.admin.components.Input as
      | ComponentOverrideInput<ReactHKT, FieldControlProps<number | undefined>>[]
      | undefined,
    defaultControl: renderBareControl,
  });
  return (
    <AdminFieldBinding name={props.name} field={props.field}>
      <DateField
        label={props.fieldDef.label || props.name}
        description={props.fieldDef.description}
        required={props.fieldDef.required}
        readOnly={props.readOnly || props.fieldDef.admin.readOnly}
      index={props.index}
        min={props.fieldDef.min?.[0]}
        max={props.fieldDef.max?.[0]}
        hideTime={props.fieldDef.time.hidden}
        use12HourFormat={props.fieldDef.time.use12HourFormat}
        timePicker={props.fieldDef.time.timePicker}
        renderControl={overrideControl}
      />
    </AdminFieldBinding>
  );
}

/**
 * The Input override chain's innermost fallback control for `date` —
 * converts `FieldControlProps<number | undefined>` to/from `Date` around a
 * bare `DateTimePicker`, mirroring what `DateField`'s own default control does.
 *
 * @param props.controlProps - The resolved control props from the override chain.
 * @param props.fieldDef - The field's resolved definition, for `min`/`max`/`time`.
 * @param props.name - The field's form path, for `aria-labelledby`.
 * @returns A bare `DateTimePicker` wired to `controlProps`.
 */
function DateBareControl(props: {
  controlProps: FieldControlProps<number | undefined>;
  fieldDef: DateFieldDef;
  name: string;
}) {
  const dateValue = useMemo(
    () => (props.controlProps.value ? new Date(props.controlProps.value) : undefined),
    [props.controlProps.value],
  );
  const minDate = useMemo(
    () => (props.fieldDef.min !== undefined ? new Date(props.fieldDef.min[0]) : undefined),
    [props.fieldDef.min],
  );
  const maxDate = useMemo(
    () => (props.fieldDef.max !== undefined ? new Date(props.fieldDef.max[0]) : undefined),
    [props.fieldDef.max],
  );
  const handleChange = useCallback(
    (date: Date | undefined) => props.controlProps.onChange(date ? date.getTime() : undefined),
    [props.controlProps.onChange],
  );
  return (
    <DateTimePicker
      id={props.controlProps.id}
      value={dateValue}
      onChange={handleChange}
      onBlur={props.controlProps.onBlur}
      disabled={props.controlProps.readOnly}
      clearable
      hideTime={props.fieldDef.time.hidden}
      use12HourFormat={props.fieldDef.time.use12HourFormat}
      timePicker={props.fieldDef.time.timePicker}
      min={minDate}
      max={maxDate}
      aria-required={props.fieldDef.required}
      aria-invalid={props.controlProps.invalid}
      aria-describedby={props.controlProps.describedBy}
    />
  );
}
