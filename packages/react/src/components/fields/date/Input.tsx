"use client";

import { useMemo, useCallback, useRef, useEffect } from "react";
import type { DateField } from "@vexcms/core";
import {
  createFieldInput,
  FormError,
  FormDescription,
  FormLabel,
} from "../../form";
import { DateTimePicker } from "../../ui";

/**
 * Date field input component for the admin edit form.
 *
 * Built with `createFieldInput` — handles TanStack Form wiring automatically.
 * Must be rendered inside `<AppForm>`, or receive an explicit `field` prop
 * (`TypedFieldApi<number>`) from a `<form.Field>` render prop.
 *
 * The `name` prop is the field key from the collection config (e.g. `"publishedAt"`).
 * It connects the input to the form field with that key in `form.defaultValues`.
 *
 * @example
 * ```tsx
 * // Inside CollectionEditView — AppForm provides context
 * <AppForm form={form}>
 *   <DateFieldInput name="publishedAt" fieldDef={publishedAtField} readOnly={false} />
 * </AppForm>
 *
 * // Explicit field prop — TypedFieldApi<number>, works outside AppForm
 * <form.Field name="publishedAt">
 *   {(field) => (
 *     <DateFieldInput
 *       name="publishedAt"
 *       fieldDef={publishedAtField}
 *       readOnly={false}
 *       field={field}
 *     />
 *   )}
 * </form.Field>
 * ```
 */
export const DateFieldInput = createFieldInput<number, DateField>(
  function DateFieldInputRender(props) {
    const { name, fieldDef, field, submissionAttempts } = props;

    const fieldRef = useRef(field);
    useEffect(() => {
      fieldRef.current = field;
    }, [field]);

    const dateValue = useMemo(
      () => (field.state.value ? new Date(field.state.value) : undefined),
      [field.state.value],
    );

    const handleChange = useCallback((date: Date | undefined) => {
      if (date) {
        fieldRef.current.handleChange(date.getTime());
      }
    }, []);

    return (
      <div className="flex flex-col gap-1.5">
        <FormLabel field={fieldDef} name={name} />
        <DateTimePicker
          value={dateValue}
          onChange={handleChange}
          disabled={fieldDef.admin.readOnly}
          clearable
          hideTime={fieldDef.time.hidden}
          use12HourFormat={fieldDef.time.use12HourFormat}
          timePicker={fieldDef.time.timePicker}
        />
        <FormDescription field={fieldDef} />
        <FormError field={field} submissionAttempts={submissionAttempts} />
      </div>
    );
  },
);
