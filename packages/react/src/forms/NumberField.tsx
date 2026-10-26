"use client";

import type { ReactNode } from "react";
import { useStore } from "@tanstack/react-form";
import { useFieldContext, useFormContext } from "./formContext";
import { FormFieldLayout, fieldDescribedBy, isFieldShowingError } from "./FormFieldLayout";
import { Input } from "../ui/input";
import type { BaseFormFieldProps } from "./types";

/** Props for {@link NumberField}. */
export interface NumberFieldProps extends BaseFormFieldProps<number> {
  placeholder?: string;
  step?: number;
  min?: number;
  max?: number;
}

/**
 * A number field bound to the nearest `<form.AppField name="...">`.
 * `step`/`min`/`max` are forwarded as native HTML attributes only — UI
 * affordances, never client-side clamping.
 *
 * @param props - See {@link NumberFieldProps} and {@link BaseFormFieldProps}.
 * @returns The labelled control, description and error.
 */
export function NumberField(props: NumberFieldProps): ReactNode {
  const field = useFieldContext<number>();
  const form = useFormContext();
  const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts);
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
    <Input
      id={field.name}
      type="number"
      disabled={props.readOnly}
      step={props.step}
      min={props.min}
      max={props.max}
      value={field.state.value ?? 0}
      onChange={(e) =>
        field.handleChange(
          e.target.value === "" ? (undefined as unknown as number) : Number(e.target.value),
        )
      }
      onBlur={field.handleBlur}
      placeholder={props.placeholder}
      aria-required={props.required}
      aria-invalid={invalid}
      aria-describedby={describedBy}
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
      before={props.before}
      after={props.after}
      className={props.className}
    >
      {control}
    </FormFieldLayout>
  );
}
