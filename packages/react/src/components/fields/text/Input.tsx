"use client";

import { CRUD_ACTIONS, type TextField } from "@vexcms/core";
import { Input } from "../../ui/input";
import { createFieldInput, FormDescription, FormLabel, FormError } from "../../form";
import { usePermission } from "../../../hooks";

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
export const TextFieldInput = createFieldInput<string, {}, TextField>(
  ({ name, collection, fieldDef, field, index, submissionAttempts }) => {
    const canEdit = usePermission({ resource: collection.slug, action: CRUD_ACTIONS.update });
    return (
      <div className="flex flex-col gap-1.5">
        <FormLabel index={index} field={fieldDef} name={name} />
        <Input
          id={name}
          disabled={!canEdit}
          type="text"
          value={field.state.value ?? ""}
          onChange={(e) => field.handleChange(e.target.value)}
          onBlur={field.handleBlur}
          placeholder={fieldDef.admin.placeholder}
          readOnly={fieldDef.admin.readOnly}
        />
        <FormDescription field={fieldDef} />
        <FormError field={field} submissionAttempts={submissionAttempts} />
      </div>
    );
  },
);
