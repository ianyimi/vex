# Spec 30 — Site Builder (`defineSite`)

## Overview

`defineSite()` is an optional config primitive that bundles existing collections into a site structure with header, footer, theme, settings, pages, and page groups. It auto-generates a `vex_sites` system table with typed relationships, produces typed interfaces in `vex.types.ts`, generates typed Convex query/mutation files for the `vex_sites` table, and restructures the admin sidebar to show a site tree alongside the existing collection/global sections.

Collections are passed to `defineConfig()` normally (in `collections` or `media`). `defineSite()` references them by slug — it's purely organizational. If a site references a slug that doesn't exist in the config, validation fails at config build time.

## Design Decisions

- **Slugs only in `defineSite()`:** Collections are passed to their normal locations in `defineConfig()`. The site config references them by slug. This avoids duplicate registration and keeps schema generation simple — every collection is already in `config.collections` or `config.media`.
- **Identity function pattern:** Like `defineCollection()` and `defineBlock()`, `defineSite()` is a typed identity function. No runtime side effects — just type narrowing.
- **Validation in `defineConfig()`:** After merging the config, `defineConfig()` validates that every slug referenced by every site exists in `config.collections` or `config.media.collections`. Validation is dev-only (guarded by `process.env.NODE_ENV !== "production"`).
- **`vex_sites` is a system table:** Auto-generated in `generateVexSchema()` alongside `vex_versions`. Has `slug: v.string()` plus `v.optional(v.id(...))` for each relationship field (header, footer, theme, settings). All relationship fields are optional to support incremental setup — a new site doesn't need all pieces configured immediately.
- **Collections appear in both places:** When a site claims a collection, it appears under the site tree AND stays in the generic Collections section. Multiple sites can reference the same collection.
- **Typed site query API:** Generated alongside per-collection queries. Produces `getSite` (returns IDs) and `getSitePopulated` (returns resolved documents) Convex queries.
- **No filter function (deferred):** Filtering which documents appear under a site is deferred to a future spec. Users model their own relationships via collection fields.

## Out of Scope

- "Set as Active" document UI (needs its own mutations/UI)
- Active document indicators in sidebar
- Site dashboard/overview page
- Live preview interaction with page groups
- Multi-site admin panel enhancements
- Collection filter functions on `defineSite()`
- `pages` field — pages are just a collection slug reference, same as header/footer/theme/settings

## Target Directory Structure

```
packages/core/src/
├── config/
│   ├── defineSite.ts              # NEW — defineSite() factory + VexSite type
│   ├── defineSite.test.ts         # NEW — validation tests
│   └── defineConfig.ts            # MODIFIED — add sites field, validate site slugs
├── types/
│   └── index.ts                   # MODIFIED — add sites to VexConfig, VexConfigInput, ClientVexConfig
├── valueTypes/
│   ├── generate.ts                # MODIFIED — generate vex_sites table
│   ├── generate.test.ts           # MODIFIED — add vex_sites tests
│   └── generateCollectionQueries.ts  # MODIFIED — generate site query files
├── typeGen/
│   └── generateVexTypes.ts        # MODIFIED — generate VexSiteTypes interface
├── index.ts                       # MODIFIED — export defineSite, VexSite

packages/admin-next/src/
└── components/
    └── AppSidebar/
        └── index.tsx              # MODIFIED — add site tree sections
```

## Implementation Order

1. **Step 1:** `defineSite()` factory function + `VexSite` type — after this step, `defineSite()` can be called and type-checked
2. **Step 2:** Add `sites` to `VexConfig` types + `defineConfig()` validation — after this step, sites can be passed to `defineConfig()` with slug validation
3. **Step 3:** `vex_sites` table in `generateVexSchema()` — after this step, `pnpm test` passes with new schema output tests
4. **Step 4:** Site interface in `generateVexTypes()` — after this step, `VexSiteTypes` barrel type is generated
5. **Step 5:** Site query generation in `generateCollectionQueries()` — after this step, typed `getSite`/`getSitePopulated` queries are generated
6. **Step 6:** Admin sidebar restructuring — after this step, the sidebar renders site tree sections
7. **Step 7:** Exports + final integration — after this step, full build passes

---

## Step 1: `defineSite()` Factory + Type

