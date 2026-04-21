# 21 — VEX Dev Tools: Schema Generation & `vex dev`

## Overview

Implements the missing `@vexcms/core` functions that the already-written CLI imports but cannot call yet. The CLI — `vex dev`, `vex deploy`, `vex generate`, all file-watching, Convex subprocess management, and schema.ts import syncing — is fully implemented. This spec provides the functions it calls. After this spec: `vex dev` in `apps/www` auto-generates `vex.schema.ts`, syncs `convex/schema.ts` imports, and generates typed collection API files whenever `vex.config.ts` changes.

## Design Decisions

- **Codegen lives in `@vexcms/core/src/schema/`** — code generation is a core concern, not a CLI concern. The CLI is orchestration only.
- **Functions return strings, not files** — `generateVexSchema` and `generateVexTypes` return the file content as a string. Prettier formatting and file I/O are handled by the CLI.
- **`generateCollectionQueries` returns a file map** — `Record<string, string>` keyed by paths relative to the `vex/` directory. The CLI handles writing.
- **`CollectionQueryImports` has two fields** — only `generatedDirFromApi` and `generatedDirFromModel` are used by the generated files in this spec. TypeScript's structural typing means the CLI can pass more fields without issue.
- **`commands/dev.ts` keeps `@ts-nocheck`** — it references `c.versions?.drafts` on `CollectionConfig`, which is a future versioning feature not in scope here. Only `commands/generate.ts` and `commands/deploy.ts` have `@ts-nocheck` removed.
- **Select field TypeScript type is `string[]`** — `options` values could produce a typed union (`("draft" | "published")[]`) but this adds complexity. Deferred to a future spec.

## Out of Scope

- Auto-migration (`diffSchema`, `makeFieldsOptional`, `planMigration`) — not implemented, no types added
- Version backfill (`versions`, `drafts` properties on `CollectionConfig`) — future spec
- Auth collections in generated schema — spec 20
- Typed select option values in `generateVexTypes` — future improvement
- Pagination in generated collection model functions

## Target Directory Structure

```
packages/core/src/
  schema/
    generateVexSchema.ts              [NEW] Generates vex.schema.ts content — returns { update, contents }
    generateVexSchema.test.ts         [NEW]
    generateCollectionQueries.ts      [NEW] GENERATED_HEADER, CollectionQueryImports, generateCollectionQueries — stub returning {} (Step 4 incomplete)
    migrate.ts                        [NEW] Stubs for diffSchema, makeFieldsOptional, addRemovedFieldsAsOptional, planMigration (satisfies existing CLI imports)
    index.ts                          [NEW] Re-exports all schema/* exports

  collections/
    schemaGen.ts                      [NEW] collectionConfigToVexSchema — per-collection schema string helper
    schemaGen.test.ts                 [NEW]
    interfaceGen.ts                   [NEW] collectionConfigToInterface — per-collection interface string helper (renamed from typeGen.ts)
    interfaceGen.test.ts              [NEW] Contains generateVexTypes, ADMIN_FIELDS, and slugToPascalCase tests

  types/
    generateVexTypes.ts               [NEW] generateVexTypes — full vex.types.ts file generator
    index.ts                          [NEW]

  config/
    types.ts                          [MODIFY] Add SchemaConfigInput/SchemaConfig + TypesConfigInput/TypesConfig to VexConfigInput/VexConfig
    config.ts                         [MODIFY] Apply schema + types defaults in defineConfig

  index.ts                            [MODIFY] Add export * from "./schema" and export * from "./types"

packages/cli/src/
  commands/generate.ts                [MODIFY] Remove // @ts-nocheck ✅
  commands/deploy.ts                  [MODIFY] Remove // @ts-nocheck ✅
  schema/generateSchema.ts            [DELETE] Stale stub — not yet deleted

apps/www/
  package.json                        [MODIFY] Add @vexcms/cli to devDependencies ✅
```

## Implementation Order

> **Key:**
>
> - `[agent]` — Boilerplate or pattern-following; agent generates this
> - `[dev]` — Core logic; dev implements this

1. `[agent]` **Schema config types** — add `SchemaConfigInput` / `SchemaConfig` to `VexConfig`; update `defineConfig`. After this step: `config.schema.outputPath` resolves and `pnpm build` passes.
2. `[dev]` **`generateVexSchema`** — transforms `VexConfig` into `vex.schema.ts` content. Key function: `generateVexSchema`. After this step: the core of schema generation is complete.
3. `[dev]` **`generateVexTypes`** — transforms `VexConfig` into `vex.types.ts` with document interfaces and config union types. Key function: `generateVexTypes`.
4. `[dev]` **`generateCollectionQueries`** + `GENERATED_HEADER` — generates per-collection typed Convex API and model files. Defines `CollectionQueryImports`. Key function: `generateCollectionQueries`. After this step: `vex dev` runs without crashing.
5. `[agent]` **Wire up + fix CLI** — export from `src/index.ts`, remove `@ts-nocheck` from 2 CLI files, delete stale stub, add CLI to `apps/www`, verify end-to-end.

---

## Step 1: Schema Config Types + `interfaceType` on `ADMIN_FIELDS`

- [x] Modify `packages/core/src/fields/constants.ts` — add `interfaceType` to each field entry
- [x] Modify `packages/core/src/config/types.ts` — add `SchemaConfigInput`, `SchemaConfig`, update `VexConfigInput`, `VexConfig`
- [x] Modify `packages/core/src/config/config.ts` — apply schema defaults in `defineConfig`
- [x] Run `pnpm --filter @vexcms/core build` and verify no errors

### File: `packages/core/src/fields/constants.ts`

