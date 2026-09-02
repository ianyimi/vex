import { describe, it, expect } from "vitest";
import { defineCollection, defineConfig } from "../index";
import { relationship } from "../fields/relationship/config";
import { text } from "../fields";
import { collectionConfigToVexSchema, getIncomingRelationships } from "./validator";

// ─── getIncomingRelationships ─────────────────────────────────────────────────

describe("getIncomingRelationships", () => {
  it("returns an empty array when no collections have relationships", () => {
    const authors = defineCollection({
      slug: "authors",
      fields: { name: text({ required: true }) },
    });
    const config = defineConfig({ collections: [authors] });
    expect(getIncomingRelationships({ collection: authors, config })).toEqual([]);
  });

  it("returns the field when another collection has a relationship pointing here", () => {
    const authors = defineCollection({
      slug: "authors",
      fields: { name: text({ required: true }) },
    });
    const posts = defineCollection({
      slug: "posts",
      fields: { author: relationship({ collection: { slug: "authors" } }) },
    });
    const config = defineConfig({ collections: [posts, authors] });
    expect(getIncomingRelationships({ collection: authors, config })).toEqual([
      { fromSlug: "posts", fieldKey: "author" },
    ]);
  });

  it("returns multiple entries when multiple collections point here", () => {
    const authors = defineCollection({
      slug: "authors",
      fields: { name: text({ required: true }) },
    });
    const posts = defineCollection({
      slug: "posts",
      fields: { author: relationship({ collection: { slug: "authors" } }) },
    });
    const comments = defineCollection({
      slug: "comments",
      fields: { author: relationship({ collection: { slug: "authors" } }) },
    });
    const config = defineConfig({ collections: [posts, comments, authors] });
    const result = getIncomingRelationships({ collection: authors, config });
    expect(result).toHaveLength(2);
    expect(result).toContainEqual({
      fromSlug: "posts",
      fieldKey: "author",
    });
    expect(result).toContainEqual({
      fromSlug: "comments",
      fieldKey: "author",
    });
  });

  it("includes self-referencing relationships so the search index is generated", () => {
    const nodes = defineCollection({
      slug: "nodes",
      fields: { parent: relationship({ collection: { slug: "nodes" } }) },
    });
    const config = defineConfig({ collections: [nodes] });
    // Self-references must be returned: the relationship picker on `parent`
    // searches `nodes` itself and needs `.searchIndex("search_<useAsTitle>")`.
    // Excluding self-refs left the picker stuck on the loading state.
    expect(getIncomingRelationships({ collection: nodes, config })).toEqual([
      { fromSlug: "nodes", fieldKey: "parent" },
    ]);
  });

  it("does not return relationships pointing to other collections", () => {
    const authors = defineCollection({
      slug: "authors",
      fields: { name: text({ required: true }) },
    });
    const categories = defineCollection({
      slug: "categories",
      fields: { label: text() },
    });
    const posts = defineCollection({
      slug: "posts",
      fields: {
        category: relationship({ collection: { slug: "categories" } }),
      },
    });
    const config = defineConfig({ collections: [posts, authors, categories] });
    // posts has a relationship to categories, not to authors
    expect(getIncomingRelationships({ collection: authors, config })).toEqual([]);
  });
});

describe("collectionConfigToVexSchema — compound index creation", () => {
  it("builds a compound index properly across multiple fields", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: {
        author: relationship({ collection: { slug: "authors" }, index: "by_author_title" }),
        title: text(),
      },
      indexes: [
        {
          name: "by_author_title",
          fields: ["author", "title"],
        },
      ],
    });
    const config = defineConfig({ collections: [posts] });
    const output = collectionConfigToVexSchema({ collection: posts, config });
    expect(output).toContain('.index("by_author_title", ["author","title"])');
  });
});

// ─── relationship field auto-index ────────────────────────────────────────────

