import { describe, expect, it } from "vitest";
import { defineCollection, defineConfig, defineServerConfig, text } from "../index";
import { defineAccess } from "./config";
import { WILDCARD_KEY } from "./constants";
import type { AccessDocFieldFor, AccessDocFor, ConstrainedPermissionCheck, VexAccessConfig } from "./types";
import { VexAccessConfigError } from "./types";
import type { MutationCallActionFor, QueryCallActionFor } from "../api/types";

// Core tests run with an unaugmented GeneratedVexTypes registry, so callback
// `data`/`user` params are the wide pre-generation fallback — the `typeof`/`in`
// guards below are expected and disappear in apps after `vex generate`
// augments the registry.

const draftPages = defineCollection({
  slug: "draftPages",
  fields: { title: text({ required: true }) },
  versions: { drafts: true },
});

const pages = defineCollection({
  slug: "pages",
  // `authorId` declares a real index so `withIndex: "by_author"` resolves at
  // runtime too — index validation (`validateAccessConfig`, run from
  // `defineConfig`) is not exercised by this file's type-rejection tests, but the
  // fixture still names a real index so it reads like production config.
  fields: {
    title: text({ required: true }),
    authorId: text({ index: "by_author" }),
  },
});

const users = defineCollection({
  slug: "users",
  fields: { name: text({ required: true }), roles: text() },
});

/** Shared valid base — spread into calls, override per test. */
/**
 * Builds an access config AND loads it through `defineConfig`, where constraint
 * validation now lives — `defineAccess` cannot validate, since the complete index
 * truth only exists once `defineConfig` has merged every collection source.
 *
 * @param props - The `defineAccess` input.
 * @returns The resolved access config.
 */
function loadAccess<T>(build: () => T): T {
  const access = build();
  // Read the resources off the RESOLVED config rather than re-listing them.
  //
  // Two shapes here are load-bearing. The THUNK means `defineAccess` receives the
  // object literal directly, preserving `const` inference for slugs, indexes and
  // callback value types — taking `Parameters<typeof defineAccess>[0]` instead
  // resolves the generics to their defaults and collapses constraint values to
  // `never`. And `T` is captured from the thunk rather than written as
  // `ReturnType<typeof defineAccess>`, which would do the same to the phantom
  // `SubjectMap` and make every concrete config unassignable (`VexAccessConfig` is
  // invariant in it).
  const resources =
    (access as { resources?: readonly { slug: string }[] }).resources ?? [];
  // Access validation runs in `defineServerConfig`, which needs the merged
  // collections the client half resolves.
  defineServerConfig({
    config: defineConfig({
      // `labels` is the discriminator: collections declare it, globals never do.
      collections: resources.filter((r) => "labels" in r) as never,
      globals: resources.filter((r) => !("labels" in r)) as never,
      access: access as never,
    }),
  });
  return access;
}

const baseInput = {
  roles: ["admin", "contributor"] as const,
  resources: [pages, users],
  userCollectionSlug: "users",
  userRolesField: "roles",
} as const;

// The former `describe("PermissionCheck — indexed object form")` block is gone with
// the shape it tested: `AccessIndex` and the deprecated `{ filter, withIndex }` pair
// were deleted early (Step 13's type work, pulled forward) because `resolveAccessRule`
// could not be written against two shapes at once. Its replacements live in the
// `withIndex` / `where` object-form block below.

