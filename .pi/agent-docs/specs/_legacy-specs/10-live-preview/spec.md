# 10 — Live Preview

## Overview

Add a live preview system to Vex CMS that lets users see their content changes in real time as they edit documents. The admin panel embeds the user's frontend page in a side-by-side iframe, and Convex's real-time subscriptions automatically update the preview when form data changes — no postMessage protocol needed. A **preview snapshot** mechanism writes transient snapshots to `vex_versions` on debounced form changes, enabling live preview on *any* collection — versioning/drafts are not required. A `vexQuery` wrapper in `@vexcms/core` enables frontend pages to fetch snapshot content with full type safety.

## Design Decisions

- **No postMessage protocol.** Convex queries are reactive — when a preview snapshot is written, any `useQuery` subscription in the preview iframe automatically receives updated data. This eliminates an entire class of complexity (message protocol, origin validation, handshake, ready signals).
- **Preview snapshots are independent of versioning.** Live preview works on any collection. The admin panel writes a transient `previewSnapshot` entry to `vex_versions` on debounced form changes (~500ms). This snapshot is deleted on save. Collections with `versions.drafts: true` also get preview snapshots — the snapshot reflects the *current form state*, which may be ahead of the latest draft.
- **vexQuery `drafts` option.** `drafts: "snapshot"` explicitly fetches the preview snapshot. In dev mode (`process.env.NODE_ENV !== "production"`), vexQuery automatically returns snapshot data without the caller needing to pass `drafts: "snapshot"`.
- **vexQuery in `@vexcms/core`.** Core already has `convex` as a peer dependency and contains the Convex function definitions (`src/convex/`). The wrapper is a thin layer over Convex's `query()` that injects draft-aware logic.
- **Fixed 50/50 split layout.** When preview is toggled on, the edit view splits into a left form panel and right preview panel. No resizable divider — keeps implementation simple.
- **Breakpoints resize the iframe, not the panel.** The preview panel stays at 50% width; the iframe inside it gets resized to the selected breakpoint dimensions with CSS transform scaling if needed.

## Out of Scope

- **postMessage protocol** — not needed with Convex reactivity
- **`@vexcms/live-preview` and `@vexcms/live-preview-react` packages** — no longer needed
- **CSP/CORS configuration** — the iframe loads the user's own frontend (same or known origin); CSP is a deployment concern, not a Vex feature
- **vexMutation wrapper** — future spec can extend the pattern
- **Server component preview refresh** — Convex subscriptions are client-side; server component preview is out of scope

## Target Directory Structure

```
packages/core/src/
├── types/
│   ├── admin.ts                    # MODIFY — add livePreview to AdminConfig
│   ├── collections.ts              # MODIFY — add livePreview to VexCollection
│   └── livePreview.ts              # NEW — LivePreviewConfig, LivePreviewBreakpoint types
├── convex/
│   ├── vexQuery.ts                 # NEW — vexQuery wrapper with drafts support
│   └── previewSnapshot.ts         # NEW — upsert/delete preview snapshot mutations
├── config/
│   ├── defineCollection.ts         # MODIFY — add livePreview param
│   └── defineConfig.ts             # MODIFY — resolve admin.livePreview defaults
├── valueTypes/
│   └── generate.ts                 # MODIFY — add "previewSnapshot" to vex_versions status union + index
└── livePreview/
    ├── index.ts                    # NEW — re-exports
    ├── resolvePreviewURL.ts        # NEW — URL resolution logic
    ├── resolvePreviewURL.test.ts   # NEW — tests
    ├── shouldReloadURL.ts          # NEW — field-based reload check
    ├── shouldReloadURL.test.ts     # NEW — tests
    └── constants.ts                # NEW — DEFAULT_BREAKPOINTS

packages/ui/src/
└── live-preview/
    ├── index.ts                    # NEW — re-exports
    ├── LivePreviewPanel.tsx        # NEW — iframe container with breakpoint sizing
    ├── BreakpointSelector.tsx      # NEW — breakpoint toggle buttons
    └── PreviewToggleButton.tsx     # NEW — toolbar button to show/hide preview

packages/admin-next/src/
├── hooks/
│   └── usePreviewSnapshot.ts      # NEW — debounced form-change → snapshot mutation
└── views/
    └── CollectionEditView.tsx      # MODIFY — add preview toggle + split layout + snapshot hook
```

## Implementation Order

1. **Step 1: Core types** — `LivePreviewConfig`, `LivePreviewBreakpoint`, add to collection + admin types. After this step, `pnpm build` passes.
2. **Step 2: Schema generation update** — add `"previewSnapshot"` to `vex_versions` status union and add `by_preview_snapshot` index. After this step, `pnpm build` and existing schema tests pass.
3. **Step 3: Constants + URL resolution** — `DEFAULT_BREAKPOINTS`, `resolvePreviewURL`, `shouldReloadURL` with tests. After this step, `pnpm test` has new passing tests.
4. **Step 4: defineCollection + defineConfig updates** — wire `livePreview` into the config resolution flow. After this step, users can add `livePreview` to their collection config with LSP autocomplete.
5. **Step 5: Preview snapshot mutations** — `upsertPreviewSnapshot` and `deletePreviewSnapshot` Convex mutations. After this step, the snapshot write/delete machinery is available.
6. **Step 6: vexQuery wrapper** — typesafe Convex query wrapper with `drafts` option and dev-mode auto-snapshot. After this step, users can write snapshot-aware queries.
7. **Step 7: UI components** — `LivePreviewPanel`, `BreakpointSelector`, `PreviewToggleButton` in `@vexcms/ui`. After this step, components are importable.
8. **Step 8: Admin integration** — `usePreviewSnapshot` hook, preview toggle, split layout in `CollectionEditView`. After this step, the full feature works end-to-end.
9. **Step 9: Test app** — enable live preview on posts collection and verify.

---

## Step 1: Core Types

- [ ] Create `packages/core/src/types/livePreview.ts`
- [ ] Modify `packages/core/src/types/collections.ts` — add `livePreview?` to `VexCollection`
- [ ] Modify `packages/core/src/types/admin.ts` — add `livePreview?` to `AdminConfig` and `AdminConfigInput`
- [ ] Modify `packages/core/src/types/index.ts` — re-export live preview types
- [ ] Run `pnpm build` and verify it passes

### **File: `packages/core/src/types/livePreview.ts`**

New file defining the live preview configuration types used by collections and the global admin config.

