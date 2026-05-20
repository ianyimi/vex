"use client";

import type { UrlField } from "@vexcms/core";
import { Input } from "../../ui/input";
import {
  createFieldInput,
  FormDescription,
  FormLabel,
  FormError,
} from "../../form";

/**
 * URL field input component for the admin edit form.
 *
 * Renders a plain text input (`type="text"`) — URL format validation is
 * handled by `urlFieldToInputSchema` at submit time, not by the browser's
 * built-in `type="url"` input. Built with `createFieldInput`, which handles
 * TanStack Form wiring automatically.
 *
 * Must be rendered inside `<AppForm>`, or receive an explicit `field` prop
 * (`TypedFieldApi<string>`) from a `<form.Field>` render prop.
 *
 * The `name` prop is the field key from the collection config (e.g. `"website"`).
 * It connects the input to the form field with that key in `form.defaultValues`.
 *
 * @example
 * ```tsx
 * // Inside CollectionEditView — AppForm provides context
 * <AppForm form={form}>
 *   <UrlFieldInput name="website" fieldDef={websiteField} readOnly={false} />
 * </AppForm>
 *
 * // Explicit field prop — TypedFieldApi<string>, works outside AppForm
 * <form.Field name="website">
 *   {(field) => (
 *     <UrlFieldInput
 *       name="website"
 *       fieldDef={websiteField}
 *       readOnly={false}
 *       field={field}
 *     />
 *   )}
 * </form.Field>
 * ```
 */
export const UrlFieldInput = createFieldInput<string, UrlField>(
  ({ name, fieldDef, field, index, submissionAttempts }) => {
    return (
      <div className="flex flex-col gap-1.5">
        <FormLabel field={fieldDef} index={index} name={name} />
        <Input
          id={name}
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