Add `interfaceType` to every entry (renamed from spec's `tsType`). This is the TypeScript type string for that field's stored value — used by `generateVexTypes` instead of a switch statement. When you add a new field type later (spec 20 resumption), add `interfaceType` here once and the type generator picks it up automatically.

```typescript
export const ADMIN_FIELDS = {
  text: {
    type: "text",
    interfaceType: "string",
    validator: "v.string()",
    defaultValue: "",
  },
  number: {
    type: "number",
    interfaceType: "number",
    validator: "v.number()",
    defaultValue: 0,
  },
  checkbox: {
    type: "checkbox",
    interfaceType: "boolean",
    validator: "v.boolean()",
    defaultValue: false,
  },
  date: {
    type: "date",
    interfaceType: "number",
    validator: "v.number()",
    defaultValue: undefined,
  },
  select: {
    type: "select",
    interfaceType: "string[]",
    validator: "v.string()",
    defaultValue: [] as string[],
  },
} as const;

export type AdminFieldType =
  (typeof ADMIN_FIELDS)[keyof typeof ADMIN_FIELDS]["type"];
export type AdminFieldValidator =
  (typeof ADMIN_FIELDS)[keyof typeof ADMIN_FIELDS]["validator"];
export type AdminFieldTsType =
  (typeof ADMIN_FIELDS)[keyof typeof ADMIN_FIELDS]["interfaceType"];
```

**Implementation note:** `interfaceType` is also propagated onto field objects and collection configs at resolve time:

- `BaseFieldInput` gains `interfaceType?: string` and `BaseField` gains `interfaceType: string`. Each field config function stamps `ADMIN_FIELDS[type].interfaceType` onto the resolved field. Type generators read `field.interfaceType` directly instead of looking up `ADMIN_FIELDS[field.type].interfaceType` at generation time.
- `CollectionConfigInput` gains `interfaceName?: string` and `CollectionConfig` gains `interfaceName: string`. `defineCollection` sets this to `slugToPascalCase({ slug })`. `slugToPascalCase` lives in `collections/utils.ts`.

### File: `packages/core/src/config/types.ts`

Add the following interfaces _before_ `VexConfigInput`. Append to the existing file — do not replace.

> **Implementation note:** `typesOutputPath` was NOT nested inside `SchemaConfigInput`. Instead, types output gets its own top-level config key. `VexConfigInput.types` holds `TypesConfigInput` and `VexConfig.types` holds `TypesConfig`. This allows the two output paths to be configured independently.

```typescript
export interface SchemaConfigInput {
  /** Path (relative to project root) where `vex.schema.ts` is written. Default: `"/convex/vex.schema.ts"` */
  outputPath?: string;
}

export interface SchemaConfig {
  /** Path where `vex.schema.ts` is written. Always set after defaults are applied. */
  outputPath: string;
}

export interface TypesConfigInput {
  /** Path (relative to project root) where `vex.types.ts` is written. Default: `"/src/vex.types.ts"` (next to `vex.config.ts`) */
  outputPath?: string;
}

export interface TypesConfig {
  /** Path where `vex.types.ts` is written. Always set after defaults are applied. */
  outputPath: string;
}
```

Then update `VexConfigInput` and `VexConfig` to include both keys:

In `VexConfigInput`, add:

```typescript
  schema?: SchemaConfigInput;
  types?: TypesConfigInput;
```

In `VexConfig`, add:

```typescript
schema: SchemaConfig;
types: TypesConfig;
```

### File: `packages/core/src/config/config.ts`

Update `defineConfig` to apply schema and types defaults:

```typescript
export function defineConfig(config?: VexConfigInput): VexConfig {
  return {
    collections: [],
    basePath: "/admin",
    ...config,
    admin: {
      ...config?.admin,
      sidebar: {
        side: "left",
        ...config?.admin?.sidebar,
      },
    },
    schema: {
      outputPath: "/convex/vex.schema.ts",
      ...config?.schema,
    },
    types: {
      outputPath: "/src/vex.types.ts",
      ...config?.types,
    },
  };
}
```

> **Default path for `types.outputPath`:** `/src/vex.types.ts` — placed next to `vex.config.ts` in the project's `src/` directory, not in `convex/`. The CLI resolves it relative to `vex.config.ts` at runtime.

### Tests for schema/types config defaults

```typescript
// packages/core/src/config/config.test.ts (add to existing file or create)
import { describe, it, expect } from "vitest";
import { defineConfig } from "./config";

describe("defineConfig — schema defaults", () => {
  it("applies all schema defaults when schema is omitted", () => {
    const config = defineConfig();
    expect(config.schema.outputPath).toBe("/convex/vex.schema.ts");
    expect(config.types.outputPath).toBe("/src/vex.types.ts");
  });

  it("merges partial schema overrides", () => {
    const config = defineConfig({
      schema: { outputPath: "/backend/vex.schema.ts" },
    });
    expect(config.schema.outputPath).toBe("/backend/vex.schema.ts");
    expect(config.types.outputPath).toBe("/src/vex.types.ts");
  });
});
```

---

## Step 2: `generateVexSchema`

- [x] Create `packages/core/src/collections/schemaGen.ts` — per-collection schema string helper (renamed from `schema.ts`)
- [x] Create `packages/core/src/collections/schemaGen.test.ts`
- [x] Create `packages/core/src/schema/generateVexSchema.ts`
- [x] Create `packages/core/src/schema/generateVexSchema.test.ts`
- [x] Run `pnpm --filter @vexcms/core test` — all tests pass

### File: `packages/core/src/collections/schemaGen.ts`

Handles per-collection schema string generation. Extracted here (instead of inline in `generateVexSchema`) so it can be independently tested and reused. Export it from `collections/index.ts`.

```typescript
import { ADMIN_FIELDS } from "../fields/constants";
import { adminFieldToValidator } from "../fields/validators";
import { CollectionConfig } from "./types";

export function collectionConfigToVexSchema(props: {
  collection: CollectionConfig;
}): string {
  // TODO: implement
  //
  // 1. Iterate Object.entries(props.collection.fields) for [fieldKey, field]:
  //    - Call adminFieldToValidator({ field }) to get the validator string
  //    - Push "\t{fieldKey}: {validator}" to fieldsBlock[]
  //    - If field.index is defined: push `.index("{field.index}", ["{fieldKey}"])` to indexes[]
  //    - If field.type === ADMIN_FIELDS.text.type AND field.searchIndex is defined:
  //        push `.searchIndex("{field.searchIndex.name}", {\n  searchField: "{fieldKey}",\n  filterFields: {JSON.stringify(field.searchIndex.filterFields)},\n})` to searchIndexes[]
  //
  // 2. Assemble:
  //    "export const {slug} = defineTable({\n{fieldsBlock.join(",\n")}\n})"
  //    + indexes.join("") + searchIndexes.join("")
  //
  // Edge cases:
  // - No fields: generate "export const {slug} = defineTable({})" with empty block
  // - No indexes: omit that section entirely (don't emit empty chains)
  throw new Error("Not implemented");
}
```

### File: `packages/core/src/collections/schemaGen.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { defineCollection } from "./config";
import { text, number, checkbox, date, select } from "../fields";
import { collectionConfigToVexSchema } from "./schema";

// ─── Basic output ─────────────────────────────────────────────────────────────

describe("collectionConfigToVexSchema — basic output", () => {
  it("exports a const using the collection slug", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
    });
    const output = collectionConfigToVexSchema({ collection });
    expect(output).toContain("export const posts = defineTable({");
  });

  it("generates an empty defineTable({}) for a collection with no fields", () => {
    const collection = defineCollection({ slug: "empty", fields: {} });
    const output = collectionConfigToVexSchema({ collection });
    expect(output).toContain("export const empty = defineTable({");
    expect(output).not.toContain(".index(");
    expect(output).not.toContain(".searchIndex(");
  });
});

// ─── Field validators ─────────────────────────────────────────────────────────

describe("collectionConfigToVexSchema — field validators", () => {
  it("generates required text field as v.string()", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
    });
    expect(collectionConfigToVexSchema({ collection })).toContain(
      "title: v.string()",
    );
  });

  it("generates optional text field as v.optional(v.string())", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { excerpt: text({ required: false }) },
    });
    expect(collectionConfigToVexSchema({ collection })).toContain(
      "excerpt: v.optional(v.string())",
    );
  });

  it("generates required number field as v.number()", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { views: number({ required: true }) },
    });
    expect(collectionConfigToVexSchema({ collection })).toContain(
      "views: v.number()",
    );
  });

  it("generates optional checkbox field as v.optional(v.boolean())", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { published: checkbox({ required: false }) },
    });
    expect(collectionConfigToVexSchema({ collection })).toContain(
      "published: v.optional(v.boolean())",
    );
  });

  it("generates optional date field as v.optional(v.number())", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { publishedAt: date({ required: false }) },
    });
    expect(collectionConfigToVexSchema({ collection })).toContain(
      "publishedAt: v.optional(v.number())",
    );
  });

  it("generates required select field as v.array(v.union(...))", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: {
        status: select({
          required: true,
          options: [
            { label: "Draft", value: "draft" },
            { label: "Published", value: "published" },
          ],
        }),
      },
    });
    expect(collectionConfigToVexSchema({ collection })).toContain(
      'status: v.array(v.union(v.literal("draft"), v.literal("published")))',
    );
  });
});

