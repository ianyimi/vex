"use client";

import type { ArrayField, ArrayType } from "@vexcms/core";
import { createFieldInput, FormArray } from "../../form";

/**
 * Array field input component for the admin edit form.
 *
 * Built with `createFieldInput` using `mode="array"` — handles TanStack Form
 * array field wiring automatically. Must be rendered inside `<AppForm>`, or
 * receive an explicit `field` prop (`TypedFieldApi<ArrayType[]>`) from a
 * `<form.Field mode="array">` render prop.
 *
 * Renders a dynamic list of items with add/remove controls. Each item is
 * rendered as a sub-field using `form.Field name={\`${name}[${i}]\`}`.
 *
 * @example
 * ```tsx
 * // Inside CollectionEditView — AppForm provides context
 * <AppForm form={form}>
 *   <ArrayFieldInput name="tags" fieldDef={tagsField} readOnly={false} />
 * </AppForm>
 *
 * // Explicit field prop — works outside AppForm
 * <form.Field name="tags" mode="array">
 *   {(field) => (
 *     <ArrayFieldInput
 *       name="tags"
 *       fieldDef={tagsField}
 *       readOnly={false}
 *       field={field}
 *     />
 *   )}
 * </form.Field>
 * ```
 */
export const ArrayFieldInput = createFieldInput<
  ArrayType[],
  ArrayField<ArrayType>
>(({ name, fieldDef, field, submissionAttempts }) => {
  return (
    <div className="flex flex-col gap-1.5">
      <FormArray
        name={name}
        field={field}
        fieldDef={fieldDef}
        readOnly={fieldDef.admin.readOnly}
        submissionAttempts={submissionAttempts}
      />
    </div>
  );
}, "array");

