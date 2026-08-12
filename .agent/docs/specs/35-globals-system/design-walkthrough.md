# Spec 35 — Globals System: Design Walkthrough

End-to-end guide to the globals API from the consumer's perspective. Read this
before implementing. The spec.md has the file-by-file detail; this document
has the working code and the full rationale for every design decision.

---

## What the user writes

### 1. Define globals in the project

```ts
// apps/www/src/vexcms/globals/siteSettings.ts
import { defineGlobal, text, relationship, upload } from "@vexcms/core";

export const siteSettings = defineGlobal({
  slug: "siteSettings",
  label: "Site Settings",
  fields: {
    siteName: text({ label: "Site Name", required: true }),
    siteDescription: text({ label: "Site Description" }),
    activeTheme: relationship({ label: "Active Theme", collection: "themes" }),
    favicon: upload({ label: "Favicon", to: "media" }),
  },
  admin: {
    group: "Site Builder",
    description: "Global settings applied across the entire site.",
  },
  versions: { drafts: true }, // opt-in draft/publish workflow
});

// apps/www/src/vexcms/globals/navigationConfig.ts
export const navigationConfig = defineGlobal({
  slug: "navigationConfig",
  label: "Navigation",
  fields: {
    primaryLinks: array({
      field: object({
        fields: {
          label: text({ label: "Label", required: true }),
          href: text({ label: "URL", required: true }),
        },
      }),
    }),
  },
  admin: { group: "Site Builder" },
});
```

### 2. Register in vex.config.ts

```ts
// apps/www/src/vex.config.ts
import { defineConfig } from "@vexcms/core";
import { siteSettings, navigationConfig } from "./vexcms/globals";
import { posts, authors } from "./vexcms/collections";

export default defineConfig({
  collections: [posts, authors],
  globals: [siteSettings, navigationConfig],
});
```

### 3. Wire the Convex endpoints

```ts
// apps/www/convex/vex.ts
import { queryApi, mutationApi, globalsApi } from "@vexcms/core/server";
import { query, mutation } from "./_generated/server";
import config from "../src/vex.config";

export const { find, get, search } = queryApi(config, query);
export const { create, update, remove } = mutationApi(config, mutation);
export const { globals } = globalsApi(config, query, mutation);
// Registers:
//   api.vex.globals.get   (query)
//   api.vex.globals.find  (query)
//   api.vex.globals.set   (mutation)
```

### 4. Run vex generate

```bash
pnpm vex dev --once
```

`vex.schema.ts` gains:

```ts
export const vex_globals = defineTable({
  slug: v.string(),
  data: v.any(),
  vex_status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
  vex_version: v.optional(v.number()),
  vex_publishedAt: v.optional(v.number()),
})
  .index("by_slug", ["slug"])
```

`vex.types.ts` gains:

```ts
export interface SiteSettingsData {
  siteName: string;
  siteDescription?: string;
  activeTheme?: string;  // relationship stored as Id string
  favicon?: string;
}

export interface NavigationConfigData {
  primaryLinks?: Array<{ label: string; href: string }>;
}

export type GlobalSlug = "siteSettings" | "navigationConfig";

export type GlobalDocumentBySlug = {
  siteSettings: SiteSettingsData;
  navigationConfig: NavigationConfigData;
};

declare module "@vexcms/core" {
  interface GeneratedVexTypes {
    // ... existing CollectionSlug, DocumentBySlug, etc.
    GlobalSlug: "siteSettings" | "navigationConfig";
    GlobalDocumentBySlug: {
      siteSettings: SiteSettingsData;
      navigationConfig: NavigationConfigData;
    };
  }
}
```

---

## Reading a global (frontend pages)

### React component — via useQuery

```tsx
// apps/www/src/app/page.tsx
import { useQuery } from "@tanstack/react-query";
import { globals } from "@vexcms/core/client";

export function SiteHeader() {
  const { data: doc } = useQuery(globals.get({ slug: "siteSettings" }));
  // doc: VexDocumentGlobal<"siteSettings"> | null
  // doc?.data.siteName  → string
  // doc?.data.activeTheme → string (Id) — not populated in v35

  if (!doc) return <header>Loading...</header>;
  return <header>{doc.data.siteName}</header>;
}
```

### Server component — via prefetchQuery

```tsx
// apps/www/src/app/layout.tsx (server component)
import { prefetchQuery } from "@convex-dev/react-query";
import { globals } from "@vexcms/core/client";
import { getQueryClient } from "~/lib/queryClient";

export default async function RootLayout({ children }) {
  const queryClient = getQueryClient();
  await prefetchQuery(queryClient, globals.get({ slug: "siteSettings" }));
  // The above gives the client component its initialData — no loading spinner.
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  );
}
```