// ─── Indexes ─────────────────────────────────────────────────────────────────

describe("collectionConfigToVexSchema — indexes", () => {
  it("appends .index() for a field with an index property", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { slug: text({ required: true, index: "by_slug" }) },
    });
    expect(collectionConfigToVexSchema({ collection })).toContain(
      '.index("by_slug", ["slug"])',
    );
  });

  it("appends multiple .index() chains for multiple indexed fields", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: {
        slug: text({ required: true, index: "by_slug" }),
        authorId: text({ required: true, index: "by_author" }),
      },
    });
    const output = collectionConfigToVexSchema({ collection });
    expect(output).toContain('.index("by_slug", ["slug"])');
    expect(output).toContain('.index("by_author", ["authorId"])');
  });

  it("does not append .index() for fields without an index property", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { title: text({ required: true }) },
    });
    expect(collectionConfigToVexSchema({ collection })).not.toContain(
      ".index(",
    );
  });
});

// ─── Search indexes ───────────────────────────────────────────────────────────

describe("collectionConfigToVexSchema — searchIndex", () => {
  it("appends .searchIndex() for a text field with searchIndex config", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: {
        title: text({
          required: true,
          searchIndex: { name: "search_title", filterFields: ["status"] },
        }),
      },
    });
    const output = collectionConfigToVexSchema({ collection });
    expect(output).toContain('.searchIndex("search_title",');
    expect(output).toContain('searchField: "title"');
    expect(output).toContain('filterFields: ["status"]');
  });

  it("generates empty filterFields array when filterFields is []", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: {
        title: text({
          required: true,
          searchIndex: { name: "search_title", filterFields: [] },
        }),
      },
    });
    expect(collectionConfigToVexSchema({ collection })).toContain(
      "filterFields: []",
    );
  });

  it("does not append .searchIndex() for non-text fields", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { views: number({ required: true }) },
    });
    expect(collectionConfigToVexSchema({ collection })).not.toContain(
      ".searchIndex(",
    );
  });
});

// ─── Integration ─────────────────────────────────────────────────────────────

describe("collectionConfigToVexSchema — integration", () => {
  it("generates a complete schema string for a realistic collection", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: {
        title: text({ required: true }),
        slug: text({ required: true, index: "by_slug" }),
        excerpt: text({ required: false }),
        views: number({ required: true }),
        published: checkbox({ required: false }),
        publishedAt: date({ required: false }),
        status: select({
          required: true,
          options: [
            { label: "Draft", value: "draft" },
            { label: "Published", value: "published" },
          ],
        }),
      },
    });
    const output = collectionConfigToVexSchema({ collection });

    expect(output).toContain("export const posts = defineTable({");
    expect(output).toContain("title: v.string()");
    expect(output).toContain("slug: v.string()");
    expect(output).toContain("excerpt: v.optional(v.string())");
    expect(output).toContain("views: v.number()");
    expect(output).toContain("published: v.optional(v.boolean())");
    expect(output).toContain("publishedAt: v.optional(v.number())");
    expect(output).toContain(
      'status: v.array(v.union(v.literal("draft"), v.literal("published")))',
    );
    expect(output).toContain('.index("by_slug", ["slug"])');
  });
});
```

---

### File: `packages/core/src/schema/generateVexSchema.ts`

Returns `{ update: boolean; contents: string }` — the CLI uses `contents` to write the file and skips the write entirely when `update` is `false` (empty config, no real schema to emit). The CLI handles all disk I/O; this function is pure.

`collectionConfigToVexSchema` lives in `collections/schema.ts` and handles per-collection string generation — see that file's step below.

```typescript
import type { VexConfig } from "../config/types";
import { collectionConfigToVexSchema } from "../collections/schema";

export function generateVexSchema(props: { config: VexConfig }): {
  update: boolean;
  contents: string;
} {
  // TODO: implement
  //
  // 1. Build the header (two lines, no leading whitespace):
  //    "// ⚠️ AUTO-GENERATED BY VEX CMS — DO NOT EDIT ⚠️\n// Run `vex dev` or `vex generate` to update this file."
  //    → Line 1 must be exactly the header string (tests check output.contents.split("\n")[0])
  //    → No leading/trailing spaces — use string concatenation, not indented template literals
  //
  // 2. If props.config.collections is empty, return { update: false, contents: header }
  //    → No imports, no table definitions needed
  //
  // 3. Build imports string:
  //    'import { defineTable } from "convex/server"\nimport { v } from "convex/values"'
  //
  // 4. For each collection, call collectionConfigToVexSchema({ collection }) → string
  //    Join all collection strings with "\n\n"
  //
  // 5. Assemble: [header, "", imports, "", collectionsBlock].join("\n")
  //    Return { update: true, contents: assembled }
  throw new Error("Not implemented");
}
```

### File: `packages/core/src/schema/generateVexSchema.test.ts`

All assertions use `output.contents` (the generated string) and `output.update` (the write flag).

```typescript
import { describe, it, expect } from "vitest";
import { defineConfig, defineCollection } from "../index";
import { text, number, checkbox, date, select } from "../fields";
import { generateVexSchema } from "./generateVexSchema";

const HEADER = "// ⚠️ AUTO-GENERATED BY VEX CMS — DO NOT EDIT ⚠️";

// ─── Header ──────────────────────────────────────────────────────────────────

describe("generateVexSchema — header", () => {
  it("always includes the auto-generated header on line 1", () => {
    const config = defineConfig();
    const output = generateVexSchema({ config });
    expect(output.contents.split("\n")[0]).toBe(HEADER);
  });

  it("returns only the header when there are no collections", () => {
    const config = defineConfig();
    const output = generateVexSchema({ config });
    expect(output.contents).not.toContain("defineTable");
    expect(output.contents).not.toContain("import");
  });

  it("returns update: false when there are no collections", () => {
    const config = defineConfig();
    const output = generateVexSchema({ config });
    expect(output.update).toBe(false);
  });
});

// ─── Imports ─────────────────────────────────────────────────────────────────

describe("generateVexSchema — imports", () => {
  it("includes convex/server and convex/values imports when there are collections", () => {
    const config = defineConfig({
      collections: [
        defineCollection({ slug: "posts", fields: { title: text() } }),
      ],
    });
    const output = generateVexSchema({ config });
    expect(output.contents).toContain(
      'import { defineTable } from "convex/server"',
    );
    expect(output.contents).toContain('import { v } from "convex/values"');
  });

  it("returns update: true when there are collections", () => {
    const config = defineConfig({
      collections: [
        defineCollection({ slug: "posts", fields: { title: text() } }),
      ],
    });
    const output = generateVexSchema({ config });
    expect(output.update).toBe(true);
  });
});

// ─── Fields ──────────────────────────────────────────────────────────────────

describe("generateVexSchema — field validators", () => {
  it("generates required text field as v.string()", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: { title: text({ required: true }) },
        }),
      ],
    });
    const output = generateVexSchema({ config });
    expect(output.contents).toContain("title: v.string()");
  });

  it("generates optional text field as v.optional(v.string())", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: { excerpt: text({ required: false }) },
        }),
      ],
    });
    const output = generateVexSchema({ config });
    expect(output.contents).toContain("excerpt: v.optional(v.string())");
  });

  it("generates required number field as v.number()", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: { views: number({ required: true }) },
        }),
      ],
    });
    const output = generateVexSchema({ config });
    expect(output.contents).toContain("views: v.number()");
  });

  it("generates optional checkbox field as v.optional(v.boolean())", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: { published: checkbox({ required: false }) },
        }),
      ],
    });
    const output = generateVexSchema({ config });
    expect(output.contents).toContain("published: v.optional(v.boolean())");
  });

  it("generates optional date field as v.optional(v.number())", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: { publishedAt: date({ required: false }) },
        }),
      ],
    });
    const output = generateVexSchema({ config });
    expect(output.contents).toContain("publishedAt: v.optional(v.number())");
  });

  it("generates required select field as v.array(v.union(...))", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: {
            status: select({
              required: true,
              options: [
                { label: "Draft", value: "draft" },
                { label: "Published", value: "published" },
              ],
            }),
          },
        }),
      ],
    });
    const output = generateVexSchema({ config });
    expect(output.contents).toContain(
      'status: v.array(v.union(v.literal("draft"), v.literal("published")))',
    );
  });
});

