# Design: per-collection generated Convex API + model functions

**Status:** proposed — deferred. Revisit after the client-side return-type fix.
**Date:** 2026-08-18
**Goal:** replace the single generic `api.vex.get` (whose best possible return type is an
N-collection union) with one narrowly-typed endpoint per collection, so
`api.vex.organization.get` returns `OrganizationDocument | null` directly. Plus generated
**model functions** — plain importable helpers, usable inside the project's own Convex functions,
that narrow the return type from the collection slug passed in.

## Why the current single-endpoint design cannot narrow

`collectionsApi` registers **one** `get` query for all collections
(`packages/core/src/api/server.ts:167-186`). A Convex `FunctionReference`'s return type is fixed at
registration; `collection` crosses the network boundary as a runtime **value**, and values cannot
flow into types. No fix to that handler can make `api.vex.get` narrow per call — the ceiling is a
union the caller narrows by hand.

Measured today (probe, `apps/www`): `FunctionReturnType<typeof api.vex.get>` = `VexDocument | null`
— not even the union, for the reason in the depth-trap section below.

## Mechanism — confirmed to work

`apps/www/convex/_generated/api.d.ts:31-45`:

```ts
declare const fullApi: ApiFromModules<{
  vex: typeof vex;                    // ← types flow from the source module
  "vex/globals": typeof vex_globals;
  "vex/media": typeof vex_media;
  …
}>;
```

Endpoint types derive from `typeof <module>` — i.e. **whatever return type each registered handler
resolves to**. A per-collection module whose handler is bound to a literal slug therefore bakes that
collection's document type into the generated api. Same mechanism that bakes `VexDocument | null`
today; we just feed it better input.

**Precedent already in-repo:** `convex/vex/globals.ts` → `api.vex.globals.*`,
`convex/vex/media.ts` → `api.vex.media.*`. Also proves `convex/vex.ts` and the `convex/vex/`
directory coexist.

**Evidence in-process narrowing already works** (probe, `apps/www`):

| Call | Resolves to |
| --- | --- |
| `getServer({ ctx, collection: "organization", id })` | `OrganizationDocument \| null` |
| same + `depth: someNumber` (non-literal) | `VexDocument \| null` |

Row 1 is the entire basis for model functions — no new type machinery required.

## ⚠️ The depth trap — most important detail

Row 2 above is exactly why `api.vex.get` is `VexDocument` today. The handler forwards
`depth: args.depth` (`v.optional(v.number())` → `number | undefined`), so `D` infers as `number` and
`DepthPopulated` (`packages/core/src/api/types.ts:391-392`) hits its non-literal guard:

```ts
= number extends D ? VexDocument : …   // D = number → true → VexDocument
```

**A generated endpoint that accepts a runtime `depth` and forwards it regresses to `VexDocument` and
defeats the whole feature.** Mitigations, preferred first:

1. **Explicitly annotate the handler's return type** — codegen bakes the annotation regardless of
   internal inference. Keeps `depth` usable; depth-populated relationships become a runtime superset
   typed as the base document.
2. Omit `depth` from generated endpoints; expose `populate` only (compile-time literal).
3. Depth-specific variants (`get`, `getDeep2`, …). Rejected — endpoint explosion.

Ship with a regression test asserting `FunctionReturnType<typeof api.vex.organization.get>` is **not**
`VexDocument`.

## Layout

```
convex/vex/
  _context.ts              # shared: config + getAuth, hand-written once (or generated once)
  organization.ts          # → api.vex.organization.{get,find,search,create,update,remove}
  pages.ts                 # → api.vex.pages.*
  …one per collection
  models/
    organization.ts        # slug-bound model helpers (not registered)
    pages.ts
    index.ts               # barrel: { organization, pages, … } + generic slug-taking helpers
```

