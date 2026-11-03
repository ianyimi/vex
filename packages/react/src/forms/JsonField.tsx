"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useStore } from "@tanstack/react-form";
import { useFieldContext, useFormContext } from "./formContext";
import { FormFieldLayout, fieldDescribedBy, isFieldShowingError } from "./FormFieldLayout";
import { FieldLabel } from "../ui/field";
import { JsonEditor } from "../ui/JsonEditor";
import { Button } from "../ui/button";
import type { BaseFormFieldProps } from "./types";

/**
 * Result of {@link parseJsonFieldText}: either a successful parse (`ok:
 * true`, carrying the parsed `value`) or a failure (`ok: false`, carrying a
 * human-readable `error` message).
 */
type JsonFieldParseResult = { ok: true; value: unknown } | { ok: false; error: string };

/**
 * Serializes a JSON field's value for the editor — pretty-printed, two-space
 * indented; `undefined` renders as an empty string. No fieldDef dependency,
 * so it is local to the app form rather than a shared admin utility.
 *
 * @param value - The field's current value.
 * @returns The editor text.
 */
function stringifyJsonFieldValue(value: unknown): string {
  return value === undefined ? "" : JSON.stringify(value, null, 2);
}

/**
 * Parses editor text back into a value, never throwing. Blank (or
 * whitespace-only) text parses successfully to `undefined`, clearing the field.
 *
 * @param props.text - The raw editor text.
 * @returns `{ ok: true, value }` on a successful parse, `{ ok: false, error }` otherwise.
 */
function parseJsonFieldText(props: { text: string }): JsonFieldParseResult {
  if (props.text.trim() === "") {
    return { ok: true, value: undefined };
  }
  try {
    return { ok: true, value: JSON.parse(props.text) as unknown };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Invalid JSON." };
  }
}

/** Props for {@link JsonField}. */
export type JsonFieldProps = BaseFormFieldProps<unknown> & {
  /** Forwarded to the built-in editor's placeholder, shown only when the document is empty. */
  placeholder?: string;
};

/**
 * A raw-JSON field bound to the nearest `<form.AppField name="...">`. Holds
 * editor text in local state and parses on every change: a valid parse
 * commits via `field.handleChange`, an invalid parse leaves the committed
 * form value untouched and shows a local parse-error message.
 *
 * `props.renderControl`, when given, replaces the editor+Format-button
 * control entirely — same contract as every other leaf field (decision 12):
 * the override receives the raw `unknown` value directly and owns its own
 * text representation; the local parse-error/Format-button state below is
 * `JsonField`'s own built-in control's concern, not the override's.
 *
 * @param props - See {@link JsonFieldProps} and {@link BaseFormFieldProps}.
 * @returns The labelled editor + Format button, parse error, description and form error.
 */
export function JsonField(props: JsonFieldProps): ReactNode {
  const field = useFieldContext<unknown>();
  const form = useFormContext();
  const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts);
  const [text, setText] = useState(() => stringifyJsonFieldValue(field.state.value));
  const [parseError, setParseError] = useState<string | undefined>(undefined);

  if (props.renderControl) {
    const control = props.renderControl({
      id: field.name,
      value: field.state.value,
      onChange: field.handleChange,
      onBlur: field.handleBlur,
      readOnly: Boolean(props.readOnly),
      invalid: isFieldShowingError({ field, submissionAttempts }),
      describedBy: fieldDescribedBy({
        id: field.name,
        hasDescription: Boolean(props.description),
        showError: isFieldShowingError({ field, submissionAttempts }),
      }),
    });
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
  if (props.readOnly) {
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
        <JsonEditor
          id={field.name}
          value={stringifyJsonFieldValue(field.state.value)}
          onChange={() => {}}
          readOnly
          placeholder={props.placeholder}
          aria-labelledby={`${field.name}-label`}
        />
      </FormFieldLayout>
    );
  }

  function parseAndCommit(nextText: string) {
    const result = parseJsonFieldText({ text: nextText });
    if (result.ok) {
      setParseError(undefined);
      field.handleChange(result.value);
    } else {
      setParseError(result.error);
    }
  }

  function handleChange(nextText: string) {
    setText(nextText);
    parseAndCommit(nextText);
  }

  function handleFormat() {
    const result = parseJsonFieldText({ text });
    if (result.ok) {
      setText(stringifyJsonFieldValue(result.value));
      setParseError(undefined);
      field.handleChange(result.value);
    } else {
      setParseError(result.error);
    }
  }

  const control = (
    <JsonEditor
      id={field.name}
      value={text}
      onChange={handleChange}
      onBlur={field.handleBlur}
      invalid={Boolean(parseError)}
      placeholder={props.placeholder}
      aria-labelledby={`${field.name}-label`}
      aria-required={props.required}
    />
  );
  return (
    <FormFieldLayout
      id={field.name}
      field={field}
      submissionAttempts={submissionAttempts}
      description={props.description}
      className={props.className}
      after={parseError ? <p className="text-[0.8rem] text-destructive">{parseError}</p> : undefined}
      labelContent={
        <div className="flex items-center justify-between gap-2">
          <FieldLabel htmlFor={field.name} id={`${field.name}-label`}>
            {props.index !== undefined ? `[${props.index + 1}] - ` : ""}
            {props.label}
            {props.required && <span className="text-red-500">*</span>}
          </FieldLabel>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={handleFormat}
            disabled={text.trim() === "" || Boolean(parseError)}
          >
            Format
          </Button>
        </div>
      }
    >
      {control}
    </FormFieldLayout>
  );
}
