"use client";

import { MODALS } from "../../modals";

import { useState } from "react";
import type { AnyFieldApi } from "@tanstack/react-form";
import { useStore } from "@tanstack/react-form";
import { parseAsString, useQueryState } from "nuqs";
import type { FieldComponentProps, UploadField } from "@vexcms/core";
import { useFieldContext, useFormContext, isFieldShowingError } from "../../forms";
import { FieldError, FieldGroupBox } from "../../ui/field";
import { MediaPicker } from "../../media";
import { useVexConfig } from "../../config";
import { AdminFieldBinding } from "../AdminFieldBinding";
import { UploadEmpty } from "./EmptyInput";
import { UploadFilledState } from "./FilledInput";

/**
 * Extracts a field's current validation-error message, if any. TanStack
 * Form v1 stores Standard Schema issue objects in `errors[]`, not strings —
 * this reads `.message` when the error is an object (Zod v4 issues carry
 * `{ origin, code, minimum, inclusive, path, message }`).
 *
 * @param field - The field instance to read the current validation error from.
 * @returns The error message, or `undefined` if the field has no error.
 */
function getFieldErrorMessage(field: AnyFieldApi): string | undefined {
  const rawError = field.state.meta.errors[0];
  return typeof rawError === "string"
    ? rawError
    : (rawError as { message?: string } | undefined)?.message;
}

/**
 * Upload admin field's own render body — empty / filled / read-only state
 * switch with array storage.
 *
 * Supports:
 * - Empty state (dropzone + "Browse media library" button)
 * - Filled state (single or multi, handled by `UploadFilledState`)
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
 * @param props - {@link FieldComponentProps} narrowed to `UploadField`.
 * @returns The upload field's empty/filled/read-only render body.
 */
function UploadFieldAdminInner(props: FieldComponentProps<{}, UploadField>) {
  const field = useFieldContext<string[]>();
  const [activeField, setActiveField] = useQueryState(MODALS.editMedia.urlParam, parseAsString);
  const [defaultTab, setDefaultTab] = useState<"library" | "upload">("library");
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const isOpen = activeField === props.name;
  const value = field.state.value || [];
  const config = useVexConfig();
  // Both readOnly sources (design-change item 4): the `readOnly` prop and
  // `fieldDef.admin.readOnly` are independent — either one alone disables
  // editing, matching every other field type's own OR-composition.
  const isReadOnly = props.readOnly || props.fieldDef.admin.readOnly;

  const targetCollectionConfig = config.mediaCollections.find((mc) => mc.slug === props.fieldDef.to);
  if (!targetCollectionConfig) {
    throw new Error(`Media collection "${props.fieldDef.to}" not found in config.`);
  }

  async function openPicker() {
    await setActiveField(props.name);
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
    setStagedFiles(props.fieldDef.hasMany ? files : files.slice(0, 1));
    setDefaultTab("upload");
    await openPicker();
  }

  const label = (
    <span
      id={`${props.name}-label`}
      className="relative flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
    >
      {props.index !== undefined ? `[${props.index + 1}] - ` : ""}
      {props.fieldDef.label || props.name}
      {props.fieldDef.required && <span className="text-red-500">*</span>}
    </span>
  );

  const form = useFormContext();
  const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts);
  const showError = isFieldShowingError({ field, submissionAttempts });
  const errorMessage = getFieldErrorMessage(field);

  if (isReadOnly) {
    return (
      <FieldGroupBox
        labelId={`${props.name}-label`}
        label={label}
        description={props.fieldDef.description}
        disabled={isReadOnly}
        error={showError && <FieldError role="alert">{errorMessage}</FieldError>}
      >
        {value.length > 0 ? (
          <UploadFilledState
            collection={props.collection}
            readOnly={isReadOnly}
            mediaIds={value}
            fieldApi={field}
            fieldDef={props.fieldDef}
            onRemove={handleRemove}
            openPicker={openPicker}
          />
        ) : (
          <div className="text-sm text-muted-foreground">—</div>
        )}
      </FieldGroupBox>
    );
  }

  if (value.length === 0) {
    return (
      <FieldGroupBox
        labelId={`${props.name}-label`}
        label={label}
        description={props.fieldDef.description}
        disabled={isReadOnly}
        error={showError && <FieldError role="alert">{errorMessage}</FieldError>}
      >
        <UploadEmpty
          name={props.name}
          readOnly={isReadOnly}
          onPickerOpen={openPicker}
          fieldDef={props.fieldDef}
          targetCollectionConfig={targetCollectionConfig}
          onFilesSelected={handleFilesSelected}
          onBlur={field.handleBlur}
        />
        {isOpen && (
          <MediaPicker
            field={field}
            fieldDef={props.fieldDef}
            targetCollection={props.fieldDef.to}
            multi={props.fieldDef.hasMany}
            onSelect={handleSelect}
            onCancel={closePicker}
            defaultTab={defaultTab}
            stagedFiles={stagedFiles}
          />
        )}
      </FieldGroupBox>
    );
  }

  return (
    <FieldGroupBox
      labelId={`${props.name}-label`}
      label={label}
      description={props.fieldDef.description}
      disabled={isReadOnly}
      error={showError && <FieldError role="alert">{errorMessage}</FieldError>}
    >
      <UploadFilledState
        readOnly={isReadOnly}
        collection={props.collection}
        mediaIds={value}
        fieldApi={field}
        fieldDef={props.fieldDef}
        onRemove={handleRemove}
        onReorder={handleReorder}
        openPicker={openPicker}
      />
      {isOpen && (
        <MediaPicker
          field={field}
          fieldDef={props.fieldDef}
          targetCollection={props.fieldDef.to}
          multi={props.fieldDef.hasMany}
          onSelect={handleSelect}
          onCancel={closePicker}
        />
      )}
    </FieldGroupBox>
  );
}

/**
 * Upload admin field — binds `props.name` to the nearest `<AppForm>` (or an
 * explicit `field` prop) via `AdminFieldBinding`, then renders the
 * empty/filled/read-only state switch.
 *
 * @param props - {@link FieldComponentProps} narrowed to `UploadField`.
 * @returns The upload field's rendered state.
 */
export function UploadFieldAdmin(
  props: FieldComponentProps<{}, UploadField> & { field?: AnyFieldApi },
) {
  return (
    <AdminFieldBinding name={props.name} field={props.field}>
      <UploadFieldAdminInner {...props} />
    </AdminFieldBinding>
  );
}
