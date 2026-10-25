"use client";

import { SELECT_DISPLAYS, type SelectField } from "@vexcms/core";
import { useModalSurface } from "../../../hooks/useModalSurface";
import { createFieldInput } from "../../form/createFieldInput";
import { FormDescription } from "../../form/FormDescription";
import { FormLabel } from "../../form/FormLabel";
import { FormError, isFieldShowingError } from "../../form/FormError";
import { Checkbox } from "../../ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../../ui/radio-group";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "../../ui/multi-select";

/**
 * Select field input component for the admin edit form.
 *
 * Built with `createFieldInput` — handles TanStack Form wiring automatically.
 * Must be rendered inside `<AppForm>`, or receive an explicit `field` prop
 * (`TypedFieldApi<string[]>`) from a `<form.Field>` render prop.
 *
 * The `name` prop is the field key from the collection config (e.g. `"status"`).
 * It connects the input to the form field with that key in `form.defaultValues`.
 * When `fieldDef.hasMany` is `false`, only one option may be selected at a time.
 *
 * `fieldDef.admin.display` picks the rendering: the default `"dropdown"` is a
 * popover (`MultiSelect`), optionally searchable via `fieldDef.admin.searchable`;
 * `"radio"` renders an inline list with no popover — radio buttons when
 * `hasMany` is `false`, checkboxes when `hasMany` is `true` — and ignores
 * `searchable`, which only applies to the popover.
 *
 * Fields are rendered generically by `RenderFields`, so there is no prop
 * channel to tell this input it sits in a dialog. It reads `useModalSurface()`
 * instead, which `Modal` provides: inside a dialog the popover joins that
 * surface's focus trap, and everywhere else it stays non-modal so it does not
 * lock page scroll and snap the view to the top. Only the `"dropdown"` display
 * has a popover to apply this to.
 *
 * @example
 * ```tsx
 * // Inside CollectionEditView — AppForm provides context
 * <AppForm form={form}>
 *   <SelectFieldInput name="status" fieldDef={statusField} readOnly={false} />
 * </AppForm>
 *
 * // Explicit field prop — TypedFieldApi<string[]>, works outside AppForm
 * <form.Field name="tags">
 *   {(field) => (
 *     <SelectFieldInput
 *       name="tags"
 *       fieldDef={tagsField}
 *       readOnly={false}
 *       field={field}
 *     />
 *   )}
 * </form.Field>
 * ```
 */
export const SelectFieldInput = createFieldInput<string[], {}, SelectField>(
  ({ name, readOnly, fieldDef, field, index, submissionAttempts }) => {
    const isOnModalSurface = useModalSurface();
    const isReadOnly = readOnly || fieldDef.admin.readOnly;
    const isInvalid = isFieldShowingError({ field, submissionAttempts });

    function handleOptionToggle(value: string) {
      const current = field.state.value ?? [];
      if (fieldDef.hasMany) {
        field.handleChange(
          current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value],
        );
      } else {
        field.handleChange(current.includes(value) ? [] : [value]);
      }
    }

    if (fieldDef.admin.display === SELECT_DISPLAYS.radio) {
      return (
        <div className="flex flex-col gap-1.5">
          <span
            id={`${name}-label`}
            className="relative flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
          >
            {index !== undefined ? `[${index + 1}] - ` : ""}
            {fieldDef.label || name}
            {fieldDef.required && <span className="text-red-500">*</span>}
          </span>
          {fieldDef.hasMany ? (
            <div
              role="group"
              aria-labelledby={`${name}-label`}
              aria-disabled={isReadOnly}
              className="flex flex-col gap-2"
            >
              {fieldDef.options.map((option, optionIndex) => (
                <label
                  key={`${name}-option-${optionIndex}`}
                  className="flex items-center gap-2 text-sm"
                >
                  <Checkbox
                    checked={(field.state.value ?? []).includes(option.value)}
                    disabled={isReadOnly}
                    onCheckedChange={() => handleOptionToggle(option.value)}
                    onBlur={field.handleBlur}
                    aria-invalid={isInvalid}
                    aria-label={option.label}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          ) : (
            <RadioGroup
              aria-labelledby={`${name}-label`}
              disabled={isReadOnly}
              value={(field.state.value ?? [])[0]}
              onValueChange={(value) => field.handleChange([value as string])}
              onBlur={field.handleBlur}
              className="gap-2"
            >
              {fieldDef.options.map((option, optionIndex) => (
                <label
                  key={`${name}-option-${optionIndex}`}
                  className="flex items-center gap-2 text-sm"
                >
                  <RadioGroupItem
                    value={option.value}
                    aria-invalid={isInvalid}
                    aria-label={option.label}
                  />
                  {option.label}
                </label>
              ))}
            </RadioGroup>
          )}
          <FormDescription field={fieldDef} />
          <FormError field={field} submissionAttempts={submissionAttempts} />
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-1.5">
        <FormLabel field={fieldDef} index={index} name={name} />
        <MultiSelect
          modal={isOnModalSurface}
          onValuesChange={field.handleChange}
          single={!fieldDef.hasMany}
          values={field.state.value}
        >
          <MultiSelectTrigger
            id={name}
            className="w-full"
            onBlur={field.handleBlur}
            name={name}
            aria-required={fieldDef.required}
            aria-invalid={isInvalid}
            disabled={isReadOnly}
          >
            <MultiSelectValue placeholder={fieldDef.admin.placeholder} />
          </MultiSelectTrigger>
          <MultiSelectContent
            onBlur={field.handleBlur}
            className="w-full"
            search={fieldDef.admin.searchable}
          >
            <MultiSelectGroup>
              {fieldDef.options.map((o, i) => (
                <MultiSelectItem
                  value={o.value}
                  key={`multi-select-item-${name}-${i}`}
                >
                  {o.label}
                </MultiSelectItem>
              ))}
            </MultiSelectGroup>
          </MultiSelectContent>
        </MultiSelect>
        <FormDescription field={fieldDef} />
        <FormError field={field} submissionAttempts={submissionAttempts} />
      </div>
    );
  },
);