- [ ] Create `packages/core/src/config/defineSite.ts`
- [ ] Create `packages/core/src/config/defineSite.test.ts`
- [ ] Verify `pnpm --filter @vexcms/core test` passes

### `File: packages/core/src/config/defineSite.ts`

The factory function and type definition. `defineSite()` validates the slug format and page group uniqueness, then returns the input with correct typing.

```typescript
/**
 * Page group definition — routes a collection under a URL prefix in the site.
 */
export interface VexPageGroup {
  /** URL prefix slug. Must be lowercase alphanumeric with underscores. */
  slug: string;
  /** Display label in admin sidebar. */
  label: string;
  /** Collection slug that backs this page group. */
  collection: string;
}

/**
 * Site definition — organizes collections into a navigable site structure.
 *
 * All fields reference collection slugs. The actual collections must be
 * registered in `defineConfig({ collections: [...] })` separately.
 */
export interface VexSite {
  /** Unique site identifier. Must be lowercase alphanumeric with underscores. */
  slug: string;
  /** Display label in admin sidebar. */
  label: string;
  /** Collection slug for site settings. */
  settings?: string;
  /** Collection slug for headers. */
  header?: string;
  /** Collection slug for footers. */
  footer?: string;
  /** Collection slug for themes. */
  theme?: string;
  /** Collection slug for pages. */
  pages?: string;
  /** Page groups — route-prefixed collection references. */
  pageGroups?: VexPageGroup[];
}

/**
 * Define a site configuration.
 *
 * Validates:
 * - slug format (lowercase alphanumeric with underscores, starts with letter)
 * - slug does not use reserved "vex_" prefix
 * - page group slugs are unique within this site
 * - page group slugs follow same format rules
 *
 * Collection slug references are validated later in `defineConfig()` where
 * the full collection list is available.
 *
 * @param props - Site configuration
 * @returns The same object, typed as VexSite
 */
export function defineSite(props: VexSite): VexSite {
  // TODO: implement
  //
  // 1. Validate props.slug format: /^[a-z][a-z0-9_]*$/
  //    → throw VexSiteValidationError if invalid
  //
  // 2. Validate props.slug does not start with "vex_"
  //    → throw VexSiteValidationError if reserved
  //
  // 3. If props.pageGroups exists and has entries:
  //    a. Validate each pageGroup.slug format (same regex)
  //    b. Check for duplicate page group slugs within this site
  //       → throw VexSiteValidationError listing the duplicate
  //    c. Validate each pageGroup.slug does not start with "vex_"
  //
  // 4. Return props as-is (identity function)
  //
  // Edge cases:
  // - Empty pageGroups array is valid (no page groups)
  // - All relationship fields (settings, header, footer, theme, pages) are optional
  // - A site with only a slug and label is valid (minimal site)
  throw new Error("Not implemented");
}
```

### `File: packages/core/src/config/defineSite.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { defineSite } from "./defineSite";

