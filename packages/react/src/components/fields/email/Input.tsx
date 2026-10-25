"use client";

import { useContext } from "react";

import { resolveFieldMask, type EmailField } from "@vexcms/core";
import { Input } from "../../ui/input";
import { createFieldInput } from "../../form/createFieldInput";
import { FormDescription } from "../../form/FormDescription";
import { FormLabel } from "../../form/FormLabel";
import { FormError, isFieldShowingError } from "../../form/FormError";
import { useFieldMask } from "../../../hooks/useFieldMask";
import { VexConfigContext } from "../../../context/VexConfigContext";

/**
 * Email field input component for the admin edit form.
 *
 * Built with `createFieldInput` — handles TanStack Form wiring automatically.
 * Must be rendered inside `<AppForm>`, or receive an explicit `field` prop
 * (`TypedFieldApi<string>`) from a `<form.Field>` render prop.
 *
 * Renders a masked, uncontrolled `type="text"` `<Input>` when
 * `fieldDef.admin.mask` (or the project's `fields.inputMasks.email` default)
 * resolves, and an unmasked, controlled native `type="email"` `<Input>`
 * otherwise — see `useFieldMask`'s JSDoc for why the two cannot share one
 * element. `autoComplete="email"` is set on both branches.
 *
 * Shows a live `length/max` character counter below the input whenever
 * `fieldDef.max` is set, identical markup to `text/Input.tsx`'s own counter —
 * purely informational; length limits are still enforced only by
 * `emailFieldToInputSchema` at submit time.
 *
 * The `name` prop is the field key from the collection config (e.g. `"contactEmail"`).
 * It connects the input to the form field with that key in `form.defaultValues`.
 *
 * @example
 * ```tsx
 * // Inside CollectionEditView — AppForm provides context
 * <AppForm form={form}>
 *   <EmailFieldInput name="contactEmail" fieldDef={contactEmailField} readOnly={false} />
 * </AppForm>
 * ```
 */
export const EmailFieldInput = createFieldInput<string, {}, EmailField>(
  ({ name, readOnly, fieldDef, field, index, submissionAttempts }) => {
    const config = useContext(VexConfigContext);
    const mask = resolveFieldMask({
      fieldType: fieldDef.type,
      fieldMask: fieldDef.admin.mask,
      inputMasks: config?.fields.inputMasks ?? {},
    });
    const maskRef = useFieldMask({ mask });
    const value = field.state.value ?? "";
    const isInvalid = isFieldShowingError({ field, submissionAttempts });
    const isDisabled = readOnly || fieldDef.admin.readOnly;
    return (
      <div className="flex flex-col gap-1.5">
        <FormLabel index={index} field={fieldDef} name={name} />
        {mask ? (
          <Input
            id={name}
            ref={maskRef}
            disabled={isDisabled}
            type="text"
            autoComplete="email"
            defaultValue={value}
            onInput={(e) => field.handleChange(e.currentTarget.value)}
            onBlur={field.handleBlur}
            placeholder={fieldDef.admin.placeholder}
            readOnly={fieldDef.admin.readOnly}
            aria-required={fieldDef.required}
            aria-invalid={isInvalid}
          />
        ) : (
          <Input
            id={name}
            disabled={isDisabled}
            type="email"
            autoComplete="email"
            value={value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            placeholder={fieldDef.admin.placeholder}
            readOnly={fieldDef.admin.readOnly}
            aria-required={fieldDef.required}
            aria-invalid={isInvalid}
          />
        )}
        {fieldDef.max && (
          <p className="self-end text-[0.8rem] text-muted-foreground tabular-nums">
            {value.length}/{fieldDef.max[0]}
          </p>
        )}
        <FormDescription field={fieldDef} />
        <FormError field={field} submissionAttempts={submissionAttempts} />
      </div>
    );
  },
);
