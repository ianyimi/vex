# Spec 28b — Type Generation (`vex.types.ts`)

## Overview

Generate a `convex/vex.types.ts` file containing TypeScript interfaces for all collections, blocks, and globals — similar to PayloadCMS's `payload-types.ts`. Add `interfaceName` support to `defineCollection()`, `defineBlock()`, `VexGlobal`, and auth adapters for controlling exported type names. The CLI regenerates this file alongside `vex.schema.ts` on every config change.

## Design Decisions

- **Single file** — All types in one `vex.types.ts` file, not per-collection files. Matches Payload's approach.
- **Mirrors schema generation** — The field-to-TypeScript mapping parallels `fieldToValueType()` but produces TS types instead of Convex validators. Same config walk, same auth merging.
- **Block interfaces are standalone** — Each block gets its own `export interface`, referenced by name in collection types. Blocks used in multiple collections produce one interface (deduplicated by slug).
- **JSDoc from labels** — Each field gets a `/** Label */` comment if the field has a `label` property.
- **`interfaceName` is optional** — Auto-generated from slug via PascalCase conversion when not provided.
- **JSON fields** → `Record<string, unknown>`.
- **RichText fields** → `any` (Plate/Slate JSON varies by editor config).
- **Includes `_id` and `_creationTime`** on collections, and versioning system fields when enabled.
- **Barrel export** — A `VexCollectionTypes` mapped type at the end for generic helpers.

## Out of Scope

- Runtime type validation (Zod handles this)
- Generated types for query return types (Convex `Doc<>` handles this)
- Separate file per collection

## Target Directory Structure

```
packages/core/src/
├── typeGen/
│   ├── generateVexTypes.ts          # Main generation function
│   ├── generateVexTypes.test.ts     # Tests
│   ├── fieldToTypeString.ts         # Per-field TS type mapping
│   ├── fieldToTypeString.test.ts    # Tests
│   └── slugToInterfaceName.ts       # Slug → PascalCase utility
│   └── slugToInterfaceName.test.ts  # Tests
├── types/
│   ├── fields.ts                    # (updated — interfaceName on BlockDef)
│   ├── collections.ts               # (updated — interfaceName on VexCollection)
│   └── globals.ts                   # (updated — interfaceName on VexGlobal)
├── index.ts                         # (updated — export generateVexTypes, slugToInterfaceName)

packages/cli/src/lib/
└── generateSchema.ts                # (updated — also writes vex.types.ts)
```

## Implementation Order

1. **Step 1: `slugToInterfaceName` utility + tests** — Pure function, no dependencies. After this, the naming logic is testable.
2. **Step 2: `interfaceName` on types** — Add optional `interfaceName` to `BlockDef`, `VexCollection`, `VexGlobal`, `VexAuthAdapter`. Build passes.
3. **Step 3: `fieldToTypeString` + tests** — Converts a single `VexField` to its TypeScript type string. Leaf function.
4. **Step 4: `generateVexTypes` + tests** — Main orchestrator: walks config, generates full file content. Uses steps 1-3.
5. **Step 5: Core exports** — Export new functions and types from `@vexcms/core`.
6. **Step 6: CLI integration** — Wire `generateVexTypes` into `generateAndWrite()` to write `vex.types.ts` alongside schema.

---

## Step 1: `slugToInterfaceName` Utility + Tests

- [ ] Create `packages/core/src/typeGen/slugToInterfaceName.ts`
- [ ] Create `packages/core/src/typeGen/slugToInterfaceName.test.ts`
- [ ] Run `pnpm --filter @vexcms/core test`

### File: `packages/core/src/typeGen/slugToInterfaceName.ts`

