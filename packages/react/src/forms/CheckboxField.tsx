"use client";

import type { ReactNode } from "react";
import { useStore } from "@tanstack/react-form";
import { useFieldContext, useFormContext } from "./formContext";
import { FormFieldLayout, fieldDescribedBy, isFieldShowingError } from "./FormFieldLayout";
import { cn } from "../utils/cn";
import { FieldLabel } from "../ui/field";
import { Checkbox } from "../ui/checkbox";
import type { BaseFormFieldProps } from "./types";

/** Props for {@link CheckboxField}. */
export type CheckboxFieldProps = BaseFormFieldProps<boolean>;

/**
 * A checkbox field bound to the nearest `<form.AppField name="...">`. Unlike
 * every other app-form leaf field, its label renders beside the control
 * rather than above it — `FormFieldLayout` is used for description/error only.
 *
 * @param props - See {@link CheckboxFieldProps} and {@link BaseFormFieldProps}.
 * @returns The checkbox + inline label row, description and error.
 */
export function CheckboxField(props: CheckboxFieldProps): ReactNode {
  const field = useFieldContext<boolean>();
  const form = useFormContext();
  const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts);
  const invalid = isFieldShowingError({ field, submissionAttempts });
  const describedBy = fieldDescribedBy({ id: field.name, hasDescription: Boolean(props.description), showError: invalid });
  const control = props.renderControl ? (
    props.renderControl({
      id: field.name,
      value: field.state.value ?? false,
      onChange: field.handleChange,
      onBlur: field.handleBlur,
      readOnly: Boolean(props.readOnly),
      invalid,
      describedBy,
    })
  ) : (
    <Checkbox
      id={field.name}
      aria-labelledby={`${field.name}-label`}
      required={props.required}
      readOnly={props.readOnly}
      disabled={props.readOnly}
      checked={field.state.value ?? false}
      onCheckedChange={(checked) => field.handleChange(checked)}
      onBlur={field.handleBlur}
      aria-invalid={invalid}
      aria-describedby={describedBy}
    />
  );
  const inlineLabel = (
    <FieldLabel htmlFor={field.name} id={`${field.name}-label`}>
      {props.index !== undefined ? `[${props.index + 1}] - ` : ""}
      {props.label}
      {props.required && <span className="text-red-500">*</span>}
    </FieldLabel>
  );
  return (
    <FormFieldLayout
      id={field.name}
      field={field}
      submissionAttempts={submissionAttempts}
      description={props.description}
      className={cn("py-2", props.className)}
      before={
        <div className="flex gap-2">
          {control}
          {inlineLabel}
        </div>
      }
    >
      {null}
    </FormFieldLayout>
  );
}