```typescript
/**
 * Responsive breakpoint for the live preview iframe.
 */
export interface LivePreviewBreakpoint {
  /** Display label (e.g., "Mobile", "Desktop") */
  label: string;

  /** Viewport width in pixels */
  width: number;

  /** Viewport height in pixels */
  height: number;

  /** Lucide icon name for the breakpoint button */
  icon?: "smartphone" | "tablet" | "laptop" | "monitor";
}

/**
 * Live preview configuration for a collection.
 * Works with or without `versions.drafts` — the admin panel writes
 * a transient preview snapshot on form changes regardless.
 */
export interface LivePreviewConfig {
  /**
   * URL for the preview iframe.
   * - String: static URL (e.g., "/preview/pages")
   * - Function: receives document data, returns URL
   *
   * @param props.doc - The current document data including `_id`
   */
  url: string | ((doc: { _id: string; [key: string]: any }) => string);

  /**
   * Breakpoints for responsive preview.
   * Overrides `admin.livePreview.breakpoints` if set.
   */
  breakpoints?: LivePreviewBreakpoint[];

  /**
   * Fields that trigger URL recomputation when changed.
   * - Not set: URL recomputes on every save
   * - Set: URL only recomputes when these fields change
   * - Empty array: URL never recomputes (only content refreshes)
   */
  reloadOnFields?: string[];
}

/**
 * Global live preview configuration on the admin config.
 * Provides defaults that individual collections can override.
 */
export interface AdminLivePreviewConfig {
  /** Default breakpoints for all collections with live preview */
  breakpoints?: LivePreviewBreakpoint[];
}
```

### **File: `packages/core/src/types/collections.ts`** (modify)

Add `livePreview` to the `VexCollection` interface.

```diff
 import type { VexField, InferFieldsType } from "./fields";
+import type { LivePreviewConfig } from "./livePreview";

 // ... existing code ...

 export interface VexCollection<
   TFields extends Record<string, any> = any,
   TExtraKeys extends string = string,
   TSlug extends string = string,
 > {
   // ... existing fields ...

   versions?: VersionsConfig;

+  /**
+   * Live preview configuration.
+   * When set, the admin edit view shows a toggleable side-by-side preview panel
+   * with an iframe loading the configured URL.
+   *
+   * Works with or without `versions.drafts` — the admin panel writes a transient
+   * preview snapshot to `vex_versions` on form changes. The preview iframe fetches
+   * this snapshot via `vexQuery` with Convex's real-time subscriptions.
+   */
+  livePreview?: LivePreviewConfig;

   readonly _docType?: InferFieldsType<TFields>;
 }
```

### **File: `packages/core/src/types/admin.ts`** (modify)

Add `livePreview` to both resolved and input admin config.

```diff
+import type { AdminLivePreviewConfig } from "./livePreview";

 /** Resolved admin panel configuration */
 export interface AdminConfig {
   user: string;
   meta: {
     titleSuffix: string;
     favicon: string;
   };
   sidebar: {
     hideGlobals: boolean;
   };
+  /** Global live preview defaults */
+  livePreview?: AdminLivePreviewConfig;
 }

 // ... existing input types ...

 export interface AdminConfigInput {
   user?: string;
   meta?: AdminMetaInput;
   sidebar?: AdminSidebarInput;
+  /**
+   * Global live preview defaults.
+   * Individual collections can override these breakpoints.
+   */
+  livePreview?: AdminLivePreviewConfig;
 }
```

### **File: `packages/core/src/types/index.ts`** (modify)

Add re-exports for the new types.

```diff
+export type {
+  LivePreviewConfig,
+  LivePreviewBreakpoint,
+  AdminLivePreviewConfig,
+} from "./livePreview";
```

---

## Step 2: Schema Generation Update

- [ ] Modify `packages/core/src/valueTypes/generate.ts` — add `"previewSnapshot"` to `vex_versions` status union + add `by_preview_snapshot` index
- [ ] Update `packages/core/src/valueTypes/generate.versioning.test.ts` — update expected status union if tested
- [ ] Run `pnpm --filter @vexcms/core test` and verify existing tests pass (update snapshot assertions if needed)

### **File: `packages/core/src/valueTypes/generate.ts`** (modify)

Add `"previewSnapshot"` as a fourth status literal in the `vex_versions` table definition, and add a dedicated index for efficient snapshot lookup.

```diff
-    lines.push(`  status: v.union(v.literal("draft"), v.literal("published"), v.literal("autosave")),`);
+    lines.push(`  status: v.union(v.literal("draft"), v.literal("published"), v.literal("autosave"), v.literal("previewSnapshot")),`);
```

Add a new index after the existing ones for efficient preview snapshot queries (one snapshot per collection+document):

```diff
     lines.push(`  .index("by_autosave", ["collection", "documentId", "isAutosave"])`);
+    lines.push(`  .index("by_preview_snapshot", ["collection", "documentId", "status"])`);
```

**Note:** The `by_preview_snapshot` index uses the existing `by_document_status` fields pattern but is named explicitly for clarity. Alternatively, you can reuse `by_document_status` — but a dedicated index makes the query intent clear and the `by_document_status` index may be used differently by the versioning system. Evaluate during implementation whether the existing `by_document_status` index is sufficient (it indexes the same fields: `["collection", "documentId", "status"]`). If so, skip adding the new index and use `by_document_status` with a `.eq("status", "previewSnapshot")` filter instead.

---

## Step 3: Constants + URL Resolution + Tests

- [ ] Create `packages/core/src/livePreview/constants.ts`
- [ ] Create `packages/core/src/livePreview/resolvePreviewURL.ts`
- [ ] Create `packages/core/src/livePreview/resolvePreviewURL.test.ts`
- [ ] Create `packages/core/src/livePreview/shouldReloadURL.ts`
- [ ] Create `packages/core/src/livePreview/shouldReloadURL.test.ts`
- [ ] Create `packages/core/src/livePreview/index.ts`
- [ ] Modify `packages/core/src/index.ts` — re-export from `livePreview/`
- [ ] Run `pnpm --filter @vexcms/core test` and verify new tests pass

### **File: `packages/core/src/livePreview/constants.ts`**

Default breakpoints used when no collection-level or admin-level breakpoints are configured.

```typescript
import type { LivePreviewBreakpoint } from "../types/livePreview";

export const DEFAULT_BREAKPOINTS: LivePreviewBreakpoint[] = [
  { label: "Mobile", width: 375, height: 667, icon: "smartphone" },
  { label: "Tablet", width: 768, height: 1024, icon: "tablet" },
  { label: "Laptop", width: 1280, height: 800, icon: "laptop" },
  { label: "Desktop", width: 1920, height: 1080, icon: "monitor" },
];

/**
 * Debounce interval for writing preview snapshots on form changes.
 */
export const PREVIEW_SNAPSHOT_DEBOUNCE_MS = 500;
```

### **File: `packages/core/src/livePreview/resolvePreviewURL.ts`**

Resolves the preview URL from collection config, handling both static strings and dynamic functions.

