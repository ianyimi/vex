import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  defineAccess,
  defineCollection,
  isFieldAllowed,
  PERMISSION_SCOPES,
  text,
  type VexAccessConfig,
  type VexApiAuth,
} from "@vexcms/core";
import { useFieldPermissions } from "./useFieldPermissions";
import { usePermission } from "./usePermission";
import { VexAccessProvider } from "../context/VexAccessContext";
import { VexAuthProvider } from "../context/VexAuthContext";

// `useFieldPermissions`'s `resource`/`action` are plain `string` (no
// subject-keyed generic to narrow), so no `as never` is needed on its calls —
// only on the `usePermission` call below, which does carry that generic
// against the unaugmented registry. Same note as `usePermission.test.tsx`.

const posts = defineCollection({
  slug: "posts",
  fields: { title: text(), price: text() },
});

/**
 * One shared config, one role per scenario. `editor` allow-lists `title` and
 * denies `price`; `wildcardTrue` resolves the action to plain `true`, which
 * must beat any per-field map (DD 8); `perDoc` reads `data` so a missing
 * document falls back to `scope`.
 */
const access = defineAccess({
  roles: ["editor", "wildcardTrue", "perDoc"] as const,
  resources: [posts],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    editor: { posts: { update: () => ({ title: true, price: false }) } },
    wildcardTrue: { posts: { update: true } },
    perDoc: {
      posts: {
        read: ({ data }) => {
          // Annotating this parameter would be contravariant-incompatible: the
          // caller supplies `unknown` here (the registry is unaugmented in
          // package tests), so a callback declaring a narrower `data` is
          // unassignable. Narrow inside instead.
          const doc = data as { title?: string } | undefined;
          return { "*": true, price: doc?.title === "Draft" };
        },
      },
    },
  },
});

const asUser = (role: string, _id = "u1"): Record<string, unknown> => ({ _id, roles: role });

/** Wraps a hook render in the real `VexAccessProvider`/`VexAuthProvider` pair. */
function Providers(accessConfig: VexAccessConfig | undefined, auth: VexApiAuth) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <VexAccessProvider access={accessConfig}>
        <VexAuthProvider value={auth}>{children}</VexAuthProvider>
      </VexAccessProvider>
    );
  };
}

describe("useFieldPermissions", () => {
  it("resolves a denied field to false", () => {
    const { result } = renderHook(
      () => useFieldPermissions({ resource: "posts", action: "update", data: {} }),
      { wrapper: Providers(access, { user: asUser("editor") }) },
    );
    expect(isFieldAllowed(result.current, "price")).toBe(false);
  });

  it("resolves an allow-listed field to true", () => {
    const { result } = renderHook(
      () => useFieldPermissions({ resource: "posts", action: "update", data: {} }),
      { wrapper: Providers(access, { user: asUser("editor") }) },
    );
    expect(isFieldAllowed(result.current, "title")).toBe(true);
  });

  it("is unrestricted when RBAC is off", () => {
    const { result } = renderHook(
      () => useFieldPermissions({ resource: "posts", action: "update", data: {} }),
      { wrapper: Providers(undefined, { user: null }) },
    );
    expect(result.current).toEqual({ wildcard: true, fields: {} });
  });

  it("is unrestricted for a role whose action check is a plain true", () => {
    const { result } = renderHook(
      () => useFieldPermissions({ resource: "posts", action: "update", data: {} }),
      { wrapper: Providers(access, { user: asUser("wildcardTrue") }) },
    );
    expect(result.current).toEqual({ wildcard: true, fields: {} });
  });

  it("keeps a per-document field denied when scope defaults to 'all' with no data", () => {
    const { result } = renderHook(
      () => useFieldPermissions({ resource: "posts", action: "read" }),
      { wrapper: Providers(access, { user: asUser("perDoc") }) },
    );
    expect(isFieldAllowed(result.current, "price")).toBe(false);
  });

  it("allows a per-document field with no data when scope is 'any' (list-view gating)", () => {
    const { result } = renderHook(
      () =>
        useFieldPermissions({ resource: "posts", action: "read", scope: PERMISSION_SCOPES.any }),
      { wrapper: Providers(access, { user: asUser("perDoc") }) },
    );
    expect(isFieldAllowed(result.current, "price")).toBe(true);
  });
});

describe("usePermission — with a field map", () => {
  it("still answers true, so Save stays enabled", () => {
    // The edit views' own call shape: no `changes`, so a map PROJECTS rather
    // than denies (DD 3, case 2) and Save stays enabled even though `editor`
    // restricts `price`.
    const { result } = renderHook(
      () => usePermission({ resource: "posts", action: "update", data: {} } as never),
      { wrapper: Providers(access, { user: asUser("editor") }) },
    );
    expect(result.current).toBe(true);
  });
});
