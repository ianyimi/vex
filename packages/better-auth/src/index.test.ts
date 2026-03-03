import { describe, it, expect } from "vitest";
import { vexBetterAuth } from "./index";
import { admin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";

describe("vexBetterAuth", () => {
  it("returns correct adapter shape", () => {
    const adapter = vexBetterAuth();
    expect(adapter.name).toBe("better-auth");
    expect(Object.keys(adapter).sort()).toEqual(["name", "tables"]);
  });

  it("returns user table in tables array", () => {
    const adapter = vexBetterAuth();
    const user = adapter.tables.find((t) => t.slug === "user")!;
    expect(user).toBeDefined();
    expect(user.fields.name).toEqual({ validator: "v.string()" });
    expect(user.fields.email).toEqual({ validator: "v.string()" });
  });

  it("returns infrastructure tables (session, account, verification)", () => {
    const adapter = vexBetterAuth();
    const slugs = adapter.tables.map((t) => t.slug);
    expect(slugs).toContain("session");
    expect(slugs).toContain("account");
    expect(slugs).toContain("verification");
  });

  it("custom modelNames propagate into slugs and v.id() references", () => {
    const adapter = vexBetterAuth({
      config: {
        user: { modelName: "users" },
        session: { modelName: "sessions" },
        account: { modelName: "accounts" },
      },
    });
    // user table uses custom slug
    const user = adapter.tables.find((t) => t.slug === "users");
    expect(user).toBeDefined();

    const session = adapter.tables.find((t) => t.slug === "sessions")!;
    expect(session.fields.userId).toEqual({ validator: 'v.id("users")' });

    const account = adapter.tables.find((t) => t.slug === "accounts")!;
    expect(account.fields.userId).toEqual({ validator: 'v.id("users")' });
  });

  it("admin plugin adds user fields and session impersonatedBy", () => {
    const adapter = vexBetterAuth({
      config: { plugins: [admin()] },
    });
    const user = adapter.tables.find((t) => t.slug === "user")!;
    expect(user.fields.role).toBeDefined();
    expect(user.fields.banned).toBeDefined();

    const session = adapter.tables.find((t) => t.slug === "session")!;
    expect(session.fields.impersonatedBy).toBeDefined();
  });

  it("next-cookies plugin has no schema effect", () => {
    const withPlugin = vexBetterAuth({
      config: { plugins: [nextCookies()] },
    });
    const without = vexBetterAuth();
    expect(withPlugin.tables.length).toBe(without.tables.length);
  });

  it("test app config produces expected adapter", () => {
    const adapter = vexBetterAuth({
      config: {
        user: {
          modelName: "user",
          additionalFields: {
            role: { type: "string[]", defaultValue: ["user"], required: true },
          },
        },
        session: { modelName: "session" },
        account: { modelName: "account" },
        verification: { modelName: "verification" },
        plugins: [
          admin({ adminRoles: ["admin"], defaultRole: "user" }),
          nextCookies(),
        ],
      },
    });

    expect(adapter.name).toBe("better-auth");

    // user table has role and admin fields
    const user = adapter.tables.find((t) => t.slug === "user")!;
    expect(user.fields.role).toBeDefined();
    expect(user.fields.banned).toBeDefined();

    // v.id() references use "user"
    const session = adapter.tables.find((t) => t.slug === "session")!;
    expect(session.fields.userId).toEqual({ validator: 'v.id("user")' });

    const account = adapter.tables.find((t) => t.slug === "account")!;
    expect(account.fields.userId).toEqual({ validator: 'v.id("user")' });
  });
});