describe("defineSite", () => {
  it("returns the site config as-is for valid input", () => {
    const site = defineSite({
      slug: "main",
      label: "Main Site",
      settings: "site_settings",
      header: "headers",
      footer: "footers",
      theme: "themes",
      pages: "pages",
    });
    expect(site.slug).toBe("main");
    expect(site.label).toBe("Main Site");
    expect(site.settings).toBe("site_settings");
    expect(site.header).toBe("headers");
    expect(site.footer).toBe("footers");
    expect(site.theme).toBe("themes");
    expect(site.pages).toBe("pages");
  });

  it("accepts a minimal site with only slug and label", () => {
    const site = defineSite({ slug: "blog", label: "Blog" });
    expect(site.slug).toBe("blog");
    expect(site.settings).toBeUndefined();
  });

  it("accepts valid page groups", () => {
    const site = defineSite({
      slug: "main",
      label: "Main",
      pageGroups: [
        { slug: "blog", label: "Blog", collection: "posts" },
        { slug: "docs", label: "Docs", collection: "documentation" },
      ],
    });
    expect(site.pageGroups).toHaveLength(2);
  });

  it("accepts empty page groups array", () => {
    const site = defineSite({
      slug: "main",
      label: "Main",
      pageGroups: [],
    });
    expect(site.pageGroups).toHaveLength(0);
  });

  it("throws on invalid slug format", () => {
    expect(() => defineSite({ slug: "Main-Site", label: "Main" })).toThrow();
    expect(() => defineSite({ slug: "123abc", label: "Main" })).toThrow();
    expect(() => defineSite({ slug: "", label: "Main" })).toThrow();
  });

  it("throws on reserved vex_ prefix", () => {
    expect(() => defineSite({ slug: "vex_main", label: "Main" })).toThrow();
  });

  it("throws on duplicate page group slugs", () => {
    expect(() =>
      defineSite({
        slug: "main",
        label: "Main",
        pageGroups: [
          { slug: "blog", label: "Blog", collection: "posts" },
          { slug: "blog", label: "Blog 2", collection: "articles" },
        ],
      }),
    ).toThrow(/duplicate/i);
  });

  it("throws on invalid page group slug format", () => {
    expect(() =>
      defineSite({
        slug: "main",
        label: "Main",
        pageGroups: [{ slug: "My-Blog", label: "Blog", collection: "posts" }],
      }),
    ).toThrow();
  });

  it("throws on page group slug with vex_ prefix", () => {
    expect(() =>
      defineSite({
        slug: "main",
        label: "Main",
        pageGroups: [
          { slug: "vex_blog", label: "Blog", collection: "posts" },
        ],
      }),
    ).toThrow();
  });
});
```

Also add the error class. Append to `packages/core/src/errors/index.ts`:

```typescript
export class VexSiteValidationError extends VexError {
  constructor(message: string) {
    super(message);
    this.name = "VexSiteValidationError";
  }
}
```

---

## Step 2: Add `sites` to Config Types + Validation

- [ ] Modify `packages/core/src/types/index.ts` — add `sites` field to `VexConfig`, `VexConfigInput`, `ClientVexConfig`
- [ ] Modify `packages/core/src/config/defineConfig.ts` — merge sites, validate slugs exist
- [ ] Create `packages/core/src/config/defineConfig.site-validation.test.ts`
- [ ] Verify `pnpm --filter @vexcms/core test` passes

### Changes to `packages/core/src/types/index.ts`

Add to `VexConfig`:
```typescript
/** Optional site definitions. Created with `defineSite()`. */
sites?: VexSite[];
```

Add to `VexConfigInput`:
```typescript
/** Optional site definitions. Created with `defineSite()`. */
sites?: VexSite[];
```

Add to `ClientVexConfig`:
```typescript
/** Site definitions (if any). */
sites?: VexSite[];
```

Add import at top:
```typescript
import type { VexSite } from "../config/defineSite";
```

Add to the `export type { ... } from "./types"` block in `index.ts`:
```typescript
VexSite,
VexPageGroup,
```

### Changes to `packages/core/src/config/defineConfig.ts`

After the existing config merge (around line 91), add site handling:

```typescript
// Handle sites
config.sites = vexConfig.sites ?? [];
```

Inside the `process.env.NODE_ENV !== "production"` validation block, add site validation after the duplicate slug check:

```typescript
// Validate site slug references
if (config.sites) {
  // Collect all available collection slugs (user + media)
  const allCollectionSlugs = new Set<string>();
  for (const c of config.collections) allCollectionSlugs.add(c.slug);
  if (config.media?.collections) {
    for (const c of config.media.collections) allCollectionSlugs.add(c.slug);
  }

  // Check for duplicate site slugs
  const siteSlugs = config.sites.map((s) => s.slug);
  const dupSiteSlugs = siteSlugs.filter((s, i) => siteSlugs.indexOf(s) !== i);
  if (dupSiteSlugs.length > 0) {
    console.warn(`[vex] Duplicate site slugs: ${dupSiteSlugs.join(", ")}`);
  }

  for (const site of config.sites) {
    // Validate each collection slug reference
    const refFields: (keyof VexSite)[] = ["settings", "header", "footer", "theme", "pages"];
    for (const field of refFields) {
      const slug = site[field];
      if (typeof slug === "string" && !allCollectionSlugs.has(slug)) {
        console.warn(
          `[vex] Site "${site.slug}" references collection "${slug}" in "${field}" but no collection with that slug exists`,
        );
      }
    }
    // Validate page group collection references
    if (site.pageGroups) {
      for (const pg of site.pageGroups) {
        if (!allCollectionSlugs.has(pg.collection)) {
          console.warn(
            `[vex] Site "${site.slug}" page group "${pg.slug}" references collection "${pg.collection}" but no collection with that slug exists`,
          );
        }
      }
    }
  }
}
```

### `File: packages/core/src/config/defineConfig.site-validation.test.ts`

```typescript
import { describe, it, expect, vi } from "vitest";
import { defineConfig } from "./defineConfig";
import { defineSite } from "./defineSite";
import { defineCollection } from "./defineCollection";
import { text } from "../fields/text";
import type { VexAuthAdapter } from "../types/auth";

