"use client";

import type { ReactNode } from "react";
import { useStore } from "@tanstack/react-form";
import { useFieldContext, useFormContext } from "./formContext";
import { FormFieldLayout, fieldDescribedBy, isFieldShowingError } from "./FormFieldLayout";
import { Input } from "../ui/input";
import type { BaseFormFieldProps } from "./types";

/** Props for {@link EmailField}. */
export interface EmailFieldProps extends BaseFormFieldProps<string> {
  placeholder?: string;
  maxLength?: number;
}

/**
 * An email field bound to the nearest `<form.AppField name="...">`. Renders a
 * native `type="email"` control with `autoComplete="email"`.
 *
 * @param props - See {@link EmailFieldProps} and {@link BaseFormFieldProps}.
 * @returns The labelled control, counter, description and error.
 */
export function EmailField(props: EmailFieldProps): ReactNode {
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
    <Input
      id={field.name}
      type="email"
      autoComplete="email"
      value={value}
      onChange={(e) => field.handleChange(e.target.value)}
      onBlur={field.handleBlur}
      disabled={props.readOnly}
      placeholder={props.placeholder}
      aria-required={props.required}
      aria-invalid={invalid}
      aria-describedby={describedBy}
    />
  );
  const counter =
    props.maxLength !== undefined ? (
      <p className="self-end text-[0.8rem] text-muted-foreground tabular-nums">
        {value.length}/{props.maxLength}
      </p>
    ) : undefined;
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
      after={counter ?? props.after}
      className={props.className}
    >
      {control}
    </FormFieldLayout>
  );
}