**Collision caveat:** a collection slugged `globals`, `media`, `models`, or `index` clashes with
existing/reserved modules under `convex/vex/`. Either reserve those slugs (fail loudly in
`sanitizeConfig` at generate time) or nest under `convex/vex/collections/<slug>.ts` →
`api.vex.collections.organization.get`. Flat layout matches the stated preference, so reserved-slug
validation is the likely answer.

---

## Example 1 — shared context module

Generated modules need the same `config` + `getAuth` that `convex/vex.ts` passes today. Factor it
once so generated files stay thin (mirrors the existing `convex/vexContext.ts` pattern):

```ts
// convex/vex/_context.ts  (generated once; safe to hand-edit if we mark it non-clobbering)
import { createGetAuth } from "@vexcms/better-auth";

import { TABLE_SLUG_ORGANIZATIONS, TABLE_SLUG_SESSIONS, TABLE_SLUG_USERS } from "~/db/constants";
import config from "~/vex.config";

export { config };

export const getAuth = createGetAuth({
  orgCollectionSlug: TABLE_SLUG_ORGANIZATIONS,
  userCollectionSlug: TABLE_SLUG_USERS,
  sessionCollectionSlug: TABLE_SLUG_SESSIONS,
  resolveOrgs: true,
});
```

## Example 2 — generated collection API file (full)

```ts
// ⚠️ AUTO-GENERATED BY VEX CMS — DO NOT EDIT ⚠️
// Run 'vex dev' or 'vex generate' to update this file.
// convex/vex/organization.ts  →  api.vex.organization.*

import {
  create as createServer,
  find as findServer,
  get as getServer,
  remove as removeServer,
  resolveGetAuth,
  search as searchServer,
  update as updateServer,
} from "@vexcms/core/server";
import type { PaginationResult } from "@vexcms/core";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import type { Id } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";
import type { OrganizationDocument } from "../../src/vex.types";
import { config, getAuth } from "./_context";

/** The slug this module is bound to. Not an argument — it is the endpoint's identity. */
const COLLECTION = "organization" as const;

export const get = query({
  args: {
    id: v.string(),
    populate: v.optional(v.any()),
    depth: v.optional(v.number()),
  },
  // Explicit annotation — see "depth trap". This is what codegen bakes into api.d.ts.
  handler: async (ctx, args): Promise<OrganizationDocument | null> => {
    const auth = await resolveGetAuth({ ctx, config, getAuth });
    return await getServer({
      ctx,
      auth,
      config,
      collection: COLLECTION,
      id: args.id as Id<typeof COLLECTION>,
      populate: args.populate,
      depth: args.depth,
    });
  },
});

export const find = query({
  args: {
    populate: v.optional(v.any()),
    depth: v.optional(v.number()),
    limit: v.optional(v.number()),
    paginationOpts: v.optional(
      paginationOptsValidator.extend({ totalDocs: v.optional(v.boolean()) }),
    ),
  },
  handler: async (
    ctx,
    args,
  ): Promise<OrganizationDocument[] | PaginationResult<OrganizationDocument>> => {
    const auth = await resolveGetAuth({ ctx, config, getAuth });
    return await findServer({
      ctx,
      auth,
      config,
      collection: COLLECTION,
      populate: args.populate,
      depth: args.depth,
      limit: args.limit,
      paginationOpts: args.paginationOpts as never,
    });
  },
});

export const search = query({
  args: {
    searchIndexName: v.string(),
    searchField: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
    populate: v.optional(v.any()),
    depth: v.optional(v.number()),
    paginationOpts: v.optional(
      paginationOptsValidator.extend({ totalDocs: v.optional(v.boolean()) }),
    ),
  },
  handler: async (
    ctx,
    args,
  ): Promise<OrganizationDocument[] | PaginationResult<OrganizationDocument>> => {
    const auth = await resolveGetAuth({ ctx, config, getAuth });
    return await searchServer({ ctx, auth, config, collection: COLLECTION, ...args } as never);
  },
});

export const create = mutation({
  args: { data: v.any() },
  returns: v.string(),
  handler: async (ctx, args): Promise<Id<typeof COLLECTION>> => {
    const auth = await resolveGetAuth({ ctx, config, getAuth });
    return await createServer({ ctx, auth, config, collection: COLLECTION, data: args.data });
  },
});

export const update = mutation({
  args: { id: v.string(), data: v.any() },
  handler: async (ctx, args): Promise<void> => {
    const auth = await resolveGetAuth({ ctx, config, getAuth });
    return await updateServer({
      ctx,
      auth,
      config,
      collection: COLLECTION,
      id: args.id as Id<typeof COLLECTION>,
      data: args.data,
    });
  },
});

export const remove = mutation({
  args: { ids: v.array(v.string()), softDelete: v.optional(v.string()) },
  handler: async (ctx, args): Promise<void> => {
    const auth = await resolveGetAuth({ ctx, config, getAuth });
    return await removeServer({
      ctx,
      auth,
      config,
      collection: COLLECTION,
      ids: args.ids as Id<typeof COLLECTION>[],
      softDelete: args.softDelete,
    });
  },
});
```