// ─── Exports ─────────────────────────────────────────────────────────────────

describe("generateVexSchema — collection exports", () => {
  it("exports each collection using its slug as the const name", () => {
    const config = defineConfig({
      collections: [
        defineCollection({ slug: "posts", fields: { title: text() } }),
        defineCollection({ slug: "authors", fields: { name: text() } }),
      ],
    });
    const output = generateVexSchema({ config });
    expect(output.contents).toContain("export const posts = defineTable({");
    expect(output.contents).toContain("export const authors = defineTable({");
  });

  it("generates a separate export block for each collection", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: {
            title: text({ required: true }),
            views: number({ required: true }),
          },
        }),
      ],
    });
    const output = generateVexSchema({ config });
    expect(output.contents).toContain("export const posts = defineTable({");
    expect(output.contents).toContain("title: v.string()");
    expect(output.contents).toContain("views: v.number()");
  });
});

// ─── Indexes ─────────────────────────────────────────────────────────────────

describe("generateVexSchema — indexes", () => {
  it("appends .index() chain for fields with an index property", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: { slug: text({ required: true, index: "by_slug" }) },
        }),
      ],
    });
    const output = generateVexSchema({ config });
    expect(output.contents).toContain('.index("by_slug", ["slug"])');
  });

  it("appends multiple .index() chains for multiple indexed fields", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: {
            slug: text({ required: true, index: "by_slug" }),
            authorId: text({ required: true, index: "by_author" }),
          },
        }),
      ],
    });
    const output = generateVexSchema({ config });
    expect(output.contents).toContain('.index("by_slug", ["slug"])');
    expect(output.contents).toContain('.index("by_author", ["authorId"])');
  });

  it("does not append .index() for fields without an index property", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: { title: text({ required: true }) },
        }),
      ],
    });
    const output = generateVexSchema({ config });
    expect(output.contents).not.toContain(".index(");
  });
});

// ─── Search indexes ───────────────────────────────────────────────────────────

describe("generateVexSchema — searchIndex", () => {
  it("appends .searchIndex() chain for text fields with a searchIndex config", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: {
            title: text({
              required: true,
              searchIndex: { name: "search_title", filterFields: ["status"] },
            }),
          },
        }),
      ],
    });
    const output = generateVexSchema({ config });
    expect(output.contents).toContain('.searchIndex("search_title",');
    expect(output.contents).toContain('searchField: "title"');
    expect(output.contents).toContain('filterFields: ["status"]');
  });

  it("generates empty filterFields array when filterFields is []", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: {
            title: text({
              required: true,
              searchIndex: { name: "search_title", filterFields: [] },
            }),
          },
        }),
      ],
    });
    const output = generateVexSchema({ config });
    expect(output.contents).toContain("filterFields: []");
  });
});

// ─── Integration ─────────────────────────────────────────────────────────────

describe("generateVexSchema — integration (full collection)", () => {
  it("generates a complete valid schema for a realistic collection", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: {
            title: text({ required: true }),
            slug: text({ required: true, index: "by_slug" }),
            excerpt: text({ required: false }),
            views: number({ required: true }),
            published: checkbox({ required: false }),
            publishedAt: date({ required: false }),
            status: select({
              required: true,
              options: [
                { label: "Draft", value: "draft" },
                { label: "Published", value: "published" },
              ],
            }),
          },
        }),
      ],
    });
    const output = generateVexSchema({ config });

    // update flag
    expect(output.update).toBe(true);

    // Header present
    expect(output.contents.split("\n")[0]).toBe(HEADER);

    // Imports
    expect(output.contents).toContain(
      'import { defineTable } from "convex/server"',
    );
    expect(output.contents).toContain('import { v } from "convex/values"');

    // Table export
    expect(output.contents).toContain("export const posts = defineTable({");

    // All fields
    expect(output.contents).toContain("title: v.string()");
    expect(output.contents).toContain("slug: v.string()");
    expect(output.contents).toContain("excerpt: v.optional(v.string())");
    expect(output.contents).toContain("views: v.number()");
    expect(output.contents).toContain("published: v.optional(v.boolean())");
    expect(output.contents).toContain("publishedAt: v.optional(v.number())");
    expect(output.contents).toContain(
      'status: v.array(v.union(v.literal("draft"), v.literal("published")))',
    );

    // Index
    expect(output.contents).toContain('.index("by_slug", ["slug"])');
  });
});
```

---

## Step 3: `generateVexTypes`

- [x] Create `packages/core/src/collections/interfaceGen.ts` — `collectionConfigToInterface` per-collection helper (renamed from `typeGen.ts`)
- [x] Create `packages/core/src/collections/interfaceGen.test.ts` — contains `generateVexTypes`, `ADMIN_FIELDS`, and `slugToPascalCase` tests
- [x] Create `packages/core/src/types/generateVexTypes.ts` — full file generator
- [x] Create `packages/core/src/types/index.ts` — re-exports `generateVexTypes`
- [x] Run `pnpm --filter @vexcms/core test` — all tests pass

This function generates `vex.types.ts`, which gives users TypeScript types for collection documents and config-level union types. The output is a self-contained TypeScript module.

### Field type → TypeScript type mapping

The mapping now lives on field objects via `field.interfaceType` (stamped by each field config function from `ADMIN_FIELDS[type].interfaceType`). `generateVexTypes` reads `field.interfaceType` directly — no switch statement, no `ADMIN_FIELDS` lookup at generation time. When a new field type is added to `ADMIN_FIELDS`, the type generator picks it up automatically.

| Field type | `ADMIN_FIELDS[type].interfaceType` | When required | When optional |
| ---------- | ---------------------------------- | ------------- | ------------- |
| `text`     | `"string"`                         | `string`      | `string?`     |
| `number`   | `"number"`                         | `number`      | `number?`     |
| `checkbox` | `"boolean"`                        | `boolean`     | `boolean?`    |
| `date`     | `"number"`                         | `number`      | `number?`     |
| `select`   | `"string[]"`                       | `string[]`    | `string[]?`   |

Note: `select` stores an array regardless of required — the `?` makes the whole array optional.

### File: `packages/core/src/collections/interfaceGen.ts`

Contains only `collectionConfigToInterface` — the per-collection interface string helper. `slugToPascalCase` lives in `collections/utils.ts` (used by `defineCollection` at resolve time). `generateVexTypes` lives in `types/generateVexTypes.ts`.

**Implementation note:** reads `collection.interfaceName` (set by `defineCollection`) and `field.interfaceType` (set by field config functions) directly — no lookups needed at generation time.

**Select fields generate typed option subtypes** (improvement over spec's deferred plan): instead of `string[]`, a select field named `status` generates `type StatusOption = "draft" | "published"` as a sub-type, and the field's interface type becomes `StatusOption` (or the value of `field.optionInterfaceName` if set). The sub-type name is derived from `slugToPascalCase({ slug: fieldKey }) + "Option"`.

```typescript
import { ADMIN_FIELDS } from "../fields";
import { CollectionConfig } from "./types";
import { slugToPascalCase } from "./utils";