describe("collectionConfigToVexSchema — relationship auto-index", () => {
  it("auto-emits by_<fieldKey> index for a relationship field", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { author: relationship({ collection: { slug: "authors" } }) },
    });
    const config = defineConfig({ collections: [posts] });
    const output = collectionConfigToVexSchema({ collection: posts, config });
    expect(output).toContain('.index("by_author", ["author"])');
  });

  it("explicit index on a relationship field suppresses the auto by_<fieldKey> index", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: {
        author: relationship({
          collection: { slug: "authors" },
          index: "by_author_legacy",
        }),
      },
    });
    const config = defineConfig({ collections: [posts] });
    const output = collectionConfigToVexSchema({ collection: posts, config });
    expect(output).toContain('.index("by_author_legacy", ["author"])');
    expect(output).not.toContain('.index("by_author",');
  });

  it("emits v.array(v.id()) for a required relationship field", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: {
        author: relationship({
          collection: { slug: "authors" },
          required: true,
        }),
      },
    });
    const config = defineConfig({ collections: [posts] });
    const output = collectionConfigToVexSchema({ collection: posts, config });
    expect(output).toContain('author: v.array(v.id("authors"))');
  });

  it("emits v.optional(v.array(v.id())) for an optional relationship field", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: { author: relationship({ collection: { slug: "authors" } }) },
    });
    const config = defineConfig({ collections: [posts] });
    const output = collectionConfigToVexSchema({ collection: posts, config });
    expect(output).toContain('author: v.optional(v.array(v.id("authors")))');
  });

  it("emits v.array(v.id()) for a hasMany relationship field", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: {
        tags: relationship({
          collection: { slug: "tags" },
          hasMany: true,
          required: true,
        }),
      },
    });
    const config = defineConfig({ collections: [posts] });
    const output = collectionConfigToVexSchema({ collection: posts, config });
    expect(output).toContain('tags: v.array(v.id("tags"))');
    expect(output).toContain('.index("by_tags", ["tags"])');
  });
});

// ─── auto search index on related collection ─────────────────────────────────

