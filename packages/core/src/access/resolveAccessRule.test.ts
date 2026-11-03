import { describe, expect, it } from "vitest";
import { defineCollection, text } from "../index";
import { WILDCARD_KEY } from "./constants";
import { defineAccess } from "./config";
import { resolveQueryConstraint, resolveQueryIndex } from "./resolveAccessRule";
import type { ConvexQueryFilterFn, ConvexQueryIndexRangeFn } from "./convexTypes";
import type { ConstraintResult } from "./queryConstraintTypes";

// Core tests run with an unaugmented GeneratedVexTypes registry, so callback
// `data`/`user` params are the wide pre-generation fallback — the `typeof`/`in`
// guards below are expected and disappear in apps after `vex generate`
// augments the registry (see `hasPermission.test.ts`'s equivalent note).

const pages = defineCollection({
  slug: "pages",
  // Both fields declare real indexes, matching what `vex generate` would emit —
  // config-time index validation (`validateAccessConfig`, run from `defineConfig`)
  // is not exercised here, but the fixture still names a real index so it reads
  // like production config.
  fields: {
    title: text({ required: true }),
    authorId: text({ index: "by_author" }),
    status: text({ index: "by_status" }),
  },
});

const users = defineCollection({
  slug: "users",
  fields: { name: text({ required: true }), roles: text() },
});

const asUser = (roles: string | string[], _id = "u1") => ({ _id, roles });

/**
 * Mirrors the design doc's §9.0 setup, migrated to the `withIndex`/`where` API:
 * `contributor` reads only its own rows via `withIndex: { name: "by_author", range: … }`;
 * `editor` is unrestricted; `reviewer`'s rule is a bare callback and records nothing, so it is
 * unindexable; `auditor` is restrictive AND indexed, but names a DIFFERENT index
 * (`by_status`) — the "two differing indexed roles" case; `anon` resolves through the
 * fallback role and is itself indexed.
 *
 * Each indexed rule keeps its `filter` for now: `hasPermission` does not interpret
 * the constraint form yet (that is Step 10), so dropping `filter` here would silently
 * relax the per-document check these fixtures also stand in for.
 */

const access = defineAccess({
  roles: ["admin", "editor", "contributor", "reviewer", "auditor", "anon", "escalating", "selfDenying"] as const,
  resources: [pages, users],
  anonRole: "anon",
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
  admin: { [WILDCARD_KEY]: true },
  editor: { pages: true },
  contributor: {
    pages: {
      read: {
        withIndex: ({ user }) => ({
          name: "by_author",
          range: (ix) =>
            ix.eq(
              "authorId",
              typeof user === "object" && user !== null && "_id" in user
                ? user._id
                : undefined,
            ),
        }),
        filter: ({ data, user }: { data: unknown; user: unknown }) =>
          typeof data === "object" &&
          data !== null &&
          "authorId" in data &&
          typeof user === "object" &&
          user !== null &&
          "_id" in user
            ? data.authorId === user._id
            : false,
      },
    },
  },
  // A `where` callback that resolves to a flat allow for this caller. It
  // recorded nothing, so there is nothing to narrow BY — and narrowing anyway would
  // hide rows the role permits.
  escalating: {
    pages: {
      read: {
        where: () => true,
      },
    },
  },
  // The mirror case: resolves to a flat deny, so the role contributes nothing and
  // must not block another role's index.
  selfDenying: {
    pages: {
      read: {
        where: () => false,
      },
    },
  },
  reviewer: {
    pages: {
      read: ({ data }: { data: unknown }) =>
        typeof data === "object" && data !== null && "status" in data
          ? data.status === "published"
          : false,
    },
  },
  auditor: {
    pages: {
      read: {
        withIndex: { name: "by_status", range: (ix) => ix.eq("status", "published") },
        filter: ({ data }: { data: unknown }) =>
          typeof data === "object" && data !== null && "status" in data
            ? data.status === "published"
            : false,
      },
    },
  },
  anon: {
    pages: {
      read: {
        withIndex: { name: "by_status", range: (ix) => ix.eq("status", "published") },
        filter: ({ data }: { data: unknown }) =>
          typeof data === "object" && data !== null && "status" in data
            ? data.status === "published"
            : false,
      },
    },
  },
  },
});

