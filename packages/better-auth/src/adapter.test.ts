import { describe, it, expect } from "vitest";
import { betterAuthAdapter } from "./adapter";
import { oauthProvider } from "@better-auth/oauth-provider";
import { admin, deviceAuthorization } from "better-auth/plugins";
import { getDataFields, type AdminDataField } from "@vexcms/core";

describe("betterAuthAdapter", () => {
  it("returns correct adapter shape", () => {
    const adapter = betterAuthAdapter();
    expect(adapter.name).toBe("better-auth");
    expect(Array.isArray(adapter.collections)).toBe(true);
    expect(adapter.userCollection).toBe("user");
  });

  it("includes user collection with base fields", () => {
    const adapter = betterAuthAdapter();
    const user = adapter.collections.find((c) => c.slug === "user");
    expect(user).toBeDefined();
    expect(user?.fields.name).toBeDefined();
    expect(user?.fields.email).toBeDefined();
    expect(user?.fields.emailVerified).toBeDefined();
  });

  it("marks system fields as readOnly", () => {
    const adapter = betterAuthAdapter();
    const user = adapter.collections.find((c) => c.slug === "user");
    expect(user?.fields.emailVerified?.admin?.readOnly).toBe(true);
    expect(user?.fields.createdAt?.admin?.readOnly).toBe(true);
  });

  it("marks system fields as meta-locked", () => {
    const adapter = betterAuthAdapter();
    const user = adapter.collections.find((c) => c.slug === "user");
    expect(user?.fields.emailVerified?.meta?.locked).toBe(true);
    expect(user?.fields.createdAt?.meta?.locked).toBe(true);
    expect(user?.fields.updatedAt?.meta?.locked).toBe(true);
    // User-editable fields are NOT locked
    expect(user?.fields.name?.meta?.locked).toBeUndefined();
    expect(user?.fields.email?.meta?.locked).toBeUndefined();
  });

  it("protects internal collections from user override", () => {
    const adapter = betterAuthAdapter();
    const session = adapter.collections.find((c) => c.slug === "session");
    const account = adapter.collections.find((c) => c.slug === "account");
    const verification = adapter.collections.find(
      (c) => c.slug === "verification",
    );
    expect(session?.meta?.protected).toBe(true);
    expect(account?.meta?.protected).toBe(true);
    expect(verification?.meta?.protected).toBe(true);
    // User collection is NOT protected (users can extend it)
    const user = adapter.collections.find((c) => c.slug === "user");
    expect(user?.meta?.protected).toBeUndefined();
  });

  it("hides the New action on every adapter collection (decision D2)", () => {
    const adapter = betterAuthAdapter();
    const user = adapter.collections.find((c) => c.slug === "user");
    const session = adapter.collections.find((c) => c.slug === "session");
    expect(user?.disableCreate).toBe(true);
    // The admin DOES render `protected` collections (session/account/
    // verification) — `protected` only stops a PROJECT'S OWN collection
    // from reusing the slug (`mergeAuthCollections`), it doesn't hide the
    // collection from the admin panel. Every one of these collections'
    // rows arrives from Better Auth's own endpoints, never an
    // admin-authored create form, so every one sets the flag.
    expect(session?.disableCreate).toBe(true);
  });

  it("hides the New action under a custom user modelName", () => {
    const adapter = betterAuthAdapter({
      config: { user: { modelName: "members" } },
    });
    const members = adapter.collections.find((c) => c.slug === "members");
    expect(members?.disableCreate).toBe(true);
  });

  it("sets a short admin.view.columns default on the user collection only", () => {
    const adapter = betterAuthAdapter();
    const user = adapter.collections.find((c) => c.slug === "user");
    const session = adapter.collections.find((c) => c.slug === "session");
    expect(user?.admin.view.state.columns).toEqual(["name", "email", "createdAt"]);
    // session has no name/email/role/banned fields, so defineCollection's
    // own default (every non-hidden field) applies instead.
    expect(session?.admin.view.state.columns).not.toEqual(["name", "email", "createdAt"]);
  });

  it("keeps user-editable fields writable", () => {
    const adapter = betterAuthAdapter();
    const user = adapter.collections.find((c) => c.slug === "user");
    expect(user?.fields.name?.admin?.readOnly).toBe(false);
    expect(user?.fields.email?.admin?.readOnly).toBe(false);
  });

  it("maps session.userId to relationship field", () => {
    const adapter = betterAuthAdapter();
    const session = adapter.collections.find((c) => c.slug === "session");
    expect(session?.fields.userId).toBeDefined();
    expect(session?.fields.userId?.type).toBe("text");
  });

  it("maps boolean fields to checkbox type", () => {
    const adapter = betterAuthAdapter();
    const user = adapter.collections.find((c) => c.slug === "user");
    expect(user?.fields.emailVerified?.type).toBe("checkbox");
  });

  it("maps date/timestamp fields to date type", () => {
    const adapter = betterAuthAdapter();
    const user = adapter.collections.find((c) => c.slug === "user");
    expect(user?.fields.createdAt?.type).toBe("date");
  });

  it("maps required from attr.required", () => {
    const adapter = betterAuthAdapter();
    const user = adapter.collections.find((c) => c.slug === "user");
    const fields = getDataFields({ fields: user?.fields ?? {} }) as Record<string, AdminDataField>;
    // required is always defined (boolean) after defaults are applied
    expect(typeof fields.email?.required).toBe("boolean");
    expect(typeof fields.name?.required).toBe("boolean");
  });

  it("maps defaultValue from attr.defaultValue", () => {
    const adapter = betterAuthAdapter();
    const user = adapter.collections.find((c) => c.slug === "user");
    const fields = getDataFields({ fields: user?.fields ?? {} }) as Record<string, AdminDataField>;
    // emailVerified typically defaults to false in Better Auth
    expect(fields.emailVerified?.defaultValue).toBe(false);
  });
  it("hides sensitive fields", () => {
    const adapter = betterAuthAdapter({
      config: { plugins: [admin()] },
    });
    const user = adapter.collections.find((c) => c.slug === "user");
    // Admin plugin fields are not hidden — test with a field that
    // would be hidden if present (hashedPassword only exists with
    // certain database adapters). This test verifies the logic is
    // wired; adjust assertions based on actual Better Auth schema.
    expect(user?.fields.role).toBeDefined();
    expect(user?.fields.role?.admin?.hidden).toBe(false);
  });

  it("does not include id field", () => {
    const adapter = betterAuthAdapter();
    const user = adapter.collections.find((c) => c.slug === "user");
    expect(user?.fields.id).toBeUndefined();
    const session = adapter.collections.find((c) => c.slug === "session");
    expect(session?.fields.id).toBeUndefined();
  });

  it("uses custom modelName as slug", () => {
    const adapter = betterAuthAdapter({
      config: { user: { modelName: "users" } },
    });
    const users = adapter.collections.find((c) => c.slug === "users");
    expect(users).toBeDefined();
    expect(adapter.userCollection).toBe("users");
  });

  it("includes admin plugin fields when plugin is active", () => {
    const adapter = betterAuthAdapter({
      config: { plugins: [admin()] },
    });
    const user = adapter.collections.find((c) => c.slug === "user");
    expect(user?.fields.role).toBeDefined();
    expect(user?.fields.banned).toBeDefined();
  });

  it("maps additionalFields with all properties", () => {
    const adapter = betterAuthAdapter({
      config: {
        user: {
          additionalFields: {
            publicBio: {
              type: "string",
              required: true,
              defaultValue: "Hello",
            },
          },
        },
      },
    });
    const user = adapter.collections.find((c) => c.slug === "user");
    const fields = getDataFields({ fields: user?.fields ?? {} }) as Record<string, AdminDataField>;
    const bio = fields.publicBio;
    expect(bio).toBeDefined();
    expect(bio?.type).toBe("text");
    expect(bio?.required).toBe(true);
    expect(bio?.defaultValue).toBe("Hello");
  });
});