### Custom Convex query — server-side join

```ts
// apps/www/convex/site.ts
import { query } from "./_generated/server";
import { getGlobal } from "@vexcms/core/server";

export const getSiteData = query({
  handler: async (ctx) => {
    const settings = await getGlobal({ ctx, slug: "siteSettings" });
    // settings?.data.siteName → string | undefined
    const nav = await getGlobal({ ctx, slug: "navigationConfig" });
    return { settings: settings?.data, nav: nav?.data };
  },
});
```

---

## Writing a global (admin panel)

### GlobalEditView (internal component behaviour)

The `GlobalEditView` handles everything — the user just mounts it on the route:

```tsx
// apps/www/src/app/admin/globals/[[...slug]]/page.tsx
import { GlobalEditView } from "@vexcms/react";
import config from "~/vex.config";

export default function GlobalPage({ params }: { params: { slug?: string[] } }) {
  const slug = params.slug?.[0];
  if (!slug) return <GlobalsListView config={config} />;
  return <GlobalEditView slug={slug} config={config} />;
}
```

Internally, `GlobalEditView` runs:

```ts
// Reading — reactive, no loading spinners via initialData from prefetch
const { data: doc } = useQuery(globals.get({ slug }));

// Writing — Save button triggers:
const setMutation = useMutation({ mutationFn: globals.set() });
setMutation.mutate({ slug, data: formValues });
```

### Listing all globals

```tsx
// apps/www/src/app/admin/globals/page.tsx
import { GlobalsListView } from "@vexcms/react";
import config from "~/vex.config";

export default function GlobalsPage() {
  return <GlobalsListView config={config} />;
}
```

`GlobalsListView` derives its list from `config.globals` — it always shows all registered globals, even those never saved (shown as "Not yet saved"). It runs `useQuery(globals.find({}))` only to overlay status badges and timestamps.

---

## Type narrowing examples

### Correct slug — no error

```ts
import { globals } from "@vexcms/core/client";

// ✓ After vex generate — "siteSettings" is in GlobalSlug
globals.get({ slug: "siteSettings" });
globals.get({ slug: "navigationConfig" });
```

### Unknown slug — compile error

```ts
// ✗ "themeConfig" is not a member of GlobalSlug
globals.get({ slug: "themeConfig" });
//                    ^^^^^^^^^^^
// Argument of type '"themeConfig"' is not assignable to
// parameter of type 'GetGlobalClientArgs<GlobalSlug>'
```

### Typed data access — narrowed by slug

```ts
const { data: doc } = useQuery(globals.get({ slug: "siteSettings" }));
//     doc: VexDocumentGlobal<"siteSettings"> | null | undefined

doc?.data.siteName;       // ✓ string
doc?.data.siteDescription; // ✓ string | undefined
doc?.data.nonExistentKey; // ✗ Property 'nonExistentKey' does not exist
```

### Before vex generate — types are permissive (safe fallback)

```ts
// Before generation: GlobalSlug = string, so any slug is accepted.
// This matches the behavior of CollectionSlug before generation.
globals.get({ slug: "anything" }); // ✓ (no error — GlobalSlug = string)
```

---

## Layering diagram

```
User code (apps/www)
  │
  ├── defineConfig({ globals: [siteSettings, nav] })
  │     ↓
  │   VexConfig.globals: GlobalConfig[]
  │
  ├── globalsApi(config, query, mutation)  ← called once in convex/vex.ts
  │     ↓
  │   api.vex.globals.get    (Convex query)
  │   api.vex.globals.find   (Convex query)
  │   api.vex.globals.set    (Convex mutation)
  │
  ├── vex generate  (CLI)
  │     ↓
  │   generateVexSchema → vex_globals table in vex.schema.ts
  │   generateVexTypes  → GlobalSlug, GlobalDocumentBySlug in vex.types.ts
  │                        → declare module "@vexcms/core" augmentation
  │
  ├── Frontend pages
  │     useQuery(globals.get({ slug: "siteSettings" }))
  │       → convexQuery(api.vex.globals.get, { slug })
  │         → getGlobal({ ctx, slug })
  │           → ctx.db.query("vex_globals").withIndex("by_slug").first()
  │
  └── Admin panel
        GlobalEditView
          ├── useQuery(globals.get({ slug }))         ← read
          └── useMutation({ mutationFn: globals.set() }) ← write
                → setGlobal({ ctx, slug, data, globalConfig })
                  ├── generateFormSchema(fields).safeParse(data)  ← validate
                  └── ctx.db.patch / ctx.db.insert  ← upsert
```

