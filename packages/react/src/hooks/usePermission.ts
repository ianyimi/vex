"use client";

import { hasPermission, HasPermissionProps, SubjectEntry } from "@vexcms/core";
import { useVexAccess } from "../context/VexAccessContext";
import { useVexAuth } from "../context/VexAuthContext";

/**
 * Client-side permission check for UI affordances (advisory — server guards enforce).
 *
 * @param props - The resource/action to check (plus optional `data` for an
 *   exact per-doc check, and `scope` for how to resolve a callback matrix
 *   entry when `data` is omitted); see `HasPermissionProps` in `@vexcms/core`
 *   for the full property set.
 * @returns `false` when no `access`/`user` (fail-closed).
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