const minimalAuth: VexAuthAdapter = { name: "better-auth", collections: [] };

function col(slug: string) {
  return defineCollection({
    slug,
    fields: { title: text({ label: "Title" }) },
  });
}

describe("defineConfig — site validation", () => {
  it("accepts valid sites with existing collection slugs", () => {
    const config = defineConfig({
      auth: minimalAuth,
      collections: [col("pages"), col("headers"), col("footers")],
      sites: [
        defineSite({
          slug: "main",
          label: "Main",
          pages: "pages",
          header: "headers",
          footer: "footers",
        }),
      ],
    });
    expect(config.sites).toHaveLength(1);
    expect(config.sites![0].slug).toBe("main");
  });

  it("passes sites through to resolved config", () => {
    const config = defineConfig({
      auth: minimalAuth,
      collections: [col("pages")],
      sites: [defineSite({ slug: "main", label: "Main", pages: "pages" })],
    });
    expect(config.sites![0].pages).toBe("pages");
  });

  it("defaults to empty array when sites not provided", () => {
    const config = defineConfig({ auth: minimalAuth, collections: [] });
    expect(config.sites).toEqual([]);
  });

  it("warns on site referencing non-existent collection", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    defineConfig({
      auth: minimalAuth,
      collections: [],
      sites: [
        defineSite({ slug: "main", label: "Main", header: "nonexistent" }),
      ],
    });
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("nonexistent"),
    );
    warnSpy.mockRestore();
  });

  it("warns on page group referencing non-existent collection", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    defineConfig({
      auth: minimalAuth,
      collections: [],
      sites: [
        defineSite({
          slug: "main",
          label: "Main",
          pageGroups: [
            { slug: "blog", label: "Blog", collection: "nonexistent" },
          ],
        }),
      ],
    });
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("nonexistent"),
    );
    warnSpy.mockRestore();
  });

  it("warns on duplicate site slugs", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    defineConfig({
      auth: minimalAuth,
      collections: [],
      sites: [
        defineSite({ slug: "main", label: "Main 1" }),
        defineSite({ slug: "main", label: "Main 2" }),
      ],
    });
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Duplicate site slugs"),
    );
    warnSpy.mockRestore();
  });

  it("accepts sites referencing media collections", () => {
    const { defineMediaCollection } = require("./defineCollection");
    const config = defineConfig({
      auth: minimalAuth,
      collections: [col("pages")],
      media: {
        collections: [defineMediaCollection({ slug: "media" })],
        storageAdapter: {
          name: "test",
          storageIdValueType: "v.string()",
          getUrl: async () => "",
          store: async () => "",
        },
      },
      sites: [
        defineSite({ slug: "main", label: "Main", pages: "pages" }),
      ],
    });
    expect(config.sites).toHaveLength(1);
  });
});
```

---

## Step 3: `vex_sites` Table in Schema Generation

- [ ] Modify `packages/core/src/valueTypes/generate.ts` — add `vex_sites` table generation
- [ ] Add tests to `packages/core/src/valueTypes/generate.test.ts`
- [ ] Verify `pnpm --filter @vexcms/core test` passes

### Changes to `packages/core/src/valueTypes/generate.ts`

Inside the `generateVexSchema` function, after the `vex_versions` system table block (around line 265), add `vex_sites` generation:

```typescript
// vex_sites system table — one row per defineSite()
if (config.sites && config.sites.length > 0) {
  lines.push("");
  lines.push("export const vex_sites = defineTable({");
  lines.push("  slug: v.string(),");

  // Collect all unique relationship fields across all sites
  // Each relationship field is optional (v.optional(v.id(...)))
  const relationshipFields = new Map<string, string>(); // fieldName → collectionSlug

  for (const site of config.sites) {
    if (site.header) relationshipFields.set("header", site.header);
    if (site.footer) relationshipFields.set("footer", site.footer);
    if (site.theme) relationshipFields.set("theme", site.theme);
    if (site.settings) relationshipFields.set("settings", site.settings);
  }

  for (const [fieldName, collectionSlug] of relationshipFields) {
    const tableName = config.collections.find((c) => c.slug === collectionSlug)?.tableName
      ?? config.media?.collections.find((c) => c.slug === collectionSlug)?.tableName
      ?? collectionSlug;
    lines.push(`  ${fieldName}: v.optional(v.id("${tableName}")),`);
  }

  lines.push("})");
  lines.push(`  .index("by_slug", ["slug"])`);
}
```

### Tests to add to `generate.test.ts`

```typescript
describe("vex_sites system table", () => {
  it("generates vex_sites table when sites are configured", () => {
    const config = defineConfig({
      auth: minimalAuth,
      collections: [
        defineCollection({
          slug: "pages",
          fields: { title: text({ label: "Title" }) },
        }),
        defineCollection({
          slug: "headers",
          fields: { title: text({ label: "Title" }) },
        }),
        defineCollection({
          slug: "footers",
          fields: { title: text({ label: "Title" }) },
        }),
        defineCollection({
          slug: "themes",
          fields: { name: text({ label: "Name" }) },
        }),
        defineCollection({
          slug: "site_settings",
          fields: { name: text({ label: "Name" }) },
        }),
      ],
      sites: [
        defineSite({
          slug: "main",
          label: "Main Site",
          header: "headers",
          footer: "footers",
          theme: "themes",
          settings: "site_settings",
        }),
      ],
    });
    const output = generateVexSchema({ config });
    expect(output).toContain("export const vex_sites = defineTable({");
    expect(output).toContain('slug: v.string()');
    expect(output).toContain('header: v.optional(v.id("headers"))');
    expect(output).toContain('footer: v.optional(v.id("footers"))');
    expect(output).toContain('theme: v.optional(v.id("themes"))');
    expect(output).toContain('settings: v.optional(v.id("site_settings"))');
    expect(output).toContain('.index("by_slug", ["slug"])');
  });

  it("does not generate vex_sites when no sites configured", () => {
    const config = defineConfig({
      auth: minimalAuth,
      collections: [
        defineCollection({
          slug: "pages",
          fields: { title: text({ label: "Title" }) },
        }),
      ],
    });
    const output = generateVexSchema({ config });
    expect(output).not.toContain("vex_sites");
  });

  it("uses tableName instead of slug when collection has custom tableName", () => {
    const config = defineConfig({
      auth: minimalAuth,
      collections: [
        defineCollection({
          slug: "headers",
          tableName: "site_headers",
          fields: { title: text({ label: "Title" }) },
        }),
      ],
      sites: [
        defineSite({
          slug: "main",
          label: "Main",
          header: "headers",
        }),
      ],
    });
    const output = generateVexSchema({ config });
    expect(output).toContain('header: v.optional(v.id("site_headers"))');
  });

  it("generates minimal vex_sites with only slug field when site has no relationships", () => {
    const config = defineConfig({
      auth: minimalAuth,
      collections: [],
      sites: [defineSite({ slug: "main", label: "Main" })],
    });
    const output = generateVexSchema({ config });
    expect(output).toContain("export const vex_sites = defineTable({");
    expect(output).toContain("slug: v.string()");
    expect(output).not.toContain("header:");
    expect(output).not.toContain("footer:");
  });
});
```

---

## Step 4: Site Interface in Type Generation

- [ ] Modify `packages/core/src/typeGen/generateVexTypes.ts` — add site interface + `VexSiteTypes` barrel
- [ ] Add tests to existing type generation test file
- [ ] Verify `pnpm --filter @vexcms/core test` passes

### Changes to `packages/core/src/typeGen/generateVexTypes.ts`

After the `VexGlobalTypes` barrel (section 8, around line 254), add site type generation:

```typescript
// ── 9. Site interfaces ──