```typescript
/**
 * Convert a slug string to a PascalCase interface name.
 *
 * @param props.slug - The slug to convert (e.g., "blog-posts", "new_block", "media")
 * @returns PascalCase string (e.g., "BlogPosts", "NewBlock", "Media")
 *
 * @example
 * ```ts
 * slugToInterfaceName({ slug: "blog-posts" })  // "BlogPosts"
 * slugToInterfaceName({ slug: "new_block" })    // "NewBlock"
 * slugToInterfaceName({ slug: "media" })         // "Media"
 * slugToInterfaceName({ slug: "FAQ" })            // "Faq"
 * ```
 */
export function slugToInterfaceName(props: { slug: string }): string {
  // TODO: implement
  //
  // 1. Split props.slug on hyphens, underscores, and camelCase boundaries
  //    → "blog-posts" → ["blog", "posts"]
  //    → "new_block" → ["new", "block"]
  //    → "userProfile" → ["user", "Profile"]
  //    → "FAQ" → ["faq"]
  //
  // 2. Capitalize the first letter of each segment, lowercase the rest
  //    → ["Blog", "Posts"]
  //
  // 3. Join and return
  //    → "BlogPosts"
  //
  // Edge cases:
  // - Empty string → "" (shouldn't happen, defineBlock/defineCollection validate slugs)
  // - Single word → capitalize first letter: "media" → "Media"
  // - Already PascalCase → normalize: "BlogPosts" stays "BlogPosts"
  // - All uppercase → lowercase then capitalize: "FAQ" → "Faq"
  throw new Error("Not implemented");
}
```

### File: `packages/core/src/typeGen/slugToInterfaceName.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { slugToInterfaceName } from "./slugToInterfaceName";

describe("slugToInterfaceName", () => {
  it("converts hyphen-separated slug", () => {
    expect(slugToInterfaceName({ slug: "blog-posts" })).toBe("BlogPosts");
  });

  it("converts underscore-separated slug", () => {
    expect(slugToInterfaceName({ slug: "new_block" })).toBe("NewBlock");
  });

  it("converts single word", () => {
    expect(slugToInterfaceName({ slug: "media" })).toBe("Media");
  });

  it("converts mixed separators", () => {
    expect(slugToInterfaceName({ slug: "user-blog_posts" })).toBe("UserBlogPosts");
  });

  it("handles already PascalCase", () => {
    expect(slugToInterfaceName({ slug: "BlogPosts" })).toBe("BlogPosts");
  });

  it("normalizes all uppercase", () => {
    expect(slugToInterfaceName({ slug: "FAQ" })).toBe("Faq");
  });

  it("handles single character segments", () => {
    expect(slugToInterfaceName({ slug: "a-b-c" })).toBe("ABC");
  });

  it("converts camelCase to PascalCase", () => {
    expect(slugToInterfaceName({ slug: "userProfile" })).toBe("UserProfile");
  });
});
```

---

## Step 2: `interfaceName` on Types

- [ ] Update `packages/core/src/types/fields.ts` — add `interfaceName` to `BlockDef`
- [ ] Update `packages/core/src/types/collections.ts` — add `interfaceName` to `VexCollection`
- [ ] Update `packages/core/src/types/globals.ts` — add `interfaceName` to `VexGlobal`
- [ ] Update `packages/core/src/types/auth.ts` — add `interfaceName` to `VexAuthAdapter` collections
- [ ] Run `pnpm --filter @vexcms/core build`

### File: `packages/core/src/types/fields.ts` (update `BlockDef`)

Add `interfaceName` to the `BlockDef` interface:

```typescript
export interface BlockDef<TFields extends Record<string, VexField> = Record<string, VexField>> {
  readonly slug: string;
  label: string;
  fields: TFields;
  admin?: BlockAdminConfig;
  /**
   * TypeScript interface name used in generated `vex.types.ts`.
   * If not set, auto-generated from slug via PascalCase conversion.
   * @example "HeroBlock"
   */
  interfaceName?: string;
}
```

### File: `packages/core/src/types/collections.ts` (update `VexCollection`)

Add `interfaceName` to the `VexCollection` interface:

```typescript
  /**
   * TypeScript interface name used in generated `vex.types.ts`.
   * If not set, auto-generated from slug via PascalCase conversion.
   * @example "BlogPost"
   */
  interfaceName?: string;
```

### File: `packages/core/src/types/globals.ts` (update `VexGlobal`)

Add `interfaceName` to the `VexGlobal` interface:

```typescript
  /**
   * TypeScript interface name used in generated `vex.types.ts`.
   * If not set, auto-generated from slug via PascalCase conversion.
   * @example "SiteSettings"
   */
  interfaceName?: string;
