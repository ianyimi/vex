import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  defineAccess,
  defineCollection,
  indexedEqCheck,
  indexedOwnerCheck,
  ownerPredicateCheck,
  PERMISSION_SCOPES,
  relationship,
  text,
  VexAccessError,
  type VexAccessConfig,
  type VexApiAuth,
} from "@vexcms/core";
import { usePermission } from "./usePermission";
import { VexAccessProvider } from "../context/VexAccessContext";
import { VexAuthProvider } from "../context/VexAuthContext";

// React tests run with an unaugmented GeneratedVexTypes registry, same as core's
// own access tests (see `buildChecks.test.ts`) — `as never` on the indexed
// builders' `field`/`value` args, and `as never` on `usePermission` props whose
// literal `resource`/`action` can't narrow against the wide default `TSubjects`,
// are expected here and disappear in an app after `vex generate`.

const posts = defineCollection({
  slug: "posts",
  fields: {
    title: text(),
    status: text({ index: "by_status" }),
    author: relationship({ collection: { slug: "authors" }, index: "by_author" }),
  },
});

/**
 * One shared config, one role per scenario — mirrors core's own
 * `hasPermission.test.ts` fixture style. Every role governs `posts` only.
 */
const access = defineAccess({
  roles: [
    "literalAllow",
    "literalDeny",
    "probeIgnoreAllow",
    "probeIgnoreDeny",
    "probeReads",
    "constraintIndexOnly",
    "constraintFilterOnly",
    "constraintBoth",
    "constraintBoolTrue",
    "constraintBoolFalse",
    "eqBuilder",
    "ownerBuilder",
    "predicateBuilder",
  ] as const,
  resources: [posts],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    literalAllow: { posts: { read: true } },
    literalDeny: { posts: { read: false } },
    // Ignores `data` entirely — the capability probe must invoke it and use
    // its own return value, independent of the default `scope`.
    probeIgnoreAllow: { posts: { read: () => true } },
    probeIgnoreDeny: { posts: { read: () => false } },
    // Reads `data` — with no document, this is the quantified path `scope` governs.
    probeReads: {
      posts: {
        update: ({ data }) => (data as { status?: string } | undefined)?.status === "published",
      },
    },
    constraintIndexOnly: {
      posts: {
        read: {
          constraints: ({ q }) => q.withIndex("by_status", (ix) => ix.eq("status", "published")),
        },
      },
    },
    constraintFilterOnly: {
      posts: {
        read: { constraints: ({ q }) => q.filter((f) => f.neq("status", "draft")) },
      },
    },
    constraintBoth: {
      posts: {
        read: {
          constraints: ({ q }) =>
            q
              .withIndex("by_status", (ix) => ix.eq("status", "published"))
              .filter((f) => f.neq("title", "Hidden")),
        },
      },
    },
    // Short-circuits to a flat boolean — the constraint chain is never built,
    // so this must be immune to both `data` and `scope`.
    constraintBoolTrue: { posts: { read: { constraints: () => true } } },
    constraintBoolFalse: { posts: { read: { constraints: () => false } } },
    eqBuilder: {
      posts: {
        read: indexedEqCheck({
          field: "status" as never,
          resource: posts,
          value: "published" as never,
        }) as never,
      },
    },
    ownerBuilder: {
      posts: { read: indexedOwnerCheck({ field: "author" as never, resource: posts }) as never },
    },
    predicateBuilder: {
      posts: {
        delete: ownerPredicateCheck({ field: "author" as never, resource: posts }) as never,
      },
    },
  },
});

const asUser = (role: string, _id = "u1"): Record<string, unknown> => ({ _id, roles: role });

/** Wraps a hook render in the real `VexAccessProvider`/`VexAuthProvider` pair. */
function Providers(access: VexAccessConfig | undefined, auth: VexApiAuth) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <VexAccessProvider access={access}>
        <VexAuthProvider value={auth}>{children}</VexAuthProvider>
      </VexAccessProvider>
    );
  };
}

