---
status: done
spec_id: 2026-08-29-server-api-access-options
touches:
  - packages/core/src/api/types.ts
  - packages/core/src/api/utils.ts
  - packages/core/src/api/*/server.ts
  - packages/core/src/api/globals/*.server.ts
  - packages/core/src/media/api/*.ts
  - packages/core/src/access/types.ts
  - packages/core/src/access/config.ts
  - apps/www/convex/vex.ts
prompt_version: 1
---

# 2026-08-29-server-api-access-options — Spec

## Overview

Server API functions hardcode which permission action they check — `read` for
`find`/`get`/`search`, `create`/`update`/`delete` for the mutations — at 22 sites across
collections, globals, and media. Custom actions (`listFeatured`, `publish`) are therefore
declarable and type-checked but have **zero runtime consumers**, and versioning has no way to
ask for `readDrafts` instead of `read`.

This spec adds one grouped per-call option, `access: { action?, bypass? }`, threads it through
every raw server function, and renames the existing `skipAccess` into it. It is the seam
versioning consumes to switch a query between `read` and `readDrafts`.

## Design Decisions

1. **Per-call access options are exposed ONLY on `vexServerApi` output and the raw server
   functions.** Never in a registered function's `args` validator. An action that no role
   declares for a subject falls through to `defaultPermissionMode`, which defaults to `allow`
   (`access/config.ts`) — verified: an undeclared action and an undeclared subject both
   resolved `true`. So a client-supplied `action` is a read-anything hole, and a
   client-supplied `bypass` is RBAC off by request.
2. **Factory-level options on `collectionsApi` are server-authored constants, not per-call
   knobs.** `collection` is itself a client argument there, so a blanket bypass would open
   every collection through one endpoint, not just the intended one.
3. **Grouped `access: { action, bypass }`, not `accessAction` / `skipAccess`.** One namespace,
   the two settings read together, and it extends without new top-level arg names.
4. **`bypass` strips `access` from the config rather than adding an enforcement branch.** This
   reuses the documented "RBAC not configured" path that `vexServerApi`'s `openConfig` already
   relies on, and it must also skip `getAuth` so a public read costs no session lookup.
5. **`skipAccess` is renamed, not aliased.** Zero call sites exist in the repo, so a clean
   cutover costs nothing and leaves one name for the concept.
6. **The resolved `VexAccessConfig` gains `customActions`.** It is the only runtime source of
   truth for which custom verbs a subject declares, which is what lets the dev guard
   distinguish `listFeatured` from `listFeatued`.
7. **`action` is typed as the built-in unions plus `(string & {})`.** `read`/`readDrafts`
   autocomplete immediately — everything versioning needs — while custom verbs still compile.
   Registry-backed autocomplete for custom actions is a follow-up, not a blocker.
8. **`GenericMutationServerParams` gained a `TCollectionSlug` parameter.** The spec first
   proposed declaring `access` on each of the three mutation interfaces to avoid widening the
   base; implementation chose the base parameter instead - one declaration, and Step 5's
   per-slug action typing then lands in a single place for all three mutations.
9. **The undeclared-permission posture is pinned to `deny`, with no input field.** Landed
   ahead of this spec: `defaultPermissionMode` is gone from `VexAccessConfigInput`, and
   `defineAccess` pins the resolved value. An allow posture is expressible as a role-level
   `"*": true` — per-role and greppable, which a global default never was. Consequence for
   this spec: a typo'd `access.action` now DENIES rather than over-permitting, so Step 1's
   guard is a diagnostic aid, not a security control.
10. **Dev warnings only — never a throw.** The guards explain an unexpected denial; they do
    not create a new failure mode. A throw would turn a typo into a downed endpoint, and the
    pinned deny posture already makes the underlying failure safe.

## Out of Scope

- Client-selectable actions of any kind. `access.action` and `access.bypass` are server-side
  only — the caller must already have chosen the collection.
- `access` options on `collectionsApi` / `globalsApi` / `mediaApi` **call arguments**.
- Registry emission (`CustomActionsBySlug`) for custom-action autocomplete.
- The `drafts` toggle. Deferred to the versioning spec, where the row status it needs
  exists. Analysis worth carrying over: with the posture pinned to `deny`, an undeclared
  `readDrafts` denies rather than leaks, so a closed `drafts: boolean` is safe to accept
  from a client and needs no `versions.drafts` guard for safety.
- Status-index narrowing: `vex_status` emission, compound indexes, `filterFields` on search
  indexes, and the third claimant in `pickQueryIndex`. All versioning-spec work. This spec
  only selects the ACTION; it never changes which rows a query reads.

## Implementation

### Step 1 — Access call options, resolver, and runtime custom-action record

`[dev]`

- [ ] `packages/core/src/access/types.ts`
- [ ] `packages/core/src/access/config.ts`
- [ ] `packages/core/src/api/types.ts`
- [ ] `packages/core/src/api/utils.ts`
- [ ] `packages/core/src/api/utils.test.ts`

#### packages/core/src/access/types.ts

One edit. Everything not shown is unchanged.

**1 — resolved config carries the declared custom verbs.** Add to the resolved
`VexAccessConfig` interface, beside `defaultPermissionMode`.

```ts
  /**
   * Custom actions per subject slug, as declared in `defineAccess`. Carried on the
   * RESOLVED config purely so request-time code can tell a declared verb from a typo:
   * an undeclared action resolves through `defaultPermissionMode` (default `allow`),
   * so without this record a misspelled `access.action` silently widens access.
   */
  customActions?: Record<string, { query?: readonly string[]; mutation?: readonly string[] }>;
