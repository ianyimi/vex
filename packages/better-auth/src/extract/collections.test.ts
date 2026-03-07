import { describe, it, expect } from "vitest";
import { extractAuthCollections } from "./collections";
import { admin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";

describe("extractAuthCollections", () => {
  describe("minimal config (no plugins, no additionalFields)", () => {
    it("returns user collection with base fields as VexFields", () => {
      const collections = extractAuthCollections({});
      const user = collections.find((c) => c.slug === "user")!;
      expect(user).toBeDefined();

      // Check field types
      expect(user.config.fields.name._meta.type).toBe("text");
      expect(user.config.fields.name._meta.required).toBe(true);
      expect(user.config.fields.email._meta.type).toBe("text");
      expect(user.config.fields.email._meta.required).toBe(true);
      expect(user.config.fields.emailVerified._meta.type).toBe("checkbox");
      expect(user.config.fields.emailVerified._meta.required).toBe(true);
      expect(user.config.fields.image._meta.type).toBe("text");
      expect(user.config.fields.image._meta.required).toBeFalsy();
      expect(user.config.fields.createdAt._meta.type).toBe("date");
      expect(user.config.fields.createdAt._meta.required).toBe(true);
      expect(user.config.fields.updatedAt._meta.type).toBe("date");
      expect(user.config.fields.updatedAt._meta.required).toBe(true);
    });

    it("does not include 'id' in any collection fields", () => {
      const collections = extractAuthCollections({});
      for (const collection of collections) {
        expect(collection.config.fields.id).toBeUndefined();
      }
    });

    it("returns at least 4 collections (user, session, account, verification)", () => {
      const collections = extractAuthCollections({});
      const slugs = collections.map((c) => c.slug);
      expect(slugs).toContain("user");
      expect(slugs).toContain("session");
      expect(slugs).toContain("account");
      expect(slugs).toContain("verification");
    });

    it("session collection has userId as relationship to user", () => {
      const collections = extractAuthCollections({});
      const session = collections.find((c) => c.slug === "session")!;
      expect(session.config.fields.userId._meta.type).toBe("relationship");
      expect(session.config.fields.userId._meta.to).toBe("user");
      expect(session.config.fields.userId._meta.required).toBe(true);
    });

    it("account collection has userId as relationship to user", () => {
      const collections = extractAuthCollections({});
      const account = collections.find((c) => c.slug === "account")!;
      expect(account.config.fields.userId._meta.type).toBe("relationship");
      expect(account.config.fields.userId._meta.to).toBe("user");
    });

    it("session collection has date fields as date type", () => {
      const collections = extractAuthCollections({});
      const session = collections.find((c) => c.slug === "session")!;
      expect(session.config.fields.expiresAt._meta.type).toBe("date");
      expect(session.config.fields.createdAt._meta.type).toBe("date");
      expect(session.config.fields.updatedAt._meta.type).toBe("date");
    });

    it("session collection has indexes for token and userId", () => {
      const collections = extractAuthCollections({});
      const session = collections.find((c) => c.slug === "session")!;
      expect(session.config.indexes).toContainEqual({
        name: "by_token",
        fields: ["token"],
      });
      expect(session.config.indexes).toContainEqual({
        name: "by_userId",
        fields: ["userId"],
      });
    });
  });

  describe("custom modelNames", () => {
    it("uses custom user modelName as collection slug and in relationship references", () => {
      const collections = extractAuthCollections({
        user: { modelName: "users" },
      });
      const user = collections.find((c) => c.slug === "users");
      expect(user).toBeDefined();
      expect(collections.find((c) => c.slug === "user")).toBeUndefined();

      const session = collections.find((c) => c.slug === "session")!;
      expect(session.config.fields.userId._meta.to).toBe("users");

      const account = collections.find((c) => c.slug === "account")!;
      expect(account.config.fields.userId._meta.to).toBe("users");
    });
  });

  describe("user additionalFields", () => {
    it("merges additionalFields into user collection", () => {
      const collections = extractAuthCollections({
        user: {
          additionalFields: {
            bio: { type: "string", required: true },
          },
        },
      });
      const user = collections.find((c) => c.slug === "user")!;
      expect(user.config.fields.bio._meta.type).toBe("text");
      expect(user.config.fields.bio._meta.required).toBe(true);
      // base fields still present
      expect(user.config.fields.name).toBeDefined();
    });

    it("additionalField with required: false creates optional field", () => {
      const collections = extractAuthCollections({
        user: {
          additionalFields: {
            nickname: { type: "string", required: false },
          },
        },
      });
      const user = collections.find((c) => c.slug === "user")!;
      expect(user.config.fields.nickname._meta.type).toBe("text");
      expect(user.config.fields.nickname._meta.required).toBeFalsy();
    });

    it("additionalField can reference another table", () => {
      const collections = extractAuthCollections({
        user: {
          additionalFields: {
            orgId: {
              type: "string",
              required: true,
              references: { model: "organization", field: "id" },
            },
          },
        },
      });
      const user = collections.find((c) => c.slug === "user")!;
      expect(user.config.fields.orgId._meta.type).toBe("relationship");
      expect(user.config.fields.orgId._meta.to).toBe("organization");
    });
  });

  describe("with admin plugin", () => {
    it("admin plugin adds fields to user collection", () => {
      const collections = extractAuthCollections({
        plugins: [admin()],
      });
      const user = collections.find((c) => c.slug === "user")!;
      expect(user.config.fields.role).toBeDefined();
      expect(user.config.fields.banned).toBeDefined();
    });

    it("admin plugin adds impersonatedBy to session collection", () => {
      const collections = extractAuthCollections({
        plugins: [admin()],
      });
      const session = collections.find((c) => c.slug === "session")!;
      expect(session.config.fields.impersonatedBy).toBeDefined();
    });
  });

  describe("with next-cookies plugin (no schema contribution)", () => {
    it("does not add extra collections or fields", () => {
      const without = extractAuthCollections({});
      const withPlugin = extractAuthCollections({
        plugins: [nextCookies()],
      });
      expect(withPlugin.length).toBe(without.length);
      const userWith = withPlugin.find((c) => c.slug === "user")!;
      const userWithout = without.find((c) => c.slug === "user")!;
      expect(Object.keys(userWith.config.fields).length).toBe(
        Object.keys(userWithout.config.fields).length,
      );
    });
  });

  describe("json and array field types", () => {
    it("maps json additionalField to json VexField", () => {
      const collections = extractAuthCollections({
        account: {
          additionalFields: {
            metadata: { type: "json", required: false },
          },
        },
      });
      const account = collections.find((c) => c.slug === "account")!;
      expect(account.config.fields.metadata._meta.type).toBe("json");
    });

    it("maps string[] additionalField to array VexField", () => {
      const collections = extractAuthCollections({
        user: {
          additionalFields: {
            role: { type: "string[]", required: true },
          },
        },
      });
      const user = collections.find((c) => c.slug === "user")!;
      expect(user.config.fields.role._meta.type).toBe("array");
      expect(user.config.fields.role._meta.field._meta.type).toBe("text");
    });
  });
});
