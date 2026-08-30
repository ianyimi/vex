import { describe, expect, it, vi } from "vitest";

import { defineCollection, relationship, text } from "../index";
import { indexedEqCheck, indexedOwnerCheck, ownerPredicateCheck } from "./buildChecks";
import { defineAccess } from "./config";
import { hasPermission } from "./hasPermission";

// `posts` matches the fixture schema's augmented document (see
// `api/test/convex/schema.ts`), so `AccessDocFieldFor<"posts">` resolves to real field
// names. `IndexFieldsBySlug` is deliberately NOT augmented there, so
// `AccessIndexedFieldFor<"posts">` is `never` and the indexed builders' `field`/`value`
// arguments need `as never` in this file. That is a property of core's test registry,
// not of the builders: the type-level guarantees — field must lead an index, value must
// match the field, check is branded to its resource — are proven against a real
// generated registry in `apps/www`. What is under test here is runtime behaviour.
const posts = defineCollection({
  slug: "posts",
  fields: {
    title: text(),
    slug: text({ index: "by_slug" }),
    author: relationship({ collection: { slug: "authors" }, index: "by_author" }),
  },
});

/** Stub `q` whose `withIndex` INVOKES the range, so the recorded call is observable. */
function stubQuery() {
  const eq = vi.fn((field: string, value: unknown) => ({ field, value }));
  const withIndex = vi.fn((name: string, range: (ix: unknown) => unknown) => ({
    name,
    range: range({ eq }),
  }));
  return { eq, q: { withIndex }, withIndex };
}

/** Unwraps the object form of a check, which is all the read builders produce. */
function constraintsOf(check: unknown) {
  if (typeof check !== "object" || check === null || !("constraints" in check)) {
    throw new Error("expected the constraints object form");
  }
  return (check as { constraints: (p: Record<string, unknown>) => unknown }).constraints;
}

/** Unwraps the callback form, which is all the mutation builder produces. */
function predicateOf(check: unknown) {
  if (typeof check !== "function") throw new Error("expected the callback form");
  return check as (p: { data?: Record<string, unknown>; user: { _id: string } }) => boolean;
}

describe("indexedEqCheck", () => {
  it("pushes the comparison into the field's declared index", () => {
    const check = indexedEqCheck({ field: "slug" as never, resource: posts, value: "keep" as never });
    const { eq, q, withIndex } = stubQuery();
    constraintsOf(check)({ q, user: { _id: "u1" } });

    // The index NAME is recovered from the field's config, not passed by the caller.
    expect(withIndex.mock.calls[0]?.[0]).toBe("by_slug");
    expect(eq).toHaveBeenCalledWith("slug", "keep");
  });

  it("throws for a field that leads no index", () => {
    // Unreachable through the typed surface; loud because the alternative is a silent
    // full scan with the caller believing their check was pushed down.
    expect(() =>
      indexedEqCheck({ field: "title" as never, resource: posts, value: "x" as never }),
    ).toThrow(/leads no declared index/);
  });
});

describe("indexedOwnerCheck", () => {
  it("wraps the id in an array for a relationship field", () => {
    // Relationship fields generate `Id<slug>[]` regardless of `hasMany`, so an equality
    // range has to compare the array, not the bare id.
    const check = indexedOwnerCheck({ field: "author" as never, resource: posts });
    const { eq, q, withIndex } = stubQuery();
    constraintsOf(check)({ q, user: { _id: "u1" } });

    expect(withIndex.mock.calls[0]?.[0]).toBe("by_author");
    expect(eq).toHaveBeenCalledWith("author", ["u1"]);
  });

  it("compares the id directly for a non-relationship field", () => {
    const check = indexedOwnerCheck({ field: "slug" as never, resource: posts });
    const { eq, q } = stubQuery();
    constraintsOf(check)({ q, user: { _id: "u1" } });

    expect(eq).toHaveBeenCalledWith("slug", "u1");
  });

  it("reads the user per request rather than at build time", () => {
    // The value cannot be precomputed: two callers with different users must produce
    // different ranges from the same check value.
    const check = indexedOwnerCheck({ field: "slug" as never, resource: posts });
    const first = stubQuery();
    const second = stubQuery();
    constraintsOf(check)({ q: first.q, user: { _id: "u1" } });
    constraintsOf(check)({ q: second.q, user: { _id: "u2" } });

    expect(first.eq).toHaveBeenCalledWith("slug", "u1");
    expect(second.eq).toHaveBeenCalledWith("slug", "u2");
  });
});

