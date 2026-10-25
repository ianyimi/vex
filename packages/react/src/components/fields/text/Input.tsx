"use client";

import { useContext } from "react";

import { resolveFieldMask, type TextField } from "@vexcms/core";
import { Input } from "../../ui/input";
import { createFieldInput } from "../../form/createFieldInput";
import { FormDescription } from "../../form/FormDescription";
import { FormLabel } from "../../form/FormLabel";
import { FormError, isFieldShowingError } from "../../form/FormError";
import { useFieldMask } from "../../../hooks/useFieldMask";
import { VexConfigContext } from "../../../context/VexConfigContext";

/**
 * Text field input component for the admin edit form.
 *
 * Built with `createFieldInput` — handles TanStack Form wiring automatically.
 * Must be rendered inside `<AppForm>`, or receive an explicit `field` prop
 * (`TypedFieldApi<string>`) from a `<form.Field>` render prop.
 *
 * Renders a masked, uncontrolled `<Input>` when `fieldDef.admin.mask` (or the
 * project's `fields.inputMasks.text` default) resolves, and an unmasked,
 * controlled `<Input>` otherwise — see `useFieldMask`'s JSDoc for why the two
 * cannot share one element.
 *
 * Shows a live `length/max` character counter below the input whenever
 * `fieldDef.max` is set — purely informational, matching `url`/`number`'s own
 * no-client-side-enforcement rule: length limits are still enforced only by
 * `textFieldToInputSchema` at submit time. The same markup is reused by
 * `textarea/Input.tsx`'s own counter.
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
            type="text"
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