if (config.sites && config.sites.length > 0) {
  for (const site of config.sites) {
    const name = site.slug === "main"
      ? "VexMainSite"
      : slugToInterfaceName({ slug: site.slug }) + "Site";
    registerName(name, `site "${site.slug}"`);

    const siteLines: string[] = [];
    siteLines.push(`export interface ${name} {`);
    siteLines.push(`  _id: Id<'vex_sites'>;`);
    siteLines.push(`  _creationTime: number;`);
    siteLines.push(`  slug: '${site.slug}';`);

    // Relationship fields — reference the collection's interface type
    const refFields: { field: string; slug: string | undefined }[] = [
      { field: "header", slug: site.header },
      { field: "footer", slug: site.footer },
      { field: "theme", slug: site.theme },
      { field: "settings", slug: site.settings },
    ];

    for (const ref of refFields) {
      if (ref.slug) {
        const tableName = config.collections.find((c) => c.slug === ref.slug)?.tableName
          ?? config.media?.collections.find((c) => c.slug === ref.slug)?.tableName
          ?? ref.slug;
        siteLines.push(`  ${ref.field}?: Id<'${tableName}'>;`);
      }
    }

    siteLines.push("}");
    parts.push(siteLines.join("\n"));
    parts.push("");
  }

  // VexSiteTypes barrel
  const siteEntries = config.sites
    .map((site) => {
      const name = site.slug === "main"
        ? "VexMainSite"
        : slugToInterfaceName({ slug: site.slug }) + "Site";
      return `  ${site.slug}: ${name};`;
    })
    .join("\n");
  parts.push(`export interface VexSiteTypes {\n${siteEntries}\n}`);
  parts.push("");
}
```

### Test to add

```typescript
describe("site type generation", () => {
  it("generates site interface with relationship Id fields", () => {
    const config = defineConfig({
      auth: minimalAuth,
      collections: [
        defineCollection({ slug: "headers", fields: { title: text({ label: "T" }) } }),
        defineCollection({ slug: "footers", fields: { title: text({ label: "T" }) } }),
      ],
      sites: [
        defineSite({
          slug: "main",
          label: "Main",
          header: "headers",
          footer: "footers",
        }),
      ],
    });
    const output = generateVexTypes({ config });
    expect(output).toContain("export interface VexMainSite {");
    expect(output).toContain("_id: Id<'vex_sites'>");
    expect(output).toContain("slug: 'main'");
    expect(output).toContain("header?: Id<'headers'>");
    expect(output).toContain("footer?: Id<'footers'>");
  });

  it("generates VexSiteTypes barrel", () => {
    const config = defineConfig({
      auth: minimalAuth,
      collections: [],
      sites: [defineSite({ slug: "main", label: "Main" })],
    });
    const output = generateVexTypes({ config });
    expect(output).toContain("export interface VexSiteTypes {");
    expect(output).toContain("main: VexMainSite;");
  });

  it("does not generate site types when no sites configured", () => {
    const config = defineConfig({
      auth: minimalAuth,
      collections: [],
    });
    const output = generateVexTypes({ config });
    expect(output).not.toContain("VexSiteTypes");
    expect(output).not.toContain("VexMainSite");
  });

  it("names non-main sites with PascalCase + Site suffix", () => {
    const config = defineConfig({
      auth: minimalAuth,
      collections: [],
      sites: [defineSite({ slug: "docs_portal", label: "Docs" })],
    });
    const output = generateVexTypes({ config });
    expect(output).toContain("export interface DocsPortalSite {");
  });
});
```

---

## Step 5: Site Query Generation

- [ ] Modify `packages/core/src/valueTypes/generateCollectionQueries.ts` — add site query file generation
- [ ] Add tests for generated site query content
- [ ] Verify `pnpm --filter @vexcms/core test` passes

### Changes to `packages/core/src/valueTypes/generateCollectionQueries.ts`

Add site query generation at the end of the `generateCollectionQueries` function, after the barrel index generation:

```typescript
// Site queries
if (config.sites && config.sites.length > 0) {
  const { siteApiFile, siteModelFile } = generateSiteQueryFiles({
    config,
    imports,
  });
  result["api/vex_sites.ts"] = siteApiFile;
  result["model/api/vex_sites.ts"] = siteModelFile;
  slugs.push("vex_sites");
}
```

Add the new helper functions:

```typescript
/**
 * Generate site query files.
 *
 * Produces:
 * - model/api/vex_sites.ts — getSite (IDs only) + getSitePopulated (resolved docs)
 * - api/vex_sites.ts — Convex query exports wrapping the model functions
 */
