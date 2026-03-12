import { describe, it, expect } from "vitest";
import { mergeAuthCollectionWithUserCollection } from "./merge";
import { defineCollection } from "../config/defineCollection";
import { text } from "../fields/text";
import { number } from "../fields/number";
import { select } from "../fields/select";
import { date } from "../fields/date";
import { checkbox } from "../fields/checkbox";

describe("mergeAuthCollectionWithUserCollection", () => {
  const userCollection = defineCollection({ slug: "users",
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

  it("merges auth collection fields with user collection fields", () => {
    const authCollection = defineCollection({ slug: "users",
      fields: {
        name: text({ required: true, defaultValue: "" }),
        email: text({ required: true, defaultValue: "" }),
        emailVerified: checkbox({ required: true, defaultValue: false }),
        createdAt: date({ required: true, defaultValue: 0 }),
        updatedAt: date({ required: true, defaultValue: 0 }),
      },
    });

    const result = mergeAuthCollectionWithUserCollection({
      authCollection,
      userCollection,
    });

    expect(result.overlapping).toContain("name");
    expect(result.overlapping).toContain("email");

    expect(result.authOnly).toContain("emailVerified");
    expect(result.authOnly).toContain("createdAt");
    expect(result.authOnly).toContain("updatedAt");

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

  it("auth VexField wins on overlapping fields for schema", () => {
    const authCollection = defineCollection({ slug: "users",
      fields: {
        email: text({ required: true, defaultValue: "" }),
      },
    });

    const result = mergeAuthCollectionWithUserCollection({
      authCollection,
      userCollection,
    });

    // The auth VexField's type should be preserved
    const emailField = result.fields["email"];
    expect(emailField.type).toBe("text");
    expect(emailField.required).toBe(true);
  });

  it("preserves user admin config on overlapping fields", () => {
    const authCollection = defineCollection({ slug: "users",
      fields: {
        email: text({ required: true, defaultValue: "" }),
      },
    });

    const result = mergeAuthCollectionWithUserCollection({
      authCollection,
      userCollection,
    });

    // User's label should be preserved
    const emailField = result.fields["email"];
    expect((emailField as { label?: string }).label).toBe("Email");
  });

  it("handles auth collection with no fields", () => {
    const authCollection = defineCollection({ slug: "users",
      fields: {},
    });

    const result = mergeAuthCollectionWithUserCollection({
      authCollection,
      userCollection,
    });

    expect(result.userOnly).toContain("name");
    expect(result.userOnly).toContain("email");
    expect(result.userOnly).toContain("postCount");
    expect(result.userOnly).toContain("role");
    expect(result.authOnly).toEqual([]);
    expect(result.overlapping).toEqual([]);
  });

  it("handles fully auth-driven collection (no user-defined fields overlap)", () => {
    const minimalUsers = defineCollection({ slug: "users",
      fields: {
        postCount: number({ admin: { readOnly: true } }),
      },
    });

    const authCollection = defineCollection({ slug: "users",
      fields: {
        name: text({ required: true, defaultValue: "" }),
        email: text({ required: true, defaultValue: "" }),
        createdAt: date({ required: true, defaultValue: 0 }),
      },
    });

    const result = mergeAuthCollectionWithUserCollection({
      authCollection,
      userCollection: minimalUsers,
    });

    expect(result.authOnly).toContain("name");
    expect(result.authOnly).toContain("email");
    expect(result.authOnly).toContain("createdAt");
    expect(result.userOnly).toContain("postCount");
    expect(result.overlapping).toEqual([]);
  });
});