```

#### packages/core/src/access/config.ts

One edit. Everything not shown is unchanged.

**1 — carry it through.** In the object `defineAccess` returns, beside
`defaultPermissionMode: props.defaultPermissionMode ?? PERMISSION_MODES.allow,`:

```ts
    customActions: props.customActions,
```

#### packages/core/src/api/types.ts

Two edits. Everything not shown is unchanged.

**1 — the option bag.** Add near `GenericQueryServerParams`.

```ts
/**
 * Per-call access options. Server-side only — NEVER accept these from a registered
 * Convex function's `args`: an action no role declares falls through to
 * `defaultPermissionMode` (default `allow`), so a client-chosen action reads anything.
 *
 * @typeParam A - Action union accepted for this call shape.
 */
export interface AccessCallOptions<A extends string = string> {
  /**
   * Permission action to check instead of the function's natural verb. Use for custom
   * actions (`listFeatured`) and for draft reads (`readDrafts`).
   *
   * @defaultValue the function's natural verb (`read`, `create`, `update`, `delete`)
   */
  action?: A;
  /**
   * Skip RBAC for this call entirely. Also skips `getAuth`, so a public read costs no
   * session lookup.
   *
   * @defaultValue false
   */
  bypass?: boolean;
}

/**
 * Actions a query-shaped call may check. `(string & {})` keeps literal autocomplete.
 *
 * NOT `| DraftAction`: `QueryAction` already carries `readDrafts` (the only
 * query-shaped draft verb), so adding the full draft union would offer
 * `saveDraft`/`publish`/`unpublish` - mutation verbs - in every query position.
 */
export type QueryCallAction = QueryAction | (string & {});

/** Actions a mutation-shaped call may check. The draft verbs minus `readDrafts`. */
export type MutationCallAction = CrudAction | Exclude<DraftAction, QueryAction> | (string & {});
```

**2 — expose it on both bases.** Add to `GenericQueryServerParams` beside `config`, and to
`GenericMutationServerParams` beside `config`:

```ts
  /** Per-call access overrides. @see {@link AccessCallOptions} */
  access?: AccessCallOptions<QueryCallAction>;
```

```ts
  /** Per-call access overrides. @see {@link AccessCallOptions} */
  access?: AccessCallOptions<MutationCallAction>;
```

#### packages/core/src/api/utils.ts

One edit. Everything not shown is unchanged.

**1 — the resolver.** Add beside `resolveCollectionSlug`.

```ts
/**
 * Resolves the access config and action for one server-function call.
 *
 * Single seam for `access.action` / `access.bypass`. Bypass returns `undefined` for
 * `access`, which is the documented "RBAC not configured" path — no separate enforcement
 * branch exists or should be added.
 *
 * @param props.config - Resolved Vex config; `config.access` supplies the matrix.
 * @param props.access - Per-call overrides.
 * @param props.defaultAction - The function's natural verb.
 * @param props.resource - Subject slug, used only for dev-warning text and lookup.
 * @returns The access config to enforce (`undefined` when bypassed) and the action to check.
 */
export function resolveAccessCall<A extends string>(props: {
  config?: VexConfig;
  access?: AccessCallOptions<A>;
  defaultAction: A;
  resource: string;
}): { access: VexAccessConfig | undefined; action: A } {
  // TODO: implement
  // 1. const configured = props.config?.access → the matrix, or undefined when RBAC is off
  // 2. const action = props.access?.action ?? props.defaultAction
  // 3. if (process.env.NODE_ENV !== "production"):
  //    a. props.access?.bypass === true && configured === undefined
  //       → console.warn: bypass set but RBAC is not configured for this call (no-op)
  //    b. props.access?.action !== undefined && configured !== undefined
  //       → known = CRUD_ACTIONS ∪ DRAFT_ACTIONS ∪ configured.customActions?.[resource]
  //         (query and mutation lists both)
  //       → !known.has(action) → console.warn naming resource + action: undeclared actions
  //         resolve through defaultPermissionMode, which defaults to allow
  // 4. return { access: props.access?.bypass === true ? undefined : configured, action }
  //
  // Edge cases:
  // - bypass wins over action: no check runs, so the action is irrelevant (still returned).
  // - `configured === undefined` with no bypass is normal (RBAC off) — never warn on 3b.
  throw new Error("Not implemented");
}
```

#### packages/core/src/api/utils.test.ts

```ts
import { describe, expect, it, vi } from "vitest";
import { defineAccess } from "../access/config";
import { defineCollection, text } from "../index";
import { resolveAccessCall } from "./utils";

const articles = defineCollection({
  slug: "articles",
  fields: { title: text({ required: true }), status: text({ index: "by_status" }) },
});
const users = defineCollection({
  slug: "users",
  fields: { name: text({ required: true }), roles: text() },
});

const access = defineAccess({
  roles: ["editor"] as const,
  resources: [articles, users],
  userCollectionSlug: "users",
  userRolesField: "roles",
  customActions: { articles: { query: ["listFeatured"], mutation: ["publish"] } },
  permissions: { editor: { articles: { read: true } } },
});
const config = { access } as never;

