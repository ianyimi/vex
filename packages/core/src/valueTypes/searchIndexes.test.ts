import { describe, it, expect } from "vitest";
import { collectSearchIndexes } from "./searchIndexes";
import { defineCollection } from "../config/defineCollection";
import { text } from "../fields/text";
import { number } from "../fields/number";
import { select } from "../fields/select";

describe("collectSearchIndexes", () => {
  it("returns empty array when no search indexes are defined", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({ required: true }),
        body: text(),
      },
    });
    expect(collectSearchIndexes({ collection: posts })).toEqual([]);
  });

  it("collects per-field search index from a single field", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({
          required: true,
          searchIndex: { name: "search_title", filterFields: [] },
        }),
        body: text(),
      },
    });
    const indexes = collectSearchIndexes({ collection: posts });
    expect(indexes).toEqual([
      { name: "search_title", searchField: "title", filterFields: [] },
    ]);
  });

  it("collects per-field search index with filterFields", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({
          required: true,
          searchIndex: { name: "search_title", filterFields: ["status"] },
        }),
        status: select({
          required: true,
          options: [
            { value: "draft", label: "Draft" },
            { value: "published", label: "Published" },
          ],
        }),
      },
    });
    const indexes = collectSearchIndexes({ collection: posts });
    expect(indexes).toEqual([
      { name: "search_title", searchField: "title", filterFields: ["status"] },
    ]);
  });

  it("collects collection-level search indexes", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({ required: true }),
        author: text(),
      },
      searchIndexes: [
        {
          name: "search_title",
          searchField: "title",
          filterFields: ["author"],
        },
      ],
    });
    const indexes = collectSearchIndexes({ collection: posts });
    expect(indexes).toEqual([
      { name: "search_title", searchField: "title", filterFields: ["author"] },
    ]);
  });

  it("collection-level wins on name collision with per-field search index", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({
          required: true,
          searchIndex: { name: "search_title", filterFields: [] },
        }),
        author: text(),
      },
      searchIndexes: [
        {
          name: "search_title",
          searchField: "title",
          filterFields: ["author"],
        },
      ],
    });
    const indexes = collectSearchIndexes({ collection: posts });
    expect(indexes).toHaveLength(1);
    expect(indexes[0]).toEqual({
      name: "search_title",
      searchField: "title",
      filterFields: ["author"],
    });
  });

  it("throws when two different fields claim the same search index name", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({
          required: true,
          searchIndex: { name: "search_content", filterFields: [] },
        }),
        body: text({
          searchIndex: { name: "search_content", filterFields: [] },
        }),
      },
    });
    expect(() => collectSearchIndexes({ collection: posts })).toThrow(
      "search_content",
    );
  });

  it("skips fields with empty string search index name", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({
          required: true,
          searchIndex: { name: "", filterFields: [] },
        }),
      },
    });
    expect(collectSearchIndexes({ collection: posts })).toEqual([]);
  });

  it("merges per-field and collection-level search indexes", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({
          required: true,
          searchIndex: { name: "search_title", filterFields: [] },
        }),
        body: text(),
        author: text(),
      },
      searchIndexes: [
        { name: "search_body", searchField: "body", filterFields: ["author"] },
      ],
    });
    const indexes = collectSearchIndexes({ collection: posts });
    expect(indexes).toHaveLength(2);
    expect(indexes).toContainEqual({
      name: "search_title",
      searchField: "title",
      filterFields: [],
    });
    expect(indexes).toContainEqual({
      name: "search_body",
      searchField: "body",
      filterFields: ["author"],
    });
  });

  describe("auto search index for admin.useAsTitle", () => {
    it("auto-creates search index for useAsTitle field when no search index exists", () => {
      const posts = defineCollection("posts", {
        fields: {
          title: text({ required: true }),
          body: text(),
        },
        admin: {
          useAsTitle: "title",
        },
      });
      const indexes = collectSearchIndexes({ collection: posts });
      expect(indexes).toEqual([
        { name: "search_title", searchField: "title", filterFields: [] },
      ]);
    });

    it("does not duplicate when useAsTitle field already has a per-field search index", () => {
      const posts = defineCollection("posts", {
        fields: {
          title: text({
            required: true,
            searchIndex: { name: "search_title", filterFields: ["status"] },
          }),
          status: select({
            required: true,
            options: [{ value: "draft", label: "Draft" }],
          }),
        },
        admin: {
          useAsTitle: "title",
        },
      });
      const indexes = collectSearchIndexes({ collection: posts });
      expect(indexes).toHaveLength(1);
      expect(indexes[0]).toEqual({
        name: "search_title",
        searchField: "title",
        filterFields: ["status"],
      });
    });

    it("does not duplicate when useAsTitle field is covered by a collection-level search index", () => {
      const posts = defineCollection("posts", {
        fields: {
          title: text({ required: true }),
          body: text(),
        },
        searchIndexes: [{ name: "search_title", searchField: "title" }],
        admin: {
          useAsTitle: "title",
        },
      });
      const indexes = collectSearchIndexes({ collection: posts });
      expect(indexes).toHaveLength(1);
    });

    it("does not create auto search index when useAsTitle is not set", () => {
      const posts = defineCollection("posts", {
        fields: {
          title: text({ required: true }),
        },
      });
      expect(collectSearchIndexes({ collection: posts })).toEqual([]);
    });

    it("coexists with other search indexes", () => {
      const posts = defineCollection("posts", {
        fields: {
          title: text({ required: true }),
          body: text({
            searchIndex: { name: "search_body", filterFields: [] },
          }),
        },
        admin: {
          useAsTitle: "title",
        },
      });
      const indexes = collectSearchIndexes({ collection: posts });
      expect(indexes).toHaveLength(2);
      expect(indexes).toContainEqual({
        name: "search_body",
        searchField: "body",
        filterFields: [],
      });
      expect(indexes).toContainEqual({
        name: "search_title",
        searchField: "title",
        filterFields: [],
      });
    });

    it("does not auto-create if another search index already covers the useAsTitle field", () => {
      const posts = defineCollection("posts", {
        fields: {
          title: text({ required: true }),
          status: select({
            required: true,
            options: [{ value: "draft", label: "Draft" }],
          }),
        },
        searchIndexes: [
          {
            name: "custom_search",
            searchField: "title",
            filterFields: ["status"],
          },
        ],
        admin: {
          useAsTitle: "title",
        },
      });
      const indexes = collectSearchIndexes({ collection: posts });
      // "custom_search" already covers "title" as searchField — no auto-index
      expect(indexes).toHaveLength(1);
      expect(indexes[0]!.name).toBe("custom_search");
    });

    it("skips auto search index if auto-generated name collides with existing index", () => {
      const posts = defineCollection("posts", {
        fields: {
          title: text({ required: true }),
          body: text(),
        },
        // Explicit search index named "search_title" that searches body, not title
        searchIndexes: [{ name: "search_title", searchField: "body" }],
        admin: {
          useAsTitle: "title",
        },
      });
      const indexes = collectSearchIndexes({ collection: posts });
      // The explicit "search_title" wins — no auto-index added
      expect(indexes).toHaveLength(1);
      expect(indexes[0]).toEqual({
        name: "search_title",
        searchField: "body",
        filterFields: [],
      });
    });
  });
});