function generateSiteQueryFiles(props: {
  config: VexConfig;
  imports: CollectionQueryImports;
}): { siteApiFile: string; siteModelFile: string } {
  // TODO: implement
  //
  // 1. Build the model file (model/api/vex_sites.ts):
  //    a. Import Doc, Id, QueryCtx from _generated
  //    b. getSite function:
  //       - Takes { ctx: QueryCtx, slug: string }
  //       - Queries vex_sites table by slug index
  //       - Returns Doc<"vex_sites"> | null
  //    c. getSitePopulated function:
  //       - Takes { ctx: QueryCtx, slug: string }
  //       - Queries vex_sites by slug
  //       - For each relationship field (header, footer, theme, settings),
  //         if the ID exists, fetch the document via ctx.db.get()
  //       - Return object with { site: Doc<"vex_sites">, header: Doc<"headers"> | null, ... }
  //       - The relationship fields are determined from props.config.sites
  //       - Use the FIRST site's field definitions to determine which fields exist
  //         (all sites share the same vex_sites table schema)
  //
  // 2. Build the API file (api/vex_sites.ts):
  //    a. Import query from _generated/server
  //    b. Import getSite, getSitePopulated from model
  //    c. Export `get` query: args { slug: v.string() }, calls getSite
  //    d. Export `getPopulated` query: args { slug: v.string() }, calls getSitePopulated
  //    e. No auth checks needed — site config is public data
  //
  // Edge cases:
  // - Site doc doesn't exist yet → return null
  // - Relationship ID exists but referenced doc was deleted → return null for that field
  // - No relationship fields configured on any site → still generate getSite, skip populated fields
  throw new Error("Not implemented");
}
```

### Tests

```typescript
describe("site query generation", () => {
  it("generates vex_sites query files when sites exist", () => {
    const config = defineConfig({
      auth: minimalAuth,
      collections: [
        defineCollection({ slug: "headers", fields: { title: text({ label: "T" }) } }),
      ],
      sites: [defineSite({ slug: "main", label: "Main", header: "headers" })],
    });
    const files = generateCollectionQueries({
      config,
      imports: {
        vexConfigFromApi: "../../../vex.config",
        generatedDirFromApi: "../../_generated",
        authFromApi: "../auth",
        generatedDirFromModel: "../../../_generated",
      },
    });
    expect(files["api/vex_sites.ts"]).toBeDefined();
    expect(files["model/api/vex_sites.ts"]).toBeDefined();
  });

  it("does not generate site files when no sites", () => {
    const config = defineConfig({
      auth: minimalAuth,
      collections: [],
    });
    const files = generateCollectionQueries({
      config,
      imports: {
        vexConfigFromApi: "../../../vex.config",
        generatedDirFromApi: "../../_generated",
        authFromApi: "../auth",
        generatedDirFromModel: "../../../_generated",
      },
    });
    expect(files["api/vex_sites.ts"]).toBeUndefined();
  });

  it("includes vex_sites in barrel index when sites exist", () => {
    const config = defineConfig({
      auth: minimalAuth,
      collections: [],
      sites: [defineSite({ slug: "main", label: "Main" })],
    });
    const files = generateCollectionQueries({
      config,
      imports: {
        vexConfigFromApi: "../../../vex.config",
        generatedDirFromApi: "../../_generated",
        authFromApi: "../auth",
        generatedDirFromModel: "../../../_generated",
      },
    });
    expect(files["api/index.ts"]).toContain("vex_sites");
  });

  it("generated model file contains getSite and getSitePopulated", () => {
    const config = defineConfig({
      auth: minimalAuth,
      collections: [
        defineCollection({ slug: "headers", fields: { title: text({ label: "T" }) } }),
      ],
      sites: [defineSite({ slug: "main", label: "Main", header: "headers" })],
    });
    const files = generateCollectionQueries({
      config,
      imports: {
        vexConfigFromApi: "../../../vex.config",
        generatedDirFromApi: "../../_generated",
        authFromApi: "../auth",
        generatedDirFromModel: "../../../_generated",
      },
    });
    const modelFile = files["model/api/vex_sites.ts"];
    expect(modelFile).toContain("export async function getSite");
    expect(modelFile).toContain("export async function getSitePopulated");
    expect(modelFile).toContain('vex_sites');
    expect(modelFile).toContain('.withIndex("by_slug"');
  });
});
```

---

## Step 6: Admin Sidebar Restructuring

- [ ] Modify `packages/admin-next/src/components/AppSidebar/index.tsx` — add site tree sections
- [ ] Verify admin panel renders correctly with `pnpm dev` in test-app

### Changes to `packages/admin-next/src/components/AppSidebar/index.tsx`

The sidebar currently renders two sections: "Collections" and "Globals". When sites are configured, add a section for each site ABOVE the Collections section. Each site section contains nav items for its claimed collections (settings, header, footer, theme, pages, page groups).

Collections still appear in the "Collections" section too (show in both places).

Inside the `useMemo` callback, after building `collectionGroups` and `globalGroups`, add site navigation building:

```typescript
// Build site navigation trees
const siteNavs: { title: string; items: CollectionNavItem[] }[] = [];
if (config.sites) {
  for (const site of config.sites) {
    const siteItems: CollectionNavItem[] = [];

    // Helper to find and build nav item for a collection slug
    const addCollectionItem = (label: string, slug: string | undefined) => {
      if (!slug) return;
      const col = accessibleCollections.find((c) => c.slug === slug);
      if (!col) return;
      siteItems.push({
        title: label,
        url: `${config.basePath}/${slug}`,
        slug,
      });
    };

    addCollectionItem("Settings", site.settings);
    addCollectionItem("Header", site.header);
    addCollectionItem("Footer", site.footer);
    addCollectionItem("Theme", site.theme);
    addCollectionItem("Pages", site.pages);

    // Page groups
    if (site.pageGroups) {
      for (const pg of site.pageGroups) {
        addCollectionItem(pg.label, pg.collection);
      }
    }

    if (siteItems.length > 0) {
      siteNavs.push({ title: site.label, items: siteItems });
    }
  }
}
```

Add `siteNavs` to the return value of useMemo.

In the JSX, render site sections before the Collections section:

```tsx
<SidebarContent>
  {nav.siteNavs.map((siteNav) => (
    <NavSection
      key={siteNav.title}
      title={siteNav.title}
      items={[{ title: siteNav.title, items: siteNav.items }]}
    />
  ))}
  <NavSection title="Collections" items={nav.collectionGroups} />
  {(!config.admin.sidebar.hideGlobals || config.globals.length > 0) && (
    <NavSection title="Globals" items={nav.globalGroups} />
  )}
