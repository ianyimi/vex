"use client";

import { useMemo, useCallback, useRef, useEffect } from "react";
import type { DateField } from "@vexcms/core";
import { Label } from "../../ui/label";
import { createFieldInput } from "../../form/createFieldInput";
import { FormError } from "../../form/FormError";
import { DateTimePicker } from "../../ui/datetime/date-picker";

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

    // Use ref to store field so callback doesn't change
    const fieldRef = useRef(field);
    useEffect(() => {
      fieldRef.current = field;
    }, [field]);

    // Memoize Date to prevent infinite re-renders
    const dateValue = useMemo(
      () => (field.state.value ? new Date(field.state.value) : undefined),
      [field.state.value],
    );

    // Stable onChange callback using ref
    const handleChange = useCallback((date: Date | undefined) => {
      if (date) {
        fieldRef.current.handleChange(date.getTime());
      }
    }, []);

    // Memoize timePicker config object
    const timePickerConfig = useMemo(
      () => ({
        hour: true,
        minute: true,
        second: false,
      }),
      [],
    );

    return (
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={name} className="relative">
          {fieldDef.label || name}
          {fieldDef.required && <span className="text-red-500">*</span>}
        </Label>
        <DateTimePicker
          value={dateValue}
          onChange={handleChange}
          disabled={fieldDef.admin.readOnly}
          clearable
          modal
          hideTime={false}
          use12HourFormat={true}
          timePicker={timePickerConfig}
        />
        {fieldDef.admin.description && (
          <p className="text-[0.8rem] text-muted-foreground">
            {fieldDef.admin.description}
          </p>
        )}
        <FormError field={field} submissionAttempts={submissionAttempts} />
      </div>
    );
  },
);
