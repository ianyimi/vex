"use client";

import type { UploadField } from "@vexcms/core";
import { createFieldInput } from "../../form/createFieldInput";
import { FormDescription } from "../../form/FormDescription";
import { FormError } from "../../form/FormError";
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
 * Renders inside a `role="group" aria-labelledby` wrapper in every state
 * (LABEL-1) rather than a `<label htmlFor>`: only the empty state's dropzone
 * `<input type="file">` is a real focusable control, so a single-control
 * `<label>` association would dangle in the filled/read-only states, which
 * have none — the same fieldset/legend-equivalent pattern used by the
 * `array`/`group`/`blocks` containers.
 *
 * @param props — Field input component props.
 * @returns The upload field input element.
 */
export const UploadFieldInput = createFieldInput<string[], {}, UploadField>(
  ({ name, collection, fieldDef, field, readOnly, index, submissionAttempts }) => {
    const [activeField, setActiveField] = useQueryState(MODALS.editMedia.urlParam, parseAsString);
    const [defaultTab, setDefaultTab] = useState<"library" | "upload">("library");
    const [stagedFiles, setStagedFiles] = useState<File[]>([]);
    const isOpen = activeField === name;
    const value = field.state.value || [];
    const config = useVexConfig();
    // Both readOnly sources (design-change item 4): the `readOnly` prop and
    // `fieldDef.admin.readOnly` are independent — either one alone disables
    // editing, matching every other field type's own OR-composition.
    const isReadOnly = readOnly || fieldDef.admin.readOnly;

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
      // Drag-and-drop bypasses the OS picker's own `multiple` restriction
      // entirely, so a single-select field must also truncate here — the
      // dropzone's `multiple={fieldDef.hasMany}` (EmptyInput.tsx) only
      // covers the file-picker-dialog path.
      setStagedFiles(fieldDef.hasMany ? files : files.slice(0, 1));
      setDefaultTab("upload");
      await openPicker();
    }

    const label = (
      <span
        id={`${name}-label`}
        className="relative flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
      >
        {index !== undefined ? `[${index + 1}] - ` : ""}
        {fieldDef.label || name}
        {fieldDef.required && <span className="text-red-500">*</span>}
      </span>
    );

    if (isReadOnly) {
      return (
        <div
          className="flex flex-col gap-1.5"
          role="group"
          aria-labelledby={`${name}-label`}
          aria-disabled={isReadOnly}
        >
          {label}
          {value.length > 0 ? (
            <UploadFilledState
              collection={collection}
              readOnly={isReadOnly}
              mediaIds={value}
              fieldApi={field}
              fieldDef={fieldDef}
              onRemove={handleRemove}
              openPicker={openPicker}
            />
          ) : (
            <div className="text-sm text-muted-foreground">—</div>
          )}
          <FormDescription field={fieldDef} />
          <FormError field={field} submissionAttempts={submissionAttempts} />
        </div>
      );
    }

    if (value.length === 0) {
      return (
        <div
          className="flex flex-col gap-1.5"
          role="group"
          aria-labelledby={`${name}-label`}
          aria-disabled={isReadOnly}
        >
          {label}
          <UploadEmpty
            name={name}
            readOnly={isReadOnly}
            onPickerOpen={openPicker}
            fieldDef={fieldDef}
            targetCollectionConfig={targetCollectionConfig}
            onFilesSelected={handleFilesSelected}
            onBlur={field.handleBlur}
          />
          <FormDescription field={fieldDef} />
          <FormError field={field} submissionAttempts={submissionAttempts} />
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
        </div>
      );
    }

    return (
      <div
        className="flex flex-col gap-1.5"
        role="group"
        aria-labelledby={`${name}-label`}
        aria-disabled={isReadOnly}
      >
        {label}
        <UploadFilledState
          readOnly={isReadOnly}
          collection={collection}
          mediaIds={value}
          fieldApi={field}
          fieldDef={fieldDef}
          onRemove={handleRemove}
          onReorder={handleReorder}
          openPicker={openPicker}
        />
        <FormDescription field={fieldDef} />
        <FormError field={field} submissionAttempts={submissionAttempts} />
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
      </div>
    );
  },
);