```

### File: `packages/core/src/types/auth.ts` (context)

Auth adapter's `collections` is `VexCollection[]` — so `interfaceName` on `VexCollection` covers auth collections automatically. No additional change needed on the auth adapter type itself.

---

## Step 3: `fieldToTypeString` + Tests

- [ ] Create `packages/core/src/typeGen/fieldToTypeString.ts`
- [ ] Create `packages/core/src/typeGen/fieldToTypeString.test.ts`
- [ ] Run `pnpm --filter @vexcms/core test`

### File: `packages/core/src/typeGen/fieldToTypeString.ts`

```typescript
import type { VexField, BlockDef } from "../types";
import { slugToInterfaceName } from "./slugToInterfaceName";

/**
 * Convert a VexField to its TypeScript type string for generated interfaces.
 *
 * @param props.field - The field definition
 * @param props.blockInterfaceNames - Map of block slug → interface name (for blocks fields)
 * @returns TypeScript type string (e.g., "string", "number", "'draft' | 'published'", "HeroBlock[]")
 */
export function fieldToTypeString(props: {
  field: VexField;
  blockInterfaceNames?: Map<string, string>;
}): string {
  // TODO: implement
  //
  // 1. Switch on props.field.type:
  //
  //    "text"        → "string"
  //    "number"      → "number"
  //    "checkbox"    → "boolean"
  //    "date"        → "number"
  //    "imageUrl"    → "string"
  //    "json"        → "Record<string, unknown>"
  //    "richtext"    → "any"
  //    "ui"          → skip (return "never")
  //
  //    "select" (single) → union of literal values:
  //      options: [{ value: "draft" }, { value: "published" }]
  //      → "'draft' | 'published'"
  //      If no options → "string"
  //
  //    "select" (hasMany) → array of union:
  //      → "('draft' | 'published')[]"
  //
  //    "relationship" (single) → "Id<'targetSlug'>"
  //    "relationship" (hasMany) → "Id<'targetSlug'>[]"
  //
  //    "upload" (single) → "Id<'mediaSlug'>"
  //    "upload" (hasMany) → "Id<'mediaSlug'>[]"
  //
  //    "array" → recursive: fieldToTypeString(innerField) + "[]"
  //      → e.g., array({ field: text() }) → "string[]"
  //      → array({ field: select({ options: [...] }) }) → "('a' | 'b')[]"
  //      If inner type contains | (union), wrap in parens: "(type)[]"
  //
  //    "blocks" → union of block interface names + "[]"
  //      → Look up each block.slug in props.blockInterfaceNames
  //      → e.g., blocks({ blocks: [heroBlock, ctaBlock] }) → "(HeroBlock | CtaBlock)[]"
  //      → Single block type: "HeroBlock[]"
  //
  // 2. Return the type string (caller handles optionality via ?)
  //
  // Edge cases:
  // - Select with empty options array → "string"
  // - Block slug not in blockInterfaceNames map → fall back to slugToInterfaceName
  // - Unknown field type → "unknown"
  throw new Error("Not implemented");
}
```

### File: `packages/core/src/typeGen/fieldToTypeString.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { fieldToTypeString } from "./fieldToTypeString";
import { text, number, checkbox, select, date, imageUrl, json, array, relationship, upload, richtext } from "../fields";
import { blocks } from "../fields/blocks";
import { defineBlock } from "../blocks/defineBlock";

