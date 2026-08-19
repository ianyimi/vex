"use client";

import { CRUD_ACTIONS, type SelectField } from "@vexcms/core";
import { createFieldInput, FormDescription, FormLabel, FormError } from "../../form";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "../../ui/multi-select";
import { usePermission } from "../../../hooks";

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
  ({ name, collection, fieldDef, field, index, submissionAttempts }) => {
    const canEdit = usePermission({ resource: collection.slug, action: CRUD_ACTIONS.update });
    return (
      <div className="flex flex-col gap-1.5">
        <FormLabel field={fieldDef} index={index} name={name} />
        <MultiSelect
          onValuesChange={field.handleChange}
          single={!fieldDef.hasMany}
          values={field.state.value}
        >
          <MultiSelectTrigger
            className="w-full"
            onBlur={field.handleBlur}
            name={name}
            aria-readonly={fieldDef.admin.readOnly}
            disabled={!canEdit}
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