describe("PermissionCheck — withIndex / where / filter object form", () => {
  it("accepts a static withIndex on a query action", () => {
    defineAccess({
      ...baseInput,
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: { pages: { read: { withIndex: { name: "by_author", range: (ix) => ix.eq("authorId", "u1") } } } },
      },
    });
  });

  it("accepts a caller-dependent withIndex beside a filter, with no where", () => {
    defineAccess({
      ...baseInput,
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: {
          pages: {
            read: {
              withIndex: ({ user }) => ({ name: "by_author", range: (ix) => ix.eq("authorId", String(user._id)) }),
              filter: () => true,
            },
          },
        },
      },
    });
  });

  it("accepts where alone on a mutation action", () => {
    defineAccess({
      ...baseInput,
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: { pages: { update: { where: ({ q }) => q.eq("authorId", "u1") } } },
      },
    });
  });

  it("rejects withIndex on a mutation action, at the property", () => {
    defineAccess({
      ...baseInput,
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: {
          pages: {
            update: {
              // @ts-expect-error — a mutation action has no query to narrow, so `withIndex` is `WithIndexOnMutationError`
              withIndex: { name: "by_author", range: (ix) => ix.eq("authorId", "u1") },
              where: ({ q }) => q.eq("authorId", "u1"),
            },
          },
        },
      },
    });
  });

  it("rejects an object with neither withIndex nor where", () => {
    defineAccess({
      ...baseInput,
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: {
          pages: {
            // @ts-expect-error — `filter` augments `withIndex` / `where`; it is never the only property
            read: { filter: () => true },
          },
        },
      },
    });
  });

  it("accepts where without filter — filter is optional", () => {
    defineAccess({
      ...baseInput,
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: {
          pages: {
            read: {
              where: ({ q }) => q.eq("authorId", "u1"),
            },
          },
        },
      },
    });
  });

  it("accepts a static where, alone and beside a static withIndex", () => {
    defineAccess({
      ...baseInput,
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: {
          pages: {
            read: {
              withIndex: { name: "by_author", range: (ix) => ix.eq("authorId", "u1") },
              where: { not: { field: "title", op: "eq", value: "Draft" } },
            },
            update: { where: { field: "authorId", op: "eq", value: "u1" } },
          },
        },
      },
    });
  });

  it("accepts where on create — the object form is valid on every action (DD 14)", () => {
    defineAccess({
      ...baseInput,
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: {
          pages: {
            create: {
              where: ({ q }) => q.eq("authorId", "u1"),
            },
          },
        },
      },
    });
  });

  it("accepts where on delete", () => {
    defineAccess({
      ...baseInput,
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: {
          pages: {
            delete: {
              where: ({ q }) => q.eq("authorId", "u1"),
            },
          },
        },
      },
    });
  });

  it("rejects a flat-only operator inside withIndex's range, and surfaces a config error if forced through", () => {
    // Two layers, both asserted. The type rejects `neq` inside the positional range
    // builder; and because loading the config RUNS the callback to record it, a caller
    // who forced this through still gets a `VexAccessConfigError` naming the rule
    // rather than a bare `TypeError` from the missing method.
    expect(() =>
      loadAccess(() =>
        defineAccess({
          ...baseInput,
          permissions: {
            admin: { [WILDCARD_KEY]: true },
            contributor: {
              pages: {
                read: {
                  withIndex: {
                    name: "by_author",
                    // @ts-expect-error — `neq` exists only on the flat algebra; `ix` is positional
                    range: (ix) => ix.neq("authorId", "u1"),
                  },
                },
              },
            },
          },
        }),
      ),
    ).toThrow(VexAccessConfigError);
  });

  // NOTE: an unknown index NAME is not rejected here. `IndexFieldsBySlug` is
  // unaugmented in core's own suite (see the file header), so `withIndex` accepts
  // any name and each index resolves to eight `string` slots. Name and per-field
  // value checking bite after `vex generate`; the runtime validator that
  // `defineConfig` runs catches a bad name either way, against the resource's REAL
  // declared indexes — see `config.test.ts`.

  it("rejects withIndex on create, at the property — no query exists to narrow (DD 14)", () => {
    defineAccess({
      ...baseInput,
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: {
          pages: {
            create: {
              // @ts-expect-error — a mutation action has no query to narrow, so `withIndex` is `WithIndexOnMutationError`
              withIndex: { name: "by_author", range: (ix) => ix.eq("authorId", "u1") },
              where: ({ q }) => q.eq("authorId", "u1"),
            },
          },
        },
      },
    });
  });

  it("still accepts the flat predicate (where) on a mutation action", () => {
    defineAccess({
      ...baseInput,
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: {
          pages: {
            update: {
              where: ({ q }) => q.neq("authorId", "u1"),
            },
          },
        },
      },
    });
  });
});