/**
 * The same config with the kill switch off. Derived by spread rather than a second
 * `defineAccess` call: the permission matrix has to be written inline to get
 * contextual typing for `q`, and writing it twice invites the two copies to drift.
 */
const disabledAccess = { ...access, enabled: false };

describe("resolveQueryIndex — access absent or disabled", () => {
  it("returns undefined when access is not configured", () => {
    expect(
      resolveQueryIndex({
        access: undefined,
        user: asUser("contributor"),
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });

  it("returns undefined when access.enabled is false", () => {
    expect(
      resolveQueryIndex({
        access: disabledAccess,
        user: asUser("contributor"),
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });
});

describe("resolveQueryIndex — single restrictive role", () => {
  it("resolves the indexed role's withIndex", () => {
    expect(
      resolveQueryIndex({
        access,
        user: asUser("contributor"),
        resource: "pages",
        action: "read",
      }),
    ).toEqual({ name: "by_author", range: expect.any(Function) });
  });

  it("binds range to the caller's user id", () => {
    const resolved = resolveQueryIndex({
      access,
      user: asUser("contributor", "dana"),
      resource: "pages",
      action: "read",
    });
    const calls: unknown[][] = [];
     
    const q: any = { eq: (...args: unknown[]) => (calls.push(args), q) };
    resolved?.range?.(q);
    expect(calls).toEqual([["authorId", "dana"]]);
  });
});

describe("resolveQueryIndex — unrestricted role", () => {
  it("admin's role-level wildcard is unrestricted ⇒ no index", () => {
    expect(
      resolveQueryIndex({
        access,
        user: asUser("admin"),
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });
});

describe("resolveQueryIndex — restrictive + permissive ⇒ no index", () => {
  it("editor's unrestricted grant removes contributor's index", () => {
    expect(
      resolveQueryIndex({
        access,
        user: asUser(["contributor", "editor"]),
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });
});

describe("resolveQueryIndex — two differing restrictive roles ⇒ no index", () => {
  it("an un-indexable callback role forces scanning even alongside an indexed role", () => {
    expect(
      resolveQueryIndex({
        access,
        user: asUser(["contributor", "reviewer"]),
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });

  it("two indexed roles naming different indexes cannot both apply — one range per query", () => {
    expect(
      resolveQueryIndex({
        access,
        user: asUser(["contributor", "auditor"]),
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });
});

describe("resolveQueryIndex — anon via anonRole", () => {
  it("a sessionless caller resolves through access.anonRole", () => {
    expect(
      resolveQueryIndex({
        access,
        user: null,
        resource: "pages",
        action: "read",
      }),
    ).toEqual({ name: "by_status", range: expect.any(Function) });
  });
});

describe("resolveQueryIndex/resolveQueryConstraint — a caller-scoped rule reached with no caller", () => {
  // `contributor`'s rule keys its index to `user._id` (see the fixture above). A
  // config that (mis)assigns `anonRole: "contributor"` reaches that rule for a
  // sessionless caller — exactly the shape `createUserReadSentinel` guards: the
  // rule reads `user`, there is no user, so both resolvers must deny rather than
  // compile `eq("authorId", undefined)`, which Convex reads as "field is absent"
  // and would silently widen the query instead of narrowing it.
  const misconfigured = { ...access, anonRole: "contributor" };

  it("resolveQueryIndex returns undefined instead of an index keyed on undefined", () => {
    expect(
      resolveQueryIndex({
        access: misconfigured,
        user: null,
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });

  it("resolveQueryConstraint returns undefined for the same caller and rule", () => {
    expect(
      resolveQueryConstraint({
        access: misconfigured,
        user: null,
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });
});

describe("resolveQueryIndex — a withIndex callback that short-circuits", () => {
  it("returns undefined when the callback resolves to true — an unrestricted caller must not be narrowed", () => {
    expect(
      resolveQueryIndex({
        access,
        user: asUser("escalating"),
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });

  it("does not let a true-resolving role ride along with an indexed one", () => {
    expect(
      resolveQueryIndex({
        access,
        user: asUser(["contributor", "escalating"]),
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });

  it("skips a false-resolving role entirely, leaving another role's index intact", () => {
    expect(
      resolveQueryIndex({
        access,
        user: asUser(["contributor", "selfDenying"]),
        resource: "pages",
        action: "read",
      }),
    ).toEqual({ name: "by_author", range: expect.any(Function) });
  });

  it("returns undefined when the only role resolves to false — nothing is readable to narrow", () => {
    expect(
      resolveQueryIndex({
        access,
        user: asUser("selfDenying"),
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });
});

describe("resolveQueryConstraint — action-level wildcard", () => {
  const wildcardAccess = defineAccess({
    roles: ["contributor"] as const,
    resources: [pages, users],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      contributor: {
        pages: {
          // A wildcard rule's `where` only gets a `FilterConstraintBuilder`, so `where` is
          // its only form — there is no `withIndex` to reach for.
          "*": { where: ({ q }) => q.eq("status", "published") },
        },
      },
    },
  });

  it("a wildcard constraint narrows an action it covers", () => {
    const filter = resolveQueryConstraint({
      access: wildcardAccess,
      user: asUser("contributor"),
      resource: "pages",
      action: "read",
    });
    expect(filter).toBeTypeOf("function");
  });

  it("contributes no index — a wildcard cannot name one", () => {
    expect(
      resolveQueryIndex({
        access: wildcardAccess,
        user: asUser("contributor"),
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });

  it("an explicit action still beats the wildcard", () => {
    const explicitWins = defineAccess({
      roles: ["contributor"] as const,
      resources: [pages, users],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        contributor: {
          pages: {
            "*": { where: ({ q }) => q.eq("status", "published") },
            read: true,
          },
        },
      },
    });
    // `read: true` is unrestricted, so nothing may narrow it — the wildcard's
    // constraint must not leak into an action that declared itself openly.
    expect(
      resolveQueryConstraint({
        access: explicitWins,
        user: asUser("contributor"),
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });
});

describe("resolveQueryConstraint — a withIndex / where callback that short-circuits to a boolean", () => {
  it("returns undefined for a role whose callback resolves to true — unrestricted, nothing to narrow by", () => {
    expect(
      resolveQueryConstraint({
        access,
        user: asUser("escalating"),
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });

  it("returns undefined for a role whose callback resolves to false — denied, nothing to narrow FOR", () => {
    expect(
      resolveQueryConstraint({
        access,
        user: asUser("selfDenying"),
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });
});

describe("resolveQueryConstraint — index-only, filter-only, and both halves", () => {
  /** Records which `FilterBuilder` methods `resolveQueryConstraint`'s returned
   * thunk invokes, in order — proves exactly which half(s) of a condition compiled,
   * not just that SOME function came back. */
  function recordingQ(): { q: Parameters<ConvexQueryFilterFn>[0]; calls: string[] } {
    const calls: string[] = [];
    const raw: Record<string, (...args: unknown[]) => unknown> = {
      field: (...args: unknown[]) => ({ __field: args[0] as string }),
    };
    for (const op of ["eq", "neq", "gt", "gte", "lt", "lte", "and"] as const) {
      raw[op] = (...args: unknown[]) => {
        calls.push(op);
        return { __expr: op, args };
      };
    }
    return { q: raw as unknown as Parameters<ConvexQueryFilterFn>[0], calls };
  }

  it("compiles ONLY the index half when the condition carries no separate filter (contributor)", () => {
    const filterFn = resolveQueryConstraint({
      access,
      user: asUser("contributor", "dana"),
      resource: "pages",
      action: "read",
    });
    const { q, calls } = recordingQ();
    filterFn?.(q);
    // Single index constraint: `queryConstraintsToConvexFilter` returns it unwrapped, no
    // `and()`, and no filter-tree op ever runs.
    expect(calls).toEqual(["eq"]);
  });

  it("compiles ONLY the filter half when the condition carries no index (wildcard, q.filter only)", () => {
    const filterOnlyAccess = defineAccess({
      roles: ["contributor"] as const,
      resources: [pages, users],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        contributor: {
          pages: {
            "*": { where: ({ q }) => q.eq("status", "published") },
          },
        },
      },
    });
    const filterFn = resolveQueryConstraint({
      access: filterOnlyAccess,
      user: asUser("contributor"),
      resource: "pages",
      action: "read",
    });
    const { q, calls } = recordingQ();
    filterFn?.(q);
    expect(calls).toEqual(["eq"]);
  });

  it("ANDs both halves together when a single condition carries an index AND a filter", () => {
    const bothHalvesAccess = defineAccess({
      roles: ["contributor"] as const,
      resources: [pages, users],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        contributor: {
          pages: {
            read: {
              withIndex: ({ user }) => ({
                name: "by_author",
                range: (ix) =>
                  ix.eq(
                    "authorId",
                    typeof user === "object" && user !== null && "_id" in user
                      ? user._id
                      : undefined,
                  ),
              }),
              where: ({ q }) => q.neq("status", "archived"),
            },
          },
        },
      },
    });
    const filterFn = resolveQueryConstraint({
      access: bothHalvesAccess,
      user: asUser("contributor", "dana"),
      resource: "pages",
      action: "read",
    });
    const { q, calls } = recordingQ();
    filterFn?.(q);
    // Index eq, then filter neq, ANDed into one expression — Convex's own
    // `.withIndex(name, range).filter(expr)` shape, expressed as pure filter ops.
    expect(calls).toEqual(["eq", "neq", "and"]);
  });
});

describe("resolveQueryConstraint — an index with an empty range excludes nothing", () => {
  const orderingOnlyAccess = defineAccess({
    roles: ["contributor"] as const,
    resources: [pages, users],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      contributor: {
        pages: {
          // Calls `withIndex` for ORDERING only — no `eq`/bound ever applied, so the
          // recorded range is empty. Per `AccessIndexSelection`'s own
          // contract this still opts INTO the index (unlike Convex's optional
          // range), but records no constraint: "an index with no constraints is an
          // ordering-only opt-in and excludes nothing" (resolveQueryConstraint.ts).
          read: { withIndex: { name: "by_author", range: (ix) => ix } },
        },
      },
    },
  });

  it("resolveQueryIndex still resolves the index, for ordering, with a no-op range", () => {
    const resolved = resolveQueryIndex({
      access: orderingOnlyAccess,
      user: asUser("contributor"),
      resource: "pages",
      action: "read",
    });
    expect(resolved?.name).toBe("by_author");
    const calls: unknown[][] = [];
    const rangeBuilder = {
      eq: (...args: unknown[]) => (calls.push(args), rangeBuilder),
    } as unknown as Parameters<ConvexQueryIndexRangeFn>[0];
    expect(resolved?.range?.(rangeBuilder)).toBe(rangeBuilder);
    expect(calls).toEqual([]);
  });

  it("resolveQueryConstraint returns undefined — an empty range excludes nothing to check per document", () => {
    expect(
      resolveQueryConstraint({
        access: orderingOnlyAccess,
        user: asUser("contributor"),
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });
});

/**
 * Builds an access config WITHOUT `defineAccess`'s config-time validation.
 *
 * Only for fixtures that deliberately carry a shape `defineAccess` rejects, so a
 * resolve-time safety net can be tested on its own terms.
 *
 * Typed as `defineAccess`'s own parameter so the literal still gets contextual typing
 * for its callbacks — only the runtime validation is bypassed, not the type checking.
 *
 * @param config - The raw config literal.
 * @returns The same object, typed as a validated config.
 */
function buildUnvalidatedAccess(
  config: Parameters<typeof defineAccess>[0],
): ReturnType<typeof defineAccess> {
  return config as ReturnType<typeof defineAccess>;
}

describe("resolveQueryConstraint / resolveQueryIndex — a condition the module cannot read", () => {
  // A `withIndex` / `where` callback may resolve to something other than `true`,
  // `false`, or a value built through the supplied builder — e.g. a stray object
  // smuggled past a cast.
  //
  // `validateAccessConfig` (run from `defineConfig`) now REJECTS this shape at
  // config time, so the fixture is built as a plain object and cast rather than
  // passed through `defineAccess` and `defineConfig`. That is deliberate: the
  // resolve-time safety must hold independently of the config-time gate, because a
  // config can reach the resolver without it (a cast, a future dynamic/DB-backed
  // permission source). Defence in depth — the gate stops authors, this stops
  // everything else.
  const unreadableAccess = buildUnvalidatedAccess({
    roles: ["ghost", "contributor"] as const,
    resources: [pages, users],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      ghost: {
        pages: {
          read: {
            where: (): boolean | ConstraintResult =>
              ({ notARealCondition: true }) as unknown as ConstraintResult,
          },
        },
      },
      contributor: {
        pages: {
          read: {
            withIndex: ({ user }) => ({
              name: "by_author",
              range: (ix) =>
                ix.eq(
                  "authorId",
                  // Cast: the bypass helper's parameter uses `defineAccess`'s DEFAULT
                  // type arguments, so the subject's document type is the wide default
                  // and the value slot narrows to `never`. The fixture only needs the
                  // runtime shape.
                  (typeof user === "object" && user !== null && "_id" in user
                    ? user._id
                    : undefined) as never,
                ),
            }),
          },
        },
      },
    },
  });

  it("resolveQueryIndex returns undefined rather than treating an unreadable condition as unrestricted", () => {
    expect(
      resolveQueryIndex({
        access: unreadableAccess,
        user: asUser("ghost"),
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });

  it("resolveQueryConstraint returns undefined for the same role — no fabricated filter", () => {
    expect(
      resolveQueryConstraint({
        access: unreadableAccess,
        user: asUser("ghost"),
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });

  it("an unreadable role suppresses another role's index, exactly like a genuinely unrestricted one would", () => {
    expect(
      resolveQueryIndex({
        access: unreadableAccess,
        user: asUser(["ghost", "contributor"]),
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });
});

describe("resolveQueryConstraint — indexAlreadyApplied", () => {
  const bothHalvesAccess = defineAccess({
    roles: ["contributor"] as const,
    resources: [pages, users],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      contributor: {
        pages: {
          read: {
            withIndex: ({ user }) => ({
              name: "by_author",
              range: (ix) =>
                ix.eq(
                  "authorId",
                  typeof user === "object" && user !== null && "_id" in user
                    ? user._id
                    : undefined,
                ),
            }),
            where: ({ q }) => q.neq("status", "archived"),
          },
        },
      },
    },
  });

  function recordingQ(): { q: Parameters<ConvexQueryFilterFn>[0]; calls: string[] } {
    const calls: string[] = [];
    const raw: Record<string, (...args: unknown[]) => unknown> = {
      field: (...args: unknown[]) => ({ __field: args[0] as string }),
    };
    for (const op of ["eq", "neq", "gt", "gte", "lt", "lte", "and"] as const) {
      raw[op] = (...args: unknown[]) => {
        calls.push(op);
        return { __expr: op, args };
      };
    }
    return { q: raw as unknown as Parameters<ConvexQueryFilterFn>[0], calls };
  }

  it("false — the index half is DOWNGRADED to a filter and ANDed with the filter half", () => {
    const filterFn = resolveQueryConstraint({
      access: bothHalvesAccess,
      user: asUser("contributor", "dana"),
      resource: "pages",
      action: "read",
      indexAlreadyApplied: false,
    });
    const { q, calls } = recordingQ();
    filterFn?.(q);
    expect(calls).toEqual(["eq", "neq", "and"]);
  });

  it("true — the index half is OMITTED; only the filter half remains", () => {
    const filterFn = resolveQueryConstraint({
      access: bothHalvesAccess,
      user: asUser("contributor", "dana"),
      resource: "pages",
      action: "read",
      indexAlreadyApplied: true,
    });
    const { q, calls } = recordingQ();
    filterFn?.(q);
    // The index eq never runs — the caller's own `.withIndex` already applied it.
    expect(calls).toEqual(["neq"]);
  });

  it("true on an index-ONLY condition (no separate filter) leaves nothing to check", () => {
    // The outer `contributor` fixture's condition carries no `.filter()` half —
    // once its index is marked already-applied, nothing is left to compile.
    expect(
      resolveQueryConstraint({
        access,
        user: asUser("contributor", "dana"),
        resource: "pages",
        action: "read",
        indexAlreadyApplied: true,
      }),
    ).toBeUndefined();
  });
});