describe("resolveAccessCall", () => {
  it("defaults to the function's natural verb", () => {
    expect(resolveAccessCall({ config, defaultAction: "read", resource: "articles" })).toEqual({
      access,
      action: "read",
    });
  });

  it("uses an explicit custom action", () => {
    expect(
      resolveAccessCall({
        config,
        access: { action: "listFeatured" },
        defaultAction: "read",
        resource: "articles",
      }).action,
    ).toBe("listFeatured");
  });

  it("drops the matrix when bypassed — the RBAC-off path, not a new branch", () => {
    expect(
      resolveAccessCall({
        config,
        access: { bypass: true },
        defaultAction: "read",
        resource: "articles",
      }).access,
    ).toBeUndefined();
  });

  it("returns undefined access when RBAC is not configured at all", () => {
    expect(
      resolveAccessCall({ config: {} as never, defaultAction: "read", resource: "articles" })
        .access,
    ).toBeUndefined();
  });

  it("warns when an explicit action is not declared for the subject", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    resolveAccessCall({
      config,
      access: { action: "listFeatued" },
      defaultAction: "read",
      resource: "articles",
    });
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]?.[0]).toContain("listFeatued");
    warn.mockRestore();
  });

  it("does not warn for a declared custom action, a built-in, or a draft action", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    for (const action of ["listFeatured", "publish", "read", "readDrafts"]) {
      resolveAccessCall({ config, access: { action }, defaultAction: "read", resource: "articles" });
    }
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("warns when bypass is set but RBAC is already off", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    resolveAccessCall({
      config: {} as never,
      access: { bypass: true },
      defaultAction: "read",
      resource: "articles",
    });
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});
```

Verify: `cd packages/core && pnpm vitest run src/api/utils.test.ts src/access`

### Step 2 — Thread the resolved pair through every raw server function

`[agent]` — mechanical. Every file follows the same three moves, written out per file below:

1. one `resolveAccessCall` (import from `../utils` / `../../api/utils`) near the top,
2. the `if (…access !== undefined)` guard switches to the RESOLVED `access`,
3. every check site reads `access` + `action` instead of `args.config…access` + a
   hardcoded `CRUD_ACTIONS.x`.

Move 2 is not style: `access.bypass` works BY returning `undefined` from the resolver —
a guard still reading the raw config silently ignores the flag. Guarding on the resolved
value also skips the pre-check `ctx.db.get` in `get`/`update`/`remove` when bypassed.

- [ ] `packages/core/src/api/find/server.ts` (6)
- [ ] `packages/core/src/api/search/server.ts` (5 + resolver)
- [ ] `packages/core/src/api/get/server.ts` (1)
- [ ] `packages/core/src/api/create/server.ts` (1)
- [ ] `packages/core/src/api/update/server.ts` (1)
- [ ] `packages/core/src/api/remove/server.ts` (1)
- [ ] `packages/core/src/api/globals/get.server.ts` (1)
- [ ] `packages/core/src/api/globals/upsert.server.ts` (1)
- [ ] `packages/core/src/api/globals/find.server.ts` (1, per-row)
- [ ] `packages/core/src/media/api/queries.ts` (1)
- [ ] `packages/core/src/media/api/mutations.ts` (3)
- [ ] `packages/core/src/api/find/server.test.ts`

#### packages/core/src/api/find/server.ts

Resolve once at the top of `find`, before `resolveAccessIndex`:

```ts
  const { access, action } = resolveAccessCall({
    config: args.config,
    access: args.access,
    defaultAction: CRUD_ACTIONS.read,
    resource: args.collection,
  });
```

Then all six sites read the pair: the `resolveAccessIndex` call, the
`resolveAccessConstraint` call, the three per-page `hasPermission` filters
(paginate / take / collect), and — easy to miss because it sits inside the
`totalDocs` count branch — the `countQuery` filter:

```ts
          const totalDocs = (await countQuery.collect()).filter((d) =>
            hasPermission({
              access,
              resource: args.collection,
              action,
              data: d,
              user: args.auth?.user ?? {},
              organization: args.auth?.organization,
            }),
          ).length;
```

Missing the count site is a real bug, not an inconsistency: the page would filter under
the resolved pair while `totalDocs` counts under raw `read`, so a bypassed or
custom-action query reports totals from a different permission universe than its rows.

#### packages/core/src/api/search/server.ts

Same resolver block at the top of `search`, before `resolveAccessConstraint`:

```ts
  const { access, action } = resolveAccessCall({
    config: args.config,
    access: args.access,
    defaultAction: CRUD_ACTIONS.read,
    resource: args.collection,
  });
  const accessFilter = resolveAccessConstraint({
    access,
    user: args.auth?.user ?? null,
    organization: args.auth?.organization,
    resource: args.collection,
    action,
  });
```

Then the four `hasPermission` filters (paginate / take / collect / the paginated
`totalDocs` count) each become:

```ts
      hasPermission({
        access,
        user: args.auth?.user ?? {},
        organization: args.auth?.organization,
        resource: args.collection,
        action,
        data: d,
      }),
```

#### packages/core/src/api/get/server.ts

```ts
  const doc = await args.ctx.db.get(args.id);
  const { access, action } = resolveAccessCall({
    config: args.config,
    access: args.access,
    defaultAction: CRUD_ACTIONS.read,
    resource: args.collection,
  });
  if (doc && access !== undefined) {
    hasPermission({
      throwOnDenied: true,
      access,
      user: args.auth?.user ?? {},
      organization: args.auth?.organization,
      resource: args.collection,
      action,
      data: doc,
    });
  }
```

#### packages/core/src/api/create/server.ts

```ts
  const { access, action } = resolveAccessCall({
    config: args.config,
    access: args.access,
    defaultAction: CRUD_ACTIONS.create,
    resource: args.collection,
  });
  if (access !== undefined) {
    // (existing scope/probe comment unchanged)
    hasPermission({
      access,
      user: args.auth?.user ?? {},
      organization: args.auth?.organization,
      resource: args.collection,
      action,
      data: args.data,
      throwOnDenied: true,
    });
  }
