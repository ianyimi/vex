// @vitest-environment edge-runtime
import { describe, expect, it } from "vitest"

import { TABLE_SLUG_POSTS } from "~/db/constants"
import { createConvexTest } from "~/testing/createConvexTest"

// Warm-up: the first `t.mutation` into `convex/seed.ts` otherwise pays
// `vex.config.server`'s cold start (evaluating the whole site config) inside
// whichever case runs first — see `readOnlyAccess.test.ts`'s note on the
// same cost. Importing it here moves that cost to file collection, which has
// no per-test timeout.
import "./vex"
import { internal } from "./_generated/api"

const ANNOUNCEMENT_SLUG = "vexcms-0-1-0"

/**
 * `seed:reinit`'s D1 publish guard for the launch announcement
 * (`post:vexcms-0-1-0`): patch mode must never silently unpublish or reset
 * a post an admin already published, even though this file still hard-codes
 * `vex_status: "draft"` pre-D1. See `seed.ts`'s "D1 publish guard" comment
 * just above the announcement's insert/patch/skip block.
 */
describe("seed:reinit — announcement post D1 publish guard", () => {
  it("leaves a published row untouched (status and body) when the seed doc is still a draft", async () => {
    const t = createConvexTest()
    const publishedBody = [{ type: "p", children: [{ text: "The real launch post, written by the admin." }] }]
    const postId = await t.run((ctx) =>
      ctx.db.insert(TABLE_SLUG_POSTS, {
        title: "VexCMS 0.1.0 is here",
        slug: ANNOUNCEMENT_SLUG,
        excerpt: "The real excerpt the admin wrote.",
        vex_status: "published",
        body: publishedBody,
      }),
    )

    const report = await t.mutation(internal.seed.reinit, {})

    expect(report.skipped).toContain(`post:${ANNOUNCEMENT_SLUG} (published in admin; seed is draft)`)
    expect(report.patched).not.toContain(`post:${ANNOUNCEMENT_SLUG}`)
    const doc = await t.run((ctx) => ctx.db.get(postId))
    expect(doc?.vex_status).toBe("published")
    expect(doc?.title).toBe("VexCMS 0.1.0 is here")
    expect(doc?.excerpt).toBe("The real excerpt the admin wrote.")
    expect(doc?.body).toEqual(publishedBody)
  })

  it("inserts the announcement as a draft when no row exists yet", async () => {
    const t = createConvexTest()

    const report = await t.mutation(internal.seed.reinit, {})

    expect(report.created).toContain(`post:${ANNOUNCEMENT_SLUG}`)
    const doc = await t.run((ctx) =>
      ctx.db
        .query(TABLE_SLUG_POSTS)
        .withIndex("by_slug", (q) => q.eq("slug", ANNOUNCEMENT_SLUG))
        .first(),
    )
    expect(doc?.vex_status).toBe("draft")
    expect(doc?.title).toBe("VexCMS 0.1.0")
  })

  it("patches a draft-only row in place with the current seeded copy", async () => {
    const t = createConvexTest()
    const postId = await t.run((ctx) =>
      ctx.db.insert(TABLE_SLUG_POSTS, {
        title: "Stale draft title",
        slug: ANNOUNCEMENT_SLUG,
        excerpt: "Stale excerpt.",
        vex_status: "draft",
        body: [{ type: "p", children: [{ text: "Stale body." }] }],
      }),
    )

    const report = await t.mutation(internal.seed.reinit, {})

    expect(report.patched).toContain(`post:${ANNOUNCEMENT_SLUG}`)
    const doc = await t.run((ctx) => ctx.db.get(postId))
    expect(doc?.vex_status).toBe("draft")
    expect(doc?.title).toBe("VexCMS 0.1.0")
    expect(JSON.stringify(doc?.body)).toContain("PLACEHOLDER")
  })
})
