import { describe, it, expect } from "vitest";
import { collectIndexes } from "./indexes";
import { defineCollection } from "../config/defineCollection";
import { text } from "../fields/text";
import { number } from "../fields/number";
import { select } from "../fields/select";

describe("collectIndexes", () => {
  it("returns empty array when no indexes are defined", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({ required: true }),
        body: text(),
      },
    });
    expect(collectIndexes({ collection: posts })).toEqual([]);
  });

  it("collects per-field index from a single field", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({ required: true }),
        slug: text({ required: true, index: "by_slug" }),
      },
    });
    const indexes = collectIndexes({ collection: posts });
    expect(indexes).toEqual([{ name: "by_slug", fields: ["slug"] }]);
  });

  it("collects per-field indexes from multiple fields", () => {
    const posts = defineCollection("posts", {
      fields: {
        slug: text({ required: true, index: "by_slug" }),
        email: text({ required: true, index: "by_email" }),
      },
    });
    const indexes = collectIndexes({ collection: posts });
    expect(indexes).toHaveLength(2);
    expect(indexes).toContainEqual({ name: "by_slug", fields: ["slug"] });
    expect(indexes).toContainEqual({ name: "by_email", fields: ["email"] });
  });

  it("collects collection-level indexes", () => {
    const posts = defineCollection("posts", {
      fields: {
        author: text({ required: true }),
        createdAt: number({ required: true }),
      },
      indexes: [{ name: "by_author_date", fields: ["author", "createdAt"] }],
    });
    const indexes = collectIndexes({ collection: posts });
    expect(indexes).toEqual([
      { name: "by_author_date", fields: ["author", "createdAt"] },
    ]);
  });

  it("merges per-field and collection-level indexes", () => {
    const posts = defineCollection("posts", {
      fields: {
        slug: text({ required: true, index: "by_slug" }),
        author: text({ required: true }),
        createdAt: number({ required: true }),
      },
      indexes: [{ name: "by_author_date", fields: ["author", "createdAt"] }],
    });
    const indexes = collectIndexes({ collection: posts });
    expect(indexes).toHaveLength(2);
    expect(indexes).toContainEqual({ name: "by_slug", fields: ["slug"] });
    expect(indexes).toContainEqual({
      name: "by_author_date",
      fields: ["author", "createdAt"],
    });
  });

  it("collection-level index wins on name collision with per-field index", () => {
    const posts = defineCollection("posts", {
      fields: {
        slug: text({ required: true, index: "by_slug" }),
        status: text({ required: true }),
      },
      indexes: [
        // Overrides the per-field "by_slug" with a compound index
        { name: "by_slug", fields: ["slug", "status"] },
      ],
    });
    const indexes = collectIndexes({ collection: posts });
    expect(indexes).toHaveLength(1);
    expect(indexes[0]).toEqual({ name: "by_slug", fields: ["slug", "status"] });
  });

  it("throws when two different fields claim the same index name", () => {
    const posts = defineCollection("posts", {
      fields: {
        slug: text({ required: true, index: "by_unique" }),
        email: text({ required: true, index: "by_unique" }),
      },
    });
    expect(() => collectIndexes({ collection: posts })).toThrow("by_unique");
  });

  it("skips fields with empty string index", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({ required: true, index: "" }),
      },
    });
    expect(collectIndexes({ collection: posts })).toEqual([]);
  });

  it("handles select fields with indexes", () => {
    const posts = defineCollection("posts", {
      fields: {
        status: select({
          required: true,
          index: "by_status",
          options: [
            { value: "draft", label: "Draft" },
            { value: "published", label: "Published" },
          ],
        }),
      },
    });
    const indexes = collectIndexes({ collection: posts });
    expect(indexes).toEqual([{ name: "by_status", fields: ["status"] }]);
  });

  describe("auto-index for admin.useAsTitle", () => {
    it("auto-creates index for useAsTitle field when no index exists", () => {
      const posts = defineCollection("posts", {
        fields: {
          title: text({ required: true }),
          body: text(),
        },
        admin: {
          useAsTitle: "title",
        },
      });
      const indexes = collectIndexes({ collection: posts });
      expect(indexes).toEqual([{ name: "by_title", fields: ["title"] }]);
    });

    it("does not duplicate when useAsTitle field already has a per-field index", () => {
      const posts = defineCollection("posts", {
        fields: {
          title: text({ required: true, index: "by_title" }),
          body: text(),
        },
        admin: {
          useAsTitle: "title",
        },
      });
      const indexes = collectIndexes({ collection: posts });
      expect(indexes).toHaveLength(1);
      expect(indexes[0]).toEqual({ name: "by_title", fields: ["title"] });
    });

    it("does not duplicate when useAsTitle field is covered by a collection-level index", () => {
      const posts = defineCollection("posts", {
        fields: {
          title: text({ required: true }),
          body: text(),
        },
        indexes: [{ name: "by_title", fields: ["title"] }],
        admin: {
          useAsTitle: "title",
        },
      });
      const indexes = collectIndexes({ collection: posts });
      expect(indexes).toHaveLength(1);
    });

    it("does not create auto-index when useAsTitle is not set", () => {
      const posts = defineCollection("posts", {
        fields: {
          title: text({ required: true }),
        },
      });
      expect(collectIndexes({ collection: posts })).toEqual([]);
    });

    it("coexists with other indexes", () => {
      const posts = defineCollection("posts", {
        fields: {
          title: text({ required: true }),
          slug: text({ required: true, index: "by_slug" }),
        },
        admin: {
          useAsTitle: "title",
        },
      });
      const indexes = collectIndexes({ collection: posts });
      expect(indexes).toHaveLength(2);
      expect(indexes).toContainEqual({ name: "by_slug", fields: ["slug"] });
      expect(indexes).toContainEqual({ name: "by_title", fields: ["title"] });
    });

    it("skips auto-index if auto-generated name collides with existing index", () => {
      const posts = defineCollection("posts", {
        fields: {
          title: text({ required: true }),
          slug: text({ required: true }),
        },
        // Explicit index named "by_title" that indexes slug, not title
        indexes: [{ name: "by_title", fields: ["slug"] }],
        admin: {
          useAsTitle: "title",
        },
      });
      const indexes = collectIndexes({ collection: posts });
      // The explicit "by_title" wins — no auto-index added
      expect(indexes).toHaveLength(1);
      expect(indexes[0]).toEqual({ name: "by_title", fields: ["slug"] });
    });
  });
});