describe("fieldToTypeString", () => {
  it("text → string", () => {
    expect(fieldToTypeString({ field: text() })).toBe("string");
  });

  it("number → number", () => {
    expect(fieldToTypeString({ field: number() })).toBe("number");
  });

  it("checkbox → boolean", () => {
    expect(fieldToTypeString({ field: checkbox() })).toBe("boolean");
  });

  it("date → number", () => {
    expect(fieldToTypeString({ field: date() })).toBe("number");
  });

  it("imageUrl → string", () => {
    expect(fieldToTypeString({ field: imageUrl() })).toBe("string");
  });

  it("json → Record<string, unknown>", () => {
    expect(fieldToTypeString({ field: json() })).toBe("Record<string, unknown>");
  });

  it("richtext → any", () => {
    expect(fieldToTypeString({ field: richtext() })).toBe("any");
  });

  it("select single → literal union", () => {
    expect(
      fieldToTypeString({
        field: select({
          options: [
            { label: "Draft", value: "draft" },
            { label: "Published", value: "published" },
          ],
        }),
      }),
    ).toBe("'draft' | 'published'");
  });

  it("select hasMany → array of literal union", () => {
    expect(
      fieldToTypeString({
        field: select({
          options: [
            { label: "A", value: "a" },
            { label: "B", value: "b" },
          ],
          hasMany: true,
        }),
      }),
    ).toBe("('a' | 'b')[]");
  });

  it("select with no options → string", () => {
    expect(
      fieldToTypeString({ field: select({ options: [] }) }),
    ).toBe("string");
  });

  it("relationship single → Id<'slug'>", () => {
    expect(
      fieldToTypeString({ field: relationship({ to: "authors" }) }),
    ).toBe("Id<'authors'>");
  });

  it("relationship hasMany → Id<'slug'>[]", () => {
    expect(
      fieldToTypeString({ field: relationship({ to: "tags", hasMany: true }) }),
    ).toBe("Id<'tags'>[]");
  });

  it("upload single → Id<'slug'>", () => {
    expect(
      fieldToTypeString({ field: upload({ to: "media" }) }),
    ).toBe("Id<'media'>");
  });

  it("upload hasMany → Id<'slug'>[]", () => {
    expect(
      fieldToTypeString({ field: upload({ to: "media", hasMany: true }) }),
    ).toBe("Id<'media'>[]");
  });

  it("array of text → string[]", () => {
    expect(
      fieldToTypeString({ field: array({ field: text() }) }),
    ).toBe("string[]");
  });

  it("array of select → (union)[]", () => {
    expect(
      fieldToTypeString({
        field: array({
          field: select({
            options: [
              { label: "A", value: "a" },
              { label: "B", value: "b" },
            ],
          }),
        }),
      }),
    ).toBe("('a' | 'b')[]");
  });

  it("blocks → union of interface names[]", () => {
    const hero = defineBlock({ slug: "hero", label: "Hero", fields: {} });
    const cta = defineBlock({ slug: "cta", label: "CTA", fields: {} });
    const nameMap = new Map([["hero", "HeroBlock"], ["cta", "CtaBlock"]]);

    expect(
      fieldToTypeString({
        field: blocks({ blocks: [hero, cta] }),
        blockInterfaceNames: nameMap,
      }),
    ).toBe("(HeroBlock | CtaBlock)[]");
  });

  it("blocks single type → no parens", () => {
    const hero = defineBlock({ slug: "hero", label: "Hero", fields: {} });
    const nameMap = new Map([["hero", "HeroBlock"]]);

    expect(
      fieldToTypeString({
        field: blocks({ blocks: [hero] }),
        blockInterfaceNames: nameMap,
      }),
    ).toBe("HeroBlock[]");
  });
});
```

---

## Step 4: `generateVexTypes` + Tests

- [ ] Create `packages/core/src/typeGen/generateVexTypes.ts`
- [ ] Create `packages/core/src/typeGen/generateVexTypes.test.ts`
- [ ] Run `pnpm --filter @vexcms/core test`

### File: `packages/core/src/typeGen/generateVexTypes.ts`

```typescript
import type { VexConfig, VexField, VexCollection, VexGlobal, BlockDef } from "../types";
import { mergeAuthCollectionWithUserCollection } from "../valueTypes/merge";
import { VERSION_SYSTEM_FIELDS } from "../versioning/constants";
import { LOCKED_MEDIA_FIELDS, OVERRIDABLE_MEDIA_FIELDS } from "../types/media";
import { fieldToTypeString } from "./fieldToTypeString";
import { slugToInterfaceName } from "./slugToInterfaceName";

/**
 * Generate the complete TypeScript source for `vex.types.ts`.
 *
 * Walks all collections, globals, media collections, and auth collections
 * in the config, and produces:
 * - An `export interface` for each collection/global
 * - An `export interface` for each block type (deduplicated by slug)
 * - A barrel `VexCollectionTypes` mapped type
 * - A barrel `VexGlobalTypes` mapped type
 *
 * @param props.config - The resolved VexConfig
 * @returns TypeScript source code string
 */
