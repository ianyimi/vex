"use client";

import { useVexAccess } from "../config";
import { useVexAuth } from "../auth";
import { hasPermission } from "@vexcms/core";

/**
 * S5 context hook — binds `hasPermission` to the current user, for a slot contribution's
 * `access` predicate (`SlotAccessContext`) and for a project's own slot components that need the
 * same check. Thin wrapper over `useVexAccess`/`useVexAuth`, which already carry the resolved
 * access config and current user respectively.
 *
 * Experimental: breaking changes are still possible before this stabilizes.
 * @returns An object exposing `hasPermission(resource, action)` bound to the current user.
 */
export function useVexPermissions(): {
  hasPermission: (resource: string, action: string) => boolean;
} {
  const access = useVexAccess();
  const auth = useVexAuth();
  return {
    hasPermission: (resource: string, action: string) => {
      if (!access) return true; // no access config configured: everything allowed, matching core's own resolveGetAuth fallback
      return hasPermission({
        access,
        user: auth?.user,
        resource,
        action,
      });
    },
  };
}
