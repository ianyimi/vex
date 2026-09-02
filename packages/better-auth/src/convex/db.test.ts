import { convexTest } from "convex-test";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { describe, expect, test } from "vitest";

import * as _generatedApi from "./test/_generated/api";
import schema from "./test/schema";
import * as DB from "./db";

const modules: Record<string, () => Promise<unknown>> = {
  "./test/_generated/api": () => Promise.resolve(_generatedApi),
};

type TestDataModel = GenericDataModel;

describe("db handlers (direct)", () => {
  describe("create", () => {
    test("creates a document in a collection", async () => {
      const t = convexTest(schema, modules);

      await t.run(async (ctx: GenericMutationCtx<TestDataModel>) => {
        const doc = await DB.create.handler(
          ctx,
          {
            betterAuthSchema: JSON.stringify({}),
            data: {
              name: "John",
              email: "john@example.com",
              emailVerified: false,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
            model: "user",
          },
          schema,
        );

        // create handler returns the document object, not the ID
        expect(doc).toMatchObject({ name: "John", email: "john@example.com" });
      });
    });

    test("creates a post with all field types", async () => {
      const t = convexTest(schema, modules);

      await t.run(async (ctx: GenericMutationCtx<TestDataModel>) => {
        const doc = await DB.create.handler(
          ctx,
          {
            betterAuthSchema: JSON.stringify({}),
            data: {
              title: "Test Post",
              slug: "test-post-direct",
              content: "Hello world",
              published: true,
              authorId: "test-author",
              createdAt: Date.now(),
            },
            model: "posts",
          },
          schema,
        );

        // create handler returns the document object, not the ID
        expect(doc).toMatchObject({
          title: "Test Post",
          slug: "test-post-direct",
          published: true,
        });
      });
    });
  });

  describe("findOne", () => {
    test("finds a document by _id", async () => {
      const t = convexTest(schema, modules);

      await t.run(async (ctx: GenericMutationCtx<TestDataModel>) => {
        // First create a document
        const id = await ctx.db.insert("posts", {
          title: "Find Me",
          slug: "find-me-direct",
          authorId: "author-1",
          createdAt: Date.now(),
        });

        // Then find it
        const doc = await DB.findOne.handler(
          ctx as any,
          {
            betterAuthSchema: JSON.stringify({}),
            model: "posts",
            select: undefined,
            where: [{ field: "_id", operator: "eq", value: id }],
          },
          schema,
        );

        expect(doc).toMatchObject({ title: "Find Me" });
      });
    });
  });

  describe("findMany", () => {
    test("finds multiple documents with limit", async () => {
      const t = convexTest(schema, modules);

      await t.run(async (ctx: GenericMutationCtx<TestDataModel>) => {
        // Create multiple documents
        await ctx.db.insert("posts", {
          title: "Post 1",
          slug: "post-1-dir",
          authorId: "author-1",
          createdAt: Date.now(),
        });
        await ctx.db.insert("posts", {
          title: "Post 2",
          slug: "post-2-dir",
          authorId: "author-1",
          createdAt: Date.now(),
        });
        await ctx.db.insert("posts", {
          title: "Post 3",
          slug: "post-3-dir",
          authorId: "author-2",
          createdAt: Date.now(),
        });

        // Find by authorId
        const docs = await DB.findMany.handler(
          ctx as any,
          {
            betterAuthSchema: JSON.stringify({}),
            model: "posts",
            limit: 10,
            where: [{ field: "authorId", operator: "eq", value: "author-1" }],
          },
          schema,
        );

        expect(docs.length).toBe(2);
        expect(docs[0]).toMatchObject({ title: "Post 1" });
        expect(docs[1]).toMatchObject({ title: "Post 2" });
      });
    });
  });

  describe("count", () => {
    test("counts documents matching filter", async () => {
      const t = convexTest(schema, modules);

      await t.run(async (ctx: GenericMutationCtx<TestDataModel>) => {
        // Create documents
        await ctx.db.insert("posts", {
          title: "Published 1",
          slug: "pub-1-dir",
          authorId: "author-1",
          published: true,
          createdAt: Date.now(),
        });
        await ctx.db.insert("posts", {
          title: "Published 2",
          slug: "pub-2-dir",
          authorId: "author-1",
          published: true,
          createdAt: Date.now(),
        });
        await ctx.db.insert("posts", {
          title: "Draft",
          slug: "draft-dir",
          authorId: "author-1",
          published: false,
          createdAt: Date.now(),
        });

        // Count published posts
        const count = await DB.count.handler(
          ctx as any,
          {
            betterAuthSchema: JSON.stringify({}),
            model: "posts",
            where: [{ field: "published", operator: "eq", value: true }],
          },
          schema,
        );

        expect(count).toBe(2);
      });
    });
  });

  describe("update", () => {
    test("updates a document", async () => {
      const t = convexTest(schema, modules);

      await t.run(async (ctx: GenericMutationCtx<TestDataModel>) => {
        // Create a document
        const id = await ctx.db.insert("posts", {
          title: "Original Title",
          slug: "original-slug-dir",
          authorId: "author-1",
          createdAt: Date.now(),
        });

        // Update it
        const updated = await DB.update.handler(
          ctx,
          {
            betterAuthSchema: JSON.stringify({}),
            model: "posts",
            update: { title: "Updated Title" },
            where: [{ field: "_id", operator: "eq", value: id }],
          },
          schema,
        );

        expect(updated).toMatchObject({ title: "Updated Title" });

        const doc = await ctx.db.get(id);
        expect(doc?.title).toBe("Updated Title");
      });
    });
  });

  describe("deleteOne", () => {
    test("deletes a document", async () => {
      const t = convexTest(schema, modules);

      await t.run(async (ctx: GenericMutationCtx<TestDataModel>) => {
        // Create a document
        const id = await ctx.db.insert("posts", {
          title: "To Delete",
          slug: "to-delete-dir",
          authorId: "author-1",
          createdAt: Date.now(),
        });

        let doc = await ctx.db.get(id);
        expect(doc).toBeDefined();

        // Delete it
        await DB.deleteOne.handler(
          ctx,
          {
            betterAuthSchema: JSON.stringify({}),
            model: "posts",
            where: [{ field: "_id", operator: "eq", value: id }],
          },
          schema,
        );

        doc = await ctx.db.get(id);
        expect(doc).toBeNull();
      });
    });
  });

  describe("auth-specific tables", () => {
    test("creates a user with all better-auth fields", async () => {
      const t = convexTest(schema, modules);

      await t.run(async (ctx: GenericMutationCtx<TestDataModel>) => {
        const doc = await DB.create.handler(
          ctx,
          {
            betterAuthSchema: JSON.stringify({}),
            data: {
              name: "Test User",
              email: "test@example.com",
              emailVerified: false,
              image: "https://example.com/avatar.png",
              createdAt: Date.now(),
              updatedAt: Date.now(),
              role: "user",
              banned: false,
            },
            model: "user",
          },
          schema,
        );

        // create handler returns the document object, not the ID
        expect(doc).toMatchObject({
          name: "Test User",
          email: "test@example.com",
          emailVerified: false,
          role: "user",
          banned: false,
        });
      });
    });

    test("creates and retrieves a session", async () => {
      const t = convexTest(schema, modules);

      await t.run(async (ctx: GenericMutationCtx<TestDataModel>) => {
        // Create a user first
        const userId = await ctx.db.insert("user", {
          name: "Session User",
          email: "session@example.com",
          emailVerified: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        // Create a session
        const sessionToken = "test-session-token-direct-123";
        const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

        await DB.create.handler(
          ctx,
          {
            betterAuthSchema: JSON.stringify({}),
            data: {
              token: sessionToken,
              userId: userId as string,
              expiresAt,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
            model: "session",
          },
          schema,
        );

        // Find the session by token
        const session = await DB.findOne.handler(
          ctx as any,
          {
            betterAuthSchema: JSON.stringify({}),
            model: "session",
            select: undefined,
            where: [{ field: "token", operator: "eq", value: sessionToken }],
          },
          schema,
        );

        expect(session).toMatchObject({
          token: sessionToken,
          userId: userId as string,
        });
      });
    });
  });
});

