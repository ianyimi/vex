"use client";

import { type SelectField } from "@vexcms/core";
import { useModalSurface } from "../../../hooks/useModalSurface";
import { createFieldInput, FormDescription, FormLabel, FormError } from "../../form";
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
 * Fields are rendered generically by `RenderFieldInputComponents`, so there is
 * no prop channel to tell this input it sits in a dialog. It reads
 * `useModalSurface()` instead, which `Modal` provides: inside a dialog the
 * popover joins that surface's focus trap, and everywhere else it stays
 * non-modal so it does not lock page scroll and snap the view to the top.
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
    // Inside a dialog the popover must be modal so it joins that dialog's
    // focus trap; on a normal page it must not be, because a modal popover
    // locks page scroll and snaps the view to the top.
    const isOnModalSurface = useModalSurface();
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
            className="w-full"
            onBlur={field.handleBlur}
            name={name}
            aria-readonly={fieldDef.admin.readOnly}
            disabled={readOnly}
          >
            <MultiSelectValue placeholder={fieldDef.admin.placeholder} />
          </MultiSelectTrigger>
          <MultiSelectContent onBlur={field.handleBlur} className="w-full">
            <MultiSelectGroup>
              {fieldDef.options.map((o, index) => (
                <MultiSelectItem value={o.value} key={`multi-select-item-${name}-${index}`}>
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
