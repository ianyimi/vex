import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";

import type { VexConfig } from "@vexcms/core";

import { syncSchemaImports } from "./generateSchema";
import { logger } from "./logger";

// syncSchemaImports reads only `schema.autoRemove`.
const CONFIG = { schema: { autoRemove: false } } as unknown as VexConfig;
const OUTPUT = "/convex/vex.schema.ts";

const generated = (tables: Record<string, string>) =>
  Object.entries(tables)
    .map(([name, body]) => `export const ${name} = ${body}\n`)
    .join("\n");

describe("syncSchemaImports", () => {
  let dir: string;
  let schemaPath: string;
  let warn: MockInstance<(msg: string) => void>;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "vex-cli-schema-"));
    schemaPath = join(dir, "schema.ts");
    warn = vi.spyOn(logger, "warn").mockImplementation(() => {});
    vi.spyOn(logger, "success").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    rmSync(dir, { recursive: true, force: true });
  });

  it("wires a new table whose name only appears as another table's field", () => {
    writeFileSync(
      schemaPath,
      `import { defineSchema, defineTable } from "convex/server";
import { posts } from "./vex.schema";

export default defineSchema({
  posts,
  products: defineTable({ tags: v.array(v.string()) }),
});
`,
    );
    syncSchemaImports(schemaPath, generated({ posts: "defineTable({})", tags: "defineTable({})" }), OUTPUT, CONFIG);

    const schema = readFileSync(schemaPath, "utf-8");
    expect(schema).toContain('import { posts, tags } from "./vex.schema";');
    expect(schema).toContain("defineSchema({\n  tags,\n  posts,");
  });

  it("treats a computed key backed by an imported string constant as listed", () => {
    writeFileSync(join(dir, "constants.ts"), 'export const TABLE_SLUG_ACCOUNTS = "account" as const;\n');
    const source = `import { defineSchema, defineTable } from "convex/server";
import { TABLE_SLUG_ACCOUNTS } from "./constants";

export default defineSchema({
  [TABLE_SLUG_ACCOUNTS]: defineTable({ providerId: v.string() }),
});
`;
    writeFileSync(schemaPath, source);
    syncSchemaImports(schemaPath, generated({ account: "defineTable({ providerId: v.number() })" }), OUTPUT, CONFIG);

    expect(readFileSync(schemaPath, "utf-8")).toBe(source);
    expect(warn).not.toHaveBeenCalled();
  });

  it("falls back to a text match while a key can't be resolved", () => {
    const source = `export default defineSchema({
  [TABLES.account]: defineTable({}),
});
`;
    writeFileSync(schemaPath, source);
    syncSchemaImports(schemaPath, generated({ account: "defineTable({})" }), OUTPUT, CONFIG);
    expect(readFileSync(schemaPath, "utf-8")).toBe(source);
  });

  it("warns once per table, again only when the difference changes", () => {
    const source = `export default defineSchema({
  posts: defineTable({ title: v.string() }),
});
`;
    writeFileSync(schemaPath, source);
    const drifted = generated({ posts: "defineTable({ title: v.string(), slug: v.string() })" });

    syncSchemaImports(schemaPath, drifted, OUTPUT, CONFIG);
    syncSchemaImports(schemaPath, drifted, OUTPUT, CONFIG);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]![0]).toContain("fields only in convex/vex.schema.ts: slug");

    syncSchemaImports(schemaPath, generated({ posts: "defineTable({ title: v.string(), body: v.string() })" }), OUTPUT, CONFIG);
    expect(warn).toHaveBeenCalledTimes(2);
    expect(readFileSync(schemaPath, "utf-8")).toBe(source);
  });

  it("stays quiet when the hand-written table matches the generated one", () => {
    writeFileSync(
      schemaPath,
      `export default defineSchema({
  vex_globals: defineTable({
    slug: v.string(),
    data: v.any(),
  }).index("by_slug", ["slug"]),
});
`,
    );
    syncSchemaImports(
      schemaPath,
      generated({ vex_globals: 'defineTable({\n\tslug: v.string(),\n\tdata: v.any(),\n})\n  .index("by_slug", ["slug"])' }),
      OUTPUT,
      CONFIG,
    );
    expect(warn).not.toHaveBeenCalled();
  });
});