---

## Decisions Reference

Full rationale for every entry in `spec.md` § *Design Decisions*.

### D1 — Single `vex_globals` table rather than one table per global

The reference architecture (`.rebuild/reference/`) used a separate Convex table per global (e.g. `siteSettings` table with one document). This was the straightforward approach — typed fields, Convex schema enforcement, indexes on individual fields. But it has real costs:

**Migration overhead.** Every time a developer adds a field to `defineGlobal()`, they need a Convex schema migration (adding `v.optional(...)` to the table). With `vex_globals + v.any()`, adding a new field to the config requires zero migration — you just start writing the new field, old documents keep working.

**Dashboard table sprawl.** With 10 globals, you get 10 Convex tables each containing exactly one row. The Convex dashboard becomes cluttered and each table's purpose is opaque ("what is `siteSettings`? what table is this from?"). A single `vex_globals` table with a `slug` column is immediately readable.

**`findGlobals()` complexity.** If each global is its own table, listing all globals requires `Promise.all([ctx.db.query("siteSettings").first(), ctx.db.query("nav").first(), ...])` — N independent queries merged in application code. With `vex_globals`, it's a single `collect()`.

**The lost benefit** (DB-level type enforcement) is a real tradeoff but acceptable here. Globals are low-write (admin users saving settings, not high-throughput mutations), always go through Zod validation before insert, and the TypeScript layer provides compile-time safety after `vex generate`. This is the same tradeoff Payload CMS makes with its JSONB `data` column on the Postgres globals table.

### D2 — Validation at the API layer, not the database

Convex's `v.any()` lets anything through. The correctness guarantee comes from `generateFormSchema(fields).safeParse(data)` in `setGlobal` — the same Zod schema generation used by collection mutations. If validation fails, a `ConvexError` is thrown with the `errors` payload. The DB never sees invalid data.

This is consistent with how `create` and `update` work for collections in the current codebase — the Convex validator is `v.any()` for the `data` arg, and Zod runs server-side in the handler.

### D3 — `v.any()` rather than `v.record(v.string(), v.any())`

`v.record(v.string(), v.any())` constrains `data` to "object with string keys" — which sounds more precise. But Convex's `v.record()` validator rejects arrays, which means a global with a `blocks()` or top-level `array()` field would fail the validator even after passing Zod. `v.any()` is strictly more permissive and lets us store any serializable Convex value. Since Zod handles semantic validation, the DB validator's only job is "can Convex store this?" — `v.any()` is the right choice.

### D4 — `globals.get` and `globals.find` mirror the collection factory pattern

The `queryApi`/`mutationApi` pattern (Spec 23) is already familiar. `globalsApi` follows the exact same shape: accepts `(config, query, mutation)`, returns registered Convex handlers. Users call it once in `convex/vex.ts` and get `api.vex.globals.*` endpoints. This is predictable by extension — if you know `queryApi`, you know `globalsApi`.

The nested `globals` key in the returned object is deliberate: `export const { globals } = globalsApi(...)` gives users `api.vex.globals.get` at the expected path, and reading `globals.get({ slug })` in application code reads naturally.

### D5 — Single `setGlobal` upsert (no create/update split)

Globals are singletons. The first save creates the document; every subsequent save patches it. There is no scenario where a user wants "create without patching" or "patch only if it already exists." The upsert pattern (find-by-slug → patch or insert) eliminates the initialization dance and makes every call to `setGlobal` idempotent from the caller's perspective.

This also means the admin UI never has to check "has this global been saved before?" — `GlobalEditView` just calls `setGlobal` on every form submit.

### D6 — `GlobalSlug` + `GlobalDocumentBySlug` augment `GeneratedVexTypes` (same registry)

The existing rule from Spec 23: **one `GeneratedVexTypes` interface, multiple properties.** Adding `GlobalSlug` and `GlobalDocumentBySlug` as two new properties on the existing interface keeps the entire type registry in one place. No new augmentation interfaces (`GeneratedGlobalTypes`, `GeneratedGlobalsRegistry`, etc.) — those fragment the registry and create two places to look.

The fallback behavior matches collections: before `vex generate`, `GlobalSlug = string` (any slug accepted), `GlobalDocumentBySlug = Record<string, unknown>` (any data shape). After generation, both narrow to the specific registered values.

