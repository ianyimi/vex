"use client";

import type { GroupField } from "@vexcms/core";
import { createFieldInput, FormGroup } from "../../form";

/**
 * Group field input component for the admin edit form.
 *
 * Built with `createFieldInput` (default value mode). Renders a collapsible
 * fieldset via `FormGroup`, where each sub-field uses its full dot-notation
 * TanStack Form path (`"${name}.${fieldKey}"`).
 *
 * Must be rendered inside `<AppForm>`, or receive an explicit `field` prop
 * (`TypedFieldApi<Record<string, unknown>>`) from a `<form.Field>` render prop.
 *
 * @example
 * ```tsx
 * // Inside CollectionEditView — AppForm provides context
 * <AppForm form={form}>
 *   <GroupFieldInput name="seo" fieldDef={seoField} readOnly={false} />
 * </AppForm>
 * ```
 */
export const GroupFieldInput = createFieldInput<Record<string, unknown>, {}, GroupField>(
  ({ name, collection, readOnly, fieldDef, field, index, submissionAttempts }) => {
    return (
      <div className="flex flex-col gap-1.5">
        <FormGroup
          name={name}
          collection={collection}
          field={field}
          fieldDef={fieldDef}
          index={index}
          readOnly={readOnly || fieldDef.admin.readOnly}
          submissionAttempts={submissionAttempts}
        />
      </div>
    );
  },
);