describe("PermissionCheck — bare filter callback stays valid alongside withIndex/where", () => {
  it("still accepts a bare callback on read — the object form did not disturb it", () => {
    defineAccess({
      ...baseInput,
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: {
          pages: {
            read: ({ data, user }: { data: unknown; user: unknown }) =>
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
    });
  });

  it("still accepts a bare callback on create — non-query actions were never part of this change", () => {
    defineAccess({
      ...baseInput,
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: {
          pages: {
            create: ({ data }: { data: unknown }) =>
              typeof data === "object" && data !== null && "authorId" in data,
          },
        },
      },
    });
  });
});

describe("AccessDocFieldFor — the field union a helper can read off a document", () => {
  it("covers declared fields and both system fields", () => {
    // Derived straight from the document, so `_id` and `_creationTime` come along.
    // They used to differ: the field-type map carried a synthetic `id: "_id"` entry
    // and nothing for `_creationTime`, so `_id` was nameable and `_creationTime` was
    // not — an accident of the emitter rather than a decision.
    type Has<U, M> = [M] extends [U] ? true : false;

    const id: Has<AccessDocFieldFor<"posts">, "_id"> = true;
    const creationTime: Has<AccessDocFieldFor<"posts">, "_creationTime"> = true;
    const declared: Has<AccessDocFieldFor<"posts">, "title"> = true;
    // Still narrow — it did not collapse to `string`.
    const bogus: Has<AccessDocFieldFor<"posts">, "notAField"> = false;

    expect([id, creationTime, declared, bogus]).toEqual([
      true,
      true,
      true,
      false,
    ]);
  });

  it("is exactly `keyof AccessDocFor`, which is what makes it indexable", () => {
    // Load-bearing, not a tautology: a parameter bounded by this alias can index
    // `AccessDocFor<S>` with no cast. Wrapping it in a widening conditional — as the
    // old field-keys alias did — breaks that, because TypeScript cannot prove an
    // unreduced conditional is a key of the document.
    type Same<A, B> = [A] extends [B]
      ? [B] extends [A]
        ? true
        : false
      : false;

    const agree: Same<
      keyof AccessDocFor<"posts"> & string,
      AccessDocFieldFor<"posts">
    > = true;
    expect(agree).toBe(true);
  });

  it("is empty for a slug the registry does not know", () => {
    // The deliberate cost of staying indexable: an unregistered slug's document is
    // the wide fallback, whose index signature `DeclaredDoc` strips, leaving `keyof`
    // as `never`. So a field-reading helper only types after `vex generate` — which
    // is already true of every other part of authoring an access config, since slugs
    // and index names come from the same registry.
    type Has<U, M> = [M] extends [U] ? true : false;

    const anything: Has<
      AccessDocFieldFor<"not_a_registered_slug">,
      "whatever"
    > = false;
    expect(anything).toBe(false);
  });
});

describe("customActions — query/mutation split, typo protection, auth subjects", () => {
  /** Both lists declared on a real resource. */
  const bothLists = {
    ...baseInput,
    customActions: {
      pages: { query: ["listFeatured"], mutation: ["publish"] },
    },
  } as const;

  it("gives a custom QUERY action the index builder", () => {
    defineAccess({
      ...bothLists,
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: {
          pages: {
            listFeatured: {
              withIndex: { name: "by_author", range: (ix) => ix.eq("authorId", "u1") },
            },
          },
        },
      },
    });
  });

  it("rejects q.withIndex on a custom MUTATION action — same rule as create/update (DD 14)", () => {
    defineAccess({
      ...bothLists,
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: {
          pages: {
            publish: {
              // @ts-expect-error — a custom mutation action has no query to narrow, so `withIndex` is `WithIndexOnMutationError`
              withIndex: { name: "by_author", range: (ix) => ix.eq("authorId", "u1") },
            },
          },
        },
      },
    });
  });

  it("accepts a predicate constraint on a custom MUTATION action", () => {
    defineAccess({
      ...bothLists,
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: {
          pages: { publish: { where: ({ q }) => q.eq("authorId", "u1") } },
        },
      },
    });
  });

  it("rejects an undeclared verb on a resource that declares customActions", () => {
    defineAccess({
      ...bothLists,
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        // @ts-expect-error — `archive` was never declared in `customActions.pages`
        contributor: { pages: { archive: true } },
      },
    });
  });

  // The two guards below are the regression pins for the omission poison: matching
  // both lists at once against OPTIONAL properties failed wholesale whenever either
  // list was omitted, and `infer` then fell back to its `string` constraint — widening
  // that one resource's action union so ANY key was accepted, while every other
  // resource kept typo-checking. Declaring only `mutation` is the common case
  // (`publish`, `archive`, `ban` are all mutation verbs), so the broken path was the
  // default one.
  it("keeps typo protection when ONLY `mutation` is declared", () => {
    defineAccess({
      ...baseInput,
      customActions: { pages: { mutation: ["publish"] } },
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        // @ts-expect-error — `raed` is a typo for `read`, not a declared action
        contributor: { pages: { raed: true } },
      },
    });
  });

  it("keeps typo protection when ONLY `query` is declared", () => {
    defineAccess({
      ...baseInput,
      customActions: { pages: { query: ["listFeatured"] } },
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        // @ts-expect-error — `updaet` is a typo for `update`
        contributor: { pages: { updaet: true } },
      },
    });
  });

  it("keeps a mutation-only declaration MUTATION-shaped — the poison also widened `queryAction`", () => {
    defineAccess({
      ...baseInput,
      customActions: { pages: { mutation: ["publish"] } },
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: {
          pages: {
            publish: {
              // @ts-expect-error — still predicate-only; the widened union used to
              // make every action on this resource read as query-shaped
              withIndex: { name: "by_author", range: (ix) => ix.eq("authorId", "u1") },
            },
          },
        },
      },
    });
  });

  it("leaves a resource without a customActions entry untouched", () => {
    defineAccess({
      ...bothLists,
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        // @ts-expect-error — `users` declares no custom actions, so CRUD only
        contributor: { users: { raed: true } },
      },
    });
  });

  // Auth subjects (the user/org collections) are synthesized from the registry rather
  // than listed in `resources`. The `customActions` bound has always accepted their
  // slugs as keys, so a declaration there compiled clean — but the synthesized action
  // union was CRUD-only, leaving the declaration accepted and permanently unusable.
  it("honours a custom action declared on the user collection", () => {
    defineAccess({
      ...baseInput,
      customActions: { users: { query: ["listActive"] } },
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: { users: { listActive: true } },
      },
    });
  });

  it("makes a user-collection custom MUTATION action mutation-shaped", () => {
    defineAccess({
      ...baseInput,
      customActions: { users: { mutation: ["ban"] } },
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: {
          users: {
            ban: {
              // @ts-expect-error — mutation-shaped, so no index builder
              withIndex: { name: "by_email", range: (ix) => ix.eq("email", "a@b.c") },
            },
          },
        },
      },
    });
  });

  it("still rejects a typo on the user collection once it declares custom actions", () => {
    defineAccess({
      ...baseInput,
      customActions: { users: { query: ["listActive"] } },
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        // @ts-expect-error — `listActiv` is a typo for the declared `listActive`
        contributor: { users: { listActiv: true } },
      },
    });
  });

  // Key-exactness pins. The `Partial<Record<…>>` BOUND alone cannot reject a typo'd
  // key: an all-optional target is a "weak type", so TypeScript errors only when the
  // object shares ZERO keys with it. One valid entry beside a garbage key passed
  // silently — which is exactly how it shipped broken: every earlier probe tested the
  // all-bogus case. The `[K in Exclude<keyof TCA, slugs>]: never` intersection on the
  // input field is what makes each unknown key error at its own location.
  it("rejects a customActions key that is not a declared resource slug", () => {
    defineAccess({
      ...baseInput,
      customActions: {
        // @ts-expect-error — not a resource slug
        totallyBogus: { query: ["x"] },
      },
      permissions: { admin: { [WILDCARD_KEY]: true }, contributor: {} },
    });
  });

  it("rejects a bogus customActions key even BESIDE a valid entry (weak-type trap)", () => {
    defineAccess({
      ...baseInput,
      customActions: {
        pages: { query: ["listFeatured"] },
        // @ts-expect-error — the valid `pages` entry must not launder this key
        totallyBogus: { query: ["x"] },
      },
      permissions: { admin: { [WILDCARD_KEY]: true }, contributor: {} },
    });
  });

  // Regression pin for the contextual-typing collapse. When the gate conditional
  // consulted a type parameter that had no inference candidate yet, it stayed
  // DEFERRED and supplied no contextual type — every implicitly-typed callback
  // parameter silently became `any`, which also stops field-name typos inside
  // constraint callbacks from being caught. If `q` is `any` again, the bogus method
  // below compiles and this test fails on the unused directive.
  it("keeps callback params contextually typed while customActions is declared", () => {
    defineAccess({
      ...bothLists,
      permissions: {
        admin: { [WILDCARD_KEY]: true },
        contributor: {
          pages: {
            [WILDCARD_KEY]: {
              // @ts-expect-error — `q` must be the real builder, never `any`
              where: ({ q }) => q.definitelyNotAMethod(),
            },
          },
        },
      },
    });
  });
});