**Note:** `collection` is gone from every args object — it's implied by the endpoint. That removes
the runtime slug-validation branch *and* is what makes the return type narrow.

### Consumer result

```ts
const { data: org } = useQuery(convexQuery(api.vex.organization.get, { id: activeOrgID }));
//    ^? OrganizationDocument | null      ← no cast, no union, no VexDocument

const { data: pages } = useQuery(convexQuery(api.vex.pages.find, {}));
//    ^? Page[] | PaginationResult<Page>
```

---

## Example 3 — generated model functions, slug-bound

Not registered as Convex functions — plain async helpers importable anywhere server-side. They close
over `config`/`getAuth` so callers don't re-plumb them.

```ts
// ⚠️ AUTO-GENERATED BY VEX CMS — DO NOT EDIT ⚠️
// convex/vex/models/organization.ts

import { get as getServer, find as findServer, resolveGetAuth } from "@vexcms/core/server";
import type { GenericQueryCtx } from "convex/server";

import type { DataModel, Id } from "../../_generated/dataModel";
import type { OrganizationDocument } from "../../../src/vex.types";
import { config, getAuth } from "../_context";

export async function get(
  ctx: GenericQueryCtx<DataModel>,
  args: { id: Id<"organization">; populate?: Record<string, unknown> },
): Promise<OrganizationDocument | null> {
  const auth = await resolveGetAuth({ ctx, config, getAuth });
  return await getServer({ ctx, auth, config, collection: "organization", ...args } as never);
}

export async function find(
  ctx: GenericQueryCtx<DataModel>,
  args?: { limit?: number },
): Promise<OrganizationDocument[]> {
  const auth = await resolveGetAuth({ ctx, config, getAuth });
  return await findServer({ ctx, auth, config, collection: "organization", ...args });
}
```

## Example 4 — generated generic models: pass the slug, get the narrowed type

This is the shape that mirrors the client-side functions — takes `{ collection, id }` and narrows the
return from the slug literal. It works because in-process generic calls narrow (evidence table
above), and it reuses the **same exported return types** as the client wrappers (`GetReturn`,
`FindReturn` from `packages/core/src/api/types.ts`) — one definition, three consumers
(server fn, client wrapper, generated model).

