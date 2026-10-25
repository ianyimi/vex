"use client";

import { useState } from "react";
import { parseAsString, useQueryState } from "nuqs";
import type {
  CollectionFieldMeta,
  RelationshipField,
  VexResourceSlug,
} from "@vexcms/core";
import { VERSION_STATUSES } from "@vexcms/core";
import { createFieldInput } from "../../form/createFieldInput";
import { FormDescription } from "../../form/FormDescription";
import { FormError } from "../../form/FormError";
import { useVexConfig } from "../../../context/VexConfigContext";
import { RelationshipPicker } from "../../relationship";
import { MODALS } from "../../modals/constants";
import { RelationshipEmpty } from "./EmptyInput";
import { RelationshipFilledState } from "./FilledInput";

/**
 * Relationship field input — empty / filled / read-only state switch, mirroring
 * `UploadFieldInput` (Decision 9).
 *
 * The picker dialog is driven by `MODALS.relationshipPicker`'s URL param
 * (`?relationship=<field name>`), the same `activeField === name` pattern the
 * upload field uses for `editMedia`. Target drafts are visible only while the
 * document being edited is itself a draft (`documentStatus === "draft"`) —
 * carried over unchanged from the previous combobox implementation.
 *
 * Renders inside a `role="group" aria-labelledby` wrapper in every state
 * (LABEL-1), same reasoning as `UploadFieldInput`: once the field has more
 * than one focusable control, a single `<label htmlFor>` can't associate with
 * all of them.
 *
 * @param props - Field input component props.
 * @returns The relationship field input element.
 */
export const RelationshipFieldInput = createFieldInput<
  string[],
  CollectionFieldMeta,
  RelationshipField<VexResourceSlug, CollectionFieldMeta>
>(
  ({
    name,
    readOnly,
    fieldDef,
    field,
    index,
    submissionAttempts,
    documentStatus,
  }) => {
    const config = useVexConfig();
    const [activeField, setActiveField] = useQueryState(
      MODALS.relationshipPicker.urlParam,
      parseAsString,
    );
    const [defaultTab, setDefaultTab] = useState<"select" | "create">("select");
    const isOpen = activeField === name;
    const isReadOnly = readOnly || fieldDef.admin.readOnly;
    const drafts = documentStatus === VERSION_STATUSES.draft.key;
    const value: string[] = field.state.value ?? [];

    const targetCollection = config.collections.find(
      (c) => c.slug === fieldDef.collection.slug,
    );

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

    if (!targetCollection) {
      return (
        <div
          className="flex flex-col gap-1.5"
          role="group"
          aria-labelledby={`${name}-label`}
        >
          {label}
          <p className="text-xs text-destructive">
            Unknown collection: <code>{fieldDef.collection.slug}</code>
          </p>
        </div>
      );
    }

    async function openPicker(tab: "select" | "create" = "select") {
      setDefaultTab(tab);
      await setActiveField(name);
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
            <RelationshipFilledState
              fieldDef={fieldDef}
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
          <FormDescription field={fieldDef} />
          <FormError field={field} submissionAttempts={submissionAttempts} />
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
        {value.length === 0 ? (
          <RelationshipEmpty
            fieldDef={fieldDef}
            targetCollection={targetCollection}
            readOnly={isReadOnly}
            onPickerOpen={(tab) => void openPicker(tab)}
          />
        ) : (
          <RelationshipFilledState
            fieldDef={fieldDef}
            targetCollection={targetCollection}
            docIds={value}
            drafts={drafts}
            readOnly={isReadOnly}
            onRemove={handleRemove}
            onReorder={fieldDef.hasMany ? handleReorder : undefined}
            onClear={handleClear}
            openPicker={() => void openPicker()}
          />
        )}
        <FormDescription field={fieldDef} />
        <FormError field={field} submissionAttempts={submissionAttempts} />
        {isOpen && (
          <RelationshipPicker
            fieldDef={fieldDef}
            targetCollection={targetCollection}
            selectedIds={value}
            drafts={drafts}
            defaultTab={defaultTab}
            onSelect={handleSelect}
            onCancel={() => void closePicker()}
          />
        )}
      </div>
    );
  },
);