export function collectionConfigToInterface(props: {
  collection: CollectionConfig;
}): string {
  const { collection } = props;
  const interfaceStart = `export interface ${collection.interfaceName} {\n\t_id: string,\n\t_creationTime: number`;

  const collectionSubTypes: string[] = [];
  const interfaceFields = Object.entries(collection.fields)
    .map(([fieldKey, field]) => {
      let fieldType = field.interfaceType;
      if (field.type === ADMIN_FIELDS.select.type) {
        fieldType =
          field.optionInterfaceName ??
          `${slugToPascalCase({ slug: fieldKey })}Option`;
        collectionSubTypes.push(
          `type ${fieldType} = ${field.options.map((o) => `"${o.value}"`).join(" | ")}`,
        );
      }
      return `\t${fieldKey}${field.required ? "" : "?"}: ${fieldType}`;
    })
    .join("\n");

  return [collectionSubTypes, interfaceStart, interfaceFields, "}"].join("\n");
}
```

### File: `packages/core/src/types/generateVexTypes.ts`

Full `vex.types.ts` file generator. Calls `collectionConfigToInterface` for each collection, then builds the `CollectionSlug` union and `DocumentBySlug` mapped type. `slugToPascalCase` is not needed here because `collection.interfaceName` is already set on the resolved config.

**Note:** The generated file includes ESLint disable comments at the top for `perfectionist/sort-union-types`, `perfectionist/sort-interfaces`, and `perfectionist/sort-modules` — these suppress sort-order lint errors on auto-generated code whose order is determined by the user's collection config, not alphabetical sort.

```typescript
import { collectionConfigToInterface } from "../collections/interfaceGen";
import type { VexConfig } from "../config/types";

export function generateVexTypes(props: { config: VexConfig }): string {
  const { config } = props;
  const typesHeader = `/* eslint-disable perfectionist/sort-union-types */
/* eslint-disable perfectionist/sort-interfaces */
/* eslint-disable perfectionist/sort-modules */

// ⚠️ AUTO-GENERATED BY VEX CMS — DO NOT EDIT ⚠️
// Run 'vex dev' or 'vex generate' to update this file.`;

  if (config.collections.length === 0) {
    return typesHeader;
  }

  const interfaceBlocks = config.collections.map((collection) =>
    collectionConfigToInterface({ collection }),
  );

  const collectionSlugType = `export type CollectionSlug = ${config.collections
    .map((c) => `"${c.slug}"`)
    .join(" | ")}`;

  const documentBySlugType = `export type DocumentBySlug = {\n${config.collections
    .map((c) => `  ${c.slug}: ${c.interfaceName}`)
    .join("\n")}\n}`;

  return [
    typesHeader,
    "",
    ...interfaceBlocks,
    "",
    collectionSlugType,
    "",
    documentBySlugType,
  ].join("\n");
}
```

### File: `packages/core/src/collections/interfaceGen.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { defineConfig, defineCollection } from "../index";
import { text } from "../fields/text/config";
import { number } from "../fields/number/config";
import { checkbox } from "../fields/checkbox/config";
import { date } from "../fields/date/config";
import { select } from "../fields/select/config";
import { ADMIN_FIELDS } from "../fields/constants";
import { slugToPascalCase } from "./utils";
import { generateVexTypes } from "../types/generateVexTypes";

const HEADER = "// ⚠️ AUTO-GENERATED BY VEX CMS — DO NOT EDIT ⚠️";

// ─── slugToPascalCase ─────────────────────────────────────────────────────────

describe("slugToPascalCase", () => {
  it("capitalizes single-word slug", () => {
    expect(slugToPascalCase({ slug: "posts" })).toBe("Posts");
  });

  it("capitalizes and joins underscore-separated slug", () => {
    expect(slugToPascalCase({ slug: "blog_posts" })).toBe("BlogPosts");
  });

  it("capitalizes and joins hyphen-separated slug", () => {
    expect(slugToPascalCase({ slug: "blog-posts" })).toBe("BlogPosts");
  });
});

// ─── ADMIN_FIELDS.interfaceType ──────────────────────────────────────────────

describe("ADMIN_FIELDS — interfaceType", () => {
  it("text maps to string", () => {
    expect(ADMIN_FIELDS.text.interfaceType).toBe("string");
  });

  it("number maps to number", () => {
    expect(ADMIN_FIELDS.number.interfaceType).toBe("number");
  });

  it("checkbox maps to boolean", () => {
    expect(ADMIN_FIELDS.checkbox.interfaceType).toBe("boolean");
  });

  it("date maps to number (stored as Unix ms)", () => {
    expect(ADMIN_FIELDS.date.interfaceType).toBe("number");
  });

  it("select maps to string[] (always array)", () => {
    expect(ADMIN_FIELDS.select.interfaceType).toBe("string[]");
  });
});

// ─── Header ──────────────────────────────────────────────────────────────────

describe("generateVexTypes — header", () => {
  it("always includes the auto-generated header on line 1", () => {
    const config = defineConfig();
    const output = generateVexTypes({ config });
    expect(output.split("\n")[0]).toBe(HEADER);
  });

  it("returns only the header when there are no collections", () => {
    const config = defineConfig();
    const output = generateVexTypes({ config });
    expect(output).not.toContain("interface");
    expect(output).not.toContain("CollectionSlug");
  });
});

// ─── Document interfaces ──────────────────────────────────────────────────────

describe("generateVexTypes — document interfaces", () => {
  it("generates a document interface for each collection", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: { title: text({ required: true }) },
        }),
        defineCollection({
          slug: "authors",
          fields: { name: text({ required: true }) },
        }),
      ],
    });
    const output = generateVexTypes({ config });
    expect(output).toContain("export interface PostsDocument {");
    expect(output).toContain("export interface AuthorsDocument {");
  });

  it("always includes _id and _creationTime in every interface", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: { title: text({ required: true }) },
        }),
      ],
    });
    const output = generateVexTypes({ config });
    expect(output).toContain("_id: string");
    expect(output).toContain("_creationTime: number");
  });

  it("generates required fields without ? modifier", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: { title: text({ required: true }) },
        }),
      ],
    });
    const output = generateVexTypes({ config });
    expect(output).toContain("title: string");
    expect(output).not.toContain("title?: string");
  });

  it("generates optional fields with ? modifier", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: { excerpt: text({ required: false }) },
        }),
      ],
    });
    const output = generateVexTypes({ config });
    expect(output).toContain("excerpt?: string");
  });

  it("generates all field types correctly in one collection", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: {
            title: text({ required: true }),
            views: number({ required: true }),
            published: checkbox({ required: false }),
            publishedAt: date({ required: false }),
            status: select({
              required: true,
              options: [{ label: "Draft", value: "draft" }],
            }),
            tags: select({
              required: false,
              options: [{ label: "News", value: "news" }],
            }),
          },
        }),
      ],
    });
    const output = generateVexTypes({ config });
    expect(output).toContain("title: string");
    expect(output).toContain("views: number");
    expect(output).toContain("published?: boolean");
    expect(output).toContain("publishedAt?: number");
    expect(output).toContain("status: string[]");
    expect(output).toContain("tags?: string[]");
  });

  it("uses PascalCase slug for interface name (underscore slug)", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "blog_posts",
          fields: { title: text({ required: true }) },
        }),
      ],
    });
    const output = generateVexTypes({ config });
    expect(output).toContain("export interface BlogPostsDocument {");
  });
});

