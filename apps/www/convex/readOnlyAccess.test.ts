// @vitest-environment edge-runtime
import type { TestConvex } from "convex-test"
import type { FunctionReference, RegisteredMutation } from "convex/server"

import { makeFunctionReference } from "convex/server"
import { describe, expect, it } from "vitest"

import {
  GLOBAL_SLUG_SITE_SETTINGS,
  TABLE_SLUG_IMAGES,
  TABLE_SLUG_PAGES,
  TABLE_SLUG_USERS,
  USER_ROLES,
} from "~/db/constants"
import { createConvexTest, insertTestUser } from "~/testing/createConvexTest"

import type { Id } from "./_generated/dataModel"
import type schema from "./schema"
import type * as vexVersions from "./vex/versions"

// Warm-up: the first `t.mutation` into `convex/vex.ts` otherwise pays the
// module's cold start (evaluating `vex.config.server` and everything it pulls
// in) inside whichever case runs first. Alone that's ~1 s; under `pnpm test`'s
// parallel turbo run it measured 17 s (2026-11-08) and timed out `vex:create`.
// Importing it here moves that cost to file collection, which has no
// per-test timeout, and fills the module cache convex-test's glob map reuses.
import "./vex"

import { api } from "./_generated/api"

/**
 * `convex/vex/versions.ts`'s five sibling modules under `vex/` (itself plus
 * `firstUser`/`globals`/`media`/`versions`) push `ApiFromModules`'s
 * `UnionToIntersection` merge past a depth TypeScript gives up on: `api.vex`
 * resolves fine, but `api.vex.versions` is silently absent from its type
 * (verified: `api["vex/versions"]` is absent too — the whole module drops
 * out of the merge, not just the nested path). These four references build
 * the same runtime path (`makeFunctionReference`, `convex/server`'s
 * documented escape hatch for untyped/mistyped `api` entries) with the real
 * arg/return types read off the actual exported mutations, so this file
 * doesn't lose type-checking on `t.mutation(fn, args(seeded))`.
 */
type MutationArgs<F> = F extends RegisteredMutation<infer _Visibility, infer Args, infer _Returns> ? Args : never
type MutationReturn<F> = F extends RegisteredMutation<infer _Visibility, infer _Args, infer Returns> ? Returns : never
const versionsSaveDraft: FunctionReference<
  "mutation",
  "public",
  MutationArgs<typeof vexVersions.saveDraft>,
  MutationReturn<typeof vexVersions.saveDraft>
> = makeFunctionReference("vex/versions:saveDraft")
const versionsPublish: FunctionReference<
  "mutation",
  "public",
  MutationArgs<typeof vexVersions.publish>,
  MutationReturn<typeof vexVersions.publish>
> = makeFunctionReference("vex/versions:publish")
const versionsUnpublish: FunctionReference<
  "mutation",
  "public",
  MutationArgs<typeof vexVersions.unpublish>,
  MutationReturn<typeof vexVersions.unpublish>
> = makeFunctionReference("vex/versions:unpublish")
const versionsDeleteVersion: FunctionReference<
  "mutation",
  "public",
  MutationArgs<typeof vexVersions.deleteVersion>,
  MutationReturn<typeof vexVersions.deleteVersion>
> = makeFunctionReference("vex/versions:deleteVersion")

/** The `createConvexTest()` instance shape, named so `seed`/`snapshot` don't couple to `ReturnType<typeof createConvexTest>`. */
type ConvexTestInstance = TestConvex<typeof schema>

/** The ids `seed` inserts, consumed by `MUTATIONS[].args` and the `promoteFirstAdmin` tests. */
interface SeededData {
  adminUserId: Id<"user">
  globalId: Id<"vex_globals">
  imageId: Id<"images">
  pageId: Id<"pages">
}

/**
 * Seeds one row per collection this suite touches, plus an admin user so
 * `promoteFirstAdmin` observes `hasAdmin: true` (the no-op branch) for every
 * caller below. Returns the seeded ids and a snapshot of every affected
 * table so each test can assert nothing moved.
 */
async function seed(t: ConvexTestInstance): Promise<SeededData> {
  const { userId: adminUserId } = await insertTestUser({
    t,
    roles: [USER_ROLES.admin],
    email: "admin@test.local",
  })

  const { pageId, imageId, globalId } = await t.run(async (ctx) => {
    const pageId = await ctx.db.insert(TABLE_SLUG_PAGES, {
      title: "Home",
      slug: "home",
      vex_status: "published",
    })
    const imageId = await ctx.db.insert(TABLE_SLUG_IMAGES, {
      filename: "logo.png",
      alt: "Logo",
      mimeType: "image/png",
      size: 1024,
      storageId: "storage_readonly_1",
      src: "https://example.com/logo.png",
    })
    const globalId = await ctx.db.insert("vex_globals", {
      slug: GLOBAL_SLUG_SITE_SETTINGS,
      data: { name: "Read-Only Suite" },
    })
    return { pageId, imageId, globalId }
  })

  return { adminUserId, pageId, imageId, globalId }
}

async function snapshot(t: ConvexTestInstance) {
  return t.run(async (ctx) => ({
    users: await ctx.db.query(TABLE_SLUG_USERS).collect(),
    pages: await ctx.db.query(TABLE_SLUG_PAGES).collect(),
    images: await ctx.db.query(TABLE_SLUG_IMAGES).collect(),
    globals: await ctx.db.query("vex_globals").collect(),
    views: await ctx.db.query("vex_views").collect(),
    versions: await ctx.db.query("vex_versions").collect(),
  }))
}

