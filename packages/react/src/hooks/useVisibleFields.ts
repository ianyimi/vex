"use client";

import { CRUD_ACTIONS, isFieldAllowed } from "@vexcms/core";
import { useMemo } from "react";
import { useFieldPermissions } from "./useFieldPermissions";

/**
 * The subset of a resource's configured fields the caller may READ, in
 * declaration order — what an edit view should render at all.
 *
 * Separate from the `update` gating that drives each input's `readOnly`, and
 * needed for the same reason list views filter their column defs: an edit view
 * derives its inputs from the CONFIG, so server-side read-stripping removes a
 * field's value but cannot remove its input. Without this, a read-denied field
 * renders as a permanently empty control, which advertises a field the caller
 * may not see and reads as a bug.
 *
 * Hidden, not merely disabled — a caller who cannot read a field has no
 * business seeing its presence. That is the opposite posture to write gating,
 * where the value IS readable and disabling it shows the caller what they
 * cannot change.
 *
 * Advisory, like every client-side check: the server has already stripped the
 * values, so this only decides what is drawn.
 *
 * Only a DISCRIMINATING decision hides anything. A read that resolves to a
 * blanket "no field is readable" — a caller holding no known role, or a role
 * whose `read` is a flat `false` — is the document-level check's business, and
 * it has already run by the time a view renders. Hiding every input there
 * would swap the established disabled-form behavior for an empty form with a
 * Save button, and leak nothing either way since the values are gone.
 *
 * @typeParam TField - The resource's field-definition shape.
 * @param props.resource - Collection or global slug.
 * @param props.fields - The resource's configured fields.
 * @param props.data - The loaded document, forwarded to the filter callback so
 *   a per-document read rule resolves against the row actually on screen.
 * @returns `[key, field]` entries the caller may read.
 */
export function useVisibleFields<TField, TData>(props: {
  resource: string;
  fields: Record<string, TField>;
  data?: TData;
}): Array<[string, TField]> {
  const readPermissions = useFieldPermissions({
    resource: props.resource,
    action: CRUD_ACTIONS.read,
    data: props.data,
  });

  return useMemo(() => {
    const entries = Object.entries(props.fields);
    const discriminates =
      readPermissions.wildcard === true || Object.keys(readPermissions.fields).length > 0;
    if (!discriminates) return entries;
    return entries.filter(([fieldKey]) => isFieldAllowed(readPermissions, fieldKey));
  }, [props.fields, readPermissions]);
}
