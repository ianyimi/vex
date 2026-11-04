import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { defineAccess, defineCollection, defineConfig, text, type VexAccessConfig, type VexApiAuth } from "@vexcms/core";
import { useCanReadField } from "./useCanReadField";
import { VexConfigProvider } from "../config/VexConfigContext";
import { VexAuthProvider } from "../auth/VexAuthContext";

// `_creationTime`/
// `updatedAt`/`vex_status` (on a versioned collection) and a `ui()`-type
// field (e.g. `wordCount`) are all real, gateable field-permission keys now
// — `useCanReadField` must answer identically for all of them, through the
// SAME `isFieldAllowed` merge logic a regular data field already used.
const posts = defineCollection({
  slug: "posts",
  fields: { title: text(), price: text() },
});

const access = defineAccess({
  roles: ["restricted", "wildcardTrue"] as const,
  resources: [posts],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    restricted: {
      posts: {
        read: () => ({
          "*": true,
          price: false,
          _creationTime: false,
          updatedAt: false,
          vex_status: false,
          wordCount: false,
        }),
      },
    },
    wildcardTrue: { posts: { read: true } },
  },
});

const asUser = (role: string, _id = "u1"): Record<string, unknown> => ({ _id, roles: role });

/** Wraps a hook render in the real `VexConfigProvider`/`VexAuthProvider` pair. */
function Providers(accessConfig: VexAccessConfig | undefined, auth: VexApiAuth) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <VexConfigProvider config={defineConfig({ access: accessConfig })}>
        <VexAuthProvider value={auth}>{children}</VexAuthProvider>
      </VexConfigProvider>
    );
  };
}

describe("useCanReadField", () => {
  it("answers false for a denied regular data field", () => {
    const { result } = renderHook(() => useCanReadField({ resource: "posts" }), {
      wrapper: Providers(access, { user: asUser("restricted") }),
    });
    expect(result.current("price")).toBe(false);
  });

  it("answers true for a field the wildcard covers", () => {
    const { result } = renderHook(() => useCanReadField({ resource: "posts" }), {
      wrapper: Providers(access, { user: asUser("restricted") }),
    });
    expect(result.current("title")).toBe(true);
  });

  it("answers false for _creationTime, updatedAt, and vex_status when a map explicitly denies them — same mechanism as any other field", () => {
    const { result } = renderHook(() => useCanReadField({ resource: "posts" }), {
      wrapper: Providers(access, { user: asUser("restricted") }),
    });
    expect(result.current("_creationTime")).toBe(false);
    expect(result.current("updatedAt")).toBe(false);
    expect(result.current("vex_status")).toBe(false);
  });

  it("answers false for a denied UI (ui()-type) field — gated identically to a system or regular field", () => {
    const { result } = renderHook(() => useCanReadField({ resource: "posts" }), {
      wrapper: Providers(access, { user: asUser("restricted") }),
    });
    expect(result.current("wordCount")).toBe(false);
  });

  it("always answers true for _id, even under an otherwise-restrictive map — never a real field-permission key", () => {
    const { result } = renderHook(() => useCanReadField({ resource: "posts" }), {
      wrapper: Providers(access, { user: asUser("restricted") }),
    });
    expect(result.current("_id")).toBe(true);
  });

  it("answers true for every field, including every system field, under a wildcard-true (fully unrestricted) role", () => {
    const { result } = renderHook(() => useCanReadField({ resource: "posts" }), {
      wrapper: Providers(access, { user: asUser("wildcardTrue") }),
    });
    expect(result.current("price")).toBe(true);
    expect(result.current("_creationTime")).toBe(true);
    expect(result.current("updatedAt")).toBe(true);
    expect(result.current("vex_status")).toBe(true);
    expect(result.current("wordCount")).toBe(true);
  });

  it("answers true for everything when access is undefined (RBAC off)", () => {
    const { result } = renderHook(() => useCanReadField({ resource: "posts" }), {
      wrapper: Providers(undefined, { user: null }),
    });
    expect(result.current("price")).toBe(true);
    expect(result.current("_creationTime")).toBe(true);
  });
});
