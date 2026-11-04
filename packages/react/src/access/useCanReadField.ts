"use client";

import { ALWAYS_READABLE_FIELD_KEYS, isFieldAllowed, PERMISSION_SCOPES } from "@vexcms/core";
import { useFieldPermissions } from "./useFieldPermissions";

/**
 * Resolves, ONCE per render, which fields on `resource` the current caller
 * may read — returns a callable "can I read this field" check, for a caller
 * (a list view's columns, the filter builder/chips, the Inspect peek panel)
 * that needs to ask the same question about MANY fields without re-resolving
 * permissions per field.
 *
 * Covers system fields (`_creationTime`/`updatedAt`/`vex_status` on a
 * versioned collection) and UI fields (a `ui()`-type field, e.g. a computed
 * `wordCount`) identically to a regular data field — `isFieldAllowed`'s own
 * merge logic is already fully generic by field NAME, with no special-casing
 * by kind (both are now
 * real, gateable `FieldPermissionMap` keys, and the wildcard (`"*"`) covers
 * them the same way it covers every other field). `_id` (and `_slug`, the
 * global-only discriminator) are always readable — never real field-
 * permission keys ({@link ALWAYS_READABLE_FIELD_KEYS}) — this answers `true`
 * for them without even reaching the resolved map/wildcard.
 *
 * `scope: "any"` (not {@link useFieldPermissions}'s own default of `"all"`)
 * — a column/filter-option/peek-row can't answer a per-ROW question; "is
 * this field EVER visible to this role" is the right question for list-view
 * chrome, mirroring `usePermission`'s own `scope: "any"` convention for
 * nav/sidebar gating.
 *
 * @param props.resource - Subject name (collection slug).
 * @returns A function from field name to whether the current caller may read it.
 *
 * @example
 * ```tsx
 * const canReadField = useCanReadField({ resource: collection.slug });
 * const showUpdatedAtColumn = canReadField("updatedAt");
 * const showStatusColumn = canReadField("vex_status");
 * const showWordCountField = canReadField("wordCount");
 * ```
 */
export function useCanReadField(props: { resource: string }): (field: string) => boolean {
  const resolved = useFieldPermissions({
    resource: props.resource,
    action: "read",
    scope: PERMISSION_SCOPES.any,
  });
  return (field: string) => (ALWAYS_READABLE_FIELD_KEYS.has(field) ? true : isFieldAllowed(resolved, field));
}