```

#### packages/core/src/api/update/server.ts

```ts
  const { access, action } = resolveAccessCall({
    config: args.config,
    access: args.access,
    defaultAction: CRUD_ACTIONS.update,
    resource: args.collection,
  });
  if (access !== undefined) {
    // (existing stored-document comment unchanged)
    const doc = await args.ctx.db.get(args.id);
    hasPermission({
      throwOnDenied: true,
      access,
      user: args.auth?.user ?? {},
      organization: args.auth?.organization,
      resource: args.collection,
      action,
      data: doc ?? undefined,
    });
  }
```

#### packages/core/src/api/remove/server.ts

The resolver sits at the top of `remove` itself — NOT inside the `removeById` closure,
which may run once per matched document:

```ts
  const { access, action } = resolveAccessCall({
    config: args.config,
    access: args.access,
    defaultAction: CRUD_ACTIONS.delete,
    resource: args.collection,
  });
  async function removeById(id: GenericId<TCollectionSlug>): Promise<void> {
    if (access !== undefined) {
      const doc = await args.ctx.db.get(id);
      hasPermission({
        throwOnDenied: true,
        access,
        user: args.auth?.user ?? {},
        organization: args.auth?.organization,
        resource: args.collection,
        action,
        data: doc ?? undefined,
      });
    }
    …
```

#### packages/core/src/api/globals/get.server.ts

Globals key the subject by `args.slug`:

```ts
  const { access, action } = resolveAccessCall({
    config: args.config,
    access: args.access,
    defaultAction: CRUD_ACTIONS.read,
    resource: args.slug,
  });
  if (access !== undefined) {
    hasPermission({
      throwOnDenied: true,
      user: args.auth?.user ?? {},
      organization: args.auth?.organization,
      access,
      resource: args.slug,
      action,
      data: flat,
    });
  }
```

#### packages/core/src/api/globals/upsert.server.ts

```ts
  const { access, action } = resolveAccessCall({
    config: args.config,
    access: args.access,
    defaultAction: CRUD_ACTIONS.update,
    resource: args.slug,
  });
  if (access !== undefined) {
    hasPermission({
      throwOnDenied: true,
      access,
      user: args.auth?.user ?? {},
      organization: args.auth?.organization,
      resource: args.slug,
      action,
    });
  }
```

#### packages/core/src/api/globals/find.server.ts

The one structural outlier: each row is a DIFFERENT subject (`r.slug`), so the resolver
runs per row and the outer raw-config guard is deleted rather than converted — the
per-row `access === undefined` covers RBAC-off and bypass in one path:

```ts
  let rows = await ctx.db.query("vex_globals").collect();
  rows = rows.filter((r) => {
    // Per row, not hoisted: the subject slug differs per row, and `resolveAccessCall`
    // is pure. `access === undefined` means RBAC is off or the call is bypassed —
    // either way the row is kept, which is exactly what the old outer guard did.
    const { access, action } = resolveAccessCall({
      config: args.config,
      access: args.access,
      defaultAction: CRUD_ACTIONS.read,
      resource: r.slug as string,
    });
    if (access === undefined) return true;
    return hasPermission({
      access,
      user: args.auth?.user ?? {},
      organization: args.auth?.organization,
      resource: r.slug as string,
      action,
      data: r.data as Record<string, unknown>,
    });
  });
```

#### packages/core/src/media/api/queries.ts

`getUrl` resolves its subject from the document id first; `defaultAction` is `read`:

```ts
  if (args.config.access !== undefined) {
    const resource = resolveCollectionSlug({
      ctx: args.ctx,
      config: args.config,
      id: args.mediaId as GenericId<CollectionSlug>,
    });
    const { access, action } = resolveAccessCall({
      config: args.config,
      access: args.access,
      defaultAction: CRUD_ACTIONS.read,
      resource,
    });
    hasPermission({
      throwOnDenied: true,
      access,
      user: args.auth?.user ?? {},
      organization: args.auth?.organization ?? {},
      resource,
      action,
    });
  }
```

The outer guard stays on the RAW config here, unlike every other file: it exists to skip
the `resolveCollectionSlug` probe when RBAC is off entirely. Bypass still works — the
resolved `access` is `undefined`, and `hasPermission` returns `true` for undefined access
(the same RBAC-off path). The cost is one wasted `normalizeId` loop on bypassed calls.

#### packages/core/src/media/api/mutations.ts

All three functions take the standard shape — `generateUploadUrl` and
`createMediaDocument` with `defaultAction: CRUD_ACTIONS.create`, `deleteMedia` with
`CRUD_ACTIONS.delete` (subject via `resolveCollectionSlug`, as in `getUrl`):

```ts
  const { access, action } = resolveAccessCall({
    config: args.config,
    access: args.access,
    defaultAction: CRUD_ACTIONS.create,
    resource: args.collection,
  });
  if (access !== undefined) {
    hasPermission({
      throwOnDenied: true,
      user: args.auth?.user ?? {},
      organization: args.auth?.organization,
      access,
      resource: args.collection,
      action,
    });
  }
```

#### packages/core/src/api/find/server.test.ts

Append to the existing suite. Uses the file's own conventions: `convexTest(schema,
modules)`, `t.run`, the `test` alias, config fixtures spread from `fixtureConfig` and
cast `as unknown as VexConfig`, and the existing `contributorAuth` fixture.

```ts
// `read` is deliberately undeclared: the pinned deny posture refuses it, so rows coming
// back under `listFeatured` prove the CHECKED ACTION actually switched — a passing call
// cannot be explained by the default verb.
const accessOptionsConfig = {
  ...fixtureConfig,
  access: defineAccess({
    roles: ["contributor"] as const,
    resources: [constrainedPostsResource],
    userCollectionSlug: "users",
    userRolesField: "roles",
    customActions: { posts: { query: ["listFeatured"] } },
    permissions: { contributor: { posts: { listFeatured: true } } },
  }),
} as unknown as VexConfig;

describe("find (server) — access call options", () => {
  test("access.action switches the checked action", async () => {
    const t = convexTest(schema, modules);
    const { withAction, withoutAction } = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        await ctx.db.insert("posts", { title: "A", slug: "a", featured: true });
        await ctx.db.insert("posts", { title: "B", slug: "b", featured: false });
        return {
          withAction: await find({
            ctx,
            collection: "posts",
            config: accessOptionsConfig,
            auth: contributorAuth,
            access: { action: "listFeatured" },
          }),
          withoutAction: await find({
            ctx,
            collection: "posts",
            config: accessOptionsConfig,
            auth: contributorAuth,
          }),
        };
      },
    );
    expect(withAction).toHaveLength(2);
    // Default verb is `read`, which nothing declares — pinned deny refuses it.
    expect(withoutAction).toHaveLength(0);
  });

  test("access.bypass returns rows the matrix denies, with no auth at all", async () => {
    const t = convexTest(schema, modules);
    const { bypassed, enforced } = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        await ctx.db.insert("posts", { title: "A", slug: "a", featured: true });
        return {
          bypassed: await find({
            ctx,
            collection: "posts",
            config: accessOptionsConfig,
            access: { bypass: true },
          }),
          enforced: await find({ ctx, collection: "posts", config: accessOptionsConfig }),
        };
      },
    );
    expect(bypassed).toHaveLength(1);
    // No auth and no bypass: unknown caller, deny posture — nothing comes back.
    expect(enforced).toHaveLength(0);
  });
});
```

Verify: `cd packages/core && pnpm vitest run && npx tsc --noEmit -p tsconfig.json`


### Step 3 — vexServerApi surface and the dev guards

`[dev]`

- [ ] `packages/core/src/api/server.ts`
- [ ] `packages/core/src/api/server.test.ts`

#### packages/core/src/api/server.ts

Three edits. Everything not shown is unchanged.

**1 — the bound args.** On the bound-args type carrying `skipAccess?: boolean` and on
`BoundPassthroughArgs`, delete `skipAccess` and add:

```ts
  /**
   * Per-call access overrides. Safe here and only here: the caller is your own server
   * code, which has already chosen the collection.
   *
   * @see {@link AccessCallOptions}
   */
  access?: AccessCallOptions;