</SidebarContent>
```

Add `config.sites` to the useMemo dependency array.

---

## Step 7: Exports + Final Integration

- [ ] Modify `packages/core/src/index.ts` — export `defineSite`, `VexSite`, `VexPageGroup`
- [ ] Modify `packages/core/src/config/sanitizeConfig.ts` — pass sites through
- [ ] Run `pnpm build` from monorepo root
- [ ] Run `pnpm --filter @vexcms/core test` — all tests pass
- [ ] Manually test with test-app: add a `defineSite()` to `vex.config.ts`, run `pnpm vex:generate`, verify `vex.schema.ts` contains `vex_sites` table, verify `vex.types.ts` contains site interface

### Changes to `packages/core/src/index.ts`

Add export:
```typescript
export { defineSite } from "./config/defineSite";
```

Add to the `export type { ... } from "./types"` block:
```typescript
VexSite,
VexPageGroup,
```

### Changes to `packages/core/src/config/sanitizeConfig.ts`

In `sanitizeConfigForClient`, pass `sites` through:

```typescript
return {
  ...rest,
  // ... existing collection mapping ...
  sites: rest.sites,
  // ... existing media handling ...
};
```

The `sites` array is plain data (strings and objects) — no non-serializable values to strip.

## Success Criteria

- [ ] `defineSite()` validates slug format and page group uniqueness
- [ ] `defineConfig()` validates that all site slug references exist in collections/media
- [ ] `generateVexSchema()` produces `vex_sites` table with correct `v.id()` references and `by_slug` index
- [ ] `generateVexTypes()` produces typed site interfaces with `Id<>` relationship fields and `VexSiteTypes` barrel
- [ ] `generateCollectionQueries()` produces `getSite` and `getSitePopulated` query files for `vex_sites`
- [ ] Admin sidebar shows site tree sections above Collections when sites are configured
- [ ] Collections claimed by sites still appear in the Collections section
- [ ] All existing tests pass — no regressions
- [ ] `pnpm build` succeeds across the monorepo
- [ ] Test-app can use `defineSite()` and see correct schema/type output
