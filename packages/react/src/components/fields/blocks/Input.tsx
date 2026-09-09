"use client";

import type { BlocksField, GenericBlock } from "@vexcms/core";
import { createFieldInput } from "../../form/createFieldInput";
import { FormDescription } from "../../form/FormDescription";
import { FormBlocks } from "../../form/FormBlocks";
import { parseAsString, useQueryState } from "nuqs";
import { MODALS } from "../../modals";

/**
 * Blocks field input component for the admin edit form.
 *
 * Built with `createFieldInput` using `mode="array"`. Renders a dynamic block
 * list with a searchable Dialog picker via `FormBlocks`. Initial open/closed
 * state per block item is controlled by each block item's internal state.
 *
 * Must be rendered inside `<AppForm>`, or receive an explicit `field` prop
 * from a `<form.Field mode="array">` render prop.
 *
 * @example
 * ```tsx
 * <AppForm form={form}>
 *   <BlocksFieldInput name="body" fieldDef={bodyField} readOnly={false} />
 * </AppForm>
 * ```
 */
export const BlocksFieldInput = createFieldInput<GenericBlock[], {}, BlocksField>(
  ({ name, collection, readOnly, fieldDef, field, index, submissionAttempts }) => {
    const [activeField, setActiveField] = useQueryState(MODALS.editBlocks.urlParam, parseAsString);
    const modalOpen = activeField === name;
    async function openEditor() {
      await setActiveField(name);
    }
    async function closeEditor() {
      await setActiveField(null);
    }
    return (
      <div
        className="flex flex-col gap-1.5"
        role="group"
        aria-labelledby={`${name}-label`}
        aria-disabled={readOnly || fieldDef.admin.readOnly}
      >
        <span
          id={`${name}-label`}
          className="relative flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
        >
          {index !== undefined ? `[${index + 1}] - ` : ""}
          {fieldDef.label || name}
          {fieldDef.required && <span className="text-red-500">*</span>}
        </span>
        <FormBlocks
          name={name}
          collection={collection}
          field={field}
          fieldDef={fieldDef}
          readOnly={readOnly || fieldDef.admin.readOnly}
          submissionAttempts={submissionAttempts}
          modalOpen={modalOpen}
          openEditor={openEditor}
          closeEditor={closeEditor}
        />
        <FormDescription field={fieldDef} />
      </div>
    );
  },
  "array",
);
