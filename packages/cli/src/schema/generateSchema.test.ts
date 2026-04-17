import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { generateVexSchema } from "./generateSchema";
import {
  text,
  number,
  checkbox,
  date,
  select,
  defineConfig,
  defineCollection,
} from "@vexcms/core";

const TEST_DIR = join(__dirname, ".test-output");

const SELECT_OPTIONS = [
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
];

describe("generateVexSchema", () => {
  beforeEach(() => {
    if (!existsSync(TEST_DIR)) {
      mkdirSync(TEST_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  it("generates schema for collection with text fields", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: {
            title: text({ required: true }),
            slug: text({ required: true, min: { value: 3 } }),
            excerpt: text({ required: false }),
          },
        }),
      ],
    });

    const outPath = join(TEST_DIR, "vex.schema.ts");
    generateVexSchema({ config });

    const output = readFileSync(outPath, "utf-8");

    expect(output).toContain(
      'import { defineSchema, defineTable } from "convex/server"',
    );
    expect(output).toContain("posts:");
    expect(output).toContain("defineTable({");
    expect(output).toContain("title: v.string()");
    expect(output).toContain("slug: v.string()");
    expect(output).toContain("excerpt: v.optional(v.string())");
  });

  it("generates schema for collection with number fields", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "products",
          fields: {
            price: number({ required: true }),
            stock: number({ required: false }),
          },
        }),
      ],
    });

    generateVexSchema({ config });

    const outPath = join(TEST_DIR, "vex.schema.ts");
    const output = readFileSync(outPath, "utf-8");

    expect(output).toContain("price: v.number()");
    expect(output).toContain("stock: v.optional(v.number())");
  });

  it("generates schema for collection with checkbox fields", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: {
            published: checkbox({ required: true }),
            featured: checkbox({ required: false }),
          },
        }),
      ],
    });

    generateVexSchema({ config });

    const outPath = join(TEST_DIR, "vex.schema.ts");
    const output = readFileSync(outPath, "utf-8");

    expect(output).toContain("published: v.boolean()");
    expect(output).toContain("featured: v.optional(v.boolean())");
  });

  it("generates schema for collection with date fields (stored as Unix ms timestamp)", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "events",
          fields: {
            startsAt: date({ required: true }),
            endsAt: date({ required: false }),
          },
        }),
      ],
    });

    generateVexSchema({ config });

    const outPath = join(TEST_DIR, "vex.schema.ts");
    const output = readFileSync(outPath, "utf-8");

    // dates are stored as v.number() (Unix ms)
    expect(output).toContain("startsAt: v.number()");
    expect(output).toContain("endsAt: v.optional(v.number())");
  });

  it("generates schema for collection with select fields", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: {
            status: select({ required: true, options: SELECT_OPTIONS }),
            tags: select({
              required: false,
              hasMany: true,
              options: [
                { label: "News", value: "news" },
                { label: "Tutorial", value: "tutorial" },
              ],
            }),
          },
        }),
      ],
    });

    generateVexSchema({ config });

    const outPath = join(TEST_DIR, "vex.schema.ts");
    const output = readFileSync(outPath, "utf-8");

    expect(output).toContain(
      'status: v.array(v.union(v.literal("draft"), v.literal("published")))',
    );
    expect(output).toContain(
      'tags: v.optional(v.array(v.union(v.literal("news"), v.literal("tutorial"))))',
    );
  });

  it("handles collection with no fields", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "empty",
          fields: {},
        }),
      ],
    });

    generateVexSchema({ config });

    const outPath = join(TEST_DIR, "vex.schema.ts");
    const output = readFileSync(outPath, "utf-8");

    expect(output).toContain("empty: defineTable({})");
  });

  it("creates output directory if it doesn't exist", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: {
            title: text({ required: true }),
          },
        }),
      ],
    });

    const nestedPath = join(TEST_DIR, "nested", "deep", "vex.schema.ts");
    expect(existsSync(join(TEST_DIR, "nested", "deep"))).toBe(false);

    generateVexSchema({ config });

    expect(existsSync(join(TEST_DIR, "nested", "deep"))).toBe(true);
    expect(existsSync(nestedPath)).toBe(true);
  });

  // ─── comprehensive ─────────────────────────────────────────────────────────

  it("comprehensive: generates correct validators for every field type in a single collection", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "all_fields",
          fields: {
            title: text({ required: true }),
            body: text({ required: false }),
            score: number({ required: true }),
            rating: number({ required: false }),
            published: checkbox({ required: true }),
            featured: checkbox({ required: false }),
            publishedAt: date({ required: true }),
            archivedAt: date({ required: false }),
            status: select({ required: true, options: SELECT_OPTIONS }),
            tags: select({
              required: false,
              hasMany: true,
              options: [
                { label: "News", value: "news" },
                { label: "Tutorial", value: "tutorial" },
              ],
            }),
          },
        }),
      ],
    });

    generateVexSchema({ config });

    const outPath = join(TEST_DIR, "vex.schema.ts");
    const output = readFileSync(outPath, "utf-8");

    expect(output).toContain(
      'import { defineSchema, defineTable } from "convex/server"',
    );
    expect(output).toContain("all_fields:");

    // text
    expect(output).toContain("title: v.string()");
    expect(output).toContain("body: v.optional(v.string())");

    // number
    expect(output).toContain("score: v.number()");
    expect(output).toContain("rating: v.optional(v.number())");

    // checkbox
    expect(output).toContain("published: v.boolean()");
    expect(output).toContain("featured: v.optional(v.boolean())");

    // date (stored as number)
    expect(output).toContain("publishedAt: v.number()");
    expect(output).toContain("archivedAt: v.optional(v.number())");

    // select
    expect(output).toContain(
      'status: v.array(v.union(v.literal("draft"), v.literal("published")))',
    );
    expect(output).toContain(
      'tags: v.optional(v.array(v.union(v.literal("news"), v.literal("tutorial"))))',
    );
  });
});