// ─── CollectionSlug ───────────────────────────────────────────────────────────

describe("generateVexTypes — CollectionSlug", () => {
  it("generates a CollectionSlug union type for all slugs", () => {
    const config = defineConfig({
      collections: [
        defineCollection({ slug: "posts", fields: { title: text() } }),
        defineCollection({ slug: "authors", fields: { name: text() } }),
      ],
    });
    const output = generateVexTypes({ config });
    expect(output).toContain("export type CollectionSlug =");
    expect(output).toContain('"posts"');
    expect(output).toContain('"authors"');
  });

  it("generates a single-value CollectionSlug for one collection", () => {
    const config = defineConfig({
      collections: [
        defineCollection({ slug: "posts", fields: { title: text() } }),
      ],
    });
    const output = generateVexTypes({ config });
    expect(output).toContain('export type CollectionSlug = "posts"');
  });
});

// ─── DocumentBySlug ───────────────────────────────────────────────────────────

describe("generateVexTypes — DocumentBySlug", () => {
  it("generates a DocumentBySlug mapped type", () => {
    const config = defineConfig({
      collections: [
        defineCollection({ slug: "posts", fields: { title: text() } }),
        defineCollection({ slug: "authors", fields: { name: text() } }),
      ],
    });
    const output = generateVexTypes({ config });
    expect(output).toContain("export type DocumentBySlug = {");
    expect(output).toContain("posts: PostsDocument");
    expect(output).toContain("authors: AuthorsDocument");
  });
});
```

---

## Step 4: `generateCollectionQueries` and `GENERATED_HEADER`

> **Status: Not yet implemented.** `generateCollectionQueries` is a stub returning `{}`. The file exists with the correct interface and `GENERATED_HEADER` constant, but the implementation and tests have not been written.

- [ ] Implement `generateCollectionQueries` in `packages/core/src/schema/generateCollectionQueries.ts`
- [ ] Create `packages/core/src/schema/generateCollectionQueries.test.ts`
- [ ] Run `pnpm --filter @vexcms/core test` — all tests pass

This function generates the per-collection typed Convex API files that the CLI writes under `convex/vex/`. Generated files are identified by `GENERATED_HEADER` on their first line — the CLI's cleanup logic uses this to detect stale generated files and delete them.

### Generated file structure

For each collection with slug `posts`, two files are generated:

**`api/posts.ts`** — Typed `anyApi` references for use in React client components with `useQuery`/`useMutation`. Narrows the generic `VexDocument[]` return type to `Doc<"posts">[]` from Convex's generated types.

**`model/api/posts.ts`** — Server-side model helper object for use inside Convex `query`/`mutation` handlers. Provides typed `ctx.db` calls so handler code is type-safe without manual casting.

**`api/index.ts`** — Barrel re-export of all `api/{slug}.ts` files.

### File: `packages/core/src/schema/generateCollectionQueries.ts`

````typescript
import type { VexConfig } from "../config/types";
import type { CollectionConfig } from "../collections/types";
import { slugToPascalCase } from "../collections/utils";

/**
 * Marker comment placed on the first line of every VEX-generated file.
 *
 * The CLI's `cleanStaleFiles` function uses `String.startsWith(GENERATED_HEADER)`
 * on the first line of each `.ts` file in the generated directories to detect
 * and delete stale generated files when a collection is removed from the config.
 */
export const GENERATED_HEADER = "// ⚠️ AUTO-GENERATED BY VEX CMS";

/**
 * Relative import paths computed by the CLI and passed to `generateCollectionQueries`.
 *
 * All paths are relative to the directory where the generated file will live.
 * Computed by `computeImportPaths()` in `@vexcms/cli`.
 */
export interface CollectionQueryImports {
  /** Path to the Convex `_generated/` directory from the `api/` directory. */
  generatedDirFromApi: string;
  /** Path to the Convex `_generated/` directory from the `model/api/` directory. */
  generatedDirFromModel: string;
}

export function generateCollectionQueries(props: {
  config: VexConfig;
  imports: CollectionQueryImports;
}): Record<string, string> {
  // TODO: implement
  //
  // 1. If props.config.collections is empty, return {}.
  //
  // 2. Initialize result: Record<string, string> = {}
  //
  // 3. For each collection in props.config.collections:
  //    a. Call generateApiFile({ collection, imports: props.imports }) → string
  //       Store result["api/{collection.slug}.ts"] = content
  //    b. Call generateModelApiFile({ collection, imports: props.imports }) → string
  //       Store result["model/api/{collection.slug}.ts"] = content
  //
  // 4. Generate the api/index.ts barrel:
  //    - Header line: GENERATED_HEADER + " — DO NOT EDIT ⚠️"
  //    - "// Run `vex generate` to update."
  //    - For each collection slug, add: "export * from \"./{slug}\""
  //    Store result["api/index.ts"] = barrel content
  //
  // 5. Return result
  throw new Error("Not implemented");
}

function generateApiFile(props: {
  collection: CollectionConfig;
  imports: CollectionQueryImports;
}): string {
  // TODO: implement
  //
  // The generated file should look like:
  //
  // ```typescript
  // // ⚠️ AUTO-GENERATED BY VEX CMS — DO NOT EDIT ⚠️
  // // Run `vex generate` to update.
  // // Collection: {slug}
  //
  // import { anyApi } from "convex/server"
  // import type { FunctionReference } from "convex/server"
  // import type { Doc } from "{imports.generatedDirFromApi}/dataModel"
  //
  // export const {slug}Api = {
  //   list: anyApi.vex.collections.list as FunctionReference<
  //     "query",
  //     "public",
  //     { collection: "{slug}"; limit?: number },
  //     Doc<"{slug}">[]
  //   >,
  //   get: anyApi.vex.collections.get as FunctionReference<
  //     "query",
  //     "public",
  //     { id: string },
  //     Doc<"{slug}"> | null
  //   >,
  //   create: anyApi.vex.collections.create as FunctionReference<
  //     "mutation",
  //     "public",
  //     { collection: "{slug}"; data: Omit<Doc<"{slug}">, "_id" | "_creationTime"> },
  //     string
  //   >,
  //   update: anyApi.vex.collections.update as FunctionReference<
  //     "mutation",
  //     "public",
  //     { id: string; data: Partial<Omit<Doc<"{slug}">, "_id" | "_creationTime">> },
  //     void
  //   >,
  //   remove: anyApi.vex.collections.remove as FunctionReference<
  //     "mutation",
  //     "public",
  //     { collection: "{slug}"; id: string },
  //     void
  //   >,
  // } as const
  //
  // The `{slug}Api` const name is camelCase:
  //   slugToPascalCase({ slug }) → "BlogPosts" → lowercase first char → "blogPostsApi"
  //
  // Use template literals to produce the full file content.
  throw new Error("Not implemented");
}

