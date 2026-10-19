"use client";

import { useState } from "react";
import type { JsonField } from "@vexcms/core";
import { JsonEditor } from "../../ui/JsonEditor";
import { Button } from "../../ui/button";
import { createFieldInput } from "../../form/createFieldInput";
import { FormDescription } from "../../form/FormDescription";
import { FormLabel } from "../../form/FormLabel";
import { FormError } from "../../form/FormError";
import { parseJsonFieldText, stringifyJsonFieldValue } from "./utils";

/**
 * JSON field input component for the admin edit form.
 *
 * Holds the raw editor text in local state and parses it on every change: a
 * valid parse commits the parsed value via `field.handleChange`, an invalid
 * parse leaves the committed form value untouched and shows a local
 * parse-error message styled like `FormError`. The "Format" button
 * re-serializes the current text with two-space indentation and is disabled
 * while the current text doesn't parse. Read-only renders a read-only
 * `JsonEditor` inside a `role="group"` wrapper, mirroring the upload field's
 * multi-state pattern — there is no single focusable control to attach a
 * `<label for>` to.
 *
 * Must be rendered inside `<AppForm>`, or receive an explicit `field` prop
 * (`TypedFieldApi<unknown>`) from a `<form.Field>` render prop.
 */
export const JsonFieldInput = createFieldInput<unknown, {}, JsonField>(
  ({ name, readOnly, fieldDef, field, index, submissionAttempts }) => {
    const isReadOnly = readOnly || fieldDef.admin.readOnly;
    const [text, setText] = useState(() => stringifyJsonFieldValue(field.state.value));
    const [parseError, setParseError] = useState<string | undefined>(undefined);

    if (isReadOnly) {
      return (
        <div
          id={name}
          className="flex flex-col gap-1.5"
          role="group"
          aria-labelledby={`${name}-label`}
          aria-disabled={isReadOnly}
        >
          <span
            id={`${name}-label`}
            className="relative flex items-center gap-2 text-sm leading-none font-medium select-none"
          >
            {index !== undefined ? `[${index + 1}] - ` : ""}
            {fieldDef.label || name}
            {fieldDef.required && <span className="text-red-500">*</span>}
          </span>
          <JsonEditor
            id={`${name}-editor`}
            value={stringifyJsonFieldValue(field.state.value)}
            onChange={() => {}}
            readOnly
            aria-labelledby={`${name}-label`}
          />
          <FormDescription field={fieldDef} />
          <FormError field={field} submissionAttempts={submissionAttempts} />
        </div>
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

    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <FormLabel index={index} field={fieldDef} name={name} />
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
        <JsonEditor
          id={name}
          value={text}
          onChange={handleChange}
          onBlur={field.handleBlur}
          invalid={Boolean(parseError)}
          aria-labelledby={`${name}-label`}
          aria-required={fieldDef.required}
          placeholder={fieldDef.admin.placeholder}
        />
        {parseError && <p className="text-[0.8rem] text-destructive">{parseError}</p>}
        <FormDescription field={fieldDef} />
        <FormError field={field} submissionAttempts={submissionAttempts} />
      </div>
    );
  },
);
