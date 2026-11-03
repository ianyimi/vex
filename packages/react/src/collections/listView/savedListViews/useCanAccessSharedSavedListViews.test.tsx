import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { defineAccess, defineCollection, defineConfig, text, type VexAccessConfig, type VexApiAuth } from "@vexcms/core";
import { useCanAccessSharedSavedListViews } from "./useCanAccessSharedSavedListViews";
import { VexConfigProvider } from "../../../config/VexConfigContext";
import { VexAuthProvider } from "../../../auth/VexAuthContext";

const posts = defineCollection({ slug: "posts", fields: { title: text() } });

/** Wraps a hook render in the real `VexConfigProvider`/`VexAuthProvider` pair, same pattern `usePermission.test.tsx` uses. */
function Providers(access: VexAccessConfig | undefined, auth: VexApiAuth) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <VexConfigProvider config={defineConfig({ access })}>
        <VexAuthProvider value={auth}>{children}</VexAuthProvider>
      </VexConfigProvider>
    );
  };
}

const orgScopedAccess = defineAccess({
  roles: ["editor"] as const,
  resources: [posts],
  userCollectionSlug: "users",
  userRolesField: "roles",
  orgCollectionSlug: "organizations",
  organizations: true,
  permissions: { editor: { posts: { createView: true, readViews: true, updateView: true, deleteView: true } } },
});

// The apps/test regression fixture: `orgCollectionSlug` declared (e.g. so a
// project's own permission callbacks can read `organization`), but
// `organizations` deliberately NOT set — scoping must stay off.
const orgCollectionSlugOnlyAccess = defineAccess({
  roles: ["editor"] as const,
  resources: [posts],
  userCollectionSlug: "users",
  userRolesField: "roles",
  orgCollectionSlug: "organizations",
  permissions: { editor: { posts: { createView: true, readViews: true, updateView: true, deleteView: true } } },
});

const noOrgAccess = defineAccess({
  roles: ["editor"] as const,
  resources: [posts],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: { editor: { posts: { createView: true } } },
});

describe("useCanAccessSharedSavedListViews", () => {
  it("returns true when no access config is set at all", () => {
    const { result } = renderHook(() => useCanAccessSharedSavedListViews(), {
      wrapper: Providers(undefined, { user: null }),
    });
    expect(result.current).toBe(true);
  });

  it("returns true when access is configured but neither orgCollectionSlug nor organizations is set", () => {
    const { result } = renderHook(() => useCanAccessSharedSavedListViews(), {
      wrapper: Providers(noOrgAccess, { user: { roles: ["editor"] } }),
    });
    expect(result.current).toBe(true);
  });

  it("returns true when orgCollectionSlug is configured but organizations is NOT set (the apps/test regression — orgCollectionSlug alone never scoped anything)", () => {
    const { result } = renderHook(() => useCanAccessSharedSavedListViews(), {
      wrapper: Providers(orgCollectionSlugOnlyAccess, { user: { roles: ["editor"] }, organization: undefined }),
    });
    expect(result.current).toBe(true);
  });

  it("returns false when access.organizations is true and the caller has no organization", () => {
    const { result } = renderHook(() => useCanAccessSharedSavedListViews(), {
      wrapper: Providers(orgScopedAccess, { user: { roles: ["editor"] }, organization: undefined }),
    });
    expect(result.current).toBe(false);
  });

  it("returns false when access.organizations is true and organization is present but has no _id", () => {
    const { result } = renderHook(() => useCanAccessSharedSavedListViews(), {
      wrapper: Providers(orgScopedAccess, { user: { roles: ["editor"] }, organization: {} }),
    });
    expect(result.current).toBe(false);
  });

  it("returns true when access.organizations is true and the caller's organization resolves", () => {
    const { result } = renderHook(() => useCanAccessSharedSavedListViews(), {
      wrapper: Providers(orgScopedAccess, { user: { roles: ["editor"] }, organization: { _id: "org1" } }),
    });
    expect(result.current).toBe(true);
  });
});
