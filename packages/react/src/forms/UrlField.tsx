"use client";

import type { ReactNode } from "react";
import { useStore } from "@tanstack/react-form";
import { useFieldContext, useFormContext } from "./formContext";
import { FormFieldLayout, fieldDescribedBy, isFieldShowingError } from "./FormFieldLayout";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { VexLink } from "../ui/VexLink";
import type { BaseFormFieldProps } from "./types";

/** Props for {@link UrlField}. */
export interface UrlFieldProps extends BaseFormFieldProps<string> {
  placeholder?: string;
}

/**
 * Whether `value` parses as an absolute URL (`new URL()` succeeds). Gates the
 * open-link button only — URL format validation stays with the caller's
 * schema, never here. Moved in unchanged from the deleted admin `url/Input.tsx`.
 *
 * @param value - The current field value to check.
 * @returns `true` if `value` is a non-empty, parseable absolute URL.
 */
function isParseableUrl(value: string): boolean {
  if (!value) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * A URL field bound to the nearest `<form.AppField name="...">`, with an
 * open-link button beside the control enabled only while the value parses.
 *
 * @param props - See {@link UrlFieldProps} and {@link BaseFormFieldProps}.
 * @returns The labelled control + open-link button, description and error.
 */
export function UrlField(props: UrlFieldProps): ReactNode {
  const field = useFieldContext<string>();
  const form = useFormContext();
  const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts);
  const value = field.state.value ?? "";
  const invalid = isFieldShowingError({ field, submissionAttempts });
  const describedBy = fieldDescribedBy({ id: field.name, hasDescription: Boolean(props.description), showError: invalid });
  const isValid = isParseableUrl(value);
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
      type="text"
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
  const row = (
    <div className="flex items-center gap-2">
      {control}
      <Button
        type="button"
        variant="outline"
        size="icon"
        nativeButton={false}
        disabled={!isValid}
        aria-label="Open link in new tab"
        icon="ExternalLink"
        iconPosition="center"
        render={<VexLink href={isValid ? value : ""} target="_blank" rel="noopener noreferrer" />}
      />
    </div>
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
      {row}
    </FormFieldLayout>
  );
}
