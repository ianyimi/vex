"use client";

import type { ReactNode } from "react";
import { useStore } from "@tanstack/react-form";
import { useFieldContext, useFormContext } from "./formContext";
import { FormFieldLayout, fieldDescribedBy, isFieldShowingError } from "./FormFieldLayout";
import { Textarea } from "../ui/textarea";
import type { BaseFormFieldProps } from "./types";

/** Props for {@link TextareaField}. */
export interface TextareaFieldProps extends BaseFormFieldProps<string> {
  placeholder?: string;
  /** Forwarded to `Textarea`'s `rows`. */
  rows?: number;
  /** Shows a `length/maxLength` (or bare length) counter under the control. */
  maxLength?: number;
}

/**
 * A multi-line text field bound to the nearest `<form.AppField name="...">`.
 *
 * @param props - See {@link TextareaFieldProps} and {@link BaseFormFieldProps}.
 * @returns The labelled control, counter, description and error.
 */
export function TextareaField(props: TextareaFieldProps): ReactNode {
  const field = useFieldContext<string>();
  const form = useFormContext();
  const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts);
  const value = field.state.value ?? "";
  const invalid = isFieldShowingError({ field, submissionAttempts });
  const describedBy = fieldDescribedBy({ id: field.name, hasDescription: Boolean(props.description), showError: invalid });
  const control = props.renderControl ? (
    props.renderControl({
      id: field.name,
      value,
      onChange: field.handleChange,
      onBlur: field.handleBlur,
      readOnly: Boolean(props.readOnly),
      invalid,
      describedBy,
    })
  ) : (
    <Textarea
      id={field.name}
      disabled={props.readOnly}
      rows={props.rows}
      value={value}
      onChange={(e) => field.handleChange(e.target.value)}
      onBlur={field.handleBlur}
      placeholder={props.placeholder}
      aria-required={props.required}
      aria-invalid={invalid}
      aria-describedby={describedBy}
    />
  );
  const counter = (
    <p className="text-[0.8rem] text-muted-foreground tabular-nums">
      {value.length}
      {props.maxLength ? `/${props.maxLength}` : ""}
    </p>
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
      counter={counter}
      className={props.className}
    >
      {control}
    </FormFieldLayout>
  );
}
