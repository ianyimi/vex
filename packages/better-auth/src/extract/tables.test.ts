import { describe, it, expect } from "vitest";
import { extractAuthTables } from "./tables";
import { admin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";

describe("extractAuthTables", () => {
  describe("minimal config (no plugins, no additionalFields)", () => {
    it("returns user table with base fields", () => {
      const tables = extractAuthTables({});
      const user = tables.find((t) => t.slug === "user")!;
      expect(user).toBeDefined();
      expect(user.fields.name).toEqual({ validator: "v.string()" });
      expect(user.fields.email).toEqual({ validator: "v.string()" });
      expect(user.fields.emailVerified).toEqual({ validator: "v.boolean()" });
      expect(user.fields.image).toEqual({
        validator: "v.optional(v.string())",
      });
      expect(user.fields.createdAt).toEqual({ validator: "v.number()" });
      expect(user.fields.updatedAt).toEqual({ validator: "v.number()" });
    });

    it("does not include 'id' in any table fields", () => {
      const tables = extractAuthTables({});
      for (const table of tables) {
        expect(table.fields.id).toBeUndefined();
      }
    });

    it("returns at least 4 tables (user, session, account, verification)", () => {
      const tables = extractAuthTables({});
      const slugs = tables.map((t) => t.slug);
      expect(slugs).toContain("user");
      expect(slugs).toContain("session");
      expect(slugs).toContain("account");
      expect(slugs).toContain("verification");
    });

    it("session table has userId as v.id() referencing user", () => {
      const tables = extractAuthTables({});
      const session = tables.find((t) => t.slug === "session")!;
      expect(session.fields.userId).toEqual({ validator: 'v.id("user")' });
    });

    it("account table has userId as v.id() referencing user", () => {
      const tables = extractAuthTables({});
      const account = tables.find((t) => t.slug === "account")!;
      expect(account.fields.userId).toEqual({ validator: 'v.id("user")' });
    });

    it("session table has date fields as v.number()", () => {
      const tables = extractAuthTables({});
      const session = tables.find((t) => t.slug === "session")!;
      expect(session.fields.expiresAt).toEqual({ validator: "v.number()" });
      expect(session.fields.createdAt).toEqual({ validator: "v.number()" });
      expect(session.fields.updatedAt).toEqual({ validator: "v.number()" });
    });

    it("session table does not include 'id' field", () => {
      const tables = extractAuthTables({});
      const session = tables.find((t) => t.slug === "session")!;
      expect(session.fields.id).toBeUndefined();
    });

    it("session table has indexes for token and userId", () => {
      const tables = extractAuthTables({});
      const session = tables.find((t) => t.slug === "session")!;
      expect(session.indexes).toContainEqual({
        name: "by_token",
        fields: ["token"],
      });
      expect(session.indexes).toContainEqual({
        name: "by_userId",
        fields: ["userId"],
      });
    });

    it("account table has indexes", () => {
      const tables = extractAuthTables({});
      const account = tables.find((t) => t.slug === "account")!;
      expect(account.indexes).toContainEqual({
        name: "by_userId",
        fields: ["userId"],
      });
    });

    it("verification table has identifier index", () => {
      const tables = extractAuthTables({});
      const verification = tables.find((t) => t.slug === "verification")!;
      expect(verification.indexes).toContainEqual({
        name: "by_identifier",
        fields: ["identifier"],
      });
    });
  });

  describe("custom modelNames", () => {
    it("uses custom user modelName as table slug and in v.id() references", () => {
      const tables = extractAuthTables({
        user: { modelName: "users" },
      });
      // user table uses custom slug
      const user = tables.find((t) => t.slug === "users");
      expect(user).toBeDefined();
      // no table with old slug
      expect(tables.find((t) => t.slug === "user")).toBeUndefined();

      // references in other tables point to custom slug
      const session = tables.find((t) => t.slug === "session")!;
      expect(session.fields.userId).toEqual({ validator: 'v.id("users")' });

      const account = tables.find((t) => t.slug === "account")!;
      expect(account.fields.userId).toEqual({ validator: 'v.id("users")' });
    });

    it("uses custom session modelName as table slug", () => {
      const tables = extractAuthTables({
        session: { modelName: "sessions" },
      });
      const session = tables.find((t) => t.slug === "sessions");
      expect(session).toBeDefined();
    });

    it("uses custom account modelName as table slug", () => {
      const tables = extractAuthTables({
        account: { modelName: "accounts" },
      });
      const account = tables.find((t) => t.slug === "accounts");
      expect(account).toBeDefined();
    });
  });

  describe("user additionalFields", () => {
    it("merges additionalFields into user table", () => {
      const tables = extractAuthTables({
        user: {
          additionalFields: {
            bio: { type: "string", required: true },
          },
        },
      });
      const user = tables.find((t) => t.slug === "user")!;
      expect(user.fields.bio).toEqual({ validator: "v.string()" });
      // base fields still present
      expect(user.fields.name).toEqual({ validator: "v.string()" });
    });

    it("additionalField with required: false wraps in v.optional()", () => {
      const tables = extractAuthTables({
        user: {
          additionalFields: {
            nickname: { type: "string", required: false },
          },
        },
      });
      const user = tables.find((t) => t.slug === "user")!;
      expect(user.fields.nickname).toEqual({
        validator: "v.optional(v.string())",
      });
    });

    it("additionalField can reference another table", () => {
      const tables = extractAuthTables({
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
      const user = tables.find((t) => t.slug === "user")!;
      expect(user.fields.orgId).toEqual({
        validator: 'v.id("organization")',
      });
    });
  });

  describe("with admin plugin", () => {
    it("admin plugin adds fields to user table", () => {
      const tables = extractAuthTables({
        plugins: [admin()],
      });
      const user = tables.find((t) => t.slug === "user")!;
      expect(user.fields.role).toBeDefined();
      expect(user.fields.banned).toBeDefined();
      expect(user.fields.banReason).toBeDefined();
      expect(user.fields.banExpires).toBeDefined();
    });

    it("admin plugin adds impersonatedBy to session table", () => {
      const tables = extractAuthTables({
        plugins: [admin()],
      });
      const session = tables.find((t) => t.slug === "session")!;
      expect(session.fields.impersonatedBy).toBeDefined();
    });

    it("admin impersonatedBy is an optional string (no reference in schema)", () => {
      const tables = extractAuthTables({
        plugins: [admin()],
      });
      const session = tables.find((t) => t.slug === "session")!;
      // better-auth stores impersonatedBy as a plain string, not a typed reference
      expect(session.fields.impersonatedBy).toEqual({
        validator: "v.optional(v.string())",
      });
    });
  });

  describe("with next-cookies plugin (no schema contribution)", () => {
    it("does not add extra tables or fields", () => {
      const without = extractAuthTables({});
      const withPlugin = extractAuthTables({
        plugins: [nextCookies()],
      });
      expect(withPlugin.length).toBe(without.length);
      // user table field count unchanged
      const userWith = withPlugin.find((t) => t.slug === "user")!;
      const userWithout = without.find((t) => t.slug === "user")!;
      expect(Object.keys(userWith.fields).length).toBe(
        Object.keys(userWithout.fields).length,
      );
    });
  });

  describe("session additionalFields", () => {
    it("merges additionalFields into session table", () => {
      const tables = extractAuthTables({
        session: {
          additionalFields: {
            device: { type: "string", required: false },
          },
        },
      });
      const session = tables.find((t) => t.slug === "session")!;
      expect(session.fields.device).toEqual({
        validator: "v.optional(v.string())",
      });
    });
  });

  describe("account additionalFields", () => {
    it("merges additionalFields into account table", () => {
      const tables = extractAuthTables({
        account: {
          additionalFields: {
            metadata: { type: "json", required: false },
          },
        },
      });
      const account = tables.find((t) => t.slug === "account")!;
      expect(account.fields.metadata).toEqual({
        validator: "v.optional(v.any())",
      });
    });
  });
});
