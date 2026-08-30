"use client";

import { hasPermission as hasPermissionCore, type HasPermissionProps } from "@vexcms/core";

import { useAuth } from "~/context/AuthContext";

import { access } from "./access";

type Subjects = NonNullable<typeof access.__subjects>;
/**
 * Client-side permission check for UI affordances (advisory — server guards enforce).
 *
 * Kept alongside `@vexcms/react`'s `usePermission` deliberately: the frontend tree is
 * not wrapped in the Vex providers, so this reads the app's own `AuthContext` and
 * imports the access config directly instead of resolving both from context.
 *
 * @param props.resource - Subject slug (collection/global/media/`adminPanel`).
 * @param props.action - Action to check.
 * @param props.data - The concrete document for an exact per-doc check (edit views).
 * @param props.scope - How to answer when a check needs the document and `data` was
 *   not supplied: `"all"` (the default) → false, `"any"` → true (sidebar/list
 *   gating), `"doc"` → throws (edit views — pass `data`). No effect when `data` is
 *   given. See `PERMISSION_SCOPES`.
 * @returns The permission boolean. `false` for a signed-out user; `true` when no
 *   `access` config exists at all — the access system being absent is the documented
 *   open-by-default escape hatch, not a denial.
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