```

**2 — `inject` takes the options.** Replace the `skipAccess?: boolean` parameter with
`access?: AccessCallOptions`, branch on `access?.bypass === true` for `openConfig`, and keep
skipping `getAuth` on that branch. Each of the seven wrappers destructures `{ access, ...rest }`
and forwards `access` to the underlying function *and* to `inject`.

**3 — JSDoc.** Update the `vexServerApi` example that shows `skipAccess: true` to
`access: { bypass: true }`, and add a second line showing `access: { action: "readDrafts" }`.

#### packages/core/src/api/server.test.ts

NEW file. Implemented and green - this is the file's verbatim content (7 tests).

```ts
import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test, vi } from "vitest";

import { VexAccessError } from "../access";
import { defineAccess } from "../access/config";
import type { VexConfig } from "../config";
import { checkbox, defineCollection, text } from "../index";
import * as _generatedApi from "./test/convex/_generated/api";
import schema from "./test/convex/schema";
import { vexServerApi } from "./server";
import type { VexApiAuth } from "./types";

/**
 * Contracts of the `vexServerApi` access options (spec
 * 2026-08-29-server-api-access-options, Step 3):
 *
 * 1. `access.bypass` never invokes `getAuth` — a public read costs no session lookup.
 * 2. Without bypass, `getAuth` resolves auth exactly once per call.
 * 3. `access.action` reaches the underlying permission check — proven with a matrix
 *    that DENIES the default verb and GRANTS only the custom one, so a passing call
 *    cannot be explained by `read`.
 * 4. A bypassed call emits NO dev warning. Regression pin: `inject` used to forward
 *    the access-stripped config, so the raw function's resolver saw "bypass set but
 *    RBAC off" and warned spuriously on every legitimate bypass.
 * 5. The mutation wrappers honour bypass the same way the query wrappers do.
 */

const modules: Record<string, () => Promise<unknown>> = {
  "./test/convex/_generated/api": () => Promise.resolve(_generatedApi),
};

const posts = defineCollection({
  slug: "posts",
  fields: { title: text(), slug: text(), featured: checkbox({ index: "by_featured" }) },
});

// `read` and `create` are deliberately undeclared: the pinned deny posture refuses
// them, so anything a call gets back is attributable to the option under test.
const accessConfig = {
  collections: [
    {
      slug: "posts",
      fields: { title: { type: "text" } },
      labels: { singular: "Post", plural: "Posts" },
      admin: { useAsTitle: "title" },
    },
  ],
  access: defineAccess({
    roles: ["contributor"] as const,
    resources: [posts],
    userCollectionSlug: "users",
    userRolesField: "roles",
    customActions: { posts: { query: ["listFeatured"] } },
    permissions: { contributor: { posts: { listFeatured: true } } },
  }),
} as unknown as VexConfig;

