"use client";

import type { TextField } from "@vexcms/core";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { createFieldInput } from "../../form/createFieldInput";
import { FormError } from "../../form/FormError";

/**
 * Text field input component for the admin edit form.
 *
 * Built with `createFieldInput` — handles TanStack Form wiring automatically.
 * Must be rendered inside `<AppForm>`, or receive an explicit `field` prop
 * (`TypedFieldApi<string>`) from a `<form.Field>` render prop.
 *
 * The `name` prop is the field key from the collection config (e.g. `"title"`).
 * It connects the input to the form field with that key in `form.defaultValues`.
 *
 * @example
 * ```tsx
 * // Inside CollectionEditView — AppForm provides context
 * <AppForm form={form}>
 *   <TextFieldInput name="title" fieldDef={titleField} readOnly={false} />
 * </AppForm>
 *
 * // Explicit field prop — TypedFieldApi<string>, works outside AppForm
 * <form.Field name="title">
 *   {(field) => (
 *     <TextFieldInput
 *       name="title"
 *       fieldDef={titleField}
 *       readOnly={false}
 *       field={field}
 *     />
 *   )}
 * </form.Field>
 * ```
 */
export const TextFieldInput = createFieldInput<string, TextField>(
  ({ name, fieldDef, field, submissionAttempts }) => {
    return (
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={name} className="relative">
          {fieldDef.label || name}
          {fieldDef.required && <span className="text-red-500">*</span>}
        </Label>
        <Input
          id={name}
          type="text"
          value={field.state.value ?? ""}
          onChange={(e) => field.handleChange(e.target.value)}
          onBlur={field.handleBlur}
          placeholder={fieldDef.admin.placeholder}
          readOnly={fieldDef.admin.readOnly}
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