describe("collectionConfigToVexSchema — auto search index", () => {
  it("emits search index on useAsTitle field when another collection points here", () => {
    const authors = defineCollection({
      slug: "authors",
      fields: { name: text({ required: true }) },
      admin: { useAsTitle: "name" },
    });
    const posts = defineCollection({
      slug: "posts",
      fields: { author: relationship({ collection: { slug: "authors" } }) },
    });
    const config = defineConfig({ collections: [posts, authors] });
    const output = collectionConfigToVexSchema({ collection: authors, config });
    expect(output).toContain('.searchIndex("search_name"');
    expect(output).toContain('searchField: "name"');
  });

  it("does NOT emit auto search index when useAsTitle is _id (default)", () => {
    const authors = defineCollection({
      slug: "authors",
      fields: { name: text({ required: true }) },
      // no admin.useAsTitle → defaults to "_id"
    });
    const posts = defineCollection({
      slug: "posts",
      fields: { author: relationship({ collection: { slug: "authors" } }) },
    });
    const config = defineConfig({ collections: [posts, authors] });
    const output = collectionConfigToVexSchema({ collection: authors, config });
    expect(output).not.toContain(".searchIndex(");
  });

  it("does NOT emit auto search index when no collection points here", () => {
    const authors = defineCollection({
      slug: "authors",
      fields: { name: text({ required: true }) },
      admin: { useAsTitle: "name" },
    });
    const config = defineConfig({ collections: [authors] });
    const output = collectionConfigToVexSchema({ collection: authors, config });
    expect(output).not.toContain(".searchIndex(");
  });

  it("does NOT duplicate search index when field already has searchIndex configured with same name", () => {
    const authors = defineCollection({
      slug: "authors",
      fields: {
        name: text({
          required: true,
          searchIndex: { name: "search_name", filterFields: [] },
        }),
      },
      admin: { useAsTitle: "name" },
    });
    const posts = defineCollection({
      slug: "posts",
      fields: { author: relationship({ collection: { slug: "authors" } }) },
    });
    const config = defineConfig({ collections: [posts, authors] });
    const output = collectionConfigToVexSchema({ collection: authors, config });
    const count = (output.match(/searchIndex/g) ?? []).length;
    expect(count).toBe(1); // only one — not duplicated
  });

  it("emits only ONE auto search index when multiple collections point here", () => {
    const authors = defineCollection({
      slug: "authors",
      fields: { name: text({ required: true }) },
      admin: { useAsTitle: "name" },
    });
    const posts = defineCollection({
      slug: "posts",
      fields: { author: relationship({ collection: { slug: "authors" } }) },
    });
    const comments = defineCollection({
      slug: "comments",
      fields: { author: relationship({ collection: { slug: "authors" } }) },
    });
    const config = defineConfig({ collections: [posts, comments, authors] });
    const output = collectionConfigToVexSchema({ collection: authors, config });
    const count = (output.match(/searchIndex/g) ?? []).length;
    expect(count).toBe(1);
    expect(output).toContain('.searchIndex("search_name"');
  });

  it("auto search index always has empty filterFields", () => {
    const authors = defineCollection({
      slug: "authors",
      fields: { name: text({ required: true }) },
      admin: { useAsTitle: "name" },
    });
    const posts = defineCollection({
      slug: "posts",
      fields: { author: relationship({ collection: { slug: "authors" } }) },
    });
    const config = defineConfig({ collections: [posts, authors] });
    const output = collectionConfigToVexSchema({ collection: authors, config });
    expect(output).toContain("filterFields: []");
  });

  it("emits manual searchIndex with a different name alongside auto search index", () => {
    // manual name is different from search_<useAsTitle> — both should be emitted
    const authors = defineCollection({
      slug: "authors",
      fields: {
        name: text({
          required: true,
          searchIndex: { name: "search_authors_by_name", filterFields: [] },
        }),
      },
      admin: { useAsTitle: "name" },
    });
    const posts = defineCollection({
      slug: "posts",
      fields: { author: relationship({ collection: { slug: "authors" } }) },
    });
    const config = defineConfig({ collections: [posts, authors] });
    const output = collectionConfigToVexSchema({ collection: authors, config });
    expect(output).toContain('.searchIndex("search_authors_by_name"');
    expect(output).toContain('.searchIndex("search_name"');
    const count = (output.match(/searchIndex/g) ?? []).length;
    expect(count).toBe(2);
  });

  it("does NOT emit auto search index when useAsTitle is _creationTime", () => {
    const authors = defineCollection({
      slug: "authors",
      fields: { name: text({ required: true }) },
      admin: { useAsTitle: "_creationTime" },
    });
    const posts = defineCollection({
      slug: "posts",
      fields: { author: relationship({ collection: { slug: "authors" } }) },
    });
    const config = defineConfig({ collections: [posts, authors] });
    const output = collectionConfigToVexSchema({ collection: authors, config });
    expect(output).not.toContain(".searchIndex(");
  });

  it("auto search index searchField matches useAsTitle, not the source field key", () => {
    // useAsTitle is "name", source field key is "author" — searchField must be "name"
    const authors = defineCollection({
      slug: "authors",
      fields: { name: text({ required: true }) },
      admin: { useAsTitle: "name" },
    });
    const posts = defineCollection({
      slug: "posts",
      fields: { author: relationship({ collection: { slug: "authors" } }) },
    });
    const config = defineConfig({ collections: [posts, authors] });
    const output = collectionConfigToVexSchema({ collection: authors, config });
    expect(output).toContain('searchField: "name"');
    expect(output).not.toContain('searchField: "author"');
  });

  it("collection with multiple text searchIndexes and an incoming relationship emits all correctly", () => {
    const authors = defineCollection({
      slug: "authors",
      fields: {
        name: text({
          required: true,
          searchIndex: { name: "search_name", filterFields: [] },
        }),
        bio: text({
          searchIndex: { name: "search_bio", filterFields: ["name"] },
        }),
      },
      admin: { useAsTitle: "name" },
    });
    const posts = defineCollection({
      slug: "posts",
      fields: { author: relationship({ collection: { slug: "authors" } }) },
    });
    const config = defineConfig({ collections: [posts, authors] });
    const output = collectionConfigToVexSchema({ collection: authors, config });
    // manual search_name on name field + manual search_bio on bio field
    // auto search_name suppressed because manual already covers it
    expect(output).toContain('.searchIndex("search_name"');
    expect(output).toContain('.searchIndex("search_bio"');
    const count = (output.match(/searchIndex/g) ?? []).length;
    expect(count).toBe(2); // not 3
  });
});