const contributor: VexApiAuth = { user: { _id: "u1", roles: "contributor" } };

/** Fresh api + spy per test — `getAuth` call counts must not leak across tests. */
function makeApi() {
  const getAuth = vi.fn(
    async (): Promise<VexApiAuth | undefined> => contributor,
  );
  const api = vexServerApi<GenericDataModel>({ config: accessConfig, getAuth });
  return { api, getAuth };
}

describe("vexServerApi — access.bypass", () => {
  test("skips getAuth entirely and returns rows the matrix denies", async () => {
    const t = convexTest(schema, modules);
    const { api, getAuth } = makeApi();
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "A", slug: "a", featured: true });
      await ctx.db.insert("posts", { title: "B", slug: "b", featured: false });
      return api.find({ ctx, collection: "posts", access: { bypass: true } });
    });
    expect(docs).toHaveLength(2);
    expect(getAuth).not.toHaveBeenCalled();
  });

  test("resolves auth normally without bypass, and the deny posture holds", async () => {
    const t = convexTest(schema, modules);
    const { api, getAuth } = makeApi();
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "A", slug: "a", featured: true });
      // `read` is undeclared for contributor, so the rows are filtered out.
      return api.find({ ctx, collection: "posts" });
    });
    expect(docs).toHaveLength(0);
    expect(getAuth).toHaveBeenCalledOnce();
  });

  test("emits no dev warning on a legitimate bypass (inject regression pin)", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const t = convexTest(schema, modules);
      const { api } = makeApi();
      await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
        api.find({ ctx, collection: "posts", access: { bypass: true } }),
      );
      const accessWarnings = warn.mock.calls.filter(
        (c) => typeof c[0] === "string" && c[0].includes("access.bypass"),
      );
      expect(accessWarnings).toHaveLength(0);
    } finally {
      warn.mockRestore();
    }
  });

  test("bypasses the mutation wrappers too", async () => {
    const t = convexTest(schema, modules);
    const { api, getAuth } = makeApi();
    const id = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
      // `create` is undeclared for contributor — only bypass can explain success.
      api.create({
        ctx,
        collection: "posts",
        data: { title: "C", slug: "c" },
        access: { bypass: true },
      }),
    );
    expect(id).toBeTypeOf("string");
    expect(getAuth).not.toHaveBeenCalled();
  });

  test("an enforced create still throws for an undeclared action", async () => {
    const t = convexTest(schema, modules);
    const { api } = makeApi();
    await expect(
      t.run(async (ctx: GenericMutationCtx<GenericDataModel>) =>
        api.create({ ctx, collection: "posts", data: { title: "D", slug: "d" } }),
      ),
    ).rejects.toThrow(VexAccessError);
  });
});

describe("vexServerApi — access.action", () => {
  test("forwards the action to the underlying check", async () => {
    const t = convexTest(schema, modules);
    const { api } = makeApi();
    const { custom, defaulted } = await t.run(
      async (ctx: GenericMutationCtx<GenericDataModel>) => {
        await ctx.db.insert("posts", { title: "A", slug: "a", featured: true });
        return {
          custom: await api.find({
            ctx,
            collection: "posts",
            access: { action: "listFeatured" },
          }),
          defaulted: await api.find({ ctx, collection: "posts" }),
        };
      },
    );
    // Granted only under `listFeatured` — rows under the custom action, none under
    // the default `read`, is the switch observed end to end through the wrapper.
    expect(custom).toHaveLength(1);
    expect(defaulted).toHaveLength(0);
  });

  test("bypass wins over action — no check runs at all", async () => {
    const t = convexTest(schema, modules);
    const { api, getAuth } = makeApi();
    const docs = await t.run(async (ctx: GenericMutationCtx<GenericDataModel>) => {
      await ctx.db.insert("posts", { title: "A", slug: "a", featured: true });
      // A nonsense action would DENY if it were consulted; bypass makes it moot.
      return api.find({
        ctx,
        collection: "posts",
        access: { bypass: true, action: "notARealAction" },
      });
    });
    expect(docs).toHaveLength(1);
    expect(getAuth).not.toHaveBeenCalled();
  });
});
```

Verify: `cd packages/core && pnpm vitest run src/api && npx tsc --noEmit -p tsconfig.json`

### Step 4 — Emit `CustomActionsBySlug` into the generated registry

`[dev]`

The registry is the only type-level path from a *collection slug* to that collection's
declared custom actions: server args only ever see the wide `VexConfig`, so no amount of
generics on `find` can recover them. Emission follows the `IndexFieldsBySlug` /
`AuthSlugs` pattern exactly — same augmentation block, same infer-with-fallback consumer.

- [ ] `packages/core/src/types/generateVexTypes.ts`
- [ ] `packages/core/src/types/generated.ts`
- [ ] `packages/core/src/types/generateVexTypes.test.ts`

#### packages/core/src/types/generateVexTypes.ts

Two edits. Everything not shown is unchanged.

**1 — build the block.** Beside the `authSlugs` construction (it reads the same
`config.access` source):

```ts
  // Custom actions declared in `defineAccess`, keyed by subject slug. Emitting them is
  // what makes `access.action` on the server API slug-aware: `QueryCallActionFor<S>`
  // reads this registry entry, so a custom verb autocompletes exactly on the
  // collections that declare it and is a type error everywhere else. Absent entries
  // and absent lists emit `never`, matching the runtime (an undeclared action denies).
  const customActionsBySlug = Object.entries(config.access?.customActions ?? {})
    .map(([slug, lists]) => {
      const query = (lists.query ?? []).map((a) => `"${a}"`).join(" | ") || "never";
      const mutation = (lists.mutation ?? []).map((a) => `"${a}"`).join(" | ") || "never";
      return `\t\t\t${slug}: { query: ${query}; mutation: ${mutation} }`;
    })
    .join("\n");
