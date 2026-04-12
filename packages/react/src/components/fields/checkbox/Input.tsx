"use client";

import type { CheckboxField } from "@vexcms/core";
import {
  createFieldInput,
  FormLabel,
  FormDescription,
  FormError,
} from "../../form";
import { Checkbox } from "../../ui/checkbox";

/**
 * Checkbox field input component for the admin edit form.
 *
 * Built with `createFieldInput` — handles TanStack Form wiring automatically.
 * Must be rendered inside `<AppForm>`, or receive an explicit `field` prop
 * (`TypedFieldApi<boolean>`) from a `<form.Field>` render prop.
 *
 * The `name` prop is the field key from the collection config (e.g. `"published"`).
 * It connects the input to the form field with that key in `form.defaultValues`.
 *
 * @example
 * ```tsx
 * // Inside CollectionEditView — AppForm provides context
 * <AppForm form={form}>
 *   <CheckboxFieldInput name="published" fieldDef={publishedField} readOnly={false} />
 * </AppForm>
 *
 * // Explicit field prop — TypedFieldApi<boolean>, works outside AppForm
 * <form.Field name="published">
 *   {(field) => (
 *     <CheckboxFieldInput
 *       name="published"
 *       fieldDef={publishedField}
 *       readOnly={false}
 *       field={field}
 *     />
 *   )}
 * </form.Field>
 * ```
 */
export const CheckboxFieldInput = createFieldInput<boolean, CheckboxField>(
  ({ name, fieldDef, field, submissionAttempts }) => {
    return (
      <div className="flex flex-col gap-1.5 py-2">
        <div className="flex gap-2">
          <Checkbox
            id={name}
            checked={field.state.value}
            onCheckedChange={(checked) => field.handleChange(checked)}
            onBlur={field.handleBlur}
            readOnly={fieldDef.admin.readOnly}
          />
          <FormLabel field={fieldDef} name={name} hideRequired />
        </div>
        <FormDescription field={fieldDef} />
        <FormError field={field} submissionAttempts={submissionAttempts} />
      </div>
    );
  },
);