export function generateVexTypes(props: { config: VexConfig }): string {
  // TODO: implement
  //
  // 1. Build a registry of all block definitions across the config.
  //    Walk all collections (user, media, auth) and globals.
  //    For each field, if field.type === "blocks", collect all block defs.
  //    Deduplicate by slug. Recursively check block fields for nested blocks.
  //    Build blockInterfaceNames: Map<slug, interfaceName>.
  //    → Use block.interfaceName ?? slugToInterfaceName({ slug: block.slug })
  //
  // 2. Build a registry of all collection interface names.
  //    For each collection: collection.interfaceName ?? slugToInterfaceName({ slug: collection.slug })
  //    For each global: global.interfaceName ?? slugToInterfaceName({ slug: global.slug })
  //    Check for duplicate names across ALL registries (collections, globals, blocks).
  //    → Throw VexError if duplicates found.
  //
  // 3. Generate the file header:
  //    "// ⚠️ AUTO-GENERATED BY VEX CMS — DO NOT EDIT ⚠️"
  //    ""
  //    "import type { Id } from './\_generated/dataModel';"
  //    (only if any relationship/upload fields exist)
  //
  // 4. Generate block interfaces (before collections, since collections reference them):
  //    For each block (sorted by slug for deterministic output):
  //      "export interface {InterfaceName} {"
  //      "  blockType: '{slug}';"
  //      "  blockName?: string;"
  //      "  _key: string;"
  //      For each field in block.fields:
  //        "  /** {label} */" (if label exists)
  //        "  {fieldName}{?}: {typeString};"
  //        (? if not required)
  //      "}"
  //
  // 5. Generate collection interfaces:
  //    For each user collection:
  //      a. Check if auth collection matches (by slug). If so, merge fields.
  //      b. Generate interface:
  //         "export interface {InterfaceName} {"
  //         "  _id: Id<'{slug}'>;"
  //         "  _creationTime: number;"
  //         If versioned (collection.versions?.drafts):
  //           "  vex_status?: 'draft' | 'published';"
  //           "  vex_version?: number;"
  //           "  vex_publishedAt?: number;"
  //         For each field:
  //           "  /** {label} */" (if label exists)
  //           "  {fieldName}{?}: {typeString};"
  //         "}"
  //    For auth-only collections (not matched to a user collection):
  //      Same pattern but no merge step.
  //    For media collections:
  //      Include locked fields: storageId: string, filename: string, mimeType: string, size: number
  //      Include overridable fields: url?: string, width?: number, height?: number
  //      Plus user-defined fields.
  //
  // 6. Generate global interfaces:
  //    For each global:
  //      "export interface {InterfaceName} {"
  //      "  _id: Id<'vex_globals'>;"
  //      "  _creationTime: number;"
  //      "  vexGlobalSlug: '{slug}';"
  //      For each field:
  //        "  /** {label} */" (if label exists)
  //        "  {fieldName}{?}: {typeString};"
  //      "}"
  //
  // 7. Generate barrel types:
  //    "export interface VexCollectionTypes {"
  //    "  {slug}: {InterfaceName};"
  //    "}"
  //    ""
  //    "export interface VexGlobalTypes {"
  //    "  {slug}: {InterfaceName};"
  //    "}"
  //
  // 8. Join all parts and return.
  //
  // Edge cases:
  // - UI fields: skip entirely (no database representation)
  // - Empty collections (no fields): still generate interface with _id + _creationTime
  // - Blocks with no fields: interface has blockType + blockName + _key only
  // - Auth collection that also appears in user collections: merge, don't duplicate
  throw new Error("Not implemented");
}
```

### File: `packages/core/src/typeGen/generateVexTypes.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { generateVexTypes } from "./generateVexTypes";
import { text, number, checkbox, select, date, relationship, json, array, richtext, upload } from "../fields";
import { blocks } from "../fields/blocks";
import { defineBlock } from "../blocks/defineBlock";
import { defineCollection } from "../config/defineCollection";
import type { VexConfig } from "../types";

/** Minimal config factory for testing. */
function makeConfig(overrides: Partial<VexConfig>): VexConfig {
  return {
    basePath: "/admin",
    collections: [],
    globals: [],
    admin: { meta: {}, sidebar: {} } as any,
    auth: { collections: [], userCollection: "users" } as any,
    schema: { outputPath: "/convex/vex.schema.ts", autoMigrate: false },
    ...overrides,
  };
}

