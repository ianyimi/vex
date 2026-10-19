"use client";

import { type TextareaField } from "@vexcms/core";
import { Textarea } from "../../ui/textarea";
import { createFieldInput } from "../../form/createFieldInput";
import { FormDescription } from "../../form/FormDescription";
import { FormLabel } from "../../form/FormLabel";
import { FormError } from "../../form/FormError";

/**
 * Textarea field input component for the admin edit form.
 *
 * Built with `createFieldInput` — handles TanStack Form wiring automatically.
 * Must be rendered inside `<AppForm>`, or receive an explicit `field` prop
 * (`TypedFieldApi<string>`) from a `<form.Field>` render prop.
 *
 * Renders a `Textarea` sized by `fieldDef.rows`. When `fieldDef.max` is
 * configured, an `n/max` character counter is shown below the textarea,
 * right-aligned — the same markup `text/Input.tsx`'s counter (step 15)
 * reuses.
 *
 * The `name` prop is the field key from the collection config (e.g. `"bio"`).
 * It connects the input to the form field with that key in `form.defaultValues`.
 *
 * @example
 * ```tsx
 * // Inside CollectionEditView — AppForm provides context
 * <AppForm form={form}>
 *   <TextareaFieldInput name="bio" fieldDef={bioField} readOnly={false} />
 * </AppForm>
 *
 * // Explicit field prop — TypedFieldApi<string>, works outside AppForm
 * <form.Field name="bio">
 *   {(field) => (
 *     <TextareaFieldInput
 *       name="bio"
 *       fieldDef={bioField}
 *       readOnly={false}
 *       field={field}
 *     />
 *   )}
 * </form.Field>
 * ```
 */
export const TextareaFieldInput = createFieldInput<string, {}, TextareaField>(
  ({ name, readOnly, fieldDef, field, index, submissionAttempts }) => {
    const value = field.state.value ?? "";
    return (
      <div className="flex flex-col gap-1.5">
        <FormLabel index={index} field={fieldDef} name={name} />
        <Textarea
          id={name}
          disabled={readOnly}
          rows={fieldDef.rows}
          value={value}
          onChange={(e) => field.handleChange(e.target.value)}
          onBlur={field.handleBlur}
          placeholder={fieldDef.admin.placeholder}
          readOnly={fieldDef.admin.readOnly}
          aria-required={fieldDef.required}
        />
        {fieldDef.max && (
          <div className="flex justify-end">
            <span className="text-[0.8rem] text-muted-foreground">
              {value.length}/{fieldDef.max[0]}
            </span>
          </div>
        )}
        <FormDescription field={fieldDef} />
        <FormError field={field} submissionAttempts={submissionAttempts} />
      </div>
    );
  },
);
