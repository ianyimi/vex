"use client";

import { useState } from "react";
import type { AnyFieldApi } from "@tanstack/react-form";
import { useStore } from "@tanstack/react-form";
import { parseAsString, useQueryState } from "nuqs";
import type {
  CollectionFieldMeta,
  FieldComponentProps,
  RelationshipField,
  VexResourceSlug,
} from "@vexcms/core";
import { VERSION_STATUSES } from "@vexcms/core";
import { useFieldContext, useFormContext, isFieldShowingError } from "../../forms";
import { FieldError, FieldGroupBox } from "../../ui/field";
import { useVexConfig } from "../../config/VexConfigContext";
import { RelationshipPicker } from "./RelationshipPicker";
import { MODALS } from "../../modals/constants";
import { AdminFieldBinding } from "../AdminFieldBinding";
import { RelationshipEmpty } from "./EmptyInput";
import { RelationshipFilledState } from "./FilledInput";

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
 * Relationship admin field's own render body — empty / filled / read-only
 * state switch, mirroring `UploadFieldAdmin` (Decision 9).
 *
 * The picker dialog is driven by `MODALS.relationshipPicker`'s URL param
 * (`?relationship=<field name>`), the same `activeField === name` pattern
 * the upload field uses for `editMedia`. Target drafts are visible only
 * while the document being edited is itself a draft
 * (`documentStatus === "draft"`) — carried over unchanged from the previous
 * combobox implementation.
 *
 * Renders inside a `role="group" aria-labelledby` wrapper in every state
 * (LABEL-1), same reasoning as `UploadFieldAdmin`: once the field has more
 * than one focusable control, a single `<label htmlFor>` can't associate
 * with all of them.
 *
 * @param props - {@link FieldComponentProps} narrowed to `RelationshipField`.
 * @returns The relationship field's empty/filled/read-only render body.
 */
function RelationshipFieldAdminInner(
  props: FieldComponentProps<CollectionFieldMeta, RelationshipField<VexResourceSlug, CollectionFieldMeta>>,
) {
  const field = useFieldContext<string[]>();
  const config = useVexConfig();
  const [activeField, setActiveField] = useQueryState(
    MODALS.relationshipPicker.urlParam,
    parseAsString,
  );
  const [defaultTab, setDefaultTab] = useState<"select" | "create">("select");
  const isOpen = activeField === props.name;
  const isReadOnly = props.readOnly || props.fieldDef.admin.readOnly;
  const drafts = props.documentStatus === VERSION_STATUSES.draft.key;
  const value: string[] = field.state.value ?? [];

  const targetCollection = config.collections.find(
    (c) => c.slug === props.fieldDef.collection.slug,
  );

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

  if (!targetCollection) {
    return (
      <div
        className="flex flex-col gap-1.5"
        role="group"
        aria-labelledby={`${props.name}-label`}
      >
        {label}
        <p className="text-xs text-destructive">
          Unknown collection: <code>{props.fieldDef.collection.slug}</code>
        </p>
      </div>
    );
  }

  async function openPicker(tab: "select" | "create" = "select") {
    setDefaultTab(tab);
    await setActiveField(props.name);
  }

  async function closePicker() {
    await setActiveField(null);
  }

  function handleSelect(ids: string[]) {
    field.handleChange(ids);
    void closePicker();
  }

  function handleRemove(docId: string) {
    field.handleChange(value.filter((id) => id !== docId));
  }

  function handleClear() {
    field.handleChange([]);
  }

  function handleReorder(from: number, to: number) {
    field.moveValue(from, to);
  }

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
          <RelationshipFilledState
            fieldDef={props.fieldDef}
            targetCollection={targetCollection}
            docIds={value}
            drafts={drafts}
            readOnly
            onRemove={handleRemove}
            onClear={handleClear}
            openPicker={() => void openPicker()}
          />
        ) : (
          <div className="text-sm text-muted-foreground">—</div>
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
      {value.length === 0 ? (
        <RelationshipEmpty
          fieldDef={props.fieldDef}
          targetCollection={targetCollection}
          readOnly={isReadOnly}
          onPickerOpen={(tab) => void openPicker(tab)}
        />
      ) : (
        <RelationshipFilledState
          fieldDef={props.fieldDef}
          targetCollection={targetCollection}
          docIds={value}
          drafts={drafts}
          readOnly={isReadOnly}
          onRemove={handleRemove}
          onReorder={props.fieldDef.hasMany ? handleReorder : undefined}
          onClear={handleClear}
          openPicker={() => void openPicker()}
        />
      )}
      {isOpen && (
        <RelationshipPicker
          fieldDef={props.fieldDef}
          targetCollection={targetCollection}
          selectedIds={value}
          drafts={drafts}
          defaultTab={defaultTab}
          onSelect={handleSelect}
          onCancel={() => void closePicker()}
        />
      )}
    </FieldGroupBox>
  );
}

/**
 * Relationship admin field — binds `props.name` to the nearest `<AppForm>`
 * (or an explicit `field` prop) via `AdminFieldBinding`, then renders the
 * empty/filled/read-only state switch.
 *
 * @param props - {@link FieldComponentProps} narrowed to `RelationshipField`.
 * @returns The relationship field's rendered state.
 */
export function RelationshipFieldAdmin(
  props: FieldComponentProps<CollectionFieldMeta, RelationshipField<VexResourceSlug, CollectionFieldMeta>> & {
    field?: AnyFieldApi;
  },
) {
  return (
    <AdminFieldBinding name={props.name} field={props.field}>
      <RelationshipFieldAdminInner {...props} />
    </AdminFieldBinding>
  );
}

export { RelationshipEmpty } from "./EmptyInput";
export { RelationshipFilledState } from "./FilledInput";