describe("generateVexTypes", () => {
  it("generates interface for a basic collection", () => {
    const config = makeConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: {
            title: text({ required: true, label: "Title" }),
            body: text({ label: "Body" }),
            count: number({ label: "Count" }),
          },
        }),
      ],
    });

    const result = generateVexTypes({ config });

    expect(result).toContain("export interface Posts {");
    expect(result).toContain("_id: Id<'posts'>");
    expect(result).toContain("_creationTime: number");
    expect(result).toContain("/** Title */");
    expect(result).toContain("title: string;");
    expect(result).toContain("/** Body */");
    expect(result).toContain("body?: string;");
    expect(result).toContain("/** Count */");
    expect(result).toContain("count?: number;");
  });

  it("uses interfaceName when provided on collection", () => {
    const config = makeConfig({
      collections: [
        defineCollection({
          slug: "blog_posts",
          interfaceName: "BlogPost",
          fields: { title: text({ required: true }) },
        }),
      ],
    });

    const result = generateVexTypes({ config });
    expect(result).toContain("export interface BlogPost {");
    expect(result).not.toContain("export interface BlogPosts {");
  });

  it("generates select literal union types", () => {
    const config = makeConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: {
            status: select({
              options: [
                { label: "Draft", value: "draft" },
                { label: "Published", value: "published" },
              ],
              required: true,
            }),
          },
        }),
      ],
    });

    const result = generateVexTypes({ config });
    expect(result).toContain("status: 'draft' | 'published';");
  });

  it("generates block interfaces separately", () => {
    const heroBlock = defineBlock({
      slug: "hero",
      label: "Hero",
      fields: {
        heading: text({ required: true, label: "Heading" }),
        subheading: text({ label: "Subheading" }),
      },
    });

    const config = makeConfig({
      collections: [
        defineCollection({
          slug: "pages",
          fields: {
            content: blocks({ blocks: [heroBlock] }),
          },
        }),
      ],
    });

    const result = generateVexTypes({ config });

    // Block interface
    expect(result).toContain("export interface Hero {");
    expect(result).toContain("blockType: 'hero';");
    expect(result).toContain("blockName?: string;");
    expect(result).toContain("_key: string;");
    expect(result).toContain("/** Heading */");
    expect(result).toContain("heading: string;");
    expect(result).toContain("subheading?: string;");

    // Collection references block
    expect(result).toContain("content?: Hero[];");
  });

  it("uses interfaceName on blocks when provided", () => {
    const heroBlock = defineBlock({
      slug: "hero",
      label: "Hero",
      interfaceName: "HeroBlock",
      fields: {},
    });

    const config = makeConfig({
      collections: [
        defineCollection({
          slug: "pages",
          fields: {
            content: blocks({ blocks: [heroBlock] }),
          },
        }),
      ],
    });

    const result = generateVexTypes({ config });
    expect(result).toContain("export interface HeroBlock {");
    expect(result).toContain("content?: HeroBlock[];");
  });

  it("generates versioning fields when enabled", () => {
    const config = makeConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: { title: text({ required: true }) },
          versions: { drafts: true },
        }),
      ],
    });

    const result = generateVexTypes({ config });
    expect(result).toContain("vex_status?: 'draft' | 'published';");
    expect(result).toContain("vex_version?: number;");
    expect(result).toContain("vex_publishedAt?: number;");
  });

  it("generates global interfaces", () => {
    const config = makeConfig({
      globals: [
        {
          slug: "site_settings",
          label: "Site Settings",
          fields: {
            siteName: text({ required: true, label: "Site Name" }),
            logo: text({ label: "Logo URL" }),
          },
        },
      ],
    });

    const result = generateVexTypes({ config });
    expect(result).toContain("export interface SiteSettings {");
    expect(result).toContain("/** Site Name */");
    expect(result).toContain("siteName: string;");
    expect(result).toContain("logo?: string;");
  });

  it("generates barrel VexCollectionTypes", () => {
    const config = makeConfig({
      collections: [
        defineCollection({ slug: "posts", fields: {} }),
        defineCollection({ slug: "articles", fields: {} }),
      ],
    });

    const result = generateVexTypes({ config });
    expect(result).toContain("export interface VexCollectionTypes {");
    expect(result).toContain("posts: Posts;");
    expect(result).toContain("articles: Articles;");
  });

  it("deduplicates blocks used in multiple collections", () => {
    const heroBlock = defineBlock({
      slug: "hero",
      label: "Hero",
      fields: { heading: text() },
    });

    const config = makeConfig({
      collections: [
        defineCollection({
          slug: "pages",
          fields: { content: blocks({ blocks: [heroBlock] }) },
        }),
        defineCollection({
          slug: "posts",
          fields: { layout: blocks({ blocks: [heroBlock] }) },
        }),
      ],
    });

    const result = generateVexTypes({ config });
    // Should only appear once
    const matches = result.match(/export interface Hero \{/g);
    expect(matches).toHaveLength(1);
  });

  it("includes Id import when relationship fields exist", () => {
    const config = makeConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: { author: relationship({ to: "users" }) },
        }),
      ],
    });

    const result = generateVexTypes({ config });
    expect(result).toContain("import type { Id } from");
  });

  it("omits Id import when no relationship/upload fields", () => {
    const config = makeConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: { title: text() },
        }),
      ],
    });

    const result = generateVexTypes({ config });
    expect(result).not.toContain("import type { Id }");
  });

  it("skips ui fields", () => {
    const config = makeConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: {
            title: text({ required: true }),
          },
        }),
      ],
    });

    const result = generateVexTypes({ config });
    expect(result).not.toContain("ui");
  });
});
```

---

## Step 5: Core Exports

- [ ] Update `packages/core/src/index.ts` — export `generateVexTypes` and `slugToInterfaceName`
- [ ] Run `pnpm --filter @vexcms/core build`

### File: `packages/core/src/index.ts` (update)

Add these exports:

```typescript
// Type generation
export { generateVexTypes } from "./typeGen/generateVexTypes";
export { slugToInterfaceName } from "./typeGen/slugToInterfaceName";
```

---

## Step 6: CLI Integration

- [ ] Update `packages/cli/src/lib/generateSchema.ts` — write `vex.types.ts` alongside `vex.schema.ts`
- [ ] Run `pnpm --filter @vexcms/cli build`
- [ ] Verify `vex dev` generates `convex/vex.types.ts`

### File: `packages/cli/src/lib/generateSchema.ts` (update)

In the `generateAndWrite()` function, after the `generateVexSchema({ config })` call and before writing `vex.schema.ts`, add type generation:

```typescript
// Add import at top:
import { generateVexTypes } from "@vexcms/core";

