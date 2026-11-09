// @vitest-environment edge-runtime
import { describe, expect, it } from "vitest"

// Warm-up: the first `t.mutation`/`t.query` into `convex/vex.ts` otherwise
// pays the module's cold start (evaluating `vex.config.server` and
// everything it pulls in) inside whichever case runs first. Alone that's
// ~1 s; under `pnpm test`'s parallel turbo run it can time out the case that
// pays it (see `readOnlyAccess.test.ts`). Importing it here moves that cost
// to file collection, which has no per-test timeout.
import "./vex"

import { api } from "@convex/_generated/api"

import { createConvexTest } from "~/testing/createConvexTest"

describe("images.getById", () => {
  it("returns the document for a valid images id", async () => {
    const t = createConvexTest()
    const id = await t.run((ctx) =>
      ctx.db.insert("images", {
        alt: "A photo",
        filename: "photo.jpg",
        mimeType: "image/jpeg",
        size: 1024,
        src: "https://example.convex.cloud/photo.jpg",
        storageId: "storage-id-1",
      }),
    )

    const doc = await t.query(api.images.getById, { id: String(id) })

    expect(doc?.alt).toBe("A photo")
  })

  it("returns null for a malformed id string", async () => {
    const t = createConvexTest()

    const doc = await t.query(api.images.getById, { id: "not-a-real-id" })

    expect(doc).toBeNull()
  })

  it("returns null for a well-formed id from a different table", async () => {
    const t = createConvexTest()
    const jwksId = await t.run((ctx) =>
      ctx.db.insert("jwks", {
        createdAt: Date.now(),
        privateKey: "private",
        publicKey: "public",
      }),
    )

    const doc = await t.query(api.images.getById, { id: String(jwksId) })

    expect(doc).toBeNull()
  })
})