```typescript
import type { LivePreviewConfig } from "../types/livePreview";

/**
 * Resolves the preview URL from a collection's live preview config.
 *
 * @param props.config - The collection's livePreview config
 * @param props.doc - The current document data (must include `_id`)
 * @param props.fallbackURL - URL to return if the function throws
 * @returns The resolved preview URL
 * @throws If the resolved URL is empty and no fallbackURL is provided
 */
export function resolvePreviewURL(props: {
  config: LivePreviewConfig;
  doc: { _id: string; [key: string]: any };
  fallbackURL?: string;
}): string {
  // TODO: implement
  //
  // 1. Check if props.config.url is a string
  //    → if string, return it directly
  //
  // 2. If function, call it with props.doc in a try/catch
  //    → on success, validate result is a non-empty string
  //    → on error, return props.fallbackURL if provided, otherwise rethrow
  //
  // 3. If result is empty string, throw an error
  //    → "Live preview URL resolved to empty string for document ${props.doc._id}"
  //
  // Edge cases:
  // - Function returns undefined/null: treat as empty string → error
  // - Function throws: fall back to props.fallbackURL, or rethrow with context
  throw new Error("Not implemented");
}
```

### **File: `packages/core/src/livePreview/resolvePreviewURL.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { resolvePreviewURL } from "./resolvePreviewURL";

describe("resolvePreviewURL", () => {
  const doc = { _id: "doc123", slug: "hello-world", title: "Hello" };

  it("returns static URL string as-is", () => {
    const result = resolvePreviewURL({
      config: { url: "/preview/posts" },
      doc,
    });
    expect(result).toBe("/preview/posts");
  });

  it("calls URL function with document data", () => {
    const result = resolvePreviewURL({
      config: { url: (d) => `/preview/posts/${d.slug}` },
      doc,
    });
    expect(result).toBe("/preview/posts/hello-world");
  });

  it("throws when URL function returns empty string", () => {
    expect(() =>
      resolvePreviewURL({
        config: { url: () => "" },
        doc,
      }),
    ).toThrow("empty string");
  });

  it("returns fallbackURL when URL function throws", () => {
    const result = resolvePreviewURL({
      config: {
        url: () => {
          throw new Error("boom");
        },
      },
      doc,
      fallbackURL: "/fallback",
    });
    expect(result).toBe("/fallback");
  });

  it("rethrows when URL function throws and no fallbackURL", () => {
    expect(() =>
      resolvePreviewURL({
        config: {
          url: () => {
            throw new Error("boom");
          },
        },
        doc,
      }),
    ).toThrow("boom");
  });

  it("handles URL function returning undefined", () => {
    expect(() =>
      resolvePreviewURL({
        config: { url: (() => undefined) as any },
        doc,
      }),
    ).toThrow("empty string");
  });
});
```

### **File: `packages/core/src/livePreview/shouldReloadURL.ts`**

Determines whether the iframe URL should be recomputed based on which fields changed.

```typescript
import type { LivePreviewConfig } from "../types/livePreview";

/**
 * Determines if the preview iframe URL should be recomputed.
 *
 * @param props.config - The collection's livePreview config
 * @param props.changedFields - Set of field names that changed in the save
 * @returns true if the URL should be recomputed
 */
export function shouldReloadURL(props: {
  config: LivePreviewConfig;
  changedFields: string[];
}): boolean {
  // TODO: implement
  //
  // 1. If props.config.reloadOnFields is undefined/not set
  //    → return true (always reload URL)
  //
  // 2. If props.config.reloadOnFields is an empty array
  //    → return false (never reload URL, only content refreshes)
  //
  // 3. Check if any field in props.changedFields is in props.config.reloadOnFields
  //    → return true if any match, false otherwise
  //
  // Edge cases:
  // - changedFields is empty: return false (nothing changed)
  // - Nested field paths (e.g., "meta.slug"): exact string match is sufficient
  //   since field names in Vex are flat keys
  throw new Error("Not implemented");
}
```

### **File: `packages/core/src/livePreview/shouldReloadURL.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { shouldReloadURL } from "./shouldReloadURL";

describe("shouldReloadURL", () => {
  it("returns true when reloadOnFields is not set", () => {
    expect(
      shouldReloadURL({
        config: { url: "/preview" },
        changedFields: ["title"],
      }),
    ).toBe(true);
  });

  it("returns false when reloadOnFields is empty array", () => {
    expect(
      shouldReloadURL({
        config: { url: "/preview", reloadOnFields: [] },
        changedFields: ["title"],
      }),
    ).toBe(false);
  });

  it("returns true when changed field is in reloadOnFields", () => {
    expect(
      shouldReloadURL({
        config: { url: "/preview", reloadOnFields: ["slug"] },
        changedFields: ["title", "slug"],
      }),
    ).toBe(true);
  });

  it("returns false when changed field is not in reloadOnFields", () => {
    expect(
      shouldReloadURL({
        config: { url: "/preview", reloadOnFields: ["slug"] },
        changedFields: ["title", "content"],
      }),
    ).toBe(false);
  });

  it("returns false when changedFields is empty", () => {
    expect(
      shouldReloadURL({
        config: { url: "/preview", reloadOnFields: ["slug"] },
        changedFields: [],
      }),
    ).toBe(false);
  });

  it("returns true with undefined reloadOnFields and empty changedFields", () => {
    expect(
      shouldReloadURL({
        config: { url: "/preview" },
        changedFields: [],
      }),
    ).toBe(true);
  });
});
```

### **File: `packages/core/src/livePreview/index.ts`**

```typescript
export { resolvePreviewURL } from "./resolvePreviewURL";
export { shouldReloadURL } from "./shouldReloadURL";
export { DEFAULT_BREAKPOINTS, PREVIEW_SNAPSHOT_DEBOUNCE_MS } from "./constants";
```

### **File: `packages/core/src/index.ts`** (modify)

Add re-export for live preview utilities.

```diff
+export { resolvePreviewURL, shouldReloadURL, DEFAULT_BREAKPOINTS, PREVIEW_SNAPSHOT_DEBOUNCE_MS } from "./livePreview";
```

---

## Step 4: defineCollection + defineConfig Updates

- [ ] Modify `packages/core/src/config/defineCollection.ts` — add `livePreview` parameter
- [ ] Modify `packages/core/src/config/defineConfig.ts` — resolve `admin.livePreview` defaults
- [ ] Run `pnpm build` and verify it passes

### **File: `packages/core/src/config/defineCollection.ts`** (modify)

Add `livePreview` to the defineCollection props so users get LSP autocomplete.

```diff
 import type { CollectionAdminConfig, IndexConfig, SearchIndexConfig, VersionsConfig, VersioningFieldKeys } from "../types/collections";
