import { describe, expect, it } from "vitest";
import { defineCollection, text } from "../index";
import { WILDCARD_KEY } from "./constants";
import { defineAccess } from "./config";
import { resolveAccessConstraint, resolveAccessIndex } from "./resolveAccessRule";
import type { AccessConditionResult } from "./constraintTypes";
import type { AccessFilterFn, IndexRangeFn } from "./types";

// Core tests run with an unaugmented GeneratedVexTypes registry, so callback
// `data`/`user` params are the wide pre-generation fallback — the `typeof`/`in`
// guards below are expected and disappear in apps after `vex generate`
// augments the registry (see `hasPermission.test.ts`'s equivalent note).

const pages = defineCollection({
  slug: "pages",
  // Both fields declare real indexes: `defineAccess` validates every recorded
  // constraint set against the resource's DECLARED indexes, so a fixture naming an
  // index that does not exist would fail at config time for the wrong reason.
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
 * Mirrors the design doc's §9.0 setup, migrated to the chained API: `contributor`
 * reads only its own rows by calling `q.withIndex("by_author")`; `editor` is
 * unrestricted; `reviewer`'s rule is a bare callback and records nothing, so it is
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
        constraints: ({ user, q }) =>
          q.withIndex("by_author", (ix) =>
            ix.eq(
              "authorId",
              typeof user === "object" && user !== null && "_id" in user
                ? user._id
                : undefined,
            ),
          ),
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
  // A constraints callback that resolves to a flat allow for this caller. It
  // recorded nothing, so there is nothing to narrow BY — and narrowing anyway would
  // hide rows the role permits.
  escalating: {
    pages: {
      read: {
        constraints: () => true,
      },
    },
  },
  // The mirror case: resolves to a flat deny, so the role contributes nothing and
  // must not block another role's index.
  selfDenying: {
    pages: {
      read: {
        constraints: () => false,
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
        constraints: ({ q }) => q.withIndex("by_status", (ix) => ix.eq("status", "published")),
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
        constraints: ({ q }) => q.withIndex("by_status", (ix) => ix.eq("status", "published")),
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

describe("resolveAccessIndex — access absent or disabled", () => {
  it("returns undefined when access is not configured", () => {
    expect(
      resolveAccessIndex({
        access: undefined,
        user: asUser("contributor"),
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });

  it("returns undefined when access.enabled is false", () => {
    expect(
      resolveAccessIndex({
        access: disabledAccess,
        user: asUser("contributor"),
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });
});

describe("resolveAccessIndex — single restrictive role", () => {
  it("resolves the indexed role's withIndex", () => {
    expect(
      resolveAccessIndex({
        access,
        user: asUser("contributor"),
        resource: "pages",
        action: "read",
      }),
    ).toEqual({ name: "by_author", range: expect.any(Function) });
  });

  it("binds range to the caller's user id", () => {
    const resolved = resolveAccessIndex({
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

describe("resolveAccessIndex — unrestricted role", () => {
  it("admin's role-level wildcard is unrestricted ⇒ no index", () => {
    expect(
      resolveAccessIndex({
        access,
        user: asUser("admin"),
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });
});

describe("resolveAccessIndex — restrictive + permissive ⇒ no index", () => {
  it("editor's unrestricted grant removes contributor's index", () => {
    expect(
      resolveAccessIndex({
        access,
        user: asUser(["contributor", "editor"]),
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });
});

describe("resolveAccessIndex — two differing restrictive roles ⇒ no index", () => {
  it("an un-indexable callback role forces scanning even alongside an indexed role", () => {
    expect(
      resolveAccessIndex({
        access,
        user: asUser(["contributor", "reviewer"]),
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });

  it("two indexed roles naming different indexes cannot both apply — one range per query", () => {
    expect(
      resolveAccessIndex({
        access,
        user: asUser(["contributor", "auditor"]),
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });
});

describe("resolveAccessIndex — anon via anonRole", () => {
  it("a sessionless caller resolves through access.anonRole", () => {
    expect(
      resolveAccessIndex({
        access,
        user: null,
        resource: "pages",
        action: "read",
      }),
    ).toEqual({ name: "by_status", range: expect.any(Function) });
  });
});

describe("resolveAccessIndex — a constraints callback that short-circuits", () => {
  it("returns undefined when the callback resolves to true — an unrestricted caller must not be narrowed", () => {
    expect(
      resolveAccessIndex({
        access,
        user: asUser("escalating"),
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });

  it("does not let a true-resolving role ride along with an indexed one", () => {
    expect(
      resolveAccessIndex({
        access,
        user: asUser(["contributor", "escalating"]),
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });

  it("skips a false-resolving role entirely, leaving another role's index intact", () => {
    expect(
      resolveAccessIndex({
        access,
        user: asUser(["contributor", "selfDenying"]),
        resource: "pages",
        action: "read",
      }),
    ).toEqual({ name: "by_author", range: expect.any(Function) });
  });

  it("returns undefined when the only role resolves to false — nothing is readable to narrow", () => {
    expect(
      resolveAccessIndex({
        access,
        user: asUser("selfDenying"),
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });
});

describe("resolveAccessConstraint — action-level wildcard", () => {
  const wildcardAccess = defineAccess({
    roles: ["contributor"] as const,
    resources: [pages, users],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      contributor: {
        pages: {
          // A wildcard's `q` is an AccessPredicateBuilder, so `filter` is its only
          // form — there is no `withIndex` to reach for.
          "*": { constraints: ({ q }) => q.filter((f) => f.eq("status", "published")) },
        },
      },
    },
  });

  it("a wildcard constraint narrows an action it covers", () => {
    const filter = resolveAccessConstraint({
      access: wildcardAccess,
      user: asUser("contributor"),
      resource: "pages",
      action: "read",
    });
    expect(filter).toBeTypeOf("function");
  });

  it("contributes no index — a wildcard cannot name one", () => {
    expect(
      resolveAccessIndex({
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
            "*": { constraints: ({ q }) => q.filter((f) => f.eq("status", "published")) },
            read: true,
          },
        },
      },
    });
    // `read: true` is unrestricted, so nothing may narrow it — the wildcard's
    // constraint must not leak into an action that declared itself openly.
    expect(
      resolveAccessConstraint({
        access: explicitWins,
        user: asUser("contributor"),
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });
});

describe("resolveAccessConstraint — a constraints callback that short-circuits to a boolean", () => {
  it("returns undefined for a role whose callback resolves to true — unrestricted, nothing to narrow by", () => {
    expect(
      resolveAccessConstraint({
        access,
        user: asUser("escalating"),
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });

  it("returns undefined for a role whose callback resolves to false — denied, nothing to narrow FOR", () => {
    expect(
      resolveAccessConstraint({
        access,
        user: asUser("selfDenying"),
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });
});

describe("resolveAccessConstraint — index-only, filter-only, and both halves", () => {
  /** Records which `FilterBuilder` methods `resolveAccessConstraint`'s returned
   * thunk invokes, in order — proves exactly which half(s) of a condition compiled,
   * not just that SOME function came back. */
  function recordingQ(): { q: Parameters<AccessFilterFn>[0]; calls: string[] } {
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
    return { q: raw as unknown as Parameters<AccessFilterFn>[0], calls };
  }

  it("compiles ONLY the index half when the condition carries no separate filter (contributor)", () => {
    const filterFn = resolveAccessConstraint({
      access,
      user: asUser("contributor", "dana"),
      resource: "pages",
      action: "read",
    });
    const { q, calls } = recordingQ();
    filterFn?.(q);
    // Single index constraint: `accessConstraintsToFilter` returns it unwrapped, no
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
            "*": { constraints: ({ q }) => q.filter((f) => f.eq("status", "published")) },
          },
        },
      },
    });
    const filterFn = resolveAccessConstraint({
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
              constraints: ({ user, q }) =>
                q
                  .withIndex("by_author", (ix) =>
                    ix.eq(
                      "authorId",
                      typeof user === "object" && user !== null && "_id" in user
                        ? user._id
                        : undefined,
                    ),
                  )
                  .filter((f) => f.neq("status", "archived")),
            },
          },
        },
      },
    });
    const filterFn = resolveAccessConstraint({
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

describe("resolveAccessConstraint — an index with an empty range excludes nothing", () => {
  const orderingOnlyAccess = defineAccess({
    roles: ["contributor"] as const,
    resources: [pages, users],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      contributor: {
        pages: {
          // Calls `withIndex` for ORDERING only — no `eq`/bound ever applied, so the
          // recorded range is empty. Per `AccessQueryBuilder.withIndex`'s own
          // contract this still opts INTO the index (unlike Convex's optional
          // range), but records no constraint: "an index with no constraints is an
          // ordering-only opt-in and excludes nothing" (resolveAccessConstraint.ts).
          read: { constraints: ({ q }) => q.withIndex("by_author", (ix) => ix) },
        },
      },
    },
  });

  it("resolveAccessIndex still resolves the index, for ordering, with a no-op range", () => {
    const resolved = resolveAccessIndex({
      access: orderingOnlyAccess,
      user: asUser("contributor"),
      resource: "pages",
      action: "read",
    });
    expect(resolved?.name).toBe("by_author");
    const calls: unknown[][] = [];
    const rangeBuilder = {
      eq: (...args: unknown[]) => (calls.push(args), rangeBuilder),
    } as unknown as Parameters<IndexRangeFn>[0];
    expect(resolved?.range?.(rangeBuilder)).toBe(rangeBuilder);
    expect(calls).toEqual([]);
  });

  it("resolveAccessConstraint returns undefined — an empty range excludes nothing to check per document", () => {
    expect(
      resolveAccessConstraint({
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

describe("resolveAccessConstraint / resolveAccessIndex — a condition the module cannot read", () => {
  // A `constraints` callback may resolve to something other than `true`, `false`,
  // or a value built through `q` — e.g. a stray object smuggled past a cast.
  //
  // `defineAccess` now REJECTS this shape at config time, so the fixture is built as
  // a plain object and cast rather than passed through it. That is deliberate: the
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
            constraints: (): boolean | AccessConditionResult =>
              ({ notARealCondition: true }) as unknown as AccessConditionResult,
          },
        },
      },
      contributor: {
        pages: {
          read: {
            constraints: ({ user, q }) =>
              q.withIndex("by_author", (ix) =>
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
              ),
          },
        },
      },
    },
  });

  it("resolveAccessIndex returns undefined rather than treating an unreadable condition as unrestricted", () => {
    expect(
      resolveAccessIndex({
        access: unreadableAccess,
        user: asUser("ghost"),
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });

  it("resolveAccessConstraint returns undefined for the same role — no fabricated filter", () => {
    expect(
      resolveAccessConstraint({
        access: unreadableAccess,
        user: asUser("ghost"),
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });

  it("an unreadable role suppresses another role's index, exactly like a genuinely unrestricted one would", () => {
    expect(
      resolveAccessIndex({
        access: unreadableAccess,
        user: asUser(["ghost", "contributor"]),
        resource: "pages",
        action: "read",
      }),
    ).toBeUndefined();
  });
});

describe("resolveAccessConstraint — indexAlreadyApplied", () => {
  const bothHalvesAccess = defineAccess({
    roles: ["contributor"] as const,
    resources: [pages, users],
    userCollectionSlug: "users",
    userRolesField: "roles",
    permissions: {
      contributor: {
        pages: {
          read: {
            constraints: ({ user, q }) =>
              q
                .withIndex("by_author", (ix) =>
                  ix.eq(
                    "authorId",
                    typeof user === "object" && user !== null && "_id" in user
                      ? user._id
                      : undefined,
                  ),
                )
                .filter((f) => f.neq("status", "archived")),
          },
        },
      },
    },
  });

  function recordingQ(): { q: Parameters<AccessFilterFn>[0]; calls: string[] } {
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
    return { q: raw as unknown as Parameters<AccessFilterFn>[0], calls };
  }

  it("false — the index half is DOWNGRADED to a filter and ANDed with the filter half", () => {
    const filterFn = resolveAccessConstraint({
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
    const filterFn = resolveAccessConstraint({
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
      resolveAccessConstraint({
        access,
        user: asUser("contributor", "dana"),
        resource: "pages",
        action: "read",
        indexAlreadyApplied: true,
      }),
    ).toBeUndefined();
  });
});
