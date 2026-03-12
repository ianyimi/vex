import { describe, it, expect } from "vitest";
import { generateVexSchema } from "./generate";
import { defineCollection, defineMediaCollection } from "../config/defineCollection";
import { defineConfig } from "../config/defineConfig";
import { text } from "../fields/text";
import { number } from "../fields/number";
import { checkbox } from "../fields/checkbox";
import { select } from "../fields/select";
import { date } from "../fields/date";
import { relationship } from "../fields/relationship";
import { json } from "../fields/json";
import { array } from "../fields/array";
import { imageUrl } from "../fields/imageUrl";
import { upload } from "../fields/media";
import type { VexAuthAdapter } from "../types";
import { VexSlugConflictError } from "../errors";

// Minimal auth adapter used by tests that don't focus on auth behavior
const minimalAuth: VexAuthAdapter = {
  name: "better-auth",
  collections: [],
};

// Shared users collection for tests that need auth
const users = defineCollection({ slug: "users",
  fields: { name: text() },
});

describe("generateVexSchema", () => {
  describe("header and imports", () => {
    it("includes auto-generated warning comment", () => {
      const config = defineConfig({
        collections: [users],
        auth: minimalAuth,
      });
      const output = generateVexSchema({ config });
      expect(output).toContain("AUTO-GENERATED");
      expect(output).toContain("DO NOT EDIT");
    });

    it("includes convex imports", () => {
      const config = defineConfig({
        collections: [users],
        auth: minimalAuth,
      });
      const output = generateVexSchema({ config });
      expect(output).toContain('import { defineTable } from "convex/server"');
      expect(output).toContain('import { v } from "convex/values"');
    });
  });

  describe("basic collection generation", () => {
    it("generates a simple collection with text fields", () => {
      const posts = defineCollection({ slug: "posts",
        fields: {
          title: text({ required: true, defaultValue: "Untitled" }),
          slug: text(),
        },
      });
      const config = defineConfig({
        collections: [posts, users],
        auth: minimalAuth,
      });
      const output = generateVexSchema({ config });

      expect(output).toContain("export const posts = defineTable({");
      expect(output).toContain("title: v.string()");
      expect(output).toContain("slug: v.optional(v.string())");
    });

    it("generates a collection with all field types", () => {
      const items = defineCollection({ slug: "items",
        fields: {
          name: text({ required: true, defaultValue: "" }),
          count: number({ required: true, defaultValue: 0 }),
          active: checkbox(),
          status: select({
            required: true,
            defaultValue: "open",
            options: [
              { value: "open", label: "Open" },
              { value: "closed", label: "Closed" },
            ],
          }),
        },
      });
      const config = defineConfig({
        collections: [items, users],
        auth: minimalAuth,
      });
      const output = generateVexSchema({ config });

      expect(output).toContain("name: v.string()");
      expect(output).toContain("count: v.number()");
      expect(output).toContain("active: v.optional(v.boolean())");
      expect(output).toContain(
        'status: v.union(v.literal("open"),v.literal("closed"))',
      );
    });

    it("generates multiple collections", () => {
      const posts = defineCollection({ slug: "posts",
        fields: { title: text() },
      });
      const categories = defineCollection({ slug: "categories",
        fields: { name: text() },
      });
      const config = defineConfig({
        collections: [posts, categories, users],
        auth: minimalAuth,
      });
      const output = generateVexSchema({ config });

      expect(output).toContain("export const posts = defineTable({");
      expect(output).toContain("export const categories = defineTable({");
    });

    it("handles only the users collection (no additional collections)", () => {
      const config = defineConfig({
        collections: [users],
        auth: minimalAuth,
      });
      const output = generateVexSchema({ config });

      expect(output).toContain("AUTO-GENERATED");
      expect(output).toContain("export const users = defineTable({");
    });
  });

  describe("new field types", () => {
    it("generates date field as v.number()", () => {
      const events = defineCollection({ slug: "events",
        fields: {
          startDate: date({ required: true, defaultValue: 0 }),
          endDate: date(),
        },
      });
      const config = defineConfig({
        collections: [events, users],
        auth: minimalAuth,
      });
      const output = generateVexSchema({ config });

      expect(output).toContain("startDate: v.number()");
      expect(output).toContain("endDate: v.optional(v.number())");
    });

    it("generates imageUrl field as v.string()", () => {
      const profiles = defineCollection({ slug: "profiles",
        fields: {
          avatar: imageUrl({ required: true, defaultValue: "" }),
          banner: imageUrl(),
        },
      });
      const config = defineConfig({
        collections: [profiles, users],
        auth: minimalAuth,
      });
      const output = generateVexSchema({ config });

      expect(output).toContain("avatar: v.string()");
      expect(output).toContain("banner: v.optional(v.string())");
    });

    it("generates relationship field as v.id()", () => {
      const posts = defineCollection({ slug: "posts",
        fields: {
          author: relationship({ to: "users", required: true }),
          reviewer: relationship({ to: "users" }),
        },
      });
      const config = defineConfig({
        collections: [posts, users],
        auth: minimalAuth,
      });
      const output = generateVexSchema({ config });

      expect(output).toContain('author: v.id("users")');
      expect(output).toContain('reviewer: v.optional(v.id("users"))');
    });

    it("generates hasMany relationship as v.array(v.id())", () => {
      const posts = defineCollection({ slug: "posts",
        fields: {
          tags: relationship({ to: "tags", hasMany: true, required: true }),
          optionalTags: relationship({ to: "tags", hasMany: true }),
        },
      });
      const config = defineConfig({
        collections: [posts, users],
        auth: minimalAuth,
      });
      const output = generateVexSchema({ config });

      expect(output).toContain('tags: v.array(v.id("tags"))');
      expect(output).toContain('optionalTags: v.optional(v.array(v.id("tags")))');
    });

    it("generates json field as v.any()", () => {
      const posts = defineCollection({ slug: "posts",
        fields: {
          metadata: json({ required: true }),
          extra: json(),
        },
      });
      const config = defineConfig({
        collections: [posts, users],
        auth: minimalAuth,
      });
      const output = generateVexSchema({ config });

      expect(output).toContain("metadata: v.any()");
      expect(output).toContain("extra: v.optional(v.any())");
    });

    it("generates array field wrapping inner type", () => {
      const posts = defineCollection({ slug: "posts",
        fields: {
          tags: array({ field: text(), required: true }),
          scores: array({ field: number() }),
        },
      });
      const config = defineConfig({
        collections: [posts, users],
        auth: minimalAuth,
      });
      const output = generateVexSchema({ config });

      expect(output).toContain("tags: v.array(v.string())");
      expect(output).toContain("scores: v.optional(v.array(v.number()))");
    });
  });

  describe("tableName", () => {
    it("uses tableName instead of slug for the export name", () => {
      const articles = defineCollection({ slug: "articles",
        fields: { title: text() },
        tableName: "blog_articles",
      });
      const config = defineConfig({
        collections: [articles, users],
        auth: minimalAuth,
      });
      const output = generateVexSchema({ config });

      expect(output).toContain("export const blog_articles = defineTable({");
      expect(output).not.toContain("export const articles = defineTable({");
    });

    it("defaults to slug when tableName is not set", () => {
      const posts = defineCollection({ slug: "posts",
        fields: { title: text() },
      });
      const config = defineConfig({
        collections: [posts, users],
        auth: minimalAuth,
      });
      const output = generateVexSchema({ config });

      expect(output).toContain("export const posts = defineTable({");
    });
  });

  describe("index generation", () => {
    it("generates per-field indexes as chained .index() calls", () => {
      const posts = defineCollection({ slug: "posts",
        fields: {
          title: text(),
          slug: text({ index: "by_slug" }),
        },
      });
      const config = defineConfig({
        collections: [posts, users],
        auth: minimalAuth,
      });
      const output = generateVexSchema({ config });

      expect(output).toContain('.index("by_slug", ["slug"])');
    });

    it("generates collection-level compound indexes", () => {
      const posts = defineCollection({ slug: "posts",
        fields: {
          author: text(),
          createdAt: number(),
        },
        indexes: [{ name: "by_author_date", fields: ["author", "createdAt"] }],
      });
      const config = defineConfig({
        collections: [posts, users],
        auth: minimalAuth,
      });
      const output = generateVexSchema({ config });

      expect(output).toContain(
        '.index("by_author_date", ["author", "createdAt"])',
      );
    });

    it("generates both per-field and collection-level indexes", () => {
      const posts = defineCollection({ slug: "posts",
        fields: {
          slug: text({ index: "by_slug" }),
          author: text(),
          createdAt: number(),
        },
        indexes: [{ name: "by_author_date", fields: ["author", "createdAt"] }],
      });
      const config = defineConfig({
        collections: [posts, users],
        auth: minimalAuth,
      });
      const output = generateVexSchema({ config });

      expect(output).toContain('.index("by_slug", ["slug"])');
      expect(output).toContain(
        '.index("by_author_date", ["author", "createdAt"])',
      );
    });

    it("does not generate .index() when no indexes defined", () => {
      const posts = defineCollection({ slug: "posts",
        fields: {
          title: text(),
        },
      });
      const config = defineConfig({
        collections: [posts, users],
        auth: minimalAuth,
      });
      const output = generateVexSchema({ config });

      const postsSection = output.split("export const users")[0];
      expect(postsSection).not.toContain(".index(");
    });

    it("auto-generates index for admin.useAsTitle field", () => {
      const posts = defineCollection({ slug: "posts",
        fields: {
          title: text(),
          body: text(),
        },
        admin: {
          useAsTitle: "title",
        },
      });
      const config = defineConfig({
        collections: [posts, users],
        auth: minimalAuth,
      });
      const output = generateVexSchema({ config });

      expect(output).toContain('.index("by_title", ["title"])');
    });
  });

  describe("auth integration", () => {
    const posts = defineCollection({ slug: "posts",
      fields: { title: text() },
    });

    const baseAuthAdapter: VexAuthAdapter = {
      name: "better-auth",
      collections: [
        defineCollection({ slug: "users",
          fields: {
            name: text({ required: true, defaultValue: "" }),
            email: text({ required: true, defaultValue: "" }),
            emailVerified: checkbox({ required: true, defaultValue: false }),
            createdAt: date({ required: true, defaultValue: 0 }),
            updatedAt: date({ required: true, defaultValue: 0 }),
          },
        }),
        defineCollection({ slug: "account",
          fields: {
            userId: relationship({ to: "users", required: true }),
            accountId: text({ required: true, defaultValue: "" }),
            providerId: text({ required: true, defaultValue: "" }),
            createdAt: date({ required: true, defaultValue: 0 }),
            updatedAt: date({ required: true, defaultValue: 0 }),
          },
          indexes: [{ name: "by_userId", fields: ["userId"] }],
        }),
        defineCollection({ slug: "session",
          fields: {
            token: text({ required: true, defaultValue: "" }),
            userId: relationship({ to: "users", required: true }),
            expiresAt: date({ required: true, defaultValue: 0 }),
            createdAt: date({ required: true, defaultValue: 0 }),
            updatedAt: date({ required: true, defaultValue: 0 }),
          },
          indexes: [{ name: "by_token", fields: ["token"] }],
        }),
      ],
    };

    it("merges auth user collection fields into matching user collection", () => {
      const config = defineConfig({
        collections: [posts, users],
        auth: baseAuthAdapter,
      });
      const output = generateVexSchema({ config });

      // Auth-provided fields appear in the users table
      expect(output).toContain("email: v.string()");
      expect(output).toContain("emailVerified: v.boolean()");
      expect(output).toContain("createdAt: v.number()");

      // User-only fields also present
      expect(output).toContain("name:");
    });

    it("generates auth infrastructure tables", () => {
      const config = defineConfig({
        collections: [posts, users],
        auth: baseAuthAdapter,
      });
      const output = generateVexSchema({ config });

      expect(output).toContain("export const account = defineTable({");
      expect(output).toContain("export const session = defineTable({");
    });

    it("generates indexes on auth tables", () => {
      const config = defineConfig({
        collections: [posts, users],
        auth: baseAuthAdapter,
      });
      const output = generateVexSchema({ config });

      expect(output).toContain('.index("by_userId", ["userId"])');
      expect(output).toContain('.index("by_token", ["token"])');
    });

    it("uses v.id() for relationship fields in auth tables", () => {
      const config = defineConfig({
        collections: [posts, users],
        auth: baseAuthAdapter,
      });
      const output = generateVexSchema({ config });

      expect(output).toContain('userId: v.id("users")');
    });

    it("includes admin plugin fields in the user auth collection", () => {
      const authWithAdminFields: VexAuthAdapter = {
        name: "better-auth",
        collections: [
          defineCollection({ slug: "users",
            fields: {
              ...baseAuthAdapter.collections[0].fields,
              banned: checkbox(),
              role: array({ field: text(), required: true }),
            },
          }),
          ...baseAuthAdapter.collections.slice(1),
        ],
      };

      const config = defineConfig({
        collections: [posts, users],
        auth: authWithAdminFields,
      });
      const output = generateVexSchema({ config });

      // Additional user fields appear in the users table
      expect(output).toContain("banned: v.optional(v.boolean())");
      expect(output).toContain("role: v.array(v.string())");
    });
  });

  describe("slug validation", () => {
    it("allows auth collection slug to overlap with user collection slug (merge)", () => {
      const account = defineCollection({ slug: "account",
        fields: { displayName: text() },
      });

      const authAdapter: VexAuthAdapter = {
        name: "better-auth",
        collections: [
          defineCollection({ slug: "account",
            fields: {
              userId: relationship({ to: "users", required: true }),
            },
          }),
        ],
      };

      const config = defineConfig({
        collections: [account, users],
        auth: authAdapter,
      });

      const output = generateVexSchema({ config });
      expect(output).toContain("export const account = defineTable({");
      expect(output).toContain('userId: v.id("users")');
      expect(output).toContain("displayName:");
    });

    it("throws when two user collections have the same slug", () => {
      const posts1 = defineCollection({ slug: "posts",
        fields: { title: text() },
      });
      const posts2 = defineCollection({ slug: "posts",
        fields: { name: text() },
      });

      const config = defineConfig({
        collections: [posts1, posts2, users],
        auth: minimalAuth,
      });

      expect(() => generateVexSchema({ config })).toThrow(VexSlugConflictError);
    });
  });

  describe("output formatting", () => {
    it("generates valid TypeScript (no syntax errors in structure)", () => {
      const posts = defineCollection({ slug: "posts",
        fields: {
          title: text({ required: true, defaultValue: "Untitled" }),
          slug: text({ index: "by_slug" }),
          views: number(),
          featured: checkbox(),
          status: select({
            required: true,
            defaultValue: "draft",
            options: [
              { value: "draft", label: "Draft" },
              { value: "published", label: "Published" },
            ],
          }),
        },
      });
      const config = defineConfig({
        collections: [posts, users],
        auth: minimalAuth,
      });
      const output = generateVexSchema({ config });

      const openBraces = (output.match(/\{/g) || []).length;
      const closeBraces = (output.match(/\}/g) || []).length;
      expect(openBraces).toBe(closeBraces);

      const openParens = (output.match(/\(/g) || []).length;
      const closeParens = (output.match(/\)/g) || []).length;
      expect(openParens).toBe(closeParens);
    });

    it("uses consistent indentation", () => {
      const posts = defineCollection({ slug: "posts",
        fields: {
          title: text(),
        },
      });
      const config = defineConfig({
        collections: [posts, users],
        auth: minimalAuth,
      });
      const output = generateVexSchema({ config });

      const lines = output.split("\n");
      const titleLine = lines.find((l) => l.includes("title:"));
      expect(titleLine).toBeDefined();
      expect(titleLine!.startsWith("  ")).toBe(true);
    });
  });

  describe("search index generation", () => {
    it("generates per-field search index as chained .searchIndex() call", () => {
      const posts = defineCollection({ slug: "posts",
        fields: {
          title: text({
            searchIndex: { name: "search_title", filterFields: [] },
          }),
          body: text(),
        },
      });
      const config = defineConfig({
        collections: [posts, users],
        auth: minimalAuth,
      });
      const output = generateVexSchema({ config });

      expect(output).toContain(
        '.searchIndex("search_title", { searchField: "title" })',
      );
    });

    it("generates search index with filterFields", () => {
      const posts = defineCollection({ slug: "posts",
        fields: {
          title: text({
            searchIndex: {
              name: "search_title",
              filterFields: ["status"],
            },
          }),
          status: select({
            required: true,
            defaultValue: "draft",
            options: [
              { value: "draft", label: "Draft" },
              { value: "published", label: "Published" },
            ],
          }),
        },
      });
      const config = defineConfig({
        collections: [posts, users],
        auth: minimalAuth,
      });
      const output = generateVexSchema({ config });

      expect(output).toContain(
        '.searchIndex("search_title", { searchField: "title", filterFields: ["status"] })',
      );
    });

    it("generates collection-level search indexes", () => {
      const posts = defineCollection({ slug: "posts",
        fields: {
          title: text(),
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
      const config = defineConfig({
        collections: [posts, users],
        auth: minimalAuth,
      });
      const output = generateVexSchema({ config });

      expect(output).toContain(
        '.searchIndex("search_title", { searchField: "title", filterFields: ["author"] })',
      );
    });

    it("auto-generates search index for admin.useAsTitle", () => {
      const posts = defineCollection({ slug: "posts",
        fields: {
          title: text(),
          body: text(),
        },
        admin: {
          useAsTitle: "title",
        },
      });
      const config = defineConfig({
        collections: [posts, users],
        auth: minimalAuth,
      });
      const output = generateVexSchema({ config });

      expect(output).toContain(
        '.searchIndex("search_title", { searchField: "title" })',
      );
    });

    it("generates both .index() and .searchIndex() on the same table", () => {
      const posts = defineCollection({ slug: "posts",
        fields: {
          title: text({ index: "by_title" }),
          body: text(),
        },
        searchIndexes: [{ name: "search_title", searchField: "title" }],
      });
      const config = defineConfig({
        collections: [posts, users],
        auth: minimalAuth,
      });
      const output = generateVexSchema({ config });

      expect(output).toContain('.index("by_title", ["title"])');
      expect(output).toContain(
        '.searchIndex("search_title", { searchField: "title" })',
      );
    });

    it("does not generate .searchIndex() when no search indexes defined", () => {
      const posts = defineCollection({ slug: "posts",
        fields: {
          title: text(),
        },
      });
      const config = defineConfig({
        collections: [posts, users],
        auth: minimalAuth,
      });
      const output = generateVexSchema({ config });

      const postsSection = output.split("export const users")[0];
      expect(postsSection).not.toContain(".searchIndex(");
    });
  });

  describe("media collection generation", () => {
    const mockStorageAdapter = {
      name: "test",
      storageIdValueType: "v.string()",
      getUploadUrl: async () => "",
      getUrl: async () => "",
      deleteFile: async () => {},
    };

    const convexStorageAdapter = {
      name: "convex",
      storageIdValueType: 'v.id("_storage")',
      getUploadUrl: async () => "",
      getUrl: async () => "",
      deleteFile: async () => {},
    };

    it("generates media collections under MEDIA COLLECTIONS comment block", () => {
      const images = defineMediaCollection({ slug: "images",
        fields: {
          storageId: text({ required: true, defaultValue: "" }),
          filename: text({ required: true, defaultValue: "" }),
          mimeType: text({ required: true, defaultValue: "" }),
          size: number({ required: true, defaultValue: 0 }),
          url: text({ required: true, defaultValue: "" }),
          alt: text(),
          width: number(),
          height: number(),
        },
      });

      const config = defineConfig({
        collections: [users],
        auth: minimalAuth,
        media: { collections: [images], storageAdapter: mockStorageAdapter },
      });

      const output = generateVexSchema({ config });
      expect(output).toContain("MEDIA COLLECTIONS");
      expect(output).toContain("export const images = defineTable({");
      expect(output).toContain("storageId: v.string()");
    });

    it("uses adapter storageIdValueType for storageId field (Convex)", () => {
      const images = defineMediaCollection({ slug: "images",
        fields: {
          storageId: text({ required: true, defaultValue: "" }),
          filename: text({ required: true, defaultValue: "" }),
          mimeType: text({ required: true, defaultValue: "" }),
          size: number({ required: true, defaultValue: 0 }),
          url: text({ required: true, defaultValue: "" }),
          alt: text(),
          width: number(),
          height: number(),
        },
      });

      const config = defineConfig({
        collections: [users],
        auth: minimalAuth,
        media: { collections: [images], storageAdapter: convexStorageAdapter },
      });

      const output = generateVexSchema({ config });
      expect(output).toContain('storageId: v.id("_storage")');
      expect(output).toContain("filename: v.string()");
      expect(output).toContain("mimeType: v.string()");
    });

    it("generates by_mimeType index on media collections", () => {
      const images = defineMediaCollection({ slug: "images",
        fields: {
          storageId: text({ required: true, defaultValue: "" }),
          mimeType: text({
            required: true,
            defaultValue: "",
            index: "by_mimeType",
          }),
          filename: text({ required: true, defaultValue: "" }),
          size: number({ required: true, defaultValue: 0 }),
          url: text({ required: true, defaultValue: "" }),
          alt: text(),
          width: number(),
          height: number(),
        },
      });

      const config = defineConfig({
        collections: [users],
        auth: minimalAuth,
        media: { collections: [images], storageAdapter: mockStorageAdapter },
      });

      const output = generateVexSchema({ config });
      expect(output).toContain('.index("by_mimeType", ["mimeType"])');
    });

    it("does not generate MEDIA COLLECTIONS block when no media config", () => {
      const config = defineConfig({ collections: [users], auth: minimalAuth });
      const output = generateVexSchema({ config });
      expect(output).not.toContain("MEDIA COLLECTIONS");
    });

    it("generates upload() field references in user collections", () => {
      const posts = defineCollection({ slug: "posts",
        fields: {
          title: text(),
          cover: upload({ to: "images", required: true }),
          gallery: upload({ to: "images", hasMany: true }),
        },
      });

      const images = defineMediaCollection({ slug: "images",
        fields: {
          storageId: text({ required: true, defaultValue: "" }),
          mimeType: text({ required: true, defaultValue: "" }),
          filename: text({ required: true, defaultValue: "" }),
          size: number({ required: true, defaultValue: 0 }),
          url: text({ required: true, defaultValue: "" }),
          alt: text(),
          width: number(),
          height: number(),
        },
      });

      const config = defineConfig({
        collections: [posts, users],
        auth: minimalAuth,
        media: { collections: [images], storageAdapter: mockStorageAdapter },
      });

      const output = generateVexSchema({ config });
      expect(output).toContain('cover: v.id("images")');
      expect(output).toContain('gallery: v.optional(v.array(v.id("images")))');
    });
  });
});
