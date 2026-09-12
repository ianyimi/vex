"use client";

import { resolveFieldPermissions } from "@vexcms/core";
import type { PermissionScope, ResolvedFieldPermissions } from "@vexcms/core";
import { useVexAccess } from "../context/VexAccessContext";
import { useVexAuth } from "../context/VexAuthContext";

/**
 * Which fields the current caller may touch — client-side, advisory, no server
 * round trip (the server API remains the enforcement point). Mirrors
 * `usePermission`, which answers the document-level question against the same
 * bundle-imported config.
 *
 * @param props.resource - Subject name (collection or global slug).
 * @param props.action - Action on `resource` (`"update"` for an edit form,
 *   `"read"` for a list view's column gating).
 * @param props.data - The loaded document, forwarded to the filter callback.
 * @param props.scope - How to resolve when `data` is unavailable and a
 *   per-field expression needs a document. List views pass
 *   `PERMISSION_SCOPES.any` (a column can't answer a per-row question).
 *   Defaults to `PERMISSION_SCOPES.all`, matching `resolveFieldPermissions`.
 * @returns The merged decision. Read a single field with `isFieldAllowed`.
 */
export function useFieldPermissions<TData>(props: {
  resource: string;
  action: string;
  data?: TData;
  scope?: PermissionScope;
}): ResolvedFieldPermissions {
  const access = useVexAccess();
  const { user, organization } = useVexAuth();
  return resolveFieldPermissions({ access, user, organization, ...props });
}
