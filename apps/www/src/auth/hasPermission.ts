"use client";

import { hasPermission as hasPermissionCore, type HasPermissionProps } from "@vexcms/core";

import { useAuth } from "~/context/AuthContext";

import { access } from "./access";

type Subjects = NonNullable<typeof access.__subjects>;
/**
 * Client-side permission check for UI affordances (advisory — server guards enforce).
 *
 * @param props.resource - Subject slug (collection/global/media/`adminPanel`).
 * @param props.action - Action to check.
 * @param props.data - The concrete document for an exact per-doc check (edit views).
 * @param props.scope - How many documents to check for in the permissions
 *   callback: `"doc"` this doc only (requires 'data'), `"any"` (default) →
 *   any 1 or more documents (sidebar/list gating), `"all"` → all documents in the collection
 *   (bulk actions). See `PERMISSION_SCOPES`.
 * @returns boolean — `false` when no `access`/`user` (fail-closed).
 */
export function hasPermission<TSubject extends keyof Subjects, TData extends object = object>(
  props: Omit<HasPermissionProps<Subjects, TSubject, TData>, "access" | "organization" | "user">,
): boolean {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { user, organization } = useAuth();
  return hasPermissionCore({
    access,
    user,
    organization,
    ...props,
  });
}