describe("call-action unions — pre-generation fallback and shape", () => {
  it("accepts arbitrary strings while the registry is unaugmented", () => {
    // Core's own suite runs without `vex generate`, so `CustomActionsBySlug` is `{}`
    // and the fallback MUST stay permissive — otherwise every core test naming a
    // custom action would stop compiling. Post-generation exactness is only
    // observable in an augmented project (www), which pins it with its own probes.
    const q: QueryCallActionFor<"articles"> = "anyCustomVerb";
    const m: MutationCallActionFor<"articles"> = "anyOtherVerb";
    expect(q).toBe("anyCustomVerb");
    expect(m).toBe("anyOtherVerb");
  });

  // NOTE deliberately absent: a core-side pin that `publish` is not a QUERY literal.
  // `(string & {})` is plain `string` for assignability — it is special only to the
  // completion engine — so the permissive fallback accepts every string and the
  // literal halves of these unions are unobservable to a type assertion here. The
  // strict arms ARE observable once the registry is augmented, which is what
  // `apps/test/src/auth/access.typecheck.ts` pins on every www typecheck.
});

describe("VexAccessConfig — the bare type is a supertype of every concrete config", () => {
  it("accepts an org-configured config that declares custom actions", () => {
    // Invariance pin. `VexConfig.access` and every helper name `VexAccessConfig`
    // BARE, so its parameter DEFAULTS define the wide supertype — and any parameter
    // that appears in the interface body breaks assignability when its default
    // excludes a concrete value. This has bitten twice: `TOrgSlug = undefined`
    // (org-configured projects could not pass their config to `hasPermission`) and
    // `TCustomActions = {}` (declaring ANY custom action broke every consumer).
    // A new parameter added with a narrow default will fail this test.
    const concrete = defineAccess({
      roles: ["admin"] as const,
      resources: [pages, users],
      userCollectionSlug: "users",
      orgCollectionSlug: "users",
      userRolesField: "roles",
      customActions: { pages: { query: ["listFeatured"], mutation: ["publish"] } },
      permissions: { admin: { [WILDCARD_KEY]: true } },
    });
    const wide: VexAccessConfig = concrete;
    expect(wide.customActions).toEqual({
      pages: { query: ["listFeatured"], mutation: ["publish"] },
    });
  });
});

