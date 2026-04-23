import { describe, it, expect } from "vitest";
import { defineCollection } from "./config";
import { url, text, number, checkbox, date, select } from "../fields";
import { collectionConfigToVexSchema } from "./schemaGen";

// ─── Basic output ─────────────────────────────────────────────────────────────

describe("collectionConfigToVexSchema — basic output", () => {
  it("exports a const using the collection slug", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { title: url({ required: true }) },
    });
    const output = collectionConfigToVexSchema({ collection });
    expect(output).toContain("export const posts = defineTable({");
  });

  it("generates an empty defineTable({}) for a collection with no fields", () => {
    const collection = defineCollection({ slug: "empty", fields: {} });
    const output = collectionConfigToVexSchema({ collection });
    expect(output).toContain("export const empty = defineTable({");
    expect(output).not.toContain(".index(");
    expect(output).not.toContain(".searchIndex(");
  });
});

// ─── Field validators ─────────────────────────────────────────────────────────

describe("collectionConfigToVexSchema — field validators", () => {
  it("generates required text field as v.string()", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { title: url({ required: true }) },
    });
    expect(collectionConfigToVexSchema({ collection })).toContain(
      "title: v.string()",
    );
  });

  it("generates optional text field as v.optional(v.string())", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { excerpt: url({ required: false }) },
    });
    expect(collectionConfigToVexSchema({ collection })).toContain(
      "excerpt: v.optional(v.string())",
    );
  });

  it("generates required number field as v.number()", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { views: number({ required: true }) },
    });
    expect(collectionConfigToVexSchema({ collection })).toContain(
      "views: v.number()",
    );
  });

  it("generates optional checkbox field as v.optional(v.boolean())", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { published: checkbox({ required: false }) },
    });
    expect(collectionConfigToVexSchema({ collection })).toContain(
      "published: v.optional(v.boolean())",
    );
  });

  it("generates optional date field as v.optional(v.number())", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { publishedAt: date({ required: false }) },
    });
    expect(collectionConfigToVexSchema({ collection })).toContain(
      "publishedAt: v.optional(v.number())",
    );
  });

  it("generates required select field as v.array(v.union(...))", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: {
        status: select({
          required: true,
          options: [
            { label: "Draft", value: "draft" },
            { label: "Published", value: "published" },
          ],
        }),
      },
    });
    expect(collectionConfigToVexSchema({ collection })).toContain(
      'status: v.array(v.union(v.literal("draft"), v.literal("published")))',
    );
  });
});

// ─── Indexes ─────────────────────────────────────────────────────────────────

describe("collectionConfigToVexSchema — indexes", () => {
  it("appends .index() for a field with an index property", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { slug: url({ required: true, index: "by_slug" }) },
    });
    expect(collectionConfigToVexSchema({ collection })).toContain(
      '.index("by_slug", ["slug"])',
    );
  });

  it("appends multiple .index() chains for multiple indexed fields", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: {
        slug: url({ required: true, index: "by_slug" }),
        authorId: url({ required: true, index: "by_author" }),
      },
    });
    const output = collectionConfigToVexSchema({ collection });
    expect(output).toContain('.index("by_slug", ["slug"])');
    expect(output).toContain('.index("by_author", ["authorId"])');
  });

  it("does not append .index() for fields without an index property", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { title: url({ required: true }) },
    });
    expect(collectionConfigToVexSchema({ collection })).not.toContain(
      ".index(",
    );
  });
});

// ─── Search indexes ───────────────────────────────────────────────────────────

describe("collectionConfigToVexSchema — searchIndex", () => {
  it("appends .searchIndex() for a text field with searchIndex config", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: {
        title: text({
          required: true,
          searchIndex: { name: "search_title", filterFields: ["status"] },
        }),
      },
    });
    const output = collectionConfigToVexSchema({ collection });
    expect(output).toContain('.searchIndex("search_title",');
    expect(output).toContain('searchField: "title"');
    expect(output).toContain('filterFields: ["status"]');
  });

  it("generates empty filterFields array when filterFields is []", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: {
        title: text({
          required: true,
          searchIndex: { name: "search_title", filterFields: [] },
        }),
      },
    });
    expect(collectionConfigToVexSchema({ collection })).toContain(
      "filterFields: []",
    );
  });

  it("does not append .searchIndex() for non-text fields", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { views: number({ required: true }) },
    });
    expect(collectionConfigToVexSchema({ collection })).not.toContain(
      ".searchIndex(",
    );
  });
});

// ─── Integration ─────────────────────────────────────────────────────────────

describe("collectionConfigToVexSchema — integration", () => {
  it("generates a complete schema string for a realistic collection", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: {
        title: url({ required: true }),
        slug: url({ required: true, index: "by_slug" }),
        excerpt: url({ required: false }),
        views: number({ required: true }),
        published: checkbox({ required: false }),
        publishedAt: date({ required: false }),
        status: select({
          required: true,
          options: [
            { label: "Draft", value: "draft" },
            { label: "Published", value: "published" },
          ],
        }),
      },
    });
    const output = collectionConfigToVexSchema({ collection });

    expect(output).toContain("export const posts = defineTable({");
    expect(output).toContain("title: v.string()");
    expect(output).toContain("slug: v.string()");
    expect(output).toContain("excerpt: v.optional(v.string())");
    expect(output).toContain("views: v.number()");
    expect(output).toContain("published: v.optional(v.boolean())");
    expect(output).toContain("publishedAt: v.optional(v.number())");
    expect(output).toContain(
      'status: v.array(v.union(v.literal("draft"), v.literal("published")))',
    );
    expect(output).toContain('.index("by_slug", ["slug"])');
  });
});