describe("usePermission — no access config", () => {
  it("resolves true for a literal check (escape hatch, not fail-closed)", () => {
    const { result } = renderHook(() => usePermission({ resource: "posts", action: "read" } as never), {
      wrapper: Providers(undefined, { user: null }),
    });
    expect(result.current).toBe(true);
  });

  it("resolves true for a callback check that reads data, even with data omitted", () => {
    const { result } = renderHook(() => usePermission({ resource: "posts", action: "update" } as never), {
      wrapper: Providers(undefined, { user: null }),
    });
    expect(result.current).toBe(true);
  });

  it("never throws, even with throwOnDenied and scope: doc", () => {
    expect(() =>
      renderHook(
        () =>
          usePermission({
            resource: "posts",
            action: "update",
            throwOnDenied: true,
            scope: PERMISSION_SCOPES.doc,
          } as never),
        { wrapper: Providers(undefined, { user: null }) },
      ),
    ).not.toThrow();
  });
});

describe("usePermission — no user", () => {
  it("fails closed when access is configured but there is no user (no anonRole)", () => {
    const { result } = renderHook(() => usePermission({ resource: "posts", action: "read" } as never), {
      wrapper: Providers(access, { user: null }),
    });
    expect(result.current).toBe(false);
  });

  it("fails closed regardless of which action is checked", () => {
    const { result } = renderHook(() => usePermission({ resource: "posts", action: "delete" } as never), {
      wrapper: Providers(access, { user: null }),
    });
    expect(result.current).toBe(false);
  });
});

describe("usePermission — literal boolean checks", () => {
  it("resolves a literal true directly", () => {
    const { result } = renderHook(() => usePermission({ resource: "posts", action: "read" } as never), {
      wrapper: Providers(access, { user: asUser("literalAllow") }),
    });
    expect(result.current).toBe(true);
  });

  it("resolves a literal false directly", () => {
    const { result } = renderHook(() => usePermission({ resource: "posts", action: "read" } as never), {
      wrapper: Providers(access, { user: asUser("literalDeny") }),
    });
    expect(result.current).toBe(false);
  });
});

describe("usePermission — callback that ignores data", () => {
  it("invokes the callback via the capability probe and uses its result (allow)", () => {
    const { result } = renderHook(() => usePermission({ resource: "posts", action: "read" } as never), {
      wrapper: Providers(access, { user: asUser("probeIgnoreAllow") }),
    });
    expect(result.current).toBe(true);
  });

  it("invokes the callback via the capability probe and uses its result (deny)", () => {
    // Contrasts with `probeReads` below: a callback that never touches `data`
    // is NOT subject to the default-scope "false" fallback — its own return
    // value decides, even with no document.
    const { result } = renderHook(() => usePermission({ resource: "posts", action: "read" } as never), {
      wrapper: Providers(access, { user: asUser("probeIgnoreDeny") }),
    });
    expect(result.current).toBe(false);
  });
});

describe("usePermission — callback that reads data", () => {
  it("resolves to false under the default scope when data is omitted (not a throw)", () => {
    expect(() =>
      renderHook(() => usePermission({ resource: "posts", action: "update" } as never), {
        wrapper: Providers(access, { user: asUser("probeReads") }),
      }),
    ).not.toThrow();

    const { result } = renderHook(() => usePermission({ resource: "posts", action: "update" } as never), {
      wrapper: Providers(access, { user: asUser("probeReads") }),
    });
    expect(result.current).toBe(false);
  });

  it("resolves the real per-document answer once data is supplied (allow)", () => {
    const { result } = renderHook(
      () => usePermission({ resource: "posts", action: "update", data: { status: "published" } } as never),
      { wrapper: Providers(access, { user: asUser("probeReads") }) },
    );
    expect(result.current).toBe(true);
  });

  it("resolves the real per-document answer once data is supplied (deny)", () => {
    const { result } = renderHook(
      () => usePermission({ resource: "posts", action: "update", data: { status: "draft" } } as never),
      { wrapper: Providers(access, { user: asUser("probeReads") }) },
    );
    expect(result.current).toBe(false);
  });
});