describe("DRAFT_ACTIONS — composes onto a resource's action union by shape (AP-008)", () => {
  it("accepts deleteVersions (and the rest of DRAFT_ACTIONS) as a permission key for a resource with versions.drafts: true", () => {
    defineAccess({
      roles: ["admin"] as const,
      resources: [draftPages, users],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        admin: {
          draftPages: {
            readDrafts: true,
            saveDraft: true,
            publish: true,
            unpublish: true,
            deleteVersions: true,
          },
        },
      },
    });
  });

  it("rejects deleteVersions on a resource that does not declare versions.drafts: true", () => {
    defineAccess({
      roles: ["admin"] as const,
      resources: [pages, users],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        admin: {
          // @ts-expect-error — `pages` declares no `versions.drafts`, so `deleteVersions` is not in its action union
          pages: { deleteVersions: true },
        },
      },
    });
  });
});

type PagesDoc = { authorId: string; status: string; title: string };
type PagesIndexes = { by_author: readonly ["authorId"]; by_author_status: readonly ["authorId", "status"] };
type PagesQueryRule = ConstrainedPermissionCheck<PagesDoc, { _id: string }, never, PagesIndexes>;
type PagesMutationRule = ConstrainedPermissionCheck<PagesDoc, { _id: string }, never>;

