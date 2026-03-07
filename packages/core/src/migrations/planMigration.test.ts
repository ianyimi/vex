import { describe, it, expect } from "vitest";
import { planMigration } from "./planMigration";
import type { SchemaDiff, SchemaFieldInfo } from "./diffSchema";
import { defineCollection } from "../config/defineCollection";
import { defineConfig } from "../config/defineConfig";
import { text } from "../fields/text";
import { number } from "../fields/number";
import { checkbox } from "../fields/checkbox";
import { select } from "../fields/select";
import type { VexAuthAdapter } from "../types";

const minimalAuth: VexAuthAdapter = { name: "better-auth", collections: [] };

function field(table: string, fieldName: string, valueType: string): SchemaFieldInfo {
  return { table, field: fieldName, valueType, isOptional: false };
}

function optionalField(table: string, fieldName: string, valueType: string): SchemaFieldInfo {
  return { table, field: fieldName, valueType, isOptional: true };
}

function emptyDiff(): SchemaDiff {
  return { addedRequired: [], addedOptional: [], newRequired: [], removedFields: [], needsMigration: [] };
}

describe("planMigration", () => {
  it("maps diff fields to config defaultValues correctly", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({ required: true, defaultValue: "Untitled" }),
        slug: text(),
      },
    });

    const config = defineConfig({
      collections: [posts],
      auth: minimalAuth,
    });

    const diff: SchemaDiff = {
      addedRequired: [field("posts", "title", "v.string()")],
      newRequired: [],
      needsMigration: [field("posts", "title", "v.string()")],
    };

    const ops = planMigration({ diff, config });

    expect(ops).toEqual([
      { table: "posts", field: "title", defaultValue: "Untitled" },
    ]);
  });

  it("skips auth-only tables (no matching user collection)", () => {
    const config = defineConfig({
      collections: [],
      auth: minimalAuth,
    });

    const diff: SchemaDiff = {
      addedRequired: [field("account", "scope", "v.string()")],
      newRequired: [],
      needsMigration: [field("account", "scope", "v.string()")],
    };

    const ops = planMigration({ diff, config });

    expect(ops).toEqual([]);
  });

  it("handles text field defaultValue (string)", () => {
    const posts = defineCollection("posts", {
      fields: {
        displayName: text({ required: true, defaultValue: "Anonymous" }),
      },
    });

    const config = defineConfig({
      collections: [posts],
      auth: minimalAuth,
    });

    const diff: SchemaDiff = {
      addedRequired: [field("posts", "displayName", "v.string()")],
      newRequired: [],
      needsMigration: [field("posts", "displayName", "v.string()")],
    };

    const ops = planMigration({ diff, config });

    expect(ops).toEqual([
      { table: "posts", field: "displayName", defaultValue: "Anonymous" },
    ]);
  });

  it("handles number field defaultValue", () => {
    const posts = defineCollection("posts", {
      fields: {
        views: number({ required: true, defaultValue: 0 }),
      },
    });

    const config = defineConfig({
      collections: [posts],
      auth: minimalAuth,
    });

    const diff: SchemaDiff = {
      addedRequired: [field("posts", "views", "v.number()")],
      newRequired: [],
      needsMigration: [field("posts", "views", "v.number()")],
    };

    const ops = planMigration({ diff, config });

    expect(ops).toEqual([
      { table: "posts", field: "views", defaultValue: 0 },
    ]);
  });

  it("handles checkbox field defaultValue (boolean)", () => {
    const posts = defineCollection("posts", {
      fields: {
        featured: checkbox({ required: true, defaultValue: false }),
      },
    });

    const config = defineConfig({
      collections: [posts],
      auth: minimalAuth,
    });

    const diff: SchemaDiff = {
      addedRequired: [field("posts", "featured", "v.boolean()")],
      newRequired: [],
      needsMigration: [field("posts", "featured", "v.boolean()")],
    };

    const ops = planMigration({ diff, config });

    expect(ops).toEqual([
      { table: "posts", field: "featured", defaultValue: false },
    ]);
  });

  it("handles select field defaultValue (string)", () => {
    const posts = defineCollection("posts", {
      fields: {
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
      collections: [posts],
      auth: minimalAuth,
    });

    const diff: SchemaDiff = {
      addedRequired: [
        field("posts", "status", 'v.union(v.literal("draft"),v.literal("published"))'),
      ],
      newRequired: [],
      needsMigration: [
        field("posts", "status", 'v.union(v.literal("draft"),v.literal("published"))'),
      ],
    };

    const ops = planMigration({ diff, config });

    expect(ops).toEqual([
      { table: "posts", field: "status", defaultValue: "draft" },
    ]);
  });

  it("returns empty array when no migrations needed", () => {
    const config = defineConfig({
      collections: [],
      auth: minimalAuth,
    });

    const diff = emptyDiff();

    const ops = planMigration({ diff, config });

    expect(ops).toEqual([]);
  });

  it("handles merged auth+user collection (user-defined field gets migrated, auth field skipped)", () => {
    const users = defineCollection("users", {
      fields: {
        displayName: text({ required: true, defaultValue: "User" }),
      },
    });

    const authAdapter: VexAuthAdapter = {
      name: "better-auth",
      collections: [
        defineCollection("users", {
          fields: {
            email: text({ required: true, defaultValue: "" }),
            emailVerified: checkbox({ required: true, defaultValue: false }),
          },
        }),
      ],
    };

    const config = defineConfig({
      collections: [users],
      auth: authAdapter,
    });

    const diff: SchemaDiff = {
      addedRequired: [
        field("users", "displayName", "v.string()"),
        field("users", "email", "v.string()"),
      ],
      newRequired: [],
      needsMigration: [
        field("users", "displayName", "v.string()"),
        field("users", "email", "v.string()"),
      ],
    };

    const ops = planMigration({ diff, config });

    // displayName is user-defined with defaultValue → migrated
    // email is auth field, not in user's collection fields (it was merged at schema gen time) → skipped
    expect(ops).toEqual([
      { table: "users", field: "displayName", defaultValue: "User" },
    ]);
  });

  it("skips field in diff that is not found in collection config", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({ required: true, defaultValue: "Untitled" }),
      },
    });

    const config = defineConfig({
      collections: [posts],
      auth: minimalAuth,
    });

    const diff: SchemaDiff = {
      addedRequired: [
        field("posts", "title", "v.string()"),
        field("posts", "unknownField", "v.string()"),
      ],
      newRequired: [],
      needsMigration: [
        field("posts", "title", "v.string()"),
        field("posts", "unknownField", "v.string()"),
      ],
    };

    const ops = planMigration({ diff, config });

    // unknownField is not in collection config → skipped
    expect(ops).toEqual([
      { table: "posts", field: "title", defaultValue: "Untitled" },
    ]);
  });

  it("skips optional field (required not set)", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text(),
      },
    });

    const config = defineConfig({
      collections: [posts],
      auth: minimalAuth,
    });

    const diff: SchemaDiff = {
      addedOptional: [optionalField("posts", "title", "v.optional(v.string())")],
      addedRequired: [],
      newRequired: [],
      removedFields: [],
      needsMigration: [optionalField("posts", "title", "v.optional(v.string())")],
    };

    const ops = planMigration({ diff, config });

    // text() without required → not migrated, even if it has a defaultValue
    expect(ops).toEqual([]);
  });

  it("skips optional field even with explicit defaultValue", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({ defaultValue: "hello" }),
      },
    });

    const config = defineConfig({
      collections: [posts],
      auth: minimalAuth,
    });

    const diff: SchemaDiff = {
      addedOptional: [optionalField("posts", "title", "v.optional(v.string())")],
      addedRequired: [],
      newRequired: [],
      removedFields: [],
      needsMigration: [optionalField("posts", "title", "v.optional(v.string())")],
    };

    const ops = planMigration({ diff, config });

    // Optional field with defaultValue but no required → not migrated
    expect(ops).toEqual([]);
  });

  it("handles multiple fields across multiple tables", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({ required: true, defaultValue: "Untitled" }),
        views: number({ required: true, defaultValue: 0 }),
      },
    });

    const categories = defineCollection("categories", {
      fields: {
        name: text({ required: true, defaultValue: "Uncategorized" }),
      },
    });

    const config = defineConfig({
      collections: [posts, categories],
      auth: minimalAuth,
    });

    const diff: SchemaDiff = {
      addedRequired: [
        field("posts", "title", "v.string()"),
        field("posts", "views", "v.number()"),
        field("categories", "name", "v.string()"),
      ],
      newRequired: [],
      needsMigration: [
        field("posts", "title", "v.string()"),
        field("posts", "views", "v.number()"),
        field("categories", "name", "v.string()"),
      ],
    };

    const ops = planMigration({ diff, config });

    expect(ops).toEqual([
      { table: "posts", field: "title", defaultValue: "Untitled" },
      { table: "posts", field: "views", defaultValue: 0 },
      { table: "categories", field: "name", defaultValue: "Uncategorized" },
    ]);
  });
});
