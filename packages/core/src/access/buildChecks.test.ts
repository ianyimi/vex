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
// generated registry in `apps/test`. What is under test here is runtime behaviour.
const posts = defineCollection({
  slug: "posts",
  fields: {
    title: text(),
    slug: text({ index: "by_slug" }),
    author: relationship({ collection: { slug: "authors" }, index: "by_author" }),
  },
});

/** Stub index builder whose `eq` is observable. */
function stubQuery() {
  const eq = vi.fn((field: string, value: unknown) => ({ field, value }));
  return { eq, ix: { eq } };
}

/**
 * Resolves a check's `withIndex` half to its `{ name, range }` descriptor,
 * invoking the callback form with `props` when present.
 */
function withIndexOf(check: unknown, props: { user: { _id: string } }) {
  if (typeof check !== "object" || check === null || !("withIndex" in check)) {
    throw new Error("expected a withIndex property");
  }
  const { withIndex } = check;
  if (typeof withIndex === "function") {
    return withIndex(props) as { name: string; range: (ix: { eq: unknown }) => unknown };
  }
  return withIndex as { name: string; range: (ix: { eq: unknown }) => unknown };
}

/** Unwraps the callback form, which is all the mutation builder produces. */
function predicateOf(check: unknown) {
  if (typeof check !== "function") throw new Error("expected the callback form");
  return check as (p: { data?: Record<string, unknown>; user: { _id: string } }) => boolean;
}

describe("indexedEqCheck", () => {
  it("pushes the comparison into the field's declared index", () => {
    const check = indexedEqCheck({ field: "slug" as never, resource: posts, value: "keep" as never });
    const { eq, ix } = stubQuery();
    const { name, range } = withIndexOf(check, { user: { _id: "u1" } });
    range(ix);

    // The index NAME is recovered from the field's config, not passed by the caller.
    expect(name).toBe("by_slug");
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
    const { eq, ix } = stubQuery();
    const { name, range } = withIndexOf(check, { user: { _id: "u1" } });
    range(ix);

    expect(name).toBe("by_author");
    expect(eq).toHaveBeenCalledWith("author", ["u1"]);
  });

  it("compares the id directly for a non-relationship field", () => {
    const check = indexedOwnerCheck({ field: "slug" as never, resource: posts });
    const { eq, ix } = stubQuery();
    const { range } = withIndexOf(check, { user: { _id: "u1" } });
    range(ix);

    expect(eq).toHaveBeenCalledWith("slug", "u1");
  });

  it("reads the user per request rather than at build time", () => {
    // The value cannot be precomputed: two callers with different users must produce
    // different ranges from the same check value.
    const check = indexedOwnerCheck({ field: "slug" as never, resource: posts });
    const first = stubQuery();
    const second = stubQuery();
    withIndexOf(check, { user: { _id: "u1" } }).range(first.ix);
    withIndexOf(check, { user: { _id: "u2" } }).range(second.ix);

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
    // constraints with `valuesEqual` (`QUERY_INDEX_CONSTRAINT_COMPARATORS.eq` in
    // compileQueryConstraints.ts), which is content equality, not `===` — so this
    // passes despite the two array instances being distinct objects. It mirrors
    // `ownerPredicateCheck`'s `.includes` semantics for the identical field two
    // tests below.
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
