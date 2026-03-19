import { describe, it, expect } from "vitest";
import { generateVexSchema } from "./generate";
import type { VexConfig } from "../types";

/** Minimal config factory for versioning tests */
function makeConfig(overrides: Partial<VexConfig> = {}): VexConfig {
  return {
    basePath: "/admin",
    collections: [],
    globals: [],
    admin: {
      meta: { titleSuffix: "| Admin", favicon: "/favicon.ico" },
      sidebar: { hideGlobals: false },
      user: "users",
    },
    auth: { collections: [], type: "betterAuth" as any } as any,
    schema: { outputPath: "convex/vex.schema.ts", typesOutputPath: "convex/vex.types.ts", autoMigrate: true, autoRemove: false },
    ...overrides,
  };
}

describe("generateVexSchema — versioning", () => {
  it("injects _status, _version, _publishedAt for versioned collection", () => {
    const config = makeConfig({
      collections: [
        {
          slug: "articles",
          fields: {
            title: { type: "text" } as any,
          },
          versions: { drafts: true },
        },
      ],
    });

    const output = generateVexSchema({ config });

    expect(output).toContain('vex_status: v.optional(v.union(v.literal("draft"), v.literal("published")))');
    expect(output).toContain("vex_version: v.optional(v.number())");
    expect(output).toContain("vex_publishedAt: v.optional(v.number())");
  });

  it("injects vex_status on non-versioned collection but NOT vex_version/vex_publishedAt", () => {
    const config = makeConfig({
      collections: [
        {
          slug: "categories",
          fields: {
            name: { type: "text" } as any,
          },
        },
      ],
    });

    const output = generateVexSchema({ config });

    // Check the categories table section only (before VEX SYSTEM TABLES)
    const categoriesSection = output.split("VEX SYSTEM TABLES")[0];
    expect(categoriesSection).toContain("vex_status");
    expect(categoriesSection).not.toContain("vex_version");
    expect(categoriesSection).not.toContain("vex_publishedAt");
  });

  it("generates vex_versions table when any collection is versioned", () => {
    const config = makeConfig({
      collections: [
        {
          slug: "posts",
          fields: { title: { type: "text" } as any },
          versions: { drafts: true },
        },
        {
          slug: "categories",
          fields: { name: { type: "text" } as any },
        },
      ],
    });

    const output = generateVexSchema({ config });

    expect(output).toContain("export const vex_versions = defineTable({");
    expect(output).toContain("collection: v.string()");
    expect(output).toContain("documentId: v.string()");
    expect(output).toContain("version: v.number()");
    expect(output).toContain("snapshot: v.any()");
    expect(output).toContain("isAutosave: v.boolean()");
    expect(output).toContain('.index("by_document", ["collection", "documentId"])');
    expect(output).toContain('.index("by_document_version", ["collection", "documentId", "version"])');
    expect(output).toContain('.index("by_autosave", ["collection", "documentId", "isAutosave"])');
  });

  it("always generates vex_versions table even when no collection is versioned", () => {
    const config = makeConfig({
      collections: [
        {
          slug: "categories",
          fields: { name: { type: "text" } as any },
        },
      ],
    });

    const output = generateVexSchema({ config });

    expect(output).toContain("export const vex_versions = defineTable({");
  });

});