describe("ConstrainedPermissionCheck — field typing, with the registry's inputs given explicitly", () => {
  it("types withIndex's range by the discriminated index name, in either form", () => {
    const staticCompound: PagesQueryRule = {
      withIndex: { name: "by_author_status", range: (ix) => ix.eq("authorId", "u1").eq("status", "published") },
    };
    const callerIndex: PagesQueryRule = {
      withIndex: ({ user }) => ({ name: "by_author", range: (ix) => ix.eq("authorId", user._id) }),
    };
    // @ts-expect-error — `status` is not `by_author`'s field
    const wrongField: PagesQueryRule = { withIndex: { name: "by_author", range: (ix) => ix.eq("status", "published") } };
    // @ts-expect-error — `by_author_status` must be ranged from `authorId` first
    const outOfOrder: PagesQueryRule = { withIndex: { name: "by_author_status", range: (ix) => ix.eq("status", "published") } };
    // @ts-expect-error — `by_nope` is not an index
    const unknownIndex: PagesQueryRule = { withIndex: { name: "by_nope", range: (ix) => ix.eq("authorId", "u1") } };
    // @ts-expect-error — a range value must have the field's type
    const wrongValue: PagesQueryRule = { withIndex: { name: "by_author", range: (ix) => ix.eq("authorId", 1) } };
    expect([staticCompound, callerIndex, wrongField, outOfOrder, unknownIndex, wrongValue]).toHaveLength(6);
  });

  it("types where's fields and values", () => {
    const callbackWhere: PagesMutationRule = { where: ({ q }) => q.eq("title", "Home") };
    // @ts-expect-error — `nope` is not a field
    const unknownField: PagesMutationRule = { where: ({ q }) => q.eq("nope", "x") };
    // @ts-expect-error — `title` holds a string
    const wrongValue: PagesMutationRule = { where: ({ q }) => q.eq("title", 1) };
    expect([callbackWhere, unknownField, wrongValue]).toHaveLength(3);
  });

  it("types a static where's fields", () => {
    const staticWhere: PagesMutationRule = { where: { and: [{ field: "title", op: "neq", value: "Draft" }] } };
    // @ts-expect-error — `nope` is not a field
    const unknownWhereField: PagesMutationRule = { where: { field: "nope", op: "eq", value: "x" } };
    expect([staticWhere, unknownWhereField]).toHaveLength(2);
  });
});
