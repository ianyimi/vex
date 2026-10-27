"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useStore } from "@tanstack/react-form";
import { useFieldContext, useFormContext } from "./formContext";
import { FormFieldLayout, fieldDescribedBy, isFieldShowingError } from "./FormFieldLayout";
import { DateTimePicker, type DateTimePickerProps } from "../ui/datetime/date-picker";
import type { BaseFormFieldProps } from "./types";

/** Props for {@link DateField}. */
export interface DateFieldProps extends BaseFormFieldProps<number | undefined> {
  /** Epoch ms lower bound. */
  min?: number;
  /** Epoch ms upper bound. */
  max?: number;
  hideTime?: boolean;
  use12HourFormat?: boolean;
  timePicker?: DateTimePickerProps["timePicker"];
}

/**
 * A date/time field bound to the nearest `<form.AppField name="...">`.
 * Stores epoch milliseconds (`number | undefined`).
 *
 * Unlike every other leaf field in this entry, `value` is a `number |
 * undefined` (epoch ms), not the `Date` the default `DateTimePicker` control
 * itself wants — a `renderControl` override here receives that same epoch
 * `value` and must do the epoch↔`Date` conversion itself; every other
 * field's override is a direct pass-through.
 *
 * @param props - See {@link DateFieldProps} and {@link BaseFormFieldProps}.
 * @param props.renderControl - Receives `value: number | undefined` (epoch ms); must convert to/from `Date` itself.
 * @returns The labelled control, description and error.
 */
export function DateField(props: DateFieldProps): ReactNode {
  const field = useFieldContext<number | undefined>();
  const form = useFormContext();
  const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts);

  const fieldRef = useRef(field);
  useEffect(() => {
    fieldRef.current = field;
  }, [field]);

  const dateValue = useMemo(
    () => (field.state.value ? new Date(field.state.value) : undefined),
    [field.state.value],
  );
  const minDate = useMemo(() => (props.min !== undefined ? new Date(props.min) : undefined), [props.min]);
  const maxDate = useMemo(() => (props.max !== undefined ? new Date(props.max) : undefined), [props.max]);
  const handleChange = useCallback((date: Date | undefined) => {
    fieldRef.current.handleChange(date ? date.getTime() : undefined);
  }, []);
  const invalid = isFieldShowingError({ field, submissionAttempts });
  const describedBy = fieldDescribedBy({ id: field.name, hasDescription: Boolean(props.description), showError: invalid });
  const control = props.renderControl ? (
    props.renderControl({
      id: field.name,
      value: field.state.value,
      onChange: field.handleChange,
      onBlur: field.handleBlur,
      readOnly: Boolean(props.readOnly),
      invalid,
      describedBy,
    })
  ) : (
    <DateTimePicker
      id={field.name}
      value={dateValue}
      onChange={handleChange}
      onBlur={field.handleBlur}
      disabled={props.readOnly}
      clearable
      hideTime={props.hideTime}
      use12HourFormat={props.use12HourFormat}
      timePicker={props.timePicker}
      min={minDate}
      max={maxDate}
      aria-required={props.required}
      aria-labelledby={`${field.name}-label`}
    />
  );
  return (
    <FormFieldLayout
      id={field.name}
      label={props.label}
      required={props.required}
      description={props.description}
      index={props.index}
      field={field}
      submissionAttempts={submissionAttempts}
      className={props.className}
    >
      {control}
    </FormFieldLayout>
  );
}