function generateModelApiFile(props: {
  collection: CollectionConfig;
  imports: CollectionQueryImports;
}): string {
  // TODO: implement
  //
  // The generated file should look like:
  //
  // ```typescript
  // // ⚠️ AUTO-GENERATED BY VEX CMS — DO NOT EDIT ⚠️
  // // Run `vex generate` to update.
  // // Collection: {slug}
  //
  // import type { MutationCtx, QueryCtx } from "{imports.generatedDirFromModel}/server"
  // import type { Doc, Id } from "{imports.generatedDirFromModel}/dataModel"
  //
  // export const {slug}Model = {
  //   list: (ctx: QueryCtx, limit = 50) => ctx.db.query("{slug}").take(limit),
  //   get: (ctx: QueryCtx, id: Id<"{slug}">) => ctx.db.get(id),
  //   create: (
  //     ctx: MutationCtx,
  //     data: Omit<Doc<"{slug}">, "_id" | "_creationTime">,
  //   ) => ctx.db.insert("{slug}", data),
  //   update: (
  //     ctx: MutationCtx,
  //     id: Id<"{slug}">,
  //     data: Partial<Omit<Doc<"{slug}">, "_id" | "_creationTime">>,
  //   ) => ctx.db.patch(id, data),
  //   remove: (ctx: MutationCtx, id: Id<"{slug}">) => ctx.db.delete(id),
  // } as const
  //
  // The `{slug}Model` name follows the same camelCase pattern as `{slug}Api`.
  throw new Error("Not implemented");
}
````

### File: `packages/core/src/schema/generateCollectionQueries.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { defineConfig, defineCollection } from "../index";
import { text } from "../fields/text/config";
import {
  generateCollectionQueries,
  GENERATED_HEADER,
  type CollectionQueryImports,
} from "./generateCollectionQueries";

const TEST_IMPORTS: CollectionQueryImports = {
  generatedDirFromApi: "../../_generated",
  generatedDirFromModel: "../../../_generated",
};

// ─── GENERATED_HEADER ────────────────────────────────────────────────────────

describe("GENERATED_HEADER", () => {
  it("is a non-empty string starting with //", () => {
    expect(typeof GENERATED_HEADER).toBe("string");
    expect(GENERATED_HEADER.startsWith("//")).toBe(true);
  });
});

// ─── Empty config ─────────────────────────────────────────────────────────────

describe("generateCollectionQueries — empty config", () => {
  it("returns an empty object when there are no collections", () => {
    const config = defineConfig();
    const files = generateCollectionQueries({ config, imports: TEST_IMPORTS });
    expect(files).toEqual({});
  });
});

// ─── File keys ───────────────────────────────────────────────────────────────

describe("generateCollectionQueries — file keys", () => {
  it("generates api/{slug}.ts for each collection", () => {
    const config = defineConfig({
      collections: [
        defineCollection({ slug: "posts", fields: { title: text() } }),
        defineCollection({ slug: "authors", fields: { name: text() } }),
      ],
    });
    const files = generateCollectionQueries({ config, imports: TEST_IMPORTS });
    expect("api/posts.ts" in files).toBe(true);
    expect("api/authors.ts" in files).toBe(true);
  });

  it("generates model/api/{slug}.ts for each collection", () => {
    const config = defineConfig({
      collections: [
        defineCollection({ slug: "posts", fields: { title: text() } }),
      ],
    });
    const files = generateCollectionQueries({ config, imports: TEST_IMPORTS });
    expect("model/api/posts.ts" in files).toBe(true);
  });

  it("always generates api/index.ts", () => {
    const config = defineConfig({
      collections: [
        defineCollection({ slug: "posts", fields: { title: text() } }),
      ],
    });
    const files = generateCollectionQueries({ config, imports: TEST_IMPORTS });
    expect("api/index.ts" in files).toBe(true);
  });

  it("generates exactly 2n+1 files for n collections (api/*, model/api/*, index)", () => {
    const config = defineConfig({
      collections: [
        defineCollection({ slug: "posts", fields: { title: text() } }),
        defineCollection({ slug: "authors", fields: { name: text() } }),
      ],
    });
    const files = generateCollectionQueries({ config, imports: TEST_IMPORTS });
    expect(Object.keys(files)).toHaveLength(5); // 2 api + 2 model + 1 index
  });
});

// ─── GENERATED_HEADER in files ────────────────────────────────────────────────

describe("generateCollectionQueries — GENERATED_HEADER in file content", () => {
  it("every generated file starts with GENERATED_HEADER", () => {
    const config = defineConfig({
      collections: [
        defineCollection({ slug: "posts", fields: { title: text() } }),
      ],
    });
    const files = generateCollectionQueries({ config, imports: TEST_IMPORTS });
    for (const [path, content] of Object.entries(files)) {
      expect(
        content.split("\n")[0]?.startsWith(GENERATED_HEADER),
        `${path} does not start with GENERATED_HEADER`,
      ).toBe(true);
    }
  });
});

// ─── api/{slug}.ts content ────────────────────────────────────────────────────

describe("generateCollectionQueries — api file content", () => {
  it("api/posts.ts exports postsApi", () => {
    const config = defineConfig({
      collections: [
        defineCollection({ slug: "posts", fields: { title: text() } }),
      ],
    });
    const files = generateCollectionQueries({ config, imports: TEST_IMPORTS });
    expect(files["api/posts.ts"]).toContain("export const postsApi");
  });

  it("api/posts.ts imports from _generated/dataModel via provided path", () => {
    const config = defineConfig({
      collections: [
        defineCollection({ slug: "posts", fields: { title: text() } }),
      ],
    });
    const files = generateCollectionQueries({ config, imports: TEST_IMPORTS });
    expect(files["api/posts.ts"]).toContain(
      TEST_IMPORTS.generatedDirFromApi + "/dataModel",
    );
  });

  it("api/posts.ts uses literal collection slug in list args", () => {
    const config = defineConfig({
      collections: [
        defineCollection({ slug: "posts", fields: { title: text() } }),
      ],
    });
    const files = generateCollectionQueries({ config, imports: TEST_IMPORTS });
    expect(files["api/posts.ts"]).toContain('collection: "posts"');
  });

  it('api/posts.ts uses Doc<"posts"> as return type', () => {
    const config = defineConfig({
      collections: [
        defineCollection({ slug: "posts", fields: { title: text() } }),
      ],
    });
    const files = generateCollectionQueries({ config, imports: TEST_IMPORTS });
    expect(files["api/posts.ts"]).toContain('Doc<"posts">');
  });
});

// ─── model/api/{slug}.ts content ─────────────────────────────────────────────

describe("generateCollectionQueries — model file content", () => {
  it("model/api/posts.ts exports postsModel", () => {
    const config = defineConfig({
      collections: [
        defineCollection({ slug: "posts", fields: { title: text() } }),
      ],
    });
    const files = generateCollectionQueries({ config, imports: TEST_IMPORTS });
    expect(files["model/api/posts.ts"]).toContain("export const postsModel");
  });

  it("model/api/posts.ts imports from _generated via model-specific path", () => {
    const config = defineConfig({
      collections: [
        defineCollection({ slug: "posts", fields: { title: text() } }),
      ],
    });
    const files = generateCollectionQueries({ config, imports: TEST_IMPORTS });
    expect(files["model/api/posts.ts"]).toContain(
      TEST_IMPORTS.generatedDirFromModel + "/server",
    );
    expect(files["model/api/posts.ts"]).toContain(
      TEST_IMPORTS.generatedDirFromModel + "/dataModel",
    );
  });

  it('model/api/posts.ts uses Id<"posts"> and Doc<"posts">', () => {
    const config = defineConfig({
      collections: [
        defineCollection({ slug: "posts", fields: { title: text() } }),
      ],
    });
    const files = generateCollectionQueries({ config, imports: TEST_IMPORTS });
    expect(files["model/api/posts.ts"]).toContain('Id<"posts">');
    expect(files["model/api/posts.ts"]).toContain('Doc<"posts">');
  });
});

