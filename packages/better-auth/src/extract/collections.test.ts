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
      expect(user.fields.name.type).toBe("text");
      expect(user.fields.name.required).toBe(true);
      expect(user.fields.email.type).toBe("text");
      expect(user.fields.email.required).toBe(true);
      expect(user.fields.emailVerified.type).toBe("checkbox");
      expect(user.fields.emailVerified.required).toBe(true);
      expect(user.fields.image.type).toBe("text");
      expect(user.fields.image.required).toBeFalsy();
      expect(user.fields.createdAt.type).toBe("date");
      expect(user.fields.createdAt.required).toBe(true);
      expect(user.fields.updatedAt.type).toBe("date");
      expect(user.fields.updatedAt.required).toBe(true);
    });

    it("does not include 'id' in any collection fields", () => {
      const collections = extractAuthCollections({});
      for (const collection of collections) {
        expect(collection.fields.id).toBeUndefined();
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
      expect(session.fields.userId.type).toBe("relationship");
      expect(session.fields.userId.to).toBe("user");
      expect(session.fields.userId.required).toBe(true);
    });

    it("account collection has userId as relationship to user", () => {
      const collections = extractAuthCollections({});
      const account = collections.find((c) => c.slug === "account")!;
      expect(account.fields.userId.type).toBe("relationship");
      expect(account.fields.userId.to).toBe("user");
    });

    it("session collection has date fields as date type", () => {
      const collections = extractAuthCollections({});
      const session = collections.find((c) => c.slug === "session")!;
      expect(session.fields.expiresAt.type).toBe("date");
      expect(session.fields.createdAt.type).toBe("date");
      expect(session.fields.updatedAt.type).toBe("date");
    });

    it("session collection has indexes for token and userId", () => {
      const collections = extractAuthCollections({});
      const session = collections.find((c) => c.slug === "session")!;
      expect(session.indexes).toContainEqual({
        name: "by_token",
        fields: ["token"],
      });
      expect(session.indexes).toContainEqual({
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
      expect(session.fields.userId.to).toBe("users");

      const account = collections.find((c) => c.slug === "account")!;
      expect(account.fields.userId.to).toBe("users");
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
      expect(user.fields.bio.type).toBe("text");
      expect(user.fields.bio.required).toBe(true);
      // base fields still present
      expect(user.fields.name).toBeDefined();
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
      expect(user.fields.nickname.type).toBe("text");
      expect(user.fields.nickname.required).toBeFalsy();
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
      expect(user.fields.orgId.type).toBe("relationship");
      expect(user.fields.orgId.to).toBe("organization");
    });
  });

  describe("with admin plugin", () => {
    it("admin plugin adds fields to user collection", () => {
      const collections = extractAuthCollections({
        plugins: [admin()],
      });
      const user = collections.find((c) => c.slug === "user")!;
      expect(user.fields.role).toBeDefined();
      expect(user.fields.banned).toBeDefined();
    });

    it("admin plugin adds impersonatedBy to session collection", () => {
      const collections = extractAuthCollections({
        plugins: [admin()],
      });
      const session = collections.find((c) => c.slug === "session")!;
      expect(session.fields.impersonatedBy).toBeDefined();
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
      expect(Object.keys(userWith.fields).length).toBe(
        Object.keys(userWithout.fields).length,
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
      expect(account.fields.metadata.type).toBe("json");
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
      expect(user.fields.role.type).toBe("array");
      expect(user.fields.role.field.type).toBe("text");
    });
  });
});