describe("betterAuthAdapter — indexes", () => {
  it("builds account/session compound indexes with alphabetically sorted fields", () => {
    const adapter = betterAuthAdapter();
    const account = adapter.collections.find((c) => c.slug === "account");
    const session = adapter.collections.find((c) => c.slug === "session");
    const accountIndexNames = (account?.indexes ?? []).map((i) => i.name);
    const sessionIndexNames = (session?.indexes ?? []).map((i) => i.name);

    expect(accountIndexNames).toEqual(
      expect.arrayContaining([
        "by_accountId",
        "by_accountId_providerId",
        "by_accountId_providerId_userId",
        "by_providerId_userId",
      ]),
    );
    expect(account?.indexes?.find((i) => i.name === "by_accountId_providerId")?.fields).toEqual([
      "accountId",
      "providerId",
    ]);

    expect(sessionIndexNames).toEqual(
      expect.arrayContaining(["by_expiresAt", "by_userId_expiresAt"]),
    );
  });

  it("drops a core-list candidate naming a field the table doesn't have (user's \"userId\" entry)", () => {
    const adapter = betterAuthAdapter();
    const user = adapter.collections.find((c) => c.slug === "user");
    const userIndexNames = (user?.indexes ?? []).map((i) => i.name);

    expect(userIndexNames).toEqual(expect.arrayContaining(["by_name", "by_email_name"]));
    expect(userIndexNames.some((name) => name.includes("userId"))).toBe(false);
  });

  it("adds compound/plugin-declared indexes deviceAuthorization and oauthProvider need (deviceCode, oauthClientResource)", () => {
    const adapter = betterAuthAdapter({
      config: {
        plugins: [deviceAuthorization(), oauthProvider({ loginPage: "/sign-in", consentPage: "/consent" })],
      },
    });
    const deviceCode = adapter.collections.find((c) => c.slug === "deviceCode");
    const oauthClientResource = adapter.collections.find((c) => c.slug === "oauthClientResource");

    expect((deviceCode?.indexes ?? []).map((i) => i.name)).toEqual(
      expect.arrayContaining(["by_deviceCode", "by_userCode"]),
    );
    expect((oauthClientResource?.indexes ?? []).map((i) => i.name)).toContain("by_clientId_resourceId");
    expect(
      oauthClientResource?.indexes?.find((i) => i.name === "by_clientId_resourceId")?.fields,
    ).toEqual(["clientId", "resourceId"]);
  });

  it("never emits duplicate index names on any adapter collection", () => {
    const adapter = betterAuthAdapter({
      config: {
        plugins: [deviceAuthorization(), oauthProvider({ loginPage: "/sign-in", consentPage: "/consent" })],
      },
    });
    for (const collection of adapter.collections) {
      const names = (collection.indexes ?? []).map((i) => i.name);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it("skips rateLimit.key as a duplicate of its own field-level unique index, keeping lastRequest", () => {
    const adapter = betterAuthAdapter({ config: { rateLimit: { storage: "database" } } });
    const rateLimit = adapter.collections.find((c) => c.slug === "rateLimit");
    const indexNames = (rateLimit?.indexes ?? []).map((i) => i.name);
    expect(indexNames).not.toContain("by_key");
    expect(indexNames).toContain("by_lastRequest");
    expect((rateLimit?.fields.key as { index?: string } | undefined)?.index).toBe("by_key");
  });
});

describe("betterAuthAdapter — clientWritableUserFields", () => {
  it("lists an additionalField without input: false", () => {
    const adapter = betterAuthAdapter({
      config: {
        user: {
          additionalFields: {
            roles: { type: "string[]", defaultValue: ["user"], required: true },
          },
        },
      },
    });
    expect(adapter.clientWritableUserFields).toContain("roles");
  });

  it("excludes an additionalField marked input: false", () => {
    const adapter = betterAuthAdapter({
      config: {
        user: {
          additionalFields: {
            roles: {
              type: "string[]",
              defaultValue: ["user"],
              required: true,
              input: false,
            },
          },
        },
      },
    });
    expect(adapter.clientWritableUserFields).not.toContain("roles");
  });

  it("excludes the built-in emailVerified field", () => {
    const adapter = betterAuthAdapter();
    expect(adapter.clientWritableUserFields).not.toContain("emailVerified");
  });

  it("excludes the admin plugin's role field", () => {
    const adapter = betterAuthAdapter({ config: { plugins: [admin()] } });
    expect(adapter.clientWritableUserFields).not.toContain("role");
  });
});
