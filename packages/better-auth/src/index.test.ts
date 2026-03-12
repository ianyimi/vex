import { describe, it, expect } from "vitest";
import { vexBetterAuth } from "./index";
import { admin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";

describe("vexBetterAuth", () => {
  it("returns correct adapter shape", () => {
    const adapter = vexBetterAuth();
    expect(adapter.name).toBe("better-auth");
    expect(Object.keys(adapter).sort()).toEqual(["collections", "name"]);
  });

  it("returns user collection in collections array", () => {
    const adapter = vexBetterAuth();
    const user = adapter.collections.find((c) => c.slug === "user")!;
    expect(user).toBeDefined();
    expect(user.fields.name.type).toBe("text");
    expect(user.fields.email.type).toBe("text");
  });

  it("returns infrastructure collections (session, account, verification)", () => {
    const adapter = vexBetterAuth();
    const slugs = adapter.collections.map((c) => c.slug);
    expect(slugs).toContain("session");
    expect(slugs).toContain("account");
    expect(slugs).toContain("verification");
  });

  it("custom modelNames propagate into slugs and relationship references", () => {
    const adapter = vexBetterAuth({
      config: {
        user: { modelName: "users" },
        session: { modelName: "sessions" },
        account: { modelName: "accounts" },
      },
    });
    const user = adapter.collections.find((c) => c.slug === "users");
    expect(user).toBeDefined();

    const session = adapter.collections.find((c) => c.slug === "sessions")!;
    expect(session.fields.userId.to).toBe("users");

    const account = adapter.collections.find((c) => c.slug === "accounts")!;
    expect(account.fields.userId.to).toBe("users");
  });

  it("admin plugin adds user fields and session impersonatedBy", () => {
    const adapter = vexBetterAuth({
      config: { plugins: [admin()] },
    });
    const user = adapter.collections.find((c) => c.slug === "user")!;
    expect(user.fields.role).toBeDefined();
    expect(user.fields.banned).toBeDefined();

    const session = adapter.collections.find((c) => c.slug === "session")!;
    expect(session.fields.impersonatedBy).toBeDefined();
  });

  it("next-cookies plugin has no schema effect", () => {
    const withPlugin = vexBetterAuth({
      config: { plugins: [nextCookies()] },
    });
    const without = vexBetterAuth();
    expect(withPlugin.collections.length).toBe(without.collections.length);
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

    const user = adapter.collections.find((c) => c.slug === "user")!;
    expect(user.fields.role).toBeDefined();
    expect(user.fields.banned).toBeDefined();

    const session = adapter.collections.find((c) => c.slug === "session")!;
    expect(session.fields.userId.type).toBe("relationship");
    expect(session.fields.userId.to).toBe("user");

    const account = adapter.collections.find((c) => c.slug === "account")!;
    expect(account.fields.userId.type).toBe("relationship");
    expect(account.fields.userId.to).toBe("user");
  });
});
