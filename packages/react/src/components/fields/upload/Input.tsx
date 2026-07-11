"use client";

import type { StorageAdapterSlug, UploadField } from "@vexcms/core";
import { createFieldInput, FormLabel } from "../../form";
import { MediaPicker } from "../../media";
import { useVexConfig } from "../../../context";
import { UploadEmpty } from "./EmptyInput";
import { UploadFilledState } from "./FilledInput";
import { parseAsString, useQueryState } from "nuqs";
import { MODALS } from "../../modals";

/**
 * Upload field input with all states + array storage.
 *
 * Supports:
 * - Empty state (dropzone + "Browse media library" button)
 * - Filled state (single or multi, handled by UploadFilledState component)
 * - Multi-select controlled by `field.max` (default: 1)
 * - Stores as `string[]` — single-select fields are arrays of one
 *
 * @param props — Field input component props.
 * @returns The upload field input element.
 */
export const UploadFieldInput = createFieldInput<string[], UploadField>(
  ({ name, fieldDef, field, readOnly }) => {
    const [activeField, setActiveField] = useQueryState(MODALS.editMedia.urlParam, parseAsString);
    const isOpen = activeField === name;
    const value = field.state.value || [];
    const config = useVexConfig();

    const adapterName: StorageAdapterSlug =
      config.mediaCollections.find((mc) => mc.slug === fieldDef.to)?.meta?.storageAdapter ??
      "convex";

    async function openPicker() {
      await setActiveField(name);
    }
    async function closePicker() {
      await setActiveField(null);
    }

    async function handleSelect(mediaIds: string[]) {
      field.handleChange(mediaIds);
      await closePicker();
    }

    function handleRemove(mediaId?: string) {
      if (mediaId) {
        field.handleChange(value.filter((id) => id !== mediaId));
      } else {
        field.handleChange([]);
      }
    }

    function handleReorder(from: number, to: number) {
      field.moveValue(from, to);
    }

    if (readOnly) {
      <>
        <FormLabel name={name} field={fieldDef} />
        {value.length > 0 ? (
          <UploadFilledState
            mediaIds={value}
            fieldDef={fieldDef}
            onRemove={handleRemove}
            openPicker={openPicker}
          />
        ) : (
          <div className="text-sm text-muted-foreground">—</div>
        )}
        ;
      </>;
    }

    // Empty state
    if (value.length === 0) {
      return (
        <>
          <FormLabel name={name} field={fieldDef} />
          <UploadEmpty
            onPickerOpen={openPicker}
            onFileUpload={(mediaId) => field.handleChange([mediaId])}
            targetCollection={fieldDef.to}
            adapterName={adapterName}
          />
          {isOpen && (
            <MediaPicker
              field={field}
              fieldDef={fieldDef}
              targetCollection={fieldDef.to}
              multi={fieldDef.hasMany}
              onSelect={handleSelect}
              onCancel={closePicker}
            />
          )}
        </>
      );
    }

    // Filled state (single or multi)
    return (
      <>
        <FormLabel name={name} field={fieldDef} />
        <UploadFilledState
          mediaIds={value}
          fieldDef={fieldDef}
          onRemove={handleRemove}
          onReorder={handleReorder}
          openPicker={openPicker}
        />
        {isOpen && (
          <MediaPicker
            field={field}
            fieldDef={fieldDef}
            targetCollection={fieldDef.to}
            multi={fieldDef.hasMany}
            onSelect={handleSelect}
            onCancel={closePicker}
          />
        )}
      </>
    );
  },
);