```

**2 — add it to the `declare module` block**, after `AuthSlugs`:

```ts
    \t\tCustomActionsBySlug: {\n${customActionsBySlug}\n}
```

#### packages/core/src/types/generated.ts

One edit — beside `IndexFieldsBySlug`, following its fallback shape verbatim:

```ts
/**
 * Custom query/mutation actions per subject slug, as declared in the project's
 * `defineAccess({ customActions })` and emitted by `vex generate`.
 *
 * - **Before `vex generate`:** resolves to `{}` — no slug has declared custom
 *   actions, and {@link QueryCallActionFor} falls back to accepting any string.
 * - **After `vex generate`:** e.g.
 *   `{ articles: { query: "listFeatured"; mutation: "publish" } }`. A missing
 *   list emits `never`, so single-list declarations stay exact.
 */
export type CustomActionsBySlug = GeneratedVexTypes extends {
  CustomActionsBySlug: infer C extends Record<string, { query: string; mutation: string }>;
}
  ? C
  : {};
```

#### packages/core/src/types/generateVexTypes.test.ts

Append to the existing suite - implemented and green, shown verbatim. The final
describe pins the index-less `{}` emission (the `site_settings: never` regression).

```ts
describe("generateVexTypes - CustomActionsBySlug", () => {
  const users = defineCollection({ slug: "users", fields: { name: text(), roles: text() } });
  const articles = defineCollection({
    slug: "articles",
    fields: { title: text({ required: true }) },
  });

  it("emits declared custom actions keyed by slug, under the EXACT consumer key", () => {
    const config = defineConfig({
      collections: [users, articles],
      access: defineAccess({
        roles: ["admin"] as const,
        resources: [users, articles],
        userCollectionSlug: "users",
        userRolesField: "roles",
        customActions: { articles: { query: ["listFeatured"], mutation: ["publish"] } },
        permissions: { admin: { articles: { read: true } } },
      }),
    });
    const output = generateVexTypes({ config });
    expect(output).toContain('articles: { query: "listFeatured"; mutation: "publish" }');
    // The consumer in `generated.ts` matches on this exact member name. A one-character
    // drift ("CustomActionsBySlugs") shipped once: the augmentation key never matched,
    // the registry silently resolved to {}, and every call fell back to the permissive
    // pre-generation union - custom verbs vanished from completions while the
    // mutation-shaped draft verbs appeared. Assert the name, not just the payload.
    expect(output).toContain("CustomActionsBySlug: {");
    expect(output).not.toContain("CustomActionsBySlugs");
  });

  it("emits never for an omitted list, keeping single-list declarations exact", () => {
    const config = defineConfig({
      collections: [users, articles],
      access: defineAccess({
        roles: ["admin"] as const,
        resources: [users, articles],
        userCollectionSlug: "users",
        userRolesField: "roles",
        customActions: { articles: { mutation: ["publish"] } },
        permissions: { admin: { articles: { read: true } } },
      }),
    });
    const output = generateVexTypes({ config });
    expect(output).toContain('articles: { query: never; mutation: "publish" }');
  });

  it("emits an empty block when access declares no custom actions", () => {
    const config = defineConfig({
      collections: [users],
      access: defineAccess({
        roles: ["admin"] as const,
        resources: [users],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: { admin: { users: { read: true } } },
      }),
    });
    const output = generateVexTypes({ config });
    // Empty body between the braces - `Object.entries({}).join("\n")` is "".
    expect(output).toContain("CustomActionsBySlug: {\n\n}");
  });

  it("emits an empty block when RBAC is not configured at all", () => {
    const config = defineConfig({ collections: [users] });
    const output = generateVexTypes({ config });
    expect(output).toContain("CustomActionsBySlug: {\n\n}");
  });
});

describe("generateVexTypes - index-less collections", () => {
  it("emits {} for a collection with no indexed fields, never `never`", () => {
    // Regression: this emitted `site_settings: never` once. `ExtractIndexFields`
    // then resolved to `never`, and `keyof never` is `string | number | symbol` -
    // which broke the whole SubjectMap against `SubjectEntry`'s `indexes: string`
    // and took down every consumer of the concrete access config in the app.
    // `{}` is the contract: `keyof {}` is `never`, so `IndexNameFor` still widens
    // correctly while the entry stays a valid object type to index into.
    const bare = defineCollection({ slug: "site_settings", fields: { name: text() } });
    const config = defineConfig({ collections: [bare] });
    const output = generateVexTypes({ config });
    expect(output).toContain("site_settings: {}");
    expect(output).not.toContain("site_settings: never");
  });
});
```

Verify: `cd packages/core && pnpm vitest run src/types/generateVexTypes.test.ts`

### Step 5 — Slug-aware `access.action` on every slug-taking function

`[dev]`

One lookup type, then every `access?:` declaration that sits beside a slug type
parameter swaps to it. Media stays wide — its subject is resolved at runtime from
`mediaId`, so no slug parameter exists to key the lookup.

- [ ] `packages/core/src/api/types.ts` — `QueryCallActionFor` / `MutationCallActionFor`; swap on `GenericQueryServerParams`
- [ ] `packages/core/src/api/create/server.ts` — swap on its own interface
- [ ] `packages/core/src/api/update/server.ts` — swap
- [ ] `packages/core/src/api/remove/server.ts` — swap
- [ ] `packages/core/src/api/globals/get.server.ts` — swap (`TSlug`-keyed)
- [ ] `packages/core/src/api/globals/upsert.server.ts` — swap (`TSlug`-keyed)
- [ ] `packages/core/src/api/server.ts` — delete `BoundServerArgs`'s redundant `access` member
- [ ] `packages/core/src/access/types.test.ts` — pre-generation permissiveness pin

#### packages/core/src/api/types.ts

Two edits. Everything not shown is unchanged.

**1 — the lookup types**, beside `QueryCallAction` / `MutationCallAction` (which stay,
for slug-less contexts like media):

```ts
/** Custom actions of one kind declared for slug `S` in the generated registry. @internal */
type CustomCallActionsFor<S extends string, K extends "query" | "mutation"> =
  S extends keyof CustomActionsBySlug
    ? CustomActionsBySlug[S] extends Record<K, infer A extends string>
      ? A
      : never
    : never;

