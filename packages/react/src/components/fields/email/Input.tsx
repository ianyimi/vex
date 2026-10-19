"use client";

import { type EmailField } from "@vexcms/core";
import { Input } from "../../ui/input";
import { createFieldInput } from "../../form/createFieldInput";
import { FormDescription } from "../../form/FormDescription";
import { FormLabel } from "../../form/FormLabel";
import { FormError } from "../../form/FormError";

/**
 * Email field input component for the admin edit form.
 *
 * Built with `createFieldInput` — handles TanStack Form wiring automatically.
 * Renders a native `type="email"` input with `autoComplete="email"`; format
 * validation itself is enforced by `emailFieldToInputSchema` on submit, not
 * by the browser's built-in email validation (which this component disables
 * no constraint attributes are set beyond `type`/`autoComplete`).
 *
 * @example
 * ```tsx
 * <AppForm form={form}>
 *   <EmailFieldInput name="contactEmail" fieldDef={contactEmailField} readOnly={false} />
 * </AppForm>
 * ```
 */
export const EmailFieldInput = createFieldInput<string, {}, EmailField>(
  ({ name, readOnly, fieldDef, field, index, submissionAttempts }) => {
    return (
      <div className="flex flex-col gap-1.5">
        <FormLabel index={index} field={fieldDef} name={name} />
        <Input
          id={name}
          disabled={readOnly}
          type="email"
          autoComplete="email"
          value={field.state.value ?? ""}
          onChange={(e) => field.handleChange(e.target.value)}
          onBlur={field.handleBlur}
          placeholder={fieldDef.admin.placeholder}
          readOnly={fieldDef.admin.readOnly}
          aria-required={fieldDef.required}
        />
        <FormDescription field={fieldDef} />
        <FormError field={field} submissionAttempts={submissionAttempts} />
      </div>
    );
  },
);