describe("usePermission — scope overrides the default for a data-reading check", () => {
  it('scope "any" resolves to true without data', () => {
    const { result } = renderHook(
      () => usePermission({ resource: "posts", action: "update", scope: PERMISSION_SCOPES.any } as never),
      { wrapper: Providers(access, { user: asUser("probeReads") }) },
    );
    expect(result.current).toBe(true);
  });

  it('scope "all" resolves to false without data (same as the default, made explicit)', () => {
    const { result } = renderHook(
      () => usePermission({ resource: "posts", action: "update", scope: PERMISSION_SCOPES.all } as never),
      { wrapper: Providers(access, { user: asUser("probeReads") }) },
    );
    expect(result.current).toBe(false);
  });

  it('scope "doc" throws VexAccessError when data is omitted', () => {
    expect(() =>
      renderHook(
        () => usePermission({ resource: "posts", action: "update", scope: PERMISSION_SCOPES.doc } as never),
        { wrapper: Providers(access, { user: asUser("probeReads") }) },
      ),
    ).toThrow(VexAccessError);
  });

  it("an explicit data object wins regardless of scope", () => {
    for (const scope of ["doc", "any", "all"] as const) {
      const { result } = renderHook(
        () =>
          usePermission({
            resource: "posts",
            action: "update",
            data: { status: "draft" },
            scope,
          } as never),
        { wrapper: Providers(access, { user: asUser("probeReads") }) },
      );
      expect(result.current).toBe(false);
    }
  });
});

describe("usePermission — constraint-object checks", () => {
  describe("index-only condition", () => {
    it("resolves to false when data is omitted (quantified, default scope)", () => {
      const { result } = renderHook(() => usePermission({ resource: "posts", action: "read" } as never), {
        wrapper: Providers(access, { user: asUser("constraintIndexOnly") }),
      });
      expect(result.current).toBe(false);
    });

    it("allows a document that satisfies the indexed condition", () => {
      const { result } = renderHook(
        () => usePermission({ resource: "posts", action: "read", data: { status: "published" } } as never),
        { wrapper: Providers(access, { user: asUser("constraintIndexOnly") }) },
      );
      expect(result.current).toBe(true);
    });

    it("denies a document that does not satisfy the indexed condition", () => {
      const { result } = renderHook(
        () => usePermission({ resource: "posts", action: "read", data: { status: "draft" } } as never),
        { wrapper: Providers(access, { user: asUser("constraintIndexOnly") }) },
      );
      expect(result.current).toBe(false);
    });
  });

  describe("filter-only condition (no withIndex)", () => {
    it("allows a document the filter admits", () => {
      const { result } = renderHook(
        () => usePermission({ resource: "posts", action: "read", data: { status: "published" } } as never),
        { wrapper: Providers(access, { user: asUser("constraintFilterOnly") }) },
      );
      expect(result.current).toBe(true);
    });

    it("denies a document the filter rejects", () => {
      const { result } = renderHook(
        () => usePermission({ resource: "posts", action: "read", data: { status: "draft" } } as never),
        { wrapper: Providers(access, { user: asUser("constraintFilterOnly") }) },
      );
      expect(result.current).toBe(false);
    });
  });

  describe("index + filter together (both halves must hold)", () => {
    it("allows a document satisfying both halves", () => {
      const { result } = renderHook(
        () =>
          usePermission({
            resource: "posts",
            action: "read",
            data: { status: "published", title: "Ok" },
          } as never),
        { wrapper: Providers(access, { user: asUser("constraintBoth") }) },
      );
      expect(result.current).toBe(true);
    });

    it("denies when the index half holds but the filter half rejects", () => {
      const { result } = renderHook(
        () =>
          usePermission({
            resource: "posts",
            action: "read",
            data: { status: "published", title: "Hidden" },
          } as never),
        { wrapper: Providers(access, { user: asUser("constraintBoth") }) },
      );
      expect(result.current).toBe(false);
    });

    it("denies when the index half itself fails, regardless of the filter half", () => {
      const { result } = renderHook(
        () =>
          usePermission({
            resource: "posts",
            action: "read",
            data: { status: "draft", title: "Ok" },
          } as never),
        { wrapper: Providers(access, { user: asUser("constraintBoth") }) },
      );
      expect(result.current).toBe(false);
    });
  });

  describe("a constraints callback that short-circuits to a boolean", () => {
    it("resolves true with no data (the boolean returns before data is ever inspected)", () => {
      const { result } = renderHook(() => usePermission({ resource: "posts", action: "read" } as never), {
        wrapper: Providers(access, { user: asUser("constraintBoolTrue") }),
      });
      expect(result.current).toBe(true);
    });

    it("stays true even when data is supplied", () => {
      const { result } = renderHook(
        () => usePermission({ resource: "posts", action: "read", data: { status: "draft" } } as never),
        { wrapper: Providers(access, { user: asUser("constraintBoolTrue") }) },
      );
      expect(result.current).toBe(true);
    });

    it("resolves false with no data", () => {
      const { result } = renderHook(() => usePermission({ resource: "posts", action: "read" } as never), {
        wrapper: Providers(access, { user: asUser("constraintBoolFalse") }),
      });
      expect(result.current).toBe(false);
    });

    it("stays false even when data is supplied", () => {
      const { result } = renderHook(
        () => usePermission({ resource: "posts", action: "read", data: { status: "published" } } as never),
        { wrapper: Providers(access, { user: asUser("constraintBoolFalse") }) },
      );
      expect(result.current).toBe(false);
    });
  });
});

