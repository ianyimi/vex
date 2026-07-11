"use client";

import type { UploadField } from "@vexcms/core";
import { createFieldInput, FormLabel } from "../../form";
import { MediaPicker } from "../../media";
import { useVexConfig } from "../../../context";
import { UploadEmpty } from "./EmptyInput";
import { UploadFilledState } from "./FilledInput";
import { parseAsString, useQueryState } from "nuqs";
import { MODALS } from "../../modals";
import { useState } from "react";

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
    const [defaultTab, setDefaultTab] = useState<"library" | "upload">("library");
    const [stagedFiles, setStagedFiles] = useState<File[]>([]);
    const isOpen = activeField === name;
    const value = field.state.value || [];
    const config = useVexConfig();

    const targetCollectionConfig = config.mediaCollections.find((mc) => mc.slug === fieldDef.to);
    if (!targetCollectionConfig) {
      throw new Error(`Media collection "${fieldDef.to}" not found in config.`);
    }

    async function openPicker() {
      await setActiveField(name);
    }
    async function closePicker() {
      await setActiveField(null);
      setDefaultTab("library"); // Reset to library on close
      setStagedFiles([]); // Clear pending files
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

    async function handleFilesSelected(files: File[]) {
      setStagedFiles(files);
      setDefaultTab("upload");
      await openPicker();
    }

    if (readOnly) {
      <>
        <FormLabel name={name} field={fieldDef} />
        {value.length > 0 ? (
          <UploadFilledState
            mediaIds={value}
            fieldApi={field}
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
            fieldDef={fieldDef}
            targetCollectionConfig={targetCollectionConfig}
            onFilesSelected={handleFilesSelected}
          />
          {isOpen && (
            <MediaPicker
              field={field}
              fieldDef={fieldDef}
              targetCollection={fieldDef.to}
              multi={fieldDef.hasMany}
              onSelect={handleSelect}
              onCancel={closePicker}
              defaultTab={defaultTab}
              stagedFiles={stagedFiles}
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
          fieldApi={field}
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