+import type { LivePreviewConfig } from "../types/livePreview";
 import type { VexMediaCollection, DefaultMediaFieldKeys } from "../types/media";

 export function defineCollection<
   TFields extends Record<string, VexField>,
   TAuth extends VexAuthAdapter<any> | undefined = undefined,
   TSlug extends string = string,
 >(props: {
   readonly slug: TSlug;
   fields: TFields;
   auth?: TAuth;
   tableName?: string;
   labels?: { singular?: string; plural?: string };
   admin?: CollectionAdminConfig<
     TFields,
     VersioningFieldKeys | (TAuth extends VexAuthAdapter<any> ? AuthCollectionFieldKeys<TAuth, TSlug> : never)
   >;
   indexes?: IndexConfig<
     TFields,
     VersioningFieldKeys | (TAuth extends VexAuthAdapter<any> ? AuthCollectionFieldKeys<TAuth, TSlug> : never)
   >[];
   searchIndexes?: SearchIndexConfig<
     TFields,
     VersioningFieldKeys | (TAuth extends VexAuthAdapter<any> ? AuthCollectionFieldKeys<TAuth, TSlug> : never)
   >[];
   versions?: VersionsConfig;
+  /**
+   * Live preview configuration.
+   * When set, the admin edit view shows a toggleable preview iframe.
+   * Works with or without `versions.drafts`.
+   */
+  livePreview?: LivePreviewConfig;
 }): VexCollection</* ... */> {
```

The function body doesn't need changes — it already spreads `...rest` which will include `livePreview`.

### **File: `packages/core/src/config/defineConfig.ts`** (modify)

Add resolution for `admin.livePreview` in the config merging logic.

```diff
 export function defineConfig(vexConfig: VexConfigInput): VexConfig {
   const { media: mediaInput, ...restInput } = vexConfig;
   const config: VexConfig = {
     ...BASE_VEX_CONFIG,
     ...restInput,
     admin: {
       ...BASE_VEX_CONFIG.admin,
       ...vexConfig.admin,
       meta: {
         ...BASE_VEX_CONFIG.admin.meta,
         ...vexConfig.admin?.meta,
       },
       sidebar: {
         ...BASE_VEX_CONFIG.admin.sidebar,
         ...vexConfig.admin?.sidebar,
       },
+      livePreview: vexConfig.admin?.livePreview,
     },
```

---

## Step 5: Preview Snapshot Mutations

- [ ] Create `packages/core/src/convex/previewSnapshot.ts`
- [ ] Modify `packages/core/src/index.ts` — re-export preview snapshot model functions
- [ ] Run `pnpm build` and verify it passes

### **File: `packages/core/src/convex/previewSnapshot.ts`**

Model functions for managing preview snapshots in `vex_versions`. These are called by the admin panel's `usePreviewSnapshot` hook and by the generated Convex functions in the user's app.

The pattern follows the existing `model/versions.ts` approach — pure functions that take `ctx` and operate on the database.

```typescript
import type { GenericMutationCtx, GenericQueryCtx, GenericDataModel } from "convex/server";

/**
 * Upserts a preview snapshot for a document.
 * If a snapshot already exists for this collection+document, it is updated in place.
 * If not, a new entry is created.
 *
 * @param props.ctx - Convex mutation context
 * @param props.collection - Collection slug
 * @param props.documentId - Document ID
 * @param props.snapshot - Complete field snapshot from the form
 */
export async function upsertPreviewSnapshot<DataModel extends GenericDataModel>(props: {
  ctx: GenericMutationCtx<DataModel>;
  collection: string;
  documentId: string;
  snapshot: Record<string, unknown>;
}): Promise<void> {
  // TODO: implement
  //
  // 1. Query vex_versions for an existing previewSnapshot for this collection+document
  //    → Use by_document_status index: .eq("collection", props.collection)
  //      .eq("documentId", props.documentId)
  //    → Then filter for status === "previewSnapshot"
  //    → .first()
  //
  // 2. If existing snapshot found:
  //    → ctx.db.patch(existing._id, { snapshot: props.snapshot, createdAt: Date.now() })
  //
  // 3. If no existing snapshot:
  //    → ctx.db.insert("vex_versions", {
  //        collection: props.collection,
  //        documentId: props.documentId,
  //        version: 0,           // Not a real version — use 0 to distinguish from version numbers
  //        status: "previewSnapshot",
  //        snapshot: props.snapshot,
  //        createdAt: Date.now(),
  //        createdBy: undefined,
  //        isAutosave: false,
  //        restoredFrom: undefined,
  //      })
  //
  // Edge cases:
  // - Multiple preview snapshots exist (race condition): patch the first one found,
  //   the others will be orphaned but harmless
  // - snapshot is empty object: still write it (the form may have cleared all fields)
  throw new Error("Not implemented");
}

/**
 * Deletes the preview snapshot for a document.
 * Called after a successful save to clean up transient state.
 *
 * @param props.ctx - Convex mutation context
 * @param props.collection - Collection slug
 * @param props.documentId - Document ID
 */
export async function deletePreviewSnapshot<DataModel extends GenericDataModel>(props: {
  ctx: GenericMutationCtx<DataModel>;
  collection: string;
  documentId: string;
}): Promise<void> {
  // TODO: implement
  //
  // 1. Query vex_versions for previewSnapshot entries for this collection+document
  //    → Same index query as upsert
  //    → Collect all matches (in case of duplicates)
  //
  // 2. Delete all found entries
  //    → for each: ctx.db.delete(entry._id)
  //
  // Edge cases:
  // - No snapshot exists: no-op, don't throw
  // - Multiple snapshots (race condition cleanup): delete all of them
  throw new Error("Not implemented");
}

/**
 * Gets the preview snapshot for a document, if one exists.
 *
 * @param props.ctx - Convex query context
 * @param props.collection - Collection slug
 * @param props.documentId - Document ID
 * @returns The snapshot data, or null if no preview snapshot exists
 */
export async function getPreviewSnapshot<DataModel extends GenericDataModel>(props: {
  ctx: GenericQueryCtx<DataModel>;
  collection: string;
  documentId: string;
}): Promise<Record<string, unknown> | null> {
  // TODO: implement
  //
  // 1. Query vex_versions for previewSnapshot for this collection+document
  //    → Use by_document_status index
  //    → Filter for status === "previewSnapshot"
  //    → .first()
  //
  // 2. If found, return entry.snapshot as Record<string, unknown>
  //
  // 3. If not found, return null
  throw new Error("Not implemented");
}
```

### **File: `packages/core/src/index.ts`** (modify)

```diff
+export {
+  upsertPreviewSnapshot,
+  deletePreviewSnapshot,
+  getPreviewSnapshot,
+} from "./convex/previewSnapshot";
```

**Note on wiring into the user's Convex functions:** The user's generated `convex/vex/collections.ts` needs to call `deletePreviewSnapshot` after `updateDocument` (non-versioned save). The user's `convex/vex/versions.ts` needs to call `deletePreviewSnapshot` after `saveDraft` and `publish`. Additionally, new mutations `upsertPreviewSnapshot` and `deletePreviewSnapshot` need to be exposed as Convex mutations in the user's `convex/vex/` directory. This wiring is handled by the CLI code generation (existing pattern) — the schema + function generation already outputs these files. Add the preview snapshot mutations to the generated output.

For this spec, the critical path is the model functions above. The generated Convex mutation wrappers that call these model functions follow the same pattern as existing `collections.ts` and `versions.ts`:

```typescript
// Example of what the generated convex/vex/previewSnapshot.ts would look like:
// (generated by CLI, not hand-written)

import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { upsertPreviewSnapshot, deletePreviewSnapshot } from "@vexcms/core";
import type { DataModel } from "../_generated/dataModel";

export const upsert = mutation({
  args: {
    collectionSlug: v.string(),
    documentId: v.string(),
    snapshot: v.any(),
  },
  handler: async (ctx, { collectionSlug, documentId, snapshot }) => {
    await upsertPreviewSnapshot<DataModel>({
      ctx,
      collection: collectionSlug,
      documentId,
      snapshot: snapshot as Record<string, unknown>,
    });
  },
});

export const remove = mutation({
  args: {
    collectionSlug: v.string(),
    documentId: v.string(),
  },
  handler: async (ctx, { collectionSlug, documentId }) => {
    await deletePreviewSnapshot<DataModel>({
      ctx,
      collection: collectionSlug,
      documentId,
    });
  },
});
```

---

## Step 6: vexQuery Wrapper

- [ ] Create `packages/core/src/convex/vexQuery.ts`
- [ ] Create `packages/core/src/convex/vexQuery.test.ts`
- [ ] Modify `packages/core/src/index.ts` — re-export `vexQuery`
- [ ] Run `pnpm --filter @vexcms/core test` and verify new tests pass

### **File: `packages/core/src/convex/vexQuery.ts`**

A typesafe wrapper around Convex's `query()` that automatically injects draft/snapshot-aware capabilities. The wrapper preserves full type inference for args and return types while adding an optional `_vexDrafts` argument.

```typescript
import {
  query as convexQuery,
  type GenericQueryCtx,
  type GenericDataModel,
  type RegisteredQuery,
} from "convex/server";
import { v, type ObjectType, type PropertyValidators } from "convex/values";

/**
 * Drafts mode for vexQuery.
 * - "snapshot": Fetch the transient preview snapshot (written by admin on form changes)
 * - true: Fetch the latest draft version (from versioning system)
 * - false/undefined: Fetch published content only (default in production)
 *
 * In dev mode (NODE_ENV !== "production"), vexQuery automatically behaves as
 * if `drafts: "snapshot"` when a preview snapshot exists, without the caller
 * needing to pass the option.
 */
export type VexDraftsMode = "snapshot" | boolean;

/**
 * Context passed to vexQuery handlers.
 * Extends the standard Convex QueryCtx with draft-awareness.
 */
export interface VexQueryCtx<DataModel extends GenericDataModel = GenericDataModel>
  extends GenericQueryCtx<DataModel> {
  /**
   * The resolved drafts mode.
   * - "snapshot": caller wants preview snapshot data
   * - true: caller wants latest draft version
   * - false: caller wants published content only
   *
   * In dev mode, this is automatically set to "snapshot" if a preview snapshot
   * exists for the queried document, even if the caller didn't pass `drafts`.
   */
  drafts: VexDraftsMode;
}

/**
 * Creates a Convex query with built-in draft/snapshot content support.
 *
 * Wraps Convex's `query()` to:
 * 1. Automatically add an optional `_vexDrafts` arg (string | boolean)
 * 2. Pass an extended context with `drafts` mode to the handler
 * 3. In dev mode, auto-resolve to "snapshot" when a preview snapshot exists
 * 4. Preserve full type safety for args and return types
 *
 * The handler receives a `VexQueryCtx` which includes `ctx.drafts`.
 * Use this to decide what content to return.
 *
 * @example
 * ```ts
 * import { vexQuery } from "@vexcms/core";
 * import { v } from "convex/values";
 * import { getPreviewSnapshot } from "@vexcms/core";
 *
 * export const getPost = vexQuery({
 *   args: { slug: v.string() },
 *   handler: async (ctx, args) => {
 *     const post = await ctx.db
 *       .query("posts")
 *       .withIndex("by_slug", (q) => q.eq("slug", args.slug))
 *       .first();
 *
 *     if (!post) return null;
 *
 *     // If snapshot mode, return preview snapshot merged with published doc
 *     if (ctx.drafts === "snapshot") {
 *       const snapshot = await getPreviewSnapshot({
 *         ctx,
 *         collection: "posts",
 *         documentId: post._id,
 *       });
 *       if (snapshot) {
 *         return { ...post, ...snapshot };
 *       }
 *     }
 *
 *     // If drafts mode, return latest draft version
 *     if (ctx.drafts === true) {
 *       const latestVersion = await ctx.db
 *         .query("vex_versions")
 *         .withIndex("by_document_latest", (q) =>
 *           q.eq("collection", "posts").eq("documentId", post._id)
 *         )
 *         .order("desc")
 *         .first();
 *       if (latestVersion) {
 *         return { ...post, ...(latestVersion.snapshot as Record<string, unknown>) };
 *       }
 *     }
 *
 *     return post;
 *   },
 * });
 * ```
 */
export function vexQuery<Args extends PropertyValidators, Output>(props: {
  args: Args;
  handler: (
    ctx: VexQueryCtx,
    args: ObjectType<Args>,
  ) => Output | Promise<Output>;
}): RegisteredQuery<"public", ObjectType<Args & { _vexDrafts: typeof v.optional<typeof v.union> }>, Output> {
  // TODO: implement
  //
  // 1. Create merged args by spreading props.args with the injected _vexDrafts validator
  //    → { ...props.args, _vexDrafts: v.optional(v.union(v.literal("snapshot"), v.boolean())) }
  //
  // 2. Call convexQuery() with the merged args and a wrapper handler
  //    → The wrapper handler:
  //       a. Extract _vexDrafts from args
  //       b. Determine the effective drafts mode:
  //          - If _vexDrafts is explicitly provided, use it
  //          - If not provided and NODE_ENV !== "production", default to "snapshot"
  //          - If not provided and NODE_ENV === "production", default to false
  //       c. Create a VexQueryCtx by extending ctx with { drafts: effectiveMode }
  //       d. Call props.handler with the extended ctx and the original args (without _vexDrafts)
  //
  // 3. Return the result of convexQuery()
  //
  // Edge cases:
  // - User's args already contain _vexDrafts: the injected one should override
  //   (warn in dev mode if this happens)
  // - Handler throws: let the error propagate normally (Convex handles it)
  // - NODE_ENV check: use process.env.NODE_ENV; Convex runtime supports this
  throw new Error("Not implemented");
}
```

### **File: `packages/core/src/convex/vexQuery.test.ts`**

Testing `vexQuery` is tricky because it wraps Convex's `query()` which normally runs in the Convex runtime. We test the parts we control: arg merging and context extension. Full integration testing happens in the test-app.

```typescript
import { describe, it, expect } from "vitest";

/**
 * Since vexQuery wraps Convex's query() which requires the Convex runtime,
 * we test the logic boundaries:
 * 1. The function exists and is callable
 * 2. Type-level tests (verified by TypeScript compilation)
 *
 * Full integration tests run in apps/test-app with `npx convex dev`.
 */
describe("vexQuery", () => {
  it("module exports vexQuery function", async () => {
    const mod = await import("./vexQuery");
    expect(typeof mod.vexQuery).toBe("function");
  });

  it("module exports VexDraftsMode type", async () => {
    // Type-level test — if this compiles, the type exists
    const mod = await import("./vexQuery");
    // VexQueryCtx and VexDraftsMode are type-only exports
    // Verify the module loads without errors
    expect(mod).toBeDefined();
  });
});
```

### **File: `packages/core/src/index.ts`** (modify)

```diff
+export { vexQuery, type VexQueryCtx, type VexDraftsMode } from "./convex/vexQuery";
```

---

## Step 7: UI Components

- [ ] Create `packages/ui/src/live-preview/PreviewToggleButton.tsx`
- [ ] Create `packages/ui/src/live-preview/BreakpointSelector.tsx`
- [ ] Create `packages/ui/src/live-preview/LivePreviewPanel.tsx`
- [ ] Create `packages/ui/src/live-preview/index.ts`
- [ ] Modify `packages/ui/src/index.ts` — re-export live preview components
- [ ] Run `pnpm build` and verify it passes

### **File: `packages/ui/src/live-preview/PreviewToggleButton.tsx`**

Toolbar button to toggle the preview panel. Only renders when the collection has `livePreview` configured.

```tsx
"use client";

import { Eye, EyeOff } from "lucide-react";
import { Button } from "../components/ui/button";

/**
 * Button in the document toolbar to toggle the live preview panel.
 *
 * @param props.isOpen - Whether the preview panel is currently visible
 * @param props.onToggle - Callback to toggle visibility
 */
export function PreviewToggleButton(props: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={props.onToggle}
      title={props.isOpen ? "Hide preview" : "Show preview"}
    >
      {props.isOpen ? (
        <EyeOff className="h-4 w-4 mr-2" />
      ) : (
        <Eye className="h-4 w-4 mr-2" />
      )}
      Preview
    </Button>
  );
}
```

### **File: `packages/ui/src/live-preview/BreakpointSelector.tsx`**

Breakpoint toggle buttons for selecting the preview viewport size.

```tsx
"use client";

import { Smartphone, Tablet, Laptop, Monitor, Maximize } from "lucide-react";
import { Button } from "../components/ui/button";
import type { LivePreviewBreakpoint } from "@vexcms/core";

const ICON_MAP = {
  smartphone: Smartphone,
  tablet: Tablet,
  laptop: Laptop,
  monitor: Monitor,
} as const;

/**
 * Renders breakpoint toggle buttons for the preview panel.
 * Includes a "Responsive" option that fills available space.
 *
 * @param props.breakpoints - Available breakpoints to display
 * @param props.selected - Currently selected breakpoint label, or null for responsive
 * @param props.onSelect - Callback when a breakpoint is selected (null = responsive)
 */
export function BreakpointSelector(props: {
  breakpoints: LivePreviewBreakpoint[];
  selected: string | null;
  onSelect: (breakpoint: LivePreviewBreakpoint | null) => void;
}) {
  // TODO: implement
  //
  // 1. Render a row of toggle buttons (flex, gap-1)
  //
  // 2. First button is "Responsive" (Maximize icon)
  //    → selected when props.selected is null
  //    → onClick calls props.onSelect(null)
  //
  // 3. Map over props.breakpoints to render a button for each
  //    → Use ICON_MAP[breakpoint.icon] for the icon, fallback to Monitor
  //    → selected when props.selected === breakpoint.label
  //    → onClick calls props.onSelect(breakpoint)
  //    → Use variant="secondary" when selected, "ghost" when not
  //
  // 4. Each button shows the icon + label text
  //    → Title attribute shows dimensions: "Mobile (375×667)"
  //
  // Edge cases:
  // - No breakpoints array: only show Responsive button
  // - Unknown icon name: fallback to Monitor
  throw new Error("Not implemented");
}
```

### **File: `packages/ui/src/live-preview/LivePreviewPanel.tsx`**

The main preview panel component containing the iframe and breakpoint controls.

```tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import type { LivePreviewConfig, LivePreviewBreakpoint } from "@vexcms/core";
import { DEFAULT_BREAKPOINTS, resolvePreviewURL } from "@vexcms/core";
import { BreakpointSelector } from "./BreakpointSelector";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "../components/ui/button";

/**
 * Side panel that embeds a preview iframe with breakpoint controls.
 *
 * @param props.config - The collection's livePreview config
 * @param props.doc - Current document data (used for URL resolution)
 * @param props.adminBreakpoints - Global admin breakpoints (fallback)
 */
export function LivePreviewPanel(props: {
  config: LivePreviewConfig;
  doc: { _id: string; [key: string]: any };
  adminBreakpoints?: LivePreviewBreakpoint[];
}) {
  // TODO: implement
  //
  // 1. Resolve breakpoints: props.config.breakpoints ?? props.adminBreakpoints ?? DEFAULT_BREAKPOINTS
  //
  // 2. State: selectedBreakpoint (LivePreviewBreakpoint | null, null = responsive)
  //    → Initialize from localStorage key `vex-preview-bp-${props.doc._id}` if available
  //
  // 3. Resolve the preview URL using resolvePreviewURL()
  //    → Pass the current doc data and config
  //    → Use state to track previous URL as fallback
  //    → Catch errors and show error state
  //
  // 4. Render layout:
  //    a. Top bar: BreakpointSelector + manual refresh button (RefreshCw icon)
  //    b. Main area: iframe container
  //       → If selectedBreakpoint is null: iframe fills container (width: 100%, height: 100%)
  //       → If selectedBreakpoint is set: iframe gets fixed width/height from breakpoint
  //          - If breakpoint is larger than container, apply CSS transform scale
  //          - Center the iframe in the container
  //    c. Error state: if URL resolution failed, show AlertTriangle + error message + retry button
  //
  // 5. Manual refresh button: set iframe.src to the same URL to force reload
  //    → Use a key state variable to force iframe remount
  //
  // 6. Persist selected breakpoint label to localStorage on change
  //
  // Edge cases:
  // - Doc has no _id yet (new unsaved doc): show message "Save to enable preview"
  // - URL function throws: show error state with the error message
  // - iframe container smaller than breakpoint: scale down with transform: scale()
  throw new Error("Not implemented");
}
```

### **File: `packages/ui/src/live-preview/index.ts`**

```typescript
export { LivePreviewPanel } from "./LivePreviewPanel";
export { BreakpointSelector } from "./BreakpointSelector";
export { PreviewToggleButton } from "./PreviewToggleButton";
```

### **File: `packages/ui/src/index.ts`** (modify)

```diff
+export {
+  LivePreviewPanel,
+  BreakpointSelector,
+  PreviewToggleButton,
+} from "./live-preview";
```

---

## Step 8: Admin Integration

- [ ] Create `packages/admin-next/src/hooks/usePreviewSnapshot.ts` — debounced form-change → snapshot mutation
- [ ] Modify `packages/admin-next/src/views/CollectionEditView.tsx` — add preview state, toggle button, split layout, and snapshot hook
- [ ] Run `pnpm build` and verify the full build passes

### **File: `packages/admin-next/src/hooks/usePreviewSnapshot.ts`**

Hook that debounces form changes and writes preview snapshots to `vex_versions`.

```typescript
"use client";

import { useEffect, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { anyApi } from "convex/server";
import { PREVIEW_SNAPSHOT_DEBOUNCE_MS } from "@vexcms/core";

/**
 * Writes a debounced preview snapshot on form changes.
 * The snapshot is a transient entry in vex_versions (status: "previewSnapshot")
 * that the preview iframe fetches via vexQuery.
 *
 * @param props.collectionSlug - Collection slug
 * @param props.documentId - Document ID being edited
 * @param props.enabled - Whether snapshot writing is active (true when preview panel is open)
 * @param props.getFormValues - Function that returns current form field values
 */
export function usePreviewSnapshot(props: {
  collectionSlug: string;
  documentId: string;
  enabled: boolean;
  getFormValues: () => Record<string, unknown> | null;
}) {
  // TODO: implement
  //
  // 1. Get the upsert mutation via useMutation(anyApi.vex.previewSnapshot.upsert)
  //    Get the remove mutation via useMutation(anyApi.vex.previewSnapshot.remove)
  //
  // 2. Use a ref for the debounce timer (useRef<ReturnType<typeof setTimeout>>)
  //
  // 3. Create a writeSnapshot callback that:
  //    a. Clears any existing debounce timer
  //    b. Sets a new timer for PREVIEW_SNAPSHOT_DEBOUNCE_MS (500ms)
  //    c. On timer fire:
  //       - Call props.getFormValues()
  //       - If null (no changes), skip
  //       - Call upsertMutation with { collectionSlug, documentId, snapshot }
  //       - Catch errors silently (snapshot writes are best-effort, should not disrupt editing)
  //
  // 4. Set up an effect that listens for form changes
  //    → This is tricky — we need to trigger on form state changes
  //    → Approach: call writeSnapshot on every render when enabled is true
  //       and getFormValues returns non-null
  //    → The debounce timer prevents rapid writes
  //
  // 5. Cleanup effect: when enabled changes from true → false, or on unmount:
  //    → Clear the debounce timer
  //    → Call remove mutation to delete the snapshot
  //       (clean up transient state when preview is closed)
  //
  // 6. Also clean up on document save: the caller (CollectionEditView) should
  //    call the remove mutation after a successful save. This hook doesn't need
  //    to handle that — it's wired in Step 8's CollectionEditView changes.
  //
  // Edge cases:
  // - getFormValues returns null (no dirty fields): skip the write
  // - Mutation fails: swallow the error (preview is best-effort)
  // - Rapid toggle of preview panel: cleanup runs, then setup runs again
  // - Component unmounts during debounce: timer is cleared in cleanup
  throw new Error("Not implemented");
}
```

### **File: `packages/admin-next/src/views/CollectionEditView.tsx`** (modify)

This is the main integration point. The changes are:

1. **Import** the new components and hook
2. **Add state** for preview panel visibility
3. **Add toggle button** to the toolbar (any collection with `livePreview`, regardless of versioning)
4. **Wire up** `usePreviewSnapshot` to write snapshots when preview is open
5. **Split the layout** when preview is open
6. **Delete snapshot on save** — call the remove mutation after successful saves

```diff
 import {
   AppForm,
   type FieldEntry,
   Breadcrumb,
   // ... existing imports ...
+  LivePreviewPanel,
+  PreviewToggleButton,
 } from "@vexcms/ui";
+import { usePreviewSnapshot } from "../hooks/usePreviewSnapshot";

 // ... inside component ...

+  // Live preview state — works with or without versioning
+  const hasPreview = !!collection.livePreview;
+  const [previewOpen, setPreviewOpen] = useState(false);
+
+  // Preview snapshot — writes transient snapshot on form changes when preview is open
+  usePreviewSnapshot({
+    collectionSlug: collection.slug,
+    documentId: documentID,
+    enabled: previewOpen && hasPreview && !!document,
+    getFormValues: () => getFormValuesRef.current?.() ?? null,
+  });
+
+  // Mutation for deleting preview snapshot on save
+  const deleteSnapshotMutation = useMutation(anyApi.vex.previewSnapshot.remove);
```

**Toolbar addition** — add the preview toggle button next to the existing buttons. Note this is *before* the versioning check, so it appears for all collections with `livePreview`:

```diff
             {isVersioned && document && typeof document.vex_status === "string" && (
               <StatusBadge status={document.vex_status} />
             )}
+            {hasPreview && document && (
+              <PreviewToggleButton
+                isOpen={previewOpen}
+                onToggle={() => setPreviewOpen((prev) => !prev)}
+              />
+            )}
             {!disableDelete && document && (
```

**Delete snapshot on save** — add cleanup after successful save in both versioned and non-versioned paths:

```diff
   const handleSubmit = async (changedFields: Record<string, unknown>) => {
     setIsSaving(true);
     try {
       if (isVersioned) {
         await saveDraftMutation({
           collectionSlug: collection.slug,
           documentId: documentID,
           fields: changedFields,
           restoredFrom: restoredFromVersion ?? undefined,
         });
         // ...existing restored state cleanup...
       } else {
         await updateDocument({
           collectionSlug: collection.slug,
           documentId: documentID,
           fields: changedFields,
         });
       }
+      // Clean up preview snapshot after successful save
+      if (hasPreview) {
+        deleteSnapshotMutation({
+          collectionSlug: collection.slug,
+          documentId: documentID,
+        }).catch(() => {}); // best-effort cleanup
+      }
     } finally {
       setIsSaving(false);
     }
   };
```

Also add snapshot cleanup after publish:

```diff
   const handlePublish = async () => {
     setIsPublishing(true);
     try {
       const currentFields = getFormValuesRef.current?.() ?? undefined;
       await publishMutation({
         collectionSlug: collection.slug,
         documentId: documentID,
         fields: currentFields,
       });
       // ...existing restored state cleanup...
+      // Clean up preview snapshot after publish
+      if (hasPreview) {
+        deleteSnapshotMutation({
+          collectionSlug: collection.slug,
+          documentId: documentID,
+        }).catch(() => {});
+      }
     } finally {
       setIsPublishing(false);
     }
   };
```

**Important note on `getFormValuesRef`:** The existing code only assigns `getFormValuesRef` when `isVersioned` is true (via `getValuesRef={isVersioned ? getFormValuesRef : undefined}`). For live preview on non-versioned collections, this ref also needs to be wired up:

```diff
               <AppForm
                 formId="collection-edit-form"
                 schema={schema}
                 fieldEntries={fieldEntries}
                 defaultValues={defaultValues}
                 onSubmit={handleSubmit}
                 submitAllFields={isVersioned}
-                getValuesRef={isVersioned ? getFormValuesRef : undefined}
+                getValuesRef={isVersioned || hasPreview ? getFormValuesRef : undefined}
                 onDirtyChange={isVersioned ? setIsFormDirty : undefined}
```

**Layout change** — wrap the form area in a split container:

```diff
-      <div className="flex-1 overflow-y-auto p-6">
+      <div className={`flex-1 overflow-hidden ${previewOpen && hasPreview ? "flex" : ""}`}>
+        <div className={`overflow-y-auto p-6 ${previewOpen && hasPreview ? "w-1/2 border-r" : "w-full"}`}>
           {isLoading && <p className="text-muted-foreground">Loading...</p>}

           {!isLoading && document == null && (
             <p className="text-muted-foreground">Document not found.</p>
           )}

           {!isLoading && document != null && (
             <div className="" key={`${documentID}-${restoredFromVersion ?? "latest"}`}>
               <AppForm
                 {/* ... existing props ... */}
               />
             </div>
           )}
-      </div>
+        </div>
+        {previewOpen && hasPreview && document && (
+          <div className="w-1/2 overflow-hidden flex flex-col">
+            <LivePreviewPanel
+              config={collection.livePreview!}
+              doc={{ _id: documentID, ...document } as { _id: string; [key: string]: any }}
+              adminBreakpoints={config.admin.livePreview?.breakpoints}
+            />
+          </div>
+        )}
+      </div>
```

---

## Step 9: Test App — Enable Live Preview on Posts Collection

- [ ] Modify `apps/test-app/src/vexcms/collections/posts.ts` — add `livePreview` config (no `versions` needed)
- [ ] Run `pnpm build` and verify it passes
- [ ] Run `npx convex dev` in the test app to regenerate the schema (`vex_versions` status union will include `"previewSnapshot"`)
- [ ] Open the admin panel, navigate to Posts → edit a post, and verify the Preview toggle button appears
- [ ] Click Preview and verify the iframe loads `/posts/jx734hqc3eefqd6j3naxcf3bex82eqgk`
- [ ] Edit a field and verify the preview snapshot is written (check Convex dashboard → `vex_versions` table for a `previewSnapshot` entry)

### **File: `apps/test-app/src/vexcms/collections/posts.ts`** (modify)

Add `livePreview` pointing to the static preview URL. No `versions` config needed — preview snapshots work independently.

```diff
 import { checkbox, defineCollection, richtext, select, text } from "@vexcms/core"

 import { TABLE_SLUG_MEDIA, TABLE_SLUG_POSTS } from "~/db/constants"

 export const posts = defineCollection({
   slug: TABLE_SLUG_POSTS,
   admin: {
     defaultColumns: ["title", "status", "featured"],
     group: "Content",
     useAsTitle: "title",
   },
   fields: {
     slug: text({
       admin: {
         description: "URL-friendly identifier",
       },
       label: "Slug",
       required: true,
     }),
     content: richtext({
       label: "Content",
       mediaCollection: TABLE_SLUG_MEDIA,
     }),
     featured: checkbox({
       defaultValue: false,
       label: "Featured",
     }),
     status: select({
       defaultValue: "draft",
       label: "Status",
       options: [
         { label: "Draft", value: "draft" },
         { label: "Published", value: "published" },
         { label: "Archived", value: "archived" },
       ],
       required: true,
     }),
     subtitle: text({
       label: "Subtitle",
       maxLength: 200,
       required: true,
     }),
     title: text({
       label: "Title",
       maxLength: 200,
       required: true,
     }),
   },
   labels: {
     plural: "Posts",
     singular: "Post",
   },
+  livePreview: {
+    url: "/posts/jx734hqc3eefqd6j3naxcf3bex82eqgk",
+  },
 })
```

**Note:** This uses a static URL for testing. In production, you'd typically use a dynamic URL function:

```typescript
livePreview: {
  url: (doc) => `/posts/${doc._id}`,
  reloadOnFields: ["slug"],
},
```

The static URL `/posts/jx734hqc3eefqd6j3naxcf3bex82eqgk` points to a specific post page in the test app's frontend. When the preview iframe loads this URL, the frontend page's `vexQuery`-powered `useQuery` subscription will automatically receive updated preview snapshot data as the user edits fields in the admin panel (debounced at 500ms).

---

## Success Criteria

- [ ] `LivePreviewConfig` and `LivePreviewBreakpoint` types are exported from `@vexcms/core`
- [ ] `defineCollection` accepts `livePreview` with LSP autocomplete — no `versions.drafts` required
- [ ] `defineConfig` resolves `admin.livePreview` defaults
- [ ] `vex_versions` schema includes `"previewSnapshot"` in the status union
- [ ] `resolvePreviewURL` handles static strings, dynamic functions, errors, and fallbacks (6 tests)
- [ ] `shouldReloadURL` handles all field-change scenarios (6 tests)
- [ ] `upsertPreviewSnapshot` creates or updates a transient snapshot in `vex_versions`
- [ ] `deletePreviewSnapshot` removes the transient snapshot (called on save)
- [ ] `getPreviewSnapshot` fetches the snapshot for a document
- [ ] `vexQuery` wrapper accepts `drafts: "snapshot" | true | false` and injects `VexQueryCtx`
- [ ] `vexQuery` auto-returns snapshot data in dev mode without caller passing `drafts`
- [ ] `LivePreviewPanel` renders iframe with breakpoint sizing
- [ ] `BreakpointSelector` toggles between responsive and fixed breakpoints
- [ ] `PreviewToggleButton` shows/hides in toolbar for any collection with `livePreview` (versioned or not)
- [ ] `usePreviewSnapshot` writes debounced snapshots on form changes when preview is open
- [ ] `usePreviewSnapshot` deletes the snapshot when preview is closed or component unmounts
- [ ] `CollectionEditView` splits into 50/50 layout when preview is toggled on
- [ ] `CollectionEditView` deletes preview snapshot after save/publish
- [ ] `getFormValuesRef` is wired up for non-versioned collections when `livePreview` is configured
- [ ] `pnpm build` passes across all packages
- [ ] `pnpm --filter @vexcms/core test` passes with new tests
- [ ] Test app posts collection has `livePreview` configured (no `versions` required)
- [ ] Preview iframe loads `/posts/jx734hqc3eefqd6j3naxcf3bex82eqgk` in the admin edit view