/**
 * Actions a query-shaped call on collection `S` may check.
 *
 * Pre-generation the registry is `{}`, so this collapses to {@link QueryCallAction} —
 * arbitrary strings stay accepted, which is what lets core's own tests exercise custom
 * actions against an unaugmented registry. Post-generation the `(string & {})` arm is
 * REPLACED by the slug's declared union: a custom verb autocompletes exactly where it
 * is declared and is a compile error everywhere else.
 */
export type QueryCallActionFor<S extends string> = [keyof CustomActionsBySlug] extends [never]
  ? QueryCallAction
  : QueryAction | CustomCallActionsFor<S, "query">;

/** Mutation-shaped counterpart of {@link QueryCallActionFor}. */
export type MutationCallActionFor<S extends string> = [keyof CustomActionsBySlug] extends [never]
  ? MutationCallAction
  : CrudAction | Exclude<DraftAction, QueryAction> | CustomCallActionsFor<S, "mutation">;
```

**2 — the query base swaps** (covers `find`, `get`, `search`, and through
`BoundServerArgs`, the `vexServerApi` wrappers):

```ts
  /** Per-call access overrides. @see {@link AccessCallOptions} */
  access?: AccessCallOptions<QueryCallActionFor<TCollectionSlug>>;
```

#### packages/core/src/api/create/server.ts

On `CreateServerArgs` (likewise `update`/`remove` on theirs):

```ts
  /** Per-call access overrides. @see {@link AccessCallOptions} */
  access?: AccessCallOptions<MutationCallActionFor<TCollectionSlug>>;
```

#### packages/core/src/api/globals/get.server.ts

On `GetGlobalServerArgs`, which is generic over `TSlug extends GlobalSlug` (likewise
`upsert`, with `MutationCallActionFor<TSlug>`):

```ts
  /** Per-call access overrides. @see {@link AccessCallOptions} */
  access?: AccessCallOptions<QueryCallActionFor<TSlug>>;
```

`findGlobals` iterates every global, so it keeps the wide base type.

#### packages/core/src/api/server.ts

`BoundServerArgs` currently re-declares `access` beside the `Omit`:

```ts
export type BoundServerArgs<TArgs> = Omit<TArgs, "auth" | "config">;
```

Delete the `& { access?: AccessCallOptions }` member entirely. The `Omit` already keeps
the underlying function's `access` — now slug-typed — and the wide re-declaration would
intersect with it, polluting completions with the `(string & {})` arm this step removes.

#### packages/core/src/access/types.test.ts

```ts
describe("QueryCallActionFor — pre-generation fallback", () => {
  it("accepts arbitrary strings while the registry is unaugmented", () => {
    // Core's own suite runs without `vex generate`, so the registry is `{}` and the
    // fallback MUST stay permissive — otherwise every core test naming a custom
    // action would stop compiling. Post-generation exactness is only observable in
    // an augmented project (www), which is what the editor check below is for.
    const probe: QueryCallActionFor<"articles"> = "anyCustomVerb";
    expect(probe).toBe("anyCustomVerb");
  });
});
```

Verify: `cd packages/core && pnpm vitest run && npx tsc --noEmit -p tsconfig.json`, then
`cd apps/www && pnpm vex generate && pnpm typecheck` and confirm in the editor that
`find({ collection: "articles", access: { action: … } })` completes `listFeatured` and
rejects a verb declared on a different collection.

## www updates

Nothing in `apps/www` breaks. `skipAccess` has zero call sites, and every step is additive.

- `apps/www/src/auth/access.ts` — no change. It already declares `customActions`, and never
  set `defaultPermissionMode`; its matrix is explicit-deny throughout (`"*": false` at role
  level and on every subject), so the pinned posture changed no behaviour there.
- `apps/www/src/vexcms/api.ts` — no change required. First real adoption: public page reads
  can pass `access: { bypass: true }`. Note `footers`, `headers`, `siteSettings`, and `themes`
  are undeclared for the anon role, so they resolve to deny — no live gap today (no public
  page reads them yet), but the maprios migration will need either bypass or anon read rules.
- `apps/www/convex/vex.ts` — no change. `collectionsApi` gains nothing from this spec.

## Verification

```sh
cd packages/core && pnpm vitest run
npx tsc --noEmit -p packages/core/tsconfig.json
npx tsc --noEmit -p packages/react/tsconfig.json
pnpm --filter www typecheck
npx eslint packages/core/src/api packages/core/src/access
cd apps/www && pnpm vex generate
```

All green, and `pnpm vex generate` reports no access errors and no unexpected dev warnings.
