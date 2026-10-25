"use client";

import { useContext } from "react";
import { resolveFieldMask, type UrlField } from "@vexcms/core";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { VexLink } from "../../ui/VexLink";
import { createFieldInput } from "../../form/createFieldInput";
import { FormDescription } from "../../form/FormDescription";
import { FormLabel } from "../../form/FormLabel";
import { FormError, isFieldShowingError } from "../../form/FormError";
import { useFieldMask } from "../../../hooks/useFieldMask";
import { VexConfigContext } from "../../../context/VexConfigContext";

/**
 * Whether `value` parses as an absolute URL (`new URL()` succeeds). Used only
 * to enable/disable the open-link button below — format validation for
 * submission stays entirely in `urlFieldToInputSchema`, never here.
 *
 * @param value - The current field value to check.
 * @returns `true` if `value` is a non-empty, parseable absolute URL.
 */
function isParseableUrl(value: string): boolean {
  if (!value) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * URL field input component for the admin edit form.
 *
 * Renders a masked, uncontrolled `<Input>` when `fieldDef.admin.mask` (or the
 * project's `fields.inputMasks.url` default) resolves, and an unmasked,
 * controlled `<Input type="text">` otherwise — URL format validation is
 * handled by `urlFieldToInputSchema` at submit time either way, never by the
 * browser's built-in `type="url"` input. Built with `createFieldInput`, which
 * handles TanStack Form wiring automatically.
 *
 * An open-link button sits beside the input, enabled only while the current
 * value parses as an absolute URL (`isParseableUrl`); it opens the value in a
 * new tab with `rel="noopener noreferrer"`.
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
 * ```
 */
export const UrlFieldInput = createFieldInput<string, {}, UrlField>(
  ({ name, readOnly, fieldDef, field, index, submissionAttempts }) => {
    const config = useContext(VexConfigContext);
    const mask = resolveFieldMask({
      fieldType: fieldDef.type,
      fieldMask: fieldDef.admin.mask,
      inputMasks: config?.fields.inputMasks ?? {},
    });
    const maskRef = useFieldMask({ mask });
    const value = field.state.value ?? "";
    const isValidUrl = isParseableUrl(value);
    const isInvalid = isFieldShowingError({ field, submissionAttempts });
    const isDisabled = readOnly || fieldDef.admin.readOnly;
    return (
      <div className="flex flex-col gap-1.5">
        <FormLabel field={fieldDef} index={index} name={name} />
        <div className="flex items-center gap-2">
          {mask ? (
            <Input
              id={name}
              ref={maskRef}
              type="text"
              disabled={isDisabled}
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
              type="text"
              disabled={isDisabled}
              value={value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder={fieldDef.admin.placeholder}
              readOnly={fieldDef.admin.readOnly}
              aria-required={fieldDef.required}
              aria-invalid={isInvalid}
            />
          )}
          <Button
            type="button"
            variant="outline"
            size="icon"
            nativeButton={false}
            disabled={!isValidUrl}
            aria-label="Open link in new tab"
            icon="ExternalLink"
            iconPosition="center"
            render={
              <VexLink
                href={isValidUrl ? value : ""}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          />
        </div>
        <FormDescription field={fieldDef} />
        <FormError field={field} submissionAttempts={submissionAttempts} />
      </div>
    );
  },
);
