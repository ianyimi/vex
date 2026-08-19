"use client";

import { hasPermission, HasPermissionProps, SubjectEntry } from "@vexcms/core";
import { useVexAccess } from "../context/VexAccessContext";
import { useVexAuth } from "../context/VexAuthContext";

/**
 * Client-side permission check for UI affordances (advisory — server guards enforce).
 *
 * @param props.resource - Subject slug (collection/global/media/`adminPanel`).
 * @param props.action - Action to check.
 * @param props.data - The concrete document for an exact per-doc check (edit views).
 * @param props.scope - Which question to ask when `data` is omitted and the
 *   matrix check is a callback: `"all"` (default) → `false` (fail-closed),
 *   `"any"` → `true` (sidebar/list gating), `"doc"` → throws, for edit views
 *   that must supply the document. See `PERMISSION_SCOPES`.
 * @returns boolean — `false` when no `access`/`user` (fail-closed).
 */
export function usePermission<
  TSubjects extends Record<string, SubjectEntry> = Record<string, SubjectEntry>,
  TData extends {} = {},
  TSubject extends keyof TSubjects & string = keyof TSubjects & string,
>(
  props: Omit<HasPermissionProps<TSubjects, TSubject, TData>, "user" | "organization" | "access">,
): boolean {
  const access = useVexAccess<TSubjects>();
  const { user, organization } = useVexAuth();
  return hasPermission({
    access,
    user,
    organization,
    ...props,
  });
}
