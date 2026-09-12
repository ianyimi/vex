"use client";

import { useEffect } from "react";
import { CONSTRAINT_COMPARATORS } from "@vexcms/core";
import type { AnyFormApi } from "../components/form/AppFormContext";
import { isFieldKeyDirty } from "../components/form/changedValues";

/**
 * Keeps untouched fields in sync with the live document while leaving the
 * user's unsaved edits alone.
 *
 * `FormApi.update` refuses to adopt new `defaultValues` once ANY field is
 * touched — a form-wide freeze that is the right default (it won't clobber a
 * form someone is typing into) but is all-or-nothing. This narrows the merge
 * to per field: an untouched field follows the server; a field the user has
 * edited is theirs until they save or reset.
 *
 * Writes through `dontUpdateMeta: true` so an adopted value does not mark the
 * field touched or dirty — it stays eligible for future merges, and
 * `changedValues` keeps excluding it, so adopting a live value can never
 * cause a stale save to write it back. The adopted value also becomes the
 * field's new default, so `form.reset()` returns to the live document rather
 * than the value on screen at mount, and Save (gated on `isDefaultValue`)
 * stops enabling itself for an editor who changed nothing.
 *
 * Comparison is `CONSTRAINT_COMPARATORS.eq` (content equality), because
 * `relationship`/`select` store arrays, where `===` would report a change on
 * every render.
 *
 * @param props.form - The edit view's form instance.
 * @param props.document - The live document from the Convex subscription.
 * @param props.fieldKeys - Top-level field names, from the collection/global
 *   config — keeps the merge at the same granularity as the field map and the
 *   `readOnly` gate.
 */
export function useLiveFieldMerge(props: {
  form: AnyFormApi;
  document: Record<string, unknown> | null | undefined;
  fieldKeys: readonly string[];
}): void {
  const { form, document, fieldKeys } = props;

  useEffect(() => {
    if (!document) return;

    for (const key of fieldKeys) {
      if (isFieldKeyDirty(form, key)) continue;
      if (!Object.prototype.hasOwnProperty.call(document, key)) continue;

      const incoming = document[key];
      if (CONSTRAINT_COMPARATORS.eq(form.getFieldValue(key), incoming)) continue;

      form.setFieldValue(key, incoming, { dontUpdateMeta: true });
    }
    // `form`/`fieldKeys` intentionally omitted: the same form instance and the
    // same config-derived key list persist for the edit view's lifetime, and
    // the per-field guards above are idempotent, so re-running only on
    // `document` never misses a merge.
  }, [document]);
}
