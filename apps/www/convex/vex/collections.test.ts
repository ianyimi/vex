// @ts-nocheck — Doc union type from multi-table schema causes false positives on property access
import { convexTest } from "convex-test"
import { describe, expect, test } from "vitest"

import { api } from "../_generated/api"
import schema from "../schema"

const modules = import.meta.glob("/convex/**/*.ts")

// ── list ──────────────────────────────────────────────────────────────────────

describe("vex.collections.list", () => {
  test("returns empty array for an empty collection", async () => {
    const t = convexTest(schema, modules)
    const docs = await t.query(api.vex.collections.list, {
      collection: "pages",
    })
    expect(docs).toEqual([])
  })

  test("returns all documents in insertion order", async () => {
    const t = convexTest(schema, modules)
    await t.run(async (ctx) => {
      await ctx.db.insert("pages", { title: "First", slug: "first" })
      await ctx.db.insert("pages", { title: "Second", slug: "second" })
    })
    const docs = await t.query(api.vex.collections.list, {
      collection: "pages",
    })
    expect(docs).toHaveLength(2)
    expect(docs[0].title).toBe("First")
    expect(docs[1].title).toBe("Second")
  })

  test("respects the limit argument", async () => {
    const t = convexTest(schema, modules)
    await t.run(async (ctx) => {
      for (let i = 0; i < 5; i++) {
        await ctx.db.insert("pages", { title: `Page ${i}`, slug: `page-${i}` })
      }
    })
    const docs = await t.query(api.vex.collections.list, {
      collection: "pages",
      limit: 3,
    })
    expect(docs).toHaveLength(3)
  })

  test("returns up to 50 documents by default", async () => {
    const t = convexTest(schema, modules)
    await t.run(async (ctx) => {
      for (let i = 0; i < 55; i++) {
        await ctx.db.insert("pages", { title: `Page ${i}`, slug: `page-${i}` })
      }
    })
    const docs = await t.query(api.vex.collections.list, {
      collection: "pages",
    })
    expect(docs).toHaveLength(50)
  })
})

// ── get ───────────────────────────────────────────────────────────────────────

describe("vex.collections.get", () => {
  test("returns a document by id", async () => {
    const t = convexTest(schema, modules)
    let id: string
    await t.run(async (ctx) => {
      id = await ctx.db.insert("pages", { title: "Hello", slug: "hello" })
    })
    const doc = await t.query(api.vex.collections.get, {
      collection: "pages",
      id: id!,
    })
    expect(doc).not.toBeNull()
    expect(doc?.title).toBe("Hello")
    expect(doc?.slug).toBe("hello")
  })

  test("returns null for a non-existent or malformed id", async () => {
    const t = convexTest(schema, modules)
    const doc = await t.query(api.vex.collections.get, {
      collection: "pages",
      id: "not_a_real_id",
    })
    expect(doc).toBeNull()
  })

  test("returned document includes _id and _creationTime system fields", async () => {
    const t = convexTest(schema, modules)
    let id: string
    await t.run(async (ctx) => {
      id = await ctx.db.insert("pages", { title: "System fields test", slug: "system-test" })
    })
    const doc = await t.query(api.vex.collections.get, {
      collection: "pages",
      id: id!,
    })
    expect(doc?._id).toBe(id!)
    expect(typeof doc?._creationTime).toBe("number")
  })
})

// ── create ────────────────────────────────────────────────────────────────────

describe("vex.collections.create", () => {
  test("inserts a document and returns its id", async () => {
    const t = convexTest(schema, modules)
    const id = await t.mutation(api.vex.collections.create, {
      collection: "pages",
      data: { title: "New Page", slug: "new-page" },
    })
    expect(typeof id).toBe("string")
    expect(id.length).toBeGreaterThan(0)
  })

  test("created document is retrievable via get", async () => {
    const t = convexTest(schema, modules)
    const id = await t.mutation(api.vex.collections.create, {
      collection: "pages",
      data: { title: "Retrievable", slug: "retrievable" },
    })
    const doc = await t.query(api.vex.collections.get, {
      collection: "pages",
      id,
    })
    expect(doc?.title).toBe("Retrievable")
    expect(doc?.slug).toBe("retrievable")
  })

  test("created document appears in list", async () => {
    const t = convexTest(schema, modules)
    await t.mutation(api.vex.collections.create, {
      collection: "pages",
      data: { title: "Listed Page", slug: "listed" },
    })
    const docs = await t.query(api.vex.collections.list, {
      collection: "pages",
    })
    expect(docs).toHaveLength(1)
    expect(docs[0].title).toBe("Listed Page")
  })
})

// ── update ────────────────────────────────────────────────────────────────────

describe("vex.collections.update", () => {
  test("patches specified fields, leaves others unchanged", async () => {
    const t = convexTest(schema, modules)
    const id = await t.mutation(api.vex.collections.create, {
      collection: "pages",
      data: { title: "Original Title", slug: "original-slug" },
    })
    await t.mutation(api.vex.collections.update, {
      collection: "pages",
      id,
      data: { title: "Updated Title" },
    })
    const doc = await t.query(api.vex.collections.get, {
      collection: "pages",
      id,
    })
    expect(doc?.title).toBe("Updated Title")
    expect(doc?.slug).toBe("original-slug") // unchanged
  })

  test("can update multiple fields independently", async () => {
    const t = convexTest(schema, modules)
    const id = await t.mutation(api.vex.collections.create, {
      collection: "pages",
      data: { title: "Original", slug: "original", content: "Original content" },
    })
    await t.mutation(api.vex.collections.update, {
      collection: "pages",
      id,
      data: { content: "Updated content" },
    })
    const doc = await t.query(api.vex.collections.get, {
      collection: "pages",
      id,
    })
    expect(doc?.content).toBe("Updated content")
    expect(doc?.title).toBe("Original") // unchanged
    expect(doc?.slug).toBe("original") // unchanged
  })
})

// ── remove ────────────────────────────────────────────────────────────────────

describe("vex.collections.remove", () => {
  test("deletes a document — get returns null afterwards", async () => {
    const t = convexTest(schema, modules)
    const id = await t.mutation(api.vex.collections.create, {
      collection: "pages",
      data: { title: "To Delete", slug: "to-delete" },
    })
    await t.mutation(api.vex.collections.remove, { collection: "pages", id })
    const doc = await t.query(api.vex.collections.get, {
      collection: "pages",
      id,
    })
    expect(doc).toBeNull()
  })

  test("deleted document no longer appears in list", async () => {
    const t = convexTest(schema, modules)
    const id = await t.mutation(api.vex.collections.create, {
      collection: "pages",
      data: { title: "To Delete", slug: "to-delete" },
    })
    await t.mutation(api.vex.collections.create, {
      collection: "pages",
      data: { title: "Stays", slug: "stays" },
    })
    await t.mutation(api.vex.collections.remove, { collection: "pages", id })
    const docs = await t.query(api.vex.collections.list, {
      collection: "pages",
    })
    expect(docs).toHaveLength(1)
    expect(docs[0].title).toBe("Stays")
  })
})
