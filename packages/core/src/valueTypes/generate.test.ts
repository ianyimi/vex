import { describe, it, expect } from "vitest";
import { generateVexSchema } from "./generate";
import { defineCollection } from "../config/defineCollection";
import { defineConfig } from "../config/defineConfig";
import { text } from "../fields/text";
import { number } from "../fields/number";
import { checkbox } from "../fields/checkbox";
import { select } from "../fields/select";
import type { VexAuthAdapter } from "../types";
import { VexSlugConflictError } from "../errors";

// Minimal auth adapter used by tests that don't focus on auth behavior
const minimalAuth: VexAuthAdapter = {
  name: "better-auth",
  tables: [],
};

// Shared users collection for tests that need auth
const users = defineCollection("users", {
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
      const posts = defineCollection("posts", {
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
      const items = defineCollection("items", {
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
      const posts = defineCollection("posts", {
        fields: { title: text() },
      });
      const categories = defineCollection("categories", {
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

      // Should have header, imports, and the users table
      expect(output).toContain("AUTO-GENERATED");
      expect(output).toContain("export const users = defineTable({");
    });
  });

  describe("tableName", () => {
    it("uses tableName instead of slug for the export name", () => {
      const articles = defineCollection("articles", {
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
      const posts = defineCollection("posts", {
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
      const posts = defineCollection("posts", {
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
      const posts = defineCollection("posts", {
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
      const posts = defineCollection("posts", {
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
      const posts = defineCollection("posts", {
        fields: {
          title: text(),
        },
      });
      const config = defineConfig({
        collections: [posts, users],
        auth: minimalAuth,
      });
      const output = generateVexSchema({ config });

      // posts table should not have .index() — users table may depending on auth
      const postsSection = output.split("export const users")[0];
      expect(postsSection).not.toContain(".index(");
    });

    it("auto-generates index for admin.useAsTitle field", () => {
      const posts = defineCollection("posts", {
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
    const posts = defineCollection("posts", {
      fields: { title: text() },
    });

    const baseAuthAdapter: VexAuthAdapter = {
      name: "better-auth",
      tables: [
        {
          slug: "users",
          fields: {
            name: { valueType: "v.string()" },
            email: { valueType: "v.string()" },
            emailVerified: { valueType: "v.boolean()" },
            createdAt: { valueType: "v.number()" },
            updatedAt: { valueType: "v.number()" },
          },
        },
        {
          slug: "account",
          fields: {
            userId: { valueType: 'v.id("users")' },
            accountId: { valueType: "v.string()" },
            providerId: { valueType: "v.string()" },
            createdAt: { valueType: "v.number()" },
            updatedAt: { valueType: "v.number()" },
          },
          indexes: [{ name: "by_userId", fields: ["userId"] }],
        },
        {
          slug: "session",
          fields: {
            token: { valueType: "v.string()" },
            userId: { valueType: 'v.id("users")' },
            expiresAt: { valueType: "v.number()" },
            createdAt: { valueType: "v.number()" },
            updatedAt: { valueType: "v.number()" },
          },
          indexes: [{ name: "by_token", fields: ["token"] }],
        },
      ],
    };

    it("merges auth user table fields into matching user collection", () => {
      const config = defineConfig({
        collections: [posts, users],
        auth: baseAuthAdapter,
      });
      const output = generateVexSchema({ config });

      // Auth-provided fields appear in the users table (from auth tables array)
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

      // userId on account and session tables should use v.id("users")
      // (based on the user table's slug in the auth tables array)
      expect(output).toContain('userId: v.id("users")');
    });

    it("includes admin plugin fields in the user auth table", () => {
      // vexBetterAuth() resolves all plugin contributions before returning
      // the adapter, so the user table in auth.tables already includes plugin fields
      const authWithAdminFields: VexAuthAdapter = {
        name: "better-auth",
        tables: [
          {
            slug: "users",
            fields: {
              ...baseAuthAdapter.tables[0].fields,
              banned: { valueType: "v.optional(v.boolean())" },
              role: { valueType: "v.array(v.string())" },
            },
          },
          ...baseAuthAdapter.tables.slice(1),
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
    it("allows auth table slug to overlap with user collection slug (merge)", () => {
      // User defines an "account" collection and auth also has an "account" table
      // — this means the user wants to customize the account table's admin UI
      const account = defineCollection("account", {
        fields: { displayName: text() },
      });

      const authAdapter: VexAuthAdapter = {
        name: "better-auth",
        tables: [
          {
            slug: "account",
            fields: { userId: { valueType: 'v.id("users")' } },
          },
        ],
      };

      const config = defineConfig({
        collections: [account, users],
        auth: authAdapter,
      });

      // Should NOT throw — the overlap triggers a merge
      const output = generateVexSchema({ config });
      expect(output).toContain("export const account = defineTable({");
      // Auth field merged in
      expect(output).toContain('userId: v.id("users")');
      // User field also present
      expect(output).toContain("displayName:");
    });

    it("throws when two user collections have the same slug", () => {
      const posts1 = defineCollection("posts", {
        fields: { title: text() },
      });
      const posts2 = defineCollection("posts", {
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
      const posts = defineCollection("posts", {
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

      // Opening and closing braces should be balanced
      const openBraces = (output.match(/\{/g) || []).length;
      const closeBraces = (output.match(/\}/g) || []).length;
      expect(openBraces).toBe(closeBraces);

      // Opening and closing parens should be balanced
      const openParens = (output.match(/\(/g) || []).length;
      const closeParens = (output.match(/\)/g) || []).length;
      expect(openParens).toBe(closeParens);
    });

    it("uses consistent indentation", () => {
      const posts = defineCollection("posts", {
        fields: {
          title: text(),
        },
      });
      const config = defineConfig({
        collections: [posts, users],
        auth: minimalAuth,
      });
      const output = generateVexSchema({ config });

      // Fields inside defineTable should be indented
      const lines = output.split("\n");
      const titleLine = lines.find((l) => l.includes("title:"));
      expect(titleLine).toBeDefined();
      expect(titleLine!.startsWith("  ")).toBe(true);
    });
  });
});