describe("usePermission — builder-produced checks resolve client-side (bidirectionality)", () => {
  // This is the guarantee the whole design rests on: the SAME `constraints`
  // declaration that narrows a server-side Convex query must also interpret
  // correctly in the browser, through this hook, with no server round trip.
  // This is the single most valuable cluster of tests in this file.

  it("indexedEqCheck allows/denies a document with no server round trip", () => {
    const allow = renderHook(
      () => usePermission({ resource: "posts", action: "read", data: { status: "published" } } as never),
      { wrapper: Providers(access, { user: asUser("eqBuilder") }) },
    );
    expect(allow.result.current).toBe(true);

    const deny = renderHook(
      () => usePermission({ resource: "posts", action: "read", data: { status: "draft" } } as never),
      { wrapper: Providers(access, { user: asUser("eqBuilder") }) },
    );
    expect(deny.result.current).toBe(false);
  });

  it("ownerPredicateCheck allows/denies against the owning user, client-side", () => {
    const owner = renderHook(
      () => usePermission({ resource: "posts", action: "delete", data: { author: ["u1"] } } as never),
      { wrapper: Providers(access, { user: asUser("predicateBuilder", "u1") }) },
    );
    expect(owner.result.current).toBe(true);

    const notOwner = renderHook(
      () =>
        usePermission({ resource: "posts", action: "delete", data: { author: ["someone-else"] } } as never),
      { wrapper: Providers(access, { user: asUser("predicateBuilder", "u1") }) },
    );
    expect(notOwner.result.current).toBe(false);
  });

  // Regression pin (DD 43; see also `buildChecks.test.ts`): `indexedOwnerCheck`
  // on a relationship field never resolves `true` client-side, because its
  // recorded `eq` value is a freshly allocated `[user._id]` array compared with
  // `===`. Left asserting the CORRECT (allow) answer on purpose.
  it("indexedOwnerCheck allows a document the user owns, client-side", () => {
    const { result } = renderHook(
      () => usePermission({ resource: "posts", action: "read", data: { author: ["u1"] } } as never),
      { wrapper: Providers(access, { user: asUser("ownerBuilder", "u1") }) },
    );
    expect(result.current).toBe(true);
  });
});

describe("usePermission — re-render stability", () => {
  it("flips its result when the user in context changes, with no stale memoisation", () => {
    // `Wrapper` reads `authBox.current` at RENDER time rather than from props —
    // `renderHook`'s `wrapper` option is never handed `rerender()`'s arguments
    // (only the hook callback is), so this is how a single mounted instance is
    // driven through two different auth values without remounting.
    const authBox: { current: VexApiAuth } = { current: { user: asUser("predicateBuilder", "u1") } };
    const Wrapper = ({ children }: { children: ReactNode }) => (
      <VexAccessProvider access={access}>
        <VexAuthProvider value={authBox.current}>{children}</VexAuthProvider>
      </VexAccessProvider>
    );

    const { result, rerender } = renderHook(
      () => usePermission({ resource: "posts", action: "delete", data: { author: ["u1"] } } as never),
      { wrapper: Wrapper },
    );
    expect(result.current).toBe(true);

    authBox.current = { user: asUser("predicateBuilder", "u2") };
    rerender();
    expect(result.current).toBe(false);
  });
});