// ─── api/index.ts content ─────────────────────────────────────────────────────

describe("generateCollectionQueries — api/index.ts", () => {
  it("re-exports each collection's api file", () => {
    const config = defineConfig({
      collections: [
        defineCollection({ slug: "posts", fields: { title: text() } }),
        defineCollection({ slug: "authors", fields: { name: text() } }),
      ],
    });
    const files = generateCollectionQueries({ config, imports: TEST_IMPORTS });
    expect(files["api/index.ts"]).toContain('from "./posts"');
    expect(files["api/index.ts"]).toContain('from "./authors"');
  });
});

// ─── camelCase slug in export names ──────────────────────────────────────────

describe("generateCollectionQueries — camelCase slug in export names", () => {
  it("uses camelCase slug for underscore-separated collection", () => {
    const config = defineConfig({
      collections: [
        defineCollection({ slug: "blog_posts", fields: { title: text() } }),
      ],
    });
    const files = generateCollectionQueries({ config, imports: TEST_IMPORTS });
    expect(files["api/blog_posts.ts"]).toContain("export const blogPostsApi");
    expect(files["model/api/blog_posts.ts"]).toContain(
      "export const blogPostsModel",
    );
  });
});
```

---

## Step 5: Wire Up and Fix CLI

- [x] Create `packages/core/src/schema/index.ts`
- [x] Create `packages/core/src/types/index.ts`
- [x] Modify `packages/core/src/index.ts` — add schema + types exports
- [x] Remove `// @ts-nocheck` from `commands/generate.ts` and `commands/deploy.ts`
- [ ] Delete `packages/cli/src/schema/generateSchema.ts` (stale stub — not yet done)
- [x] Add `@vexcms/cli` to `apps/www/package.json` devDependencies
- [ ] Run `pnpm install` from repo root
- [ ] Run `pnpm build` — all packages build successfully
- [ ] Run `pnpm test` — all tests pass
- [ ] Verify `vex dev` works from `apps/www` (see Verification section)

### File: `packages/core/src/schema/index.ts`

```typescript
export * from "./generateVexSchema";
export * from "./generateCollectionQueries";
export * from "./migrate";
```

### File: `packages/core/src/types/index.ts`

```typescript
export * from "./generateVexTypes";
```

### Modification: `packages/core/src/index.ts`

Add at the end of the existing file:

```typescript
// ============================================================================
// SCHEMA GENERATION
// ============================================================================

export * from "./schema";
export * from "./types";
```

### Modifications: Remove `// @ts-nocheck` from CLI files

Remove the `// @ts-nocheck` comment on line 1 from:

- `packages/cli/src/commands/generate.ts`
- `packages/cli/src/commands/deploy.ts`

> **Note:** The following files retain `// @ts-nocheck` because they reference features not in scope for this spec:
>
> - `packages/cli/src/commands/dev.ts` — accesses `c.versions?.drafts` (future versioning feature)
> - `packages/cli/src/lib/generateSchema.ts` — uses `config.schema.autoMigrate`, `diffSchema`, etc.
> - `packages/cli/src/lib/generateCollectionFiles.ts` — accesses `config.globals`, `config.media`, `config.auth`
> - `packages/cli/src/lib/migrate.ts` — uses `MigrationOp`, `RemovedFieldInfo`

### Modification: `apps/www/package.json`

Add `@vexcms/cli` to `devDependencies`:

```json
"@vexcms/cli": "workspace:*",
```

---

## Implementation Notes

Changes made during implementation that differ from the original spec design:

1. **`typeGen.ts` renamed to `interfaceGen.ts`** — Better reflects the function's purpose (generating TypeScript interfaces specifically, not general type code). The test file is `interfaceGen.test.ts` and contains tests for `generateVexTypes`, `ADMIN_FIELDS.interfaceType`, and `slugToPascalCase`.

2. **Schema/types config split** — `typesOutputPath` was not nested in `SchemaConfigInput`. Instead, a separate `TypesConfigInput`/`TypesConfig` pair lives at `VexConfigInput.types`/`VexConfig.types`. The default for `types.outputPath` is `/src/vex.types.ts` (next to `vex.config.ts`) rather than `/convex/vex.types.ts`.

3. **Select fields generate typed option subtypes** — `collectionConfigToInterface` generates `type StatusOption = "draft" | "published"` subtypes for select fields rather than plain `string[]`. The spec deferred this to a future spec, but the developer implemented it immediately as it's straightforward given the `field.options` data already present.

4. **`schema/migrate.ts` added out-of-scope** — `packages/cli/src/lib/generateSchema.ts` already imports `diffSchema`, `makeFieldsOptional`, `addRemovedFieldsAsOptional`, and `planMigration` from `@vexcms/core`. Stubs in `schema/migrate.ts` satisfy these imports and allow `@ts-nocheck` to be removed from the CLI lib. Migration logic itself is still deferred.

5. **ESLint disable comments in generated type files** — `generateVexTypes` writes `/* eslint-disable perfectionist/sort-* */` at the top of generated `vex.types.ts` files to suppress sort-order lint errors.

6. **`packages/cli/src/schema/generateSchema.ts` not deleted** — Still present. Needs manual cleanup.

7. **Step 4 not implemented** — `generateCollectionQueries` is a stub returning `{}`. The function signature, `GENERATED_HEADER`, and `CollectionQueryImports` interface are in place; the implementation and tests are pending.

---

## Verification (mandatory — every spec ends with this)

**Every spec MUST include this section. The implementer MUST run these commands and fix any failures before considering the spec complete.**

- [ ] `pnpm build` — all affected packages build successfully
- [ ] `pnpm test` — all tests pass across the entire monorepo
- [ ] Fix any type errors that surface when `@ts-nocheck` is removed from the 2 CLI files
- [ ] Fix any test assertions broken by changes (update expected values to match new behavior)

### End-to-end verification for `vex dev`

After building successfully, verify the full workflow from `apps/www`:

```bash
cd apps/www

# Build the CLI first (it lives in a workspace package)
pnpm --filter @vexcms/cli build

# Run vex dev — should:
# 1. Find vex.config.ts in apps/www/src/
# 2. Generate convex/vex.schema.ts
# 3. Sync imports in convex/schema.ts
# 4. Generate convex/vex/api/* and convex/vex/model/api/* files
# 5. Start convex dev in a subprocess
# 6. Watch for config changes
pnpm exec vex dev
```

Expected console output (approximately):

```
[vex] Config found: /path/to/apps/www/src/vex.config.ts
[vex] Generated /convex/vex.schema.ts
[vex] Starting convex dev (pnpm)...
[vex] Watching N files for changes...
```

> If `convex/vex.schema.ts` is generated and `convex/schema.ts` is updated with correct imports, the core functionality is working.

---

## Success Criteria

- [ ] `generateVexSchema` produces a valid `vex.schema.ts` file for the existing `apps/www` config
- [ ] `convex/schema.ts` is automatically updated when a new collection is added to `vex.config.ts`
- [ ] `vex.schema.ts` is Prettier-formatted on every write (handled by CLI — verify formatting is clean)
- [ ] `generateVexTypes` produces a `vex.types.ts` with correct document interfaces
- [ ] `generateCollectionQueries` produces typed API files under `convex/vex/api/` and `convex/vex/model/api/`
- [ ] `commands/generate.ts` and `commands/deploy.ts` compile cleanly without `@ts-nocheck`
- [ ] `pnpm exec vex dev` from `apps/www` runs without crashing
- [ ] `pnpm test` passes across the entire monorepo