describe("ownerPredicateCheck", () => {
  it("matches an array-valued owner field", () => {
    const check = predicateOf(ownerPredicateCheck({ field: "author", resource: posts }));
    expect(check({ data: { author: ["u1"] }, user: { _id: "u1" } })).toBe(true);
    expect(check({ data: { author: ["u2"] }, user: { _id: "u1" } })).toBe(false);
  });

  it("matches a scalar owner field", () => {
    const check = predicateOf(ownerPredicateCheck({ field: "slug", resource: posts }));
    expect(check({ data: { slug: "u1" }, user: { _id: "u1" } })).toBe(true);
    expect(check({ data: { slug: "u2" }, user: { _id: "u1" } })).toBe(false);
  });

  it("denies when the document is absent", () => {
    // A capability probe passes no document; a per-document rule cannot hold for all.
    const check = predicateOf(ownerPredicateCheck({ field: "author", resource: posts }));
    expect(check({ user: { _id: "u1" } })).toBe(false);
  });
});

/**
 * Pins the bidirectionality invariant these builders exist for: the SAME
 * declaration proven above to narrow a server query must also resolve
 * correctly when interpreted client-side against a fetched document, with
 * no round trip — `hasPermission` is that interpreter (see `resolveConstrainedCheck`
 * in `hasPermission.ts`, which is what `usePermission` calls in the React runtime).
 */
describe("builder output resolved by hasPermission against a document", () => {
  const access = defineAccess({
    roles: ["eq", "ownerRelationship", "ownerScalar", "predicate"] as const,
    resources: [posts],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      eq: {
        posts: { read: indexedEqCheck({ field: "slug" as never, resource: posts, value: "keep" as never }) },
      },
      ownerRelationship: {
        posts: { read: indexedOwnerCheck({ field: "author" as never, resource: posts }) },
      },
      ownerScalar: {
        posts: { read: indexedOwnerCheck({ field: "slug" as never, resource: posts }) },
      },
      predicate: {
        posts: { delete: ownerPredicateCheck({ field: "author", resource: posts }) },
      },
    },
  });
  const asUser = (role: string, _id = "u1") => ({ _id, roles: role });

  describe("indexedEqCheck", () => {
    it("allows a document whose field matches the declared value", () => {
      expect(
        hasPermission({
          access,
          user: asUser("eq"),
          resource: "posts",
          action: "read",
          data: { slug: "keep" } as never,
        }),
      ).toBe(true);
    });

    it("denies a document whose field does not match", () => {
      expect(
        hasPermission({
          access,
          user: asUser("eq"),
          resource: "posts",
          action: "read",
          data: { slug: "drop" } as never,
        }),
      ).toBe(false);
    });
  });

  describe("indexedOwnerCheck — scalar field (control case)", () => {
    it("allows a document the user owns", () => {
      expect(
        hasPermission({
          access,
          user: asUser("ownerScalar"),
          resource: "posts",
          action: "read",
          data: { slug: "u1" } as never,
        }),
      ).toBe(true);
    });

    it("denies a document owned by someone else", () => {
      expect(
        hasPermission({
          access,
          user: asUser("ownerScalar"),
          resource: "posts",
          action: "read",
          data: { slug: "u2" } as never,
        }),
      ).toBe(false);
    });
  });

  describe("indexedOwnerCheck — relationship field (array-valued)", () => {
    // Regression pin (DD 43): `indexedOwnerCheck` builds its equality
    // value as a freshly allocated `[user._id]` array (buildChecks.ts) for a
    // relationship field. The client-side interpreter compares recorded
    // constraints with `===` (`CONSTRAINT_COMPARATORS.eq` in
    // compileConstraints.ts), which is never `true` for two distinct array
    // instances even when their contents match. This assertion is the CORRECT
    // expected behaviour — it mirrors `ownerPredicateCheck`'s `.includes`
    // semantics for the identical field two tests below — and is left failing
    // on purpose rather than weakened.
    it("allows a document the user owns", () => {
      expect(
        hasPermission({
          access,
          user: asUser("ownerRelationship"),
          resource: "posts",
          action: "read",
          data: { author: ["u1"] } as never,
        }),
      ).toBe(true);
    });

    it("denies a document owned by someone else", () => {
      // This direction passes today, but only because two DIFFERENT array
      // contents are also unequal by reference — it does not exercise the
      // broken (matching) case above.
      expect(
        hasPermission({
          access,
          user: asUser("ownerRelationship"),
          resource: "posts",
          action: "read",
          data: { author: ["someone-else"] } as never,
        }),
      ).toBe(false);
    });
  });

  describe("ownerPredicateCheck", () => {
    it("allows deleting a document the user owns (array-valued field)", () => {
      expect(
        hasPermission({
          access,
          user: asUser("predicate"),
          resource: "posts",
          action: "delete",
          data: { author: ["u1"] } as never,
        }),
      ).toBe(true);
    });

    it("denies deleting a document owned by someone else", () => {
      expect(
        hasPermission({
          access,
          user: asUser("predicate"),
          resource: "posts",
          action: "delete",
          data: { author: ["someone-else"] } as never,
        }),
      ).toBe(false);
    });
  });
});
