// @vitest-environment edge-runtime
import { describe, expect, it } from "vitest";

// Warm-up: see `images.test.ts`'s own comment — moves `convex/vex.ts`'s cold
// start to file collection instead of inside the first case that pays it.
import "./vex";

import { api } from "@convex/_generated/api";

import { TABLE_SLUG_PAGES, TABLE_SLUG_POSTS, USER_ROLES } from "~/db/constants";
import { createConvexTest, insertTestUser } from "~/testing/createConvexTest";

/**
 * Regression coverage for the live-preview sign-out bug: `getBySlugPreview`
 * used to pass `access: { action: DRAFT_ACTIONS.readDrafts }` alongside
 * `drafts: true`, which forced `find`'s own published-fallback branch to run
 * under the `readDrafts` action too — an action nothing but `admin` is
 * granted — so a caller WITHOUT `readDrafts` (anonymous included) got `[]`
 * instead of the published row `getBySlug` would have returned. These tests
 * pin the fixed contract: no `access` override, so a caller without
 * `readDrafts` silently falls back to the published row, and a caller WITH
 * it still gets the draft.
 */
describe("pages.getBySlugPreview", () => {
  it("returns the published row, never the draft, for an anonymous caller", async () => {
    const t = createConvexTest();
    await t.run((ctx) =>
      ctx.db.insert(TABLE_SLUG_PAGES, {
        title: "About (published)",
        slug: "about",
        vex_status: "published",
      }),
    );
    await t.run((ctx) =>
      ctx.db.insert(TABLE_SLUG_PAGES, {
        title: "About (draft)",
        slug: "about",
        vex_status: "draft",
      }),
    );

    const result = await t.query(api.pages.getBySlugPreview, { slug: "about" });

    expect(result).toHaveLength(1);
    expect(result[0]?.vex_status).toBe("published");
    expect(result[0]?.title).toBe("About (published)");
  });

  it("returns [] for an anonymous caller when only a never-published draft exists", async () => {
    const t = createConvexTest();
    await t.run((ctx) =>
      ctx.db.insert(TABLE_SLUG_PAGES, {
        title: "Unreleased",
        slug: "unreleased",
        vex_status: "draft",
      }),
    );

    const result = await t.query(api.pages.getBySlugPreview, { slug: "unreleased" });

    expect(result).toEqual([]);
  });

  it("returns the draft row for a caller with `readDrafts` (admin)", async () => {
    const t = createConvexTest();
    const { identity } = await insertTestUser({ t, roles: [USER_ROLES.admin] });
    await t.run((ctx) =>
      ctx.db.insert(TABLE_SLUG_PAGES, {
        title: "About (published)",
        slug: "about",
        vex_status: "published",
      }),
    );
    await t.run((ctx) =>
      ctx.db.insert(TABLE_SLUG_PAGES, {
        title: "About (draft)",
        slug: "about",
        vex_status: "draft",
      }),
    );

    const result = await t.withIdentity(identity).query(api.pages.getBySlugPreview, { slug: "about" });

    expect(result).toHaveLength(1);
    expect(result[0]?.vex_status).toBe("draft");
    expect(result[0]?.title).toBe("About (draft)");
  });
});

describe("posts.getBySlugPreview", () => {
  it("returns the published row, never the draft, for an anonymous caller", async () => {
    const t = createConvexTest();
    await t.run((ctx) =>
      ctx.db.insert(TABLE_SLUG_POSTS, {
        title: "Launch (published)",
        slug: "launch",
        vex_status: "published",
      }),
    );
    await t.run((ctx) =>
      ctx.db.insert(TABLE_SLUG_POSTS, {
        title: "Launch (draft)",
        slug: "launch",
        vex_status: "draft",
      }),
    );

    const result = await t.query(api.posts.getBySlugPreview, { slug: "launch" });

    expect(result).toHaveLength(1);
    expect(result[0]?.vex_status).toBe("published");
    expect(result[0]?.title).toBe("Launch (published)");
  });

  it("returns the draft row for a caller with `readDrafts` (admin)", async () => {
    const t = createConvexTest();
    const { identity } = await insertTestUser({ t, roles: [USER_ROLES.admin] });
    await t.run((ctx) =>
      ctx.db.insert(TABLE_SLUG_POSTS, {
        title: "Launch (published)",
        slug: "launch",
        vex_status: "published",
      }),
    );
    await t.run((ctx) =>
      ctx.db.insert(TABLE_SLUG_POSTS, {
        title: "Launch (draft)",
        slug: "launch",
        vex_status: "draft",
      }),
    );

    const result = await t.withIdentity(identity).query(api.posts.getBySlugPreview, { slug: "launch" });

    expect(result).toHaveLength(1);
    expect(result[0]?.vex_status).toBe("draft");
    expect(result[0]?.title).toBe("Launch (draft)");
  });
});