/**
 * One row per public mutation: the reference name for the test title, the
 * `api.*` function reference, and a factory for plausible args. `args` is a
 * function of the seeded ids so each row can reference `pageId`/`imageId`/
 * `globalId` without a module-level fixture.
 */
const MUTATIONS = [
  {
    name: "vex:create",
    fn: api.vex.create,
    args: () => ({
      collection: TABLE_SLUG_PAGES,
      data: { title: "Hijacked", slug: "hijacked" },
    }),
  },
  {
    name: "vex:update",
    fn: api.vex.update,
    args: (s: SeededData) => ({
      collection: TABLE_SLUG_PAGES,
      id: s.pageId,
      data: { title: "Hijacked" },
    }),
  },
  {
    name: "vex:remove",
    fn: api.vex.remove,
    args: (s: SeededData) => ({
      collection: TABLE_SLUG_PAGES,
      ids: [s.pageId],
    }),
  },
  {
    name: "vex:saveView",
    fn: api.vex.saveView,
    args: () => ({
      collection: TABLE_SLUG_PAGES,
      view: { viewId: "hijacked-view", name: "Hijacked", state: {} },
    }),
  },
  {
    name: "vex:removeView",
    fn: api.vex.removeView,
    args: () => ({
      collection: TABLE_SLUG_PAGES,
      viewId: "nonexistent-view",
    }),
  },
  {
    name: "vex/globals:upsert",
    fn: api.vex.globals.upsert,
    args: () => ({
      slug: GLOBAL_SLUG_SITE_SETTINGS,
      data: { name: "Hijacked" },
    }),
  },
  {
    name: "vex/media:generateUploadUrl",
    fn: api.vex.media.generateUploadUrl,
    args: () => ({ adapter: "convex", collection: TABLE_SLUG_IMAGES }),
  },
  {
    name: "vex/media:createMediaDocument",
    fn: api.vex.media.createMediaDocument,
    args: () => ({
      adapter: "convex",
      collectionSlug: TABLE_SLUG_IMAGES,
      filename: "hijacked.png",
      mimeType: "image/png",
      size: 2048,
      storageId: "storage_hijacked_1",
    }),
  },
  {
    name: "vex/media:deleteMedia",
    fn: api.vex.media.deleteMedia,
    args: (s: SeededData) => ({
      adapter: "convex",
      mediaId: s.imageId,
    }),
  },
  {
    name: "vex/versions:saveDraft",
    fn: versionsSaveDraft,
    args: (s: SeededData) => ({
      collection: TABLE_SLUG_PAGES,
      id: s.pageId,
      data: { title: "Hijacked draft" },
    }),
  },
  {
    name: "vex/versions:publish",
    fn: versionsPublish,
    args: (s: SeededData) => ({
      collection: TABLE_SLUG_PAGES,
      id: s.pageId,
    }),
  },
  {
    name: "vex/versions:unpublish",
    fn: versionsUnpublish,
    args: (s: SeededData) => ({
      collection: TABLE_SLUG_PAGES,
      id: s.pageId,
    }),
  },
  {
    name: "vex/versions:deleteVersion",
    fn: versionsDeleteVersion,
    args: (s: SeededData) => ({
      collection: TABLE_SLUG_PAGES,
      id: s.pageId,
      version: 1,
    }),
  },
]

describe("public mutations reject a caller with no identity", () => {
  it.each(MUTATIONS)("$name rejects an unauthenticated caller and leaves the database unchanged", async ({ fn, args }) => {
    const t = createConvexTest()
    const seeded = await seed(t)
    const before = await snapshot(t)

    await expect(t.mutation(fn, args(seeded))).rejects.toThrow()

    expect(await snapshot(t)).toEqual(before)
  })

  it("promoteFirstAdmin rejects an unauthenticated caller and leaves the database unchanged", async () => {
    const t = createConvexTest()
    await seed(t)
    const before = await snapshot(t)

    await expect(t.mutation(api.vex.firstUser.promoteFirstAdmin, {})).rejects.toThrow()

    expect(await snapshot(t)).toEqual(before)
  })
})

describe("public mutations reject a plain `user`-role caller", () => {
  it.each(MUTATIONS)("$name rejects a user-role caller and leaves the database unchanged", async ({ fn, args }) => {
    const t = createConvexTest()
    const seeded = await seed(t)
    const { identity } = await insertTestUser({ t, roles: [USER_ROLES.user] })
    const before = await snapshot(t)

    await expect(t.withIdentity(identity).mutation(fn, args(seeded))).rejects.toThrow()

    expect(await snapshot(t)).toEqual(before)
  })

  it("promoteFirstAdmin no-ops for a user-role caller when an admin already exists, and leaves the database unchanged", async () => {
    const t = createConvexTest()
    await seed(t)
    const { identity } = await insertTestUser({ t, roles: [USER_ROLES.user] })
    const before = await snapshot(t)

    await expect(
      t.withIdentity(identity).mutation(api.vex.firstUser.promoteFirstAdmin, {}),
    ).resolves.toEqual({ promoted: false })

    expect(await snapshot(t)).toEqual(before)
  })
})
