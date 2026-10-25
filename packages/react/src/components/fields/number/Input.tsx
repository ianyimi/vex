"use client";

import { useContext } from "react";

import { resolveFieldMask, type NumberField } from "@vexcms/core";
import { Input } from "../../ui/input";
import { createFieldInput } from "../../form/createFieldInput";
import { FormDescription } from "../../form/FormDescription";
import { FormLabel } from "../../form/FormLabel";
import { FormError, isFieldShowingError } from "../../form/FormError";
import { useFieldMask } from "../../../hooks/useFieldMask";
import { VexConfigContext } from "../../../context/VexConfigContext";

/**
 * Number field input component for the admin edit form.
 *
 * Built with `createFieldInput` — handles TanStack Form wiring automatically.
 * Must be rendered inside `<AppForm>`, or receive an explicit `field` prop
 * (`TypedFieldApi<number>`) from a `<form.Field>` render prop.
 *
 * Renders a masked, uncontrolled `type="text"` `<Input>` when
 * `fieldDef.admin.mask` (or the project's `fields.inputMasks.number` default)
 * resolves — still storing a `number` — and an unmasked, controlled
 * `type="number"` `<Input>` otherwise.
 *
 * `fieldDef.step`/`fieldDef.min`/`fieldDef.max` are forwarded as the native
 * `step`/`min`/`max` HTML attributes on the unmasked branch only — UI
 * affordances (spinner increment, browser validity styling), never
 * client-side clamping; range enforcement stays entirely in
 * `numberFieldToInputSchema`.
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
 * ```
 */
export const NumberFieldInput = createFieldInput<number, {}, NumberField>(
  ({ name, readOnly, fieldDef, field, index, submissionAttempts }) => {
    const config = useContext(VexConfigContext);
    const mask = resolveFieldMask({
      fieldType: fieldDef.type,
      fieldMask: fieldDef.admin.mask,
      inputMasks: config?.fields.inputMasks ?? {},
    });
    const maskRef = useFieldMask({ mask });
    const isInvalid = isFieldShowingError({ field, submissionAttempts });
    const isDisabled = readOnly || fieldDef.admin.readOnly;
    return (
      <div className="flex flex-col gap-1.5">
        <FormLabel field={fieldDef} index={index} name={name} />
        {mask ? (
          <Input
            id={name}
            ref={maskRef}
            disabled={isDisabled}
            type="text"
            defaultValue={
              field.state.value !== undefined ? String(field.state.value) : ""
            }
            onInput={(e) => {
              const raw = e.currentTarget.value;
              field.handleChange(
                raw === "" ? (undefined as unknown as number) : Number(raw),
              );
            }}
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
            type="number"
            step={fieldDef.step}
            min={fieldDef.min?.[0]}
            max={fieldDef.max?.[0]}
            value={field.state.value ?? 0}
            onChange={(e) =>
              field.handleChange(
                e.target.value === ""
                  ? (undefined as unknown as number)
                  : Number(e.target.value),
              )
            }
            onBlur={field.handleBlur}
            placeholder={fieldDef.admin.placeholder}
            readOnly={fieldDef.admin.readOnly}
            aria-required={fieldDef.required}
            aria-invalid={isInvalid}
          />
        )}
        <FormDescription field={fieldDef} />
        <FormError field={field} submissionAttempts={submissionAttempts} />
      </div>
    );
  },
);
