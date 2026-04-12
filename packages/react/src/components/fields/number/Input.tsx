"use client";

import type { NumberField } from "@vexcms/core";
import { Input } from "../../ui/input";
import {
  createFieldInput,
  FormDescription,
  FormLabel,
  FormError,
} from "../../form";

/**
 * Number field input component for the admin edit form.
 *
 * Built with `createFieldInput` — handles TanStack Form wiring automatically.
 * Must be rendered inside `<AppForm>`, or receive an explicit `field` prop
 * (`TypedFieldApi<number>`) from a `<form.Field>` render prop.
 *
 * The `name` prop is the field key from the collection config (e.g. `"price"`).
 * It connects the input to the form field with that key in `form.defaultValues`.
 *
 * @example
 * ```tsx
 * // Inside CollectionEditView — AppForm provides context
 * <AppForm form={form}>
 *   <NumberFieldInput name="price" fieldDef={priceField} readOnly={false} />
 * </AppForm>
 *
 * // Explicit field prop — TypedFieldApi<number>, works outside AppForm
 * <form.Field name="price">
 *   {(field) => (
 *     <NumberFieldInput
 *       name="price"
 *       fieldDef={priceField}
 *       readOnly={false}
 *       field={field}
 *     />
 *   )}
 * </form.Field>
 * ```
 */
export const NumberFieldInput = createFieldInput<number, NumberField>(
  ({ name, fieldDef, field, submissionAttempts }) => {
    return (
      <div className="flex flex-col gap-1.5">
        <FormLabel field={fieldDef} name={name} />
        <Input
          id={name}
          type="number"
          value={field.state.value ?? 0}
          onChange={(e) => field.handleChange(Number(e.target.value))}
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
