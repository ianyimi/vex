import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { generateVexSchema } from "./generateSchema";
import { text, defineConfig, defineCollection } from "@vexcms/core";

const TEST_DIR = join(__dirname, ".test-output");

describe("generateVexSchema", () => {
  beforeEach(() => {
    // Create test directory
    if (!existsSync(TEST_DIR)) {
      mkdirSync(TEST_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test directory
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

    // Should import Convex schema functions
    expect(output).toContain(
      'import { defineSchema, defineTable } from "convex/server"',
    );

    // Should define posts table
    expect(output).toContain("posts:");
    expect(output).toContain("defineTable({");

    // Should include required fields
    expect(output).toContain("title: v.string()");
    expect(output).toContain("slug: v.string()");

    // Should include optional fields
    expect(output).toContain("excerpt: v.optional(v.string())");
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

    const outPath = join(TEST_DIR, "vex.schema.ts");
    generateVexSchema({ config });

    const output = readFileSync(outPath, "utf-8");

    // Should still generate schema with empty table
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

    // Directory should be created
    expect(existsSync(join(TEST_DIR, "nested", "deep"))).toBe(true);
    // File should exist
    expect(existsSync(nestedPath)).toBe(true);
  });
});
