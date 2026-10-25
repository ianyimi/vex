"use client";

import { Button } from "../../ui";
import type { CollectionConfig, RelationshipField } from "@vexcms/core";

/**
 * Props for {@link RelationshipEmpty}.
 */
export interface RelationshipEmptyProps {
  /** The resolved relationship field definition. */
  fieldDef: RelationshipField;
  /** The resolved target collection. */
  targetCollection: CollectionConfig;
  /** Whether the field is non-editable. */
  readOnly: boolean;
  /** Opens the picker dialog on the given tab. */
  onPickerOpen: (defaultTab: "select" | "create") => void;
}

/**
 * Empty state for the relationship field — a dashed dropzone-style box with
 * "Select …" (opens the picker's Select tab) and "Create …" (opens its Create
 * tab) buttons. Matches `UploadEmpty`'s layout.
 *
 * @param props - Component props.
 * @returns The empty-state box.
 */
export function RelationshipEmpty({
  fieldDef,
  targetCollection,
  readOnly,
  onPickerOpen,
}: RelationshipEmptyProps) {
  const label = fieldDef.hasMany
    ? targetCollection.labels.plural
    : targetCollection.labels.singular;
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-input p-8 text-center">
      <p className="text-sm text-muted-foreground">
        No {label.toLowerCase()} selected
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          icon="Search"
          onClick={() => onPickerOpen("select")}
          disabled={readOnly}
        >
          Select {label}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon="Plus"
          onClick={() => onPickerOpen("create")}
          disabled={readOnly}
        >
          Create {targetCollection.labels.singular}
        </Button>
      </div>
    </div>
  );
}