// Inside generateAndWrite(), after the schema content is generated:
// Generate and write vex.types.ts
const typesContent = generateVexTypes({ config });
const typesPath = resolve(cwd, outputRelPath.replace(/^\//, "").replace("vex.schema.ts", "vex.types.ts"));
const formattedTypes = await formatString(typesContent, typesPath);
const existingTypes = existsSync(typesPath) ? readFileSync(typesPath, "utf-8") : "";
if (existingTypes !== formattedTypes) {
  writeFileSync(typesPath, formattedTypes, "utf-8");
}
```

This should be placed early in the function, right after computing `finalSchema`, so it runs on every generation regardless of whether the schema changed. The types file may change independently (e.g., `interfaceName` changed but no schema impact).

---

## Success Criteria

- [ ] `slugToInterfaceName` converts all slug formats to PascalCase
- [ ] `fieldToTypeString` maps all field types to correct TS type strings
- [ ] `generateVexTypes` produces valid TypeScript with interfaces for all collections, globals, and blocks
- [ ] `interfaceName` overrides auto-generated names on collections, blocks, and globals
- [ ] Block interfaces are deduplicated when shared across collections
- [ ] Versioning system fields appear only on versioned collections
- [ ] Media locked fields appear on media collection interfaces
- [ ] JSDoc comments from field labels are included
- [ ] `_id: Id<'slug'>` and `_creationTime: number` on all collection/global interfaces
- [ ] Barrel `VexCollectionTypes` and `VexGlobalTypes` mapped types are generated
- [ ] `Id` import is conditional (only when relationship/upload fields exist)
- [ ] UI fields are skipped
- [ ] Duplicate interface names throw at generation time
- [ ] `vex dev` writes `convex/vex.types.ts` alongside `convex/vex.schema.ts`
- [ ] `pnpm build` passes
- [ ] All new tests pass
- [ ] `pnpm typecheck` passes