```ts
// ⚠️ AUTO-GENERATED BY VEX CMS — DO NOT EDIT ⚠️
// convex/vex/models/index.ts

import {
  find as findServer,
  get as getServer,
  resolveGetAuth,
} from "@vexcms/core/server";
import type { CollectionSlug, FindReturn, GetReturn, PopulateShape } from "@vexcms/core";
import type { GenericQueryCtx } from "convex/server";

import type { DataModel, Id } from "../../_generated/dataModel";
import { config, getAuth } from "../_context";

// Slug-bound namespaces
export * as organization from "./organization";
export * as pages from "./pages";
// …one per collection

/**
 * Generic get — same call shape as the client wrapper, narrowed by the slug passed in.
 */
export async function get<
  TSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TSlug> = Record<string, never>,
>(
  ctx: GenericQueryCtx<DataModel>,
  args: { collection: TSlug; id: Id<TSlug>; populate?: TPopulate },
): Promise<GetReturn<TSlug, TPopulate, 0>> {
  const auth = await resolveGetAuth({ ctx, config, getAuth });
  return await getServer({ ctx, auth, config, ...args } as never);
}

export async function find<
  TSlug extends CollectionSlug,
  const TPopulate extends PopulateShape<TSlug> = Record<string, never>,
>(
  ctx: GenericQueryCtx<DataModel>,
  args: { collection: TSlug; populate?: TPopulate; limit?: number },
): Promise<FindReturn<TSlug, TPopulate, 0>> {
  const auth = await resolveGetAuth({ ctx, config, getAuth });
  return await findServer({ ctx, auth, config, ...args } as never);
}
```

## Example 5 — using models in the project's own Convex functions

```ts
// convex/dashboard.ts — hand-written, never generated
import { query } from "./_generated/server";
import * as models from "./vex/models";
import { v } from "convex/values";

export const orgSummary = query({
  args: { orgId: v.string(), pageId: v.string() },
  handler: async (ctx, args) => {
    // (a) slug-bound namespace
    const org = await models.organization.get(ctx, { id: args.orgId as Id<"organization"> });
    //    ^? OrganizationDocument | null

    // (b) generic — narrowed by the literal slug passed in, exactly like the client fn
    const page = await models.get(ctx, { collection: "pages", id: args.pageId as Id<"pages"> });
    //    ^? Page | null

    // (c) wrong slug/id pairing is a compile error — Id<"pages"> ≠ Id<"organization">
    // const bad = await models.get(ctx, { collection: "pages", id: args.orgId as Id<"organization"> });

    return { orgName: org?.name, pageTitle: page?.title };
  },
});
```

Because models are barrel-exported, users can write their **own** endpoint modules on top of them
without touching generated collection API files — the stated requirement.

---

## Implementation surface

| Item | Where |
| --- | --- |
| Generator (currently a **stub returning `{}`**) | `packages/core/src/schema/generateCollectionQueries.ts:15-20` |
| Stale-file cleanup marker — already exists | same file, `GENERATED_HEADER` |
| Import-path plumbing — already typed | `CollectionQueryImports` |
| CLI wiring (write files on `vex dev` / `vex generate`) | `packages/cli` |
| Reserved-slug validation | `packages/core/src/config/sanitizeConfig.ts` |
| Auth resolution reuse — already exported | `resolveGetAuth` (`api/server.ts:401`) |
| Shared return types — **land with the client-side fix**, reused here | `packages/core/src/api/types.ts` |

## Compatibility

- **Additive.** Keep `collectionsApi` and `api.vex.*`. `@vexcms/react` drives list/edit views from a
  *runtime* slug, so it **cannot** use per-collection endpoints and must keep the generic ones.
- Deployed function count grows ~6× collections — check against Convex function-count limits.
- Once generated endpoints exist, the `@vexcms/core/client` wrappers could be repointed at them per
  slug, retiring their funcRef casts. The casts are a deliberate stopgap for the monomorphic
  endpoint; this document is the honest long-term fix.

## Open questions

1. Flat `api.vex.<slug>.*` + reserved-slug validation, or nested `api.vex.collections.<slug>.*`?
2. Do generated mutations narrow `data` per collection? Needs generated **input** types
   (create-shape ≠ doc-shape: no `_id`/`_creationTime`, different required/optional). Follow-up —
   also what would let `create`/`update` correlate `data` with the slug.
3. Globals: same treatment (`api.vex.globals.<slug>.get`)?
4. Keep `populate` on generated endpoints given the return type is annotated? (The annotation
   understates populated relationships.)
5. Is `convex/vex/_context.ts` generated-once-then-yours, or fully generated each run? Underscore
   prefix keeps it out of the Convex api namespace either way.
