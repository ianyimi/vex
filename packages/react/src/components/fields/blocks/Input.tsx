"use client";

import type { BlocksField, GenericBlock } from "@vexcms/core";
import { createFieldInput, FormDescription, FormLabel, FormError, FormBlocks } from "../../form";
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
export const BlocksFieldInput = createFieldInput<GenericBlock[], BlocksField>(
  ({ name, fieldDef, field, submissionAttempts }) => {
    const [activeField, setActiveField] = useQueryState(MODALS.editBlocks.urlParam, parseAsString);
    const modalOpen = activeField === name;
    async function openEditor() {
      await setActiveField(name);
    }
    async function closeEditor() {
      await setActiveField(null);
    }
    return (
      <div className="flex flex-col gap-1.5">
        <FormLabel field={fieldDef} name={name} />
        <FormBlocks
          name={name}
          field={field}
          fieldDef={fieldDef}
          readOnly={fieldDef.admin.readOnly}
          submissionAttempts={submissionAttempts}
          modalOpen={modalOpen}
          openEditor={openEditor}
          closeEditor={closeEditor}
        />
        <FormDescription field={fieldDef} />
        <FormError field={field} submissionAttempts={submissionAttempts} />
      </div>
    );
  },
  "array",
);