### D7 — `GlobalDocumentBySlug[TSlug]` types the `data` field, not the whole row

`VexDocumentGlobal<TSlug>` is the full DB row wrapper — includes `_id`, `_creationTime`, `slug`, `vex_status`, etc. The user-defined fields live in `data`. This mirrors the structure of `VexDocument` for collections (system fields + user fields), except the user fields are in a nested `data` object rather than flat on the document.

Why not flatten? Flattening would collide `_id`/`_creationTime`/`slug`/`vex_status` with user field names. A user could define a field named `slug` on their global — with nesting, there's no collision. The `data` wrapper is explicit and unambiguous.

The TypeScript generic `VexDocumentGlobal<TSlug>` narrows `data` to `GlobalDocumentBySlug[TSlug]` when `TSlug` is known. In application code:

```ts
const doc = useQuery(globals.get({ slug: "siteSettings" }))
// doc.data is GlobalDocumentBySlug["siteSettings"] = SiteSettingsData
// doc.data.siteName is string
```

### D8 — `vex_globals` emitted only when `config.globals.length > 0`

Projects without globals (the majority of projects starting out) should not have a `vex_globals` table in their schema at all. An empty table adds noise to the Convex dashboard and counts against any table limits. The generator conditionally adds the table only when needed. Adding a first global triggers a schema migration that creates the table — this is expected and unambiguous.

### D9 — Draft fields on the `vex_globals` row; `vex_versions` references `vex_globals` by `_id`

The existing `vex_versions` system table already stores version history with `{ collection: string, documentId: string, ... }`. Globals plug into this with `collection: "vex_globals"` and `documentId: globalDoc._id`. No schema changes to `vex_versions` are needed — the version history system already handles arbitrary collection names as strings.

The `vex_status`, `vex_version`, and `vex_publishedAt` fields are on the `vex_globals` row itself (not in `data`) — they're system metadata, not user content. This is consistent with how `_status`, `_version`, `_publishedAt` are treated on collection documents.

### D10 — Draft support is opt-in per global via `versions: { drafts: true }`

Not all globals need draft/publish workflow. A "Site Settings" global probably does (don't accidentally publish changes to the site name without review). A "Navigation Config" global might not (the nav is simpler, errors are less catastrophic). Opt-in means the default is the simplest path: save → immediately live.

When `versions.drafts = false` (default), `setGlobal` writes `data` directly without touching `vex_status` or `vex_version`. The row is always considered "published." When `versions.drafts = true`, `vex_status`, `vex_version`, and `vex_publishedAt` are written on every save.

The draft UI (Save Draft / Publish buttons) is out of scope for v35 — the schema supports it, but `GlobalEditView` only shows "Save" (always publishes). The draft toolbar follows in a later spec.

### D11 — `globalsApi` returns `{ globals }` (nested object)

```ts
export const { globals } = globalsApi(config, query, mutation);
// → api.vex.globals.get, api.vex.globals.find, api.vex.globals.set
```

Nesting under `globals` keeps the Convex function paths human-readable and scoped. Contrast with the alternative (flat exports alongside `find`/`get`/`search`):

```ts
// Alternative (rejected) — flat exports
export const { globalsGet, globalsFind, globalsSet } = globalsApi(...)
// → api.vex.globalsGet, api.vex.globalsFind, api.vex.globalsSet
```

The nested approach means `vexConvexApi.globals.get` and reading `globals.get({ slug })` in client code both flow naturally. The dot-chained path is also how Convex organizes functions in its own generated API.

### D12 — `GlobalsListView` builds from `config.globals` (not DB)

`config.globals` is the single source of truth for what globals exist in the project. The DB (`vex_globals`) is where their current values live. The list view doesn't need to query the DB to know which globals are registered — it reads from config. It queries the DB only to enrich each item with "last saved" metadata and status badges.

This means globals that have never been saved appear in the list as "Not yet saved" — giving editors a clear picture of what needs to be configured, not just what's been touched. Contrast with a DB-only list view where unconfigured globals would simply not appear.

### D13 — `GlobalEditView` reuses existing field rendering infrastructure

`renderFieldByType` and `AppForm` are already battle-tested across `CollectionEditView`, block editors, and array fields. `GlobalEditView` is just another form with a different data source and a simpler save path. Reusing the infrastructure means all field types (blocks, array, object, richtext, etc.) work in globals without any additional work.

The only difference from `CollectionEditView`: the default values come from `doc.data` (nested) rather than the flat document, and the save mutation is `globals.set` rather than `update`.
