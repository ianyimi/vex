"use client";

import type { ReactNode } from "react";
import { Activity } from "react";
import { useStore } from "@tanstack/react-form";
import { useFieldContext, useFormContext } from "./formContext";
import { FormFieldLayout, fieldDescribedBy, isFieldShowingError } from "./FormFieldLayout";
import { cn } from "../utils/cn";
import { FieldDescription, FieldLabel } from "../ui/field";
import { Checkbox } from "../ui/checkbox";
import type { BaseFormFieldProps } from "./types";

/** Props for {@link CheckboxField}. */
export type CheckboxFieldProps = BaseFormFieldProps<boolean>;

/**
 * A checkbox field bound to the nearest `<form.AppField name="...">`. Unlike
 * every other app-form leaf field, its label renders beside the control
 * rather than above it — `FormFieldLayout` is used for the error only; the
 * description renders directly under the inline label text, indented
 * (`pl-6`) to align with it rather than the checkbox box, the standard
 * checkbox-with-hint pattern.
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
      className={cn("py-2", props.className)}
      before={
        <div className="flex flex-col gap-1">
          <div className="flex gap-2">
            {control}
            {inlineLabel}
          </div>
          <Activity mode={props.description ? "visible" : "hidden"}>
            <FieldDescription id={`${field.name}-description`} data-slot="form-description" className="pl-6">
              {props.description}
            </FieldDescription>
          </Activity>
        </div>
      }
    >
      {null}
    </FormFieldLayout>
  );
}
