import { describe, it, expect } from "vitest";
import { mergeAuthTableWithCollection } from "./merge";
import { defineCollection } from "../config/defineCollection";
import { text } from "../fields/text";
import { number } from "../fields/number";
import { select } from "../fields/select";
import type { AuthTableDefinition } from "../types";

describe("mergeAuthTableWithCollection", () => {
  const users = defineCollection("users", {
    fields: {
      name: text({ label: "Name" }),
      email: text({ label: "Email" }),
      postCount: number({ label: "Post Count", admin: { readOnly: true } }),
      role: select({
        label: "Role",
        options: [
          { value: "admin", label: "Admin" },
          { value: "user", label: "User" },
        ],
      }),
    },
  });

  it("merges auth table fields with user collection fields", () => {
    const authTable: AuthTableDefinition = {
      slug: "users",
      fields: {
        name: { valueType: "v.string()" },
        email: { valueType: "v.string()" },
        emailVerified: { valueType: "v.boolean()" },
        createdAt: { valueType: "v.number()" },
        updatedAt: { valueType: "v.number()" },
      },
    };

    const result = mergeAuthTableWithCollection({
      authTable,
      collection: users,
    });

    // Auth-provided fields that user also defines
    expect(result.overlapping).toContain("name");
    expect(result.overlapping).toContain("email");

    // Auth-only fields (user doesn't define these)
    expect(result.authOnly).toContain("emailVerified");
    expect(result.authOnly).toContain("createdAt");
    expect(result.authOnly).toContain("updatedAt");

    // User-only fields (auth doesn't provide these)
    expect(result.userOnly).toContain("postCount");
    expect(result.userOnly).toContain("role");

    // All fields should be in the merged output
    expect(Object.keys(result.fields)).toContain("name");
    expect(Object.keys(result.fields)).toContain("email");
    expect(Object.keys(result.fields)).toContain("emailVerified");
    expect(Object.keys(result.fields)).toContain("createdAt");
    expect(Object.keys(result.fields)).toContain("postCount");
    expect(Object.keys(result.fields)).toContain("role");
  });

  it("auth valueType wins on overlapping fields", () => {
    const authTable: AuthTableDefinition = {
      slug: "users",
      fields: {
        email: { valueType: "v.string()" },
      },
    };

    const result = mergeAuthTableWithCollection({
      authTable,
      collection: users,
    });

    // The auth valueType should win for schema generation
    expect(result.fields["email"]).toBe("v.string()");
  });

  it("user-only fields converted via fieldToValueType", () => {
    const authTable: AuthTableDefinition = {
      slug: "users",
      fields: {
        email: { valueType: "v.string()" },
      },
    };

    const result = mergeAuthTableWithCollection({
      authTable,
      collection: users,
    });

    // postCount is user-only, number field without required → optional
    expect(result.fields["postCount"]).toBe("v.optional(v.number())");
    // role is user-only, select field without required → optional union
    expect(result.fields["role"]).toContain("v.optional(");
  });

  it("handles auth table with no fields", () => {
    const authTable: AuthTableDefinition = {
      slug: "users",
      fields: {},
    };

    const result = mergeAuthTableWithCollection({
      authTable,
      collection: users,
    });

    // All fields are user-only
    expect(result.userOnly).toContain("name");
    expect(result.userOnly).toContain("email");
    expect(result.userOnly).toContain("postCount");
    expect(result.userOnly).toContain("role");
    expect(result.authOnly).toEqual([]);
    expect(result.overlapping).toEqual([]);
  });

  it("handles fully auth-driven collection (no user-defined fields overlap)", () => {
    const minimalUsers = defineCollection("users", {
      fields: {
        postCount: number({ admin: { readOnly: true } }),
      },
    });

    const authTable: AuthTableDefinition = {
      slug: "users",
      fields: {
        name: { valueType: "v.string()" },
        email: { valueType: "v.string()" },
        createdAt: { valueType: "v.number()" },
      },
    };

    const result = mergeAuthTableWithCollection({
      authTable,
      collection: minimalUsers,
    });

    expect(result.authOnly).toContain("name");
    expect(result.authOnly).toContain("email");
    expect(result.authOnly).toContain("createdAt");
    expect(result.userOnly).toContain("postCount");
    expect(result.overlapping).toEqual([]);
  });
});
