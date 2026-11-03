---
status: draft
spec_id: 2026-10-25-codebase-conventions-refactor
touches:
  - scripts/export-names.mjs
  - scripts/move-modules.mjs
  - packages/core/src/**
  - packages/core/package.json
  - packages/core/tsup.config.ts
  - packages/react/src/**
  - packages/react/package.json
  - packages/react/tsup.config.ts
  - packages/next/src/**
  - packages/richtext-plate/src/**
  - packages/better-auth/src/**
  - packages/file-storage-convex/src/**
  - packages/create-vexcms/templates/**
  - apps/test/**
  - apps/www/**
  - apps/docs/src/content/docs/**
  - apps/docs/astro.config.mjs
  - .changeset/codebase-conventions-refactor.md
  - .agent/docs/standards/**
prompt_version: 1
---

# 2026-10-25-codebase-conventions-refactor — Spec

## Overview

K pass 1 of the v0.1.0 launch track (`.agent/docs/product/v0.1.0-launch-plan.md` § K, which
holds the findings and file:line evidence). Three refactors bring the code in line with the
rule the rest of the repo already follows — group by domain, name files by role:
`core/src/api/` dissolves into domain `api/` folders plus a shared `src/db/` pipeline and
`src/documents/` types; the React form layer splits into an exported app form
(`@vexcms/react/form`, TanStack `createFormHook`) and admin fields that map field
definitions onto it; and the whole React package then moves from its `components/`/`context/`/
`lib/`/`hooks/` grouping into top-level feature folders mirroring core, via a small
`scripts/move-modules.mjs` codemod that `git mv`s each file and rewrites its importers. A
review pass then derives conventions for every package; each round of developer decisions is
appended as a step group, and the result is recorded in the `apps/docs` Development section
and enforced by `harness struct --check`. Runs after B3, before H, so H rebuilds the edit view
on the new form layer and the new react layout.

## Design Decisions

1. **Domain operations live at `<domain>/api/<op>/server.ts`.** The collections scheme wins;
   globals, versions and media convert. *Why:* one scheme for the same role; the folder
   leaves room for an op's colocated test and helpers.
2. **Factories get their own file, `<domain>/api/<domain>Api.ts`; `index.ts` only
   re-exports.** *Why:* a file is named after its main export; barrels hold no logic.
3. **`src/db/` holds the read/write pipeline only** — `prepareEdit`, `populate`, `depth`,
   `queryArgs`, `triggers`, ctx narrowing, `stampUpdatedAt`, cross-domain API types.
   *Why:* every domain `api/` calls it; it belongs to none of them.
4. **Access dispatchers (`resolveAccessCall`, `resolveReadCall`) move to `src/access/`.**
   *Why:* they are access decisions, not pipeline plumbing.
5. **All four document shapes move to `src/documents/types.ts`; version constants stay in
   `src/versions/constants.ts`.** `VexDocument`/`TDocument`/`VexVersionDocument`/
   `VexMediaDocument` all live in `documents/types.ts`, which imports `VERSION_SYSTEM_FIELDS`/
   `VexVersionStatus` directly from `../versions/constants` (never the `../versions` barrel).
   `versions/index.ts` and `media/index.ts` re-export `VexVersionDocument`/`VexMediaDocument`
   respectively from `../documents/types`, so each domain's own barrel still carries its
   document shape for importers that prefer the feature barrel. *Why:* a single file for every
   document shape keeps the family together and lets `documents/types.ts` be the one place that
   reads `VERSION_SYSTEM_FIELDS`/`VexVersionStatus` — `versions/constants.ts` has no imports of
   its own, so `documents/types.ts → versions/constants.ts` is a one-way edge with no cycle
   risk. No `documents/constants.ts` is created and `VERSION_SYSTEM_FIELDS` / `VERSION_STATUSES`
   never move — they stay exactly where they are today. The `api/convex.ts:5` ↔
   `versions/model.ts` cycle breaks because `versions/model.ts` now reads `VexVersionDocument`
   from `../documents/types` instead of `../api/convex`, not because a constant moved.
<!-- /decision 5 -->
6. **Versions keep both layers** — domain write logic in `versions/*.ts`, dispatchers in
   `versions/api/<op>/server.ts`. *Why:* `<domain>/api/` holds only server operations.
7. **`./convex` export removed; `src/server.ts` is the server entry.** *Why:* it was an
   exact alias of `./server`; pre-0.1.0 is the window for the break.
8. **Two-tier React forms: an exported `AppForm` plus admin fields.** The exported `forms/*Field.tsx`
   components read `useFieldContext()` and plain props, never `fieldDef`, config or permissions;
   admin `Field.tsx` files map `fieldDef` onto them. *Why:* users can build their own forms with
   the same components; list mechanics stop reaching for admin config.
9. **Form field components are named after the field (`TextField`, `BlocksField`).** Users reach
   them only as `field.TextField` keys; admin files alias core's same-named types
   (`TextField as TextFieldDef`). Fallback if noisy: `Form*` prefix. *Why:* the form field names
   match the field types one-to-one.
10. **The app form ships as `@vexcms/react/form`.** *Why:* bundle boundary for users' own forms,
    no accidental admin imports, its own docs surface; mirrors `./client` / `./testing`.
11. **React field folders hold `Field.tsx`, `Cell.tsx`, `columnDef.tsx`, `testFixture.ts`,
    `index.ts`; a control file exists only for a custom widget** (relationship, upload,
    richtext). *Why:* most controls are `ui/` primitives already.
12. **Two override slots: `admin.components.Input` replaces the control (through
    `FormFieldLayout`'s `renderControl`, the label/description/error layout kept);
    `admin.components.Field` replaces the whole admin field.**
    List fields get `Field` plus their action slots. *Why:* simple overrides stay simple;
    full control is still possible.
13. **`useVexForm` stays public, backed by the app form's own form context.** *Why:* no public break,
    G's `slots/formData.ts` unchanged.
14. **Placement by concern:** `components/form/` is deleted entirely — `AppForm.tsx` and
    `changedValues.ts` move to `packages/react/src/forms/`, the single public `AppForm` export's
    home; `components/fields/` gets `RenderFields`, `FieldConditionGate`,
    `applyFieldPermissionReadOnly`, `readableFields`, `registry`; layout renderers become
    `fields/{tabs,collapsible,row,ui,group}/Field.tsx`; `ActionsMenu`, `InputTag` →
    `components/ui/`; `DocumentTimestamps` → `components/views/`. *Why:* files that walk
    `fieldDef` records sit with the fields; pure value/form glue with the form. (Steps 8–14's
    `components/`-prefixed paths are the interim layout; steps 15–19 move every one of them into
    the top-level feature folders decision 18 describes, without changing any of these files'
    own code again.)
15. **One spec, review rounds as appended step groups; conventions recorded once** — the
    Development docs explain, `naming-conventions.md` holds the machine-checked rules and
    links to them. *Why:* one history, no duplicated prose.
16. **`BlocksField`'s duplicate action is an optional `cloneBlock` prop, not a built-in
    `cloneBlockWithFreshIds` call.** The exported `forms/BlocksField.tsx` stays fieldDef-free
    while callers that supply `cloneBlock` still get a built-in Duplicate item action. *Why:* it never reads
    core/admin field shapes, but users don't lose duplicate.
17. **Admin field components are named `<Type>FieldAdmin` (`TextFieldAdmin`, `BlocksFieldAdmin`,
    …), pairing with `<Type>FieldCell`.** *Why:* mirrors `<Type>FieldCell`'s own `Field<Role>`
    pattern, and ends the name clash with core's `*FieldInput` config types.
18. **The React package moves to top-level feature folders mirroring core** (`collections/`,
    `globals/`, `versions/`, `media/`, `fields/`, `forms/`, `access/`, `auth/`, `config/`,
    `admin/`, `slots/`, `livePreview/`, `revalidate/`, `modals/`, `ui/`, `hooks/`, `utils/`),
    with files inside a feature folder flat (component `PascalCase.tsx`, hook `useX.ts`,
    context `XContext.ts(x)`, `constants.ts`, `types.ts`, `index.ts`) — the only subfolders are
    `api/` and, in `fields/`, one folder per field type. `components/`, `context/`, `lib/`,
    `styles/` are deleted; `adapter.ts`, `index.ts`, `testing/` stay at the root. The app form
    folder is `src/forms/` (plural, distinct from the singular `form` concept it names), moved
    there in steps 8–14 directly rather than once more in the later move steps; its package
    entry is still `@vexcms/react/form` (`exports["./form"].source` → `./src/forms/index.ts`).
    *Why:* the same domain-folder rule core already follows (decision 1), applied to react.
19. **`src/client/` holds only the `./client` entry and shared client types.** `src/client/index.ts`
    re-exports each feature's own `api/` client operations; `src/client/types.ts` keeps the
    client-only shared types. Every client operation moves beside its server counterpart —
    `collections/api/<op>/client.ts` next to `collections/api/<op>/server.ts` (`find`, `get`,
    `search`, `create`, `update`, `remove`; `whereArg.ts` → `collections/api/whereArg.ts`, since
    only `find`/`search` use it), `globals/api/<op>/client.ts` (`find`, `get`, `upsert`),
    `versions/api/<op>/client.ts` (`saveDraft`, `publish`, `unpublish`, `listVersions`,
    `getVersionSnapshot`, `deleteVersion`). *Why:* resolves the Out of Scope item the pass-1
    spec left to the review — client operations are server operations' siblings, not their own
    domain.

## Out of Scope

- Behaviour changes, other than the form-layer rewrite itself.
- H's features: error summary, nav guard, duplicate document, edit-view slots.
- Restructuring `next`, `cli`, `better-auth`, `file-storage-convex`, `richtext-plate`, or the
  apps beyond import updates — the pass 2 review decides those.
- New field types or form features (masks, conditions, new inputs).
- Re-litigating B3's names (`compileQueryConstraints`, `pickConvexQueryIndex`, …) — the
  review may flag them.

## Implementation

Pass 1 is steps 0–21; step 22 is the first review. Each review round appends a
`Pass N decisions` step group after step 22; step 23 runs once, after the last round.

### Step 0 — Export-name baseline script [agent]
Why: the `@vexcms/core/server` / `@vexcms/core` public surface must be provably unchanged by the moves (decision 4: only `./convex` disappears).
Verify: `node scripts/export-names.mjs --write` writes `.agent/docs/specs/2026-10-25-codebase-conventions-refactor/export-names.baseline.json`; `node scripts/export-names.mjs --check` exits 0.
- [ ] `scripts/export-names.mjs` — builds core + react, imports every package entry, writes/compares sorted export-name lists
- [ ] baseline JSON committed

#### scripts/export-names.mjs

Reads `exports` off `packages/core/package.json` and `packages/react/package.json`, skips any entry whose value is a bare string (`"./styles": "./styles.css"` — not JS), builds both packages, dynamically imports each entry's built `import` file, and records the sorted, non-`default` export names per entry. `--write` persists that map as the baseline; `--check` recomputes it and diffs against the committed baseline, printing added/removed names per entry and exiting `1` on any difference (also `1` if the baseline file is missing — nothing to check against).

```js
#!/usr/bin/env node

/**
 * Export-name baseline for `@vexcms/core` and `@vexcms/react`'s public
 * entries — proves a refactor changed WHERE code lives, never WHAT a package
 * exports.
 *
 * Reads each package's `package.json` `exports` map, builds the package,
 * dynamically imports every entry's built file, and records the sorted
 * export names. `--write` captures that as the committed baseline;
 * `--check` recomputes it and diffs against the baseline — any added or
 * removed name, on any entry, fails the gate.
 *
 * String-valued `exports` entries (`"./styles": "./styles.css"`) are not
 * JS modules and are skipped.
 *
 * Usage:
 *   node scripts/export-names.mjs --write   build + capture the baseline
 *   node scripts/export-names.mjs --check   build + diff against the baseline; exit 1 on any difference
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baselinePath = path.join(
  root,
  ".agent/docs/specs/2026-10-25-codebase-conventions-refactor/export-names.baseline.json",
);

const PACKAGES = [
  { name: "@vexcms/core", dir: path.join(root, "packages/core") },
  { name: "@vexcms/react", dir: path.join(root, "packages/react") },
];

const cliArgs = process.argv.slice(2);
const shouldWrite = cliArgs.includes("--write");
const shouldCheck = cliArgs.includes("--check");

if (!shouldWrite && !shouldCheck) {
  console.error("Usage: node scripts/export-names.mjs --write | --check");
  process.exit(1);
}

/**
 * Runs each package's `build` script so `dist/` reflects the current
 * source before entries are imported.
 *
 * @param {{ name: string, dir: string }[]} packages - Packages to build.
 */
function buildPackages(packages) {
  for (const pkg of packages) {
    execFileSync("pnpm", ["--filter", pkg.name, "build"], { cwd: root, stdio: "inherit" });
  }
}

/**
 * Reads one package's `exports` map and returns its JS entries — every
 * entry whose value is an object with an `import` path, skipping bare
 * string values (non-JS assets like `./styles`).
 *
 * @param {{ name: string, dir: string }} pkg - Package to read.
 * @returns {{ id: string, importPath: string }[]} One entry per JS export,
 *   `id` formatted as the caller-facing specifier (`@vexcms/core`,
 *   `@vexcms/core/server`, …).
 */
function readJsEntries(pkg) {
  const manifest = JSON.parse(fs.readFileSync(path.join(pkg.dir, "package.json"), "utf8"));
  const entries = [];
  for (const [exportKey, value] of Object.entries(manifest.exports ?? {})) {
    if (typeof value === "string") continue; // non-JS asset, e.g. "./styles"
    if (typeof value.import !== "string") continue;
    const id = exportKey === "." ? pkg.name : `${pkg.name}${exportKey.slice(1)}`;
    entries.push({ id, importPath: path.join(pkg.dir, value.import) });
  }
  return entries;
}

/**
 * Imports every JS entry across `packages` and returns its sorted,
 * non-`default` export names.
 *
 * @param {{ name: string, dir: string }[]} packages - Packages to collect from.
 * @returns {Promise<Record<string, string[]>>} Entry id → sorted export names.
 */
async function collectExportNames(packages) {
  const result = {};
  for (const pkg of packages) {
    for (const entry of readJsEntries(pkg)) {
      const mod = await import(pathToFileURL(entry.importPath).href);
      result[entry.id] = Object.keys(mod)
        .filter((key) => key !== "default")
        .sort();
    }
  }
  return Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)));
}

/**
 * Diffs two entry → export-names maps and prints every added/removed name
 * per entry, plus any entry present on only one side.
 *
 * @param {Record<string, string[]>} baseline - Previously committed map.
 * @param {Record<string, string[]>} current - Freshly collected map.
 * @returns {boolean} `true` when the maps differ.
 */
function diffExportNames(baseline, current) {
  let changed = false;
  const entryIds = new Set([...Object.keys(baseline), ...Object.keys(current)]);
  for (const id of [...entryIds].sort()) {
    const before = new Set(baseline[id] ?? []);
    const after = new Set(current[id] ?? []);
    if (!(id in baseline)) {
      changed = true;
      console.error(`+ entry ${id} (new)`);
      continue;
    }
    if (!(id in current)) {
      changed = true;
      console.error(`- entry ${id} (removed)`);
      continue;
    }
    const added = [...after].filter((name) => !before.has(name));
    const removed = [...before].filter((name) => !after.has(name));
    for (const name of added) {
      changed = true;
      console.error(`+ ${id}: ${name}`);
    }
    for (const name of removed) {
      changed = true;
      console.error(`- ${id}: ${name}`);
    }
  }
  return changed;
}

async function main() {
  buildPackages(PACKAGES);
  const current = await collectExportNames(PACKAGES);

  if (shouldWrite) {
    fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
    fs.writeFileSync(baselinePath, `${JSON.stringify(current, null, 2)}\n`);
    console.log(`Wrote ${path.relative(root, baselinePath)}`);
    return;
  }

  if (!fs.existsSync(baselinePath)) {
    console.error(`No baseline at ${path.relative(root, baselinePath)} — run --write first.`);
    process.exit(1);
  }
  const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
  const changed = diffExportNames(baseline, current);
  if (changed) {
    console.error("Export-name diff found — see above.");
    process.exit(1);
  }
  console.log("Export names match the baseline.");
}

await main();
```

> Note: the checkbox "baseline JSON committed" is satisfied by running `node scripts/export-names.mjs --write` once the package exports are stable (after Step 7 drops `./convex`, the baseline is regenerated again per that step's own checklist) and committing the resulting `export-names.baseline.json`. No code block for that file — it is machine-generated, not hand-written.

---

### Step 1 — `src/documents/`: all document types out of `api/convex.ts` [agent]
Why: decision 5; `VexDocument`/`TDocument`/`VexVersionDocument`/`VexMediaDocument` all move to
`documents/types.ts`, which breaks the `api/convex.ts:5` ↔ `versions/model.ts` cycle without
moving any version constant — `documents/types.ts` reads `VERSION_SYSTEM_FIELDS`/
`VexVersionStatus` directly from `../versions/constants`, never the `../versions` barrel.
Verify: `pnpm --filter @vexcms/core typecheck && pnpm --filter @vexcms/core test`
- [ ] `packages/core/src/documents/types.ts` (+ `index.ts`) — `VexDocument`/`TDocument`/`VexVersionDocument`/`VexMediaDocument` moved from `api/convex.ts`
- [ ] `packages/core/src/versions/index.ts` — explicit re-export of `VexVersionDocument` from `../documents/types`
- [ ] `packages/core/src/media/index.ts` — explicit re-export of `VexMediaDocument` from `../documents/types`
- [ ] `api/convex.ts` trimmed to its remaining per-domain arg types and `vexConvexApi` (both move out in Steps 3–7); import header updated
- [ ] every importer of `VexDocument`/`TDocument`/`VexVersionDocument`/`VexMediaDocument` from `api/convex` repointed (`collections/types.ts`, `editor/types.ts`, `fields/*`, `livePreview/`, `revalidate/`, `routes/types.ts`, `types/generated.ts`, `versions/model.ts`, `src/index.ts`)

`api/convex.ts` (590 lines) is, per Finding 1, "the document types" in full — base
`VexDocument`/`TDocument`/`VexVersionDocument`/`VexMediaDocument`, the collection/media/globals/
versions API shallow arg types (`VexFindArgs`, `VexMediaGetUrlArgs`, `VexSaveDraftArgs`, …), and
`vexConvexApi` itself. Only the first four move in this step, all to `documents/types.ts` — the
arg types and `vexConvexApi` stay in `api/convex.ts` — each arg-type group moves out when its
owning domain's `api/types.ts` is created (Steps 3–6); `vexConvexApi` moves to its own file when
`api/convex.ts` is finally deleted (Step 7).

#### packages/core/src/documents/types.ts

New file — `VexDocument`/`TDocument`/`VexVersionDocument`/`VexMediaDocument` cut from
`api/convex.ts` (original lines 9–102, including their doc comments), unchanged except for the
import header: `VERSION_SYSTEM_FIELDS`/`VexVersionStatus` now come from `../versions/constants`
directly rather than being declared or imported elsewhere. `versions/constants.ts` has no
imports of its own, so this is a one-way edge with no cycle risk.

```ts
import { VERSION_SYSTEM_FIELDS, VexVersionStatus } from "../versions/constants";

/**
 * Base type for all VexCMS documents as returned from Convex queries.
 *
 * All documents include the Convex system fields `_id` and `_creationTime`,
 * plus whatever field values are defined in the collection's schema.
 *
 * Framework adapters use this as the `initialData` type in view component
 * props — the actual field values are accessed via string keys.
 *
 * @example
 * ```ts
 * const title = typeof doc.title === "string" ? doc.title : "";
 * ```
 *
 * @see {@link vexConvexApi} for the query functions that return this type
 */
export interface VexDocument {
  /** Convex document ID string. */
  _id: string;
  /** Unix timestamp (milliseconds) when the document was created. */
  _creationTime: number;
  /** Field values defined by the collection schema. */
  [key: string]: unknown;
}

/**
 * Alias for `VexDocument` that also satisfies `Record<string, unknown>`.
 *
 * Use this type when a generic `Record` index signature is required alongside
 * the Convex system fields — for example, as the `data` type in TanStack Table
 * or as the form `defaultValues` record.
 *
 * @see {@link VexDocument} for the base type
 */
export type TDocument<TShape = {}> = Record<string, unknown> & TShape & VexDocument;

/**
 * Type for versioned documents returned from Convex queries.
 *
 * Extends `VexDocument` with all required version fields: vex_status, vex_publishedId,
 * vex_publishedA. Use this instead of `TDocument` in versioned collection views to
 * avoid casting fields like `row.vex_status as string`.
 *
 * @example
 * ```ts
 * const src = doc.src; // string | undefined, no cast needed
 * const alt = doc.alt ?? "";
 * ```
 *
 * @see {@link TDocument} for the base document type with custom shape support
 */
export interface VexVersionDocument extends VexDocument {
  [VERSION_SYSTEM_FIELDS.status.slug]: VexVersionStatus;
  [VERSION_SYSTEM_FIELDS.publishedId.slug]?: string;
  [VERSION_SYSTEM_FIELDS.publishedAt.slug]?: number;
  [VERSION_SYSTEM_FIELDS.activeVersion.slug]?: number;
}

/**
 * Type for media documents returned from Convex queries.
 *
 * Extends `VexDocument` with all required media fields: alt, filename,
 * mimeType, size, storageId, deleted, src (the file URL), and optional
 * width/height. Use this instead of `TDocument` in media collection views to
 * avoid casting fields like `row.original.src as string`.
 *
 * @example
 * ```ts
 * const src = doc.src; // string | undefined, no cast needed
 * const alt = doc.alt ?? "";
 * ```
 *
 * @see {@link TDocument} for the base document type with custom shape support
 */
export interface VexMediaDocument extends VexDocument {
  /** Alt text for accessibility and SEO. */
  alt: string;
  /** Original filename of the uploaded file. */
  filename: string;
  /** MIME type (e.g., "image/jpeg", "application/pdf"). */
  mimeType: string;
  /** File size in bytes. */
  size: number;
  /** Storage adapter ID for the uploaded file. */
  storageId: string;
  /** Whether this media item has been soft-deleted. */
  deleted: boolean;
  /** URL to the file. */
  src: string;
  /** Image width in pixels (if applicable). */
  width?: number;
  /** Image height in pixels (if applicable). */
  height?: number;
}
```

#### packages/core/src/documents/index.ts

```ts
export * from "./types";
```

#### packages/core/src/versions/index.ts

1 edit — an explicit re-export line appended, so the `versions/` barrel still carries
`VexVersionDocument` for importers that prefer the feature barrel, even though the type is no
longer declared under `versions/`:

```ts
export * from "./constants";
export * from "./schema";
export * from "./model";
export * from "./removeVexFields";
export * from "./resolveVersionedTarget";
export * from "./saveDraft";
export * from "./statusQueryConstraint";
export * from "./types";
export type { VexVersionDocument } from "../documents/types";
```

#### packages/core/src/media/index.ts

1 edit — same pattern, for `VexMediaDocument`:

```ts
export * from "./types";
export * from "./validators";
export * from "./config";
export * from "./api";
export * from "./utils";
export type { VexMediaDocument } from "../documents/types";
```

#### packages/core/src/api/convex.ts

1 edit — the import header, and removal of `VexDocument`/`TDocument`/`VexVersionDocument`/
`VexMediaDocument` (original lines 9–102). Everything from the "Collection API types" comment
(original line 104) through the end of `vexConvexApi` (original line 590) is unchanged for now
— it moves out piece by piece in Steps 3–7.

Replace the original:
```ts
import { anyApi } from "convex/server";
import type { FunctionReference } from "convex/server";
import type { PaginationOptions, PaginationResult, VexApiAuth } from "./types";
import { CollectionSlug, VexDocumentGlobal } from "../types";
import { VERSION_SYSTEM_FIELDS, VexVersionStatus, VersionSummary } from "../versions";
import type { VersionSnapshotResult } from "./versions/getVersionSnapshot.server";
import type { VexWhereNodeOf } from "../access/queryConstraintTypes";
```
with:
```ts
import { anyApi } from "convex/server";
import type { FunctionReference } from "convex/server";
import type { PaginationOptions, PaginationResult, VexApiAuth } from "./types";
import { CollectionSlug, VexDocumentGlobal } from "../types";
import type { VexDocument } from "../documents/types";
import type { VersionSummary } from "../versions/types";
import type { VersionSnapshotResult } from "./versions/getVersionSnapshot.server";
import type { VexWhereNodeOf } from "../access/queryConstraintTypes";
```
`VERSION_SYSTEM_FIELDS`/`VexVersionStatus` are dropped — nothing left in this file declares
`VexVersionDocument` anymore, and no arg type or `vexConvexApi` entry reads either constant.
`VexDocument` is now imported rather than declared locally; `VersionSummary` is still read
directly from `../versions/types`, never the `../versions` barrel, for the same reason Step 2's
pipeline types avoid cycles — `vexConvexApi`'s `versions.listVersions` entry return type still
needs it and this file is not yet deleted.

#### packages/core/src/versions/model.ts

1 edit — the import of `VexVersionDocument`:
```ts
import { VexVersionDocument } from "../documents/types";
```
(was `from "../api/convex"`; `VERSION_SYSTEM_FIELDS` from `./constants` is unchanged. Reading
`VexVersionDocument` straight from `../documents/types` rather than `api/convex.ts` removes the
only edge that made `api/convex.ts` and `versions/` cyclic — this file no longer reaches
`api/convex.ts` for its own document shape.)

#### Importer repoints

Every other importer of `api/convex` changes only its module specifier. `TDocument`/
`VexDocument`/`VexVersionDocument`/`VexMediaDocument` all now come from `documents/types`
(directly, or through the `versions`/`media` feature barrel where an importer already reads
from one of those barrels).

| File | Old specifier | New specifier |
|---|---|---|
| `src/framework.ts` | `./api/convex` (`VexDocument`) | `./documents/types` |
| `src/index.ts` | `./api/convex` (barrel `export *`) | `./documents/types` |
| `collections/types.ts` | `../api/convex` (`TDocument`) | `../documents/types` |
| `editor/types.ts` | `../api/convex` (`VexMediaDocument`) | `../media` |
| `fields/types.ts` | `../api/convex` (`TDocument`) | `../documents/types` |
| `fields/utils.ts` | `../api/convex` (`TDocument`) | `../documents/types` |
| `livePreview/types.ts` | `../api/convex` (`VexDocument`) | `../documents/types` |
| `revalidate/resolveTargets.ts` | `../api/convex` (`VexDocument`) | `../documents/types` |
| `revalidate/types.ts` | `../api/convex` (`VexDocument`) | `../documents/types` |
| `routes/types.ts` | `../api/convex` (`VexDocument`) | `../documents/types` |
| `types/generated.ts` | `../api/convex` (`TDocument`, `VexDocument`) | `../documents/types` |
| `api/update/server.ts` | `../convex` (`TDocument`) | `../../documents/types` |

`editor/types.ts` is the one row that changes destination from the original draft: its
`VexMediaDocument` import now points at the `../media` barrel — `media/index.ts` re-exports
`VexMediaDocument` from `../documents/types` per this step's edit, so `editor/types.ts` keeps
reading its document shape through the feature barrel it already imports from today rather than
reaching into `documents/types.ts` directly. The last row is not in the step-tasks example list
but is a real importer found by grep (`api/update/server.ts` reads `TDocument` from `../convex`,
i.e. `api/convex.ts`, directly) — left unmoved until Step 3, so it needs the same repoint now or
`@vexcms/core` fails to typecheck.

> Note: `api/convex.test.ts`'s actual content (`describe("versionsApi — conditional
> registration", …)`) tests `versionsApi` from `./server`, not anything declared in
> `convex.ts` — the file is misnamed today. `documents/types.ts` has no behavior of its own to
> test (it is types, already covered by every op's own `.server.test.ts` through the
> `FunctionReference` casts they exercise), so this step leaves `api/convex.test.ts` exactly
> where it is. Step 5 moves it to `versions/api/versionsApi.test.ts`, its honest home now that
> `versionsApi` has one.

---

### Step 2 — `src/db/` read/write pipeline; access dispatchers into `access/` [agent]
Why: decision 2; `prepareEdit`, `populate`, `depth`, `queryArgs`, `triggers`, ctx narrowing and `stampUpdatedAt` are the shared pipeline every domain `api/` calls.
Verify: `pnpm --filter @vexcms/core typecheck && pnpm --filter @vexcms/core test`
- [ ] `git mv` `api/{prepareEdit,populate,depth,queryArgs,triggers}.ts` (+ tests) → `db/`
- [ ] `api/utils.ts` split: `toVexQueryCtx`, `toVexMutationCtx`, `stampUpdatedAt`, `resolveCollectionSlug`, `readableDocuments` → `db/context.ts` / `db/documents.ts`; `resolveAccessCall`, `resolveReadCall` → `access/resolveAccessCall.ts`, `access/resolveReadCall.ts` (+ split tests)
- [ ] cross-domain API types (`VexApiAuth`, `PaginationResult`, `PopulateShape`, `AccessCallOptions`, call-action types) → `db/types.ts`; `VexCallbackApi` stays with the entry (step 7)
- [ ] `api/test/` (convex-test fixture) → `db/test/`; `standards/testing/convex-integration-testing.md` path updated
- [ ] `db/index.ts` barrel; importers repointed (`versions/{publish,saveDraft,unpublish}.ts`, `media/api/*`, `livePreview/resolveUrl.server.ts`, `access/*`, `fields/*`)

> Note on the `db/types.ts` split: `api/types.ts` is 745 lines and not every type in it is cross-domain. `GenericQueryClientParams`/`GenericQueryServerParams`/`GenericMutationClientParams`/`GenericMutationServerParams`, `DepthPopulate`/`DepthPopulated` (the latter needs `VexDocument`) and `DocReturnItem`/`GetReturn`/`FindReturn`/`FindReturnPaginated`/`SearchReturn`/`SearchReturnPaginated` are collection-specific — only `find`/`get`/`search` extend or return them. Moving those into `db/types.ts` would force `db/types.ts` to import `VexDocument` from `documents/types.ts`, and `documents/types.ts` has no import of its own (Step 1 keeps it domain-neutral and import-free) — so there is no cycle risk either way; `db/types.ts` stays limited to the genuinely cross-domain subset below purely because the twelve collection-specific types belong with `find`/`get`/`search`, not because of an import cycle.

#### packages/core/src/db/prepareEdit.ts, db/populate.ts, db/depth.ts, db/queryArgs.ts

`git mv packages/core/src/api/{prepareEdit,populate,depth,queryArgs}.ts packages/core/src/db/` (+ matching `.test.ts` files). `depth.ts` and `queryArgs.ts` need no import changes — every import they carry (`../fields`, `../config`, `../types/generated`, `../access/*`, `../errors`, `../versions`) is the same relative depth from `src/db/` as it was from `src/api/`, and their own test files' fixture imports (`./test/convex/...`) move with `api/test/` → `db/test/` unchanged.

`populate.ts` needs one import changed, per decision 5: `VERSION_STATUSES`/`VERSION_SYSTEM_FIELDS` move from the `../versions` barrel import to a direct `../versions/constants` import — `db/` is shared pipeline code every domain `api/` calls, so it reads version constants the same way `versions/types.ts` itself does (never the barrel), keeping this edge one-way regardless of what else the `versions/` barrel re-exports in the future.

```ts
import { VERSION_STATUSES, VERSION_SYSTEM_FIELDS } from "../versions/constants";
```
(was `import { VERSION_STATUSES, VERSION_SYSTEM_FIELDS } from "../versions";`; every other import — `convex-helpers`, `convex-helpers/server/relationships`, `convex/server`, `convex/values`, `../types/generated`, `./types` — is unchanged.)

`prepareEdit.ts` needs its import header updated (body unchanged):

```ts
import type { AccessCallOptions, VexApiAuth } from "./types";
import type { TDocument } from "../documents/types";
import { CRUD_ACTIONS, DRAFT_ACTIONS, hasPermission } from "../access";
import { assignArrayItemIds, getFieldsInputSchema, validateFields } from "../fields";
import { resolveAccessCall } from "../access/resolveAccessCall";
import { toVexMutationCtx } from "./context";
import { valuesEqual } from "../utils/valuesEqual";
import { CollectionOrGlobal } from "../types";
```

(was `import type { TDocument } from "./convex";` and `import { resolveAccessCall, toVexMutationCtx } from "./utils";`.)

#### packages/core/src/db/triggers.ts

`git mv packages/core/src/api/triggers.ts packages/core/src/db/triggers.ts` (+ test). One import changes — `flattenGlobalRow` still lives in `api/globals/` (untouched until Step 4):

```ts
import { flattenGlobalRow } from "../api/globals/utils";
```

(was `from "./globals/utils"`.)

#### packages/core/src/db/context.ts

New file — `toVexQueryCtx`/`toVexMutationCtx` cut from `api/utils.ts` (original lines 19–58), imports trimmed to only what they use.

```ts
import type { GenericDataModel, GenericMutationCtx, GenericQueryCtx } from "convex/server";
import type { VexMutationCtx, VexQueryCtx } from "../types/generated";

/**
 * Narrows a generically-typed Convex context to the project's own.
 *
 * Framework adapters pass the raw `GenericQueryCtx<DataModel>` Convex gives
 * their handler; `VexQueryCtx` is the augmented type (`GeneratedVexTypes`)
 * every Vex helper expects. The cast is sound because `DataModel` already
 * describes the same schema `vex generate` augmented — this only aligns the
 * static type, no runtime shape changes.
 *
 * @param ctx - The raw Convex query context.
 * @returns The same context, typed as `VexQueryCtx`.
 */
export function toVexQueryCtx<DataModel extends GenericDataModel>(
  ctx: GenericQueryCtx<DataModel>,
): VexQueryCtx {
  return ctx as unknown as VexQueryCtx;
}

/**
 * Mutation counterpart of {@link toVexQueryCtx}.
 *
 * @param ctx - The raw Convex mutation context.
 * @returns The same context, typed as `VexMutationCtx`.
 */
export function toVexMutationCtx<DataModel extends GenericDataModel>(
  ctx: GenericMutationCtx<DataModel>,
): VexMutationCtx {
  return ctx as unknown as VexMutationCtx;
}
```

#### packages/core/src/db/documents.ts

New file — `stampUpdatedAt`, `resolveCollectionSlug`, `readableDocuments` cut from `api/utils.ts` (original lines 223–330), each with its original doc comment, imports trimmed to only what they use.

```ts
import type { GenericDataModel, GenericDocument, GenericQueryCtx } from "convex/server";
import type { GenericId } from "convex/values";
import type { VexConfig } from "../config";
import type { CollectionSlug } from "../types";
import {
  hasPermission,
  isFieldAllowed,
  resolveFieldPermissions,
  stripDeniedFields,
  VexAccessConfig,
} from "../access";
import type { VexApiAuth } from "./types";

/**
 * Adds the auto-maintained `updatedAt` timestamp to a write payload, when the
 * target collection carries the field `defineCollection` injects.
 *
 * Shared by `create` and `update` so the two write paths cannot drift on when
 * a document gets stamped.
 *
 * Skipped in three cases, all deliberate:
 * - The slug matches no registered collection — nothing declares the column,
 *   and Convex's schema validation would reject the write.
 * - The collection opted out with `{ timestamps: false }`, so `fields` has no
 *   `updatedAt` entry.
 * - The field is `meta.locked` — that is better-auth's OWN `updatedAt`,
 *   populated from the auth table's real schema attribute. Its adapter owns
 *   that value, so vexcms must never write it.
 *
 * @param props - The resolved config, target collection slug, and the payload
 *   exactly as the caller sent it.
 * @returns The payload, with `updatedAt` set to now when the collection
 *   carries an unlocked `updatedAt` field; otherwise the payload unchanged.
 */
export function stampUpdatedAt<TData>(props: {
  collection: CollectionSlug;
  config: VexConfig;
  data: TData;
}): TData {
  const collection = props.config.collections.find((c) => c.slug === props.collection);
  const field = collection?.fields.updatedAt;
  if (field === undefined) {
    return props.data;
  }
  // `meta` is generic over `TFieldMeta`, so `locked` is not on its static
  // shape. Read it through a validated boundary rather than asserting: only a
  // literal `true` counts, anything else stamps.
  const meta: Record<string, unknown> = field.meta;
  if (meta.locked === true) {
    return props.data;
  }
  return { ...props.data, updatedAt: Date.now() };
}

/**
 * Resolves the collection slug that owns a document `id` by probing
 * `ctx.db.normalizeId` against every registered collection, media collections
 * included.
 *
 * A Convex `Id` does not expose its table name at runtime. `get/server.ts`'s
 * D12 comment documents the same constraint for depth-populate, where
 * degrading to "unresolvable" is safe (populate is simply skipped). It is
 * NOT safe here — both callers gate a real permission check on the result —
 * so this resolves the slug via the `ctx.db.normalizeId(tableName, id)`
 * syscall instead of string-parsing the id. Unlike the D12 trick, this works
 * identically in `convex-test` and production Convex.
 *
 * **Media collections must be probed, not just `config.collections`.** Both
 * callers — `getUrl` and `deleteMedia` — pass a MEDIA document id by
 * definition, and `defineConfig` keeps `collections` and `mediaCollections` as
 * separate arrays (`config/config.ts`). Probing only the former made every
 * media id unresolvable, so `getUrl` threw for any project that configured
 * `access` at all: uploaded images silently vanished from public pages
 * (`MediaImage` renders `null` when the query errors) and no `og:image` was
 * ever emitted. `validateAccessConfig` already concatenates both arrays when
 * validating resources, so a media slug is a legitimate permission subject —
 * this makes the runtime lookup agree with that.
 *
 * @param props.ctx - Query or mutation context — only `ctx.db.normalizeId` is used.
 * @param props.config - The resolved `VexConfig`, to enumerate candidate collections.
 * @param props.id - The document id to resolve.
 * @returns The owning collection's slug.
 * @throws {Error} When no registered collection claims the id (e.g. an id for a
 *   non-collection table like `vex_globals`, or a stale id from a deleted collection).
 *   Callers gate the permission check behind this, so an unresolvable id is a hard error,
 *   not a silent skip.
 */
export function resolveCollectionSlug<DataModel extends GenericDataModel>(props: {
  ctx: GenericQueryCtx<DataModel>;
  config?: VexConfig;
  id: GenericId<CollectionSlug>;
}): CollectionSlug {
  const candidates = [
    ...(props.config?.collections ?? []),
    ...(props.config?.mediaCollections ?? []),
  ];
  for (const c of candidates) {
    if (props.ctx.db.normalizeId(c.slug, props.id) !== null) {
      return c.slug;
    }
  }
  throw new Error("[resolveCollectionSlug]: document id does not match a collection slug");
  // Note: both arrays are small and `normalizeId` is a local syscall (no DB round trip),
  // so looping them once per `getUrl`/`deleteMedia` request is cheap.
}

/**
 * The per-document read pass `find` and `search` share: `hasPermission`, then the
 * caller's field permissions, then stripping denied fields.
 *
 * A document is dropped, not stripped, when the caller's `where` referenced a field
 * this caller may not read on it: a match on a hidden field would reveal the
 * field's value through which rows came back (for example, "which posts have
 * `salary > 100000`").
 *
 * @param props - Input props.
 * @param props.docs - Documents as fetched.
 * @param props.access - From `resolveReadCall` / `resolveAccessCall`; `undefined` when
 *   access is bypassed or unconfigured, which allows everything.
 * @param props.auth - The caller.
 * @param props.resource - Subject slug.
 * @param props.action - Read action being checked.
 * @param props.whereFields - Field names the caller's `where` referenced, system fields
 *   excluded; `[]` when there is no caller `where` or access is not enforced.
 * @returns The readable documents, with denied fields removed.
 */
export function readableDocuments<TDoc extends GenericDocument>(props: {
  docs: readonly TDoc[];
  access: VexAccessConfig | undefined;
  auth: VexApiAuth | undefined;
  resource: string;
  action: string;
  whereFields: readonly string[];
}): TDoc[] {
  const user = props.auth?.user ?? null;
  const organization = props.auth?.organization;
  const readable: TDoc[] = [];
  for (const doc of props.docs) {
    if (!hasPermission({ access: props.access, resource: props.resource, action: props.action, data: doc, user, organization })) {
      continue;
    }
    const fieldPermissions = resolveFieldPermissions({
      access: props.access,
      user,
      organization,
      resource: props.resource,
      action: props.action,
      data: doc,
    });
    if (props.whereFields.some((field) => !isFieldAllowed(fieldPermissions, field))) continue;
    readable.push(stripDeniedFields(doc, fieldPermissions));
  }
  return readable;
}
```

#### packages/core/src/access/resolveAccessCall.ts

New file — cut from `api/utils.ts` (original lines 60–129), doc comment unchanged.

```ts
import type { VexConfig } from "../config";
import type { AccessCallOptions } from "../db/types";
import { CRUD_ACTIONS, DRAFT_ACTIONS, type CustomActionsInput } from "./constants";
import type { VexAccessConfig } from "./types";

/**
 * Resolves the access config and action for one server-function call.
 *
 * Single seam for `access.action` / `access.bypass`. Bypass returns `undefined` for
 * `access`, which is the documented "RBAC not configured" path — no separate enforcement
 * branch exists or should be added.
 *
 * @param props.config - Resolved Vex config; `config.access` supplies the matrix.
 * @param props.access - Per-call overrides.
 * @param props.defaultAction - The function's natural verb.
 * @param props.resource - Subject slug: the custom-action lookup key, and the name the
 *   dev warnings report.
 * @returns The access config to enforce (`undefined` when bypassed) and the action to check.
 */
export function resolveAccessCall<A extends string>(props: {
  config?: VexConfig;
  access?: AccessCallOptions<A>;
  defaultAction: A;
  resource: string;
}): { access: VexAccessConfig | undefined; action: A; resource: string } {
  const configured = props.config?.access;
  const bypassed = props.access?.bypass === true;
  const action = props.access?.action ?? props.defaultAction;

  // Dev-only diagnostics. Neither case is unsafe — the undeclared-permission posture is
  // pinned to deny, so an action nothing declares is refused, never granted. They exist
  // because that refusal is otherwise indistinguishable from a deliberate denial, and a
  // one-character typo in an action name is invisible at the call site.
  if (process.env.NODE_ENV !== "production") {
    if (bypassed && configured === undefined) {
      console.warn(
        `[vexcms] access.bypass was set for "${props.resource}" but this call has no access ` +
          `config, so RBAC was already off and the flag changed nothing. Either drop it, or ` +
          `check that the call receives the config you expect.`,
      );
    }

    // Skipped when bypassed: no check runs, so the action is not consulted and warning
    // about it would be noise.
    if (!bypassed && props.access?.action !== undefined && configured !== undefined) {
      // `customActions` stays generic on the resolved config so it can carry the caller's
      // literal declaration for inference, and the wide `VexConfig.access` instantiates
      // that parameter to `{}` — so a runtime lookup by slug has to restate the value
      // shape. Read-only, and `defineAccess` has already validated the entries.
      const declaredForResource = (
        configured.customActions as Record<string, CustomActionsInput> | undefined
      )?.[props.resource];

      const declared = new Set<string>([
        ...Object.values(CRUD_ACTIONS),
        ...Object.values(DRAFT_ACTIONS),
        ...(declaredForResource?.query ?? []),
        ...(declaredForResource?.mutation ?? []),
      ]);

      if (!declared.has(action)) {
        console.warn(
          `[vexcms] Action "${action}" is not declared for "${props.resource}": it is neither ` +
            `a built-in verb nor listed in customActions["${props.resource}"]. No rule can ` +
            `name it, so this call resolves to a denial. Check for a typo.`,
        );
      }
    }
  }

  // Bypass returns `undefined` rather than short-circuiting a check: that is the documented
  // "RBAC not configured" path, so every downstream consumer already handles it and no
  // second enforcement branch can drift from the first.
  return { access: bypassed ? undefined : configured, action, resource: props.resource };
}
```

#### packages/core/src/access/resolveReadCall.ts

New file — cut from `api/utils.ts` (original lines 131–188), doc comment unchanged.

```ts
import { DRAFT_ACTIONS, CRUD_ACTIONS, PERMISSION_SCOPES } from "./constants";
import { hasPermission } from "./hasPermission";
import { resolveAccessCall } from "./resolveAccessCall";
import type { VexAccessConfig } from "./types";
import type { AccessCallOptions, VexApiAuth } from "../db/types";
import type { VexConfig } from "../config";

/**
 * Resolves a collection READ call (`find`/`get`/`search`) that may ask for
 * drafts: checks `readDrafts` first when `drafts: true`, falling back to the
 * plain `read` check (with `drafts` forced `false`) when the caller may not
 * read drafts.
 *
 * @param props.config - Resolved Vex config.
 * @param props.access - Per-call overrides.
 * @param props.auth - The caller.
 * @param props.collection - Subject slug.
 * @param props.drafts - Whether the caller asked to include drafts.
 * @returns The resolved access config/action/resource, plus whether drafts are actually included.
 */
export function resolveReadCall(props: {
  config?: VexConfig;
  access?: AccessCallOptions<string>;
  auth?: VexApiAuth;
  collection: string;
  drafts?: boolean;
}): { access: VexAccessConfig | undefined; action: string; resource: string; wantsDrafts: boolean } {
  if (props.drafts === true) {
    const draftsCall = resolveAccessCall({
      config: props.config,
      access: props.access,
      defaultAction: DRAFT_ACTIONS.readDrafts as string,
      resource: props.collection,
    });
    // Bypass/unconfigured access resolves `access` to `undefined`: no RBAC, drafts allowed.
    const mayReadDrafts =
      draftsCall.access === undefined ||
      hasPermission({
        access: draftsCall.access,
        user: props.auth?.user ?? null,
        organization: props.auth?.organization,
        resource: draftsCall.resource,
        action: draftsCall.action,
        scope: PERMISSION_SCOPES.any,
      });
    if (mayReadDrafts) return { ...draftsCall, wantsDrafts: true };
  }
  return {
    ...resolveAccessCall({
      config: props.config,
      access: props.access,
      defaultAction: CRUD_ACTIONS.read as string,
      resource: props.collection,
    }),
    wantsDrafts: false,
  };
}
```

#### packages/core/src/access/index.ts

1 edit — add the two new modules to the barrel, alongside the existing re-exports:

```ts
export * from "./resolveAccessCall";
export * from "./resolveReadCall";
```

#### packages/core/src/access/resolveAccessCall.test.ts

New file — the `describe("resolveAccessCall", …)` block cut from `api/utils.test.ts` (original lines 1–103), fixtures colocated, imports repointed.

```ts
import { describe, expect, it, vi } from "vitest";
import { defineAccess } from "./config";
import { defineCollection, text } from "../index";
import { resolveAccessCall } from "./resolveAccessCall";

const articles = defineCollection({
  slug: "articles",
  fields: { title: text({ required: true }), status: text({ index: "by_status" }) },
});
const users = defineCollection({
  slug: "users",
  fields: { name: text({ required: true }), roles: text() },
});

const access = defineAccess({
  roles: ["editor"] as const,
  resources: [articles, users],
  userCollectionSlug: "users",
  userRolesField: "roles",
  customActions: { articles: { query: ["listFeatured"], mutation: ["publish"] } },
  permissions: { editor: { articles: { read: true } } },
});
const config = { access } as never;

describe("resolveAccessCall", () => {
  // … the 7 `it(...)` cases from `api/utils.test.ts` lines 26–102, unchanged.
});
```

> Note: the body of each `it(...)` case is unchanged from `api/utils.test.ts` (original lines 26–102) — only the file's location and its two import specifiers (`./config` for `defineAccess`, `./resolveAccessCall` for the function under test) change. Reproducing all seven cases verbatim here would just restate code the developer already has; copy them across the `git mv`-equivalent split as-is.

#### packages/core/src/db/documents.test.ts

New file — the `describe("resolveCollectionSlug", …)` block cut from `api/utils.test.ts` (original lines 105–149), with its own minimal fixtures (it does not need `defineAccess`/`access`/`config`, only two plain collections and a media collection).

```ts
import { describe, expect, it } from "vitest";
import { defineCollection, text } from "../index";
import { resolveCollectionSlug } from "./documents";

const articles = defineCollection({
  slug: "articles",
  fields: { title: text({ required: true }) },
});
const users = defineCollection({
  slug: "users",
  fields: { name: text({ required: true }) },
});

describe("resolveCollectionSlug", () => {
  /**
   * A `ctx` whose `normalizeId` claims `id` for exactly one table, mirroring the
   * real syscall: non-null for the owning table, `null` for every other.
   *
   * @param owningTable - The table the id actually belongs to.
   * @returns A partial query ctx carrying only `db.normalizeId`.
   */
  function ctxOwnedBy(owningTable: string) {
    return {
      db: { normalizeId: (table: string, id: string) => (table === owningTable ? id : null) },
    } as never;
  }

  const images = defineCollection({ slug: "images", fields: { alt: text() } });
  // `defineConfig` keeps media collections in their OWN array — a media slug never
  // appears in `collections`, which is exactly what this resolver has to handle.
  const mediaConfig = { collections: [articles, users], mediaCollections: [images] } as never;

  it("resolves an id owned by a regular collection", () => {
    expect(
      resolveCollectionSlug({ ctx: ctxOwnedBy("articles"), config: mediaConfig, id: "a1" as never }),
    ).toBe("articles");
  });

  it("resolves an id owned by a MEDIA collection", () => {
    // Regression: probing only `config.collections` left every media id
    // unresolvable, so `getUrl`/`deleteMedia` threw for any project with
    // `access` configured — public pages lost their images and emitted no
    // `og:image`.
    expect(
      resolveCollectionSlug({ ctx: ctxOwnedBy("images"), config: mediaConfig, id: "i1" as never }),
    ).toBe("images");
  });

  it("throws when no registered collection claims the id", () => {
    expect(() =>
      resolveCollectionSlug({
        ctx: ctxOwnedBy("vex_globals"),
        config: mediaConfig,
        id: "g1" as never,
      }),
    ).toThrow(/does not match a collection slug/);
  });
});
```

`api/utils.test.ts` itself is removed (`git mv` leaves nothing behind once both `describe` blocks are relocated); `toVexQueryCtx`/`toVexMutationCtx`/`readableDocuments` had no dedicated tests in it and still don't.

#### packages/core/src/db/types.ts

New file — the cross-domain subset of `api/types.ts` (original lines 1–26 imports trimmed, 34–99, 296–414, 640–745). See the Note above this step for which types stay in `api/types.ts`.

```ts
import type {
  PaginationOptions as ConvexPaginationOptions,
  PaginationResult as ConvexPaginationResult,
} from "convex/server";

import { ADMIN_FIELDS, CheckboxFieldType, DateFieldType, NumberFieldType, SelectFieldType, TextFieldType, type AdminFieldType } from "../fields";
import type { CollectionsFieldTypeMap, CollectionSlug, CustomActionsBySlug, DocumentBySlug } from "../types/generated";
import { QueryAction, DraftAction, CrudAction } from "../access/constants";

/**
 * Forces TypeScript to eagerly evaluate a mapped/conditional type into a
 * concrete object shape rather than displaying the opaque alias. Without this,
 * hovering a type built from several nested conditionals shows the alias
 * name, not its resolved shape.
 */
export type Prettify<T> = { [K in keyof T]: T[K] } & {};

/**
 * Per-call access options. Server-side only — NEVER accept these from a registered
 * Convex function's `args`: an action no role declares falls through to
 * `defaultPermissionMode` (default `allow`), so a client-chosen action reads anything.
 *
 * @typeParam A - Action union accepted for this call shape.
 */
export interface AccessCallOptions<A extends string = string> {
  /**
   * Permission action to check instead of the function's natural verb. Use for custom
   * actions (`listFeatured`) and for draft reads (`readDrafts`).
   *
   * @defaultValue the function's natural verb (`read`, `create`, `update`, `delete`)
   */
  action?: A;
  /**
   * Skip RBAC for this call entirely. Also skips `getAuth`, so a public read costs no
   * session lookup.
   *
   * @defaultValue false
   */
  bypass?: boolean;
}

/**
 * Actions a query-shaped call may check. `(string & {})` keeps literal autocomplete.
 *
 * NOT `| DraftAction`: `QueryAction` already carries `readDrafts` (the only
 * query-shaped draft verb), so adding the full draft union would offer
 * `saveDraft`/`publish`/`unpublish` - mutation verbs - in every query position.
 */
export type QueryCallAction = QueryAction | (string & {});

/** Actions a mutation-shaped call may check. The draft verbs minus `readDrafts`. */
export type MutationCallAction = CrudAction | Exclude<DraftAction, QueryAction> | (string & {});

/** Custom actions of one kind declared for slug `S` in the generated registry. @internal */
type CustomCallActionsFor<
  S extends string,
  K extends "query" | "mutation",
> = S extends keyof CustomActionsBySlug
  ? CustomActionsBySlug[S] extends Record<K, infer A extends string>
    ? A
    : never
  : never;

/**
 * Actions a query-shaped call on collection `S` may check.
 *
 * Pre-generation the registry is `{}`, so this collapses to {@link QueryCallAction} —
 * arbitrary strings stay accepted, which is what lets core's own tests exercise custom
 * actions against an unaugmented registry. Post-generation the `(string & {})` arm is
 * REPLACED by the slug's declared union: a custom verb autocompletes exactly where it
 * is declared and is a compile error everywhere else.
 */
export type QueryCallActionFor<S extends string> = [keyof CustomActionsBySlug] extends [never]
  ? QueryCallAction
  : QueryAction | CustomCallActionsFor<S, "query">;

/** Mutation-shaped counterpart of {@link QueryCallActionFor}. */
export type MutationCallActionFor<S extends string> = [keyof CustomActionsBySlug] extends [never]
  ? MutationCallAction
  : CrudAction | Exclude<DraftAction, QueryAction> | CustomCallActionsFor<S, "mutation">;

// ── Per-collection field-type helpers ─────────────────────────────────────
//
// Read the `CollectionsFieldTypeMap` property on the augmented
// `GeneratedVexTypes` registry (populated by `vex generate`). Used by
// `populate` typing, sortable-column inference, and future filter ops.

/**
 * Returns the union of field keys on `TCollectionSlug` that have field type `TType`.
 *
 * Reads the `CollectionsFieldTypeMap` property on the augmented `GeneratedVexTypes`
 * registry — populated by `vex generate` from the user's collection configs.
 * Returns `never` when the slug has no fields of that type, or when the
 * registry hasn't been augmented yet (fresh project).
 *
 * @typeParam TCollectionSlug - The collection slug.
 * @typeParam TType - The field type literal (e.g., `"text"`, `"relationship"`).
 *
 * @example
 * ```ts
 * type AuthorRelationships = FieldKeysOfType<"posts", "relationship">;
 * // → "author" | "category"
 */
export type FieldKeysOfType<
  TCollectionSlug extends CollectionSlug,
  TType extends AdminFieldType,
> = TCollectionSlug extends keyof CollectionsFieldTypeMap
  ? TType extends keyof CollectionsFieldTypeMap[TCollectionSlug]
    ? CollectionsFieldTypeMap[TCollectionSlug][TType] & string
    : never
  : never;

/** Field keys on `TCollectionSlug` that are relationship fields. */
export type RelationshipKeysOf<TCollectionSlug extends CollectionSlug> = FieldKeysOfType<
  TCollectionSlug,
  typeof ADMIN_FIELDS.relationship.type
>;

/** Field keys on `TCollectionSlug` that are text fields. */
export type TextKeysOf<TCollectionSlug extends CollectionSlug> = FieldKeysOfType<
  TCollectionSlug,
  typeof ADMIN_FIELDS.relationship.type
>;

/**
 * Field keys on `TCollectionSlug` that are sortable in list views (text, number, date,
 * checkbox, select). Used by future `defaultSort` typing and the data-table
 * column registry.
 */
export type SortableKeysOf<TCollectionSlug extends CollectionSlug> = FieldKeysOfType<
  TCollectionSlug,
  TextFieldType | NumberFieldType | DateFieldType | CheckboxFieldType | SelectFieldType
>;

/**
 * Resolves a relationship field's target slug.
 *
 * Reads the *resolved* `RelationshipField.collection.slug` from the
 * `GeneratedVexTypes` document shape (the relationship field key on a doc
 * stores the target slug as part of its branded `Id<TargetSlug>` type).
 * Falls back to `CollectionSlug` if not resolvable.
 */
export type RelationshipTargetOf<
  TCollectionSlug extends CollectionSlug,
  TKey extends string,
> = TCollectionSlug extends keyof DocumentBySlug
  ? TKey extends keyof DocumentBySlug[TCollectionSlug]
    ? NonNullable<DocumentBySlug[TCollectionSlug][TKey]> extends ReadonlyArray<{
        __tableName: infer T;
      }>
      ? T extends CollectionSlug
        ? T
        : CollectionSlug
      : CollectionSlug
    : CollectionSlug
  : CollectionSlug;

/**
 * Recursive populate options, type-restricted to relationship field keys per
 * the augmented `CollectionsFieldTypeMap` registry.
 *
 * @typeParam TCollectionSlug - The collection slug to narrow relationship keys against.
 *   Defaults to the full `CollectionSlug` union for internal recursive use.
 */
export type PopulateShape<TCollectionSlug extends CollectionSlug = CollectionSlug> = {
  [K in RelationshipKeysOf<TCollectionSlug>]?:
    | true
    | {
        populate: PopulateShape<RelationshipTargetOf<TCollectionSlug, K>>;
      };
};

/**
 * Result type of a populated query — `Doc<TCollectionSlug>` with each key listed in
 * `TPopulate` replaced from `Id<TargetSlug>[]` to `Doc<TargetSlug>[]`.
 * Recurses if the populate value has a nested `populate` field (D12: unbounded
 * nesting).
 *
 * Keys not in `TPopulate` keep their original `Id[]` type. Non-relationship
 * keys are left untouched.
 */
export type Populated<
  TCollectionSlug extends CollectionSlug,
  TPopulate extends PopulateShape<TCollectionSlug>,
> = TCollectionSlug extends keyof DocumentBySlug
  ? {
      [K in keyof DocumentBySlug[TCollectionSlug]]: K extends keyof TPopulate
        ? K extends string
          ? RelationshipTargetOf<TCollectionSlug, K> extends infer Target
            ? Target extends CollectionSlug
              ? Target extends keyof DocumentBySlug
                ? // Recurse if nested populate is provided.
                  TPopulate[K] extends {
                    populate: infer NestedPopulate;
                  }
                  ? NestedPopulate extends PopulateShape<Target>
                    ? Populated<Target, NestedPopulate>[]
                    : DocumentBySlug[Target][]
                  : DocumentBySlug[Target][]
                : DocumentBySlug[TCollectionSlug][K]
              : DocumentBySlug[TCollectionSlug][K]
            : DocumentBySlug[TCollectionSlug][K]
          : DocumentBySlug[TCollectionSlug][K]
        : DocumentBySlug[TCollectionSlug][K];
    }
  : never;

/**
 * Pagination options for Convex queries.
 *
 * Re-exported from `convex/server` for convenience. This is the exact type
 * that Convex's `.paginate(opts)` API expects.
 *
 * @see https://docs.convex.dev/database/pagination
 */
export type PaginationOptions = ConvexPaginationOptions & {
  /**
   * Whether to include total document count in the response.
   *
   * Only runs on the first page (when cursor is null) to avoid wasteful re-counting.
   * Counts all documents matching the current filters/search query.
   *
   * Returns `null` if the count exceeds Convex transaction limits (>32k documents).
   *
   * @default false
   */
  totalDocs?: boolean;
};

/**
 * Pagination result from Convex query.
 *
 * Re-exported from `convex/server`. Returned by queries using `.paginate(opts)`.
 *
 * Includes:
 * - `page: T[]` — Current page of results
 * - `isDone: boolean` — Whether this is the last page
 * - `continueCursor: string` — Cursor to fetch next page
 * - `splitCursor?: string | null` — Cursor to split large pages (optional)
 * - `pageStatus?: "SplitRecommended" | "SplitRequired" | null` — Indicates when to split (optional)
 *
 * @see https://docs.convex.dev/database/pagination
 */
export type PaginationResult<T> = ConvexPaginationResult<T> & {
  totalDocs?: number | null;
};

/**
 * Client-side pagination state.
 * Tracks cursor stack for forward/backward navigation.
 */
export interface PaginationState {
  /** Current page number (1-based). */
  currentPage: number;
  /** Items per page. */
  pageSize: number;
  /** Stack of cursors for backward navigation. */
  cursorStack: (string | null)[];
  /** Current cursor (top of stack). */
  cursor: string | null;
  /** Whether there are more pages after current page. */
  hasNextPage: boolean;
  /** Whether there are previous pages. */
  hasPreviousPage: boolean;
  /** Total count of items (optional — requires separate count query). */
  totalCount?: number;
}

/**
 * Selection mode for data tables.
 */
export type SelectionMode =
  | "none" // No items selected
  | "page" // Items on current page selected
  | "all" // All items in table selected
  | "inverse"; // All items selected except explicitly deselected ones

/**
 * Selection state for bulk actions.
 */
export interface SelectionState {
  /** Set of selected document IDs. */
  selectedIds: Set<string>;
  /** Current selection mode. */
  mode: SelectionMode;
}

// ── RBAC enforcement seam ───────────────────────────────────────────────────
//
// Consumed by `queryApi` / `mutationApi` / `globalsApi` in `./server`. Kept here
// (not `./server`) because these describe the factories collectively, not one
// operation, and this file is barrel-exported from the package root.

/**
 * The resolved caller identity RBAC guards check against. Returned by a
 * user-supplied `getAuth` callback.
 *
 * @see {@link VexApiOptions} for where `getAuth` is configured.
 */
export type VexApiAuth = {
  /**
   * Passed as `hasPermission`'s `user` — shape is caller-defined. Must include
   * whatever field `access.userRolesField` names (a role string or string[])
   * for role resolution to succeed; a user object without it resolves to an
   * empty role list and denies every check.
   */
  user: Record<string, unknown> | null;
  /**
   * Passed as `hasPermission`'s `organization`. Shape is caller-defined; omit
   * when the access config has no `orgCollectionSlug`.
   */
  organization?: Record<string, unknown>;
};
```

#### packages/core/src/api/types.ts

Trimmed, not moved — stays at `src/api/types.ts` until Step 3 relocates it to `collections/api/types.ts`. 1 edit: the import header (original lines 1–26), and removal of every export now in `db/types.ts` (`Prettify`, `AccessCallOptions`, `QueryCallAction`, `MutationCallAction`, `CustomCallActionsFor`, `QueryCallActionFor`, `MutationCallActionFor`, `FieldKeysOfType`, `RelationshipKeysOf`, `TextKeysOf`, `SortableKeysOf`, `RelationshipTargetOf`, `PopulateShape`, `Populated`, `PaginationOptions`, `PaginationResult`, `PaginationState`, `SelectionMode`, `SelectionState`, `VexApiAuth` — original lines 34–99, 296–414, 640–745). What remains: `GenericQueryClientParams`, `GenericQueryServerParams`, `GenericMutationClientParams`, `GenericMutationServerParams`, `DepthPopulate`, `DepthPopulated`, `DocReturnItem`, `GetReturn`, `FindReturn`, `FindReturnPaginated`, `SearchReturn`, `SearchReturnPaginated`.

```ts
import type { GenericDataModel, GenericMutationCtx, GenericQueryCtx } from "convex/server";

import type { CollectionSlug, DocumentBySlug } from "../types/generated";
import { VexDocument } from "../documents/types";
import { VexConfig } from "../config";
import type {
  AccessCallOptions,
  MutationCallActionFor,
  Populated,
  PopulateShape,
  QueryCallActionFor,
  RelationshipKeysOf,
  RelationshipTargetOf,
  VexApiAuth,
} from "../db/types";
```

(was the original lines 1–26: `GenericDataModel`/`GenericMutationCtx`/`GenericQueryCtx`/`PaginationOptions as ConvexPaginationOptions`/`PaginationResult as ConvexPaginationResult` from `convex/server`; `ADMIN_FIELDS`/field-type literals/`AdminFieldType` from `../fields`; `CollectionsFieldTypeMap`/`CollectionSlug`/`CustomActionsBySlug`/`DocumentBySlug` from `../types/generated`; `VexDocument` from `./convex`; `VexConfig` from `../config`; `QueryAction`/`DraftAction`/`CrudAction` from `../access`.) `VexDocument` now comes from `../documents/types` per Step 1 (it is still a plain general document type there, now sharing that file with `VexVersionDocument`/`VexMediaDocument` per Step 1's updated decision 5, which does not change anything this file reads). The `../fields` import and the `QueryAction`/`DraftAction`/`CrudAction` import are dropped entirely — nothing left in this file uses them.

#### packages/core/src/db/test/

`git mv packages/core/src/api/test packages/core/src/db/test` (the convex-test fixture: `convex/schema.ts`, `convex/_generated/api.ts`). No content changes — every test file that references it (`db/{prepareEdit,populate,depth,queryArgs,triggers}.test.ts`, `db/documents.test.ts`) does so with the unchanged relative specifier `./test/convex/...`.

`.agent/docs/standards/testing/convex-integration-testing.md` — update its path references from `packages/core/src/api/test/` to `packages/core/src/db/test/`.

#### packages/core/src/db/index.ts

New file — barrel, re-exports only.

```ts
export * from "./context";
export * from "./documents";
export * from "./prepareEdit";
export * from "./populate";
export * from "./depth";
export * from "./queryArgs";
export * from "./triggers";
export * from "./types";
```

#### Importer repoints

Mechanical specifier changes only — every imported name stays the same. Files inside `api/` (`find/`, `get/`, `search/`, `create/`, `update/`, `remove/`, `globals/*`, `versions/*.server.ts`) are not relocated until Steps 3–5, but they import the now-moved modules directly and must be repointed now or `@vexcms/core` fails to typecheck; these are additional to the step-tasks bullet's example list (`versions/{publish,saveDraft,unpublish}.ts`, `media/api/*`, `livePreview/resolveUrl.server.ts`, `access/*`, `fields/*`), found by grepping every remaining `../utils` / `../types` / `../prepareEdit` / `../populate` / `../depth` / `../queryArgs` / `../../api/utils` / `../../api/types` reference under `api/`.

| File | Old specifier(s) | New specifier(s) |
|---|---|---|
| `access/evaluateQueryConstraint.ts` | `../api/queryArgs` (`validateWhereNode`) | `../db/queryArgs` |
| `access/validateAccessConfig.ts` | `../api/queryArgs` (`validateWhereNode`) | `../db/queryArgs` |
| `access/types.test.ts` | `../api/types` (`MutationCallActionFor`, `QueryCallActionFor`) | `../db/types` |
| `fields/baseTypes.ts` | `../api/server` (`VexCallbackApi`) | unchanged (entry moves in Step 7) |
| `fields/utils.ts` | `../api/server` (`createVexCallbackApi`, `VexCallbackApi`) | unchanged; `../api/convex` (`TDocument`) already repointed to `../documents/types` in Step 1 |
| `livePreview/resolveUrl.server.ts` | `../api/utils` (`toVexQueryCtx`); `../api/types` (`VexApiAuth`) | `../db/context`; `../db/types` |
| `livePreview/resolveUrl.server.test.ts` | `../api/test/convex/...` | `../db/test/convex/...` |
| `media/api/mutations.ts` | `../../api/utils` (`resolveAccessCall`, `resolveCollectionSlug`) | `../../access/resolveAccessCall`; `../../db/documents` |
| `media/api/queries.ts` | `../../api/utils` (`resolveAccessCall`, `resolveCollectionSlug`) | `../../access/resolveAccessCall`; `../../db/documents` |
| `media/api/server.ts` | `../../api/types` (`VexApiAuth`) | `../../db/types` |
| `media/api/types.ts` | `../../api/types` (`VexApiAuth`, …) | `../../db/types` |
| `versions/model.test.ts`, `versions/assertNoDraftRelationships.test.ts`, `versions/assertUniqueAmongPublished.test.ts` | `../api/test/convex/...` | `../db/test/convex/...` |
| `versions/publish.ts` | `../api/types` (`AccessCallOptions`, `VexApiAuth`); `../api/prepareEdit` | `../db/types`; `../db/prepareEdit` |
| `versions/saveDraft.ts` | `../api/types` (`AccessCallOptions`, `VexApiAuth`); `../api/prepareEdit` | `../db/types`; `../db/prepareEdit` |
| `versions/unpublish.ts` | `../api/types` (`AccessCallOptions`, `VexApiAuth`); `../api/utils` (`resolveAccessCall`) | `../db/types`; `../access/resolveAccessCall` |
| `api/create/server.ts` | `../utils` (`stampUpdatedAt`); `../prepareEdit` | `../../db/documents`; `../../db/prepareEdit` |
| `api/update/server.ts` | `../utils` (`stampUpdatedAt`); `../prepareEdit` | `../../db/documents`; `../../db/prepareEdit` |
| `api/find/server.ts` | `../depth`; `../populate`; `../queryArgs`; `../utils` (`readableDocuments`, `resolveReadCall`); `../types` | `../../db/depth`; `../../db/populate`; `../../db/queryArgs`; `../../db/documents` (`readableDocuments`) / `../../access/resolveReadCall`; `../../db/types` (for `PaginationOptions`, `PopulateShape`, `VexWhere`, `VexWithIndex` — the rest of the original `../types` import stays on `../types` until Step 3) |
| `api/get/server.ts` | `../depth`; `../populate`; `../types` (`PopulateShape`); `../utils` (`resolveReadCall`) | `../../db/depth`; `../../db/populate`; `../../db/types`; `../../access/resolveReadCall` |
| `api/search/server.ts` | `../depth`; `../populate`; `../queryArgs`; `../utils` (`readableDocuments`, `resolveAccessCall`); `../types` | `../../db/depth`; `../../db/populate`; `../../db/queryArgs`; `../../db/documents` (`readableDocuments`) / `../../access/resolveAccessCall`; `../../db/types` (for `PaginationOptions`, `PopulateShape`, `VexWhere`) |
| `api/remove/server.ts` | `../utils` (`resolveAccessCall`) | `../../access/resolveAccessCall` |
| `api/globals/find.server.ts` | `../utils` (`resolveAccessCall`) | `../../access/resolveAccessCall` |
| `api/globals/get.server.ts` | `../populate`; `../depth`; `../types` (`Prettify` — stays in `api/types.ts`, unchanged); `../utils` (`resolveAccessCall`) | `../../db/populate`; `../../db/depth`; unchanged; `../../access/resolveAccessCall` |
| `api/globals/upsert.server.ts` | `../prepareEdit` | `../../db/prepareEdit` |
| `api/globals/types.ts` | `../types` (`AccessCallOptions`, `MutationCallActionFor`, `QueryCallActionFor`, `VexApiAuth`) | `../../db/types` |
| `api/versions/history.server.ts` | `../types` (`AccessCallOptions`, `VexApiAuth`); `../utils` (`resolveAccessCall`) | `../../db/types`; `../../access/resolveAccessCall` |
| `api/versions/listVersions.server.ts`, `getVersionSnapshot.server.ts`, `deleteVersion.server.ts` | `../types` (`AccessCallOptions`, `VexApiAuth`) | `../../db/types` |
| `api/versions/publish.server.ts`, `saveDraft.server.ts`, `unpublish.server.ts` | `../types` (`AccessCallOptions`, `VexApiAuth`) | `../../db/types` |
| `api/versions/types.ts` | `../types` (`AccessCallOptions`, `MutationCallActionFor`, `VexApiAuth`) | `../../db/types` |
| `index.ts` | `./api/queryArgs` (`VexWhere`, `VexWhereNode`, `validateWhereNode`, `whereToNode`); `./api/types` (barrel `export *`) | `./db/queryArgs`; `./db/types` |

`fields/baseTypes.ts` and `fields/utils.ts`'s `../api/server` imports are unchanged here (the `./server` entry itself is untouched until Step 7) — listed because the step-tasks bullet names `fields/*` as an importer group and the only `fields/` files importing anything under `api/` are these two, whose only moved import (`TDocument` from `api/convex`) was already repointed in Step 1.

---

### Step 3 — `collections/api/` [agent]
Why: decision 1; collection operations live with the collection domain under `<op>/server.ts`.
Verify: `pnpm --filter @vexcms/core typecheck && pnpm --filter @vexcms/core test`

> Note: `FindServerArgs`, `GetServerArgs`, `SearchServerArgs`, `CreateServerArgs`,
> `UpdateServerArgs`, `RemoveServerArgs`, `PublishedSlugsServerArgs` are each already declared
> standalone in their own `server.ts` (none is imported by a sibling op today — confirmed by
> reading every op file's imports), so none of those move. `collections/api/types.ts` IS
> created, though — it is `api/types.ts` itself, `git mv`'d here (see the step's note), PLUS
> the collection arg types (`VexFindArgs`, `VexFindPaginatedArgs`, `VexGetArgs`,
> `VexSearchArgs`, `VexCreateArgs`, `VexUpdateArgs`, `VexRemoveArgs`) cut from `api/convex.ts`
> in this same step, per decision 5's per-domain split — collection-shaped API arg types
> belong with the collection domain's own `api/types.ts`, not in a document-shapes file. That
> file was trimmed in Step 2 down to exactly the twelve collection-specific types
> `find`/`get`/`search` extend or return (`GenericQueryClientParams`, `GenericQueryServerParams`,
> `GenericMutationClientParams`, `GenericMutationServerParams`, `DepthPopulate`,
> `DepthPopulated`, `DocReturnItem`, `GetReturn`, `FindReturn`, `FindReturnPaginated`,
> `SearchReturn`, `SearchReturnPaginated`) — Step 2's note explains why they could not join
> `db/types.ts`. The checkbox below is satisfied by the `git mv` landing that trimmed file at
> its new path (import-header fix from Step 2 already applied), plus the one content edit this
> step adds for the seven moved arg types.

> Note: every import rewrite below assumes Step 2 landed first — `prepareEdit`, `populate`,
> `depth`, `queryArgs`, `triggers` under `db/`; `toVexQueryCtx`/`toVexMutationCtx`/
> `stampUpdatedAt` in `db/context.ts`; `resolveCollectionSlug`/`readableDocuments` in
> `db/documents.ts`; `resolveAccessCall`/`resolveReadCall` in
> `access/resolveAccessCall.ts`/`access/resolveReadCall.ts`; cross-domain types
> (`VexApiAuth`, `PaginationResult`, `PopulateShape`, `AccessCallOptions`, `Prettify`,
> `QueryCallActionFor`) in `db/types.ts`; the twelve collection-specific types listed above
> in the relocated `collections/api/types.ts`. Step 1 lands `documents/types.ts` for
> `VexDocument`/`TDocument` only — `api/convex.ts` still holds the collection arg types moved
> out here. `resolveGetAuth` stays in `api/server.ts` until Step 7 moves it to `src/server.ts`
> — every file below that calls it imports from `api/server.ts` at the depth shown, and Step 7
> lists the one-line fix to each when the entry moves.

- [ ] `git mv` `api/{find,get,search,create,update,remove,publishedSlugs}/` → `collections/api/`
- [ ] `collections/api/types.ts` — `git mv` of the Step-2-trimmed `api/types.ts`, plus `VexFindArgs`/`VexFindPaginatedArgs`/`VexGetArgs`/`VexSearchArgs`/`VexCreateArgs`/`VexUpdateArgs`/`VexRemoveArgs` cut from `api/convex.ts`

```bash
git mv packages/core/src/api/find packages/core/src/collections/api/find
git mv packages/core/src/api/get packages/core/src/collections/api/get
git mv packages/core/src/api/search packages/core/src/collections/api/search
git mv packages/core/src/api/create packages/core/src/collections/api/create
git mv packages/core/src/api/update packages/core/src/collections/api/update
git mv packages/core/src/api/remove packages/core/src/collections/api/remove
git mv packages/core/src/api/publishedSlugs packages/core/src/collections/api/publishedSlugs
git mv packages/core/src/api/types.ts packages/core/src/collections/api/types.ts
```

Each `git mv` carries its `server.ts` and `server.test.ts` straight across (no filename
change — the `<op>/server.ts` scheme already matches). Only import paths change, and only
because the folder is now one level deeper (`collections/api/<op>/` vs. `api/<op>/`) plus the
Step 1/2 moves above. Every file's exported function/type/signature is untouched.

#### packages/core/src/collections/api/find/server.ts
1 edit — replace the import block (everything above the first JSDoc comment) with:
```ts
import type { GenericDataModel, GenericDocument, NamedTableInfo, QueryInitializer } from "convex/server";

import type { CollectionSlug } from "../../../types/generated";
import { buildDepthPopulate } from "../../../db/depth";
import { populateDocs } from "../../../db/populate";
import type {
  DocReturnItem,
  FindReturn,
  FindReturnPaginated,
  GenericQueryServerParams,
} from "../types";
import type { PaginationOptions, PaginationResult, PopulateShape } from "../../../db/types";
import {
  resolveQueryConstraint,
  resolveQueryIndex,
  SYSTEM_FIELD_KEYS,
} from "../../../access";
import { pickConvexQueryIndex } from "../../../access/pickConvexQueryIndex";
import type { ConvexQueryFilterFn, ConvexQueryIndex } from "../../../access/convexTypes";
import type { ConstraintResult } from "../../../access/queryConstraintTypes";
import {
  andConvexQueryFilters,
  referencedWhereFields,
  whereFieldNames,
  whereToConvexQueryFilter,
  withIndexToConvexQueryIndex,
  type VexWhere,
  type VexWithIndex,
} from "../../../db/queryArgs";
import { readableDocuments } from "../../../db/documents";
import { resolveReadCall } from "../../../access/resolveReadCall";
import { composeStatusQueryConstraint } from "../../../versions";
```
Every other line of `find/server.ts` (the `FindServerArgs` interface and the `find` function
body) is unchanged — the same identifiers, called the same way.

#### packages/core/src/collections/api/get/server.ts
1 edit — replace the import block with:
```ts
import type { GenericDataModel } from "convex/server";
import type { GenericId } from "convex/values";

import type { CollectionSlug } from "../../../types/generated";
import { buildDepthPopulate } from "../../../db/depth";
import { populateDocs } from "../../../db/populate";
import type { GenericQueryServerParams, GetReturn } from "../types";
import type { PopulateShape } from "../../../db/types";
import { hasPermission, resolveFieldPermissions, stripDeniedFields } from "../../../access";
import { resolveReadCall } from "../../../access/resolveReadCall";
import { requiresPublishedOnly, VERSION_STATUSES } from "../../../versions";
```

#### packages/core/src/collections/api/search/server.ts
1 edit — replace the import block with:
```ts
import type {
  DocumentByInfo,
  GenericDataModel,
  NamedTableInfo,
  QueryInitializer,
} from "convex/server";

import type { CollectionSlug } from "../../../types/generated";
import { buildDepthPopulate } from "../../../db/depth";
import { populateDocs } from "../../../db/populate";
import type {
  DocReturnItem,
  GenericQueryServerParams,
  SearchReturn,
  SearchReturnPaginated,
} from "../types";
import type { PaginationOptions, PaginationResult, PopulateShape } from "../../../db/types";
import {
  CRUD_ACTIONS,
  DRAFT_ACTIONS,
  resolveQueryConstraint,
  SYSTEM_FIELD_KEYS,
} from "../../../access";
import type { ConvexQueryFilterFn } from "../../../access/convexTypes";
import {
  andConvexQueryFilters,
  // … the same named imports `search/server.ts` already pulls from `queryArgs`
} from "../../../db/queryArgs";
```
The elided names on the last import are whatever `search/server.ts` currently destructures
from `../queryArgs` (unchanged set, only the source path moves from `../queryArgs` to
`../../../db/queryArgs`).

#### packages/core/src/collections/api/create/server.ts
1 edit — replace the import block with:
```ts
import type {
  BetterOmit,
  DocumentByName,
  Expand,
  GenericDataModel,
  TableNamesInDataModel,
} from "convex/server";
import { ConvexError } from "convex/values";

import type { CollectionSlug } from "../../../types/generated";
import type { GenericMutationServerParams } from "../types";
import { CRUD_ACTIONS, DRAFT_ACTIONS, hasPermission } from "../../../access";
import { stampUpdatedAt } from "../../../db/context";
import { createVersion, removeVexFields, VERSION_STATUSES } from "../../../versions";
import { prepareEdit } from "../../../db/prepareEdit";
```

#### packages/core/src/collections/api/update/server.ts
1 edit — replace the import block with:
```ts
import type {
  BetterOmit,
  DocumentByName,
  Expand,
  GenericDataModel,
  TableNamesInDataModel,
} from "convex/server";
import { ConvexError, type GenericId } from "convex/values";

import type { CollectionSlug } from "../../../types/generated";
import type { GenericMutationServerParams } from "../types";
import { CRUD_ACTIONS } from "../../../access";
import { prepareEdit } from "../../../db/prepareEdit";
import { stampUpdatedAt } from "../../../db/context";
import { TDocument } from "../../../documents/types";
import { createVersion, removeVexFields, VERSION_STATUSES } from "../../../versions";
```

#### packages/core/src/collections/api/remove/server.ts
1 edit — replace the import block with:
```ts
import type { DocumentByName, GenericDataModel, GenericMutationCtx } from "convex/server";
import { ConvexError, type GenericId } from "convex/values";

import type { CollectionSlug } from "../../../types/generated";
import type { GenericMutationServerParams } from "../types";
import { CRUD_ACTIONS, hasPermission } from "../../../access";
import { resolveAccessCall } from "../../../access/resolveAccessCall";
import { findDraftRow, listVersions } from "../../../versions/model";
```

#### packages/core/src/collections/api/publishedSlugs/server.ts
1 edit — replace the import block with:
```ts
import type { GenericDataModel, GenericQueryCtx } from "convex/server";

import type { CollectionSlug } from "../../../types/generated";
import { find } from "../find/server";
import type { AccessCallOptions, QueryCallActionFor } from "../../../db/types";
```

Each moved `server.test.ts` gets the identical import-path treatment (same source-path
remap, same `+1` relative depth) for whatever it imports from `../types`/`../utils`/`../../access`/
`../queryArgs`/`../../versions` — the assertions, fixtures and expected values are untouched.

- [ ] `collections/api/collectionsApi.ts` — `collectionsApi` moved out of `api/server.ts:408`

#### packages/core/src/collections/api/collectionsApi.ts
New file — `collectionsApi` moved verbatim out of `api/server.ts` (previously lines
335–596: the JSDoc block at `:335` plus the function at `:408`). Logic, arg validators and
return shape are byte-identical; only the import sources change (one directory shallower
than the final `api/server.ts` was, since this file sits at `collections/api/`, and
`resolveGetAuth` still resolves from `api/server.ts` until Step 7 relocates it).

```ts
import {
  paginationOptsValidator,
  type MutationBuilder,
  type FunctionVisibility,
  type GenericDataModel,
  type QueryBuilder,
  GenericQueryCtx,
  GenericMutationCtx,
} from "convex/server";
import { GenericId, v } from "convex/values";
import type { VexConfig } from "../../config";
import type { CollectionSlug, VexDataModel } from "../../types/generated";
import type { VexApiAuth } from "../../db/types";
import { resolveLivePreviewUrlOnServer } from "../../livePreview/resolveUrl.server";
import { resolveGetAuth } from "../../api/server";
import { find } from "./find/server";
import { get } from "./get/server";
import { search } from "./search/server";
import { create } from "./create/server";
import { update } from "./update/server";
import { remove } from "./remove/server";

/**
 * Registers the full collection CRUD surface — `find`, `get`, `search`,
 * `create`, `update`, `remove` — as Convex endpoints, with RBAC enforcement
 * resolved entirely on the server.
 *
 * All query/mutation logic lives in the imported server functions; this
 * factory only provides the arg validators, the `query()`/`mutation()`
 * wrappers Convex needs at the network boundary, and the auth seam.
 *
 * Identity never crosses the wire as an argument — see `resolveGetAuth` for
 * the auth-resolution contract this factory runs before every operation.
 *
 * @typeParam DataModel - The project's generated Convex data model.
 * @typeParam Visibility - Function visibility of the supplied builders;
 *   defaults to `"public"`.
 * @param props - Factory configuration.
 * @param props.config - The resolved `VexConfig`; `config.access` (when set)
 *   is the permission matrix every operation enforces.
 * @param props.query - The project's Convex `query` builder.
 * @param props.mutation - The project's Convex `mutation` builder.
 * @param props.getAuth - Server-side resolver for the current caller.
 * @returns Registered `find` / `get` / `search` queries and
 *   `create` / `update` / `remove` mutations for `convex/vex.ts` to re-export.
 *
 * @see {@link hasPermission} for resolution semantics (roles, wildcards, field maps)
 * @see {@link VexApiAuth} for the resolved caller shape
 */
export function collectionsApi<
  DataModel extends GenericDataModel,
  Visibility extends FunctionVisibility = "public",
>({
  config,
  query,
  mutation,
  getAuth,
}: {
  config: VexConfig;
  query: QueryBuilder<DataModel, Visibility>;
  mutation: MutationBuilder<DataModel, Visibility>;
  getAuth?: (
    ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>,
  ) => Promise<VexApiAuth | undefined>;
}) {
  return {
    /**
     * Resolves a `{ server }` preview URL with a real `ctx`. Registered here
     * rather than generated per collection: the slug is a runtime argument,
     * exactly as it is for `find`/`get`.
     */
    livePreviewUrl: query({
      args: {
        collection: v.string(),
        kind: v.optional(v.union(v.literal("collection"), v.literal("global"))),
        documentId: v.optional(v.string()),
        values: v.optional(v.any()),
      },
      handler: async (ctx, args) => {
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        return await resolveLivePreviewUrlOnServer({
          ctx,
          config,
          auth,
          kind: args.kind ?? "collection",
          slug: args.collection,
          documentId: args.documentId,
          values: (args.values ?? {}) as Record<string, unknown>,
        });
      },
    }),
    find: query({
      args: {
        collection: v.string(),
        populate: v.optional(v.any()),
        depth: v.optional(v.number()),
        limit: v.optional(v.number()),
        drafts: v.optional(v.boolean()),
        where: v.optional(v.any()),
        paginationOpts: v.optional(
          paginationOptsValidator.extend({ totalDocs: v.optional(v.boolean()) }),
        ),
      },
      handler: async (ctx, args) => {
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        return await find({
          ctx,
          auth,
          collection: args.collection as CollectionSlug,
          populate: args.populate,
          depth: args.depth,
          config,
          limit: args.limit,
          drafts: args.drafts,
          where: args.where,
          paginationOpts: args.paginationOpts as never,
        });
      },
    }),

    get: query({
      args: {
        collection: v.string(),
        id: v.string(),
        populate: v.optional(v.any()),
        depth: v.optional(v.number()),
        drafts: v.optional(v.boolean()),
      },
      handler: async (ctx, args) => {
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        return await get({
          auth,
          ctx,
          collection: args.collection as CollectionSlug,
          id: args.id as GenericId<CollectionSlug>,
          populate: args.populate,
          depth: args.depth,
          drafts: args.drafts,
          config,
        });
      },
    }),

    search: query({
      args: {
        collection: v.string(),
        searchIndexName: v.string(),
        searchField: v.string(),
        query: v.string(),
        limit: v.optional(v.number()),
        populate: v.optional(v.any()),
        depth: v.optional(v.number()),
        drafts: v.optional(v.boolean()),
        where: v.optional(v.any()),
        paginationOpts: v.optional(
          paginationOptsValidator.extend({ totalDocs: v.optional(v.boolean()) }),
        ),
      },
      handler: async (ctx, args) => {
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        return search({
          auth,
          ctx,
          collection: args.collection as CollectionSlug,
          query: args.query,
          searchIndexName: args.searchIndexName,
          searchField: args.searchField,
          limit: args.limit,
          populate: args.populate,
          depth: args.depth,
          drafts: args.drafts,
          where: args.where,
          paginationOpts: args.paginationOpts as never,
          config,
        });
      },
    }),

    // MUTATIONS
    create: mutation({
      args: {
        collection: v.string(),
        data: v.any(),
      },
      returns: v.string(),
      handler: async (ctx, args) => {
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        return await create({
          auth,
          ctx,
          config,
          collection: args.collection as CollectionSlug,
          data: args.data,
        });
      },
    }),

    update: mutation({
      args: {
        id: v.string(),
        collection: v.string(),
        data: v.any(),
      },
      handler: async (ctx, args) => {
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        return update({
          auth,
          ctx,
          config,
          collection: args.collection as CollectionSlug,
          id: args.id as GenericId<CollectionSlug>,
          data: args.data,
        });
      },
    }),

    remove: mutation({
      args: {
        collection: v.string(),
        ids: v.array(v.string()),
        softDelete: v.optional(v.string()),
      },
      handler: async (ctx, args) => {
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        return remove({
          auth,
          collection: args.collection as CollectionSlug,
          ctx,
          config,
          ids: args.ids as GenericId<CollectionSlug>[],
          softDelete: args.softDelete,
        });
      },
    }),
  };
}
```
`VexDataModel` is imported above for parity with the rest of core's domain `api/` modules
(unused directly in this file's signature — `DataModel` is the generic parameter) and MAY be
dropped if `tsc --noEmit` flags it unused; keep only if a lint rule requires the import
symmetry other domain `api/` barrels use. If `tsc` flags it, drop the import — this file has
no reference to the bare `VexDataModel` type.

`collections/api/types.ts` is the `git mv`'d, Step-2-trimmed `api/types.ts` — `FindServerArgs`,
`GetServerArgs`, … each stay standalone in their own `server.ts`, unchanged — PLUS the seven
collection-shaped arg types cut from `api/convex.ts` (original lines 110–186, including their
doc comments), appended to the file. These need `PaginationOptions` added to the existing
`db/types` import, and a new `VexWhereNodeOf` import:

```ts
import type { AccessCallOptions, MutationCallActionFor, Populated, PopulateShape, QueryCallActionFor, RelationshipKeysOf, RelationshipTargetOf, PaginationOptions, VexApiAuth } from "../../db/types";
import type { VexWhereNodeOf } from "../../access/queryConstraintTypes";
```
(was `import type { AccessCallOptions, MutationCallActionFor, Populated, PopulateShape, QueryCallActionFor, RelationshipKeysOf, RelationshipTargetOf, VexApiAuth } from "../../db/types";` — `PaginationOptions` joins that list; `VexWhereNodeOf` is new, at the `../../access/` depth this file now sits two directories under `src/`.)

```ts
/** Args for `api.vex.find`. */
export interface VexFindArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  collection: CollectionSlug;
  populate?: unknown;
  depth?: number;
  limit?: number;
  paginationOpts?: PaginationOptions;
  drafts?: boolean;
  where?: VexWhereNodeOf<unknown>;
}

/** Args for `api.vex.find`. */
export interface VexFindPaginatedArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  collection: CollectionSlug;
  populate?: unknown;
  depth?: number;
  limit?: number;
  paginationOpts: PaginationOptions;
  where?: VexWhereNodeOf<unknown>;
}

/** Args for `api.vex.get`. */
export interface VexGetArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  collection: string;
  id: string;
  populate?: unknown;
  depth?: number;
  drafts?: boolean;
}

/** Args for `api.vex.search`. */
export interface VexSearchArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  collection: string;
  searchIndexName: string;
  searchField: string;
  query: string;
  limit?: number;
  populate?: unknown;
  depth?: number;
  paginationOpts?: PaginationOptions;
  drafts?: boolean;
  where?: VexWhereNodeOf<unknown>;
}

/** Args for `api.vex.create`. */
export interface VexCreateArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  collection: string;
  data: Record<string, unknown>;
}

/** Args for `api.vex.update`. */
export interface VexUpdateArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  collection: string;
  id: string;
  data: Record<string, unknown>;
}

/** Args for `api.vex.remove`. */
export interface VexRemoveArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  collection: string;
  ids: string[];
  softDelete?: string;
}
```

#### packages/core/src/api/convex.ts (Step 3's trim)
1 edit — the seven collection arg types above (original lines 110–186, the "Collection API
types" section) are cut; nothing replaces them in this file. The next section comment
("Media API shallow types") now follows directly after the import header's unchanged
remainder.

- [ ] `collections/api/index.ts` barrel

#### packages/core/src/collections/api/index.ts
New file:
```ts
export { find } from "./find/server";
export type { FindServerArgs } from "./find/server";

export { get } from "./get/server";
export type { GetServerArgs } from "./get/server";

export { search } from "./search/server";
export type { SearchServerArgs } from "./search/server";

export { publishedSlugs } from "./publishedSlugs/server";
export type { PublishedSlug, PublishedSlugsServerArgs } from "./publishedSlugs/server";

export { create } from "./create/server";
export type { CreateServerArgs } from "./create/server";

export { update } from "./update/server";
export type { UpdateServerArgs } from "./update/server";

export { remove } from "./remove/server";
export type { RemoveServerArgs } from "./remove/server";

export * from "./types";

export { collectionsApi } from "./collectionsApi";
```
This barrel becomes the single surface `src/server.ts` imports collection operations and
`collectionsApi` from in Step 7 — no other file imports a `collections/api/<op>/server.ts`
path directly except `publishedSlugs/server.ts` (which imports `find` from its sibling, and
keeps doing so by relative path, not through this barrel, to avoid a self-import cycle).

---

### Step 4 — `globals/api/` [agent]
Why: decision 1; globals ops converted from `<op>.server.ts` to `<op>/server.ts`; decision 5 moves the `VexGlobals*` arg types here from `api/convex.ts`.
Verify: `pnpm --filter @vexcms/core typecheck && pnpm --filter @vexcms/core test`

- [ ] `api/globals/{find,get,upsert}.server.ts` (+ tests) → `globals/api/{find,get,upsert}/server.ts`

```bash
mkdir -p packages/core/src/globals/api/find packages/core/src/globals/api/get packages/core/src/globals/api/upsert
git mv packages/core/src/api/globals/find.server.ts packages/core/src/globals/api/find/server.ts
git mv packages/core/src/api/globals/find.server.test.ts packages/core/src/globals/api/find/server.test.ts
git mv packages/core/src/api/globals/get.server.ts packages/core/src/globals/api/get/server.ts
git mv packages/core/src/api/globals/get.server.test.ts packages/core/src/globals/api/get/server.test.ts
git mv packages/core/src/api/globals/upsert.server.ts packages/core/src/globals/api/upsert/server.ts
git mv packages/core/src/api/globals/upsert.server.test.ts packages/core/src/globals/api/upsert/server.test.ts
```

#### packages/core/src/globals/api/find/server.ts
1 edit — replace the import block with:
```ts
import type { GenericDataModel } from "convex/server";
import type { VexDocumentGlobal } from "../../../types/generated";
import { CRUD_ACTIONS, hasPermission, resolveFieldPermissions, stripDeniedFields } from "../../../access";
import type { GenericGlobalsQueryServerArgs } from "../types";
import { resolveAccessCall } from "../../../access/resolveAccessCall";
import { flattenGlobalRow } from "../utils";
```
`./types` and `./utils` (the files moved in this same step, see below) now sit one directory
up from `find/server.ts` — `../types`, `../utils`.

#### packages/core/src/globals/api/get/server.ts
1 edit — replace the import block with:
```ts
import type { GenericDataModel } from "convex/server";

import type {
  GlobalSlug,
  GlobalDocumentBySlug,
  GlobalPopulateShape,
  GlobalPopulated,
  VexDocumentGlobal,
} from "../../../types/generated";
import { populateDocs } from "../../../db/populate";
import { buildDepthPopulate } from "../../../db/depth";
import type { Prettify } from "../../../db/types";
import {
  CRUD_ACTIONS,
  DRAFT_ACTIONS,
  hasPermission,
  resolveFieldPermissions,
  stripDeniedFields,
} from "../../../access";
import { GenericGlobalsQueryServerArgs } from "../types";
import { resolveAccessCall } from "../../../access/resolveAccessCall";
import { flattenGlobalRow } from "../utils";
import { VERSION_STATUSES } from "../../../versions";
```

#### packages/core/src/globals/api/upsert/server.ts
1 edit — replace the import block with:
```ts
import { ConvexError } from "convex/values";
import type { GenericDataModel } from "convex/server";

import type { GlobalSlug, CollectionSlug } from "../../../types/generated";
import { CRUD_ACTIONS } from "../../../access";
import { GenericGlobalsMutationServerArgs } from "../types";
import { prepareEdit } from "../../../db/prepareEdit";
import { createVersion } from "../../../versions/model";
import { VERSION_STATUSES } from "../../../versions";
```

- [ ] `api/globals/{types,utils}.ts` → `globals/api/`; `VexGlobalsGetArgs`/`VexGlobalsFindArgs`/`VexGlobalsUpdateArgs` cut from `api/convex.ts` appended to `globals/api/types.ts`

```bash
git mv packages/core/src/api/globals/types.ts packages/core/src/globals/api/types.ts
git mv packages/core/src/api/globals/utils.ts packages/core/src/globals/api/utils.ts
```

#### packages/core/src/globals/api/types.ts
2 edits.

**1 — imports.** Replace the import block with:
```ts
import { GenericDataModel, GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { VexConfig } from "../../config";
import { AccessCallOptions, MutationCallActionFor, QueryCallActionFor, VexApiAuth } from "../../db/types";
import { GlobalSlug } from "../../types";
```

**2 — new types.** Append at the end of the file, cut verbatim from `api/convex.ts` (original
lines 253–274, "Globals API shallow types"), with their doc comments:
```ts
/** Args for `api.vex.globals.get`. */
export interface VexGlobalsGetArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  slug: string;
  populate?: Record<string, unknown>;
  drafts?: boolean;
}

/** Args for `api.vex.globals.find`. */
export interface VexGlobalsFindArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
}

/** Args for `api.vex.globals.update`. */
export interface VexGlobalsUpdateArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  slug: string;
  data: Record<string, unknown>;
}
```
`utils.ts` (`flattenGlobalRow`) has no cross-`api/`/`db/` imports to update — it only touches
its own `Record<string, unknown>` argument — so it moves with zero content changes beyond the
`git mv`.

#### packages/core/src/api/convex.ts (Step 4's trim)
1 edit — the three globals arg types above (original lines 253–274, the "Globals API shallow
types" section) are cut; nothing replaces them in this file.

- [ ] `globals/api/globalsApi.ts` — from `api/server.ts:626`; `globals/api/index.ts`

#### packages/core/src/globals/api/globalsApi.ts
New file — `globalsApi` moved verbatim out of `api/server.ts` (JSDoc at `:598`, function at
`:626`). `VexGlobalsGetArgs` was imported from `./convex` (`api/convex.ts`) in the original;
it is now a sibling in `globals/api/types.ts` (Step 4), so this file reads it from `../types`
rather than `documents/types` — globals-shaped args never belonged in the document-shapes
module in the first place.

```ts
import {
  type MutationBuilder,
  type FunctionVisibility,
  type GenericDataModel,
  type QueryBuilder,
  GenericQueryCtx,
  GenericMutationCtx,
  RegisteredQuery,
} from "convex/server";
import { v } from "convex/values";
import type { VexConfig } from "../../config";
import type { GlobalSlug, VexDocumentGlobal } from "../../types/generated";
import type { VexApiAuth } from "../../db/types";
import { VexGlobalsGetArgs } from "../types";
import { resolveGetAuth } from "../../api/server";
import { getGlobal } from "./get/server";
import { findGlobals } from "./find/server";
import { upsertGlobal } from "./upsert/server";

/**
 * Registers `globals.get`, `globals.find`, and `globals.upsert` as Convex
 * query and mutation endpoints under `api.vex.globals.*`.
 *
 * Call once in `convex/vex.ts` alongside the collection and version APIs.
 *
 * @typeParam DataModel - The project's generated Convex data model.
 * @typeParam Visibility - Function visibility of the supplied builders;
 *   defaults to `"public"`.
 * @param props - Factory configuration, identical contract to `collectionsApi`'s.
 * @returns Registered `get` / `find` queries and `upsert` mutation.
 */
export function globalsApi<
  DataModel extends GenericDataModel,
  Visibility extends FunctionVisibility = "public",
>({
  config,
  query,
  mutation,
  getAuth,
}: {
  config: VexConfig;
  query: QueryBuilder<DataModel, Visibility>;
  mutation: MutationBuilder<DataModel, Visibility>;
  getAuth?: (
    ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>,
  ) => Promise<VexApiAuth | undefined>;
}) {
  return {
    get: query({
      args: {
        slug: v.string(),
        populate: v.optional(v.any()),
        drafts: v.optional(v.boolean()),
      },
      handler: async (ctx, args) => {
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        return await getGlobal({
          auth,
          ctx,
          slug: args.slug as GlobalSlug,
          populate: args.populate,
          drafts: args.drafts,
          config,
        });
      },
    }) as RegisteredQuery<Visibility, VexGlobalsGetArgs, VexDocumentGlobal | null>,

    find: query({
      args: {},
      handler: async (ctx) => {
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        return await findGlobals({ auth, ctx, config });
      },
    }),

    upsert: mutation({
      args: {
        slug: v.string(),
        data: v.any(),
      },
      returns: v.string(),
      handler: async (ctx, args) => {
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        return await upsertGlobal({
          auth,
          ctx,
          config,
          slug: args.slug as GlobalSlug,
          data: args.data as Record<string, unknown>,
        });
      },
    }),
  };
}
```

#### packages/core/src/globals/api/index.ts
New file:
```ts
export { getGlobal } from "./get/server";
export type { GetGlobalServerArgs, GetGlobalReturn } from "./get/server";

export { findGlobals } from "./find/server";

export { upsertGlobal } from "./upsert/server";
export type { UpsertGlobalServerArgs } from "./upsert/server";

export { globalsApi } from "./globalsApi";
```

---

### Step 5 — `versions/api/` [agent]
Why: decisions 1 + 3 + 5; dispatchers beside the domain write logic they call, and the
`VexSaveDraft*`/`VexPublish*`/`VexUnpublish*`/`VexListVersions*`/`VexGetVersionSnapshot*`/
`VexDeleteVersion*` arg types land in this domain's own `api/types.ts` instead of
`api/convex.ts`.
Verify: `pnpm --filter @vexcms/core typecheck && pnpm --filter @vexcms/core test`

> Note: `api/versions/types.ts` (`GenericVersionsMutationServerArgs`, `VersionsDataInput`) is
> unused — grepped across `packages/core/src` and found imported nowhere, including by the
> `saveDraft`/`publish`/`unpublish`/`listVersions`/`getVersionSnapshot`/`deleteVersion`
> dispatchers it was presumably meant to back (each declares its own standalone
> `XServerArgs` discriminated-union type instead). The task still moves it (below) rather
> than silently dropping it, since deleting unused-but-exported public-shaped types is a
> design decision, not a file-move decision — flagging it for the developer to decide
> delete-vs-keep in pass 2 (or now, if the developer calls it here).

- [ ] `api/versions/<op>.server.ts` (+ tests) → `versions/api/<op>/server.ts` for `saveDraft`, `publish`, `unpublish`, `listVersions`, `getVersionSnapshot`, `deleteVersion`, `backfillStatus`, `history`

```bash
for op in saveDraft publish unpublish listVersions getVersionSnapshot deleteVersion backfillStatus history; do
  mkdir -p packages/core/src/versions/api/$op
  git mv packages/core/src/api/versions/$op.server.ts packages/core/src/versions/api/$op/server.ts
  git mv packages/core/src/api/versions/$op.server.test.ts packages/core/src/versions/api/$op/server.test.ts
done
```
(`history.server.test.ts` is 0 bytes today — the `git mv` still applies; there is nothing to
edit inside an empty file.)

#### packages/core/src/versions/api/saveDraft/server.ts
1 edit — replace the import block with:
```ts
import { ConvexError, type GenericId } from "convex/values";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";

import type { CollectionSlug, GlobalSlug } from "../../../types/generated";
import type { VexConfig } from "../../../config";
import type { AccessCallOptions, VexApiAuth } from "../../../db/types";
import type { CollectionOrGlobal } from "../../../types/utils";
import { resolveVersionedTarget } from "../../resolveVersionedTarget";
import { saveDraftShared } from "../../saveDraft";
```

#### packages/core/src/versions/api/publish/server.ts
1 edit — replace the import block with:
```ts
import { ConvexError, type GenericId } from "convex/values";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";

import type { CollectionSlug, GlobalSlug } from "../../../types/generated";
import type { VexConfig } from "../../../config";
import type { AccessCallOptions, VexApiAuth } from "../../../db/types";
import type { CollectionOrGlobal } from "../../../types/utils";
import { resolveVersionedTarget } from "../../resolveVersionedTarget";
import { publishShared } from "../../publish";
import { removeVexFields } from "../../removeVexFields";
```

#### packages/core/src/versions/api/unpublish/server.ts
1 edit — replace the import block with:
```ts
import { ConvexError, type GenericId } from "convex/values";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";

import type { CollectionSlug, GlobalSlug } from "../../../types/generated";
import type { VexConfig } from "../../../config";
import type { AccessCallOptions, VexApiAuth } from "../../../db/types";
import type { CollectionOrGlobal } from "../../../types/utils";
import { resolveVersionedTarget } from "../../resolveVersionedTarget";
import { unpublishShared } from "../../unpublish";
```

#### packages/core/src/versions/api/history/server.ts
1 edit — replace the import block with:
```ts
import { ConvexError, type GenericId } from "convex/values";
import type { GenericDataModel, GenericMutationCtx, GenericQueryCtx } from "convex/server";

import type { CollectionSlug, GlobalSlug } from "../../../types/generated";
import type { VexConfig } from "../../../config";
import type { AccessCallOptions, VexApiAuth } from "../../../db/types";
import { DRAFT_ACTIONS, hasPermission } from "../../../access";
import { resolveAccessCall } from "../../../access/resolveAccessCall";
import {
  resolveVersionedTarget,
  type VersionedTargetRows,
} from "../../resolveVersionedTarget";
```
`history/server.ts` exports `resolveHistoryTarget`, `assertVersionsAccess` and the
`VersionsTarget`/`VersionedHistoryTarget` types unchanged — `listVersions`, `getVersionSnapshot`
and `deleteVersion` (below) now reach them via the sibling-folder path `../history/server`
instead of `./history.server`.

#### packages/core/src/versions/api/listVersions/server.ts
1 edit — replace the import block with:
```ts
import type { GenericDataModel, GenericQueryCtx } from "convex/server";
import type { GenericId } from "convex/values";

import type { CollectionSlug, GlobalSlug } from "../../../types/generated";
import type { VexConfig } from "../../../config";
import type { AccessCallOptions, VexApiAuth } from "../../../db/types";
import { DRAFT_ACTIONS } from "../../../access";
import { listVersions as listVersionRows } from "../../model";
import { assertVersionsAccess, resolveHistoryTarget } from "../history/server";
import { type VersionSummary } from "../../../versions";
```

#### packages/core/src/versions/api/getVersionSnapshot/server.ts
1 edit — replace the import block with:
```ts
import type { GenericDataModel, GenericQueryCtx } from "convex/server";
import { ConvexError, type GenericId } from "convex/values";

import type { CollectionSlug, GlobalSlug } from "../../../types/generated";
import type { VexConfig } from "../../../config";
import type { AccessCallOptions, VexApiAuth } from "../../../db/types";
import { DRAFT_ACTIONS } from "../../../access";
import { getVersion } from "../../model";
import { assertVersionsAccess, resolveHistoryTarget } from "../history/server";
```

#### packages/core/src/versions/api/deleteVersion/server.ts
1 edit — replace the import block with:
```ts
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { ConvexError, type GenericId } from "convex/values";

import type { CollectionSlug, GlobalSlug } from "../../../types/generated";
import type { VexConfig } from "../../../config";
import type { AccessCallOptions, VexApiAuth } from "../../../db/types";
import { DRAFT_ACTIONS } from "../../../access";
import { getVersion } from "../../model";
import { assertVersionsAccess, resolveHistoryTarget } from "../history/server";
```

#### packages/core/src/versions/api/backfillStatus/server.ts
1 edit — replace the import block with:
```ts
import type {
  GenericDatabaseWriter,
  GenericDataModel,
  GenericMutationCtx,
  PaginationOptions,
} from "convex/server";
import { ConvexError, type GenericId } from "convex/values";

import type { CollectionSlug } from "../../../types/generated";
import type { VexConfig } from "../../../config";
import type { VexVersionStatus } from "../../../versions";
```

- [ ] `api/versions/types.ts` → `versions/api/types.ts`, plus `VexSaveDraftArgs`/`VexPublishArgs`/`VexUnpublishArgs`/`VexListVersionsArgs`/`VexGetVersionSnapshotArgs`/`VexDeleteVersionArgs` cut from `api/convex.ts`

```bash
git mv packages/core/src/api/versions/types.ts packages/core/src/versions/api/types.ts
```

#### packages/core/src/versions/api/types.ts
2 edits.

**1 — imports.** Replace the import block with:
```ts
import type {
  BetterOmit,
  DocumentByName,
  Expand,
  GenericDataModel,
  GenericMutationCtx,
  TableNamesInDataModel,
} from "convex/server";

import type { CollectionSlug } from "../../types/generated";
import type { VexConfig } from "../../config";
import type { AccessCallOptions, MutationCallActionFor, VexApiAuth } from "../../db/types";
```

**2 — new types.** Append at the end of the file, cut verbatim from `api/convex.ts` (original
lines 280–382, "Versions API shallow types"), with their doc comments:
```ts
/** Args for `api.vex.versions.saveDraft`. */
export type VexSaveDraftArgs = {
  [key: string]: unknown;
  auth?: VexApiAuth;
  data: Record<string, unknown>;
  restoredFrom?: number;
  environmentId?: string;
} & (
  | { collection: CollectionSlug; id: string }
  | {
      global: string;
    }
);

/** Args for `api.vex.versions.publish`. */
export type VexPublishArgs =
  | {
      [key: string]: unknown;
      auth?: VexApiAuth;
      collection: string;
      id: string;
      data?: Record<string, unknown>;
      version?: number;
      environmentId?: string;
    }
  | {
      [key: string]: unknown;
      auth?: VexApiAuth;
      global: string;
      data?: Record<string, unknown>;
      version?: number;
      environmentId?: string;
    };

/** Args for `api.vex.versions.unpublish`. */
export type VexUnpublishArgs =
  | {
      [key: string]: unknown;
      auth?: VexApiAuth;
      collection: string;
      id: string;
      environmentId?: string;
    }
  | {
      [key: string]: unknown;
      auth?: VexApiAuth;
      global: string;
      environmentId?: string;
    };

/** Args for `api.vex.versions.listVersions`. */
export type VexListVersionsArgs =
  | {
      [key: string]: unknown;
      auth?: VexApiAuth;
      collection: string;
      id: string;
      limit?: number;
      environmentId?: string;
    }
  | {
      [key: string]: unknown;
      auth?: VexApiAuth;
      global: string;
      limit?: number;
      environmentId?: string;
    };

/** Args for `api.vex.versions.getVersionSnapshot`. */
export type VexGetVersionSnapshotArgs =
  | {
      [key: string]: unknown;
      auth?: VexApiAuth;
      collection: string;
      id: string;
      version: number;
      environmentId?: string;
    }
  | {
      [key: string]: unknown;
      auth?: VexApiAuth;
      global: string;
      version: number;
      environmentId?: string;
    };

/** Args for `api.vex.versions.deleteVersion`. */
export type VexDeleteVersionArgs =
  | {
      [key: string]: unknown;
      auth?: VexApiAuth;
      collection: string;
      id: string;
      version: number;
      environmentId?: string;
    }
  | {
      [key: string]: unknown;
      auth?: VexApiAuth;
      global: string;
      version: number;
      environmentId?: string;
    };
```

#### packages/core/src/api/convex.ts (Step 5's trim)
1 edit — the six versions arg types above (original lines 280–382, the "Versions API shallow
types" section) are cut; nothing replaces them in this file. Only `vexConvexApi` and its
JSDoc (original lines 384–590) remain, moving out whole in Step 7.

- [ ] `versions/api/versionsApi.ts` — from `api/server.ts:741`; `versions/api/index.ts`
- [ ] `api/convex.test.ts` → `versions/api/versionsApi.test.ts`

#### packages/core/src/versions/api/versionsApi.ts
New file — `versionsApi` moved verbatim out of `api/server.ts` (JSDoc at `:690`, function at
`:741`). `VexListVersionsArgs`, `VexGetVersionSnapshotArgs`, `VexDeleteVersionArgs` were
imported from `./convex` (`api/convex.ts`) in the original; they are now siblings in
`versions/api/types.ts` (this step), so this file reads them from `./types` instead — version
op arg types never belonged in the document-shapes module.

```ts
import {
  type MutationBuilder,
  type FunctionVisibility,
  type GenericDataModel,
  type QueryBuilder,
  GenericQueryCtx,
  GenericMutationCtx,
  RegisteredQuery,
  RegisteredMutation,
} from "convex/server";
import { ConvexError, GenericId, v } from "convex/values";
import type { VexConfig } from "../../config";
import type { CollectionSlug, GlobalSlug, VexDocumentGlobal } from "../../types/generated";
import type { VexApiAuth } from "../../db/types";
import {
  VexListVersionsArgs,
  VexGetVersionSnapshotArgs,
  VexDeleteVersionArgs,
} from "./types";
import { resolveGetAuth } from "../../api/server";
import { saveDraft } from "./saveDraft/server";
import { publish } from "./publish/server";
import { unpublish } from "./unpublish/server";
import { listVersions } from "./listVersions/server";
import { getVersionSnapshot } from "./getVersionSnapshot/server";
import { deleteVersion } from "./deleteVersion/server";

/**
 * Registers the draft/version workflow as bare-named Convex endpoints under
 * `api.vex.versions.*`, mirroring `collectionsApi`/`globalsApi`'s
 * registration shape and RBAC seam.
 *
 * Unlike `globalsApi` (always registers its three operations once called),
 * `versionsApi` registers NOTHING for a project where no resource declares
 * `versions.drafts: true`.
 *
 * @typeParam DataModel - The project's generated Convex data model.
 * @typeParam Visibility - Function visibility of the supplied builders;
 *   defaults to `"public"`.
 * @param props - Factory configuration, identical contract to `collectionsApi`'s.
 * @returns `saveDraft`/`publish`/`unpublish`/`listVersions`/`getVersionSnapshot`/
 *   `deleteVersion`, or `{}` when no resource declares `versions.drafts: true`.
 *
 * @see {@link globalsApi} for the (unconditional) factory this mirrors
 */
export function versionsApi<
  DataModel extends GenericDataModel,
  Visibility extends FunctionVisibility = "public",
>({
  config,
  query,
  mutation,
  getAuth,
}: {
  config: VexConfig;
  query: QueryBuilder<DataModel, Visibility>;
  mutation: MutationBuilder<DataModel, Visibility>;
  getAuth?: (
    ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>,
  ) => Promise<VexApiAuth | undefined>;
}) {
  const hasVersionedCollections = config.collections.some((c) => c.versions.drafts);
  const hasVersionedGlobals = config.globals.some((g) => g.versions.drafts);
  if (!hasVersionedCollections && !hasVersionedGlobals) {
    return {};
  }

  return {
    saveDraft: mutation({
      args: {
        collection: v.optional(v.string()),
        id: v.optional(v.string()),
        global: v.optional(v.string()),
        data: v.any(),
        restoredFrom: v.optional(v.number()),
        environmentId: v.optional(v.string()),
      },
      handler: async (ctx, args) => {
        const isCollection = args.collection !== undefined && args.id !== undefined;
        const isGlobal = args.global !== undefined;
        if (isCollection === isGlobal) {
          throw new ConvexError(
            "saveDraft takes either { collection, id } or { global }, not both or neither",
          );
        }
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        if (args.collection !== undefined && args.id !== undefined) {
          return saveDraft({
            auth,
            ctx,
            config,
            collection: args.collection as CollectionSlug,
            id: args.id as GenericId<CollectionSlug>,
            data: args.data,
            restoredFrom: args.restoredFrom,
          });
        }
        return saveDraft({
          auth,
          ctx,
          config,
          global: args.global as GlobalSlug,
          data: args.data,
          restoredFrom: args.restoredFrom,
        });
      },
    }),

    publish: mutation({
      args: {
        collection: v.optional(v.string()),
        id: v.optional(v.string()),
        global: v.optional(v.string()),
        environmentId: v.optional(v.string()),
        data: v.optional(v.any()),
        version: v.optional(v.number()),
      },
      handler: async (ctx, args) => {
        const isCollection = args.collection !== undefined && args.id !== undefined;
        const isGlobal = args.global !== undefined;
        if (isCollection === isGlobal) {
          throw new ConvexError(
            "publish takes either { collection, id } or { global }, not both or neither",
          );
        }
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        if (args.collection !== undefined && args.id !== undefined) {
          return publish({
            auth,
            ctx,
            config,
            collection: args.collection as CollectionSlug,
            id: args.id as GenericId<CollectionSlug>,
            data: args.data as Record<string, unknown> | undefined,
            version: args.version,
          });
        }
        return publish({
          auth,
          ctx,
          config,
          global: args.global as GlobalSlug,
          data: args.data as Record<string, unknown> | undefined,
          version: args.version,
        });
      },
    }),

    unpublish: mutation({
      args: {
        collection: v.optional(v.string()),
        id: v.optional(v.string()),
        global: v.optional(v.string()),
        environmentId: v.optional(v.string()),
      },
      handler: async (ctx, args) => {
        const isCollection = args.collection !== undefined && args.id !== undefined;
        const isGlobal = args.global !== undefined;
        if (isCollection === isGlobal) {
          throw new ConvexError(
            "unpublish takes either { collection, id } or { global }, not both or neither",
          );
        }
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        if (args.collection !== undefined && args.id !== undefined) {
          return unpublish({
            auth,
            ctx,
            config,
            collection: args.collection as CollectionSlug,
            id: args.id as GenericId<CollectionSlug>,
          });
        }
        return unpublish({ auth, ctx, config, global: args.global as GlobalSlug });
      },
    }),

    listVersions: query({
      args: {
        collection: v.optional(v.string()),
        id: v.optional(v.string()),
        global: v.optional(v.string()),
        limit: v.optional(v.number()),
        environmentId: v.optional(v.string()),
      },
      handler: async (ctx, args) => {
        const isCollection = args.collection !== undefined && args.id !== undefined;
        const isGlobal = args.global !== undefined;
        if (isCollection === isGlobal) {
          throw new ConvexError(
            "listVersions takes either { collection, id } or { global }, not both or neither",
          );
        }
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        if (args.collection !== undefined && args.id !== undefined) {
          return listVersions({
            auth,
            ctx,
            config,
            collection: args.collection as CollectionSlug,
            id: args.id as GenericId<CollectionSlug>,
            limit: args.limit,
          });
        }
        return listVersions({
          auth,
          ctx,
          config,
          global: args.global as GlobalSlug,
          limit: args.limit,
        });
      },
    }) as RegisteredQuery<Visibility, VexListVersionsArgs, VexDocumentGlobal | null>,

    getVersionSnapshot: query({
      args: {
        collection: v.optional(v.string()),
        id: v.optional(v.string()),
        global: v.optional(v.string()),
        version: v.number(),
        environmentId: v.optional(v.string()),
      },
      handler: async (ctx, args) => {
        const isCollection = args.collection !== undefined && args.id !== undefined;
        const isGlobal = args.global !== undefined;
        if (isCollection === isGlobal) {
          throw new ConvexError(
            "getVersionSnapshot takes either { collection, id } or { global }, not both or neither",
          );
        }
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        if (args.collection !== undefined && args.id !== undefined) {
          return getVersionSnapshot({
            auth,
            ctx,
            config,
            collection: args.collection as CollectionSlug,
            id: args.id as GenericId<CollectionSlug>,
            version: args.version,
          });
        }
        return getVersionSnapshot({
          auth,
          ctx,
          config,
          global: args.global as GlobalSlug,
          version: args.version,
        });
      },
    }) as RegisteredQuery<Visibility, VexGetVersionSnapshotArgs, VexDocumentGlobal | null>,

    deleteVersion: mutation({
      args: {
        collection: v.optional(v.string()),
        id: v.optional(v.string()),
        global: v.optional(v.string()),
        version: v.number(),
        environmentId: v.optional(v.string()),
      },
      handler: async (ctx, args) => {
        const isCollection = args.collection !== undefined && args.id !== undefined;
        const isGlobal = args.global !== undefined;
        if (isCollection === isGlobal) {
          throw new ConvexError(
            "deleteVersion takes either { collection, id } or { global }, not both or neither",
          );
        }
        const auth = await resolveGetAuth({ ctx, config, getAuth });
        if (args.collection !== undefined && args.id !== undefined) {
          return deleteVersion({
            auth,
            ctx,
            config,
            collection: args.collection as CollectionSlug,
            id: args.id as GenericId<CollectionSlug>,
            version: args.version,
          });
        }
        return deleteVersion({
          auth,
          ctx,
          config,
          global: args.global as GlobalSlug,
          version: args.version,
        });
      },
    }) as RegisteredMutation<Visibility, VexDeleteVersionArgs, VexDocumentGlobal | null>,
  };
}
```
`backfillStatus` is NOT part of `versionsApi`'s registered surface — it never was (the
original `api/server.ts` only exports it as a bare function for scripted/one-off use, not
through `versionsApi`). That stays true after the move.

#### packages/core/src/versions/api/index.ts
New file:
```ts
export { saveDraft } from "./saveDraft/server";
export type { SaveDraftServerArgs } from "./saveDraft/server";

export { publish } from "./publish/server";
export type { PublishServerArgs } from "./publish/server";

export { unpublish } from "./unpublish/server";
export type { UnpublishServerArgs } from "./unpublish/server";

export { listVersions } from "./listVersions/server";
export type { ListVersionsServerArgs } from "./listVersions/server";

export { getVersionSnapshot } from "./getVersionSnapshot/server";
export type { GetVersionSnapshotServerArgs, VersionSnapshotResult } from "./getVersionSnapshot/server";

export { deleteVersion } from "./deleteVersion/server";
export type { DeleteVersionServerArgs } from "./deleteVersion/server";

export { backfillStatus } from "./backfillStatus/server";
export type { BackfillStatusServerArgs, BackfillStatusResult } from "./backfillStatus/server";

export * from "./types";

export { versionsApi } from "./versionsApi";
```
(`export * from "./types"` is new relative to the earlier draft — `versions/api/types.ts` now
carries the six `Vex*Args` types, and nothing else in the barrel re-exported them.)

#### packages/core/src/versions/api/versionsApi.test.ts

`git mv packages/core/src/api/convex.test.ts packages/core/src/versions/api/versionsApi.test.ts`
— per Step 1's note, this file actually tests `versionsApi`
(`describe("versionsApi — conditional registration", …)`), not anything declared in
`api/convex.ts`. 1 edit — the import:

```ts
import { versionsApi } from "./versionsApi";
```

(was `import { versionsApi } from "./server"`, which resolved to `api/server.ts` from
`api/convex.test.ts`'s original location; from `versions/api/`, the same factory is the
local `versionsApi.ts` this step just created.)

---

### Step 6 — `media/api/` to the same scheme [agent]
Why: decision 1; the third scheme (`queries.ts` / `mutations.ts`) goes; decision 5 moves the `VexMedia*` arg/return types here from `api/convex.ts`.
Verify: `pnpm --filter @vexcms/core typecheck && pnpm --filter @vexcms/core test`

> Note: `media/api/server.ts`'s own JSDoc example (`:31`) imports `mediaApi` from
> `"@vexcms/core/convex"` — but `mediaApi` has never been exported from `./convex` /
> `./server` (`api/server.ts`); it is exported only from the package's `.` entry
> (`src/index.ts:116`, via the `./media` barrel). This is a pre-existing doc bug, not
> something this spec changes behaviorally — fixed below by correcting the example to
> `@vexcms/core`, matching the real export. `src/server.ts` (Step 7) still does not export
> `mediaApi`, same as `api/server.ts` today.

- [ ] each query/mutation in `media/api/{queries,mutations}.ts` → `media/api/<op>/server.ts` (+ tests split from `mutations.test.ts`)

```bash
mkdir -p packages/core/src/media/api/getUrl packages/core/src/media/api/generateUploadUrl packages/core/src/media/api/createMediaDocument packages/core/src/media/api/deleteMedia
git mv packages/core/src/media/api/queries.ts packages/core/src/media/api/getUrl/server.ts
git rm packages/core/src/media/api/mutations.ts
```
(`queries.ts` has one export, so it is a straight `git mv` + content edit; `mutations.ts`
has three, so it is removed and its three functions recreated as new files — Git still
detects the rename/split as a similarity match on `git diff` as long as the function bodies
are pasted unchanged, which they are below.)

#### packages/core/src/media/api/getUrl/server.ts
Moved from `queries.ts`. 1 edit — replace the import block with:
```ts
import type { GenericDataModel } from "convex/server";

import { GetUrlReturn } from "../../types";
import type { GetUrlServerArgs } from "../types";
import { CRUD_ACTIONS, hasPermission } from "../../../access";
import { resolveAccessCall } from "../../../access/resolveAccessCall";
import { resolveCollectionSlug } from "../../../db/documents";
import { GenericId } from "convex/values";
import { CollectionSlug } from "../../../types";
```
The `getUrl` function body is unchanged.

#### packages/core/src/media/api/generateUploadUrl/server.ts
New file — the `generateUploadUrl` function, moved out of `mutations.ts` unchanged, with only
the imports it actually uses:
```ts
import { GenericDataModel } from "convex/server";
import { VexStorageConfigError } from "../../types";
import type { GenerateUploadUrlServerArgs } from "../types";
import { CRUD_ACTIONS, hasPermission, PERMISSION_SCOPES } from "../../../access";
import { resolveAccessCall } from "../../../access/resolveAccessCall";

/**
 * Generates a URL to upload a file to the storage adapter.
 * Server-side only — call inside a Convex mutation handler.
 *
 * Looks up the adapter by name from `args.config.storage?.adapters` and
 * calls `adapter.generateUploadUrl(ctx)`.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @param args - `{ ctx, config, adapter }`.
 * @returns Promise resolving to `{ url: string }` — the upload URL.
 * @example
 * ```ts
 * import { generateUploadUrl } from "@vexcms/core/server";
 *
 * export const uploadFile = mutation({
 *   args: { adapter: v.string() },
 *   handler: (ctx, args) =>
 *     generateUploadUrl({ ctx, config: myConfig, adapter: args.adapter }),
 * });
 */
export async function generateUploadUrl<TDataModel extends GenericDataModel = GenericDataModel>(
  args: GenerateUploadUrlServerArgs<TDataModel>,
): Promise<{ url: string }> {
  if (args.config.access !== undefined) {
    const { access, action, resource } = resolveAccessCall({
      config: args.config,
      access: args.access,
      defaultAction: CRUD_ACTIONS.create,
      resource: args.collection,
    });
    hasPermission({
      throwOnDenied: true,
      user: args.auth?.user ?? null,
      organization: args.auth?.organization,
      access,
      resource,
      action,
      scope: PERMISSION_SCOPES.any,
    });
  }
  const adapter = args.config.storage?.adapters.find((a) => a.name === args.adapter);
  if (!adapter) {
    throw new VexStorageConfigError(`Storage adapter "${args.adapter}" not found`);
  }
  return await adapter.generateUploadUrl(args.ctx);
}
```

#### packages/core/src/media/api/createMediaDocument/server.ts
New file — the `createMediaDocument` function, moved unchanged:
```ts
import { GenericDataModel } from "convex/server";
import { VexStorageConfigError } from "../../types";
import type { CreateMediaDocumentServerArgs } from "../types";
import { CRUD_ACTIONS, hasPermission } from "../../../access";
import { resolveAccessCall } from "../../../access/resolveAccessCall";

/**
 * Creates a media document in the storage adapter after the file is uploaded.
 * Server-side only — call inside a Convex mutation handler.
 *
 * Looks up the adapter by name from `args.config.storage?.adapters` and
 * calls `adapter.createMediaDocument(ctx, args)`.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @param args - `{ ctx, config, adapter, collectionSlug, storageId, filename, mimeType, size, alt?, adapterFields? }`.
 * @returns Promise resolving to the new media document's ID as a string.
 * @example
 * ```ts
 * import { createMediaDocument } from "@vexcms/core/server";
 *
 * export const saveMedia = mutation({
 *   args: { data: v.any() },
 *   handler: (ctx, args) =>
 *     createMediaDocument({ ctx, config: myConfig, ...args.data }),
 * });
 * ```
 */
export async function createMediaDocument<TDataModel extends GenericDataModel = GenericDataModel>(
  args: CreateMediaDocumentServerArgs<TDataModel>,
): Promise<string> {
  if (args.config.access !== undefined) {
    const { access, action, resource } = resolveAccessCall({
      config: args.config,
      access: args.access,
      defaultAction: CRUD_ACTIONS.create,
      resource: args.collection,
    });
    hasPermission({
      throwOnDenied: true,
      access,
      user: args.auth?.user ?? null,
      organization: args.auth?.organization,
      resource,
      action,
      changes: {
        alt: args.alt,
        filename: args.filename,
        mimeType: args.mimeType,
        size: args.size,
        adapterFields: args.adapterFields,
      },
    });
  }
  const adapter = args.config.storage?.adapters.find((a) => a.name === args.adapter);
  if (!adapter) {
    throw new VexStorageConfigError(`Storage adapter "${args.adapter}" not found`);
  }
  return await adapter.createMediaDocument(args.ctx, {
    collectionSlug: args.collection,
    storageId: args.storageId,
    filename: args.filename,
    mimeType: args.mimeType,
    size: args.size,
    alt: args.alt,
    adapterFields: args.adapterFields,
  });
}
```

#### packages/core/src/media/api/deleteMedia/server.ts
New file — the `deleteMedia` function, moved unchanged:
```ts
import { GenericDataModel } from "convex/server";
import { VexStorageConfigError } from "../../types";
import type { DeleteMediaServerArgs } from "../types";
import { CRUD_ACTIONS, hasPermission } from "../../../access";
import { resolveAccessCall } from "../../../access/resolveAccessCall";
import { resolveCollectionSlug } from "../../../db/documents";
import { type GenericId } from "convex/values";
import { CollectionSlug } from "../../../types";

/**
 * Deletes a media document and its file from storage.
 * Server-side only — call inside a Convex mutation handler.
 *
 * Looks up the adapter by name from `args.config.storage?.adapters` and
 * calls `adapter.deleteMedia(ctx, args)`.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @param args - `{ ctx, config, adapter, mediaId, softDelete? }`.
 * @returns Promise resolving to `true` if the document was deleted.
 * @example
 * ```ts
 * import { deleteMedia } from "@vexcms/core/server";
 *
 * export const removeMedia = mutation({
 *   args: { mediaId: v.string() },
 *   handler: (ctx, args) =>
 *     deleteMedia({ ctx, config: myConfig, adapter: "convex", mediaId: args.mediaId }),
 * });
 * ```
 */
export async function deleteMedia<TDataModel extends GenericDataModel = GenericDataModel>(
  args: DeleteMediaServerArgs<TDataModel>,
): Promise<boolean> {
  if (args.config.access !== undefined) {
    const resource = resolveCollectionSlug({
      ctx: args.ctx,
      config: args.config,
      id: args.mediaId as GenericId<CollectionSlug>,
    });
    const { access, action } = resolveAccessCall({
      config: args.config,
      access: args.access,
      defaultAction: CRUD_ACTIONS.delete,
      resource,
    });
    const doc = await args.ctx.db.get(args.mediaId as GenericId<CollectionSlug>);
    hasPermission({
      throwOnDenied: true,
      access,
      user: args.auth?.user ?? null,
      organization: args.auth?.organization,
      resource,
      action,
      data: doc ?? undefined,
    });
  }
  const adapter = args.config.storage?.adapters.find((a) => a.name === args.adapter);
  if (!adapter) {
    throw new VexStorageConfigError(`Storage adapter "${args.adapter}" not found`);
  }
  return await adapter.deleteMedia(args.ctx, {
    collectionSlug: "",
    mediaId: args.mediaId,
    softDelete: args.softDelete,
  });
}
```

#### packages/core/src/media/api/getUrl/server.test.ts
Moved from `queries.test.ts` (if present) or split out of the current combined media
`*.test.ts` file's `getUrl` describe block — same assertions, same fixtures, import of
`getUrl` repointed from `"../queries"` / `"./server"` to the sibling `"./server"` it already
uses (no path change needed if the test already imports its unit via a relative `./`).

#### packages/core/src/media/api/generateUploadUrl/server.test.ts
#### packages/core/src/media/api/createMediaDocument/server.test.ts
#### packages/core/src/media/api/deleteMedia/server.test.ts
Each split out of `mutations.test.ts`'s matching `describe` block, moved verbatim: same
`vi`/`convexTest` setup, same assertions and expected values, each file importing only the
one function (`generateUploadUrl`, `createMediaDocument`, `deleteMedia`) it tests from its new
sibling `./server`.

- [ ] `media/api/server.ts` → `media/api/mediaApi.ts`; `index.ts` re-exports only
- [ ] `VexMediaGenerateUploadUrlArgs`/`VexMediaGenerateUploadUrlReturn`/`VexMediaCreateMediaDocumentArgs`/`VexMediaCreateMediaDocumentReturn`/`VexMediaDeleteMediaArgs`/`VexMediaDeleteMediaReturn`/`VexMediaGetUrlArgs`/`VexMediaGetUrlReturn` cut from `api/convex.ts` appended to `media/api/types.ts`

```bash
git mv packages/core/src/media/api/server.ts packages/core/src/media/api/mediaApi.ts
```

#### packages/core/src/media/api/mediaApi.ts
2 edits.

**1 — imports.** Replace the import block with:
```ts
import {
  type MutationBuilder,
  type QueryBuilder,
  type FunctionVisibility,
  type GenericDataModel,
  GenericMutationCtx,
  GenericQueryCtx,
} from "convex/server";
import { v } from "convex/values";
import type { VexConfig } from "../../config";
import { generateUploadUrl } from "./generateUploadUrl/server";
import { createMediaDocument } from "./createMediaDocument/server";
import { deleteMedia } from "./deleteMedia/server";
import { getUrl } from "./getUrl/server";
import { VexApiAuth } from "../../db/types";
import { resolveGetAuth } from "../../api/server";
```

**2 — the factory's doc comment example.** Replace the `@example` block (the one importing
`mediaApi` from `@vexcms/core/convex`, see the Note above the git-mv list) with:
```ts
 * @example
 * ```ts
 * // apps/test/convex/vex/media.ts
 * import { createGetAuth } from "@vexcms/better-auth"
 * import { mediaApi } from "@vexcms/core";
 * import { mutation, query } from "../_generated/server";
 * import config from "../../src/vex.config";
 *
 * export const { getUrl, generateUploadUrl, createMediaDocument, deleteMedia } = mediaApi({ config, query, mutation, getAuth: createGetAuth({...}) });
 * ```
```
The `mediaApi` function body itself (the `query`/`mutation` registrations) is unchanged.

#### packages/core/src/media/api/types.ts

1 edit (beyond the Step 2 header fix already applied) — append at the end of the file, cut
verbatim from `api/convex.ts` (original lines 193–247, "Media API shallow types"), with their
doc comments:
```ts
/** Args for `api.vex.media.generateUploadUrl`. */
export interface VexMediaGenerateUploadUrlArgs {
  [key: string]: unknown;
  adapter: string;
  collection: string;
}

/** Return for `api.vex.media.generateUploadUrl`. */
export interface VexMediaGenerateUploadUrlReturn {
  [key: string]: unknown;
  url: string;
}

/** Args for `api.vex.media.createMediaDocument`. */
export interface VexMediaCreateMediaDocumentArgs {
  [key: string]: unknown;
  adapter: string;
  collectionSlug: string;
  storageId: string;
  filename: string;
  mimeType: string;
  size: number;
  alt?: string;
  adapterFields?: Record<string, unknown>;
}

/** Return for `api.vex.media.createMediaDocument`. */
export type VexMediaCreateMediaDocumentReturn = string;

/** Args for `api.vex.media.deleteMedia`. */
export interface VexMediaDeleteMediaArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  adapter: string;
  mediaId: string;
  softDelete?: boolean;
}

/** Return for `api.vex.media.deleteMedia`. */
export type VexMediaDeleteMediaReturn = boolean;

/** Args for `api.vex.media.getUrl`. */
export interface VexMediaGetUrlArgs {
  [key: string]: unknown;
  auth?: VexApiAuth;
  adapter: string;
  mediaId: string;
}

/** Return for `api.vex.media.getUrl`. */
export interface VexMediaGetUrlReturn {
  [key: string]: unknown;
  url?: string;
  error?: string;
}
```
`VexApiAuth` is already imported (Step 2 repointed it to `../../db/types`) — no header edit
needed for these eight types.

#### packages/core/src/api/convex.ts (Step 6's trim)
1 edit — the eight media arg/return types above (original lines 193–247, "Media API shallow
types") are cut; nothing replaces them in this file. After this step, `api/convex.ts` holds
only its import header and `vexConvexApi` itself (original lines 384–590) — Step 7 moves that
last piece out and deletes the file.

#### packages/core/src/media/api/index.ts
Full replacement (the file is 19 lines today — shown complete):
```ts
// ============================================================================
// MEDIA API TYPES
// ============================================================================

export * from "./types";

// ============================================================================
// MEDIA API OPERATIONS
// ============================================================================

export { getUrl } from "./getUrl/server";
export { generateUploadUrl } from "./generateUploadUrl/server";
export { createMediaDocument } from "./createMediaDocument/server";
export { deleteMedia } from "./deleteMedia/server";

export { mediaApi } from "./mediaApi";
```

---

### Step 7 — Entry `src/server.ts`, delete `src/api/`, drop `./convex`, `vexConvexApi` → its own file [agent]
Why: decision 4 (one server entry, `src/api/` gone, the alias removed) and decision 5
(`api/convex.ts`'s last remaining export, `vexConvexApi`, gets a file named after it rather
than surviving as a renamed `documents/types.ts` leftover).
Verify: `pnpm --filter @vexcms/core build && node scripts/export-names.mjs --check` (diff = `./convex` entry only) `&& pnpm typecheck && pnpm test`

> Note: a repo-wide grep for `from ["']@vexcms/core/convex["']` (and the `require(...)`
> form) across `packages/**` and `apps/**` returned **zero real code importers** — the
> subpath is referenced only in docs (`.agent/docs/standards/backend/convex-functions.md:11`,
> `.agent/docs/product/post-v0.1.0-plan.md:396`, `.agent/docs/research/db-adapter-feasibility.md:122`,
> and `media/api/server.ts`'s stale example fixed in Step 6) and in two OTHER specs'
> historical text (`2026-10-21-backend-neutral-query-args/spec.md`,
> `post-v0.1.0-plan.md`), which this spec does not edit — they describe a past decision, not
> a live import. The checkbox "every `@vexcms/core/convex` import … repointed" therefore has
> no code to touch; `.agent/docs/standards/backend/convex-functions.md` is the one doc this
> spec's `touches` list covers (edited below).

- [ ] `src/server.ts` — the barrel from `api/server.ts:67-120` repointed + `createVexCallbackApi`, `vexServerApi`, `resolveGetAuth`, bound types; `src/server.test.ts`
- [ ] `src/vexConvexApi.ts` — `vexConvexApi` moved out of `api/convex.ts`, the file then deleted
- [ ] `api/convex.test.ts` already moved to `versions/api/versionsApi.test.ts` in Step 5 — nothing left to delete here beyond `api/convex.ts` itself

```bash
git mv packages/core/src/api/server.test.ts packages/core/src/server.test.ts
git mv packages/core/src/api/callbackApi.test.ts packages/core/src/callbackApi.test.ts
git rm packages/core/src/api/server.ts
git rm packages/core/src/api/convex.ts
```
(`server.test.ts` imports `vexServerApi` from `./server`; `callbackApi.test.ts` imports
`createVexCallbackApi` from `./server` — both already import by that bare relative name, so
moving them beside the new `src/server.ts` needs no import-path edit, only the `git mv`.
`callbackApi.test.ts` is kept as its own colocated file rather than merged into
`server.test.ts` — `tests-colocated` only requires the `.test.ts` suffix next to its unit, not
one file per source file, and splitting by factory keeps each test file's `describe` blocks
scoped to one export. `api/convex.ts` is `git rm`'d outright here — by this step every export
it still carries is `vexConvexApi`, which moves to its own file below; nothing stays behind.)

#### packages/core/src/vexConvexApi.ts

New file — `vexConvexApi` and its doc comment moved verbatim out of `api/convex.ts` (original
lines 384–590, the only content left in that file after Steps 1 and 3–6 relocated everything
else). Named after its one export, per decision 2's "a file is named after its main export"
rule — the same rule that gives `collectionsApi.ts`/`globalsApi.ts`/`versionsApi.ts`/
`mediaApi.ts` their names applies to `vexConvexApi`, which is cross-domain (it references
collection, media, globals and versions arg types together) and so sits at `src/`, not inside
any one domain folder.

```ts
import { anyApi } from "convex/server";
import type { FunctionReference } from "convex/server";
import type { PaginationResult } from "./db/types";
import { VexDocumentGlobal } from "./types";
import type { VexDocument } from "./documents/types";
import type { VersionSummary } from "./versions/types";
import type { VersionSnapshotResult } from "./versions/api/getVersionSnapshot/server";
import type {
  VexFindArgs,
  VexFindPaginatedArgs,
  VexGetArgs,
  VexSearchArgs,
  VexCreateArgs,
  VexUpdateArgs,
  VexRemoveArgs,
} from "./collections/api/types";
import type {
  VexMediaGenerateUploadUrlArgs,
  VexMediaGenerateUploadUrlReturn,
  VexMediaCreateMediaDocumentArgs,
  VexMediaCreateMediaDocumentReturn,
  VexMediaDeleteMediaArgs,
  VexMediaDeleteMediaReturn,
  VexMediaGetUrlArgs,
  VexMediaGetUrlReturn,
} from "./media/api/types";
import type { VexGlobalsGetArgs, VexGlobalsFindArgs, VexGlobalsUpdateArgs } from "./globals/api/types";
import type {
  VexSaveDraftArgs,
  VexPublishArgs,
  VexUnpublishArgs,
  VexListVersionsArgs,
  VexGetVersionSnapshotArgs,
  VexDeleteVersionArgs,
} from "./versions/api/types";

/**
 * Typed `anyApi` references to the VexCMS generic Convex collection functions.
 *
 * These point to functions that users copy into `convex/vex/collections.ts`
 * in their project. All paths are fixed under `vex.collections.*`.
 *
 * **Required:** copy `convex/vex/collections.ts` from the VexCMS template
 * into your project before these references will resolve at runtime.
 *
 * Used internally by view components in `@vexcms/react`. Framework adapter
 * authors do not need to import this directly unless building custom views.
 *
 * @example
 * ```ts
 * import { convexQuery } from "@convex-dev/react-query";
 * import { useQuery } from "@tanstack/react-query";
 * import { vexConvexApi } from "@vexcms/core";
 *
 * const { data } = useQuery({
 *   ...convexQuery(vexConvexApi.list, { collection: "posts" }),
 * });
 * ```
 */
export const vexConvexApi = {
  /**
   * Finds documents in a collection.
   * Called by {@link react/src!CollectionListView} in `@vexcms/react`.
   */
  find: anyApi.vex.find as FunctionReference<
    "query",
    "public",
    VexFindArgs,
    VexDocument[] | PaginationResult<VexDocument>
  >,
  /**
   * Finds documents in a collection with cursor pagination.
   * Called by {@link react/src!CollectionListView} in `@vexcms/react`.
   */
  findPaginated: anyApi.vex.find as FunctionReference<
    "query",
    "public",
    VexFindPaginatedArgs,
    PaginationResult<VexDocument>
  >,

  /**
   * Resolves a `{ server }` live-preview URL with a real Convex `ctx`.
   * Called by `useLivePreviewServerUrl` in `@vexcms/react`, and only for that
   * `url` form — string and client resolvers never reach the server.
   */
  livePreviewUrl: anyApi.vex.livePreviewUrl as FunctionReference<
    "query",
    "public",
    {
      collection: string;
      kind?: "collection" | "global";
      documentId?: string;
      values?: Record<string, unknown>;
    },
    string | null
  >,

  /**
   * Fetches a single document by ID.
   * Called by {@link react/src!CollectionEditView} in `@vexcms/react` when editing.
   */
  get: anyApi.vex.get as FunctionReference<"query", "public", VexGetArgs, VexDocument | null>,

  /**
   * Creates a new document. Returns the new document's ID as a string.
   */
  create: anyApi.vex.create as FunctionReference<"mutation", "public", VexCreateArgs, string>,

  /**
   * Searches documents in a collection by a search index.
   *
   * Used by `RelationshipFieldInput` in `@vexcms/react` to populate the
   * relationship picker combobox. The `searchIndexName` must match the
   * `.searchIndex()` name in the Convex schema — VexCMS auto-generates
   * `search_<useAsTitle>` when another collection has a relationship here.
   * Pass `query: ""` to list recent documents when no search term is entered.
   *
   * @see {@link https://docs.convex.dev/text-search} for Convex search docs
   */
  search: anyApi.vex.search as FunctionReference<
    "query",
    "public",
    VexSearchArgs,
    VexDocument[] | PaginationResult<VexDocument>
  >,

  /**
   * Patches an existing document — unspecified fields are left unchanged.
   */
  update: anyApi.vex.update as FunctionReference<"mutation", "public", VexUpdateArgs, void>,

  /**
   * Permanently deletes a document.
   */
  remove: anyApi.vex.remove as FunctionReference<"mutation", "public", VexRemoveArgs, void>,

  media: {
    /**
     * Generates a URL to upload a file to.
     * Called by `MediaUploadDropzone` in `@vexcms/react`.
     */
    generateUploadUrl: anyApi.vex.media.generateUploadUrl as FunctionReference<
      "mutation",
      "public",
      VexMediaGenerateUploadUrlArgs,
      VexMediaGenerateUploadUrlReturn
    >,

    /**
     * Creates a media document in Convex after the file is uploaded.
     * Called by `MediaUploadDropzone` in `@vexcms/react`.
     */
    createMediaDocument: anyApi.vex.media.createMediaDocument as FunctionReference<
      "mutation",
      "public",
      VexMediaCreateMediaDocumentArgs,
      VexMediaCreateMediaDocumentReturn
    >,

    /**
     * Deletes a media document and its file from storage.
     * Called by `MediaLibrary` in `@vexcms/react`.
     */
    deleteMedia: anyApi.vex.media.deleteMedia as FunctionReference<
      "mutation",
      "public",
      VexMediaDeleteMediaArgs,
      VexMediaDeleteMediaReturn
    >,

    /**
     * Returns a URL for a media file.
     * Called by `UploadFieldCell` in `@vexcms/react`.
     */
    getUrl: anyApi.vex.media.getUrl as FunctionReference<
      "query",
      "public",
      VexMediaGetUrlArgs,
      VexMediaGetUrlReturn
    >,
  },

  globals: {
    get: anyApi.vex.globals.get as FunctionReference<
      "query",
      "public",
      VexGlobalsGetArgs,
      VexDocumentGlobal | null
    >,
    find: anyApi.vex.globals.find as FunctionReference<
      "query",
      "public",
      VexGlobalsFindArgs,
      VexDocumentGlobal[]
    >,
    upsert: anyApi.vex.globals.upsert as FunctionReference<
      "mutation",
      "public",
      VexGlobalsUpdateArgs,
      string
    >,
  },

  versions: {
    saveDraft: anyApi.vex.versions.saveDraft as FunctionReference<
      "mutation",
      "public",
      VexSaveDraftArgs,
      string
    >,
    publish: anyApi.vex.versions.publish as FunctionReference<
      "mutation",
      "public",
      VexPublishArgs,
      string
    >,
    unpublish: anyApi.vex.versions.unpublish as FunctionReference<
      "mutation",
      "public",
      VexUnpublishArgs,
      string
    >,
    listVersions: anyApi.vex.versions.listVersions as FunctionReference<
      "query",
      "public",
      VexListVersionsArgs,
      VersionSummary[]
    >,
    getVersionSnapshot: anyApi.vex.versions.getVersionSnapshot as FunctionReference<
      "query",
      "public",
      VexGetVersionSnapshotArgs,
      VersionSnapshotResult
    >,
    deleteVersion: anyApi.vex.versions.deleteVersion as FunctionReference<
      "mutation",
      "public",
      VexDeleteVersionArgs,
      void
    >,
  },
} as const;
```
`VexDocumentGlobal` comes from `./types` (the package's existing generated-types re-export),
unchanged from the original file's import. `VersionSnapshotResult` now resolves from
`./versions/api/getVersionSnapshot/server` — Step 5's new location for that op — instead of
`./api/versions/getVersionSnapshot.server`.

#### packages/core/src/server.ts
New file — complete. This is `api/server.ts`'s barrel (former lines 1–120, repointed to the
moved domain `api/` folders), `VexCallbackApi` + `createVexCallbackApi` (former `:217-333`),
`resolveGetAuth` (former `:989-1044`), the bound-API types and `vexServerApi` (former
`:1046-1356`) — `collectionsApi`, `globalsApi`, `versionsApi` are no longer declared here;
they are imported from their domain `api/index.ts` barrels and re-exported.

```ts
import {
  type FunctionVisibility,
  type GenericDataModel,
  GenericQueryCtx,
  GenericMutationCtx,
} from "convex/server";
import type { VexConfig } from "../config";
import type {
  CollectionSlug,
  GlobalPopulateShape,
  GlobalSlug,
  VexDataModel,
  VexDocumentGlobal,
  VexMutationCtx,
  VexQueryCtx,
} from "../types/generated";
import type {
  AccessCallOptions,
  PaginationOptions,
  PaginationResult,
  PopulateShape,
  VexApiAuth,
} from "../db/types";
import type { DocReturnItem, GetReturn } from "../collections/api/types";
import { VexAccessConfigError } from "../access";
import { resolveLivePreviewUrlOnServer } from "../livePreview/resolveUrl.server";
import { buildDepthPopulate } from "../db/depth";
import { createVexMutations } from "../db/triggers";

import {
  find,
  type FindServerArgs,
  get,
  type GetServerArgs,
  search,
  type SearchServerArgs,
  publishedSlugs,
  type PublishedSlug,
  type PublishedSlugsServerArgs,
  create,
  type CreateServerArgs,
  update,
  type UpdateServerArgs,
  remove,
  type RemoveServerArgs,
  collectionsApi,
} from "../collections/api";
import {
  getGlobal,
  type GetGlobalServerArgs,
  type GetGlobalReturn,
  findGlobals,
  upsertGlobal,
  type UpsertGlobalServerArgs,
  type GenericGlobalsQueryServerArgs,
  globalsApi,
} from "../globals/api";
import {
  saveDraft,
  type SaveDraftServerArgs,
  publish,
  type PublishServerArgs,
  unpublish,
  type UnpublishServerArgs,
  listVersions,
  type ListVersionsServerArgs,
  getVersionSnapshot,
  type GetVersionSnapshotServerArgs,
  type VersionSnapshotResult,
  deleteVersion,
  type DeleteVersionServerArgs,
  backfillStatus,
  type BackfillStatusServerArgs,
  type BackfillStatusResult,
  versionsApi,
} from "../versions/api";
import type { QueryIndexFieldsFor, VexWhere, VexWhereNode, VexWithIndex } from "../db/queryArgs";
import {
  assertUniqueAmongPublished,
  type AssertUniqueAmongPublishedArgs,
} from "../versions/assertUniqueAmongPublished";
import type { VersionSummary } from "../versions";

export { resolveLivePreviewUrlOnServer } from "../livePreview/resolveUrl.server";
export { buildDepthPopulate } from "../db/depth";

export { find, get, search, publishedSlugs, create, update, remove, collectionsApi };
export type {
  FindServerArgs,
  GetServerArgs,
  SearchServerArgs,
  PublishedSlug,
  PublishedSlugsServerArgs,
  CreateServerArgs,
  UpdateServerArgs,
  RemoveServerArgs,
};
export type { QueryIndexFieldsFor, VexWhere, VexWhereNode, VexWithIndex };

export { getGlobal, findGlobals, upsertGlobal, globalsApi };
export type { GetGlobalServerArgs, UpsertGlobalServerArgs };

export { saveDraft, publish, unpublish, versionsApi };
export type { SaveDraftServerArgs, PublishServerArgs, UnpublishServerArgs };
export { assertUniqueAmongPublished };
export type { AssertUniqueAmongPublishedArgs };
export { listVersions };
export type { ListVersionsServerArgs };
export type { VersionSummary };
export { getVersionSnapshot };
export type { GetVersionSnapshotServerArgs, VersionSnapshotResult };
export { deleteVersion };
export type { DeleteVersionServerArgs };
export { backfillStatus };
export type { BackfillStatusServerArgs, BackfillStatusResult };

export { createVexMutations } from "../db/triggers";

/**
 * Read-only VexCMS API handed to config callbacks beside the raw Convex `ctx`.
 *
 * Exists because `ctx` is the lowest common denominator — see this type's
 * original docstring (carried over unchanged from `api/server.ts`) for the
 * full read-only / no-`ctx`-member rationale.
 */
export interface VexCallbackApi {
  find<
    TCollectionSlug extends CollectionSlug,
    const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
    const D extends number = 0,
  >(
    args: Omit<FindServerArgs<VexDataModel, TCollectionSlug, TPopulate, D>, "ctx" | "config"> & {
      paginationOpts?: never;
    },
  ): Promise<DocReturnItem<TCollectionSlug, TPopulate, D>[]>;
  find<
    TCollectionSlug extends CollectionSlug,
    const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
    const D extends number = 0,
  >(
    args: Omit<FindServerArgs<VexDataModel, TCollectionSlug, TPopulate, D>, "ctx" | "config"> & {
      paginationOpts: PaginationOptions;
    },
  ): Promise<PaginationResult<DocReturnItem<TCollectionSlug, TPopulate, D>>>;

  get<
    TCollectionSlug extends CollectionSlug,
    const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
    const D extends number = 0,
  >(
    args: Omit<GetServerArgs<VexDataModel, TCollectionSlug, TPopulate, D>, "ctx" | "config">,
  ): Promise<GetReturn<TCollectionSlug, TPopulate, D>>;

  search<
    TCollectionSlug extends CollectionSlug,
    const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
    const D extends number = 0,
  >(
    args: Omit<SearchServerArgs<VexDataModel, TCollectionSlug, TPopulate, D>, "ctx" | "config">,
  ): Promise<DocReturnItem<TCollectionSlug, TPopulate, D>[]>;

  globals: {
    get<
      TGlobalSlug extends GlobalSlug,
      TPopulate extends GlobalPopulateShape<TGlobalSlug> = Record<string, never>,
      D extends number = 0,
    >(
      args: Omit<GetGlobalServerArgs<VexDataModel, TGlobalSlug, TPopulate, D>, "ctx" | "config">,
    ): Promise<GetGlobalReturn<TGlobalSlug, TPopulate, D>>;

    find(
      args?: Omit<GenericGlobalsQueryServerArgs<VexDataModel>, "ctx" | "config">,
    ): Promise<VexDocumentGlobal[]>;
  };
}

/**
 * Builds the {@link VexCallbackApi} handed to one config-callback invocation.
 * Unchanged from `api/server.ts` — a plain object of bound closures over
 * `ctx`/`config`, never re-exposing `ctx` itself.
 */
export function createVexCallbackApi(props: {
  ctx: VexQueryCtx | VexMutationCtx;
  config: VexConfig;
}): VexCallbackApi {
  const { ctx, config } = props;
  const withAccess = (access?: AccessCallOptions) => access ?? { bypass: true as const };

  return {
    find: ((args: { access?: AccessCallOptions }) =>
      find({
        ...args,
        ctx,
        config,
        access: withAccess(args.access),
      } as never)) as unknown as VexCallbackApi["find"],
    get: ((args: { access?: AccessCallOptions }) =>
      get({
        ...args,
        ctx,
        config,
        access: withAccess(args.access),
      } as never)) as unknown as VexCallbackApi["get"],
    search: ((args: { access?: AccessCallOptions }) =>
      search({
        ...args,
        ctx,
        config,
        access: withAccess(args.access),
      } as never)) as unknown as VexCallbackApi["search"],
    globals: {
      get: ((args: { access?: AccessCallOptions }) =>
        getGlobal({
          ...args,
          ctx,
          config,
          access: withAccess(args.access),
        } as never)) as unknown as VexCallbackApi["globals"]["get"],
      find: ((args?: { access?: AccessCallOptions }) =>
        findGlobals({
          ...args,
          ctx,
          config,
          access: withAccess(args?.access),
        } as never)) as unknown as VexCallbackApi["globals"]["find"],
    },
  };
}

/**
 * Resolves the current caller for RBAC enforcement. Unchanged from
 * `api/server.ts` — see its original docstring for the full no-`config.access`
 * / missing-`getAuth` / resolved-`undefined` behavior matrix.
 */
export async function resolveGetAuth<TDataModel extends GenericDataModel>({
  config,
  ctx,
  getAuth,
}: {
  config: VexConfig;
  ctx: GenericQueryCtx<TDataModel> | GenericMutationCtx<TDataModel>;
  getAuth?: (
    ctx: GenericQueryCtx<TDataModel> | GenericMutationCtx<TDataModel>,
  ) => Promise<VexApiAuth | undefined>;
}) {
  let auth: VexApiAuth | undefined = undefined;
  if (config.access !== undefined) {
    if (!getAuth) {
      throw new VexAccessConfigError(
        "getAuth not configured in collectionsApi. configure @ /src/convex/vex.ts",
      );
    }
    auth = await getAuth(ctx);
  }
  return auth;
}

// ── Bound server API ────────────────────────────────────────────────────────
// `config` is static for a project, but `auth` is per-request (it derives from
// `ctx`). See this section's original comment in `api/server.ts` for the full
// rationale — unchanged by this move.

export type BoundServerArgs<TArgs> = Omit<TArgs, "auth" | "config">;

type BoundPassthroughArgs<DataModel extends GenericDataModel> = {
  ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>;
  access?: AccessCallOptions;
};

export interface BoundFind<DataModel extends GenericDataModel> {
  <
    TCollectionSlug extends CollectionSlug,
    const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
    const D extends number = 0,
  >(
    args: BoundServerArgs<FindServerArgs<DataModel, TCollectionSlug, TPopulate, D>> & {
      paginationOpts?: never;
    },
  ): Promise<DocReturnItem<TCollectionSlug, TPopulate, D>[]>;
  <
    TCollectionSlug extends CollectionSlug,
    const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
    const D extends number = 0,
  >(
    args: BoundServerArgs<FindServerArgs<DataModel, TCollectionSlug, TPopulate, D>> & {
      paginationOpts: PaginationOptions;
    },
  ): Promise<PaginationResult<DocReturnItem<TCollectionSlug, TPopulate, D>>>;
}

export interface BoundSearch<DataModel extends GenericDataModel> {
  <
    TCollectionSlug extends CollectionSlug,
    const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
    const D extends number = 0,
  >(
    args: BoundServerArgs<SearchServerArgs<DataModel, TCollectionSlug, TPopulate, D>> & {
      paginationOpts?: never;
    },
  ): Promise<DocReturnItem<TCollectionSlug, TPopulate, D>[]>;
  <
    TCollectionSlug extends CollectionSlug,
    const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
    const D extends number = 0,
  >(
    args: BoundServerArgs<SearchServerArgs<DataModel, TCollectionSlug, TPopulate, D>> & {
      paginationOpts: PaginationOptions;
    },
  ): Promise<PaginationResult<DocReturnItem<TCollectionSlug, TPopulate, D>>>;
}

export interface VexServerApi<DataModel extends GenericDataModel> {
  get: <
    TCollectionSlug extends CollectionSlug,
    const TPopulate extends PopulateShape<TCollectionSlug> = Record<string, never>,
    const D extends number = 0,
  >(
    args: BoundServerArgs<GetServerArgs<DataModel, TCollectionSlug, TPopulate, D>>,
  ) => Promise<GetReturn<TCollectionSlug, TPopulate, D>>;
  find: BoundFind<DataModel>;
  search: BoundSearch<DataModel>;
  create: <TCollectionSlug extends CollectionSlug>(
    args: BoundServerArgs<CreateServerArgs<DataModel, TCollectionSlug>>,
  ) => Promise<string>;
  update: <TCollectionSlug extends CollectionSlug>(
    args: BoundServerArgs<UpdateServerArgs<DataModel, TCollectionSlug>>,
  ) => Promise<void>;
  remove: <TCollectionSlug extends CollectionSlug>(
    args: BoundServerArgs<RemoveServerArgs<DataModel, TCollectionSlug>>,
  ) => Promise<void>;
  publishedSlugs: <TCollectionSlug extends CollectionSlug>(
    args: BoundServerArgs<PublishedSlugsServerArgs<DataModel, TCollectionSlug>>,
  ) => Promise<PublishedSlug[]>;
  globals: {
    get: <
      TSlug extends GlobalSlug,
      const TPopulate extends GlobalPopulateShape<TSlug> = Record<string, never>,
      const D extends number = 0,
    >(
      args: BoundServerArgs<GetGlobalServerArgs<DataModel, TSlug, TPopulate, D>>,
    ) => Promise<GetGlobalReturn<TSlug, TPopulate, D>>;
    find: (
      args: BoundServerArgs<GenericGlobalsQueryServerArgs<DataModel>>,
    ) => Promise<VexDocumentGlobal[]>;
    upsert: <TSlug extends GlobalSlug = GlobalSlug>(
      args: BoundServerArgs<UpsertGlobalServerArgs<DataModel, TSlug>>,
    ) => Promise<string>;
  };
}

/**
 * Binds `config` and a `getAuth` resolver to the whole server API. Unchanged
 * from `api/server.ts` — see its original docstring for the full rationale
 * and usage example.
 */
export function vexServerApi<DataModel extends GenericDataModel>(options: {
  config: VexConfig;
  getAuth?: (
    ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>,
  ) => Promise<VexApiAuth | undefined>;
}): VexServerApi<DataModel> {
  const { config, getAuth } = options;

  async function inject(
    ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>,
    bypassAccess?: boolean,
  ): Promise<{ config: VexConfig; auth: VexApiAuth | undefined }> {
    const authConfig: VexConfig = bypassAccess === true ? { ...config, access: undefined } : config;
    return { config, auth: await resolveGetAuth({ ctx, config: authConfig, getAuth }) };
  }

  return {
    get: async (args) => {
      const { access, ...rest } = args;
      return (await get({
        access,
        ...rest,
        ...(await inject(rest.ctx, access?.bypass)),
      } as never)) as never;
    },
    find: (async (args: BoundPassthroughArgs<DataModel>) => {
      const { access, ...rest } = args;
      return (await find({
        access,
        ...rest,
        ...(await inject(rest.ctx, access?.bypass)),
      } as never)) as never;
    }) as BoundFind<DataModel>,
    search: (async (args: BoundPassthroughArgs<DataModel>) => {
      const { access, ...rest } = args;
      return (await search({
        access,
        ...rest,
        ...(await inject(rest.ctx, access?.bypass)),
      } as never)) as never;
    }) as BoundSearch<DataModel>,
    create: async (args) => {
      const { access, ...rest } = args;
      return await create({
        access,
        ...rest,
        ...(await inject(rest.ctx, access?.bypass)),
      } as never);
    },
    update: async (args) => {
      const { access, ...rest } = args;
      return await update({
        access,
        ...rest,
        ...(await inject(rest.ctx, access?.bypass)),
      } as never);
    },
    remove: async (args) => {
      const { access, ...rest } = args;
      return await remove({
        access,
        ...rest,
        ...(await inject(rest.ctx, access?.bypass)),
      } as never);
    },
    publishedSlugs: (args) => publishedSlugs(args),
    globals: {
      get: async (args) => {
        const { access, ...rest } = args;
        return (await getGlobal({
          access,
          ...rest,
          ...(await inject(rest.ctx, access?.bypass)),
        } as never)) as never;
      },
      find: async (args) => {
        const { access, ...rest } = args;
        return await findGlobals({
          access,
          ...rest,
          ...(await inject(rest.ctx, access?.bypass)),
        } as never);
      },
      upsert: async (args) => {
        const { access, ...rest } = args;
        return await upsertGlobal({
          access,
          ...rest,
          ...(await inject(rest.ctx, access?.bypass)),
        } as never);
      },
    },
  };
}
```
`GenericGlobalsQueryServerArgs` is imported directly in the `../globals/api` import list
above (Step 4's `globals/api/index.ts` already re-exports it as a type alongside the other
Step 4 exports — this entry point needs no further barrel edit).

Now that `collectionsApi`, `globalsApi`, `versionsApi` and `mediaApi` no longer live beside
`resolveGetAuth`, each imports it from this new path. Edit all four:

#### packages/core/src/collections/api/collectionsApi.ts
1 edit — the `resolveGetAuth` import line:
```ts
import { resolveGetAuth } from "../../server";
```

#### packages/core/src/globals/api/globalsApi.ts
1 edit — the `resolveGetAuth` import line:
```ts
import { resolveGetAuth } from "../../server";
```

#### packages/core/src/versions/api/versionsApi.ts
1 edit — the `resolveGetAuth` import line:
```ts
import { resolveGetAuth } from "../../server";
```

#### packages/core/src/media/api/mediaApi.ts
1 edit — the `resolveGetAuth` import line:
```ts
import { resolveGetAuth } from "../../server";
```

- [ ] `packages/core/package.json` `exports`: `./server` → `src/server.ts`, `./convex` removed; `tsup.config.ts` entry

#### packages/core/package.json
1 edit — the `exports` map. Replace:
```json
    "./server": {
      "source": "./src/api/server.ts",
      "types": "./dist/api/server.d.ts",
      "import": "./dist/api/server.js"
    },
    "./convex": {
      "source": "./src/api/server.ts",
      "types": "./dist/api/server.d.ts",
      "import": "./dist/api/server.js"
    },
```
with:
```json
    "./server": {
      "source": "./src/server.ts",
      "types": "./dist/server.d.ts",
      "import": "./dist/server.js"
    },
```

#### packages/core/tsup.config.ts
1 edit — the `entry` array:
```ts
  entry: ["src/index.ts", "src/server.ts", "src/internal.ts"],
```
The `dts: false` comment above it still applies unchanged (declarations still come from the
separate `tsc --emitDeclarationOnly` step).

- [ ] `src/index.ts` re-export paths; `vexConvexApi` re-exported from `./vexConvexApi`

#### packages/core/src/index.ts
1 edit — replace the six `api/`-rooted lines in the UTILITIES section:
```ts
export type { VexWhere, VexWhereNode } from "./db/queryArgs";
export { validateWhereNode, whereToNode } from "./db/queryArgs";
export * from "./documents/types";
export * from "./db/types";
export { vexConvexApi } from "./vexConvexApi";
export type { GetGlobalReturn } from "./globals/api";
export type { VersionSnapshotResult } from "./versions/api";
```
(`export * from "./api/convex"` became `export * from "./documents/types"` per Step 1 — that
line now re-exports all four document shapes (`VexDocument`/`TDocument`/`VexVersionDocument`/
`VexMediaDocument`) directly, since Step 1 moved all four into `documents/types.ts`; the
existing `export * from "./versions"` / `export * from "./media"` lines elsewhere in this file
also re-export `VexVersionDocument`/`VexMediaDocument` respectively (through the Step 1 barrel
edits to `versions/index.ts`/`media/index.ts`), so each name reaches this barrel twice — once
directly, once through the feature barrel — which is harmless for a wildcard `export *`.
`export * from "./api/types"` becomes `export * from "./db/types"` per Step 2. `vexConvexApi`
gets its own explicit re-export line here — it was previously covered by the `api/convex`
`export *`, and now that it lives in its own `src/vexConvexApi.ts` file (this step) rather than
inside `documents/types.ts`, the barrel names it explicitly rather than relying on a wildcard
that no longer reaches it. The two single-type re-exports now read from the Step 4/5 domain
`api/index.ts` barrels instead of the deleted `api/globals/get.server` / `api/versions/getVersionSnapshot.server` paths.)

- [ ] every `@vexcms/core/convex` import in packages, apps, templates, docs → `@vexcms/core/server`

No code import exists to repoint (see the Note above). The one doc reference inside this
spec's `touches` list:

#### .agent/docs/standards/backend/convex-functions.md
1 edit — the bullet naming where factories live:
```md
- Factories are co-located with their domain's operations (`collections/api/collectionsApi.ts`,
  `globals/api/globalsApi.ts`, `versions/api/versionsApi.ts`, `media/api/mediaApi.ts`), each
  re-exported through `@vexcms/core/server` (`src/server.ts`). `vexConvexApi` — the typed
  cross-domain `anyApi` references used by `@vexcms/react` — lives at `src/vexConvexApi.ts`,
  named after its one export.
```

- [ ] `.changeset/codebase-conventions-refactor.md` — core: `./convex` removed

#### .changeset/codebase-conventions-refactor.md
New file (first spec step to touch the changeset; later steps append their own `---`-free
bullet to the same `@vexcms/core` / `@vexcms/react` sections rather than creating a second
file):
```md
---
"@vexcms/core": patch
---

Breaking (pre-0.1.0): `@vexcms/core/convex` is removed — it was always an identical alias of
`@vexcms/core/server`. Import `collectionsApi`, `globalsApi`, `versionsApi`, `vexServerApi`,
`createVexCallbackApi` and every raw server function from `@vexcms/core/server` instead; no
export name changes, only the subpath goes away.

Internal: `src/api/` is dissolved — collection, global and version server operations now live
beside their domain (`collections/api/`, `globals/api/`, `versions/api/`), `media/api/` moved
to the same `<op>/server.ts` scheme, and the shared read/write pipeline moved to `src/db/`.
All four document shapes (`VexDocument`/`TDocument`/`VexVersionDocument`/`VexMediaDocument`)
now live together in `src/documents/types.ts`, re-exported from `src/versions/`/`src/media/`
for feature-barrel importers; version constants never moved. `vexConvexApi` moved from
`api/convex.ts` to its own `src/vexConvexApi.ts`. No
public import path outside the removed `./convex` subpath changes.
```
(Per P-025, the bump stays `patch` while `.changeset/pre.json` is in pre mode — this is a
breaking removal, but `major`/`minor` are not used pre-0.1.0.)

- [ ] baseline JSON regenerated

```bash
node scripts/export-names.mjs --write
```
Verify this produces a diff against the Step 0 baseline limited to the removal of the
`./convex` entry — no name is added, removed, or renamed under `./server` or `.`.

### Step 8 — App form foundation: `@vexcms/react/form` [agent]
Why: decisions 7–8; the app form's context, `useAppForm`, field layout, control contract, `AppForm` and the shared form helpers it needs, as their own entry.
Verify: `pnpm --filter @vexcms/react build` emits `dist/form/index.js`; `pnpm --filter @vexcms/react test`
- [ ] `packages/react/src/components/ui/field.tsx` (+ barrel export) — shadcn field primitives (`Field`, `FieldContent`, `FieldDescription`, `FieldError`, `FieldLabel`, `FieldGroup`, `FieldLegend`, `FieldSeparator`, `FieldSet`, `FieldTitle`) ported from maprios-app, imports adapted to vex's `ui/label` and `styles/utils` `cn`
- [ ] `packages/react/src/forms/formContext.ts` — `createFormHookContexts`
- [ ] `packages/react/src/forms/types.ts` — `FieldControlProps` (incl. `describedBy`), `RenderControl`, `BaseFormFieldProps`
- [ ] `packages/react/src/forms/FormFieldLayout.tsx` (+ test) — label, required marker, description, error (`isFieldShowingError` moved in), `fieldDescribedBy` (derives `${id}-description`/`${id}-error`, shared with field components building `FieldControlProps`), `before`/`after` nodes, built on `components/ui/field.tsx`; `aria-invalid`/`aria-describedby` land on the control, not the `role="group"` wrapper
- [ ] `packages/react/src/forms/FormCompactContext.tsx`, `packages/react/src/forms/ArrayItemHeaderContext.ts` — moved from `components/form/`; every importer repointed
- [ ] `packages/react/src/forms/AppForm.tsx` (+ test) — ported from `components/form/AppForm.tsx`, providing the app form's `formContext` instead of `AppFormContext`
- [ ] `packages/react/src/forms/changedValues.ts` (+ test) — moved from `components/form/`; every importer repointed; not re-exported from `forms/index.ts`
- [ ] `packages/react/src/forms/useAppForm.ts` — `createFormHook` (field components registered in steps 9–10)
- [ ] `packages/react/src/forms/index.ts`; `package.json` `exports["./form"]`; `tsup.config.ts` entry

The app form is read-only data in, render-prop control out: every field component built on it (steps
9–10) calls `useFieldContext<TValue>()` (never `fieldDef`, `VexConfigContext` or permissions —
decision 7) and `useFormContext()` only to read `state.submissionAttempts` for error timing.
`createFieldInput`, `TypedFieldApi` and `AppFormContext` are NOT reused here — TanStack's own
`AnyFieldApi` / `AnyFormApi` (from `@tanstack/react-form`, re-exported from `@tanstack/form-core`)
replace them, so step 14 can delete the hand-rolled context without this entry touching it.
`AnyFormApi` is already fully `any`-parameterized (`FormApi<any, any, …, any>`), so `AppForm`'s own
props need none of the old context's generic plumbing.

This step moves three files besides the ones it originates, to keep the admin form compiling at
the end of it without duplicating anything: `FormCompactContext.tsx` and `ArrayItemHeaderContext.ts`
move because the ported `AppForm` needs the former, and `changedValues.ts` moves because it is pure
`AnyFormApi` logic with no admin dependency, same as everything else here. The admin components that
still import these three by their old `components/form/` path are repointed below; none of their own
behavior changes. The admin's own `components/form/AppForm.tsx`, `createFieldInput`, `AppFormContext`
and every other admin form file are untouched and keep working exactly as before — only steps 12–14
retire them.

#### packages/react/src/components/ui/field.tsx

```tsx
"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { useMemo } from "react";
import type { ComponentProps, ReactNode } from "react";
import { Label } from "./label";
import { Separator } from "./separator";
import { cn } from "../../styles/utils";

/** Groups a set of {@link Field}s with consistent vertical rhythm. */
export function FieldGroup({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "gap-7 data-[slot=checkbox-group]:gap-3 [&>[data-slot=field-group]]:gap-4 group/field-group @container/field-group flex w-full flex-col",
        className,
      )}
      data-slot="field-group"
      {...props}
    />
  );
}

/** A `<legend>` for a {@link FieldSet}, in `"label"` or `"legend"` type size. */
export function FieldLegend({
  className,
  variant = "legend",
  ...props
}: ComponentProps<"legend"> & { variant?: "label" | "legend" }) {
  return (
    <legend
      className={cn(
        "mb-3 font-medium data-[variant=label]:text-sm data-[variant=legend]:text-base",
        className,
      )}
      data-slot="field-legend"
      data-variant={variant}
      {...props}
    />
  );
}

/** A `<fieldset>` grouping related {@link Field}s. */
export function FieldSet({ className, ...props }: ComponentProps<"fieldset">) {
  return (
    <fieldset
      className={cn(
        "gap-6 has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3 flex flex-col",
        className,
      )}
      data-slot="field-set"
      {...props}
    />
  );
}

const fieldVariants = cva("data-[invalid=true]:text-destructive gap-3 group/field flex w-full", {
  defaultVariants: {
    orientation: "vertical",
  },
  variants: {
    orientation: {
      horizontal:
        "flex-row items-center [&>[data-slot=field-label]]:flex-auto has-[>[data-slot=field-content]]:items-start has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      responsive:
        "flex-col [&>*]:w-full [&>.sr-only]:w-auto @md/field-group:flex-row @md/field-group:items-center @md/field-group:[&>*]:w-auto @md/field-group:[&>[data-slot=field-label]]:flex-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      vertical: "flex-col [&>*]:w-full [&>.sr-only]:w-auto",
    },
  },
});

/** One label/control/description/error group. `role="group"` so screen readers announce it as a unit. */
export function Field({
  className,
  orientation = "vertical",
  ...props
}: ComponentProps<"div"> & VariantProps<typeof fieldVariants>) {
  return (
    <div
      className={cn(fieldVariants({ orientation }), className)}
      data-orientation={orientation}
      data-slot="field"
      role="group"
      {...props}
    />
  );
}

/** Wraps a {@link Field}'s control plus its description/error, beside its {@link FieldLabel}. */
export function FieldContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("gap-1 group/field-content flex flex-1 flex-col leading-snug", className)}
      data-slot="field-content"
      {...props}
    />
  );
}

/** Helper text under a {@link Field}'s control. */
export function FieldDescription({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "text-muted-foreground text-left text-sm [[data-variant=legend]+&]:-mt-1.5 leading-normal font-normal group-has-[[data-orientation=horizontal]]/field:text-balance",
        "last:mt-0 nth-last-2:-mt-1",
        "[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4",
        className,
      )}
      data-slot="field-description"
      {...props}
    />
  );
}

/**
 * A {@link Field}'s validation error — `children` when given, otherwise the
 * single message from `errors`, or a bulleted list when `errors` holds more
 * than one distinct message. Renders nothing when there is no content.
 */
export function FieldError({
  children,
  className,
  errors,
  ...props
}: ComponentProps<"div"> & {
  errors?: Array<undefined | { message?: string }>;
}) {
  const content = useMemo<ReactNode>(() => {
    if (children) return children;
    if (!errors?.length) return null;
    const uniqueErrors = [...new Map(errors.map((error) => [error?.message, error])).values()];
    if (uniqueErrors.length === 1) return uniqueErrors[0]?.message;
    return (
      <ul className="ml-4 flex list-disc flex-col gap-1">
        {uniqueErrors.map((error, index) => error?.message && <li key={index}>{error.message}</li>)}
      </ul>
    );
  }, [children, errors]);

  if (!content) return null;

  return (
    <div
      className={cn("text-destructive text-sm font-normal", className)}
      data-slot="field-error"
      role="alert"
      {...props}
    >
      {content}
    </div>
  );
}

/** A {@link Field}'s label. */
export function FieldLabel({ className, ...props }: ComponentProps<typeof Label>) {
  return (
    <Label
      className={cn(
        "has-data-checked:bg-primary/5 has-data-checked:border-primary dark:has-data-checked:bg-primary/10 gap-2 group-data-[disabled=true]/field:opacity-50 has-[>[data-slot=field]]:rounded-md has-[>[data-slot=field]]:border [&>*]:data-[slot=field]:p-3 group/field-label peer/field-label flex w-fit leading-snug",
        "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col",
        className,
      )}
      data-slot="field-label"
      {...props}
    />
  );
}

/** A horizontal rule between {@link Field}s, optionally with centered `children`. */
export function FieldSeparator({
  children,
  className,
  ...props
}: ComponentProps<"div"> & { children?: ReactNode }) {
  return (
    <div
      className={cn(
        "-my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2 relative",
        className,
      )}
      data-content={!!children}
      data-slot="field-separator"
      {...props}
    >
      <Separator className="absolute inset-0 top-1/2" />
      {children && (
        <span
          className="text-muted-foreground px-2 bg-background relative mx-auto block w-fit"
          data-slot="field-separator-content"
        >
          {children}
        </span>
      )}
    </div>
  );
}

/** A {@link Field}'s title, for a `Field` whose control is itself a labelled group. */
export function FieldTitle({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "gap-2 text-sm font-medium group-data-[disabled=true]/field:opacity-50 flex w-fit items-center leading-snug",
        className,
      )}
      data-slot="field-label"
      {...props}
    />
  );
}
```

#### packages/react/src/components/ui/index.ts

1 edit — new barrel export, alongside the other `ui/` exports.

```ts
export * from "./field";
```

#### packages/react/src/forms/types.ts

```ts
"use client";

import type { ReactNode } from "react";

/**
 * Props a `renderControl` override receives in place of a form field's
 * default `ui/` control. Matches the `admin.components.Input` override
 * contract (decision 5, core `fields/types.ts` `FieldControlProps` — same
 * shape, declared independently here since this entry never imports
 * `@vexcms/core`'s field-definition types).
 */
export interface FieldControlProps<TValue = unknown> {
  /** The control's DOM id — the form field's `<label htmlFor>` already points at this. */
  id: string;
  /** The field's current value. */
  value: TValue;
  /** Commits a new value to the form. */
  onChange: (value: TValue) => void;
  /** Marks the field touched — drives `FormFieldLayout`'s error timing. */
  onBlur: () => void;
  /** Whether the control must reject edits. */
  readOnly: boolean;
  /** Whether `FormFieldLayout` is currently showing a validation error for this field. */
  invalid: boolean;
  /** The control's `aria-describedby` value — joins `FormFieldLayout`'s description/error ids for this field's `id`; `undefined` when neither applies. See {@link fieldDescribedBy}. */
  describedBy: string | undefined;
}
/** Renders a form field's control in place of its default `ui/` control. */
export type RenderControl<TValue = unknown> = (props: FieldControlProps<TValue>) => ReactNode;

/**
 * Props every app form field component accepts beneath its value-specific
 * props — plain data only, lifted from what each admin `Input.tsx` used to
 * read off `fieldDef` (`fieldDef.label`, `.description`, `.required`,
 * `.admin.readOnly`).
 */
export interface BaseFormFieldProps<TValue = unknown> {
  /** Rendered by `FormFieldLayout`; omit to render no label block (e.g. `CheckboxField`'s inline label). */
  label?: string;
  /** Rendered by `FormFieldLayout` under the control, hidden when absent. */
  description?: string;
  /** Shows the `FormFieldLayout` required marker and sets `aria-required` on the default control. */
  required?: boolean;
  /** Forwarded to the default control's `disabled`/`readOnly`, and to a `renderControl` override. */
  readOnly?: boolean;
  /** Array-item position — `FormFieldLayout` renders it as the `[n] -` label prefix. */
  index?: number;
  /** Replaces the default `ui/` control; see {@link RenderControl}. */
  renderControl?: RenderControl<TValue>;
  /** Rendered by `FormFieldLayout` before the control. */
  before?: ReactNode;
  /** Rendered by `FormFieldLayout` after the control, before the description/error. */
  after?: ReactNode;
  /** Forwarded to `FormFieldLayout`'s outer element. */
  className?: string;
}
```

#### packages/react/src/forms/formContext.ts

```ts
"use client";

import { createFormHookContexts } from "@tanstack/react-form";

/**
 * The app form's field/form context pair — every form field component reads
 * `useFieldContext()`, every form-level component reads `useFormContext()`.
 * Passed into `createFormHook` in `useAppForm.ts`.
 *
 * @see {@link https://tanstack.com/form/latest/docs/framework/react/guides/form-composition}
 */
export const { fieldContext, useFieldContext, formContext, useFormContext } =
  createFormHookContexts();
```

#### packages/react/src/forms/FormFieldLayout.tsx

```tsx
"use client";

import type { AnyFieldApi, ReactNode } from "@tanstack/react-form";
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from "../components/ui/field";

/**
 * Extracts a field's current validation-error message, if any. TanStack Form
 * v1 stores Standard Schema issue objects in `errors[]`, not strings — this
 * reads `.message` when the error is an object (Zod v4 issues carry
 * `{ origin, code, minimum, inclusive, path, message }`).
 *
 * Moved in unchanged from the deleted `components/form/FormError.tsx`.
 *
 * @param field - The field whose current error message to extract.
 * @returns The error message, or `undefined` if the field has no error.
 */
function getFieldErrorMessage(field: AnyFieldApi): string | undefined {
  const rawError = field.state.meta.errors[0];
  return typeof rawError === "string"
    ? rawError
    : (rawError as { message?: string } | undefined)?.message;
}

/**
 * Whether a field should currently present as invalid — touched or a
 * submission has been attempted, and a real error is present. Every app form
 * field uses this both for `FormFieldLayout`'s own error text and for the
 * `invalid` flag a `renderControl` override receives, so the control's
 * `aria-invalid` and the visible message stay in lockstep.
 *
 * @param props.field - The field to check.
 * @param props.submissionAttempts - `useFormContext().store.state.submissionAttempts`.
 * @returns `true` if the field's error should currently be shown.
 */
export function isFieldShowingError(props: {
  field: AnyFieldApi;
  submissionAttempts: number;
}): boolean {
  const errorMessage = getFieldErrorMessage(props.field);
  return Boolean(
    (props.field.state.meta.isTouched || props.submissionAttempts > 0) && errorMessage,
  );
}

/**
 * The `aria-describedby` value a form field's control should receive —
 * joins the description and error ids `FormFieldLayout` renders for `id`,
 * omitting whichever one does not apply. Exported so field components can
 * build the same ids for their `FieldControlProps.describedBy` before
 * `FormFieldLayout` itself renders — the control is `FormFieldLayout`'s
 * `children`, built by its caller, so `aria-invalid`/`aria-describedby` land
 * on the control itself rather than the `role="group"` wrapper.
 *
 * @param props.id - The field's DOM id.
 * @param props.hasDescription - Whether `FormFieldLayout` will render a description.
 * @param props.showError - Whether `FormFieldLayout` will render the error (see {@link isFieldShowingError}).
 * @returns The joined id string, or `undefined` when neither applies.
 */
export function fieldDescribedBy(props: {
  id: string;
  hasDescription: boolean;
  showError: boolean;
}): string | undefined {
  const descriptionId = props.hasDescription ? `${props.id}-description` : null;
  const errorId = props.showError ? `${props.id}-error` : null;
  return [descriptionId, errorId].filter((id): id is string => id !== null).join(" ") || undefined;
}

/**
 * The layout every app form field renders its control inside: label with
 * required marker and `[n] -` index prefix, the control (`children`),
 * optional `before`/`after` nodes flanking it, description, and the
 * validation error — built on `components/ui/field.tsx`'s shadcn field
 * primitives.
 *
 * @param props.id - The control's DOM id; the label's `htmlFor` target.
 * @param props.label - Label text. No label block renders when omitted.
 * @param props.required - Shows the `*` marker beside the label.
 * @param props.description - Helper text rendered under the control.
 * @param props.index - Array-item position, rendered as `[n] -` before the label.
 * @param props.field - The field whose error state to render.
 * @param props.submissionAttempts - Drives {@link isFieldShowingError}'s timing.
 * @param props.before - Rendered immediately before `children`.
 * @param props.after - Rendered immediately after `children`.
 * @param props.children - The control.
 * @param props.className - Additional classes on the outer `Field`.
 * @returns The field's label/control/description/error stack.
 */

export function FormFieldLayout(props: {
  id: string;
  label?: string;
  required?: boolean;
  description?: string;
  index?: number;
  field: AnyFieldApi;
  submissionAttempts: number;
  before?: ReactNode;
  after?: ReactNode;
  children: ReactNode;
  className?: string;
}): ReactNode {
  const errorMessage = getFieldErrorMessage(props.field);
  const showError = isFieldShowingError({
    field: props.field,
    submissionAttempts: props.submissionAttempts,
  });
  const descriptionId = `${props.id}-description`;
  const errorId = `${props.id}-error`;

  return (
    <Field className={props.className} data-invalid={showError}>
      {props.label !== undefined && (
        <FieldLabel htmlFor={props.id} id={`${props.id}-label`}>
          {props.index !== undefined ? `[${props.index + 1}] - ` : ""}
          {props.label}
          {props.required && <span className="text-red-500">*</span>}
        </FieldLabel>
      )}
      <FieldContent>
        {props.before}
        {props.children}
        {props.after}
        {props.description && <FieldDescription id={descriptionId}>{props.description}</FieldDescription>}
        {showError && (
          <FieldError id={errorId} role="alert">
            {errorMessage}
          </FieldError>
        )}
      </FieldContent>
    </Field>
  );
}
```

> Note: `FormLabel`'s sr-only `HideFieldLabelContext` (hiding a non-grouped array item's redundant
> per-item label while keeping it in the a11y tree) has no equivalent here — it is not in this
> step's checklist. `ArrayField` (step 10) owns the per-item gutter number instead; whether a form
> field's own label still renders inside an array item is a step 10 design call, not step 8's.

#### packages/react/src/forms/FormFieldLayout.test.tsx

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { useForm } from "@tanstack/react-form";
import { FormFieldLayout, fieldDescribedBy, isFieldShowingError } from "./FormFieldLayout";

function Harness(props: {
  initialValue: string;
  required?: boolean;
  description?: string;
  index?: number;
  submissionAttempts?: number;
  validate?: (value: string) => string | undefined;
}) {
  const form = useForm({
    defaultValues: { name: props.initialValue },
  });
  return (
    <form.Field
      name="name"
      validators={props.validate ? { onChange: ({ value }) => props.validate!(value) } : undefined}
    >
      {(field) => {
        const showError = isFieldShowingError({ field, submissionAttempts: props.submissionAttempts ?? 0 });
        const describedBy = fieldDescribedBy({
          id: "name",
          hasDescription: Boolean(props.description),
          showError,
        });
        return (
          <FormFieldLayout
            id="name"
            label="Name"
            required={props.required}
            description={props.description}
            index={props.index}
            field={field}
            submissionAttempts={props.submissionAttempts ?? 0}
          >
            <input
              id="name"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              aria-invalid={showError}
              aria-describedby={describedBy}
            />
          </FormFieldLayout>
        );
      }}
    </form.Field>
  );
}

describe("FormFieldLayout", () => {
  it("renders the label with the required marker and an index prefix", () => {
    render(<Harness initialValue="" required index={2} />);
    const label = screen.getByText(/Name/).closest("label")!;
    expect(label.textContent).toBe("[3] - Name*");
  });

  it("renders no label block when label is omitted", () => {
    render(<Harness initialValue="" />);
    expect(screen.queryByText("Name")).not.toBeInTheDocument();
  });

  it("shows the description only when provided", () => {
    const { rerender } = render(<Harness initialValue="" />);
    expect(screen.queryByText("Helper text")).not.toBeInTheDocument();
    rerender(<Harness initialValue="" description="Helper text" />);
    expect(screen.getByText("Helper text")).toBeInTheDocument();
  });

  it("shows the error only after submissionAttempts > 0 with no prior touch", () => {
    render(<Harness initialValue="" validate={(v) => (v ? undefined : "Required")} submissionAttempts={1} />);
    expect(screen.getByText("Required")).toBeInTheDocument();
  });

  it("hides the error before any submission attempt or touch", () => {
    render(<Harness initialValue="" validate={(v) => (v ? undefined : "Required")} submissionAttempts={0} />);
    expect(screen.queryByText("Required")).not.toBeInTheDocument();
  });

  it("sets aria-invalid and aria-describedby on the control, not the role=group wrapper", () => {
    render(
      <Harness
        initialValue=""
        description="Helper text"
        validate={(v) => (v ? undefined : "Required")}
        submissionAttempts={1}
      />,
    );
    const control = screen.getByRole("textbox");
    expect(control).toHaveAttribute("aria-invalid", "true");
    expect(control.getAttribute("aria-describedby")).toBe("name-description name-error");
    const group = screen.getByRole("group");
    expect(group).not.toHaveAttribute("aria-invalid");
    expect(group).not.toHaveAttribute("aria-describedby");
  });
});

describe("isFieldShowingError", () => {
  it("is false with zero submission attempts and an untouched field", () => {
    const field = {
      state: { meta: { errors: ["Required"], isTouched: false } },
    } as unknown as Parameters<typeof isFieldShowingError>[0]["field"];
    expect(isFieldShowingError({ field, submissionAttempts: 0 })).toBe(false);
  });

  it("reads a Standard Schema issue's message property", () => {
    const field = {
      state: { meta: { errors: [{ message: "Too short" }], isTouched: true } },
    } as unknown as Parameters<typeof isFieldShowingError>[0]["field"];
    expect(isFieldShowingError({ field, submissionAttempts: 0 })).toBe(true);
  });
});
```

#### packages/react/src/forms/FormCompactContext.tsx

`git mv packages/react/src/components/form/FormCompactContext.tsx packages/react/src/forms/FormCompactContext.tsx` — unchanged (no import in this file points at anything that moved).

#### packages/react/src/forms/ArrayItemHeaderContext.ts

`git mv packages/react/src/components/form/ArrayItemHeaderContext.ts packages/react/src/forms/ArrayItemHeaderContext.ts` — unchanged.

#### packages/react/src/components/form/AppForm.tsx

1 edit — repoint the relative import of the moved `FormCompactContext`.

```ts
-import { FormCompactContext, useMeasuredCompact } from "./FormCompactContext";
+import { FormCompactContext, useMeasuredCompact } from "../../forms/FormCompactContext";
```

#### packages/react/src/components/form/BlockActionsMenu.tsx

1 edit.

```ts
-import { useCompactForm } from "./FormCompactContext";
+import { useCompactForm } from "../../forms/FormCompactContext";
```

#### packages/react/src/components/form/BlockActionsMenu.test.tsx

1 edit.

```ts
-import { FormCompactContext } from "./FormCompactContext";
+import { FormCompactContext } from "../../forms/FormCompactContext";
```

#### packages/react/src/components/form/FormArray.tsx

2 edits.

```ts
-import { useCompactForm } from "./FormCompactContext";
+import { useCompactForm } from "../../forms/FormCompactContext";
```

```ts
-import { ArrayItemHeaderContext, type ArrayItemsOpenSignal } from "./ArrayItemHeaderContext";
+import { ArrayItemHeaderContext, type ArrayItemsOpenSignal } from "../../forms/ArrayItemHeaderContext";
```

#### packages/react/src/components/form/FormBlocks.tsx

1 edit.

```ts
-import { useMeasuredCompact } from "./FormCompactContext";
+import { useMeasuredCompact } from "../../forms/FormCompactContext";
```

#### packages/react/src/components/form/FormGroup.tsx

1 edit.

```ts
-import { ArrayItemHeaderContext } from "./ArrayItemHeaderContext";
+import { ArrayItemHeaderContext } from "../../forms/ArrayItemHeaderContext";
```

#### packages/react/src/components/views/CollectionEditView.tsx

1 edit.

```ts
-import { FormCompactProvider } from "../forms/FormCompactContext";
+import { FormCompactProvider } from "../../forms/FormCompactContext";
```

#### packages/react/src/components/views/GlobalEditView.tsx

1 edit.

```ts
-import { FormCompactProvider } from "../forms/FormCompactContext";
+import { FormCompactProvider } from "../../forms/FormCompactContext";
```

#### packages/react/src/forms/AppForm.tsx

Ported from `components/form/AppForm.tsx`: same `<form>` element, `handleSubmit`, scroll-to-first-error
(`focusFirstFieldError`/`nearestScroller`, unchanged), `DndProvider`, `FormCompactContext.Provider`.
The only behavioral change is the provider it distributes — the app form's own `formContext`
(from `./formContext`) in place of the old hand-rolled `AppFormContext` — and the prop type, which
is now plain `AnyFormApi` (TanStack's own fully-`any`-parameterized alias) instead of the explicit
generic parameter list the old context type required.

```tsx
"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { type AnyFormApi, useStore } from "@tanstack/react-form";
import { formContext } from "./formContext";
import { DndProvider } from "../components/ui/dnd";
import { ACCORDION_TRANSITION_MS } from "../components/ui/accordion";
import { cn } from "../styles/utils";
import { FormCompactContext, useMeasuredCompact } from "./FormCompactContext";

/**
 * The attempt number of the latest submit that ended without success, `0`
 * until the first one (or while a submit is in flight). A local copy of the
 * one pure helper `AppForm` needs — defined here rather than imported from
 * `forms/useFieldErrorCount.ts` (step 10) to avoid a forward reference to a
 * file this step does not yet create; step 10's `useFieldErrorCount.ts`
 * exports the identical function for its own callers, not re-exported from
 * here.
 *
 * @param state - The form store state to read submission status from.
 * @returns The failed attempt number, or `0` if no attempt has failed yet.
 */
function failedSubmitAttemptOf(state: {
  submissionAttempts: number;
  isSubmitting: boolean;
  isSubmitSuccessful: boolean;
}): number {
  return state.submissionAttempts > 0 && !state.isSubmitting && !state.isSubmitSuccessful
    ? state.submissionAttempts
    : 0;
}

/**
 * Provides a TanStack Form instance to all descendant app form field
 * components via `formContext`.
 *
 * Wrap any set of `forms/*Field.tsx` components (rendered through
 * `form.AppField`) in `<AppForm>` and they read the form from context — no
 * prop threading needed.
 *
 * The `<form>` is `noValidate`: this app's own Zod schemas are the single
 * source of truth for validation messages, rendered through
 * `FormFieldLayout`. Any field that also sets a native HTML constraint
 * attribute (e.g. `checkbox`'s `required`, kept for its ARIA/semantic value)
 * would otherwise trigger the browser's own constraint-validation UI on
 * submit — which blocks the submit event entirely before this app's
 * `onSubmit` validator ever runs, so the custom message never renders.
 *
 * @param props - Component props.
 * @param props.form - The TanStack Form instance created by `useForm` (or
 *   `useAppForm`). Provided to all descendant field components via
 *   `formContext`.
 * @param props.children - Field components and any other form content
 *   (submit button, etc.).
 * @param props.className - Optional CSS class applied to the `<form>` element.
 * @returns A `<form>` element wrapped in `formContext.Provider`, distributing
 *   the form instance to all descendant field components.
 * @example
 * ```tsx
 * const form = useAppForm({ defaultValues: { title: "", slug: "" } })
 *
 * <AppForm form={form}>
 *   <form.AppField name="title">{(field) => <field.TextField label="Title" />}</form.AppField>
 *   <form.AppField name="slug">{(field) => <field.TextField label="Slug" />}</form.AppField>
 * </AppForm>
 * ```
 */
export function AppForm(props: {
  form: AnyFormApi;
  children: ReactNode;
  className?: string;
}): ReactNode {
  const formRef = useRef<HTMLFormElement>(null);
  const failedSubmitAttempt = useStore(props.form.store, failedSubmitAttemptOf);
  const compact = useMeasuredCompact(formRef);
  useEffect(() => {
    if (failedSubmitAttempt === 0) return;
    let cancelled = false;
    let scrollTimer: number | undefined;
    const validateTimer = window.setTimeout(async () => {
      await props.form.validate("submit");
      if (cancelled) return;
      scrollTimer = window.setTimeout(() => {
        if (!cancelled && formRef.current) focusFirstFieldError(formRef.current);
      }, ACCORDION_TRANSITION_MS);
    });
    return () => {
      cancelled = true;
      window.clearTimeout(validateTimer);
      window.clearTimeout(scrollTimer);
    };
  }, [failedSubmitAttempt]);

  return (
    <formContext.Provider value={props.form}>
      <FormCompactContext.Provider value={compact}>
        <DndProvider>
          <form
            ref={formRef}
            className={cn("@container/form", props.className)}
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              props.form.handleSubmit();
            }}
          >
            {props.children}
          </form>
        </DndProvider>
      </FormCompactContext.Provider>
    </formContext.Provider>
  );
}

const FOCUSABLE_SELECTOR =
  'input:not([type="hidden"]), textarea, select, [contenteditable="true"], button, [tabindex]:not([tabindex="-1"])';

/**
 * Scrolls the first visible errored field to the center of its nearest
 * scrolling ancestor and focuses its control. "First" is DOM order among
 * `[data-field-invalid]` wrappers that are not inside a hidden panel; a
 * wrapper is marked when it or anything under it has an error, so the
 * innermost one (no marked descendant) is the field itself rather than its
 * group or array.
 *
 * Not `scrollIntoView`: that scrolls every scrollable ancestor, and the admin
 * shell's `main` sits around the form's own scroller with a few pixels of
 * overflow — it would scroll `main` too and leave the page shifted past its
 * bottom.
 *
 * @param root - The form's root element to search within.
 */
function focusFirstFieldError(root: HTMLElement): void {
  const visible = [...root.querySelectorAll<HTMLElement>("[data-field-invalid]")].filter(
    (element) => element.closest("[hidden]") === null,
  );
  const target = visible.find(
    (element) => !visible.some((other) => other !== element && element.contains(other)),
  );
  if (!target) return;
  const scroller = nearestScroller(target);
  if (scroller) {
    const scrollerRect = scroller.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const centerOffset =
      targetRect.top - scrollerRect.top - (scroller.clientHeight - targetRect.height) / 2;
    scroller.scrollTo({ top: scroller.scrollTop + centerOffset, behavior: "smooth" });
  }
  target.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus({ preventScroll: true });
}

function nearestScroller(element: HTMLElement): HTMLElement | null {
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    const { overflowY } = getComputedStyle(parent);
    if ((overflowY === "auto" || overflowY === "scroll") && parent.scrollHeight > parent.clientHeight) {
      return parent;
    }
  }
  return null;
}
```

#### packages/react/src/forms/AppForm.test.tsx

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { AppForm } from "./AppForm";
import { useFormContext } from "./formContext";
import { useCompactForm } from "./FormCompactContext";

function Harness(props: { onSubmit: () => void; validate?: boolean }) {
  const form = useForm({
    defaultValues: { name: "" },
    validators: props.validate
      ? { onSubmit: ({ value }) => (value.name ? undefined : { fields: { name: "Required" } }) }
      : undefined,
    onSubmit: props.onSubmit,
  });
  return (
    <AppForm form={form} className="extra">
      <form.Field name="name">
        {(field) => (
          <div data-field-invalid={field.state.meta.errors.length > 0 ? "" : undefined}>
            <input
              aria-label="name"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      </form.Field>
      <button type="submit">Save</button>
    </AppForm>
  );
}

describe("AppForm", () => {
  it("renders a noValidate form with the @container/form class and the caller's className", () => {
    render(<Harness onSubmit={vi.fn()} />);
    const form = screen.getByRole("textbox", { name: "name" }).closest("form")!;
    expect(form).toHaveAttribute("noValidate");
    expect(form.className).toContain("@container/form");
    expect(form.className).toContain("extra");
  });

  it("calls handleSubmit instead of letting the browser navigate on submit", async () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} validate={false} />);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("provides formContext to descendants", () => {
    function Reader() {
      const form = useFormContext();
      return <span>{String(form.state.values.name === "")}</span>;
    }
    const form = useForm({ defaultValues: { name: "" } });
    render(
      <AppForm form={form}>
        <Reader />
      </AppForm>,
    );
    expect(screen.getByText("true")).toBeInTheDocument();
  });

  it("provides FormCompactContext to descendants", () => {
    function Reader() {
      return <span>{String(useCompactForm())}</span>;
    }
    const form = useForm({ defaultValues: { name: "" } });
    render(
      <AppForm form={form}>
        <Reader />
      </AppForm>,
    );
    expect(screen.getByText("false")).toBeInTheDocument();
  });
});
```

#### packages/react/src/forms/changedValues.ts

`git mv packages/react/src/components/form/changedValues.ts packages/react/src/forms/changedValues.ts`,
then 1 edit for the relative import of the moved `AnyFormApi`-equivalent type — this file now takes
TanStack's own `AnyFormApi` instead of the old context's re-export.

```ts
-import type { AnyFormApi } from "./AppFormContext";
+import type { AnyFormApi } from "@tanstack/react-form";
```

The rest of `changedValues.ts` (`isFieldKeyDirty`, `changedValues`) is unchanged.

#### packages/react/src/forms/changedValues.test.tsx

`git mv packages/react/src/components/form/changedValues.test.tsx packages/react/src/forms/changedValues.test.tsx`,
then 1 edit for the same import.

```ts
-import type { AnyFormApi } from "./AppFormContext";
+import type { AnyFormApi } from "@tanstack/react-form";
```

#### packages/react/src/components/form/index.ts

1 edit — drop the barrel export of the moved file (the admin barrel no longer owns it).

```ts
-export * from "./changedValues";
```

#### packages/react/src/components/views/CollectionEditView.tsx

1 edit — repoint `changedValues`.

```ts
-import { changedValues } from "../forms/changedValues";
+import { changedValues } from "../../forms/changedValues";
```

#### packages/react/src/components/views/GlobalEditView.tsx

1 edit.

```ts
-import { changedValues } from "../forms/changedValues";
+import { changedValues } from "../../forms/changedValues";
```

#### packages/react/src/components/views/MediaCollectionEditView.tsx

1 edit.

```ts
-import { changedValues } from "../forms/changedValues";
+import { changedValues } from "../../forms/changedValues";
```

#### packages/react/src/hooks/useLiveFieldMerge.ts

1 edit.

```ts
-import { isFieldKeyDirty } from "../components/form/changedValues";
+import { isFieldKeyDirty } from "../forms/changedValues";
```

#### packages/react/src/hooks/useLiveFieldMerge.test.tsx

1 edit.

```ts
-import { changedValues, isFieldKeyDirty } from "../components/form/changedValues";
+import { changedValues, isFieldKeyDirty } from "../forms/changedValues";
```

#### packages/react/src/hooks/useResetWhenSaved.ts

1 edit.

```ts
-import { changedValues } from "../components/form/changedValues";
+import { changedValues } from "../forms/changedValues";
```

#### packages/react/src/hooks/useResetWhenSaved.test.tsx

1 edit.

```ts
-import { changedValues } from "../components/form/changedValues";
+import { changedValues } from "../forms/changedValues";
```

#### packages/react/src/forms/useAppForm.ts

```ts
"use client";

import { createFormHook } from "@tanstack/react-form";
import { fieldContext, formContext } from "./formContext";

/**
 * The app form's `useAppForm` / `withForm` pair — registers every
 * `forms/*Field.tsx` component under `field.<Name>` inside `<form.AppField>`,
 * and every form-level component under `form.<Name>`.
 *
 * `fieldComponents` grows as steps 9–10 land each field; it starts empty so
 * this step's build is self-contained.
 *
 * @see {@link https://tanstack.com/form/latest/docs/framework/react/guides/form-composition}
 */
export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {},
  formComponents: {},
});
```

#### packages/react/src/forms/index.ts

```ts
"use client";

export { fieldContext, formContext, useFieldContext, useFormContext } from "./formContext";
export { FormFieldLayout, fieldDescribedBy, isFieldShowingError } from "./FormFieldLayout";
export type { FieldControlProps, RenderControl, BaseFormFieldProps } from "./types";
export { AppForm } from "./AppForm";
export { FormCompactContext, FormCompactProvider, useCompactForm, useMeasuredCompact, FORM_COMPACT_WIDTH_PX } from "./FormCompactContext";
export { ArrayItemHeaderContext, type ArrayItemHeader, type ArrayItemsOpenSignal } from "./ArrayItemHeaderContext";
export { useAppForm, withForm } from "./useAppForm";
```

`changedValues.ts` is deliberately NOT re-exported here — it stays internal to the package (consumed
by `components/views/*EditView.tsx` and `hooks/useLiveFieldMerge.ts`/`useResetWhenSaved.ts` via its
`forms/changedValues` path), not part of the `@vexcms/react/form` public surface.

#### packages/react/package.json

1 edit — new `"./form"` entry in `exports`, alongside the existing `"./client"` entry.

```json
    "./form": {
      "source": "./src/forms/index.ts",
      "types": "./dist/form/index.d.ts",
      "import": "./dist/form/index.js"
    },
```

#### packages/react/tsup.config.ts

1 edit — a fourth entry beside `index`, `client/index` and `testing/index` in the `entry` object
(`:27-31`), so `splitting: true` folds `forms/index.js` into the same shared-chunk build the file's
own banner comment requires (P-022/ADR-009 — do not split this into a second `tsup` config):

```ts
  entry: {
    index: "src/index.ts",
    "client/index": "src/client/index.ts",
    "form/index": "src/forms/index.ts",
    "testing/index": "src/testing/index.ts",
  },
```

### Step 9 — App form leaf fields [agent]
Why: decision 7; every scalar field as a `useFieldContext` app-form component with plain props and `renderControl`.
Verify: `pnpm --filter @vexcms/react test`
- [ ] `forms/{TextField,TextareaField,EmailField,UrlField,NumberField,CheckboxField,SelectField,DateField,ColorField,JsonField}.tsx` + colocated tests (rendered under a bare `useAppForm`, no `VexConfigProvider`)
- [ ] registered in `useAppForm.ts` `fieldComponents`

Each component below is the plain-data half of its matching admin `components/fields/<type>/Input.tsx`
(read in full for this step): everything that file read off `fieldDef`, `fieldDef.admin` or
`VexConfigContext` becomes a prop here, and everything it read off `createFieldInput`'s injected
`field`/`submissionAttempts` is now `useFieldContext()`/`useFormContext()`. Three things explicitly
do **not** come along, because they are admin-only wiring (decision 7's "never fieldDef, config,
permissions") that step 12 re-adds via `renderControl`/`admin.components.Input`:

- **Input masking** (`text`, `email`, `url`, `number`) — `resolveFieldMask` reads
  `VexConfigContext.fields.inputMasks` and `fieldDef.admin.mask`. Step 12's `Field.tsx` resolves the
  mask and, when one applies, passes a masked `renderControl` into the app-form field instead of
  relying on its default `ui/input` control.
- **`useModalSurface()`** (`select`'s dropdown) stays — it reads a plain UI surface context (portal
  nesting), not config or permissions, so it is still called from inside the app-form component.
- **Theme-token reading** (`color`) moves wholesale into the app form — `readThemeColorTokens` walks
  the DOM/CSSOM, not `fieldDef`, so it has no admin dependency to strip; the admin
  `components/fields/color/utils.ts` copy goes away (step 14 cleanup) rather than being duplicated.
- **JSON parse/stringify** (`json`) moves wholesale into the app form for the same reason —
  `parseJsonFieldText`/`stringifyJsonFieldValue` never touched `fieldDef`.

`@vexcms/core` stays importable from this entry for plain, non-admin types/values (`ColorFormat`,
`parseColor`, `serializeColor` below) — decision 8's "no admin graph" bars `VexConfigContext`,
`fields/registry`, slots and permission reads, not core's framework-agnostic exports.

#### packages/react/src/forms/TextField.tsx

```tsx
"use client";

import type { ReactNode } from "react";
import { useStore } from "@tanstack/react-form";
import { useFieldContext, useFormContext } from "./formContext";
import { FormFieldLayout, fieldDescribedBy, isFieldShowingError } from "./FormFieldLayout";
import { Input } from "../components/ui/input";
import type { BaseFormFieldProps } from "./types";

export interface TextFieldProps extends BaseFormFieldProps<string> {
  /** Forwarded to the default control's `placeholder`. */
  placeholder?: string;
  /** Shows a `length/maxLength` counter under the control — informational only, ports `text/Input.tsx`'s counter. */
  maxLength?: number;
}

/**
 * A single-line text field bound to the nearest `<form.AppField name="...">`.
 *
 * @param props - See {@link TextFieldProps} and {@link BaseFormFieldProps}.
 * @returns The labelled control, counter, description and error.
 */
export function TextField(props: TextFieldProps): ReactNode {
  const field = useFieldContext<string>();
  const form = useFormContext();
  const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts);
  const value = field.state.value ?? "";
  const invalid = isFieldShowingError({ field, submissionAttempts });
  const describedBy = fieldDescribedBy({ id: field.name, hasDescription: Boolean(props.description), showError: invalid });
  const control = props.renderControl ? (
    props.renderControl({
      id: field.name,
      value,
      onChange: field.handleChange,
      onBlur: field.handleBlur,
      readOnly: Boolean(props.readOnly),
      invalid,
      describedBy,
    })
  ) : (
    <Input
      id={field.name}
      type="text"
      value={value}
      onChange={(e) => field.handleChange(e.target.value)}
      onBlur={field.handleBlur}
      disabled={props.readOnly}
      placeholder={props.placeholder}
      aria-required={props.required}
      aria-invalid={invalid}
      aria-describedby={describedBy}
    />
  );
  const counter =
    props.maxLength !== undefined ? (
      <p className="self-end text-[0.8rem] text-muted-foreground tabular-nums">
        {value.length}/{props.maxLength}
      </p>
    ) : undefined;
  return (
    <FormFieldLayout
      id={field.name}
      label={props.label}
      required={props.required}
      description={props.description}
      index={props.index}
      field={field}
      submissionAttempts={submissionAttempts}
      before={props.before}
      after={counter ?? props.after}
      className={props.className}
    >
      {control}
    </FormFieldLayout>
  );
}
```

#### packages/react/src/forms/TextField.test.tsx

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { TextField } from "./TextField";

const { fieldContext, formContext } = createFormHookContexts();
const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField },
  formComponents: {},
});

function Harness(props: { initialValue: string; maxLength?: number }) {
  const form = useAppForm({ defaultValues: { title: props.initialValue } });
  return (
    <form.AppForm>
      <form.AppField name="title">
        {(field) => <field.TextField label="Title" required maxLength={props.maxLength} />}
      </form.AppField>
      <form.Subscribe selector={(state) => state.values.title}>
        {(value) => <output data-testid="value-probe">{value}</output>}
      </form.Subscribe>
    </form.AppForm>
  );
}

describe("TextField", () => {
  it("binds the control to the field's current value", () => {
    render(<Harness initialValue="hello" />);
    expect(screen.getByLabelText(/Title/)).toHaveValue("hello");
  });

  it("commits typed input back to the form", async () => {
    const user = userEvent.setup();
    render(<Harness initialValue="" />);
    await user.type(screen.getByLabelText(/Title/), "abc");
    expect(screen.getByTestId("value-probe")).toHaveTextContent("abc");
  });

  it("shows a length/maxLength counter when maxLength is set", () => {
    render(<Harness initialValue="hi" maxLength={10} />);
    expect(screen.getByText("2/10")).toBeInTheDocument();
  });

  it("renders no counter when maxLength is omitted", () => {
    render(<Harness initialValue="hi" />);
    expect(screen.queryByText(/^\d+\/\d+$/)).not.toBeInTheDocument();
  });
});
```

#### packages/react/src/forms/TextareaField.tsx

```tsx
"use client";

import type { ReactNode } from "react";
import { useStore } from "@tanstack/react-form";
import { useFieldContext, useFormContext } from "./formContext";
import { FormFieldLayout, fieldDescribedBy, isFieldShowingError } from "./FormFieldLayout";
import { Textarea } from "../components/ui/textarea";
import type { BaseFormFieldProps } from "./types";

export interface TextareaFieldProps extends BaseFormFieldProps<string> {
  placeholder?: string;
  /** Forwarded to `Textarea`'s `rows`. */
  rows?: number;
  /** Shows a `length/maxLength` (or bare length) counter under the control. */
  maxLength?: number;
}

/**
 * A multi-line text field bound to the nearest `<form.AppField name="...">`.
 *
 * @param props - See {@link TextareaFieldProps} and {@link BaseFormFieldProps}.
 * @returns The labelled control, counter, description and error.
 */
export function TextareaField(props: TextareaFieldProps): ReactNode {
  const field = useFieldContext<string>();
  const form = useFormContext();
  const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts);
  const value = field.state.value ?? "";
  const invalid = isFieldShowingError({ field, submissionAttempts });
  const describedBy = fieldDescribedBy({ id: field.name, hasDescription: Boolean(props.description), showError: invalid });
  const control = props.renderControl ? (
    props.renderControl({
      id: field.name,
      value,
      onChange: field.handleChange,
      onBlur: field.handleBlur,
      readOnly: Boolean(props.readOnly),
      invalid,
      describedBy,
    })
  ) : (
    <Textarea
      id={field.name}
      disabled={props.readOnly}
      rows={props.rows}
      value={value}
      onChange={(e) => field.handleChange(e.target.value)}
      onBlur={field.handleBlur}
      placeholder={props.placeholder}
      aria-required={props.required}
      aria-invalid={invalid}
      aria-describedby={describedBy}
    />
  );
  const counter = (
    <p className="self-end text-[0.8rem] text-muted-foreground tabular-nums">
      {value.length}
      {props.maxLength ? `/${props.maxLength}` : ""}
    </p>
  );
  return (
    <FormFieldLayout
      id={field.name}
      label={props.label}
      required={props.required}
      description={props.description}
      index={props.index}
      field={field}
      submissionAttempts={submissionAttempts}
      before={props.before}
      after={counter}
      className={props.className}
    >
      {control}
    </FormFieldLayout>
  );
}
```

#### packages/react/src/forms/TextareaField.test.tsx

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { TextareaField } from "./TextareaField";

const { fieldContext, formContext } = createFormHookContexts();
const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextareaField },
  formComponents: {},
});

function Harness(props: { initialValue: string; maxLength?: number }) {
  const form = useAppForm({ defaultValues: { bio: props.initialValue } });
  return (
    <form.AppForm>
      <form.AppField name="bio">
        {(field) => <field.TextareaField label="Bio" rows={3} maxLength={props.maxLength} />}
      </form.AppField>
    </form.AppForm>
  );
}

describe("TextareaField", () => {
  it("renders the counter unconditionally, with /max when maxLength is set", () => {
    render(<Harness initialValue="hi" maxLength={20} />);
    expect(screen.getByText("2/20")).toBeInTheDocument();
  });

  it("renders the bare character count with no maxLength", () => {
    render(<Harness initialValue="hi" />);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("commits typed input to the form", async () => {
    const user = userEvent.setup();
    render(<Harness initialValue="" />);
    await user.type(screen.getByLabelText(/Bio/), "ab");
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});
```

#### packages/react/src/forms/EmailField.tsx

```tsx
"use client";

import type { ReactNode } from "react";
import { useStore } from "@tanstack/react-form";
import { useFieldContext, useFormContext } from "./formContext";
import { FormFieldLayout, fieldDescribedBy, isFieldShowingError } from "./FormFieldLayout";
import { Input } from "../components/ui/input";
import type { BaseFormFieldProps } from "./types";

export interface EmailFieldProps extends BaseFormFieldProps<string> {
  placeholder?: string;
  maxLength?: number;
}

/**
 * An email field bound to the nearest `<form.AppField name="...">`. Renders a
 * native `type="email"` control with `autoComplete="email"`.
 *
 * @param props - See {@link EmailFieldProps} and {@link BaseFormFieldProps}.
 * @returns The labelled control, counter, description and error.
 */
export function EmailField(props: EmailFieldProps): ReactNode {
  const field = useFieldContext<string>();
  const form = useFormContext();
  const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts);
  const value = field.state.value ?? "";
  const invalid = isFieldShowingError({ field, submissionAttempts });
  const describedBy = fieldDescribedBy({ id: field.name, hasDescription: Boolean(props.description), showError: invalid });
  const control = props.renderControl ? (
    props.renderControl({
      id: field.name,
      value,
      onChange: field.handleChange,
      onBlur: field.handleBlur,
      readOnly: Boolean(props.readOnly),
      invalid,
      describedBy,
    })
  ) : (
    <Input
      id={field.name}
      type="email"
      autoComplete="email"
      value={value}
      onChange={(e) => field.handleChange(e.target.value)}
      onBlur={field.handleBlur}
      disabled={props.readOnly}
      placeholder={props.placeholder}
      aria-required={props.required}
      aria-invalid={invalid}
      aria-describedby={describedBy}
    />
  );
  const counter =
    props.maxLength !== undefined ? (
      <p className="self-end text-[0.8rem] text-muted-foreground tabular-nums">
        {value.length}/{props.maxLength}
      </p>
    ) : undefined;
  return (
    <FormFieldLayout
      id={field.name}
      label={props.label}
      required={props.required}
      description={props.description}
      index={props.index}
      field={field}
      submissionAttempts={submissionAttempts}
      before={props.before}
      after={counter ?? props.after}
      className={props.className}
    >
      {control}
    </FormFieldLayout>
  );
}
```

#### packages/react/src/forms/EmailField.test.tsx

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { EmailField } from "./EmailField";

const { fieldContext, formContext } = createFormHookContexts();
const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { EmailField },
  formComponents: {},
});

function Harness(props: { initialValue: string }) {
  const form = useAppForm({ defaultValues: { email: props.initialValue } });
  return (
    <form.AppForm>
      <form.AppField name="email">
        {(field) => <field.EmailField label="Email" />}
      </form.AppField>
    </form.AppForm>
  );
}

describe("EmailField", () => {
  it("renders a native type=email control with autoComplete=email", () => {
    render(<Harness initialValue="a@b.com" />);
    const input = screen.getByLabelText(/Email/);
    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("autoComplete", "email");
    expect(input).toHaveValue("a@b.com");
  });
});
```

#### packages/react/src/forms/UrlField.tsx

```tsx
"use client";

import type { ReactNode } from "react";
import { useStore } from "@tanstack/react-form";
import { useFieldContext, useFormContext } from "./formContext";
import { FormFieldLayout, fieldDescribedBy, isFieldShowingError } from "./FormFieldLayout";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { VexLink } from "../components/ui/VexLink";
import type { BaseFormFieldProps } from "./types";

export interface UrlFieldProps extends BaseFormFieldProps<string> {
  placeholder?: string;
}

/**
 * Whether `value` parses as an absolute URL (`new URL()` succeeds). Gates the
 * open-link button only — URL format validation stays with the caller's
 * schema, never here. Moved in unchanged from the deleted admin `url/Input.tsx`.
 *
 * @param value - The current field value to check.
 * @returns `true` if `value` is a non-empty, parseable absolute URL.
 */
function isParseableUrl(value: string): boolean {
  if (!value) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * A URL field bound to the nearest `<form.AppField name="...">`, with an
 * open-link button beside the control enabled only while the value parses.
 *
 * @param props - See {@link UrlFieldProps} and {@link BaseFormFieldProps}.
 * @returns The labelled control + open-link button, description and error.
 */
export function UrlField(props: UrlFieldProps): ReactNode {
  const field = useFieldContext<string>();
  const form = useFormContext();
  const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts);
  const value = field.state.value ?? "";
  const invalid = isFieldShowingError({ field, submissionAttempts });
  const describedBy = fieldDescribedBy({ id: field.name, hasDescription: Boolean(props.description), showError: invalid });
  const isValid = isParseableUrl(value);
  const control = props.renderControl ? (
    props.renderControl({
      id: field.name,
      value,
      onChange: field.handleChange,
      onBlur: field.handleBlur,
      readOnly: Boolean(props.readOnly),
      invalid,
      describedBy,
    })
  ) : (
    <Input
      id={field.name}
      type="text"
      value={value}
      onChange={(e) => field.handleChange(e.target.value)}
      onBlur={field.handleBlur}
      disabled={props.readOnly}
      placeholder={props.placeholder}
      aria-required={props.required}
      aria-invalid={invalid}
      aria-describedby={describedBy}
    />
  );
  const row = (
    <div className="flex items-center gap-2">
      {control}
      <Button
        type="button"
        variant="outline"
        size="icon"
        nativeButton={false}
        disabled={!isValid}
        aria-label="Open link in new tab"
        icon="ExternalLink"
        iconPosition="center"
        render={<VexLink href={isValid ? value : ""} target="_blank" rel="noopener noreferrer" />}
      />
    </div>
  );
  return (
    <FormFieldLayout
      id={field.name}
      label={props.label}
      required={props.required}
      description={props.description}
      index={props.index}
      field={field}
      submissionAttempts={submissionAttempts}
      before={props.before}
      after={props.after}
      className={props.className}
    >
      {row}
    </FormFieldLayout>
  );
}
```

#### packages/react/src/forms/UrlField.test.tsx

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { UrlField } from "./UrlField";

const { fieldContext, formContext } = createFormHookContexts();
const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { UrlField },
  formComponents: {},
});

function Harness(props: { initialValue: string }) {
  const form = useAppForm({ defaultValues: { website: props.initialValue } });
  return (
    <form.AppForm>
      <form.AppField name="website">{(field) => <field.UrlField label="Website" />}</form.AppField>
    </form.AppForm>
  );
}

describe("UrlField", () => {
  it("disables the open-link button for an unparseable value", () => {
    render(<Harness initialValue="not a url" />);
    expect(screen.getByRole("button", { name: "Open link in new tab" })).toBeDisabled();
  });

  it("enables the open-link button for a parseable absolute URL", () => {
    render(<Harness initialValue="https://vexcms.dev" />);
    expect(screen.getByRole("button", { name: "Open link in new tab" })).toBeEnabled();
  });
});
```

#### packages/react/src/forms/NumberField.tsx

```tsx
"use client";

import type { ReactNode } from "react";
import { useStore } from "@tanstack/react-form";
import { useFieldContext, useFormContext } from "./formContext";
import { FormFieldLayout, fieldDescribedBy, isFieldShowingError } from "./FormFieldLayout";
import { Input } from "../components/ui/input";
import type { BaseFormFieldProps } from "./types";

export interface NumberFieldProps extends BaseFormFieldProps<number> {
  placeholder?: string;
  step?: number;
  min?: number;
  max?: number;
}

/**
 * A number field bound to the nearest `<form.AppField name="...">`.
 * `step`/`min`/`max` are forwarded as native HTML attributes only — UI
 * affordances, never client-side clamping.
 *
 * @param props - See {@link NumberFieldProps} and {@link BaseFormFieldProps}.
 * @returns The labelled control, description and error.
 */
export function NumberField(props: NumberFieldProps): ReactNode {
  const field = useFieldContext<number>();
  const form = useFormContext();
  const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts);
  const invalid = isFieldShowingError({ field, submissionAttempts });
  const describedBy = fieldDescribedBy({ id: field.name, hasDescription: Boolean(props.description), showError: invalid });
  const control = props.renderControl ? (
    props.renderControl({
      id: field.name,
      value: field.state.value,
      onChange: field.handleChange,
      onBlur: field.handleBlur,
      readOnly: Boolean(props.readOnly),
      invalid,
      describedBy,
    })
  ) : (
    <Input
      id={field.name}
      type="number"
      disabled={props.readOnly}
      step={props.step}
      min={props.min}
      max={props.max}
      value={field.state.value ?? 0}
      onChange={(e) =>
        field.handleChange(
          e.target.value === "" ? (undefined as unknown as number) : Number(e.target.value),
        )
      }
      onBlur={field.handleBlur}
      placeholder={props.placeholder}
      aria-required={props.required}
      aria-invalid={invalid}
      aria-describedby={describedBy}
    />
  );
  return (
    <FormFieldLayout
      id={field.name}
      label={props.label}
      required={props.required}
      description={props.description}
      index={props.index}
      field={field}
      submissionAttempts={submissionAttempts}
      before={props.before}
      after={props.after}
      className={props.className}
    >
      {control}
    </FormFieldLayout>
  );
}
```

#### packages/react/src/forms/NumberField.test.tsx

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { NumberField } from "./NumberField";

const { fieldContext, formContext } = createFormHookContexts();
const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { NumberField },
  formComponents: {},
});

function Harness(props: { initialValue: number }) {
  const form = useAppForm({ defaultValues: { price: props.initialValue } });
  return (
    <form.AppForm>
      <form.AppField name="price">
        {(field) => <field.NumberField label="Price" min={0} max={100} step={0.5} />}
      </form.AppField>
      <form.Subscribe selector={(state) => state.values.price}>
        {(value) => <output data-testid="value-probe">{value}</output>}
      </form.Subscribe>
    </form.AppForm>
  );
}

describe("NumberField", () => {
  it("forwards min/max/step as native attributes", () => {
    render(<Harness initialValue={10} />);
    const input = screen.getByLabelText(/Price/);
    expect(input).toHaveAttribute("min", "0");
    expect(input).toHaveAttribute("max", "100");
    expect(input).toHaveAttribute("step", "0.5");
  });

  it("commits a typed number back to the form", async () => {
    const user = userEvent.setup();
    render(<Harness initialValue={0} />);
    const input = screen.getByLabelText(/Price/);
    await user.clear(input);
    await user.type(input, "42");
    expect(screen.getByTestId("value-probe")).toHaveTextContent("42");
  });
});
```

#### packages/react/src/forms/CheckboxField.tsx

```tsx
"use client";

import type { ReactNode } from "react";
import { useStore } from "@tanstack/react-form";
import { useFieldContext, useFormContext } from "./formContext";
import { FormFieldLayout, fieldDescribedBy, isFieldShowingError } from "./FormFieldLayout";
import { Checkbox } from "../components/ui/checkbox";
import type { BaseFormFieldProps } from "./types";

export type CheckboxFieldProps = BaseFormFieldProps<boolean>;

/**
 * A checkbox field bound to the nearest `<form.AppField name="...">`. Unlike
 * every other app-form leaf field, its label renders beside the control
 * rather than above it — `FormFieldLayout` is used for description/error only.
 *
 * @param props - See {@link CheckboxFieldProps} and {@link BaseFormFieldProps}.
 * @returns The checkbox + inline label row, description and error.
 */
export function CheckboxField(props: CheckboxFieldProps): ReactNode {
  const field = useFieldContext<boolean>();
  const form = useFormContext();
  const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts);
  const invalid = isFieldShowingError({ field, submissionAttempts });
  const describedBy = fieldDescribedBy({ id: field.name, hasDescription: Boolean(props.description), showError: invalid });
  const control = props.renderControl ? (
    props.renderControl({
      id: field.name,
      value: field.state.value ?? false,
      onChange: field.handleChange,
      onBlur: field.handleBlur,
      readOnly: Boolean(props.readOnly),
      invalid,
      describedBy,
    })
  ) : (
    <Checkbox
      id={field.name}
      aria-labelledby={`${field.name}-label`}
      required={props.required}
      readOnly={props.readOnly}
      disabled={props.readOnly}
      checked={field.state.value ?? false}
      onCheckedChange={(checked) => field.handleChange(checked)}
      onBlur={field.handleBlur}
      aria-invalid={invalid}
      aria-describedby={describedBy}
    />
  );
  const inlineLabel = (
    <span id={`${field.name}-label`}>
      {props.index !== undefined ? `[${props.index + 1}] - ` : ""}
      {props.label}
      {props.required && <span className="text-red-500">*</span>}
    </span>
  );
  return (
    <FormFieldLayout
      id={field.name}
      field={field}
      submissionAttempts={submissionAttempts}
      description={props.description}
      className={props.className}
      before={
        <div className="flex gap-2">
          {control}
          {inlineLabel}
        </div>
      }
    >
      {null}
    </FormFieldLayout>
  );
}
```

#### packages/react/src/forms/CheckboxField.test.tsx

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { CheckboxField } from "./CheckboxField";

const { fieldContext, formContext } = createFormHookContexts();
const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { CheckboxField },
  formComponents: {},
});

function Harness(props: { initialValue: boolean }) {
  const form = useAppForm({ defaultValues: { published: props.initialValue } });
  return (
    <form.AppForm>
      <form.AppField name="published">
        {(field) => <field.CheckboxField label="Published" required />}
      </form.AppField>
      <form.Subscribe selector={(state) => state.values.published}>
        {(value) => <output data-testid="value-probe">{String(value)}</output>}
      </form.Subscribe>
    </form.AppForm>
  );
}

describe("CheckboxField", () => {
  it("renders exactly one label, beside the checkbox", () => {
    render(<Harness initialValue={false} />);
    expect(screen.getAllByText(/Published/)).toHaveLength(1);
  });

  it("toggles the form value on click", async () => {
    const user = userEvent.setup();
    render(<Harness initialValue={false} />);
    await user.click(screen.getByRole("checkbox"));
    expect(screen.getByTestId("value-probe")).toHaveTextContent("true");
  });
});
```

#### packages/react/src/forms/SelectField.tsx

```tsx
"use client";

import type { ReactNode } from "react";
import { useStore } from "@tanstack/react-form";
import { useFieldContext, useFormContext } from "./formContext";
import { FormFieldLayout, fieldDescribedBy, isFieldShowingError } from "./FormFieldLayout";
import { Checkbox } from "../components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "../components/ui/multi-select";
import { useModalSurface } from "../hooks/useModalSurface";
import type { BaseFormFieldProps } from "./types";

export interface SelectFieldOption {
  label: string;
  value: string;
}

export interface SelectFieldProps extends BaseFormFieldProps<string[]> {
  options: SelectFieldOption[];
  /** `false` (default) caps the selection at one value. */
  hasMany?: boolean;
  /** `"dropdown"` (default, a searchable popover) or `"radio"` (inline, no popover). */
  display?: "dropdown" | "radio";
  /** Applies only to `"dropdown"`. */
  searchable?: boolean;
  placeholder?: string;
}

/**
 * A single- or multi-select field bound to the nearest `<form.AppField
 * name="...">`. Always stores `string[]`; `hasMany` caps it at one entry.
 *
 * @param props - See {@link SelectFieldProps} and {@link BaseFormFieldProps}.
 * @returns The labelled control (popover or inline radio/checkbox list), description and error.
 */
export function SelectField(props: SelectFieldProps): ReactNode {
  const field = useFieldContext<string[]>();
  const form = useFormContext();
  const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts);
  const isOnModalSurface = useModalSurface();
  const invalid = isFieldShowingError({ field, submissionAttempts });
  const describedBy = fieldDescribedBy({ id: field.name, hasDescription: Boolean(props.description), showError: invalid });

  function handleToggle(value: string) {
    const current = field.state.value ?? [];
    if (props.hasMany) {
      field.handleChange(
        current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
      );
    } else {
      field.handleChange(current.includes(value) ? [] : [value]);
    }
  }

  if (props.renderControl) {
    const control = props.renderControl({
      id: field.name,
      value: field.state.value,
      onChange: field.handleChange,
      onBlur: field.handleBlur,
      readOnly: Boolean(props.readOnly),
      invalid,
      describedBy,
    });
    return (
      <FormFieldLayout
        id={field.name}
        label={props.label}
        required={props.required}
        description={props.description}
        index={props.index}
        field={field}
        submissionAttempts={submissionAttempts}
        className={props.className}
      >
        {control}
      </FormFieldLayout>
    );
  }

  if (props.display === "radio") {
    const inlineLabel = (
      <span
        id={`${field.name}-label`}
        className="relative flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
      >
        {props.index !== undefined ? `[${props.index + 1}] - ` : ""}
        {props.label}
        {props.required && <span className="text-red-500">*</span>}
      </span>
    );
    const control = props.hasMany ? (
      <div
        role="group"
        aria-labelledby={`${field.name}-label`}
        aria-disabled={props.readOnly}
        className="flex flex-col gap-2"
      >
        {props.options.map((option, optionIndex) => (
          <label key={`${field.name}-option-${optionIndex}`} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={(field.state.value ?? []).includes(option.value)}
              disabled={props.readOnly}
              onCheckedChange={() => handleToggle(option.value)}
              onBlur={field.handleBlur}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              aria-label={option.label}
            />
            {option.label}
          </label>
        ))}
      </div>
    ) : (
      <RadioGroup
        aria-labelledby={`${field.name}-label`}
        disabled={props.readOnly}
        value={(field.state.value ?? [])[0]}
        onValueChange={(value) => field.handleChange([value as string])}
        onBlur={field.handleBlur}
        className="gap-2"
      >
        {props.options.map((option, optionIndex) => (
          <label key={`${field.name}-option-${optionIndex}`} className="flex items-center gap-2 text-sm">
            <RadioGroupItem
              value={option.value}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              aria-label={option.label}
            />
            {option.label}
          </label>
        ))}
      </RadioGroup>
    );
    return (
      <FormFieldLayout
        id={field.name}
        field={field}
        submissionAttempts={submissionAttempts}
        description={props.description}
        className={props.className}
        before={
          <div className="flex flex-col gap-1.5">
            {inlineLabel}
            {control}
          </div>
        }
      >
        {null}
      </FormFieldLayout>
    );
  }

  const control = (
    <MultiSelect
      modal={isOnModalSurface}
      onValuesChange={field.handleChange}
      single={!props.hasMany}
      values={field.state.value}
    >
      <MultiSelectTrigger
        id={field.name}
        className="w-full"
        onBlur={field.handleBlur}
        name={field.name}
        aria-required={props.required}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        disabled={props.readOnly}
      >
        <MultiSelectValue placeholder={props.placeholder} />
      </MultiSelectTrigger>
      <MultiSelectContent onBlur={field.handleBlur} className="w-full" search={props.searchable}>
        <MultiSelectGroup>
          {props.options.map((option, optionIndex) => (
            <MultiSelectItem value={option.value} key={`multi-select-item-${field.name}-${optionIndex}`}>
              {option.label}
            </MultiSelectItem>
          ))}
        </MultiSelectGroup>
      </MultiSelectContent>
    </MultiSelect>
  );
  return (
    <FormFieldLayout
      id={field.name}
      label={props.label}
      required={props.required}
      description={props.description}
      index={props.index}
      field={field}
      submissionAttempts={submissionAttempts}
      className={props.className}
    >
      {control}
    </FormFieldLayout>
  );
}
```

> Note: the admin `select/Input.tsx`'s radio branch builds its own inline label span rather than
> using `FormFieldLayout`'s `label` prop (same reason as `CheckboxField`); this port keeps that
> label+control pairing together in `before` and passes `label={undefined}` implicitly by omitting
> the prop, so `FormFieldLayout` renders description/error only for that branch.

#### packages/react/src/forms/SelectField.test.tsx

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { SelectField } from "./SelectField";

const { fieldContext, formContext } = createFormHookContexts();
const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { SelectField },
  formComponents: {},
});

const options = [
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
];

function RadioHarness(props: { initialValue: string[]; hasMany?: boolean }) {
  const form = useAppForm({ defaultValues: { status: props.initialValue } });
  return (
    <form.AppForm>
      <form.AppField name="status">
        {(field) => (
          <field.SelectField label="Status" options={options} display="radio" hasMany={props.hasMany} />
        )}
      </form.AppField>
      <form.Subscribe selector={(state) => state.values.status}>
        {(value) => <output data-testid="value-probe">{JSON.stringify(value)}</output>}
      </form.Subscribe>
    </form.AppForm>
  );
}

describe("SelectField: radio display", () => {
  it("renders one radio per option and selects on click", async () => {
    const user = userEvent.setup();
    render(<RadioHarness initialValue={[]} />);
    expect(screen.getAllByRole("radio")).toHaveLength(2);
    await user.click(screen.getByRole("radio", { name: "Published" }));
    expect(screen.getByTestId("value-probe")).toHaveTextContent('["published"]');
  });

  it("renders checkboxes instead of radios when hasMany is true", () => {
    render(<RadioHarness initialValue={[]} hasMany />);
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
  });

  it("toggles a second value into the selection when hasMany is true", async () => {
    const user = userEvent.setup();
    render(<RadioHarness initialValue={["draft"]} hasMany />);
    await user.click(screen.getByRole("checkbox", { name: "Published" }));
    expect(screen.getByTestId("value-probe")).toHaveTextContent('["draft","published"]');
  });
});
```

#### packages/react/src/forms/DateField.tsx

```tsx
"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useStore } from "@tanstack/react-form";
import { useFieldContext, useFormContext } from "./formContext";
import { FormFieldLayout, fieldDescribedBy } from "./FormFieldLayout";
import { DateTimePicker, type DateTimePickerProps } from "../components/ui/datetime/date-picker";
import type { BaseFormFieldProps } from "./types";

export interface DateFieldProps extends BaseFormFieldProps<number | undefined> {
  /** Epoch ms lower bound. */
  min?: number;
  /** Epoch ms upper bound. */
  max?: number;
  hideTime?: boolean;
  use12HourFormat?: boolean;
  timePicker?: DateTimePickerProps["timePicker"];
}

/**
 * A date/time field bound to the nearest `<form.AppField name="...">`.
 * Stores epoch milliseconds (`number | undefined`).
 *
 * Unlike every other leaf field in this entry, `value` is a `number |
 * undefined` (epoch ms), not the `Date` the default `DateTimePicker` control
 * itself wants — a `renderControl` override here receives that same epoch
 * `value` and must do the epoch↔`Date` conversion itself; every other
 * field's override is a direct pass-through.
 *
 * @param props - See {@link DateFieldProps} and {@link BaseFormFieldProps}.
 * @param props.renderControl - Receives `value: number | undefined` (epoch ms); must convert to/from `Date` itself.
 * @returns The labelled control, description and error.
 */
export function DateField(props: DateFieldProps): ReactNode {
  const field = useFieldContext<number | undefined>();
  const form = useFormContext();
  const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts);

  const fieldRef = useRef(field);
  useEffect(() => {
    fieldRef.current = field;
  }, [field]);

  const dateValue = useMemo(
    () => (field.state.value ? new Date(field.state.value) : undefined),
    [field.state.value],
  );
  const minDate = useMemo(() => (props.min !== undefined ? new Date(props.min) : undefined), [props.min]);
  const maxDate = useMemo(() => (props.max !== undefined ? new Date(props.max) : undefined), [props.max]);
  const handleChange = useCallback((date: Date | undefined) => {
    fieldRef.current.handleChange(date ? date.getTime() : undefined);
  }, []);
  const describedBy = fieldDescribedBy({ id: field.name, hasDescription: Boolean(props.description), showError: false });
  const control = props.renderControl ? (
    props.renderControl({
      id: field.name,
      value: field.state.value,
      onChange: field.handleChange,
      onBlur: field.handleBlur,
      readOnly: Boolean(props.readOnly),
      invalid: false,
      describedBy,
    })
  ) : (
    <DateTimePicker
      id={field.name}
      value={dateValue}
      onChange={handleChange}
      onBlur={field.handleBlur}
      disabled={props.readOnly}
      clearable
      hideTime={props.hideTime}
      use12HourFormat={props.use12HourFormat}
      timePicker={props.timePicker}
      min={minDate}
      max={maxDate}
      aria-required={props.required}
      aria-labelledby={`${field.name}-label`}
    />
  );
  return (
    <FormFieldLayout
      id={field.name}
      label={props.label}
      required={props.required}
      description={props.description}
      index={props.index}
      field={field}
      submissionAttempts={submissionAttempts}
      className={props.className}
    >
      {control}
    </FormFieldLayout>
  );
}
```

#### packages/react/src/forms/DateField.test.tsx

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { DateField } from "./DateField";

const { fieldContext, formContext } = createFormHookContexts();
const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { DateField },
  formComponents: {},
});

function Harness(props: { initialValue: number | undefined; hideTime?: boolean }) {
  const form = useAppForm({ defaultValues: { publishedAt: props.initialValue } });
  return (
    <form.AppForm>
      <form.AppField name="publishedAt">
        {(field) => <field.DateField label="Published at" hideTime={props.hideTime} />}
      </form.AppField>
    </form.AppForm>
  );
}

describe("DateField", () => {
  it("renders the label and a button-triggered picker for an unset value", () => {
    render(<Harness initialValue={undefined} />);
    expect(screen.getByText("Published at")).toBeInTheDocument();
  });

  it("renders the stored epoch value as a formatted date", () => {
    render(<Harness initialValue={Date.UTC(2026, 0, 15)} />);
    expect(screen.getByText(/Jan 15, 2026/)).toBeInTheDocument();
  });
});
```

#### packages/react/src/forms/ColorField.tsx

```tsx
"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@tanstack/react-form";
import Sketch from "@uiw/react-color-sketch";
import { parseColor, serializeColor, type ColorFormat } from "@vexcms/core";
import { useFieldContext, useFormContext } from "./formContext";
import { FormFieldLayout, fieldDescribedBy, isFieldShowingError } from "./FormFieldLayout";
import { Input } from "../components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import type { BaseFormFieldProps } from "./types";

/** Colour the picker opens on when the field holds no parseable value. */
const PICKER_FALLBACK = "#000000";

const FORMAT_PLACEHOLDERS: Record<ColorFormat, string> = {
  hex: "#E8622A",
  rgb: "rgb(232, 98, 42)",
  hsl: "hsl(17.7, 80.5%, 53.7%)",
  oklch: "oklch(65.73% 0.17941 40.85)",
};

/** Selectors that declare light-scheme tokens. Anchored: a compound selector such as `:root.dark` must not be read as a light declaration. */
const LIGHT_SELECTOR = /^(?::root|html)$/;

/** Selectors that declare dark-scheme tokens. Anchored so Tailwind's `dark:` utilities — whose `selectorText` is `.dark\:bg-red-500` — are excluded. */
const DARK_SELECTOR = /^(?:html|:root)?\.dark$/;

/** CSS colour notations a token may use, matched by notation rather than `CSS.supports` (jsdom does not implement it). Named colours are excluded deliberately. */
const COLOR_VALUE =
  /^(?:#[0-9a-fA-F]{3,8}|(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color|color-mix)\()/;

/** A value that is entirely one custom-property reference: `var(--primary)`. */
const VAR_REFERENCE = /^var\(\s*(--[A-Za-z0-9_-]+)\s*\)$/;

/** Tailwind's `@theme inline` block re-declares every token under a `--color-` namespace as `var(--<token>)`; those are aliases, not tokens. */
const TAILWIND_ALIAS_PREFIX = "--color-";

/** Maximum `var()` hops followed when resolving a declared value. */
const MAX_VAR_DEPTH = 4;

/** One CSS custom property discovered on the host stylesheet. */
export interface ColorFieldThemeToken {
  /** The custom-property name, including the leading dashes: `"--primary"`. */
  name: string;
  /** The value stored when this token is selected: `"var(--primary)"`. */
  reference: string;
  /** The value declared for the light colour scheme. */
  lightValue: string;
  /** The value declared under `.dark`, or `null` when the token has no dark variant. */
  darkValue: string | null;
}

/**
 * Reads a stylesheet's rules, returning an empty list when access throws
 * (a cross-origin stylesheet with no CORS header).
 */
function safeCssRules(props: { sheet: CSSStyleSheet }): CSSRule[] {
  try {
    return Array.from(props.sheet.cssRules);
  } catch {
    return [];
  }
}

/**
 * Recursively collects declared custom properties into the light and dark
 * maps. Grouping rules (`@layer`, `@media`, `@supports`) carry their own
 * `cssRules` and are descended into — Tailwind v4 emits `:root` inside
 * `@layer base`, so skipping them would find nothing.
 */
function collectDeclarations(props: {
  rules: CSSRule[];
  light: Map<string, string>;
  dark: Map<string, string>;
}): void {
  for (const rule of props.rules) {
    const grouping = rule as CSSRule & { cssRules?: CSSRuleList };
    if (grouping.cssRules) {
      collectDeclarations({ rules: Array.from(grouping.cssRules), light: props.light, dark: props.dark });
      continue;
    }

    const styleRule = rule as CSSStyleRule;
    if (!styleRule.selectorText || !styleRule.style) continue;

    const selectors = styleRule.selectorText.split(",").map((s) => s.trim());
    const isLight = selectors.some((s) => LIGHT_SELECTOR.test(s));
    const isDark = selectors.some((s) => DARK_SELECTOR.test(s));
    if (!isLight && !isDark) continue;

    // Indexed access, not `.item(i)`: jsdom's `CSSStyleDeclaration` does not
    // implement `item`, so `.item(i)` throws under vitest (measured).
    for (let i = 0; i < styleRule.style.length; i += 1) {
      const name = styleRule.style[i];
      if (!name.startsWith("--")) continue;
      const value = styleRule.style.getPropertyValue(name).trim();
      if (!value) continue;
      if (isLight) props.light.set(name, value);
      if (isDark) props.dark.set(name, value);
    }
  }
}

/** Resolves a declared value through up to {@link MAX_VAR_DEPTH} `var()` hops. */
function resolveValue(props: { value: string; declared: Map<string, string>; depth?: number }): string {
  const depth = props.depth ?? 0;
  const match = VAR_REFERENCE.exec(props.value);
  if (!match || depth >= MAX_VAR_DEPTH) return props.value;
  const target = props.declared.get(match[1]);
  if (target === undefined) return props.value;
  return resolveValue({ value: target, declared: props.declared, depth: depth + 1 });
}

/**
 * Walks the host document's stylesheets for colour-looking CSS custom
 * properties, pairing a light-scheme declaration with its dark-scheme
 * override when one exists. Ported wholesale from the deleted admin
 * `components/fields/color/utils.ts` — it never read `fieldDef`.
 *
 * Reads **declared** values out of the CSSOM rather than calling
 * `getComputedStyle` on the live tree: the admin panel may itself be in
 * dark mode, in which case computed values would report the dark palette
 * twice.
 *
 * @returns Every discovered token, sorted by name. Empty when there is no
 * `document` (SSR) or when no stylesheet declares a colour-valued custom property.
 */
function readThemeColorTokens(): ColorFieldThemeToken[] {
  if (typeof document === "undefined") return [];

  const light = new Map<string, string>();
  const dark = new Map<string, string>();
  for (const sheet of Array.from(document.styleSheets)) {
    collectDeclarations({ rules: safeCssRules({ sheet }), light, dark });
  }

  const tokens: ColorFieldThemeToken[] = [];
  for (const [name, declared] of light) {
    if (name.startsWith(TAILWIND_ALIAS_PREFIX)) continue;
    const lightValue = resolveValue({ value: declared, declared: light });
    if (!COLOR_VALUE.test(lightValue)) continue;

    const declaredDark = dark.get(name);
    const darkValue = declaredDark === undefined ? null : resolveValue({ value: declaredDark, declared: dark });

    tokens.push({ name, reference: `var(${name})`, lightValue, darkValue });
  }

  return tokens.sort((a, b) => a.name.localeCompare(b.name));
}

export interface ColorFieldProps extends BaseFormFieldProps<string> {
  format: ColorFormat;
  /** Adds a **Theme** tab listing the host app's CSS custom properties. */
  themeColors?: boolean;
  placeholder?: string;
}

/**
 * A colour field bound to the nearest `<form.AppField name="...">`: a swatch
 * button opening a `Sketch` picker, beside a text input for pasting an exact
 * value. All colour maths is `@vexcms/core`'s `parseColor`/`serializeColor` —
 * plain, framework-agnostic conversions, not admin config.
 *
 * @param props - See {@link ColorFieldProps} and {@link BaseFormFieldProps}.
 * @returns The labelled swatch + text control, description and error.
 */
export function ColorField(props: ColorFieldProps): ReactNode {
  const field = useFieldContext<string>();
  const form = useFormContext();
  const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [tokens, setTokens] = useState<ColorFieldThemeToken[]>([]);

  const value = field.state.value ?? "";

  // Read on open rather than on mount: the host stylesheet is in place by
  // then, and a closed picker should not walk the CSSOM.
  useEffect(() => {
    if (!isOpen || !props.themeColors) return;
    setTokens(readThemeColorTokens());
  }, [isOpen, props.themeColors]);

  const filteredTokens = useMemo(() => {
    if (!search) return tokens;
    const query = search.toLowerCase();
    return tokens.filter((token) => token.name.toLowerCase().includes(query));
  }, [tokens, search]);

  // A `var(--token)` value has no literal colour, so the picker falls back.
  const pickerColor = useMemo(() => {
    const parsed = parseColor({ value });
    return parsed ? serializeColor({ color: parsed, format: "hex" }) : PICKER_FALLBACK;
  }, [value]);

  const picker = (
    <Sketch
      color={pickerColor}
      disableAlpha={false}
      onChange={(next) => field.handleChange(serializeColor({ color: next.rgba, format: props.format }))}
    />
  );

  if (props.renderControl) {
    const control = props.renderControl({
      id: field.name,
      value,
      onChange: field.handleChange,
      onBlur: field.handleBlur,
      readOnly: Boolean(props.readOnly),
      invalid: isFieldShowingError({ field, submissionAttempts }),
      describedBy: fieldDescribedBy({
        id: field.name,
        hasDescription: Boolean(props.description),
        showError: isFieldShowingError({ field, submissionAttempts }),
      }),
    });
    return (
      <FormFieldLayout
        id={field.name}
        label={props.label}
        required={props.required}
        description={props.description}
        index={props.index}
        field={field}
        submissionAttempts={submissionAttempts}
        className={props.className}
      >
        {control}
      </FormFieldLayout>
    );
  }

  const row = (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          nativeButton={true}
          render={(triggerProps) => (
            <button
              {...triggerProps}
              type="button"
              aria-label={`Pick a colour for ${props.label ?? field.name}`}
              disabled={props.readOnly}
              className="size-9 shrink-0 rounded-md border border-input shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: value || "transparent" }}
            />
          )}
        />
        <PopoverContent className="w-auto p-2" align="start">
          {props.themeColors ? (
            <Tabs defaultValue="custom">
              <TabsList>
                <TabsTrigger value="custom">Custom</TabsTrigger>
                <TabsTrigger value="theme">Theme</TabsTrigger>
              </TabsList>
              <TabsContent value="custom">{picker}</TabsContent>
              <TabsContent value="theme">
                <div className="flex w-72 flex-col gap-2">
                  <Input
                    type="text"
                    value={search}
                    placeholder="Search tokens..."
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {filteredTokens.length === 0 ? (
                    <p className="py-4 text-center text-xs text-muted-foreground">
                      {tokens.length === 0 ? "No theme colours found" : "No matching tokens"}
                    </p>
                  ) : (
                    <div className="flex max-h-60 flex-col gap-1 overflow-y-auto">
                      {filteredTokens.map((token) => (
                        <button
                          key={token.name}
                          type="button"
                          onClick={() => {
                            field.handleChange(token.reference);
                            setIsOpen(false);
                          }}
                          className="flex items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-accent"
                          title={
                            token.darkValue
                              ? `Light: ${token.lightValue} / Dark: ${token.darkValue}`
                              : token.lightValue
                          }
                        >
                          <span className="relative size-4 shrink-0 overflow-hidden rounded border border-border">
                            <span className="absolute inset-0" style={{ backgroundColor: token.lightValue }} />
                            {token.darkValue ? (
                              <span
                                className="absolute inset-0"
                                style={{
                                  backgroundColor: token.darkValue,
                                  clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
                                }}
                              />
                            ) : null}
                          </span>
                          <span className="truncate font-mono">{token.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            picker
          )}
        </PopoverContent>
      </Popover>
      <Input
        id={field.name}
        type="text"
        className="font-mono"
        disabled={props.readOnly}
        value={value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        placeholder={props.placeholder || FORMAT_PLACEHOLDERS[props.format]}
        aria-required={props.required}
        aria-invalid={isFieldShowingError({ field, submissionAttempts })}
        aria-describedby={fieldDescribedBy({
          id: field.name,
          hasDescription: Boolean(props.description),
          showError: isFieldShowingError({ field, submissionAttempts }),
        })}
      />
    </div>
  );
  return (
    <FormFieldLayout
      id={field.name}
      label={props.label}
      required={props.required}
      description={props.description}
      index={props.index}
      field={field}
      submissionAttempts={submissionAttempts}
      className={props.className}
    >
      {row}
    </FormFieldLayout>
  );
}
```

#### packages/react/src/forms/ColorField.test.tsx

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { ColorField } from "./ColorField";

const { fieldContext, formContext } = createFormHookContexts();
const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { ColorField },
  formComponents: {},
});

function Harness(props: { initialValue: string }) {
  const form = useAppForm({ defaultValues: { accent: props.initialValue } });
  return (
    <form.AppForm>
      <form.AppField name="accent">
        {(field) => <field.ColorField label="Accent" format="hex" />}
      </form.AppField>
      <form.Subscribe selector={(state) => state.values.accent}>
        {(value) => <output data-testid="value-probe">{value}</output>}
      </form.Subscribe>
    </form.AppForm>
  );
}

describe("ColorField", () => {
  it("renders the stored value in the text input", () => {
    render(<Harness initialValue="#e8622a" />);
    expect(screen.getByDisplayValue("#e8622a")).toBeInTheDocument();
  });

  it("commits a typed value back to the form", async () => {
    const user = userEvent.setup();
    render(<Harness initialValue="" />);
    await user.type(screen.getByPlaceholderText("#E8622A"), "#000000");
    expect(screen.getByTestId("value-probe")).toHaveTextContent("#000000");
  });

  it("falls back to the format placeholder when none is given", () => {
    render(<Harness initialValue="" />);
    expect(screen.getByPlaceholderText("#E8622A")).toBeInTheDocument();
  });
});
```

#### packages/react/src/forms/JsonField.tsx

```tsx
"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useStore } from "@tanstack/react-form";
import { useFieldContext, useFormContext } from "./formContext";
import { FormFieldLayout, fieldDescribedBy, isFieldShowingError } from "./FormFieldLayout";
import { JsonEditor } from "../components/ui/JsonEditor";
import { Button } from "../components/ui/button";
import type { BaseFormFieldProps } from "./types";

/**
 * Result of {@link parseJsonFieldText}: either a successful parse (`ok:
 * true`, carrying the parsed `value`) or a failure (`ok: false`, carrying a
 * human-readable `error` message).
 */
type JsonFieldParseResult = { ok: true; value: unknown } | { ok: false; error: string };

/**
 * Serializes a JSON field's value for the editor — pretty-printed, two-space
 * indented; `undefined` renders as an empty string. No fieldDef dependency,
 * so it is local to the app form rather than a shared admin utility.
 *
 * @param value - The field's current value.
 * @returns The editor text.
 */
function stringifyJsonFieldValue(value: unknown): string {
  return value === undefined ? "" : JSON.stringify(value, null, 2);
}

/**
 * Parses editor text back into a value, never throwing. Blank (or
 * whitespace-only) text parses successfully to `undefined`, clearing the field.
 *
 * @param props.text - The raw editor text.
 * @returns `{ ok: true, value }` on a successful parse, `{ ok: false, error }` otherwise.
 */
function parseJsonFieldText(props: { text: string }): JsonFieldParseResult {
  if (props.text.trim() === "") {
    return { ok: true, value: undefined };
  }
  try {
    return { ok: true, value: JSON.parse(props.text) as unknown };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Invalid JSON." };
  }
}

export type JsonFieldProps = BaseFormFieldProps<unknown>;

/**
 * A raw-JSON field bound to the nearest `<form.AppField name="...">`. Holds
 * editor text in local state and parses on every change: a valid parse
 * commits via `field.handleChange`, an invalid parse leaves the committed
 * form value untouched and shows a local parse-error message.
 *
 * `props.renderControl`, when given, replaces the editor+Format-button
 * control entirely — same contract as every other leaf field (decision 12):
 * the override receives the raw `unknown` value directly and owns its own
 * text representation; the local parse-error/Format-button state below is
 * `JsonField`'s own built-in control's concern, not the override's.
 *
 * @param props - See {@link JsonFieldProps} and {@link BaseFormFieldProps}.
 * @returns The labelled editor + Format button, parse error, description and form error.
 */
export function JsonField(props: JsonFieldProps): ReactNode {
  const field = useFieldContext<unknown>();
  const form = useFormContext();
  const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts);
  const [text, setText] = useState(() => stringifyJsonFieldValue(field.state.value));
  const [parseError, setParseError] = useState<string | undefined>(undefined);

  if (props.renderControl) {
    const control = props.renderControl({
      id: field.name,
      value: field.state.value,
      onChange: field.handleChange,
      onBlur: field.handleBlur,
      readOnly: Boolean(props.readOnly),
      invalid: isFieldShowingError({ field, submissionAttempts }),
      describedBy: fieldDescribedBy({
        id: field.name,
        hasDescription: Boolean(props.description),
        showError: isFieldShowingError({ field, submissionAttempts }),
      }),
    });
    return (
      <FormFieldLayout
        id={field.name}
        label={props.label}
        required={props.required}
        description={props.description}
        index={props.index}
        field={field}
        submissionAttempts={submissionAttempts}
        className={props.className}
      >
        {control}
      </FormFieldLayout>
    );
  }
  if (props.readOnly) {
    return (
      <FormFieldLayout
        id={field.name}
        label={props.label}
        required={props.required}
        description={props.description}
        index={props.index}
        field={field}
        submissionAttempts={submissionAttempts}
        className={props.className}
      >
        <JsonEditor
          id={field.name}
          value={stringifyJsonFieldValue(field.state.value)}
          onChange={() => {}}
          readOnly
          aria-labelledby={`${field.name}-label`}
        />
      </FormFieldLayout>
    );
  }

  function parseAndCommit(nextText: string) {
    const result = parseJsonFieldText({ text: nextText });
    if (result.ok) {
      setParseError(undefined);
      field.handleChange(result.value);
    } else {
      setParseError(result.error);
    }
  }

  function handleChange(nextText: string) {
    setText(nextText);
    parseAndCommit(nextText);
  }

  function handleFormat() {
    const result = parseJsonFieldText({ text });
    if (result.ok) {
      setText(stringifyJsonFieldValue(result.value));
      setParseError(undefined);
      field.handleChange(result.value);
    } else {
      setParseError(result.error);
    }
  }

  const control = (
    <JsonEditor
      id={field.name}
      value={text}
      onChange={handleChange}
      onBlur={field.handleBlur}
      invalid={Boolean(parseError)}
      aria-labelledby={`${field.name}-label`}
      aria-required={props.required}
    />
  );
  return (
    <FormFieldLayout
      id={field.name}
      field={field}
      submissionAttempts={submissionAttempts}
      description={props.description}
      className={props.className}
      after={parseError ? <p className="text-[0.8rem] text-destructive">{parseError}</p> : undefined}
      before={
        <div className="flex items-center justify-between gap-2">
          <span id={`${field.name}-label`}>
            {props.index !== undefined ? `[${props.index + 1}] - ` : ""}
            {props.label}
            {props.required && <span className="text-red-500">*</span>}
          </span>
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={handleFormat}
            disabled={text.trim() === "" || Boolean(parseError)}
          >
            Format
          </Button>
        </div>
      }
    >
      {control}
    </FormFieldLayout>
  );
}
```

> Note: the Format button sits beside the label, not below the control — this duplicates
> `FormFieldLayout`'s own label rendering the way `CheckboxField`/`SelectField`'s radio branch do;
> `label`/`required` are omitted from `FormFieldLayout`'s own props so it renders description/error
> only, and the label+button row is built in `before` instead.

#### packages/react/src/forms/JsonField.test.tsx

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { JsonField } from "./JsonField";

const { fieldContext, formContext } = createFormHookContexts();
const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { JsonField },
  formComponents: {},
});

function Harness(props: { initialValue: unknown; readOnly?: boolean }) {
  const form = useAppForm({ defaultValues: { meta: props.initialValue } });
  return (
    <form.AppForm>
      <form.AppField name="meta">
        {(field) => <field.JsonField label="Meta" readOnly={props.readOnly} />}
      </form.AppField>
      <form.Subscribe selector={(state) => state.values.meta}>
        {(value) => <output data-testid="value-probe">{JSON.stringify(value)}</output>}
      </form.Subscribe>
    </form.AppForm>
  );
}

describe("JsonField", () => {
  it("pretty-prints the initial value", () => {
    render(<Harness initialValue={{ a: 1 }} />);
    expect(screen.getByDisplayValue('{\n  "a": 1\n}')).toBeInTheDocument();
  });

  it("commits a valid edit and shows no parse error", async () => {
    const user = userEvent.setup();
    render(<Harness initialValue={{}} />);
    const editor = screen.getByLabelText(/Meta/);
    await user.clear(editor);
    await user.type(editor, '{{}"a":2}');
    expect(screen.getByTestId("value-probe")).toHaveTextContent('{"a":2}');
  });

  it("shows a parse error and leaves the committed value untouched on invalid text", async () => {
    const user = userEvent.setup();
    render(<Harness initialValue={{ a: 1 }} />);
    const editor = screen.getByLabelText(/Meta/);
    await user.clear(editor);
    await user.type(editor, "{not json}");
    expect(screen.getByText(/Unexpected token|Expected property name/)).toBeInTheDocument();
    expect(screen.getByTestId("value-probe")).toHaveTextContent('{"a":1}');
  });

  it("renders a read-only editor with no Format button when readOnly", () => {
    render(<Harness initialValue={{ a: 1 }} readOnly />);
    expect(screen.queryByRole("button", { name: "Format" })).not.toBeInTheDocument();
  });
});
```

#### packages/react/src/forms/useAppForm.ts

4 edits — one import line per field plus their entries in `fieldComponents` (`:4-10` below is the
whole new body of the object literal that was `{}` in step 8).

**1 — imports**, beside the existing `formContext`/`fieldContext` import:

```ts
import { TextField } from "./TextField";
import { TextareaField } from "./TextareaField";
import { EmailField } from "./EmailField";
import { UrlField } from "./UrlField";
import { NumberField } from "./NumberField";
import { CheckboxField } from "./CheckboxField";
import { SelectField } from "./SelectField";
import { DateField } from "./DateField";
import { ColorField } from "./ColorField";
import { JsonField } from "./JsonField";
```

**2 — `fieldComponents`**, replacing the empty object literal:

```ts
  fieldComponents: {
    TextField,
    TextareaField,
    EmailField,
    UrlField,
    NumberField,
    CheckboxField,
    SelectField,
    DateField,
    ColorField,
    JsonField,
  },
```

#### packages/react/src/forms/index.ts

1 edit — ten new re-export lines, beside the existing `FormFieldLayout`/`useAppForm` exports:

```ts
export { TextField, type TextFieldProps } from "./TextField";
export { TextareaField, type TextareaFieldProps } from "./TextareaField";
export { EmailField, type EmailFieldProps } from "./EmailField";
export { UrlField, type UrlFieldProps } from "./UrlField";
export { NumberField, type NumberFieldProps } from "./NumberField";
export { CheckboxField, type CheckboxFieldProps } from "./CheckboxField";
export { SelectField, type SelectFieldProps, type SelectFieldOption } from "./SelectField";
export { DateField, type DateFieldProps } from "./DateField";
export { ColorField, type ColorFieldProps, type ColorFieldThemeToken } from "./ColorField";
export { JsonField, type JsonFieldProps } from "./JsonField";
```

---

### Step 10 — App form list + container fields [agent]
Why: decision 7; generic list mechanics from `FormArray` / `FormBlocks` without `fieldDef`, config or permissions.
Verify: `pnpm --filter @vexcms/react test`
- [ ] `forms/useArrayItems.ts` (+ test) — stable keys, add / insert / duplicate / remove / move / reorder, `atMax`
- [ ] `forms/useFieldErrorCount.ts` — the counting/attempt logic `BlocksField` needs, read off `useFormContext()`; a temporary parallel copy of `hooks/useFieldErrorCount.ts`'s pure/context logic, consolidated into one file in step 12 (see that step) once the admin tree itself mounts under the new form context — `hooks/useFieldErrorCount.ts` cannot be git-mv'd here, since `FormTabs`/`FormCollapsible` (unmigrated until step 13) are still mounted under the old `AppFormContext` at this point in the sequence
- [ ] `forms/FormCompactContext.tsx`, `forms/ArrayItemHeaderContext.ts` moved from `components/form/`
- [ ] `forms/ArrayField.tsx` (+ test) — header, items, `renderItem`, `itemActions` / `headerActions` slots, collapse/expand all, empty state, add, max, error
- [ ] `forms/BlocksField.tsx` (+ test) — accordion items, `blockTypes`, `renderBlock`, optional `cloneBlock` prop (built-in Duplicate only when given), picker (controlled or not), slots, error badge + open-on-failed-submit
- [ ] `forms/GroupField.tsx` (+ test) — fieldset layout with `children`
- [ ] `components/ui/ActionsMenu.tsx` moved from `components/form/`

`ArrayField` and `BlocksField` keep every generic mechanic `FormArray`/`FormBlocks` (read in full
for this step) own today — stable item keys across reorders, add/insert/duplicate/remove/move,
collapse/expand-all, the compact-width ⋯ menu, drag-and-drop (`components/ui/dnd`) — and drop every
admin mechanic: `fieldDef.items`/`fieldDef.blocks` reads, `fieldToInputComponent`/`RenderFields`
lookups, RBAC (`usePermission`), the block clipboard (copy/paste/replace-all stay admin-only — the
admin `fields/blocks/Field.tsx` in step 13 keeps `BlockActionsMenu`'s copy/paste and `FormBlocks`'
Replace-all dialog, neither of which is clipboard-independent), and `SlotOutlet`-resolved project
contributions. Where the admin version resolved a slot's contributed components itself, the form
version takes the **already-rendered** result as a plain `ReactNode`/render-prop — the admin
`fields/array/Field.tsx` / `fields/blocks/Field.tsx` (step 13) compute the `SlotOutlet` output and
hand it down as `itemActions`/`headerActions`.

`BlocksField`'s own built-in per-block actions (move up/down, insert above/below, remove, and
Duplicate when `cloneBlock` is given) render unconditionally inside its ⋯ menu — unlike
`ArrayField`'s items, a block's accordion header is already carrying a drag handle, index, type
badge, error badge and chevron, so there is no inline-icon surface to split against; the original
`BlockActionsMenu` already put insert/copy/paste in the menu only and reserved inline icons for
duplicate/move/remove only while wide. This entry simplifies to "always menu" for the generic
actions it keeps, same reasoning, one fewer surface to maintain. `useFieldErrorCount` and
`useFailedSubmitAttempt` read `AppFormContext` today (`hooks/useFieldErrorCount.ts`), the admin
form-state context this entry's `formContext.ts` (step 8) replaces with TanStack's own
`createFormHookContexts()` pair — not generic, and `hooks/useFieldErrorCount.ts` cannot move yet
(`FormTabs.tsx`/`FormCollapsible.tsx` still read it against the OLD admin tree until step 12's
cutover), so `BlocksField`'s error badge and open-on-failed-submit behavior port their own copy
for now, reading `useFormContext()` instead; step 12 deletes `hooks/useFieldErrorCount.ts` and
repoints every admin importer at this file once that duplication is safe to collapse.
`useMeasuredCompact` has no such dependency (it only measures a ref) and moves unchanged with the
rest of `FormCompactContext.tsx`.

#### packages/react/src/forms/useArrayItems.ts

```ts
"use client";

import { useRef, useState } from "react";

/** A request from "Collapse all" / "Expand all" to every item. */
export interface ArrayItemsOpenSignal {
  /** Bumped on every request; `0` means none has been made. */
  version: number;
  /** Whether the request opens (`true`) or collapses (`false`) every item. */
  open: boolean;
}

/** The subset of a TanStack array-mode `FieldApi` the hook needs. */
export interface ArrayItemsField<TItem> {
  state: { value: TItem[] | undefined };
  pushValue: (item: TItem) => void;
  insertValue: (index: number, item: TItem) => void;
  removeValue: (index: number) => void;
  moveValue: (from: number, to: number) => void;
}

export interface UseArrayItemsOptions<TItem> {
  field: ArrayItemsField<TItem>;
  /** Builds a new item for "Add". */
  createItem: () => TItem;
  /**
   * Builds a duplicate from a source item — defaults to a shallow `{ ...source }`
   * copy for an object item, or the item itself for a primitive (a string/number/
   * boolean array item has no identity field to strip, so by-value duplication is
   * already a copy). Callers whose items carry an identity field (e.g. a stable
   * `id`) should strip or regenerate it here; the hook does not know the item shape.
   */
  cloneItem?: (item: TItem) => TItem;
  /** Caps `atMax`/add/duplicate growth; `undefined` means unbounded. */
  max?: number;
}

export interface UseArrayItemsResult<TItem> {
  items: TItem[];
  /** Stable per-position keys — same length and order as `items`, survives reorders. */
  itemKeys: string[];
  atMax: boolean;
  openSignal: ArrayItemsOpenSignal;
  collapseAll: () => void;
  expandAll: () => void;
  add: () => void;
  duplicate: (index: number) => void;
  remove: (index: number) => void;
  moveUp: (index: number) => void;
  moveDown: (index: number) => void;
  reorder: (from: number, to: number) => void;
}

function defaultCloneItem<TItem>(item: TItem): TItem {
  return typeof item === "object" && item !== null ? ({ ...(item as object) } as TItem) : item;
}

/**
 * Generic list mechanics shared by `ArrayField` and `BlocksField`: stable
 * React keys independent of the array's own index/identity, plus
 * add/duplicate/remove/move/reorder wired straight to the field's
 * `pushValue`/`insertValue`/`removeValue`/`moveValue`. Ported from
 * `FormArray.tsx`'s internal `keysRef`/`handle*` functions, generalized past
 * `withArrayItemId`/`fieldDef.items` (both admin-only).
 *
 * @param options - See {@link UseArrayItemsOptions}.
 * @returns See {@link UseArrayItemsResult}.
 */
export function useArrayItems<TItem>(options: UseArrayItemsOptions<TItem>): UseArrayItemsResult<TItem> {
  const items = options.field.state.value ?? [];
  const atMax = options.max !== undefined && items.length >= options.max;

  const keysRef = useRef<string[]>([]);
  if (keysRef.current.length < items.length) {
    keysRef.current = [
      ...keysRef.current,
      ...Array.from({ length: items.length - keysRef.current.length }, () => crypto.randomUUID()),
    ];
  } else if (keysRef.current.length > items.length) {
    keysRef.current = keysRef.current.slice(0, items.length);
  }

  const [openSignal, setOpenSignal] = useState<ArrayItemsOpenSignal>({ version: 0, open: true });

  function collapseAll(): void {
    setOpenSignal((signal) => ({ version: signal.version + 1, open: false }));
  }

  function expandAll(): void {
    setOpenSignal((signal) => ({ version: signal.version + 1, open: true }));
  }

  function add(): void {
    keysRef.current = [...keysRef.current, crypto.randomUUID()];
    options.field.pushValue(options.createItem());
  }

  function duplicate(index: number): void {
    const source = items[index];
    if (source === undefined) return;
    const clone = (options.cloneItem ?? defaultCloneItem)(source);
    const newKeys = [...keysRef.current];
    newKeys.splice(index + 1, 0, crypto.randomUUID());
    keysRef.current = newKeys;
    options.field.insertValue(index + 1, clone);
  }

  function remove(index: number): void {
    const newKeys = [...keysRef.current];
    newKeys.splice(index, 1);
    keysRef.current = newKeys;
    options.field.removeValue(index);
  }

  function moveUp(index: number): void {
    if (index === 0) return;
    const newKeys = [...keysRef.current];
    [newKeys[index - 1], newKeys[index]] = [newKeys[index]!, newKeys[index - 1]!];
    keysRef.current = newKeys;
    options.field.moveValue(index, index - 1);
  }

  function moveDown(index: number): void {
    if (index === items.length - 1) return;
    const newKeys = [...keysRef.current];
    [newKeys[index + 1], newKeys[index]] = [newKeys[index]!, newKeys[index + 1]!];
    keysRef.current = newKeys;
    options.field.moveValue(index, index + 1);
  }

  function reorder(from: number, to: number): void {
    const newKeys = [...keysRef.current];
    const [moved] = newKeys.splice(from, 1);
    newKeys.splice(to, 0, moved!);
    keysRef.current = newKeys;
    options.field.moveValue(from, to);
  }

  return {
    items,
    itemKeys: keysRef.current,
    atMax,
    openSignal,
    collapseAll,
    expandAll,
    add,
    duplicate,
    remove,
    moveUp,
    moveDown,
    reorder,
  };
}
```

#### packages/react/src/forms/useArrayItems.test.tsx

```tsx
import { describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useArrayItems, type ArrayItemsField } from "./useArrayItems";

function makeField(initial: string[]): ArrayItemsField<string> & { value: string[] } {
  const state = { value: [...initial] };
  return {
    state,
    get value() {
      return state.value;
    },
    pushValue: (item) => {
      state.value = [...state.value, item];
    },
    insertValue: (index, item) => {
      const next = [...state.value];
      next.splice(index, 0, item);
      state.value = next;
    },
    removeValue: (index) => {
      const next = [...state.value];
      next.splice(index, 1);
      state.value = next;
    },
    moveValue: (from, to) => {
      const next = [...state.value];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved!);
      state.value = next;
    },
  };
}

describe("useArrayItems", () => {
  it("adds a new item and a matching key", () => {
    const field = makeField(["a"]);
    const { result, rerender } = renderHook(
      (props: { field: typeof field }) => useArrayItems({ field: props.field, createItem: () => "b" }),
      { initialProps: { field } },
    );
    act(() => result.current.add());
    rerender({ field });
    expect(field.value).toEqual(["a", "b"]);
    expect(result.current.itemKeys).toHaveLength(2);
  });

  it("duplicates an item immediately after itself with a fresh key", () => {
    const field = makeField(["a", "b"]);
    const { result, rerender } = renderHook(
      (props: { field: typeof field }) =>
        useArrayItems({ field: props.field, createItem: () => "x" }),
      { initialProps: { field } },
    );
    const keysBefore = result.current.itemKeys;
    act(() => result.current.duplicate(0));
    rerender({ field });
    expect(field.value).toEqual(["a", "a", "b"]);
    expect(result.current.itemKeys[0]).toBe(keysBefore[0]);
    expect(result.current.itemKeys[1]).not.toBe(keysBefore[1]);
  });

  it("reports atMax once the length reaches max", () => {
    const field = makeField(["a", "b"]);
    const { result } = renderHook(() => useArrayItems({ field, createItem: () => "x", max: 2 }));
    expect(result.current.atMax).toBe(true);
  });

  it("moveUp/moveDown are no-ops past the array's bounds", () => {
    const field = makeField(["a", "b"]);
    const { result, rerender } = renderHook(
      (props: { field: typeof field }) =>
        useArrayItems({ field: props.field, createItem: () => "x" }),
      { initialProps: { field } },
    );
    act(() => result.current.moveUp(0));
    rerender({ field });
    expect(field.value).toEqual(["a", "b"]);
    act(() => result.current.moveDown(1));
    rerender({ field });
    expect(field.value).toEqual(["a", "b"]);
  });

  it("bumps openSignal's version on collapseAll/expandAll", () => {
    const field = makeField(["a"]);
    const { result } = renderHook(() => useArrayItems({ field, createItem: () => "x" }));
    expect(result.current.openSignal).toEqual({ version: 0, open: true });
    act(() => result.current.collapseAll());
    expect(result.current.openSignal).toEqual({ version: 1, open: false });
  });
});
```

#### packages/react/src/forms/useFieldErrorCount.ts

Not re-exported from `./index.ts` — an internal helper `BlocksField` uses for its per-block error
badge and open-on-failed-submit behavior, the same status as `changedValues.ts`. A temporary
parallel copy of `hooks/useFieldErrorCount.ts`'s logic, ported off `useFormContext()` instead of
`AppFormContext` — `hooks/useFieldErrorCount.ts` itself is untouched by this step (`FormTabs`/
`FormCollapsible` still read it against the old admin tree) and is consolidated into this same
file by step 12, once that duplication is safe to collapse (see that step).

```ts
"use client";

import { useStore } from "@tanstack/react-form";
import type { AnyFormApi } from "@tanstack/react-form";
import { useFormContext } from "./formContext";

/**
 * Whether a form field path falls under one of the given name prefixes — the
 * path equals the prefix itself, or continues it with `.` (a group/object
 * sub-field) or `[` (an array/blocks item).
 *
 * @param path - The form field path to test.
 * @param names - The name prefixes to test `path` against.
 * @returns `true` if `path` equals or nests under any of `names`.
 */
export function matchesFieldNamePrefix(path: string, names: readonly string[]): boolean {
  return names.some(
    (name) => path === name || path.startsWith(`${name}.`) || path.startsWith(`${name}[`),
  );
}

/**
 * Every field path currently holding a validation error: each registered
 * field's own `fieldMeta.errors`, plus every path in a form-level validator's
 * per-path error map. The second source is what covers a field that is not
 * mounted — a collapsed block's — since TanStack only distributes a
 * form-level error onto a field registered when validation ran.
 *
 * @param state - The TanStack form state to collect errored paths from.
 * @returns The set of every field path currently holding a validation error.
 */
export function collectErroredPaths(state: AnyFormApi["state"]): Set<string> {
  const paths = new Set<string>();
  for (const [path, meta] of Object.entries(state.fieldMeta)) {
    if (meta && meta.errors.length > 0) paths.add(path);
  }
  for (const formError of Object.values(state.errorMap)) {
    if (typeof formError !== "object" || formError === null || Array.isArray(formError)) continue;
    for (const [path, issues] of Object.entries(formError)) {
      if (Array.isArray(issues) ? issues.length > 0 : Boolean(issues)) paths.add(path);
    }
  }
  return paths;
}

function countUnder(paths: Set<string>, names: readonly string[]): number {
  let count = 0;
  for (const path of paths) {
    if (matchesFieldNamePrefix(path, names)) count += 1;
  }
  return count;
}

/**
 * Counts the fields with a validation error whose path is one of `names`, or
 * a nested path under one of them — the error badge one `BlocksField` block
 * shows for its own sub-fields.
 *
 * @param props.names - Field name prefixes to count errors under.
 * @returns The number of distinct erroring field paths under `names`.
 */
export function useFieldErrorCount(props: { names: readonly string[] }): number {
  const form = useFormContext();
  return useStore(form.store, (state) => countUnder(collectErroredPaths(state), props.names));
}

/**
 * The attempt number of the latest submit that ended without success, `0`
 * until the first one (or while a submit is in flight).
 *
 * @param state - The form store state to read submission status from.
 * @returns The failed attempt number, or `0` if no attempt has failed yet.
 */
export function failedSubmitAttemptOf(state: {
  submissionAttempts: number;
  isSubmitting: boolean;
  isSubmitSuccessful: boolean;
}): number {
  return state.submissionAttempts > 0 && !state.isSubmitting && !state.isSubmitSuccessful
    ? state.submissionAttempts
    : 0;
}

/**
 * Bumps once per failed submit — {@link failedSubmitAttemptOf}. `BlocksField`
 * reacts to it by opening any block that still holds an error.
 *
 * @returns The failed attempt number, or `0` if no attempt has failed yet.
 */
export function useFailedSubmitAttempt(): number {
  const form = useFormContext();
  return useStore(form.store, failedSubmitAttemptOf);
}
```

#### packages/react/src/forms/FormCompactContext.tsx

`git mv packages/react/src/components/form/FormCompactContext.tsx packages/react/src/forms/FormCompactContext.tsx`
— content unchanged (no relative imports to fix; `FORM_COMPACT_WIDTH_PX`, `FormCompactContext`,
`useCompactForm`, `useMeasuredCompact`, `FormCompactProvider` all stay as-is).

#### packages/react/src/forms/ArrayItemHeaderContext.ts

`git mv packages/react/src/components/form/ArrayItemHeaderContext.ts packages/react/src/forms/ArrayItemHeaderContext.ts`,
then 1 edit. The file's own `ArrayItemsOpenSignal` interface is now a duplicate of
`useArrayItems.ts`'s export of the same shape — drop it and import that one instead, so there is a
single definition:

```ts
"use client";

import { createContext, type ReactNode } from "react";
import type { ArrayItemsOpenSignal } from "./useArrayItems";

/**
 * What a group-shaped array item's own `GroupField` renders on its accordion
 * header: the drag handle before the label, the item actions (duplicate,
 * move, remove, project additions) before the chevron, and the array's
 * latest Collapse all / Expand all request. `GroupField` resets it to `null`
 * for its own `children`, so a nested group never inherits its parent item's
 * header.
 */
export interface ArrayItemHeader {
  dragHandle: ReactNode;
  actions: ReactNode;
  openSignal: ArrayItemsOpenSignal;
}

/** Carries the enclosing array item's header content down to its `GroupField`. */
export const ArrayItemHeaderContext = createContext<ArrayItemHeader | null>(null);
```

#### packages/react/src/forms/ArrayField.tsx

```tsx
"use client";

import type { ReactNode } from "react";
import { useStore } from "@tanstack/react-form";
import { ChevronsDownUpIcon, ChevronsUpDownIcon } from "lucide-react";
import { useFieldContext, useFormContext } from "./formContext";
import { FormFieldLayout } from "./FormFieldLayout";
import { useArrayItems, type ArrayItemsField } from "./useArrayItems";
import { ArrayItemHeaderContext } from "./ArrayItemHeaderContext";
import { useCompactForm } from "./FormCompactContext";
import { ActionsMenu, HeaderAction, type ActionPlacement } from "../components/ui/ActionsMenu";
import { Droppable, Draggable, DragHandle } from "../components/ui/dnd";
import { Button } from "../components/ui/button";
import type { BaseFormFieldProps } from "./types";

export interface ArrayFieldProps<TItem> extends BaseFormFieldProps<TItem[]> {
  /** Singular noun for the "Add <itemLabel>" button, e.g. `"Tag"`. */
  itemLabel: string;
  /** Plural noun for counts/empty state, e.g. `"tags"`. */
  pluralLabel: string;
  max?: number;
  createItem: () => TItem;
  cloneItem?: (item: TItem) => TItem;
  /** Renders one item's fields, given its form-path `name` and position. */
  renderItem: (props: { name: string; index: number; item: TItem }) => ReactNode;
  /**
   * `true` when an item renders its OWN header (a nested `GroupField`
   * consuming `ArrayItemHeaderContext`) — the gutter drag-handle/index-number
   * row is skipped in favor of that. Defaults to `false` (the gutter row).
   */
  itemsHaveOwnHeader?: boolean;
  /** Per-item actions (duplicate, move, remove, …) — already-resolved nodes, never a slot id. */
  itemActions?: (props: { index: number; itemCount: number; placement: ActionPlacement }) => ReactNode;
  /** Field-level actions rendered beside the label, ahead of Collapse all / Expand all. */
  headerActions?: ReactNode;
}

/**
 * A dynamic list field bound to the nearest `<form.AppField name="..." mode="array">`.
 * Owns add/duplicate/remove/move/reorder (via {@link useArrayItems}), the
 * compact-width ⋯ menu, collapse/expand all, and the empty/max states; the
 * caller supplies each item's own fields through `renderItem`.
 *
 * @param props - See {@link ArrayFieldProps} and {@link BaseFormFieldProps}.
 * @returns The field header, item list (or empty state), add control and error.
 */
export function ArrayField<TItem>(props: ArrayFieldProps<TItem>): ReactNode {
  const field = useFieldContext<TItem[]>();
  const form = useFormContext();
  const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts);
  const {
    items,
    itemKeys,
    atMax,
    openSignal,
    collapseAll,
    expandAll,
    add,
    reorder,
  } = useArrayItems({
    field: field as unknown as ArrayItemsField<TItem>,
    createItem: props.createItem,
    cloneItem: props.cloneItem,
    max: props.max,
  });
  const compact = useCompactForm();
  const label = props.label ?? field.name;

  function collapseExpandControls(placement: ActionPlacement): ReactNode {
    return (
      <>
        <HeaderAction placement={placement} icon={<ChevronsDownUpIcon className="size-4" />} label="Collapse all" onClick={collapseAll} />
        <HeaderAction placement={placement} icon={<ChevronsUpDownIcon className="size-4" />} label="Expand all" onClick={expandAll} />
      </>
    );
  }

  const showHeaderActions = props.headerActions !== undefined || items.length > 0;

  return (
    <FormFieldLayout
      id={field.name}
      description={props.description}
      field={field}
      submissionAttempts={submissionAttempts}
      className={props.className}
    >
      <div role="group" aria-labelledby={`${field.name}-label`} aria-disabled={props.readOnly} className="flex flex-col gap-3 rounded-sm border-2 px-3 py-2">
        <div className="flex min-h-8 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span id={`${field.name}-label`} className="relative flex items-center gap-2 text-sm leading-none font-medium select-none">
              {props.index !== undefined ? `[${props.index + 1}] - ` : ""}
              {label}
              {props.required && <span className="text-red-500">*</span>}
            </span>
            {items.length > 0 && (
              <span className="text-xs text-muted-foreground tabular-nums">
                {items.length}
                {props.max !== undefined ? `/${props.max}` : ""} {props.pluralLabel}
              </span>
            )}
          </div>
          {showHeaderActions &&
            (compact ? (
              <ActionsMenu label={`${label} actions`}>
                {props.headerActions}
                {items.length > 0 && collapseExpandControls("menu")}
              </ActionsMenu>
            ) : (
              <div className="flex shrink-0 items-center gap-1">
                {props.headerActions}
                {items.length > 0 && collapseExpandControls("inline")}
              </div>
            ))}
        </div>
        {items.length > 0 ? (
          <Droppable id={field.name} onReorder={reorder}>
            {items.map((item, index) => {
              const itemName = `${field.name}[${index}]`;
              const itemActionsNode = props.itemActions?.({
                index,
                itemCount: items.length,
                placement: compact ? "menu" : "inline",
              });
              const dragHandle = <DragHandle disabled={Boolean(props.readOnly)} />;
              return (
                <Draggable key={itemKeys[index]} id={`${field.name}-${itemKeys[index]}`} index={index} isDragDisabled={Boolean(props.readOnly)}>
                  {props.itemsHaveOwnHeader ? (
                    <ArrayItemHeaderContext.Provider value={{ dragHandle, actions: itemActionsNode, openSignal }}>
                      {props.renderItem({ name: itemName, index, item })}
                    </ArrayItemHeaderContext.Provider>
                  ) : (
                    <div className="flex items-start gap-2">
                      <div className="flex h-8 shrink-0 items-center gap-2">
                        {dragHandle}
                        <span className="w-4 text-center font-mono text-xs text-muted-foreground tabular-nums">{index + 1}</span>
                      </div>
                      <div className="min-w-0 flex-1">{props.renderItem({ name: itemName, index, item })}</div>
                      <div className="flex h-8 shrink-0 items-center">{itemActionsNode}</div>
                    </div>
                  )}
                </Draggable>
              );
            })}
          </Droppable>
        ) : (
          <p className="text-muted-foreground text-sm">No {props.pluralLabel} yet.</p>
        )}
        <div className="flex items-center gap-2">
          <Button type="button" disabled={Boolean(props.readOnly) || atMax} variant="outline" size="sm" onClick={add} icon="Plus">
            Add {props.itemLabel}
          </Button>
          {atMax && (
            <span className="text-xs text-muted-foreground">
              Maximum {props.max} {props.pluralLabel} reached
            </span>
          )}
        </div>
      </div>
    </FormFieldLayout>
  );
}
```

> Note: `FormArray.tsx`'s non-grouped items hide their own per-item label (sr-only, via
> `HideFieldLabelContext`) because the gutter already shows the position. `HideFieldLabelContext`
> is not part of this entry (step 8/9 never introduced it); whether a leaf form field's own label
> still renders inside an array item is left to the step-13 admin `fields/array/Field.tsx`, which
> controls what `renderItem` renders and can pass `label={undefined}` itself — `ArrayField` has no
> opinion.

#### packages/react/src/forms/ArrayField.test.tsx

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { ArrayField } from "./ArrayField";
import { TextField } from "./TextField";

const { fieldContext, formContext } = createFormHookContexts();
const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { ArrayField, TextField },
  formComponents: {},
});

function Harness(props: { initialValue: string[]; max?: number }) {
  const form = useAppForm({ defaultValues: { tags: props.initialValue } });
  return (
    <form.AppForm>
      <form.AppField name="tags" mode="array">
        {(field) => (
          <field.ArrayField
            label="Tags"
            itemLabel="Tag"
            pluralLabel="tags"
            max={props.max}
            createItem={() => ""}
            renderItem={({ name }) => (
              <form.AppField name={name as "tags[0]"}>
                {(itemField) => <itemField.TextField label="Tag value" />}
              </form.AppField>
            )}
          />
        )}
      </form.AppField>
      <form.Subscribe selector={(state) => state.values.tags}>
        {(value) => <output data-testid="value-probe">{JSON.stringify(value)}</output>}
      </form.Subscribe>
    </form.AppForm>
  );
}

describe("ArrayField", () => {
  it("renders one renderItem per array entry", () => {
    render(<Harness initialValue={["a", "b"]} />);
    expect(screen.getAllByLabelText(/Tag value/)).toHaveLength(2);
  });

  it("shows the empty state with no items", () => {
    render(<Harness initialValue={[]} />);
    expect(screen.getByText("No tags yet.")).toBeInTheDocument();
  });

  it("adds a new item on click", async () => {
    const user = userEvent.setup();
    render(<Harness initialValue={[]} />);
    await user.click(screen.getByRole("button", { name: "Add Tag" }));
    expect(screen.getByTestId("value-probe")).toHaveTextContent('[""]');
  });

  it("disables add once max is reached", () => {
    render(<Harness initialValue={["a", "b"]} max={2} />);
    expect(screen.getByRole("button", { name: "Add Tag" })).toBeDisabled();
    expect(screen.getByText("Maximum 2 tags reached")).toBeInTheDocument();
  });
});
```

#### packages/react/src/forms/BlocksField.tsx

```tsx
"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@tanstack/react-form";
import {
  ArrowDownIcon,
  ArrowDownToLineIcon,
  ArrowUpIcon,
  ArrowUpToLineIcon,
  ChevronsDownUpIcon,
  ChevronsUpDownIcon,
  CircleAlert,
  CopyIcon,
  LayersIcon,
  SearchIcon,
  TrashIcon,
} from "lucide-react";
import { useFieldContext, useFormContext } from "./formContext";
import { FormFieldLayout } from "./FormFieldLayout";
import { useArrayItems, type ArrayItemsField } from "./useArrayItems";
import { useCompactForm, useMeasuredCompact } from "./FormCompactContext";
import { useFieldErrorCount, useFailedSubmitAttempt } from "./useFieldErrorCount";
import { ActionsMenu, HeaderAction, SurfacedAction, type ActionPlacement } from "../components/ui/ActionsMenu";
import { Droppable, Draggable, DragHandle } from "../components/ui/dnd";
import { Accordion, AccordionItem, AccordionContent, AccordionTrigger } from "../components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { DropdownMenuItem } from "../components/ui/dropdown-menu";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import type { BaseFormFieldProps } from "./types";

/** One block type the picker can insert — plain data, no core `BlockConfig` dependency. */
export interface BlockTypeOption<TBlock> {
  type: string;
  label: string;
  icon?: ReactNode;
  defaultCollapsed?: boolean;
  newBlock: () => TBlock;
}

/**
 * The minimal shape every block item carries — structurally identical to
 * core's `GenericBlock` (`id`, `blockType`, optional `blockName`), without
 * importing it: this entry never reads core/admin field shapes (decision
 * 16), so the shape is declared here, independently, and only happens to
 * match. `blockType` looks up the item's `BlockTypeOption`; `blockName` is
 * the user-editable label `BlocksFieldItem` renders as an input.
 */
export interface GenericBlockItem {
  id: string;
  blockType: string;
  blockName?: string;
  [key: string]: unknown;
}

export interface BlocksFieldProps<TBlock extends GenericBlockItem> extends BaseFormFieldProps<TBlock[]> {
  blockTypes: BlockTypeOption<TBlock>[];
  max?: number;
  /** Renders one block's own fields, given its form-path `name`, position and type. */
  renderBlock: (props: { name: string; index: number; block: TBlock; blockType: BlockTypeOption<TBlock> }) => ReactNode;
  /** Controlled picker-open state; omit for an internally-managed (uncontrolled) picker. */
  picker?: { open: boolean; onOpenChange: (open: boolean) => void };
  itemActions?: (props: { index: number; blockCount: number; placement: ActionPlacement }) => ReactNode;
  headerActions?: ReactNode;
  /**
   * Clones a block for the built-in Duplicate item action, with a fresh
   * `id` (and fresh ids on any of its own nested blocks). Omit to drop
   * Duplicate from the built-in item actions entirely — this entry never
   * reads `fieldDef`/`blockDef`, so it cannot synthesize a clone itself.
   */
  cloneBlock?: (block: TBlock) => TBlock;
}

function BlockPickerDialog<TBlock extends GenericBlockItem>(props: {
  blockTypes: BlockTypeOption<TBlock>[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (blockType: BlockTypeOption<TBlock>) => void;
}): ReactNode {
  const [search, setSearch] = useState("");
  const filtered = props.blockTypes.filter(
    (blockType) =>
      blockType.label.toLowerCase().includes(search.toLowerCase()) ||
      blockType.type.toLowerCase().includes(search.toLowerCase()),
  );

  function handleSelect(blockType: BlockTypeOption<TBlock>): void {
    props.onSelect(blockType);
    setSearch("");
  }

  return (
    <Dialog
      open={props.open}
      onOpenChange={(open) => {
        if (!open) setSearch("");
        props.onOpenChange(open);
      }}
    >
      <DialogContent className="w-full max-w-sm p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle>Add block</DialogTitle>
          <DialogDescription>Select a block</DialogDescription>
        </DialogHeader>
        <div className="relative px-4 pb-2">
          <SearchIcon aria-hidden className="pointer-events-none absolute left-6.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search blocks…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-7"
            autoFocus
          />
        </div>
        <div className="max-h-72 overflow-y-auto px-2 pb-3">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No blocks found</p>
          ) : (
            <div className="space-y-0.5">
              {filtered.map((blockType) => (
                <button
                  key={blockType.type}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-muted"
                  onClick={() => handleSelect(blockType)}
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-muted">
                    {blockType.icon ?? <LayersIcon className="size-4 text-muted-foreground" />}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{blockType.label}</p>
                    <p className="truncate text-xs text-muted-foreground">{blockType.type}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Renders one block's accordion item: drag handle, order number, type badge,
 * a collapsed-with-errors marker, an editable `blockName` input, and the item actions.
 *
 * Its own component — one instance per block — so `useFieldErrorCount` can
 * be called unconditionally regardless of how many sibling blocks exist (a
 * hook call inside the parent's `.map` would violate Rules of Hooks whenever
 * a block is added or removed).
 */
function BlocksFieldItem<TBlock extends GenericBlockItem>(props: {
  name: string;
  index: number;
  itemsKey: string;
  block: TBlock;
  blockType: BlockTypeOption<TBlock>;
  readOnly: boolean;
  isOpen: boolean;
  itemActionsNode: ReactNode;
  renderBlock: BlocksFieldProps<TBlock>["renderBlock"];
  onUpdateBlockName: (blockName: string) => void;
  onOpen: () => void;
}): ReactNode {
  const errorCount = useFieldErrorCount({ names: [`${props.name}[${props.index}]`] });
  const failedSubmitAttempt = useFailedSubmitAttempt();
  useEffect(() => {
    if (failedSubmitAttempt > 0 && errorCount > 0) props.onOpen();
  }, [failedSubmitAttempt]);

  return (
    <Draggable id={`${props.name}-${props.itemsKey}`} index={props.index} isDragDisabled={props.readOnly}>
      <AccordionItem value={props.block.id}>
        <AccordionTrigger leading={<DragHandle disabled={props.readOnly} />} actions={props.itemActionsNode}>
          <span className="w-4 shrink-0 text-center font-mono text-xs text-muted-foreground tabular-nums">{props.index + 1}</span>
          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{props.blockType.label}</span>
          {!props.isOpen && errorCount > 0 && <CircleAlert className="size-3.5 shrink-0 text-destructive" />}
          <Input
            type="text"
            value={props.block.blockName ?? ""}
            onChange={(e) => props.onUpdateBlockName(e.target.value)}
            disabled={props.readOnly}
            placeholder={props.blockType.label}
            className="w-full truncate border-none bg-transparent p-0 text-sm font-medium outline-none placeholder:text-muted-foreground focus:ring-0 disabled:opacity-50"
            onClick={(e) => e.stopPropagation()}
          />
        </AccordionTrigger>
        <AccordionContent>
          {props.renderBlock({ name: `${props.name}[${props.index}]`, index: props.index, block: props.block, blockType: props.blockType })}
        </AccordionContent>
      </AccordionItem>
    </Draggable>
  );
}

/**
 * An accordion-list blocks field bound to the nearest `<form.AppField
 * name="..." mode="array">`: add/duplicate/remove/move/reorder (via
 * {@link useArrayItems}), per-block open/collapsed state with
 * collapse/expand-all, an error badge that forces a failed block open on a
 * failed submit, and a type picker dialog.
 *
 * @param props - See {@link BlocksFieldProps} and {@link BaseFormFieldProps}.
 * @returns The field header, accordion list (or empty state), add control, error and picker.
 */
export function BlocksField<TBlock extends GenericBlockItem>(props: BlocksFieldProps<TBlock>): ReactNode {
  const field = useFieldContext<TBlock[]>();
  const form = useFormContext();
  const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts);
  const blockTypeMap = new Map(props.blockTypes.map((blockType) => [blockType.type, blockType]));
  const { items, itemKeys, atMax, duplicate, remove, moveUp, moveDown, reorder } = useArrayItems({
    field: field as unknown as ArrayItemsField<TBlock>,
    createItem: () => {
      throw new Error("BlocksField items are added through the picker, not a bare createItem");
    },
    cloneItem: props.cloneBlock,
    max: props.max,
  });
  const label = props.label ?? field.name;

  const [openIds, setOpenIds] = useState<string[]>(() =>
    items.filter((block) => !blockTypeMap.get(block.blockType)?.defaultCollapsed).map((block) => block.id),
  );

  const [internalPickerOpen, setInternalPickerOpen] = useState(false);
  const pickerOpen = props.picker?.open ?? internalPickerOpen;
  const setPickerOpen = props.picker?.onOpenChange ?? setInternalPickerOpen;

  const insertCursorRef = useRef<number | undefined>(undefined);

  function handleSelect(blockType: BlockTypeOption<TBlock>): void {
    const newBlock = blockType.newBlock();
    if (insertCursorRef.current === undefined) {
      field.pushValue(newBlock);
    } else {
      field.insertValue(insertCursorRef.current, newBlock);
      insertCursorRef.current += 1;
    }
    if (!blockType.defaultCollapsed) setOpenIds((open) => [...open, newBlock.id]);
  }

  function updateBlockName(index: number, blockName: string): void {
    const current = items[index];
    if (!current) return;
    const updated = [...items];
    updated[index] = { ...current, blockName };
    field.handleChange(updated);
  }

  function requestInsert(index: number | undefined): void {
    insertCursorRef.current = index;
    if (props.blockTypes.length === 1) {
      handleSelect(props.blockTypes[0]!);
      return;
    }
    setPickerOpen(true);
  }

  const headerRef = useRef<HTMLDivElement>(null);
  const headerCompact = useMeasuredCompact(headerRef);
  const compact = useCompactForm() || headerCompact;

  function collapseExpandControls(placement: ActionPlacement): ReactNode {
    return (
      <>
        <HeaderAction placement={placement} icon={<ChevronsDownUpIcon className="size-4" />} label="Collapse all" onClick={() => setOpenIds([])} />
        <HeaderAction placement={placement} icon={<ChevronsUpDownIcon className="size-4" />} label="Expand all" onClick={() => setOpenIds(items.map((block) => block.id))} />
      </>
    );
  }

  return (
    <FormFieldLayout id={field.name} description={props.description} field={field} submissionAttempts={submissionAttempts} className={props.className}>
      <div className="flex flex-col gap-3">
        <div ref={headerRef} className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span id={`${field.name}-label`} className="text-sm leading-none font-medium">
              {props.index !== undefined ? `[${props.index + 1}] - ` : ""}
              {label}
              {props.required && <span className="text-red-500">*</span>}
            </span>
            {items.length > 0 && (
              <span className="text-xs text-muted-foreground tabular-nums">
                {items.length}
                {props.max !== undefined ? `/${props.max}` : ""} blocks
              </span>
            )}
          </div>
          {(props.headerActions !== undefined || items.length > 0) &&
            (compact ? (
              <ActionsMenu label={`${label} actions`}>
                {props.headerActions}
                {items.length > 0 && collapseExpandControls("menu")}
              </ActionsMenu>
            ) : (
              <div className="flex shrink-0 items-center gap-1">
                {props.headerActions}
                {items.length > 0 && collapseExpandControls("inline")}
              </div>
            ))}
        </div>

        {items.length === 0 && (
          <div className="rounded-sm border-2 border-dashed border-border py-8 text-center">
            <LayersIcon className="mx-auto mb-2 size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No blocks yet.</p>
          </div>
        )}

        {items.length > 0 && (
          <Accordion value={openIds} onValueChange={setOpenIds} className="w-full">
            <Droppable id={field.name} div={{ className: "gap-0" }} onReorder={reorder}>
              {items.map((block, index) => {
                const blockType = blockTypeMap.get(block.blockType);
                if (!blockType) {
                  return (
                    <div key={block.id} className="rounded-sm border border-destructive/40 px-3 py-2 text-sm text-destructive">
                      Unknown block type: <code>{block.blockType}</code>
                      <Button type="button" variant="ghost" size="icon-xs" disabled={Boolean(props.readOnly)} onClick={() => remove(index)} className="ml-2">
                        <TrashIcon className="size-3.5" />
                      </Button>
                    </div>
                  );
                }
                const itemActionsNode = (
                  <ActionsMenu label={`Block ${index + 1} actions`}>
                    {props.cloneBlock && (
                      <SurfacedAction
                        placement="menu"
                        icon={<CopyIcon className="size-4" />}
                        label="Duplicate"
                        ariaLabel={`Duplicate block ${index + 1}`}
                        disabled={Boolean(props.readOnly) || atMax}
                        onClick={() => duplicate(index)}
                      />
                    )}
                    <SurfacedAction
                      placement="menu"
                      icon={<ArrowUpIcon className="size-4" />}
                      label="Move up"
                      ariaLabel={`Move block ${index + 1} up`}
                      disabled={Boolean(props.readOnly) || index === 0}
                      onClick={() => moveUp(index)}
                    />
                    <SurfacedAction
                      placement="menu"
                      icon={<ArrowDownIcon className="size-4" />}
                      label="Move down"
                      ariaLabel={`Move block ${index + 1} down`}
                      disabled={Boolean(props.readOnly) || index === items.length - 1}
                      onClick={() => moveDown(index)}
                    />
                    <DropdownMenuItem disabled={Boolean(props.readOnly) || atMax} onClick={() => requestInsert(index)}>
                      <ArrowUpToLineIcon className="size-4" />
                      Insert above
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={Boolean(props.readOnly) || atMax} onClick={() => requestInsert(index + 1)}>
                      <ArrowDownToLineIcon className="size-4" />
                      Insert below
                    </DropdownMenuItem>
                    <SurfacedAction
                      placement="menu"
                      icon={<TrashIcon className="size-4" />}
                      label="Remove"
                      ariaLabel={`Remove block ${index + 1}`}
                      disabled={Boolean(props.readOnly)}
                      onClick={() => remove(index)}
                      destructive
                    />
                    {props.itemActions?.({ index, blockCount: items.length, placement: "menu" })}
                  </ActionsMenu>
                );
                return (
                  <BlocksFieldItem
                    key={itemKeys[index]}
                    name={field.name}
                    index={index}
                    itemsKey={itemKeys[index]!}
                    block={block}
                    blockType={blockType}
                    readOnly={Boolean(props.readOnly)}
                    isOpen={openIds.includes(block.id)}
                    itemActionsNode={itemActionsNode}
                    renderBlock={props.renderBlock}
                    onUpdateBlockName={(blockName) => updateBlockName(index, blockName)}
                    onOpen={() => setOpenIds((open) => (open.includes(block.id) ? open : [...open, block.id]))}
                  />
                );
              })}
            </Droppable>
          </Accordion>
        )}

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => requestInsert(undefined)} disabled={Boolean(props.readOnly) || atMax} icon="Plus">
            Add block
          </Button>
          {atMax && <span className="text-xs text-muted-foreground">Maximum {props.max} blocks reached</span>}
        </div>
      </div>

      <BlockPickerDialog
        blockTypes={props.blockTypes}
        open={pickerOpen}
        onOpenChange={(open) => {
          if (!open) insertCursorRef.current = undefined;
          setPickerOpen(open);
        }}
        onSelect={handleSelect}
      />
    </FormFieldLayout>
  );
}
```

> Note: `FormBlocks.tsx`'s duplicate path calls core's `cloneBlockWithFreshIds({ block, blockDef })`
> (which also freshens the ids nested arrays/blocks carry) — that function is admin/core-field-shape
> aware and cannot move into this entry. Per decision 16, `BlocksField` instead exposes an optional
> `cloneBlock` prop: step 13's admin `fields/blocks/Field.tsx` passes
> `cloneBlock={(block) => cloneBlockWithFreshIds({ block, blockDef: blockDefMap.get(block.blockType)! })}`,
> and the built-in Duplicate item action renders only when `cloneBlock` is supplied.

#### packages/react/src/forms/BlocksField.test.tsx

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { BlocksField, type GenericBlockItem } from "./BlocksField";

interface HeroBlock extends GenericBlockItem {
  blockType: "hero";
  heading: string;
}

const { fieldContext, formContext } = createFormHookContexts();
const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { BlocksField },
  formComponents: {},
});

const blockTypes = [
  {
    type: "hero",
    label: "Hero",
    newBlock: (): HeroBlock => ({ id: crypto.randomUUID(), blockType: "hero", heading: "" }),
  },
];

function Harness(props: { initialValue: HeroBlock[]; max?: number; cloneBlock?: (block: HeroBlock) => HeroBlock }) {
  const form = useAppForm({ defaultValues: { body: props.initialValue } });
  return (
    <form.AppForm>
      <form.AppField name="body" mode="array">
        {(field) => (
          <field.BlocksField
            label="Body"
            blockTypes={blockTypes}
            max={props.max}
            cloneBlock={props.cloneBlock}
            renderBlock={({ block }) => <span data-testid={`block-${block.id}`}>{block.blockType}</span>}
          />
        )}
      </form.AppField>
      <form.Subscribe selector={(state) => state.values.body}>
        {(value) => <output data-testid="value-probe">{JSON.stringify(value.map((b) => b.blockType))}</output>}
      </form.Subscribe>
    </form.AppForm>
  );
}

describe("BlocksField", () => {
  it("shows the empty state with no blocks", () => {
    render(<Harness initialValue={[]} />);
    expect(screen.getByText("No blocks yet.")).toBeInTheDocument();
  });

  it("inserts the single block type immediately on Add, skipping the picker", async () => {
    const user = userEvent.setup();
    render(<Harness initialValue={[]} />);
    await user.click(screen.getByRole("button", { name: "Add block" }));
    expect(screen.getByTestId("value-probe")).toHaveTextContent('["hero"]');
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("disables Add once max is reached", () => {
    const existing: HeroBlock[] = [{ id: "a", blockType: "hero", heading: "" }];
    render(<Harness initialValue={existing} max={1} />);
    expect(screen.getByRole("button", { name: "Add block" })).toBeDisabled();
  });

  it("renders renderBlock for each existing item inside its accordion content", () => {
    const existing: HeroBlock[] = [{ id: "a", blockType: "hero", heading: "" }];
    render(<Harness initialValue={existing} />);
    expect(screen.getByTestId("block-a")).toBeInTheDocument();
  });

  it("omits Duplicate from item actions without a cloneBlock prop", async () => {
    const user = userEvent.setup();
    const existing: HeroBlock[] = [{ id: "a", blockType: "hero", heading: "" }];
    render(<Harness initialValue={existing} />);
    await user.click(screen.getByRole("button", { name: "Block 1 actions" }));
    expect(screen.queryByRole("menuitem", { name: "Duplicate" })).not.toBeInTheDocument();
  });

  it("inserts the cloned block at index + 1 when cloneBlock is given", async () => {
    const user = userEvent.setup();
    const existing: HeroBlock[] = [{ id: "a", blockType: "hero", heading: "Hi" }];
    const cloneBlock = (block: HeroBlock): HeroBlock => ({ ...block, id: "clone-of-a" });
    render(<Harness initialValue={existing} cloneBlock={cloneBlock} />);
    await user.click(screen.getByRole("button", { name: "Block 1 actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Duplicate" }));
    expect(screen.getAllByTestId(/^block-/)).toHaveLength(2);
    expect(screen.getByTestId("block-clone-of-a")).toBeInTheDocument();
  });
});
```

#### packages/react/src/forms/GroupField.tsx

```tsx
"use client";

import type { ReactNode } from "react";
import { useContext, useEffect, useRef, useState } from "react";
import { useStore } from "@tanstack/react-form";
import { useFieldContext, useFormContext } from "./formContext";
import { FormFieldLayout } from "./FormFieldLayout";
import { ArrayItemHeaderContext } from "./ArrayItemHeaderContext";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";
import type { BaseFormFieldProps } from "./types";

export interface GroupFieldProps extends Omit<BaseFormFieldProps<never>, "renderControl"> {
  /** The group's own fields — rendered by the caller, same as every other `renderItem`-style slot in this entry. */
  children: ReactNode;
  /** Collapsible as an accordion item; `false` renders a plain fieldset with no trigger. */
  collapsible?: boolean;
  defaultOpen?: boolean;
}

/**
 * A fieldset layout for a nested set of fields — label, optional
 * collapse/expand, description and error, wrapping `children`. Vastly
 * smaller than the deleted admin `FormGroup.tsx`: no `RenderFields` call, no
 * `fieldDef` walk, no accordion-open-state-key derivation from the array
 * item's stored id — the caller renders its own children and owns their
 * identity.
 *
 * Inside an array item whose `ArrayField` passed `itemsHaveOwnHeader`, this
 * component reads {@link ArrayItemHeaderContext} and places the drag handle
 * and item actions on its own header row instead of `ArrayField`'s gutter.
 *
 * @param props - See {@link GroupFieldProps} and {@link BaseFormFieldProps}.
 * @returns The fieldset/accordion layout wrapping `children`.
 */
export function GroupField(props: GroupFieldProps): ReactNode {
  const field = useFieldContext<never>();
  const form = useFormContext();
  const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts);
  const itemHeader = useContext(ArrayItemHeaderContext);

  const [openValue, setOpenValue] = useState<string[]>(() => ((props.defaultOpen ?? true) ? [field.name] : []));

  const openSignalVersion = itemHeader?.openSignal.version ?? 0;
  const appliedOpenSignalVersion = useRef(openSignalVersion);
  useEffect(() => {
    if (!itemHeader || appliedOpenSignalVersion.current === openSignalVersion) return;
    appliedOpenSignalVersion.current = openSignalVersion;
    setOpenValue(itemHeader.openSignal.open ? [field.name] : []);
  });

  if (props.collapsible === false) {
    return (
      <fieldset>
        <FormFieldLayout
          id={field.name}
          label={props.label}
          required={props.required}
          description={props.description}
          index={props.index}
          field={field}
          submissionAttempts={submissionAttempts}
          className={props.className}
        >
          <ArrayItemHeaderContext.Provider value={null}>{props.children}</ArrayItemHeaderContext.Provider>
        </FormFieldLayout>
      </fieldset>
    );
  }

  return (
    <Accordion
      value={openValue}
      onValueChange={setOpenValue}
      role="group"
      aria-labelledby={`${field.name}-label`}
      className="rounded-sm border-2 border-border"
    >
      <AccordionItem value={field.name}>
        <AccordionTrigger leading={itemHeader?.dragHandle} actions={itemHeader?.actions}>
          <span id={`${field.name}-label`} className="text-sm leading-none font-medium">
            {props.index !== undefined ? `[${props.index + 1}] - ` : ""}
            {props.label}
            {props.required && <span className="text-red-500">*</span>}
          </span>
        </AccordionTrigger>
        <AccordionContent className="px-3 pt-3">
          <FormFieldLayout
            id={field.name}
            description={props.description}
            field={field}
            submissionAttempts={submissionAttempts}
          >
            <ArrayItemHeaderContext.Provider value={null}>{props.children}</ArrayItemHeaderContext.Provider>
          </FormFieldLayout>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
```

> Edge case: `ArrayItemHeaderContext.Provider` is reset to `null` for `props.children` in both
> branches — a group nested inside another group's children must not inherit its parent's header,
> same requirement the deleted `FormGroup.tsx` documents.

#### packages/react/src/forms/GroupField.test.tsx

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { GroupField } from "./GroupField";

const { fieldContext, formContext } = createFormHookContexts();
const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { GroupField },
  formComponents: {},
});

function Harness(props: { collapsible?: boolean; defaultOpen?: boolean }) {
  const form = useAppForm({ defaultValues: { seo: { title: "x" } } });
  return (
    <form.AppForm>
      <form.AppField name="seo">
        {(field) => (
          <field.GroupField label="SEO" collapsible={props.collapsible} defaultOpen={props.defaultOpen}>
            <span data-testid="group-children">children</span>
          </field.GroupField>
        )}
      </form.AppField>
    </form.AppForm>
  );
}

describe("GroupField", () => {
  it("renders a plain fieldset with no trigger when collapsible is false", () => {
    render(<Harness collapsible={false} />);
    expect(screen.getByTestId("group-children")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders an accordion trigger labelled with the group label when collapsible", () => {
    render(<Harness collapsible defaultOpen />);
    expect(screen.getByRole("button", { name: /SEO/ })).toBeInTheDocument();
  });

  it("toggles children visibility on trigger click", async () => {
    const user = userEvent.setup();
    render(<Harness collapsible defaultOpen={false} />);
    const trigger = screen.getByRole("button", { name: /SEO/ });
    await user.click(trigger);
    expect(screen.getByTestId("group-children")).toBeVisible();
  });
});
```

#### packages/react/src/components/ui/ActionsMenu.tsx

`git mv packages/react/src/components/form/ActionsMenu.tsx packages/react/src/components/ui/ActionsMenu.tsx`
— the component bodies (`ActionsMenu`, `SurfacedAction`, `HeaderAction`, `ActionPlacement`) are
unchanged. 1 edit — its own-folder relative imports shorten by one segment, moving from `forms/` into `ui/`:

```ts
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { cn } from "../../styles/utils";
```

There is no `components/form/ActionsMenu.test.tsx` in the current tree (none exists today) —
this move carries no test file with it; `BlocksField.test.tsx`/`ArrayField.test.tsx` above are
this entry's coverage for `ActionsMenu` instead.

#### packages/react/src/components/ui/index.ts

1 edit — add the barrel export beside the other `ui/` re-exports:

```ts
export * from "./ActionsMenu";
```

#### packages/react/src/forms/useAppForm.ts

2 edits.

**1 — imports**, beside the step 9 field imports:

```ts
import { ArrayField } from "./ArrayField";
import { BlocksField } from "./BlocksField";
import { GroupField } from "./GroupField";
```

**2 — `fieldComponents`**, adding the three list/container fields:

```ts
  fieldComponents: {
    TextField,
    TextareaField,
    EmailField,
    UrlField,
    NumberField,
    CheckboxField,
    SelectField,
    DateField,
    ColorField,
    JsonField,
    ArrayField,
    BlocksField,
    GroupField,
  },
```

`formComponents` stays `{}` (step 8) — `ActionsMenu` reads neither `useFieldContext()` nor
`useFormContext()`; it is a plain presentational dropdown wrapper, not a form-state consumer,
so it is imported directly from `components/ui/ActionsMenu` (as `ArrayField`/`BlocksField`
above do) rather than registered on the form hook.

#### packages/react/src/forms/index.ts

1 edit — new exports for this step's files, beside the step 9 field exports:

```ts
export { useArrayItems, type UseArrayItemsOptions, type UseArrayItemsResult, type ArrayItemsField, type ArrayItemsOpenSignal } from "./useArrayItems";
export { FormCompactContext, FormCompactProvider, useCompactForm, useMeasuredCompact, FORM_COMPACT_WIDTH_PX } from "./FormCompactContext";
export { ArrayItemHeaderContext, type ArrayItemHeader } from "./ArrayItemHeaderContext";
export { ArrayField, type ArrayFieldProps } from "./ArrayField";
export { BlocksField, type BlocksFieldProps, type BlockTypeOption, type GenericBlockItem } from "./BlocksField";
export { GroupField, type GroupFieldProps } from "./GroupField";
```

`useFieldErrorCount.ts` is NOT exported here — internal to `BlocksField`, same status as
`changedValues.ts`.

### Step 11 — Core: `Input` and `Field` override contracts (additive) [agent]
Why: decision 5; the two override slots exist before the admin fields consume them.
Verify: `pnpm --filter @vexcms/core typecheck && pnpm --filter @vexcms/core test`
- [ ] `packages/core/src/fields/types.ts` — `FieldControlProps` (Input override, now including `describedBy`) and `FieldComponentProps<TField>` (Field override) beside `InputComponentProps`
- [ ] `packages/core/src/fields/baseTypes.ts` — `admin.components.Field` override chain beside `Input`; `resolveFieldComponents` carries it
- [ ] `packages/core/src/components/types.ts` — slot id for `Field`
- [ ] `packages/core/src/framework.ts` — `FieldComponentMap`'s `input` key renamed to `field`

This step only adds types and a slot id — `InputComponentProps` stays until step 14 so steps 12–13
can migrate field-by-field without breaking the LSP mid-step.

> Note: `UIFieldInput`/`UIField` (`fields/ui/ui/types.ts:36-70`) already declare their own
> `admin.components.Field` — a single *mandatory* render component (`ApplyComponent<TComponent,
> UIFieldComponentProps>`), not an override chain. `UIFieldAdminInput`/`UIFieldAdminConfig`
> (`baseTypes.ts:590-601`) `Pick` only `condition | hidden | readOnly | position | width` from
> `FieldAdminConfigInput`/`FieldAdminConfig` — `components` is excluded — and `UIFieldInput`/
> `UIField` re-declare their own `admin.components: { Field, Cell }` shape from scratch. So there
> is no type collision: `ui()` fields never inherit `FieldSlotComponentsInput`, and the new
> `Field` override chain this step adds only reaches `AdminDataField`s (`text`, `array`, `blocks`,
> …) through `BaseField`/`FieldAdminConfigInput`. Confirmed by reading both files; no change
> needed to `ui()`'s own `components.Field`.

#### packages/core/src/fields/types.ts
2 edits — everything else unchanged.

**1 — `FieldControlProps`, beside `InputComponentProps`.** The props an `admin.components.Input`
override's replacement control receives, once the app form's `FormFieldLayout`
(`packages/react/src/forms/FormFieldLayout.tsx`) has already resolved the label/description/error
layout around it — matches the `renderControl` contract every `@vexcms/react/form` field component
(`TextField`, `SelectField`, …) accepts:

```ts
/**
 * Props passed to an `admin.components.Input` override's replacement control —
 * the raw control only, after the app form's `FormFieldLayout` has already
 * resolved the label/description/error layout around it (decision 5). Narrower
 * than {@link InputComponentProps}: an Input override never needs `fieldDef`,
 * `collection` or `documentStatus` — it receives exactly what a
 * `@vexcms/react/form` field component's `renderControl` prop hands its
 * control.
 *
 * @see {@link FieldComponentProps} for the whole-field override's props
 */
export interface FieldControlProps<TValue = unknown> {
  /** The control's DOM id — matches the layout's `<label htmlFor>`. */
  id: string;
  /** The control's current value. */
  value: TValue;
  /** Commits a new value to the form field. */
  onChange: (value: TValue) => void;
  /** Marks the form field as touched — wire to the control's native `onBlur`. */
  onBlur: () => void;
  /** Whether the control is non-editable. */
  readOnly: boolean;
  /** Whether the field is currently showing a validation error — sets `aria-invalid`. */
  invalid: boolean;
  /** The control's `aria-describedby` value — the admin app form's `FormFieldLayout`/`fieldDescribedBy`-equivalent description/error ids for this control's `id`; `undefined` when neither applies. */
  describedBy: string | undefined;
}
```

**2 — `FieldComponentProps<TField>`, beside `FieldControlProps`.** The props an
`admin.components.Field` override's replacement receives — the admin field's own composed
props plus `renderDefault`, matching the two-level override composition
`resolveFieldInputComponent` already uses for `Input` (S3):

```ts
/**
 * Props passed to an `admin.components.Field` override's replacement — the
 * same props the admin field's own `Field.tsx` receives (decision 5), plus
 * `renderDefault` to fall back to the previous stage in the override chain
 * (built-in → root per-type → this field instance), same composition as
 * `admin.components.Input`.
 *
 * @typeParam TField - Narrows `fieldDef` to a specific field type.
 * @see {@link InputComponentProps} — `FieldComponentProps` carries the same shape;
 *   it is a distinct name because it is the whole admin field's contract, not
 *   only its control's.
 */
export interface FieldComponentProps<
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
  TField extends AdminField<TFieldMeta> = AdminField<TFieldMeta>,
> extends InputComponentProps<TFieldMeta, TField> {
  /** Renders the previous stage of the `Field` override chain. */
  renderDefault: ComponentType<InputComponentProps<TFieldMeta, TField>>;
}
```

`FieldComponentProps` extends the still-present `InputComponentProps` rather than duplicating
its fields — step 14 removes `InputComponentProps` once every admin field has moved off it, at
which point `FieldComponentProps` inlines its fields directly (see step 14's note). `ComponentType`
needs a `import type { ComponentType } from "react"` added to this file's import header — the only
new import this step adds here.

#### packages/core/src/fields/baseTypes.ts
2 edits.

**1 — `FieldSlotComponentsInput`, add `Field` beside `Input`.**

```ts
export interface FieldSlotComponentsInput<
  TComponent extends ComponentHKT = ComponentHKT,
> {
  /** Override chain for this field instance's input component (S6). … */
  Input?: ComponentOverrideInput<TComponent, unknown>[];
  /** Override chain for this field instance's WHOLE admin field — replaces label, control and
   * error layout together (decision 5). Composed the same way as `Input`: built-in `Field.tsx` →
   * root per-type `fields.<type>.Field` chain → this field instance's own chain, each override's
   * `renderDefault` resolving to the previous stage. List fields (`array`/`blocks`) use this slot
   * plus their own action slots (`array.item.actions`, `blocks.item.actions`,
   * `blocks.header.actions`) — they have no single control an `Input` override could target. */
  Field?: ComponentOverrideInput<TComponent, unknown>[];
  /** Override chain for this field instance's data-table cell component. … */
  Cell?: ComponentOverrideInput<TComponent, unknown>[];
  …
}
```

**2 — `FieldAdminConfig.components`, add `Field` to the resolved shape:**

```ts
components: {
  Input: ComponentOverrideInput<TComponent, unknown>[];
  Field: ComponentOverrideInput<TComponent, unknown>[];
  Cell: ComponentOverrideInput<TComponent, unknown>[];
  Label: ComponentOverrideInput<TComponent, unknown>[];
  Description: ComponentOverrideInput<TComponent, unknown>[];
  beforeInput: ComponentContributionInput<TComponent, unknown>[];
  afterInput: ComponentContributionInput<TComponent, unknown>[];
};
```

#### packages/core/src/fields/utils.ts
1 edit — `resolveFieldComponents` gains a `Field` branch, same shape as the existing `Input`/`Cell`
branches. Full replacement body (everything else in the function is unchanged):

```ts
export function resolveFieldComponents(props: {
  components?: {
    Input?: ComponentOverrideInput<any, unknown>[];
    Field?: ComponentOverrideInput<any, unknown>[];
    Cell?: ComponentOverrideInput<any, unknown>[];
    Label?: ComponentOverrideInput<any, unknown>[];
    Description?: ComponentOverrideInput<any, unknown>[];
    beforeInput?: ComponentContributionInput<any, unknown>[];
    afterInput?: ComponentContributionInput<any, unknown>[];
  };
}) {
  const input = props.components ?? {};
  return {
    Input: resolveComponentOverrides({
      slotId: SLOT_IDS.field.input,
      overrides: input.Input ?? [],
    }),
    Field: resolveComponentOverrides({
      slotId: SLOT_IDS.field.field,
      overrides: input.Field ?? [],
    }),
    Cell: resolveComponentOverrides({
      slotId: SLOT_IDS.field.cell,
      overrides: input.Cell ?? [],
    }),
    Label: resolveComponentOverrides({
      slotId: SLOT_IDS.field.label,
      overrides: input.Label ?? [],
    }),
    Description: resolveComponentOverrides({
      slotId: SLOT_IDS.field.description,
      overrides: input.Description ?? [],
    }),
    beforeInput: resolveComponentContributions({
      slotId: SLOT_IDS.field.beforeInput,
      contributions: input.beforeInput ?? [],
    }),
    afterInput: resolveComponentContributions({
      slotId: SLOT_IDS.field.afterInput,
      contributions: input.afterInput ?? [],
    }),
  };
}
```

#### packages/core/src/components/types.ts
1 edit — `SLOT_IDS.field` gains `field`, beside `input`. Full replacement of the `field:` block
(`blocks:`/`array:` unchanged):

```ts
export const SLOT_IDS = {
  field: {
    /** Override chain for a field's input component. One per field instance AND one project-wide per field type — see {@link ComponentOverrideInput} composition in `@vexcms/react`. */
    input: "field.input",
    /** Override chain for a field's WHOLE admin field (decision 5) — see
     * `FieldSlotComponentsInput.Field`'s doc comment for composition. */
    field: "field.field",
    /** Override chain for a field's data-table cell component. Same two-level composition as `input`. */
    cell: "field.cell",
    /** Override chain for a field's label. No built-in contribution yet (step 11's design note) — every Input still renders its own label inline. */
    label: "field.label",
    /** Override chain for a field's description. No built-in contribution yet, same reason as `label`. */
    description: "field.description",
    /** Additive contributions rendered before a field's resolved input. */
    beforeInput: "field.beforeInput",
    /** Additive contributions rendered after a field's resolved input. */
    afterInput: "field.afterInput",
  },
  blocks: { … },
  array: { … },
} as const;
```

`SlotId`'s union is unchanged in shape — it already reads every value off `SLOT_IDS.field`, so
the new `"field.field"` member flows through automatically.

#### packages/core/src/framework.ts
1 edit — `FieldComponentMap`'s per-type map (`framework.ts:30-41`) renames its `input` key to
`field`, so a framework adapter's `fields[<type>]` entry matches the `field:`/`cell:` shape
every built-in React field now exports (step 12):

```ts
export type FieldComponentMap<
  F extends ComponentHKT,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
> = {
  [K in DataFieldType]: {
    field: ApplyComponent<
      F,
      InputComponentProps<TFieldMeta, Extract<AdminDataField<TFieldMeta>, { type: K }>>
    >;
    cell: ApplyComponent<F, CellComponentProps<Extract<AdminDataField<TFieldMeta>, { type: K }>>>;
  };
};
```

(was `input: ApplyComponent<…>` — the referenced prop type stays `InputComponentProps` until
step 14; only the map's own key renames.) `FrameworkAdapterInput<F, TFieldMeta>`'s
`fields: FieldComponentMap<F, TFieldMeta>` field (`framework.ts:235`) is unchanged — it
already just references the map type above. This is the only other package in the K spec's
`touches` list (`packages/core/src/**`) this rename reaches; `buildReactAdapter`
(`packages/react/src/adapter.ts`, step 12) is the sole implementer and type-checks against
this renamed map once its own `fields` entries switch to `field:`.

---

### Step 12 — Admin leaf fields: `fields/<type>/Field.tsx` [agent]
Why: decisions 6–7; admin fields map `fieldDef` → the app form's plain props; the form runs on `useAppForm`.
Verify: `pnpm --filter @vexcms/react typecheck && pnpm --filter @vexcms/react test`
- [ ] `packages/react/src/hooks/useFieldControlOverride.ts` — composes `admin.components.Input` (root per-type + field-instance) into one `renderControl`
- [ ] `components/fields/<type>/Input.tsx` → `Field.tsx` for text, textarea, email, url, number, checkbox, select, date, color, json (+ tests renamed `Field.test.tsx`); exported component renamed `<Type>FieldAdmin`
- [ ] `components/fields/{RenderFields,FieldConditionGate,applyFieldPermissionReadOnly,readableFields}` moved from `components/form/`
- [ ] `fields/registry.ts` + `slots/resolveFieldComponent.tsx` (renamed from `resolveFieldInputComponent.tsx`) resolve `Field`; `fields/index.tsx` re-export updated
- [ ] `hooks/useFieldsForm.ts` wraps `useAppForm`; `hooks/useVexForm.ts` reads `../form`'s `useFormContext`; admin views import `AppForm` from `../../form`
- [ ] `hooks/useFieldErrorCount.ts` deleted; its context-reading/pure logic consolidates into `forms/useFieldErrorCount.ts` (step 10's temporary parallel copy) — every admin importer (`RenderFields.tsx`, and `FormTabs.tsx`/`FormCollapsible.tsx`, unmigrated until step 13 but now mounted under the real `useAppForm` tree as of this step) repointed to it

This step assumes the step 8–10 `@vexcms/react/form` entry exists: `useAppForm` (`createFormHook`),
`AppForm` (ported into `forms/AppForm.tsx` by step 8 — this step's `useFieldsForm`/`useVexForm`/view
call sites import it via a relative path into `forms/`, not `components/form/AppForm` and not the
package's own `@vexcms/react/form` subpath name), `FormFieldLayout`
(label/description/error layout, `isFieldShowingError` moved in), `BaseFormFieldProps<TValue>`
(`label`, `description`, `required`, `readOnly`, `index`, `renderControl`, `before`, `after`,
`className` — confirmed against the actual step 8/9 draft), and the ten leaf field components
below reading `useFieldContext()` with plain props, each with its own value-shape props beyond
`BaseFormFieldProps` (confirmed against the actual step 9 draft, not assumed):

| Field | `@vexcms/react/form` component | `TValue` | Own props beyond `BaseFormFieldProps` |
|---|---|---|---|
| `text` | `TextField` | `string` | `placeholder?`, `maxLength?` |
| `textarea` | `TextareaField` | `string` | `placeholder?`, `rows?`, `maxLength?` (counter always renders — bare count when `maxLength` omitted) |
| `email` | `EmailField` | `string` | `placeholder?`, `maxLength?` |
| `url` | `UrlField` | `string` | `placeholder?` |
| `number` | `NumberField` | `number` | `placeholder?`, `step?`, `min?`, `max?` |
| `checkbox` | `CheckboxField` | `boolean` | none — builds its own inline control+label row; `label` still accepted but never forwarded to `FormFieldLayout`'s `<label htmlFor>` |
| `select` | `SelectField` | `string[]` | `options: SelectFieldOption[]` (required), `hasMany?`, `display?: "dropdown" \| "radio"`, `searchable?`, `placeholder?` |
| `date` | `DateField` | `number \| undefined` | `min?`/`max?` as epoch ms (NOT `Date`), `hideTime?`, `use12HourFormat?`, `timePicker?` |
| `color` | `ColorField` | `string` | `format: ColorFormat` (required), `themeColors?`, `placeholder?` |
| `json` | `JsonField` | `unknown` | none |

`before`/`after` are a purely visual hook on `FormFieldLayout`'s own markup
(`{before}{children}{after}`, inside the label/description/error stack) — several fields use them
internally for their OWN markup (`TextField`'s character counter is its `after`; `CheckboxField`'s
inline label, `SelectField`'s radio-display branch and `JsonField`'s whole control+Format-button
row build themselves through `before`/`after` with `children` empty). They are NOT the
`admin.components.beforeInput`/`afterInput` slot (S8) — this step keeps that slot's rendering
exactly where `FieldSlotOutlet` already puts it today: OUTER siblings around the whole admin field
(before the label stack, after the error), never threaded into a leaf field's own `before`/`after`.
No field in the table above populates `before`/`after` from this step's own code — only the leaf
field components themselves do, internally.

`JsonField` honours `renderControl` the same as every other leaf field (step 9) — when given, it
replaces the editor+Format-button control entirely and the override receives the raw `unknown`
value directly; `admin.components.Input` is a real override on a `json` field, not a no-op.

#### packages/react/src/hooks/useFieldControlOverride.ts
New file. Every leaf `Field.tsx` below calls this once to compose the `admin.components.Input`
override chain — root per-type `fields.<type>.Input`, then this field instance's own list — into
a single `renderControl`. `undefined` when both lists are empty, so the caller omits
`renderControl` entirely and the `@vexcms/react/form` field renders its own built-in control. The
composition mirrors `resolveFieldComponent`'s `Field`-chain composition (S3), except the innermost
stage is `props.defaultControl` — a plain fallback the calling `Field.tsx` supplies itself, since
there is no more admin-level "built-in Input component" to fall back to (the real default control
now lives inside the `@vexcms/react/form` field component, out of this hook's reach); a project
override that calls `renderDefault` past every stage in the chain reaches that plain fallback
rather than the form field's exact built-in markup.

```ts
"use client";

import { useMemo } from "react";
import type {
  ComponentOverrideInput,
  DataFieldType,
  FieldControlProps,
} from "@vexcms/core";
import type { RenderControl } from "../forms";
import type { ReactHKT } from "../adapter";
import { useVexConfig } from "../context";

/**
 * Composes one field's `admin.components.Input` override chain into a single
 * `RenderControl<TValue>` ready to pass as a `@vexcms/react/form` field
 * component's `renderControl` prop (decision 5/12: "replaces the control,
 * layout kept").
 *
 * @param props.fieldType - The field's `DataFieldType` — reads the
 *   project-wide chain off `useVexConfig()`.
 * @param props.fieldOverrides - This field instance's own
 *   `admin.components.Input` chain (`fieldDef.admin.components.Input`).
 * @param props.defaultControl - This field's own bare-control fallback,
 *   reached only when the chain is non-empty and its innermost override
 *   calls `renderDefault`.
 * @returns A composed `RenderControl<TValue>`, or `undefined` when neither
 *   override list has an entry — the caller then omits `renderControl`.
 */
export function useFieldControlOverride<TValue>(props: {
  fieldType: DataFieldType;
  fieldOverrides: ComponentOverrideInput<ReactHKT, FieldControlProps<TValue>>[] | undefined;
  defaultControl: RenderControl<TValue>;
}): RenderControl<TValue> | undefined {
  const config = useVexConfig();
  const rootOverrides = config.admin.components?.fields?.[props.fieldType]?.Input as
    | ComponentOverrideInput<ReactHKT, FieldControlProps<TValue>>[]
    | undefined;
  return useMemo(() => {
    const chain = [...(rootOverrides ?? []), ...(props.fieldOverrides ?? [])];
    if (chain.length === 0) return undefined;
    return chain.reduce<RenderControl<TValue>>((renderDefault, override) => {
      const Override = override.component;
      function Composed(controlProps: FieldControlProps<TValue>) {
        return <Override {...controlProps} renderDefault={renderDefault} />;
      }
      Composed.displayName = `FieldControlOverride(${override.id})`;
      return Composed;
    }, props.defaultControl);
  }, [rootOverrides, props.fieldOverrides, props.defaultControl]);
}
```

#### packages/react/src/components/fields/text/Field.tsx
New file (renamed from `Input.tsx`, rewritten against `@vexcms/react/form`). The template every
masked leaf field in this step follows: read `useFieldControlOverride` for the resolved
`admin.components.Input` chain, resolve the project's/field's input mask via `resolveFieldMask`,
and — when a mask resolves and there is no project override — synthesize the masked control as
`renderControl` itself, since `TextField` has no `mask`/`maskRef` prop of its own (confirmed
against the actual step 9 draft). An override, when present, always wins over masking — decision
12 says an Input override "replaces the control", and masking is this field's own default control
behavior, not an addition layered on top of an override.

```tsx
"use client";

import { useContext } from "react";
import { resolveFieldMask, type TextField as TextFieldDef } from "@vexcms/core";
import { TextField } from "../../../forms";
import type { FieldControlProps, FieldComponentProps } from "@vexcms/core";
import { Input } from "../../ui/input";
import { useFieldMask } from "../../../hooks/useFieldMask";
import { useFieldControlOverride } from "../../../hooks/useFieldControlOverride";
import { VexConfigContext } from "../../../context/VexConfigContext";

/**
 * Text admin field — maps `fieldDef` to `@vexcms/react/form`'s `TextField` props.
 *
 * @param props - {@link FieldComponentProps} narrowed to `TextField`.
 * @returns `TextField`, configured for this field instance.
 */
export function TextFieldAdmin(props: FieldComponentProps<{}, TextFieldDef>) {
  const config = useContext(VexConfigContext);
  const mask = resolveFieldMask({
    fieldType: props.fieldDef.type,
    fieldMask: props.fieldDef.admin.mask,
    inputMasks: config?.fields.inputMasks ?? {},
  });
  const maskRef = useFieldMask({ mask });
  function renderMaskedControl(controlProps: FieldControlProps<string>) {
    return (
      <Input
        id={controlProps.id}
        ref={maskRef}
        disabled={controlProps.readOnly}
        type="text"
        defaultValue={controlProps.value}
        onInput={(e) => controlProps.onChange(e.currentTarget.value)}
        onBlur={controlProps.onBlur}
        placeholder={props.fieldDef.admin.placeholder}
        readOnly={controlProps.readOnly}
        aria-required={props.fieldDef.required}
        aria-invalid={controlProps.invalid}
        aria-describedby={controlProps.describedBy}
      />
    );
  }
  function renderBareControl(controlProps: FieldControlProps<string>) {
    return (
      <Input
        id={controlProps.id}
        disabled={controlProps.readOnly}
        type="text"
        value={controlProps.value}
        onChange={(e) => controlProps.onChange(e.target.value)}
        onBlur={controlProps.onBlur}
        placeholder={props.fieldDef.admin.placeholder}
        readOnly={controlProps.readOnly}
        aria-required={props.fieldDef.required}
        aria-invalid={controlProps.invalid}
        aria-describedby={controlProps.describedBy}
      />
    );
  }
  const overrideControl = useFieldControlOverride<string>({
    fieldType: props.fieldDef.type,
    fieldOverrides: props.fieldDef.admin.components.Input,
    defaultControl: mask ? renderMaskedControl : renderBareControl,
  });
  return (
    <TextField
      name={props.name}
      label={props.fieldDef.label || props.name}
      description={props.fieldDef.description}
      required={props.fieldDef.required}
      readOnly={props.readOnly || props.fieldDef.admin.readOnly}
      placeholder={props.fieldDef.admin.placeholder}
      maxLength={props.fieldDef.max?.[0]}
      renderControl={overrideControl ?? (mask ? renderMaskedControl : undefined)}
    />
  );
}
```

#### packages/react/src/components/fields/text/index.ts
1 edit — `export * from "./Field"` replaces `export * from "./Input"` (and every other leaf
field's `index.ts`, same substitution, not shown per-file).

#### packages/react/src/components/fields/email/Field.tsx
New file, same template as `text/Field.tsx` — masked branch sets `autoComplete="email"` and keeps
`type="text"`; unmasked branch uses the native `type="email"`, also with `autoComplete="email"`.

```tsx
"use client";

import { useContext } from "react";
import { resolveFieldMask, type EmailField as EmailFieldDef } from "@vexcms/core";
import { EmailField } from "../../../forms";
import type { FieldControlProps, FieldComponentProps } from "@vexcms/core";
import { Input } from "../../ui/input";
import { useFieldMask } from "../../../hooks/useFieldMask";
import { useFieldControlOverride } from "../../../hooks/useFieldControlOverride";
import { VexConfigContext } from "../../../context/VexConfigContext";

/**
 * Email admin field — maps `fieldDef` to `@vexcms/react/form`'s `EmailField` props.
 *
 * @param props - {@link FieldComponentProps} narrowed to `EmailField`.
 * @returns `EmailField`, configured for this field instance.
 */
export function EmailFieldAdmin(props: FieldComponentProps<{}, EmailFieldDef>) {
  const config = useContext(VexConfigContext);
  const mask = resolveFieldMask({
    fieldType: props.fieldDef.type,
    fieldMask: props.fieldDef.admin.mask,
    inputMasks: config?.fields.inputMasks ?? {},
  });
  const maskRef = useFieldMask({ mask });
  function renderMaskedControl(controlProps: FieldControlProps<string>) {
    return (
      <Input
        id={controlProps.id}
        ref={maskRef}
        disabled={controlProps.readOnly}
        type="text"
        autoComplete="email"
        defaultValue={controlProps.value}
        onInput={(e) => controlProps.onChange(e.currentTarget.value)}
        onBlur={controlProps.onBlur}
        placeholder={props.fieldDef.admin.placeholder}
        readOnly={controlProps.readOnly}
        aria-required={props.fieldDef.required}
        aria-invalid={controlProps.invalid}
        aria-describedby={controlProps.describedBy}
      />
    );
  }
  function renderBareControl(controlProps: FieldControlProps<string>) {
    return (
      <Input
        id={controlProps.id}
        disabled={controlProps.readOnly}
        type="email"
        autoComplete="email"
        value={controlProps.value}
        onChange={(e) => controlProps.onChange(e.target.value)}
        onBlur={controlProps.onBlur}
        placeholder={props.fieldDef.admin.placeholder}
        readOnly={controlProps.readOnly}
        aria-required={props.fieldDef.required}
        aria-invalid={controlProps.invalid}
        aria-describedby={controlProps.describedBy}
      />
    );
  }
  const overrideControl = useFieldControlOverride<string>({
    fieldType: props.fieldDef.type,
    fieldOverrides: props.fieldDef.admin.components.Input,
    defaultControl: mask ? renderMaskedControl : renderBareControl,
  });
  return (
    <EmailField
      name={props.name}
      label={props.fieldDef.label || props.name}
      description={props.fieldDef.description}
      required={props.fieldDef.required}
      readOnly={props.readOnly || props.fieldDef.admin.readOnly}
      placeholder={props.fieldDef.admin.placeholder}
      maxLength={props.fieldDef.max?.[0]}
      renderControl={overrideControl ?? (mask ? renderMaskedControl : undefined)}
    />
  );
}
```

#### packages/react/src/components/fields/url/Field.tsx
New file. `UrlField` has no `maxLength`/counter prop (the field type has no `max` constraint), so
this is the shortest of the masked fields. The open-link button is `UrlField`'s own built-in
markup now (rendered beside its default control) — this admin field no longer owns
`isParseableUrl`/the button at all; that logic moved into `@vexcms/react/form`'s `UrlField` itself,
which still renders the button beside WHATEVER control is active, override or not, since the layout
(decision 12) includes it.

```tsx
"use client";

import { useContext } from "react";
import { resolveFieldMask, type UrlField as UrlFieldDef } from "@vexcms/core";
import { UrlField } from "../../../forms";
import type { FieldControlProps, FieldComponentProps } from "@vexcms/core";
import { Input } from "../../ui/input";
import { useFieldMask } from "../../../hooks/useFieldMask";
import { useFieldControlOverride } from "../../../hooks/useFieldControlOverride";
import { VexConfigContext } from "../../../context/VexConfigContext";

/**
 * URL admin field — maps `fieldDef` to `@vexcms/react/form`'s `UrlField` props.
 *
 * @param props - {@link FieldComponentProps} narrowed to `UrlField`.
 * @returns `UrlField`, configured for this field instance.
 */
export function UrlFieldAdmin(props: FieldComponentProps<{}, UrlFieldDef>) {
  const config = useContext(VexConfigContext);
  const mask = resolveFieldMask({
    fieldType: props.fieldDef.type,
    fieldMask: props.fieldDef.admin.mask,
    inputMasks: config?.fields.inputMasks ?? {},
  });
  const maskRef = useFieldMask({ mask });
  function renderMaskedControl(controlProps: FieldControlProps<string>) {
    return (
      <Input
        id={controlProps.id}
        ref={maskRef}
        type="text"
        disabled={controlProps.readOnly}
        defaultValue={controlProps.value}
        onInput={(e) => controlProps.onChange(e.currentTarget.value)}
        onBlur={controlProps.onBlur}
        placeholder={props.fieldDef.admin.placeholder}
        readOnly={controlProps.readOnly}
        aria-required={props.fieldDef.required}
        aria-invalid={controlProps.invalid}
        aria-describedby={controlProps.describedBy}
      />
    );
  }
  function renderBareControl(controlProps: FieldControlProps<string>) {
    return (
      <Input
        id={controlProps.id}
        type="text"
        disabled={controlProps.readOnly}
        value={controlProps.value}
        onChange={(e) => controlProps.onChange(e.target.value)}
        onBlur={controlProps.onBlur}
        placeholder={props.fieldDef.admin.placeholder}
        readOnly={controlProps.readOnly}
        aria-required={props.fieldDef.required}
        aria-invalid={controlProps.invalid}
        aria-describedby={controlProps.describedBy}
      />
    );
  }
  const overrideControl = useFieldControlOverride<string>({
    fieldType: props.fieldDef.type,
    fieldOverrides: props.fieldDef.admin.components.Input,
    defaultControl: mask ? renderMaskedControl : renderBareControl,
  });
  return (
    <UrlField
      name={props.name}
      label={props.fieldDef.label || props.name}
      description={props.fieldDef.description}
      required={props.fieldDef.required}
      readOnly={props.readOnly || props.fieldDef.admin.readOnly}
      placeholder={props.fieldDef.admin.placeholder}
      renderControl={overrideControl ?? (mask ? renderMaskedControl : undefined)}
    />
  );
}
```

#### packages/react/src/components/fields/number/Field.tsx
New file. Same masked/bare split as `text/Field.tsx`; the masked branch still commits a `number`
(or `undefined` for an empty string) through `controlProps.onChange`, and the bare branch forwards
`fieldDef.step`/`fieldDef.min`/`fieldDef.max` as `NumberField`'s own `step`/`min`/`max` props
rather than on the control directly — `NumberField` owns applying them to its native `<input>`.

```tsx
"use client";

import { useContext } from "react";
import { resolveFieldMask, type NumberField as NumberFieldDef } from "@vexcms/core";
import { NumberField } from "../../../forms";
import type { FieldControlProps, FieldComponentProps } from "@vexcms/core";
import { Input } from "../../ui/input";
import { useFieldMask } from "../../../hooks/useFieldMask";
import { useFieldControlOverride } from "../../../hooks/useFieldControlOverride";
import { VexConfigContext } from "../../../context/VexConfigContext";

/**
 * Number admin field — maps `fieldDef` to `@vexcms/react/form`'s `NumberField` props.
 *
 * @param props - {@link FieldComponentProps} narrowed to `NumberField`.
 * @returns `NumberField`, configured for this field instance.
 */
export function NumberFieldAdmin(props: FieldComponentProps<{}, NumberFieldDef>) {
  const config = useContext(VexConfigContext);
  const mask = resolveFieldMask({
    fieldType: props.fieldDef.type,
    fieldMask: props.fieldDef.admin.mask,
    inputMasks: config?.fields.inputMasks ?? {},
  });
  const maskRef = useFieldMask({ mask });
  function renderMaskedControl(controlProps: FieldControlProps<number>) {
    return (
      <Input
        id={controlProps.id}
        ref={maskRef}
        disabled={controlProps.readOnly}
        type="text"
        defaultValue={controlProps.value !== undefined ? String(controlProps.value) : ""}
        onInput={(e) => {
          const raw = e.currentTarget.value;
          controlProps.onChange(raw === "" ? (undefined as unknown as number) : Number(raw));
        }}
        onBlur={controlProps.onBlur}
        placeholder={props.fieldDef.admin.placeholder}
        readOnly={controlProps.readOnly}
        aria-required={props.fieldDef.required}
        aria-invalid={controlProps.invalid}
        aria-describedby={controlProps.describedBy}
      />
    );
  }
  function renderBareControl(controlProps: FieldControlProps<number>) {
    return (
      <Input
        id={controlProps.id}
        disabled={controlProps.readOnly}
        type="number"
        step={props.fieldDef.step}
        min={props.fieldDef.min?.[0]}
        max={props.fieldDef.max?.[0]}
        value={controlProps.value ?? 0}
        onChange={(e) =>
          controlProps.onChange(
            e.target.value === "" ? (undefined as unknown as number) : Number(e.target.value),
          )
        }
        onBlur={controlProps.onBlur}
        placeholder={props.fieldDef.admin.placeholder}
        readOnly={controlProps.readOnly}
        aria-required={props.fieldDef.required}
        aria-invalid={controlProps.invalid}
        aria-describedby={controlProps.describedBy}
      />
    );
  }
  const overrideControl = useFieldControlOverride<number>({
    fieldType: props.fieldDef.type,
    fieldOverrides: props.fieldDef.admin.components.Input,
    defaultControl: mask ? renderMaskedControl : renderBareControl,
  });
  return (
    <NumberField
      name={props.name}
      label={props.fieldDef.label || props.name}
      description={props.fieldDef.description}
      required={props.fieldDef.required}
      readOnly={props.readOnly || props.fieldDef.admin.readOnly}
      placeholder={props.fieldDef.admin.placeholder}
      step={props.fieldDef.step}
      min={props.fieldDef.min?.[0]}
      max={props.fieldDef.max?.[0]}
      renderControl={overrideControl ?? (mask ? renderMaskedControl : undefined)}
    />
  );
}
```

#### packages/react/src/components/fields/textarea/Field.tsx
New file. No masking — `textarea()` has no `admin.mask` option. The bare default control is a
`Textarea` sized by `fieldDef.rows`; the counter is `TextareaField`'s own concern now (always
rendered, per the step's prop table).

```tsx
"use client";

import { type TextareaField as TextareaFieldDef } from "@vexcms/core";
import { TextareaField } from "../../../forms";
import type { FieldControlProps, FieldComponentProps } from "@vexcms/core";
import { Textarea } from "../../ui/textarea";
import { useFieldControlOverride } from "../../../hooks/useFieldControlOverride";

/**
 * Textarea admin field — maps `fieldDef` to `@vexcms/react/form`'s `TextareaField` props.
 *
 * @param props - {@link FieldComponentProps} narrowed to `TextareaField`.
 * @returns `TextareaField`, configured for this field instance.
 */
export function TextareaFieldAdmin(props: FieldComponentProps<{}, TextareaFieldDef>) {
  function renderBareControl(controlProps: FieldControlProps<string>) {
    return (
      <Textarea
        id={controlProps.id}
        disabled={controlProps.readOnly}
        rows={props.fieldDef.rows}
        value={controlProps.value}
        onChange={(e) => controlProps.onChange(e.target.value)}
        onBlur={controlProps.onBlur}
        placeholder={props.fieldDef.admin.placeholder}
        readOnly={controlProps.readOnly}
        aria-required={props.fieldDef.required}
        aria-invalid={controlProps.invalid}
        aria-describedby={controlProps.describedBy}
      />
    );
  }
  const overrideControl = useFieldControlOverride<string>({
    fieldType: props.fieldDef.type,
    fieldOverrides: props.fieldDef.admin.components.Input,
    defaultControl: renderBareControl,
  });
  return (
    <TextareaField
      name={props.name}
      label={props.fieldDef.label || props.name}
      description={props.fieldDef.description}
      required={props.fieldDef.required}
      readOnly={props.readOnly || props.fieldDef.admin.readOnly}
      placeholder={props.fieldDef.admin.placeholder}
      rows={props.fieldDef.rows}
      maxLength={props.fieldDef.max?.[0]}
      renderControl={overrideControl}
    />
  );
}
```

#### packages/react/src/components/fields/checkbox/Field.tsx
New file. `CheckboxField` builds its own inline control+label row internally — this admin field
still passes `label` (forwarded as a prop even though `CheckboxField` never routes it through
`FormFieldLayout`'s `<label htmlFor>`), and has no `maxLength`/counter concern at all.

```tsx
"use client";

import { type CheckboxField as CheckboxFieldDef } from "@vexcms/core";
import { CheckboxField } from "../../../forms";
import type { FieldControlProps, FieldComponentProps } from "@vexcms/core";
import { Checkbox } from "../../ui/checkbox";
import { useFieldControlOverride } from "../../../hooks/useFieldControlOverride";

/**
 * Checkbox admin field — maps `fieldDef` to `@vexcms/react/form`'s `CheckboxField` props.
 *
 * @param props - {@link FieldComponentProps} narrowed to `CheckboxField`.
 * @returns `CheckboxField`, configured for this field instance.
 */
export function CheckboxFieldAdmin(props: FieldComponentProps<{}, CheckboxFieldDef>) {
  function renderBareControl(controlProps: FieldControlProps<boolean>) {
    return (
      <Checkbox
        id={controlProps.id}
        required={props.fieldDef.required}
        readOnly={controlProps.readOnly}
        disabled={controlProps.readOnly}
        checked={controlProps.value ?? false}
        onCheckedChange={(checked) => controlProps.onChange(Boolean(checked))}
        onBlur={controlProps.onBlur}
        aria-invalid={controlProps.invalid}
        aria-describedby={controlProps.describedBy}
      />
    );
  }
  const overrideControl = useFieldControlOverride<boolean>({
    fieldType: props.fieldDef.type,
    fieldOverrides: props.fieldDef.admin.components.Input,
    defaultControl: renderBareControl,
  });
  return (
    <CheckboxField
      name={props.name}
      label={props.fieldDef.label || props.name}
      description={props.fieldDef.description}
      required={props.fieldDef.required}
      readOnly={props.readOnly || props.fieldDef.admin.readOnly}
      renderControl={overrideControl}
    />
  );
}
```

#### packages/react/src/components/fields/select/Field.tsx
New file. `SelectField` owns the dropdown-vs-radio rendering (and `useModalSurface()`) internally
now — this admin field only maps `fieldDef.options`/`fieldDef.hasMany`/`fieldDef.admin.display`/
`fieldDef.admin.searchable`/`fieldDef.admin.placeholder` onto its props. The default control
fallback (reached only via an Input override's `renderDefault`) renders the dropdown's own
multi/single value list directly, since a bare control has no access to the radio/checkbox layout
`SelectField` builds through `before`/`after`.

```tsx
"use client";

import { type SelectField as SelectFieldDef } from "@vexcms/core";
import { SelectField } from "../../../forms";
import type { FieldControlProps, FieldComponentProps } from "@vexcms/core";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "../../ui/multi-select";
import { useModalSurface } from "../../../hooks/useModalSurface";
import { useFieldControlOverride } from "../../../hooks/useFieldControlOverride";

/**
 * Select admin field — maps `fieldDef` to `@vexcms/react/form`'s `SelectField` props.
 *
 * @param props - {@link FieldComponentProps} narrowed to `SelectField`.
 * @returns `SelectField`, configured for this field instance.
 */
export function SelectFieldAdmin(props: FieldComponentProps<{}, SelectFieldDef>) {
  const isOnModalSurface = useModalSurface();
  function renderBareControl(controlProps: FieldControlProps<string[]>) {
    return (
      <MultiSelect
        modal={isOnModalSurface}
        onValuesChange={controlProps.onChange}
        single={!props.fieldDef.hasMany}
        values={controlProps.value}
      >
        <MultiSelectTrigger
          id={controlProps.id}
          className="w-full"
          onBlur={controlProps.onBlur}
          name={props.name}
          aria-required={props.fieldDef.required}
          aria-invalid={controlProps.invalid}
          aria-describedby={controlProps.describedBy}
          disabled={controlProps.readOnly}
        >
          <MultiSelectValue placeholder={props.fieldDef.admin.placeholder} />
        </MultiSelectTrigger>
        <MultiSelectContent
          onBlur={controlProps.onBlur}
          className="w-full"
          search={props.fieldDef.admin.searchable}
        >
          <MultiSelectGroup>
            {props.fieldDef.options.map((option, optionIndex) => (
              <MultiSelectItem value={option.value} key={`multi-select-item-${props.name}-${optionIndex}`}>
                {option.label}
              </MultiSelectItem>
            ))}
          </MultiSelectGroup>
        </MultiSelectContent>
      </MultiSelect>
    );
  }
  const overrideControl = useFieldControlOverride<string[]>({
    fieldType: props.fieldDef.type,
    fieldOverrides: props.fieldDef.admin.components.Input,
    defaultControl: renderBareControl,
  });
  return (
    <SelectField
      name={props.name}
      label={props.fieldDef.label || props.name}
      description={props.fieldDef.description}
      required={props.fieldDef.required}
      readOnly={props.readOnly || props.fieldDef.admin.readOnly}
      options={props.fieldDef.options}
      hasMany={props.fieldDef.hasMany}
      display={props.fieldDef.admin.display}
      searchable={props.fieldDef.admin.searchable}
      placeholder={props.fieldDef.admin.placeholder}
      renderControl={overrideControl}
    />
  );
}
```

#### packages/react/src/components/fields/date/Field.tsx
New file. `DateField`'s value is `number | undefined` (epoch ms) directly — no `Date` conversion
inside this admin field anymore; that lives in `DateField` itself, same as the fallback control
below needs to do its own `Date`↔epoch conversion around `DateTimePicker`, since `FieldControlProps`
only carries the number.

```tsx
"use client";

import { useCallback, useMemo } from "react";
import { type DateField as DateFieldDef } from "@vexcms/core";
import { DateField } from "../../../forms";
import type { FieldControlProps, FieldComponentProps } from "@vexcms/core";
import { DateTimePicker } from "../../ui";
import { useFieldControlOverride } from "../../../hooks/useFieldControlOverride";

/**
 * Date admin field — maps `fieldDef` to `@vexcms/react/form`'s `DateField` props.
 *
 * @param props - {@link FieldComponentProps} narrowed to `DateField`.
 * @returns `DateField`, configured for this field instance.
 */
export function DateFieldAdmin(props: FieldComponentProps<{}, DateFieldDef>) {
  function renderBareControl(controlProps: FieldControlProps<number | undefined>) {
    return <DateBareControl controlProps={controlProps} fieldDef={props.fieldDef} name={props.name} />;
  }
  const overrideControl = useFieldControlOverride<number | undefined>({
    fieldType: props.fieldDef.type,
    fieldOverrides: props.fieldDef.admin.components.Input,
    defaultControl: renderBareControl,
  });
  return (
    <DateField
      name={props.name}
      label={props.fieldDef.label || props.name}
      description={props.fieldDef.description}
      required={props.fieldDef.required}
      readOnly={props.readOnly || props.fieldDef.admin.readOnly}
      min={props.fieldDef.min?.[0]}
      max={props.fieldDef.max?.[0]}
      hideTime={props.fieldDef.time.hidden}
      use12HourFormat={props.fieldDef.time.use12HourFormat}
      timePicker={props.fieldDef.time.timePicker}
      renderControl={overrideControl}
    />
  );
}

/**
 * The Input override chain's innermost fallback control for `date` —
 * converts `FieldControlProps<number | undefined>` to/from `Date` around a
 * bare `DateTimePicker`, mirroring what `DateField`'s own default control does.
 *
 * @param props.controlProps - The resolved control props from the override chain.
 * @param props.fieldDef - The field's resolved definition, for `min`/`max`/`time`.
 * @param props.name - The field's form path, for `aria-labelledby`.
 * @returns A bare `DateTimePicker` wired to `controlProps`.
 */
function DateBareControl(props: {
  controlProps: FieldControlProps<number | undefined>;
  fieldDef: DateFieldDef;
  name: string;
}) {
  const dateValue = useMemo(
    () => (props.controlProps.value ? new Date(props.controlProps.value) : undefined),
    [props.controlProps.value],
  );
  const minDate = useMemo(
    () => (props.fieldDef.min !== undefined ? new Date(props.fieldDef.min[0]) : undefined),
    [props.fieldDef.min],
  );
  const maxDate = useMemo(
    () => (props.fieldDef.max !== undefined ? new Date(props.fieldDef.max[0]) : undefined),
    [props.fieldDef.max],
  );
  const handleChange = useCallback(
    (date: Date | undefined) => props.controlProps.onChange(date ? date.getTime() : undefined),
    [props.controlProps.onChange],
  );
  return (
    <DateTimePicker
      id={props.controlProps.id}
      value={dateValue}
      onChange={handleChange}
      onBlur={props.controlProps.onBlur}
      disabled={props.controlProps.readOnly}
      clearable
      hideTime={props.fieldDef.time.hidden}
      use12HourFormat={props.fieldDef.time.use12HourFormat}
      timePicker={props.fieldDef.time.timePicker}
      min={minDate}
      max={maxDate}
      aria-required={props.fieldDef.required}
      aria-invalid={props.controlProps.invalid}
      aria-describedby={props.controlProps.describedBy}
    />
  );
}
```

#### packages/react/src/components/fields/color/Field.tsx
New file. `ColorField` owns the swatch/picker/theme-tab markup and the per-`format` placeholder
fallback internally now — this admin field only maps `fieldDef.format`/`fieldDef.themeColors`/
`fieldDef.admin.placeholder`. The Input-override fallback control is the bare text input half only
(no swatch/picker) — an override replacing the control loses the picker, same as every other
field's Input override replaces the WHOLE control, not just part of it.

```tsx
"use client";

import { type ColorField as ColorFieldDef } from "@vexcms/core";
import { ColorField } from "../../../forms";
import type { FieldControlProps, FieldComponentProps } from "@vexcms/core";
import { Input } from "../../ui/input";
import { useFieldControlOverride } from "../../../hooks/useFieldControlOverride";

/**
 * Colour admin field — maps `fieldDef` to `@vexcms/react/form`'s `ColorField` props.
 *
 * @param props - {@link FieldComponentProps} narrowed to `ColorField`.
 * @returns `ColorField`, configured for this field instance.
 */
export function ColorFieldAdmin(props: FieldComponentProps<{}, ColorFieldDef>) {
  function renderBareControl(controlProps: FieldControlProps<string>) {
    return (
      <Input
        id={controlProps.id}
        type="text"
        className="font-mono"
        disabled={controlProps.readOnly}
        value={controlProps.value}
        onChange={(e) => controlProps.onChange(e.target.value)}
        onBlur={controlProps.onBlur}
        placeholder={props.fieldDef.admin.placeholder}
        readOnly={controlProps.readOnly}
        aria-required={props.fieldDef.required}
        aria-invalid={controlProps.invalid}
        aria-describedby={controlProps.describedBy}
      />
    );
  }
  const overrideControl = useFieldControlOverride<string>({
    fieldType: props.fieldDef.type,
    fieldOverrides: props.fieldDef.admin.components.Input,
    defaultControl: renderBareControl,
  });
  return (
    <ColorField
      name={props.name}
      label={props.fieldDef.label || props.name}
      description={props.fieldDef.description}
      required={props.fieldDef.required}
      readOnly={props.readOnly || props.fieldDef.admin.readOnly}
      format={props.fieldDef.format}
      themeColors={props.fieldDef.themeColors}
      placeholder={props.fieldDef.admin.placeholder}
      renderControl={overrideControl}
    />
  );
}
```

#### packages/react/src/components/fields/json/Field.tsx
New file. `JsonField` owns the whole editor+Format-button+parse-error+read-only-group block
internally, but honours `renderControl` the same as every other leaf field — this admin field
computes and forwards it below, so an `admin.components.Input` override on a `json` field is a
real override, not a no-op.

```tsx
"use client";

import { type JsonField as JsonFieldDef } from "@vexcms/core";
import { JsonField } from "../../../forms";
import type { FieldControlProps, FieldComponentProps } from "@vexcms/core";
import { JsonEditor } from "../../ui/JsonEditor";
import { useFieldControlOverride } from "../../../hooks/useFieldControlOverride";

/**
 * JSON admin field — maps `fieldDef` to `@vexcms/react/form`'s `JsonField` props.
 *
 * @param props - {@link FieldComponentProps} narrowed to `JsonField`.
 * @returns `JsonField`, configured for this field instance.
 */
export function JsonFieldAdmin(props: FieldComponentProps<{}, JsonFieldDef>) {
  function renderBareControl(controlProps: FieldControlProps<unknown>) {
    return (
      <JsonEditor
        id={controlProps.id}
        value={JSON.stringify(controlProps.value ?? null, null, 2)}
        onChange={(text) => {
          try {
            controlProps.onChange(JSON.parse(text));
          } catch {
            // left uncommitted — the override's own control owns parse-error surfacing
          }
        }}
        onBlur={controlProps.onBlur}
        readOnly={controlProps.readOnly}
        aria-invalid={controlProps.invalid}
        aria-describedby={controlProps.describedBy}
        aria-required={props.fieldDef.required}
      />
    );
  }
  const overrideControl = useFieldControlOverride<unknown>({
    fieldType: props.fieldDef.type,
    fieldOverrides: props.fieldDef.admin.components.Input,
    defaultControl: renderBareControl,
  });
  return (
    <JsonField
      name={props.name}
      label={props.fieldDef.label || props.name}
      description={props.fieldDef.description}
      required={props.fieldDef.required}
      readOnly={props.readOnly || props.fieldDef.admin.readOnly}
      renderControl={overrideControl}
    />
  );
}
```

> Note: `renderBareControl` above swallows a `JSON.parse` failure with no local parse-error UI,
> because `FieldControlProps` carries no error-message channel beyond `invalid: boolean` — the
> real parse-error/"Format" UX stays inside `JsonField`'s own default control. This fallback is
> reached only when a project overrides `admin.components.Input` on a `json` field AND that
> override calls `renderDefault`, an already-degraded path by design, not a gap.

#### packages/react/src/components/fields/{textarea,email,url,number,checkbox,select,date,color,json}/index.ts
Same 1-edit substitution as `text/index.ts` — `export * from "./Field"` replaces
`export * from "./Input"`, not shown per-file.

#### packages/react/src/components/fields/RenderFields.tsx
Moved from `components/form/RenderFields.tsx`. `FieldLayoutItem`, `visibleFieldEntries`,
`isTabVisible`, `dataFieldNames`, `tabValue`, `fieldName`, `fieldWidth`, `renderField` and
`RenderFields` itself move unchanged beyond import paths (`"./FormTabs"` → `"../forms/FormTabs"`,
`"./FormCollapsible"` → `"../forms/FormCollapsible"`, `"./FormRow"` → `"../forms/FormRow"`,
`"./FormUI"` → `"../forms/FormUI"` — those four stay in `components/form/` until step 13 renames
them into `fields/{tabs,collapsible,row,ui}/Field.tsx`; `"./FieldConditionGate"` stays `"./
FieldConditionGate"` since it moves into this same folder in this step; `"../../hooks/
useFieldErrorCount"` → `"../../forms/useFieldErrorCount"`, this step's consolidation).

`FieldSlotOutlet` has real changes, not just a path move: it now resolves the `Field` override
chain (`resolveFieldComponent`, renamed below) instead of the `Input` chain, and renders the
composed `FieldComponent` in place of the old `InputComponent` — the field-instance `Input`
override chain is no longer resolved here at all (each built-in `Field.tsx` resolves it itself via
`useFieldControlOverride`, see above). `beforeInput`/`afterInput` stay exactly where they were:
outer siblings around the whole field, before the (now-absent, since `FormFieldLayout` renders it)
separate `Label`/`Description` slot outlets — `SlotOverrideOutlet` calls for `field.label`/
`field.description` are REMOVED, since those slots have no built-in to fall back to and
`FormFieldLayout` now renders the label/description itself; a project `admin.components.Label`/
`Description` override is unreachable from here until a future step re-threads it (not in this
spec's scope — decisions 11–17 never mention a `Label`/`Description` consumer, and the current
code's own `SlotOverrideOutlet` calls already default to `() => null`, i.e. they are inert today
too). Full replacement body of `FieldSlotOutlet` (2 edits: the memo + the render):

```tsx
function FieldSlotOutlet(props: {
  field: AdminDataField;
  fieldKey: string;
  context: RenderFieldsContext;
}): ReactNode {
  const { field, fieldKey, context } = props;
  const config = useVexConfig();
  const components = field.admin.components as unknown as {
    Field: ComponentOverrideInput<ReactHKT, unknown>[] | undefined;
    beforeInput: ComponentContributionInput<ReactHKT, unknown>[] | undefined;
    afterInput: ComponentContributionInput<ReactHKT, unknown>[] | undefined;
  };
  const rootOverrides = config.admin.components?.fields?.[field.type]?.Field as
    | ComponentOverrideInput<ReactHKT, unknown>[]
    | undefined;
  const FieldComponent = useMemo(
    () =>
      resolveFieldComponent({
        fieldType: field.type,
        rootOverrides,
        fieldOverrides: components.Field,
      }),
    [field.type, components.Field, rootOverrides],
  );
  const fieldComponentProps: FieldComponentProps<BaseFieldMeta, AdminField> = {
    name: fieldName(context, fieldKey),
    fieldDef: field,
    readOnly: Boolean(context.readOnly) || field.admin.readOnly,
    collection: context.collection,
    documentStatus: context.documentStatus,
  } as FieldComponentProps<BaseFieldMeta, AdminField>;
  const errorCount = useFieldErrorCount({ names: [fieldComponentProps.name] });
  return (
    <FieldConditionGate field={field} name={fieldComponentProps.name}>
      <div data-field-invalid={errorCount > 0 ? "" : undefined}>
        <SlotOutlet
          slotId={SLOT_IDS.field.beforeInput}
          builtins={[]}
          contributions={components.beforeInput}
          contributedProps={fieldComponentProps}
          conditionName={fieldComponentProps.name}
        />
        <ComponentErrorBoundary id={SLOT_IDS.field.field}>
          <FieldComponent {...fieldComponentProps} />
        </ComponentErrorBoundary>
        <SlotOutlet
          slotId={SLOT_IDS.field.afterInput}
          builtins={[]}
          contributions={components.afterInput}
          contributedProps={fieldComponentProps}
          conditionName={fieldComponentProps.name}
        />
      </div>
    </FieldConditionGate>
  );
}
```

Import header: `resolveFieldInputComponent` → `resolveFieldComponent` (from
`"../slots/resolveFieldComponent"`), `InputComponentProps` → `FieldComponentProps` (from
`@vexcms/core`), `SlotOverrideOutlet` import removed (no longer used by this file —
`fields/group/Field.tsx`/`fields/array/Field.tsx` still use it for their own item-level slots in
step 13, unaffected here).

#### packages/react/src/components/fields/FieldConditionGate.tsx
Moved from `components/form/FieldConditionGate.tsx`, unchanged — still reads
`useFieldCondition` from `../../hooks/useFieldCondition` (relative import updated for the new
depth, body untouched).

#### packages/react/src/components/fields/applyFieldPermissionReadOnly.ts
Moved from `components/form/applyFieldPermissionReadOnly.ts`, unchanged.

#### packages/react/src/components/fields/readableFields.ts
Moved from `components/form/readableFields.ts`, unchanged (`pickReadableValues`,
`pickReadableSchema`).

#### packages/react/src/components/fields/registry.ts
1 edit — `fieldToInputComponent` renamed `fieldToFieldComponent`, reading `.field` instead of
`.input` off the adapter map (the adapter's `fields[type]` entry itself is renamed in this step
too, see `adapter.ts` below); `fieldToCellComponent` unchanged.

```ts
/**
 * Returns the BUILT-IN admin field component registered for a field type via
 * `reactAdapter.fields` — the one source of truth both this and
 * {@link fieldToCellComponent} derive from. Does NOT resolve override chains —
 * callers that need the fully-resolved component use `resolveFieldComponent`
 * (this step's renamed `resolveFieldComponent.tsx`) instead; this stays
 * the "what is the TRUE default" primitive that chain's innermost
 * `renderDefault` composes from.
 *
 * @param field - The `DataFieldType` string to look up — UI field types (`tabs`/`collapsible`/
 *   `row`/`ui`) never reach this registry, since they have no renderable Field/Cell.
 * @returns The registered component, or `undefined` for an unregistered type.
 */
export function fieldToFieldComponent(
  field: DataFieldType,
): ComponentType<FieldComponentProps<BaseFieldMeta, AdminField>> | undefined {
  return reactAdapter.fields[field]?.field as
    ComponentType<FieldComponentProps<BaseFieldMeta, AdminField>> | undefined;
}
```

Import header: `InputComponentProps` → `FieldComponentProps` (from `@vexcms/core`).

#### packages/react/src/components/slots/resolveFieldInputComponent.tsx
Renamed `resolveFieldComponent.tsx` in this step (step 20 later decides whether `resolve*`
earns a blanket `react-components-pascal` exemption instead — this step keeps the current
`.tsx` extension and name pattern, only swapping what it resolves). Rewritten to compose the
`Field` chain instead of `Input`:

```tsx
import type { ComponentType } from "react";
import type {
  DataFieldType,
  ComponentOverrideInput,
  FieldComponentProps,
} from "@vexcms/core";
import type { ReactHKT } from "../../adapter";
import { fieldToFieldComponent } from "../fields/registry";

/**
 * Composes the final admin `Field` component for one field: built-in → root
 * per-type `fields.<type>.Field` chain → this field instance's own
 * `admin.components.Field` chain, each override's `renderDefault` resolving
 * to the previous stage (S3) — same composition `resolveFieldInputComponent`
 * used for `Input` before this step. The field instance's/root's `Input`
 * override chain is NOT composed here: each built-in `Field.tsx` resolves it
 * itself via `useFieldControlOverride`, threading the result into the
 * `@vexcms/react/form` field component's own `renderControl` prop — a
 * `Field` override that wants to keep the resolved `Input` override calls
 * `renderDefault` rather than re-deriving it.
 *
 * @throws {Error} When `fieldType` has no registered built-in.
 * @returns The composed `Field` component for this field type and override chain.
 */
export function resolveFieldComponent(props: {
  fieldType: DataFieldType;
  rootOverrides: ComponentOverrideInput<ReactHKT, FieldComponentProps>[] | undefined;
  fieldOverrides: ComponentOverrideInput<ReactHKT, FieldComponentProps>[] | undefined;
}): ComponentType<FieldComponentProps> {
  const builtin = fieldToFieldComponent(props.fieldType);
  if (!builtin) {
    throw new Error(`Missing component for field type '${props.fieldType}'`);
  }
  const chain = [...(props.rootOverrides ?? []), ...(props.fieldOverrides ?? [])];
  return chain.reduce<ComponentType<FieldComponentProps>>((renderDefault, override) => {
    const Override = override.component;
    function Composed(p: FieldComponentProps) {
      return <Override {...p} renderDefault={renderDefault} />;
    }
    Composed.displayName = `FieldOverride(${override.id})`;
    return Composed;
  }, builtin);
}
```

#### packages/react/src/components/slots/resolveFieldCellComponent.tsx
No change in this step — cells keep resolving through `fieldToCellComponent`/`Cell.tsx`, which
this step does not touch.

#### packages/react/src/adapter.ts
1 edit — every leaf field's `fields[ADMIN_FIELDS.<type>.type]` entry's `input:` key renames to
`field:`, pointing at the new `*FieldAdmin` export instead of the deleted `*FieldInput`; import
header's `TextFieldInput, EmailFieldInput, TextareaFieldInput, NumberFieldInput,
CheckboxFieldInput, SelectFieldInput, UrlFieldInput, ColorFieldInput, DateFieldInput,
JsonFieldInput` renamed `TextFieldAdmin, EmailFieldAdmin, TextareaFieldAdmin, NumberFieldAdmin,
CheckboxFieldAdmin, SelectFieldAdmin, UrlFieldAdmin, ColorFieldAdmin, DateFieldAdmin,
JsonFieldAdmin`. The six composite/custom types' `fields[...]` entries ALSO rename their `input:`
key to `field:` in this same edit, so `FieldComponentMap` (keyed `field`/`cell` for every
`DataFieldType` as of step 11) type-checks after this step alone — their VALUES stay
`RelationshipFieldInput, ArrayFieldInput, GroupFieldInput, BlocksFieldInput, UploadFieldInput,
RichTextFieldInput` (the existing `Input.tsx` components, unrenamed) until step 13 swaps each to
its own `*FieldAdmin` export once that step's `Field.tsx` files exist; only the adapter map's OWN
key changes here, not which component it points at for these six.

```ts
fields: {
  [ADMIN_FIELDS.text.type]: {
    field: TextFieldAdmin,
    cell: TextFieldCell,
  },
  [ADMIN_FIELDS.email.type]: {
    field: EmailFieldAdmin,
    cell: EmailFieldCell,
  },
  [ADMIN_FIELDS.textarea.type]: {
    field: TextareaFieldAdmin,
    cell: TextareaFieldCell,
  },
  [ADMIN_FIELDS.number.type]: {
    field: NumberFieldAdmin,
    cell: NumberFieldCell,
  },
  [ADMIN_FIELDS.checkbox.type]: {
    field: CheckboxFieldAdmin,
    cell: CheckboxFieldCell,
  },
  [ADMIN_FIELDS.date.type]: {
    field: DateFieldAdmin,
    cell: DateFieldCell,
  },
  [ADMIN_FIELDS.select.type]: {
    field: SelectFieldAdmin,
    cell: SelectFieldCell,
  },
  [ADMIN_FIELDS.url.type]: {
    field: UrlFieldAdmin,
    cell: UrlFieldCell,
  },
  [ADMIN_FIELDS.color.type]: {
    field: ColorFieldAdmin,
    cell: ColorFieldCell,
  },
  [ADMIN_FIELDS.relationship.type]: {
    field: RelationshipFieldInput,
    cell: RelationshipFieldCell,
  },
  [ADMIN_FIELDS.array.type]: {
    field: ArrayFieldInput,
    cell: ArrayFieldCell,
  },
  [ADMIN_FIELDS.group.type]: {
    field: GroupFieldInput,
    cell: GroupFieldCell,
  },
  [ADMIN_FIELDS.blocks.type]: {
    field: BlocksFieldInput,
    cell: BlocksFieldCell,
  },
  [ADMIN_FIELDS.upload.type]: {
    field: UploadFieldInput,
    cell: UploadFieldCell,
  },
  [ADMIN_FIELDS.richtext.type]: {
    field: RichTextFieldInput,
    cell: RichTextFieldCell,
  },
  [ADMIN_FIELDS.json.type]: {
    field: JsonFieldAdmin,
    cell: JsonFieldCell,
  },
},
```

`FrameworkAdapterInput<ReactHKT>`'s `fields` map type (`FieldComponentMap`, core
`framework.ts`) is keyed `field`/`cell` for EVERY `DataFieldType` as of step 11 — this object
literal type-checks on its own after this step, since every entry (including the six
composite/custom types) already uses the `field:` key, pointing at their existing `*Input`
components until step 13 swaps them to `*FieldAdmin`. This step's `Verify` command
(`pnpm --filter @vexcms/react typecheck`) passes on its own; step 13 does not need to land
alongside it for `adapter.ts` to compile.

#### packages/react/src/components/fields/index.tsx
1 edit — import + re-export of `fieldToInputComponent` renamed `fieldToFieldComponent`:

```ts
import { fieldToFieldComponent, fieldToCellComponent } from "./registry";
export { fieldToFieldComponent, fieldToCellComponent };
```

#### packages/react/src/hooks/useFieldsForm.ts
1 edit — `useForm` (TanStack) swapped for `@vexcms/react/form`'s `useAppForm`, same options
threaded through unchanged (`defaultValues` from `getFieldsDefaultValues`, `onBlur`/
`onSubmitAsync` from `getFieldsInputSchema` via `standardSchemaValidators`,
`pickReadableSchema`/`pickReadableValues` now imported from `../components/fields/readableFields`).
Full replacement of the final `return` statement and its import (everything above it —
`buildSchema`, the `hasFieldConditions` branch, `onBlur`/`onSubmitAsync` construction — is
unchanged):

```ts
import { useAppForm, type AnyFormApi } from "../forms";
// … FieldsFormOptions / SyncValidator / AsyncValidator unchanged …
import { pickReadableSchema, pickReadableValues } from "../components/fields/readableFields";

export function useFieldsForm<TData = TDocument>(
  props: {
    fields: Record<string, AdminField>;
    document?: TDocument | Record<string, unknown> | null;
    readableFieldKeys?: readonly string[];
  } & FieldsFormOptions<TData>,
): AnyFormApi {
  // … unchanged defaultValues/validator construction …
  return useAppForm({
    defaultValues,
    ...formOptions,
    validators: {
      onSubmitAsync,
      onBlur,
      ...validators,
    },
  }) as AnyFormApi;
}
```

`AnyFormApi` moves with `AppForm`/`formContext` into `@vexcms/react/form` (step 8) — this file's
import of it repoints from `../components/form/AppFormContext` to `../form`, a relative path,
same as every other in-package consumer.

#### packages/react/src/hooks/useVexForm.ts
Full rewrite — reads `../form`'s `useFormContext()` instead of the deleted
`AppFormContext`:

```ts
"use client";

import { useFormContext } from "../forms";

/**
 * S5 context hook — exposes the current form instance to a slot contribution
 * rendered inside a form (any `field.*`/`blocks.*`/`array.*` slot). Backed by
 * `@vexcms/react/form`'s `createFormHook` form context — `undefined` outside
 * a mounted `<AppForm>` tree, same as before this step.
 *
 * Experimental: breaking changes are still possible before this stabilizes.
 * @returns The current form instance, or `undefined` outside an `<AppForm>`.
 */
export function useVexForm() {
  return useFormContext();
}
```

Confirmed against the actual `forms/formContext.ts` (step 8): `useFormContext()` returns
`undefined` outside a provider (it does not throw) — `formContext.ts` wraps
`createFormHookContexts()`'s raw context access with this exact contract, matching
`useVexForm`'s existing documented behavior and `slots/formData.ts`'s existing
undefined-check, so no `try/catch` wrapper is needed.

#### packages/react/src/hooks/useFieldErrorCount.ts — deleted
`hooks/useFieldErrorCount.ts` is deleted outright; `forms/useFieldErrorCount.ts` (step 10's
temporary parallel copy, reading `useFormContext()`) is now the single canonical file — by this
step `hooks/useFieldsForm.ts` already wraps `useAppForm`, so every admin consumer, including
`FormTabs.tsx`/`FormCollapsible.tsx` (still unmigrated, not renamed into `fields/` until step
13), is mounted under the real app form tree and reads the right context through it. Every
importer of the deleted file repoints to `forms/useFieldErrorCount.ts`'s relative path:
`RenderFields.tsx` (`"../../hooks/useFieldErrorCount"` → `"../../forms/useFieldErrorCount"`,
above), `FormTabs.tsx`/`FormCollapsible.tsx` (`"../../hooks/useFieldErrorCount"` →
`"../forms/useFieldErrorCount"`, one level shallower from `components/form/`). No file's own body
changes beyond the import line — the functions' signatures and behavior are identical to the
step 10 draft, since both started from the same admin source.

#### Admin view call sites
Every current `import { AppForm } from "../../components/form/AppForm"` (or equivalent relative
path) across `CollectionEditView`, `GlobalEditView`, and any other view that mounts a
`useFieldsForm`-built form, repoints to `import { AppForm } from "../../forms"` — a relative
import, same as every other in-package consumer of `forms/` (the package never imports its own
`@vexcms/react/form` subpath from inside itself). No other change to those views in this step —
`AppForm`'s own prop contract (`form`, `children`, `className`) is unchanged by its move (step 8).

#### Field.test.tsx — porting pattern
`testing/fieldInputContract.ts`'s `runFieldInputContractSuite` (step 14 repoints its own
`AppFormBoundary` import from `components/form/AppForm` to `../form`, outside this
step's scope) already carries every shared assertion every leaf field's test reuses — a leaf
field's own `*.test.tsx` is thin: the fixture, the component, and field-specific `extra` tests.
Every leaf field's `Field.test.tsx` below is a full port of its own current `Input.test.tsx` —
`import { AppForm } from "../../forms/AppForm"` → `import { AppForm } from "../../../forms"`,
`import { <Type>FieldInput } from "./Input"` → `import { <Type>FieldAdmin } from "./Field"`,
every `<<Type>FieldInput …/>` JSX call site (including `Component: <Type>FieldInput` passed into
`runFieldInputContractSuite`) → `<<Type>FieldAdmin …/>` / `Component: <Type>FieldAdmin`, and every
prose mention of the old component name in a doc comment → the new name — the `extra`/
boundary-test bodies themselves are otherwise UNCHANGED — none of their assertions read
`field.state`/`AppFormContext` directly (they already go through `getControl`/`screen` queries
via `runFieldInputContractSuite`'s harness or, for a field's own validation/mask harness, through
`<AppForm>`/`useForm` directly), so no field-specific test logic actually changes, only the
import lines, the component name at every call site, and the doc comments that name it.

#### packages/react/src/components/fields/text/Field.test.tsx
New file (renamed from `Input.test.tsx`), full port:

```tsx
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import {
  adminFieldToInputSchema,
  defineConfig,
  text,
  type CollectionConfig,
  type TextField,
} from "@vexcms/core";
import { AppForm } from "../../../forms";
import { VexConfigContext } from "../../../context/VexConfigContext";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { textFieldFixture } from "./testFixture";
import { TextFieldAdmin } from "./Field";

const { withMaskMock } = vi.hoisted(() => {
  const applyMaskMock = vi.fn();
  return { withMaskMock: vi.fn(() => applyMaskMock) };
});

vi.mock("use-mask-input", () => ({ withMask: withMaskMock }));

function TextValidationHarness(props: {
  fieldDef: TextField;
  collection: CollectionConfig;
  initialValue: string | undefined;
}) {
  const form = useForm({
    defaultValues: { testField: props.initialValue },
    validators: {
      onSubmit: ({ value }) => {
        const schema = adminFieldToInputSchema({ field: props.fieldDef });
        const result = schema.safeParse(value.testField);
        if (result.success) return undefined;
        return { fields: { testField: result.error.issues[0]?.message ?? "Invalid value" } };
      },
    },
  });
  return (
    <AppForm form={form}>
      <TextFieldAdmin
        name="testField"
        fieldDef={props.fieldDef}
        collection={props.collection}
        readOnly={false}
      />
      <button type="submit">Submit</button>
    </AppForm>
  );
}

runFieldInputContractSuite({
  fixture: textFieldFixture,
  Component: TextFieldAdmin,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    async function submit(fieldDef: TextField, value: string | undefined): Promise<string> {
      const user = userEvent.setup();
      const { container } = render(
        <TextValidationHarness fieldDef={fieldDef} collection={collection} initialValue={value} />,
      );
      await user.click(screen.getByRole("button", { name: /submit/i }));
      return container.querySelector(".text-destructive")?.textContent ?? "";
    }

    describe("text: length boundaries, the required-vs-min/max override trap, and no client-side truncation", () => {
      it("accepts a value at exactly the configured min length", async () => {
        const fieldDef = text({ label: "Bio", min: 3 });
        expect(await submit(fieldDef, "x".repeat(3))).toBe("");
      });

      it("rejects a value one character below the min length with the default min-length message", async () => {
        const fieldDef = text({ label: "Bio", min: 3 });
        expect(await submit(fieldDef, "x".repeat(2))).toBe("Must be at least 3 characters.");
      });

      it("accepts a value at exactly the configured max length", async () => {
        const fieldDef = text({ label: "Bio", max: 10 });
        expect(await submit(fieldDef, "x".repeat(10))).toBe("");
      });

      it("rejects a value one character over the max length with the default max-length message", async () => {
        const fieldDef = text({ label: "Bio", max: 10 });
        expect(await submit(fieldDef, "x".repeat(11))).toBe("Must be no more than 10 characters.");
      });

      it("uses a custom min.error message instead of the default when configured", async () => {
        const fieldDef = text({
          label: "Bio",
          min: [5, "Bio needs at least 5 characters."],
        });
        expect(await submit(fieldDef, "x".repeat(4))).toBe("Bio needs at least 5 characters.");
      });

      it("uses a custom max.error message instead of the default when configured", async () => {
        const fieldDef = text({
          label: "Bio",
          max: [5, "Bio can be at most 5 characters."],
        });
        expect(await submit(fieldDef, "x".repeat(6))).toBe("Bio can be at most 5 characters.");
      });

      it("required + min (no max): a missing value fails with the required message — CORE-1 fixed: min/max compose onto the required branch instead of reassigning over it", async () => {
        const fieldDef = text({ label: "Bio", required: true, min: 3 });
        expect(await submit(fieldDef, undefined)).toBe("This field is required.");
      });

      it("required + max only (no min): a missing value fails with the required message, not silently passing", async () => {
        const fieldDef = text({ label: "Bio", required: true, max: 10 });
        expect(await submit(fieldDef, undefined)).toBe("This field is required.");
      });

      it("required + min AND max together: a missing value still fails with the required message", async () => {
        const fieldDef = text({
          label: "Bio",
          required: true,
          min: 3,
          max: 10,
        });
        expect(await submit(fieldDef, undefined)).toBe("This field is required.");
      });

      it('a plain required field with no min/max keeps "This field is required." for a missing value', async () => {
        const fieldDef = text({ label: "Bio", required: true });
        expect(await submit(fieldDef, undefined)).toBe("This field is required.");
      });

      it("an optional field with no min/max accepts a missing value", async () => {
        const fieldDef = text({ label: "Bio" });
        expect(await submit(fieldDef, undefined)).toBe("");
      });

      it("never client-side truncates or rejects a value past max — enforcement is deferred to the schema on submit", async () => {
        const user = userEvent.setup();
        const fieldDef = text({ label: "Bio", max: 5 });
        render(
          <TextValidationHarness
            fieldDef={fieldDef}
            collection={collection}
            initialValue={undefined}
          />,
        );

        const input = screen.getByLabelText("Bio", { exact: false });
        await user.type(input, "way too long for max");
        expect(input).toHaveValue("way too long for max");
      });
    });

    describe("text: character counter", () => {
      it("renders no counter when fieldDef.max is not set", () => {
        render(
          <TextValidationHarness
            fieldDef={text({ label: "Bio" })}
            collection={collection}
            initialValue=""
          />,
        );
        expect(screen.queryByText(/^\d+\/\d+$/)).not.toBeInTheDocument();
      });

      it("shows current length / max once fieldDef.max is set", () => {
        const fieldDef = text({ label: "Bio", max: [10, "Too long"] });
        render(
          <TextValidationHarness
            fieldDef={fieldDef}
            collection={collection}
            initialValue="Hi"
          />,
        );
        expect(screen.getByText("2/10")).toBeInTheDocument();
      });

      it("updates live as the user types", async () => {
        const user = userEvent.setup();
        const fieldDef = text({ label: "Bio", max: [10, "Too long"] });
        render(
          <TextValidationHarness
            fieldDef={fieldDef}
            collection={collection}
            initialValue=""
          />,
        );
        const input = screen.getByLabelText("Bio", { exact: false });
        await user.type(input, "Hello");
        expect(screen.getByText("5/10")).toBeInTheDocument();
      });
    });
  },
});

describe("text: admin.mask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function TextMaskHarness(props: { fieldDef: TextField }) {
    const form = useForm({ defaultValues: { testField: "" } });
    return (
      <AppForm form={form}>
        <TextFieldAdmin name="testField" fieldDef={props.fieldDef} readOnly={false} collection={testCollection} />
      </AppForm>
    );
  }

  function renderMasked(fieldDef: TextField) {
    return render(
      <VexConfigContext.Provider value={defineConfig()}>
        <TextMaskHarness fieldDef={fieldDef} />
      </VexConfigContext.Provider>,
    );
  }

  it("lazily applies the mask when admin.mask is set", async () => {
    const fieldDef = text({ label: "Phone", admin: { mask: "(999) 999-9999" } });
    renderMasked(fieldDef);
    await waitFor(() =>
      expect(withMaskMock).toHaveBeenCalledWith("(999) 999-9999", { autoUnmask: true }),
    );
  });

  it("renders the ordinary controlled input when no mask resolves", () => {
    const fieldDef = text({ label: "Title" });
    renderMasked(fieldDef);
    expect(withMaskMock).not.toHaveBeenCalled();
  });
});
```

#### packages/react/src/components/fields/textarea/Field.test.tsx
New file (renamed from `Input.test.tsx`), full port — same mechanical substitution as
`text/Field.test.tsx` above (porting pattern):

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { adminFieldToInputSchema, textarea, type CollectionConfig, type TextareaField } from "@vexcms/core";
import { AppForm } from "../../../forms";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { textareaFieldFixture } from "./testFixture";
import { TextareaFieldAdmin } from "./Field";

/**
 * Mounts `TextareaFieldAdmin` behind a real `useForm` + `<AppForm>`, wired with
 * the same real `adminFieldToInputSchema`-driven `onSubmit` validator the
 * generic factory uses internally — needed here (rather than the shared
 * fixture's fixed schema) because every boundary test below constructs and
 * submits its own `min`/`max`/`required`/`rows` combination.
 */
function TextareaValidationHarness(props: {
  fieldDef: TextareaField;
  collection: CollectionConfig;
  initialValue: string | undefined;
}) {
  const form = useForm({
    defaultValues: { testField: props.initialValue },
    validators: {
      onSubmit: ({ value }) => {
        const schema = adminFieldToInputSchema({ field: props.fieldDef });
        const result = schema.safeParse(value.testField);
        if (result.success) return undefined;
        return { fields: { testField: result.error.issues[0]?.message ?? "Invalid value" } };
      },
    },
  });
  return (
    <AppForm form={form}>
      <TextareaFieldAdmin
        name="testField"
        fieldDef={props.fieldDef}
        collection={props.collection}
        readOnly={false}
      />
      <button type="submit">Submit</button>
    </AppForm>
  );
}

runFieldInputContractSuite({
  fixture: textareaFieldFixture,
  Component: TextareaFieldAdmin,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    async function submit(fieldDef: TextareaField, value: string | undefined): Promise<string> {
      const user = userEvent.setup();
      const { container } = render(
        <TextareaValidationHarness fieldDef={fieldDef} collection={collection} initialValue={value} />,
      );
      await user.click(screen.getByRole("button", { name: /submit/i }));
      return container.querySelector(".text-destructive")?.textContent ?? "";
    }

    describe("textarea: length boundaries, rows, and the character counter", () => {
      it("accepts a value at exactly the configured min length", async () => {
        const fieldDef = textarea({ label: "Bio", min: 3 });
        expect(await submit(fieldDef, "x".repeat(3))).toBe("");
      });

      it("rejects a value one character below the min length with the default min-length message", async () => {
        const fieldDef = textarea({ label: "Bio", min: 3 });
        expect(await submit(fieldDef, "x".repeat(2))).toBe("Must be at least 3 characters.");
      });

      it("accepts a value at exactly the configured max length", async () => {
        const fieldDef = textarea({ label: "Bio", max: 10 });
        expect(await submit(fieldDef, "x".repeat(10))).toBe("");
      });

      it("rejects a value one character over the max length with the default max-length message", async () => {
        const fieldDef = textarea({ label: "Bio", max: 10 });
        expect(await submit(fieldDef, "x".repeat(11))).toBe("Must be no more than 10 characters.");
      });

      it("uses a custom min error message instead of the default when configured", async () => {
        const fieldDef = textarea({ label: "Bio", min: [5, "Bio needs at least 5 characters."] });
        expect(await submit(fieldDef, "x".repeat(4))).toBe("Bio needs at least 5 characters.");
      });

      it("uses a custom max error message instead of the default when configured", async () => {
        const fieldDef = textarea({ label: "Bio", max: [5, "Bio can be at most 5 characters."] });
        expect(await submit(fieldDef, "x".repeat(6))).toBe("Bio can be at most 5 characters.");
      });

      it("required + min (no max): a missing value fails with the required message", async () => {
        const fieldDef = textarea({ label: "Bio", required: true, min: 3 });
        expect(await submit(fieldDef, undefined)).toBe("This field is required.");
      });

      it('a plain required field with no min/max keeps "This field is required." for a missing value', async () => {
        const fieldDef = textarea({ label: "Bio", required: true });
        expect(await submit(fieldDef, undefined)).toBe("This field is required.");
      });

      it("an optional field with no min/max accepts a missing value", async () => {
        const fieldDef = textarea({ label: "Bio" });
        expect(await submit(fieldDef, undefined)).toBe("");
      });

      it("defaults rows to 4 and renders it as the textarea's rows attribute", () => {
        const fieldDef = textarea({ label: "Bio" });
        render(
          <TextareaValidationHarness
            fieldDef={fieldDef}
            collection={collection}
            initialValue={undefined}
          />,
        );
        expect(screen.getByLabelText("Bio", { exact: false })).toHaveAttribute("rows", "4");
      });

      it("honors a configured rows value", () => {
        const fieldDef = textarea({ label: "Bio", rows: 10 });
        render(
          <TextareaValidationHarness
            fieldDef={fieldDef}
            collection={collection}
            initialValue={undefined}
          />,
        );
        expect(screen.getByLabelText("Bio", { exact: false })).toHaveAttribute("rows", "10");
      });

      it("shows the bare character count, with no limit, when max is not configured", () => {
        const fieldDef = textarea({ label: "Bio" });
        render(
          <TextareaValidationHarness
            fieldDef={fieldDef}
            collection={collection}
            initialValue="hello"
          />,
        );
        expect(screen.getByText("5")).toBeInTheDocument();
        expect(screen.queryByText(/^\d+\/\d+$/)).toBeNull();
      });

      it("shows an n/max character counter that updates as the user types, when max is configured", async () => {
        const user = userEvent.setup();
        const fieldDef = textarea({ label: "Bio", max: 20 });
        render(
          <TextareaValidationHarness
            fieldDef={fieldDef}
            collection={collection}
            initialValue={undefined}
          />,
        );
        expect(screen.getByText("0/20")).toBeInTheDocument();
        await user.type(screen.getByLabelText("Bio", { exact: false }), "hello");
        expect(screen.getByText("5/20")).toBeInTheDocument();
      });

      it("never client-side truncates or rejects a value past max — enforcement is deferred to the schema on submit", async () => {
        const user = userEvent.setup();
        const fieldDef = textarea({ label: "Bio", max: 5 });
        render(
          <TextareaValidationHarness
            fieldDef={fieldDef}
            collection={collection}
            initialValue={undefined}
          />,
        );

        const input = screen.getByLabelText("Bio", { exact: false });
        await user.type(input, "way too long for max");
        expect(input).toHaveValue("way too long for max");
      });
    });
  },
});
```

#### packages/react/src/components/fields/email/Field.test.tsx
New file (renamed from `Input.test.tsx`), full port — same mechanical substitution as
`text/Field.test.tsx` above (porting pattern):

```tsx
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import {
  adminFieldToInputSchema,
  defineConfig,
  email,
  type CollectionConfig,
  type EmailField,
} from "@vexcms/core";
import { AppForm } from "../../../forms";
import { VexConfigContext } from "../../../context/VexConfigContext";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { emailFieldFixture } from "./testFixture";
import { EmailFieldAdmin } from "./Field";

const { withMaskMock } = vi.hoisted(() => {
  const applyMaskMock = vi.fn();
  return { withMaskMock: vi.fn(() => applyMaskMock) };
});

vi.mock("use-mask-input", () => ({ withMask: withMaskMock }));

/**
 * Mounts `EmailFieldAdmin` behind a real `useForm` + `<AppForm>`, wired with
 * the same real `adminFieldToInputSchema`-driven `onSubmit` validator the
 * generic factory uses internally — needed here (rather than the shared
 * fixture's fixed schema) because every boundary test below constructs and
 * submits its own `min`/`max`/`required` combination.
 */
function EmailValidationHarness(props: {
  fieldDef: EmailField;
  collection: CollectionConfig;
  initialValue: string | undefined;
}) {
  const form = useForm({
    defaultValues: { testField: props.initialValue },
    validators: {
      onSubmit: ({ value }) => {
        const schema = adminFieldToInputSchema({ field: props.fieldDef });
        const result = schema.safeParse(value.testField);
        if (result.success) return undefined;
        return { fields: { testField: result.error.issues[0]?.message ?? "Invalid value" } };
      },
    },
  });
  return (
    <AppForm form={form}>
      <EmailFieldAdmin
        name="testField"
        fieldDef={props.fieldDef}
        collection={props.collection}
        readOnly={false}
      />
      <button type="submit">Submit</button>
    </AppForm>
  );
}

runFieldInputContractSuite({
  fixture: emailFieldFixture,
  Component: EmailFieldAdmin,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    async function submit(fieldDef: EmailField, value: string | undefined): Promise<string> {
      const user = userEvent.setup();
      const { container } = render(
        <EmailValidationHarness fieldDef={fieldDef} collection={collection} initialValue={value} />,
      );
      await user.click(screen.getByRole("button", { name: /submit/i }));
      return container.querySelector(".text-destructive")?.textContent ?? "";
    }

    describe("email: native input type, format validation, and length boundaries", () => {
      it('renders a native type="email" input', () => {
        render(
          <EmailValidationHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={undefined}
          />,
        );
        const input = screen.getByLabelText("Contact Email", { exact: false });
        expect(input).toHaveAttribute("type", "email");
        expect(input).toHaveAttribute("autocomplete", "email");
      });

      it("accepts a well-formed email address", async () => {
        const fieldDef = email({ label: "Contact Email", required: true });
        expect(await submit(fieldDef, "jane@example.com")).toBe("");
      });

      it("rejects a malformed email address with a clear format message", async () => {
        const fieldDef = email({ label: "Contact Email", required: true });
        expect(await submit(fieldDef, "not-an-email")).toBe("Enter a valid email address.");
      });

      it("accepts a value at exactly the configured min length", async () => {
        const fieldDef = email({ label: "Contact Email", min: 12 });
        expect(await submit(fieldDef, "abcde@fg.com")).toBe("");
      });

      it("rejects a value below the min length with the default min-length message", async () => {
        const fieldDef = email({ label: "Contact Email", min: 10 });
        expect(await submit(fieldDef, "a@b.co")).toBe("Must be at least 10 characters.");
      });

      it("rejects a value over the max length with the default max-length message", async () => {
        const fieldDef = email({ label: "Contact Email", max: 12 });
        expect(await submit(fieldDef, "abcdefgh@ij.com")).toBe("Must be no more than 12 characters.");
      });

      it("required: a missing value fails with the required message, not the format message", async () => {
        const fieldDef = email({ label: "Contact Email", required: true });
        expect(await submit(fieldDef, undefined)).toBe("This field is required.");
      });

      it("optional: a missing value is accepted", async () => {
        const fieldDef = email({ label: "Contact Email" });
        expect(await submit(fieldDef, undefined)).toBe("");
      });
    });

    describe("email: character counter", () => {
      it("renders no counter when fieldDef.max is not set", () => {
        render(
          <EmailValidationHarness
            fieldDef={email({ label: "Contact Email" })}
            collection={collection}
            initialValue=""
          />,
        );
        expect(screen.queryByText(/^\d+\/\d+$/)).not.toBeInTheDocument();
      });

      it("shows current length / max once fieldDef.max is set", () => {
        const fieldDef = email({ label: "Contact Email", max: [20, "Too long"] });
        render(
          <EmailValidationHarness
            fieldDef={fieldDef}
            collection={collection}
            initialValue="a@b.com"
          />,
        );
        expect(screen.getByText("7/20")).toBeInTheDocument();
      });

      it("updates live as the user types", async () => {
        const user = userEvent.setup();
        const fieldDef = email({ label: "Contact Email", max: [20, "Too long"] });
        render(
          <EmailValidationHarness
            fieldDef={fieldDef}
            collection={collection}
            initialValue=""
          />,
        );
        const input = screen.getByLabelText("Contact Email", { exact: false });
        await user.type(input, "a@b.com");
        expect(screen.getByText("7/20")).toBeInTheDocument();
      });
    });
  },
});

describe("email: admin.mask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function EmailMaskHarness(props: { fieldDef: EmailField }) {
    const form = useForm({ defaultValues: { testField: "" } });
    return (
      <AppForm form={form}>
        <EmailFieldAdmin name="testField" fieldDef={props.fieldDef} readOnly={false} collection={testCollection} />
      </AppForm>
    );
  }

  it("renders type=text instead of type=email and lazily applies the mask when admin.mask is set", async () => {
    const fieldDef = email({ label: "Contact Email", admin: { mask: "email" } });
    const { container } = render(
      <VexConfigContext.Provider value={defineConfig()}>
        <EmailMaskHarness fieldDef={fieldDef} />
      </VexConfigContext.Provider>,
    );
    await waitFor(() => expect(withMaskMock).toHaveBeenCalledWith("email", { autoUnmask: true }));
    expect(container.querySelector("input")?.getAttribute("type")).toBe("text");
  });

  it("renders the ordinary controlled type=email input when no mask resolves", () => {
    const fieldDef = email({ label: "Contact Email" });
    const { container } = render(
      <VexConfigContext.Provider value={defineConfig()}>
        <EmailMaskHarness fieldDef={fieldDef} />
      </VexConfigContext.Provider>,
    );
    expect(withMaskMock).not.toHaveBeenCalled();
    expect(container.querySelector("input")?.getAttribute("type")).toBe("email");
  });
});
```

#### packages/react/src/components/fields/url/Field.test.tsx
New file (renamed from `Input.test.tsx`), full port — same mechanical substitution as
`text/Field.test.tsx` above (porting pattern):

```tsx
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import {
  defineConfig,
  url,
  urlFieldToInputSchema,
  type CollectionConfig,
  type UrlField,
} from "@vexcms/core";
import { AppForm } from "../../../forms";
import { VexConfigContext } from "../../../context/VexConfigContext";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { urlFieldFixture } from "./testFixture";
import { UrlFieldAdmin } from "./Field";

const { withMaskMock } = vi.hoisted(() => {
  const applyMaskMock = vi.fn();
  return { withMaskMock: vi.fn(() => applyMaskMock) };
});

vi.mock("use-mask-input", () => ({ withMask: withMaskMock }));

/** Mounts `UrlFieldAdmin` behind a real `useForm` + `<AppForm>`. */
function UrlHarness(props: {
  fieldDef: UrlField;
  collection: CollectionConfig;
  initialValue: string | undefined;
}) {
  const form = useForm({ defaultValues: { testField: props.initialValue } });
  return (
    <AppForm form={form}>
      <UrlFieldAdmin
        name="testField"
        fieldDef={props.fieldDef}
        collection={props.collection}
        readOnly={false}
      />
    </AppForm>
  );
}

/**
 * Mounts `UrlFieldAdmin` with the field's REAL `urlFieldToInputSchema` wired
 * as an explicit `form.Field` `onSubmit` validator, plus a submit button, so
 * the schema's actual accepted/rejected notations and exact error messages
 * can be checked through the real submit path.
 */
function UrlBoundaryHarness(props: {
  fieldDef: UrlField;
  collection: CollectionConfig;
  initialValue: string;
}) {
  const form = useForm({ defaultValues: { testField: props.initialValue } });
  const schema = urlFieldToInputSchema({ field: props.fieldDef });
  return (
    <AppForm form={form}>
      <form.Field
        name="testField"
        validators={{
          onSubmit: ({ value }) => {
            const result = schema.safeParse(value);
            return result.success ? undefined : result.error.issues[0]?.message;
          },
        }}
      >
        {(field) => (
          <UrlFieldAdmin
            name="testField"
            fieldDef={props.fieldDef}
            collection={props.collection}
            readOnly={false}
            field={field}
          />
        )}
      </form.Field>
      <button type="submit">Save</button>
    </AppForm>
  );
}

runFieldInputContractSuite({
  fixture: urlFieldFixture,
  Component: UrlFieldAdmin,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("url: the input never format-checks — that is deferred entirely to the schema", () => {
      it('renders a plain text input, not the browser\'s native type="url"', () => {
        render(
          <UrlHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.empty}
          />,
        );
        expect(
          screen.getByLabelText(options.fixture.fieldDef.label, { exact: false }),
        ).toHaveAttribute("type", "text");
      });

      it("accepts a malformed URL verbatim while typing — no client-side format rejection", async () => {
        const user = userEvent.setup();
        render(
          <UrlHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.empty}
          />,
        );
        const input = screen.getByLabelText(options.fixture.fieldDef.label, { exact: false });
        await user.type(input, "not-a-valid-url");
        expect(input).toHaveValue("not-a-valid-url");
      });

      it("accepts a well-formed absolute URL while typing", async () => {
        const user = userEvent.setup();
        render(
          <UrlHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.empty}
          />,
        );
        const input = screen.getByLabelText(options.fixture.fieldDef.label, { exact: false });
        await user.type(input, options.fixture.valid);
        expect(input).toHaveValue(options.fixture.valid);
      });
    });

    describe("url: urlFieldToInputSchema — absolute-only, protocol-agnostic, whitespace-trimmed", () => {
      it('rejects a bare domain with no scheme ("example.com") with the schema\'s real "Invalid URL" message', async () => {
        const user = userEvent.setup();
        render(
          <UrlBoundaryHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue=""
          />,
        );
        const input = screen.getByLabelText(options.fixture.fieldDef.label, { exact: false });
        await user.type(input, "example.com");
        await user.click(screen.getByRole("button", { name: "Save" }));
        expect(await screen.findByText("Invalid URL")).toBeInTheDocument();
      });

      it('rejects a root-relative path ("/relative/path") the same way — the schema requires an absolute URL', async () => {
        const user = userEvent.setup();
        render(
          <UrlBoundaryHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue=""
          />,
        );
        const input = screen.getByLabelText(options.fixture.fieldDef.label, { exact: false });
        await user.type(input, "/relative/path");
        await user.click(screen.getByRole("button", { name: "Save" }));
        expect(await screen.findByText("Invalid URL")).toBeInTheDocument();
      });

      it("accepts a non-http(s) scheme (mailto:) — urlFieldToInputSchema is not restricted to http/https", async () => {
        const user = userEvent.setup();
        render(
          <UrlBoundaryHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue=""
          />,
        );
        const input = screen.getByLabelText(options.fixture.fieldDef.label, { exact: false });
        await user.type(input, "mailto:test@example.com");
        await user.click(screen.getByRole("button", { name: "Save" }));
        expect(screen.queryByText("Invalid URL")).not.toBeInTheDocument();
      });

      it("accepts a value with leading/trailing whitespace — z.url() trims before validating", async () => {
        const user = userEvent.setup();
        render(
          <UrlBoundaryHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue=""
          />,
        );
        const input = screen.getByLabelText(options.fixture.fieldDef.label, { exact: false });
        await user.type(input, "  https://example.com  ");
        await user.click(screen.getByRole("button", { name: "Save" }));
        expect(screen.queryByText("Invalid URL")).not.toBeInTheDocument();
      });

      // CORE-2 (fixed in Step 1): `urlFieldToInputSchema`'s required branch
      // is now `z.string({ error: requiredError }).min(1, requiredError).pipe(z.url())`
      // — `.min(1)` runs on the plain string and short-circuits the pipe, so
      // an empty required field correctly reports "This field is required."
      // instead of "Invalid URL".
      it('shows "This field is required." (not "Invalid URL") when the required field is left empty', async () => {
        const user = userEvent.setup();
        render(
          <UrlBoundaryHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue=""
          />,
        );
        await user.click(screen.getByRole("button", { name: "Save" }));
        expect(await screen.findByText("This field is required.")).toBeInTheDocument();
        expect(screen.queryByText("Invalid URL")).not.toBeInTheDocument();
      });
    });

    describe("url: open-link button", () => {
      it("disables the open-link button when the field is empty", () => {
        render(
          <UrlHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue=""
          />,
        );
        expect(
          screen.getByRole("button", { name: "Open link in new tab" }),
        ).toHaveAttribute("aria-disabled", "true");
      });

      it("disables the open-link button while the value does not parse as a URL", async () => {
        const user = userEvent.setup();
        render(
          <UrlHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.empty}
          />,
        );
        const input = screen.getByLabelText(options.fixture.fieldDef.label, {
          exact: false,
        });
        await user.type(input, "not-a-valid-url");
        expect(
          screen.getByRole("button", { name: "Open link in new tab" }),
        ).toHaveAttribute("aria-disabled", "true");
      });

      it("enables the open-link button once the value parses as a URL, pointing at it with target=_blank and rel=noopener", async () => {
        const user = userEvent.setup();
        render(
          <UrlHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.empty}
          />,
        );
        const input = screen.getByLabelText(options.fixture.fieldDef.label, {
          exact: false,
        });
        await user.type(input, options.fixture.valid);
        const link = screen.getByRole("button", { name: "Open link in new tab" });
        expect(link).toHaveAttribute("href", options.fixture.valid);
        expect(link).toHaveAttribute("target", "_blank");
        expect(link.getAttribute("rel")).toContain("noopener");
      });
    });
  },
});

describe("url: admin.mask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function UrlMaskHarness(props: { fieldDef: UrlField }) {
    const form = useForm({ defaultValues: { testField: "" } });
    return (
      <AppForm form={form}>
        <UrlFieldAdmin name="testField" fieldDef={props.fieldDef} readOnly={false} collection={testCollection} />
      </AppForm>
    );
  }

  it("lazily applies the mask when admin.mask is set", async () => {
    const fieldDef = url({ label: "Profile", admin: { mask: "url" } });
    render(
      <VexConfigContext.Provider value={defineConfig()}>
        <UrlMaskHarness fieldDef={fieldDef} />
      </VexConfigContext.Provider>,
    );
    await waitFor(() => expect(withMaskMock).toHaveBeenCalledWith("url", { autoUnmask: true }));
  });

  it("falls back to the project-wide default from fields.inputMasks.url", async () => {
    const fieldDef = url({ label: "Profile" });
    render(
      <VexConfigContext.Provider value={defineConfig({ fields: { inputMasks: { url: "url" } } })}>
        <UrlMaskHarness fieldDef={fieldDef} />
      </VexConfigContext.Provider>,
    );
    await waitFor(() => expect(withMaskMock).toHaveBeenCalledWith("url", { autoUnmask: true }));
  });

  it("renders the ordinary controlled input when no mask resolves", () => {
    const fieldDef = url({ label: "Website" });
    render(
      <VexConfigContext.Provider value={defineConfig()}>
        <UrlMaskHarness fieldDef={fieldDef} />
      </VexConfigContext.Provider>,
    );
    expect(withMaskMock).not.toHaveBeenCalled();
  });
});
```

#### packages/react/src/components/fields/number/Field.test.tsx
New file (renamed from `Input.test.tsx`), full port — same mechanical substitution as
`text/Field.test.tsx` above (porting pattern):

```tsx
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import {
  defineConfig,
  number,
  numberFieldToInputSchema,
  type CollectionConfig,
  type NumberField,
} from "@vexcms/core";
import { AppForm } from "../../../forms";
import { VexConfigContext } from "../../../context/VexConfigContext";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { numberFieldFixture } from "./testFixture";
import { NumberFieldAdmin } from "./Field";

const { withMaskMock } = vi.hoisted(() => {
  const applyMaskMock = vi.fn();
  return { withMaskMock: vi.fn(() => applyMaskMock) };
});

vi.mock("use-mask-input", () => ({ withMask: withMaskMock }));

/**
 * Mounts `NumberFieldAdmin` behind a real `useForm` + `<AppForm>`, exposing the
 * form's coerced value through a probe element so the raw DOM string can be
 * told apart from the number `NumberFieldAdmin` actually stores — without
 * hand-mocking TanStack's `FieldApi`.
 */
function NumberHarness(props: {
  fieldDef: NumberField;
  collection: CollectionConfig;
  initialValue: number | undefined;
}) {
  const form = useForm({ defaultValues: { testField: props.initialValue } });
  return (
    <AppForm form={form}>
      <NumberFieldAdmin
        name="testField"
        fieldDef={props.fieldDef}
        collection={props.collection}
        readOnly={false}
      />
      <form.Subscribe selector={(state) => state.values.testField}>
        {(value) => <output data-testid="value-probe">{JSON.stringify(value)}</output>}
      </form.Subscribe>
    </AppForm>
  );
}

/**
 * Mounts `NumberFieldAdmin` with the field's REAL `numberFieldToInputSchema`
 * wired as an explicit `form.Field` `onSubmit` validator, via the documented
 * explicit-`field`-prop escape hatch (`createFieldInput` never attaches
 * validators itself), plus a submit button — so boundary values can be
 * checked against the schema's exact error messages through the real submit
 * path.
 */
function NumberBoundaryHarness(props: {
  fieldDef: NumberField;
  collection: CollectionConfig;
  initialValue: number;
}) {
  const form = useForm({ defaultValues: { testField: props.initialValue } });
  const schema = numberFieldToInputSchema({ field: props.fieldDef });
  return (
    <AppForm form={form}>
      <form.Field
        name="testField"
        validators={{
          onSubmit: ({ value }) => {
            const result = schema.safeParse(value);
            return result.success ? undefined : result.error.issues[0]?.message;
          },
        }}
      >
        {(field) => (
          <NumberFieldAdmin
            name="testField"
            fieldDef={props.fieldDef}
            collection={props.collection}
            readOnly={false}
            field={field}
          />
        )}
      </form.Field>
      <button type="submit">Save</button>
    </AppForm>
  );
}

runFieldInputContractSuite({
  fixture: numberFieldFixture,
  Component: NumberFieldAdmin,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("number: numeric coercion, decimal/negative handling, and the ?? 0 empty fallback", () => {
      it("coerces the typed digits to a number, not a string", async () => {
        const user = userEvent.setup();
        render(
          <NumberHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.empty}
          />,
        );
        const input = screen.getByLabelText(options.fixture.fieldDef.label, { exact: false });
        await user.clear(input);
        await user.type(input, "42");
        // JSON.stringify(42) === "42"; JSON.stringify("42") === '"42"' — the quotes
        // are the only thing that can tell the two apart here.
        expect(screen.getByTestId("value-probe").textContent).toBe("42");
      });

      it("forwards fieldDef.min/max/step as native HTML attributes but still does not clamp a typed value — range enforcement stays the schema's job", async () => {
        const user = userEvent.setup();
        const fieldDef = number({
          label: "Quantity",
          min: [0, "Quantity cannot be negative."],
          max: [100, "Quantity cannot exceed 100."],
          step: 5,
        });
        render(
          <NumberHarness
            fieldDef={fieldDef}
            collection={collection}
            initialValue={options.fixture.empty}
          />,
        );
        const input = screen.getByLabelText(fieldDef.label, { exact: false });
        expect(input).toHaveAttribute("min", "0");
        expect(input).toHaveAttribute("max", "100");
        expect(input).toHaveAttribute("step", "5");
        await user.clear(input);
        await user.type(input, "999");
        expect(input).toHaveValue(999);
        expect(screen.getByTestId("value-probe").textContent).toBe("999");
      });

      it("renders 0, not blank, when the field's value is undefined — the field.state.value ?? 0 fallback", () => {
        render(
          <NumberHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={undefined}
          />,
        );
        const input = screen.getByLabelText(options.fixture.fieldDef.label, { exact: false });
        expect(input).toHaveValue(0);
      });

      it("accepts and coerces a decimal value", () => {
        // A single fireEvent.change (one native "change" event carrying the
        // final string) rather than userEvent.type — typing "42.5" character
        // by character risks jsdom's <input type="number"> value-sanitization
        // algorithm discarding an intermediate value like "42." before the
        // trailing digit lands.
        render(
          <NumberHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.empty}
          />,
        );
        const input = screen.getByLabelText(options.fixture.fieldDef.label, { exact: false });
        fireEvent.change(input, { target: { value: "42.5" } });
        expect(screen.getByTestId("value-probe").textContent).toBe("42.5");
      });

      it("accepts and coerces a negative value", () => {
        render(
          <NumberHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.empty}
          />,
        );
        const input = screen.getByLabelText(options.fixture.fieldDef.label, { exact: false });
        fireEvent.change(input, { target: { value: "-5" } });
        expect(screen.getByTestId("value-probe").textContent).toBe("-5");
      });

      // Ambiguous intent: neither NumberField's JSDoc nor NumberFieldAdmin's
      // own JSDoc says what a cleared number field should hold. A user
      // clearing a required numeric field would reasonably expect the value
      // to become empty/undefined so "required" validation can catch it — not
      // silently become a valid 0. `NumberFieldAdmin` computes
      // `Number(e.target.value)`, and `Number("") === 0`, so it does the
      // latter. This assertion targets the behavior a user would reasonably
      // expect and is EXPECTED TO FAIL against the current implementation —
      // a failing assertion here is the deliverable.
      it("clearing the input resets the stored value to empty, not a silently-valid 0", async () => {
        const user = userEvent.setup();
        render(
          <NumberHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.valid}
          />,
        );
        const input = screen.getByLabelText(options.fixture.fieldDef.label, { exact: false });
        await user.clear(input);
        expect(screen.getByTestId("value-probe").textContent).toBe("");
      });
    });

    describe("number: min/max boundary enforcement, exact schema error messages", () => {
      it("accepts the minimum boundary value (0) with no validation error", async () => {
        const user = userEvent.setup();
        render(
          <NumberBoundaryHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={0}
          />,
        );
        await user.click(screen.getByRole("button", { name: "Save" }));
        expect(screen.queryByText("Quantity cannot be negative.")).not.toBeInTheDocument();
        expect(screen.queryByText("Quantity cannot exceed 100.")).not.toBeInTheDocument();
      });

      it("rejects one below the minimum (-1) with the field's exact min error message", async () => {
        const user = userEvent.setup();
        render(
          <NumberBoundaryHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={-1}
          />,
        );
        await user.click(screen.getByRole("button", { name: "Save" }));
        expect(await screen.findByText("Quantity cannot be negative.")).toBeInTheDocument();
      });

      it("accepts the maximum boundary value (100) with no validation error", async () => {
        const user = userEvent.setup();
        render(
          <NumberBoundaryHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={100}
          />,
        );
        await user.click(screen.getByRole("button", { name: "Save" }));
        expect(screen.queryByText("Quantity cannot exceed 100.")).not.toBeInTheDocument();
      });

      it("rejects one above the maximum (101) with the field's exact max error message", async () => {
        const user = userEvent.setup();
        render(
          <NumberBoundaryHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={101}
          />,
        );
        await user.click(screen.getByRole("button", { name: "Save" }));
        expect(await screen.findByText("Quantity cannot exceed 100.")).toBeInTheDocument();
      });

      // CORE-1 (fixed in Step 1): `numberFieldToInputSchema` no longer
      // applies `.default()` when `field.required` — required fields return
      // early on the plain `z.number({ error: requiredError })` chain, so a
      // missing value is now correctly rejected instead of silently
      // defaulted and validated as `0`.
      it("the real schema rejects a missing value when required: true, with the field's own required message", () => {
        const schema = numberFieldToInputSchema({ field: options.fixture.fieldDef });
        const result = schema.safeParse(undefined);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0]?.message).toBe("This field is required.");
      });
    });
  },
});

describe("number: admin.mask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function NumberMaskHarness(props: { fieldDef: NumberField }) {
    const form = useForm({ defaultValues: { testField: undefined as number | undefined } });
    return (
      <AppForm form={form}>
        <NumberFieldAdmin
          name="testField"
          fieldDef={props.fieldDef}
          readOnly={false}
          collection={testCollection}
        />
      </AppForm>
    );
  }

  function renderMasked(fieldDef: NumberField) {
    return render(
      <VexConfigContext.Provider value={defineConfig()}>
        <NumberMaskHarness fieldDef={fieldDef} />
      </VexConfigContext.Provider>,
    );
  }

  it("renders type=text and lazily applies the mask when admin.mask is set", async () => {
    const fieldDef = number({ label: "Amount", admin: { mask: "decimal" } });
    const { container } = renderMasked(fieldDef);
    await waitFor(() => expect(withMaskMock).toHaveBeenCalledWith("decimal", { autoUnmask: true }));
    expect(container.querySelector("input")?.getAttribute("type")).toBe("text");
  });

  it("converts an empty masked input to undefined, not NaN", async () => {
    const fieldDef = number({ label: "Amount", admin: { mask: "decimal" } });
    const { container } = renderMasked(fieldDef);
    await waitFor(() => expect(withMaskMock).toHaveBeenCalled());
    const input = container.querySelector("input") as HTMLInputElement;
    fireEvent.input(input, { target: { value: "" } });
    expect(input.value).toBe("");
  });

  it("renders the ordinary controlled type=number input when no mask resolves", () => {
    const fieldDef = number({ label: "Amount" });
    const { container } = renderMasked(fieldDef);
    expect(withMaskMock).not.toHaveBeenCalled();
    expect(container.querySelector("input")?.getAttribute("type")).toBe("number");
  });
});
```

#### packages/react/src/components/fields/checkbox/Field.test.tsx
New file (renamed from `Input.test.tsx`), full port — same mechanical substitution as
`text/Field.test.tsx` above (porting pattern):

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import {
  checkboxFieldToInputSchema,
  type CheckboxField,
  type CollectionConfig,
} from "@vexcms/core";
import { AppForm } from "../../../forms";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { checkboxFieldFixture } from "./testFixture";
import { CheckboxFieldAdmin } from "./Field";

/** Mounts `CheckboxFieldAdmin` behind a real `useForm` + `<AppForm>`. */
function CheckboxHarness(props: {
  fieldDef: CheckboxField;
  collection: CollectionConfig;
  initialValue: boolean;
  readOnly?: boolean;
}) {
  const form = useForm({ defaultValues: { testField: props.initialValue } });
  return (
    <AppForm form={form}>
      <CheckboxFieldAdmin
        name="testField"
        fieldDef={props.fieldDef}
        collection={props.collection}
        readOnly={props.readOnly ?? false}
      />
    </AppForm>
  );
}

/**
 * Mounts `CheckboxFieldAdmin` with the field's REAL `checkboxFieldToInputSchema`
 * wired as an explicit `form.Field` `onSubmit` validator, plus a submit
 * button, to check the field's actual submitted-value semantics through the
 * real submit path.
 */
function CheckboxBoundaryHarness(props: {
  fieldDef: CheckboxField;
  collection: CollectionConfig;
  initialValue: boolean;
}) {
  const form = useForm({ defaultValues: { testField: props.initialValue } });
  const schema = checkboxFieldToInputSchema({ field: props.fieldDef });
  return (
    <AppForm form={form}>
      <form.Field
        name="testField"
        validators={{
          onSubmit: ({ value }) => {
            const result = schema.safeParse(value);
            return result.success ? undefined : result.error.issues[0]?.message;
          },
        }}
      >
        {(field) => (
          <CheckboxFieldAdmin
            name="testField"
            fieldDef={props.fieldDef}
            collection={props.collection}
            readOnly={false}
            field={field}
          />
        )}
      </form.Field>
      <button type="submit">Save</button>
    </AppForm>
  );
}

runFieldInputContractSuite({
  fixture: checkboxFieldFixture,
  Component: CheckboxFieldAdmin,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("checkbox: checked/unchecked toggle and label-click delegation", () => {
      it("starts unchecked and toggles to checked on click, then back on a second click", async () => {
        const user = userEvent.setup();
        const { container } = render(
          <CheckboxHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.empty ?? false}
          />,
        );
        const box = screen.getByRole("checkbox", { name: new RegExp(options.fixture.fieldDef.label) });
        // Base UI's visible `role="checkbox"` span delegates a real click to
        // its hidden native `<input>` via a dispatched `PointerEvent` — jsdom
        // (verified) doesn't run the browser's default checkbox-toggle action
        // for a programmatically dispatched event the way a real browser
        // does, so this drives the interaction through the hidden input
        // directly: the same element the span's own click handler targets,
        // and the one native `<label for>` click-delegation also lands on
        // (proven working by the very next test in this block).
        const hiddenInput = container.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
        expect(box).not.toBeChecked();
        await user.click(hiddenInput);
        expect(box).toBeChecked();
        await user.click(hiddenInput);
        expect(box).not.toBeChecked();
      });

      // `FormLabel` renders `htmlFor={name}`, and Base UI's `Checkbox.Root`
      // places that same id on its visually-hidden native
      // `<input type="checkbox">` (not the visible span) specifically so the
      // browser's native label-click delegation works — exercised end to end.
      // The label's accessible name carries the required asterisk (UI-3), so
      // `getByRole`'s `name` match is a regex here, not the bare field label.
      it("clicking the field's label toggles the checkbox, the same as clicking the control", async () => {
        const user = userEvent.setup();
        render(
          <CheckboxHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={false}
          />,
        );
        const box = screen.getByRole("checkbox", { name: new RegExp(options.fixture.fieldDef.label) });
        expect(box).not.toBeChecked();
        await user.click(screen.getByText(options.fixture.fieldDef.label));
        expect(box).toBeChecked();
      });

      it("clicking the field's label is a no-op when the field is disabled via the readOnly prop", async () => {
        const user = userEvent.setup();
        render(
          <CheckboxHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={false}
            readOnly
          />,
        );
        const box = screen.getByRole("checkbox", { name: new RegExp(options.fixture.fieldDef.label) });
        await user.click(screen.getByText(options.fixture.fieldDef.label));
        expect(box).not.toBeChecked();
      });

      // CheckboxFieldAdmin ORs BOTH sources into the same disabled/readOnly
      // pair, unlike text/number/url's split — exercising fieldDef.admin.readOnly
      // through the label-click path specifically, since that path is not
      // covered by the shared factory's generic readOnly checks.
      it("clicking the field's label is a no-op when the field is disabled via fieldDef.admin.readOnly instead", async () => {
        const user = userEvent.setup();
        const readOnlyFieldDef: CheckboxField = {
          ...options.fixture.fieldDef,
          admin: { ...options.fixture.fieldDef.admin, readOnly: true },
        };
        render(
          <CheckboxHarness
            fieldDef={readOnlyFieldDef}
            collection={collection}
            initialValue={false}
          />,
        );
        const box = screen.getByRole("checkbox", { name: new RegExp(options.fixture.fieldDef.label) });
        await user.click(screen.getByText(options.fixture.fieldDef.label));
        expect(box).not.toBeChecked();
      });
    });

    describe("checkbox: indeterminate is architecturally unreachable", () => {
      // Negative/boundary check: Base UI's Checkbox.Root supports an
      // `indeterminate` prop, but CheckboxField/CheckboxFieldAdmin expose no
      // config surface for it, so the state can never be reached through this
      // field type.
      it("never renders an indeterminate ARIA state", () => {
        render(
          <CheckboxHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={true}
          />,
        );
        const box = screen.getByRole("checkbox", { name: new RegExp(options.fixture.fieldDef.label) });
        expect(box).not.toHaveAttribute("data-indeterminate");
        expect(box.getAttribute("aria-checked")).not.toBe("mixed");
      });
    });

    describe("checkbox: required means present, not checked", () => {
      // Reading checkboxFieldToInputSchema (CORE-1 fix): required fields
      // attach `{ error: "This field is required." }` to the base
      // `z.boolean()` call and never receive `.default()`, so a genuinely
      // missing value is rejected — but `true`/`false` are both legitimate
      // present values and neither is rejected. "Required" means "present",
      // not "checked".
      it("accepts true and false, rejects a missing value, for a required checkbox", () => {
        const schema = checkboxFieldToInputSchema({ field: options.fixture.fieldDef });
        expect(schema.safeParse(true)).toMatchObject({ success: true, data: true });
        expect(schema.safeParse(false)).toMatchObject({ success: true, data: false });
        const missing = schema.safeParse(undefined);
        expect(missing.success).toBe(false);
        if (!missing.success) {
          expect(missing.error.issues[0].message).toMatch(/required/i);
        }
      });

      it("submitting the form with the checkbox left unchecked produces no validation error, even though the field is required", async () => {
        const user = userEvent.setup();
        render(
          <CheckboxBoundaryHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={false}
          />,
        );
        await user.click(screen.getByRole("button", { name: "Save" }));
        expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
      });
    });
  },
});
```

#### packages/react/src/components/fields/select/Field.test.tsx
New file (renamed from `Input.test.tsx`), full port — same mechanical substitution as
`text/Field.test.tsx` above (porting pattern):

```tsx
import "@testing-library/jest-dom/vitest";
import { useForm } from "@tanstack/react-form";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it } from "vitest";
import { select, SELECT_DISPLAYS, type SelectField } from "@vexcms/core";
import { AppForm } from "../../../forms";
import { ModalSurfaceProvider } from "../../../hooks/useModalSurface";
import { installDomPolyfills } from "../../../testing/setup";
import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { selectFieldFixture } from "./testFixture";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { SelectFieldAdmin } from "./Field";

// cmdk (the popover's option list) observes its list for virtual sizing and
// scrolls the highlighted item into view on mount — jsdom has neither
// ResizeObserver nor layout. Every test in this file opens the popover, so
// install once for the whole file, mirroring `ui/multi-select.test.tsx`.
beforeAll(() => {
  installDomPolyfills();
});

/**
 * Mounts `SelectFieldAdmin` behind a real `useForm` + `<AppForm>`, exposing
 * the committed form value through a probe element so the exact stored
 * array — values not labels, one item vs. two — is assertable without
 * hand-mocking TanStack's `FieldApi`.
 */
function SelectHarness(props: { fieldDef: SelectField; initialValue: string[] }) {
  const form = useForm({ defaultValues: { choice: props.initialValue } });
  return (
    <AppForm form={form}>
      <SelectFieldAdmin
        name="choice"
        fieldDef={props.fieldDef}
        collection={testCollection}
        readOnly={false}
      />
      <form.Subscribe selector={(state) => state.values.choice}>
        {(value) => <output data-testid="value-probe">{JSON.stringify(value)}</output>}
      </form.Subscribe>
    </AppForm>
  );
}

runFieldInputContractSuite({
  fixture: selectFieldFixture,
  Component: SelectFieldAdmin,
  extra: ({ fixture }) => {
    describe("select field", () => {
      it("renders every configured option in the popover", async () => {
        const user = userEvent.setup();
        render(<SelectHarness fieldDef={fixture.fieldDef} initialValue={[]} />);

        await user.click(screen.getByRole("combobox"));

        for (const option of fixture.fieldDef.options) {
          expect(
            await screen.findByRole("option", { name: option.label }),
          ).toBeInTheDocument();
        }
      });

      it("stores the option's value, not its label, when a selection is made", async () => {
        const user = userEvent.setup();
        render(<SelectHarness fieldDef={fixture.fieldDef} initialValue={[]} />);

        await user.click(screen.getByRole("combobox"));
        await user.click(await screen.findByRole("option", { name: "Draft" }));

        expect(screen.getByTestId("value-probe").textContent).toBe(JSON.stringify(["draft"]));
      });

      it("renders the configured label, not the raw stored value, for an already-selected option", () => {
        render(<SelectHarness fieldDef={fixture.fieldDef} initialValue={["published"]} />);

        expect(
          within(screen.getByRole("combobox")).getByText("Published"),
        ).toBeInTheDocument();
      });

      it("opens without crashing and lists no options when fieldDef.options is empty", async () => {
        const user = userEvent.setup();
        const emptyOptionsFieldDef = select({ label: "Status", hasMany: true, options: [] });
        render(<SelectHarness fieldDef={emptyOptionsFieldDef} initialValue={[]} />);

        await user.click(screen.getByRole("combobox"));
        // No option ever appears to `findByRole` on, so wait on the reveal
        // effect's own side effect instead — the popup's initial focus
        // target taking focus, same assertion `ui/multi-select.test.tsx`
        // uses to pin that effect. `admin.searchable` defaults to `false`
        // (Step 17), so the focus target is the sr-only
        // `[data-multiselect-focus]` button, not the search `command-input`.
        await waitFor(() =>
          expect(document.activeElement?.hasAttribute("data-multiselect-focus")).toBe(
            true,
          ),
        );

        expect(screen.queryAllByRole("option")).toHaveLength(0);
      });

      it("collapses duplicate option values to one stored entry, keyed by value not by row", async () => {
        const user = userEvent.setup();
        const duplicateValueFieldDef = select({
          label: "Status",
          hasMany: true,
          options: [
            { label: "Draft A", value: "dup" },
            { label: "Draft B", value: "dup" },
          ],
        });
        render(<SelectHarness fieldDef={duplicateValueFieldDef} initialValue={[]} />);

        await user.click(screen.getByRole("combobox"));
        // Both rows render — `MultiSelectItem` keys on the option's array
        // index, not its `value`, so a duplicate value never collides as a
        // React key.
        expect(await screen.findByRole("option", { name: "Draft A" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Draft B" })).toBeInTheDocument();

        await user.click(screen.getByRole("option", { name: "Draft A" }));

        // Selection is a `Set<string>` keyed by value — clicking either row
        // selects the same "dup" entry.
        expect(screen.getByTestId("value-probe").textContent).toBe(JSON.stringify(["dup"]));
      });

      it("accumulates selections into the array when hasMany is true", async () => {
        const user = userEvent.setup();
        render(<SelectHarness fieldDef={fixture.fieldDef} initialValue={[]} />);

        await user.click(screen.getByRole("combobox"));
        await user.click(await screen.findByRole("option", { name: "Draft" }));
        // hasMany keeps the popover open after a selection — no need to
        // reopen it before picking the second option.
        await user.click(await screen.findByRole("option", { name: "Published" }));

        expect(screen.getByTestId("value-probe").textContent).toBe(
          JSON.stringify(["draft", "published"]),
        );
      });

      it("replaces rather than appends when hasMany is false, and the stored value stays an array", async () => {
        const user = userEvent.setup();
        const singleFieldDef = select({
          label: "Status",
          hasMany: false,
          options: fixture.fieldDef.options,
        });
        render(<SelectHarness fieldDef={singleFieldDef} initialValue={[]} />);

        await user.click(screen.getByRole("combobox"));
        await user.click(await screen.findByRole("option", { name: "Draft" }));
        expect(screen.getByTestId("value-probe").textContent).toBe(JSON.stringify(["draft"]));

        // Single-select closes the popover on selection; reopen it.
        await user.click(screen.getByRole("combobox"));
        await user.click(await screen.findByRole("option", { name: "Published" }));

        // Still an array — `toggleValue` always calls
        // `onValuesChange([...set])` — just capped at one entry instead of
        // appending a second.
        expect(screen.getByTestId("value-probe").textContent).toBe(
          JSON.stringify(["published"]),
        );
      });

      it("clears the selection when hasMany is false and the already-selected option is picked again", async () => {
        const user = userEvent.setup();
        const singleFieldDef = select({
          label: "Status",
          hasMany: false,
          options: fixture.fieldDef.options,
        });
        render(<SelectHarness fieldDef={singleFieldDef} initialValue={["draft"]} />);

        await user.click(screen.getByRole("combobox"));
        await user.click(await screen.findByRole("option", { name: "Draft" }));

        // `toggleValue`'s single branch is `prev.has(value) ? new Set() :
        // new Set([value])` — picking the already-selected option toggles it
        // off, not a no-op.
        expect(screen.getByTestId("value-probe").textContent).toBe(JSON.stringify([]));
      });

      it("deselects an option by picking it again while hasMany is true", async () => {
        const user = userEvent.setup();
        render(
          <SelectHarness fieldDef={fixture.fieldDef} initialValue={["draft", "published"]} />,
        );

        await user.click(screen.getByRole("combobox"));
        await user.click(await screen.findByRole("option", { name: "Draft" }));

        expect(screen.getByTestId("value-probe").textContent).toBe(
          JSON.stringify(["published"]),
        );
      });

      it("removes a selection by clicking its badge in the trigger", async () => {
        const user = userEvent.setup();
        render(
          <SelectHarness fieldDef={fixture.fieldDef} initialValue={["draft", "published"]} />,
        );

        // `MultiSelectValue` renders a `clickToRemove` badge per selected
        // value even while closed — a second removal path independent of
        // reopening the popover. Scoped to the trigger: the always-mounted
        // hidden item list (kept for `onItemAdded` registration) renders the
        // same label text but is excluded from role/text queries only when
        // scoped — `within` avoids the ambiguity outright.
        const combobox = screen.getByRole("combobox");
        await user.click(within(combobox).getByText("Draft"));

        expect(screen.getByTestId("value-probe").textContent).toBe(
          JSON.stringify(["published"]),
        );
      });

      it("closes when clicking outside the popover", async () => {
        const user = userEvent.setup();
        render(<SelectHarness fieldDef={fixture.fieldDef} initialValue={[]} />);

        await user.click(screen.getByRole("combobox"));
        expect(await screen.findByRole("option", { name: "Draft" })).toBeInTheDocument();

        await user.click(document.body);

        await waitFor(() =>
          expect(screen.queryByRole("option", { name: "Draft" })).not.toBeInTheDocument(),
        );
      });

      it("closes on Escape", async () => {
        const user = userEvent.setup();
        render(<SelectHarness fieldDef={fixture.fieldDef} initialValue={[]} />);

        await user.click(screen.getByRole("combobox"));
        expect(await screen.findByRole("option", { name: "Draft" })).toBeInTheDocument();

        await user.keyboard("{Escape}");

        await waitFor(() =>
          expect(screen.queryByRole("option", { name: "Draft" })).not.toBeInTheDocument(),
        );
      });

      it("selects the highlighted option via ArrowDown + Enter, not only via a mouse click", async () => {
        const user = userEvent.setup();
        render(<SelectHarness fieldDef={fixture.fieldDef} initialValue={[]} />);

        await user.click(screen.getByRole("combobox"));
        // cmdk focuses the search input and highlights the first item on open.
        await screen.findByRole("option", { name: "Draft" });

        await user.keyboard("{ArrowDown}{Enter}");

        // Delegated entirely to cmdk's own keyboard handling — `Input.tsx`
        // forwards the option list and implements no navigation itself.
        expect(screen.getByTestId("value-probe").textContent).toBe(
          JSON.stringify(["published"]),
        );
      });

      it("does not lock page scroll when rendered on a plain page (outside a modal surface)", async () => {
        const user = userEvent.setup();
        render(<SelectHarness fieldDef={fixture.fieldDef} initialValue={[]} />);

        await user.click(screen.getByRole("combobox"));

        // `SelectFieldAdmin` reads `useModalSurface()` and only passes
        // `modal: true` to `MultiSelect` inside a dialog. Rendered on a
        // plain page (no `Modal` ancestor) it must stay non-modal, or Base
        // UI's `useScrollLock` snaps the page to the top and the popover
        // closes itself — see `ui/multi-select.tsx`'s `modal` JSDoc and AP-018.
        expect(document.body.style.position).not.toBe("relative");
        expect(document.body.style.overflow).not.toBe("hidden");
      });

      it("still opens and functions when rendered inside a modal surface (the useModalSurface branch)", async () => {
        const user = userEvent.setup();
        render(
          <ModalSurfaceProvider>
            <SelectHarness fieldDef={fixture.fieldDef} initialValue={[]} />
          </ModalSurfaceProvider>,
        );

        await user.click(screen.getByRole("combobox"));
        await user.click(await screen.findByRole("option", { name: "Draft" }));

        expect(screen.getByTestId("value-probe").textContent).toBe(JSON.stringify(["draft"]));
        // `modal: true` engages Base UI's `useScrollLock`, which only writes
        // `body.style` when the document is actually scrollable — jsdom has
        // no layout, so that half is not observable here. The context value
        // itself (`useModalSurface` returning `true` inside a
        // `ModalSurfaceProvider`) is already pinned by
        // `hooks/useModalSurface.test.tsx`; this test instead proves
        // `SelectFieldAdmin` actually reads it and wires it through without
        // breaking the popover.
      });

      it("shows the placeholder only while nothing is selected", async () => {
        const user = userEvent.setup();
        render(<SelectHarness fieldDef={fixture.fieldDef} initialValue={[]} />);

        expect(screen.getByText("Choose a status")).toBeInTheDocument();

        await user.click(screen.getByRole("combobox"));
        await user.click(await screen.findByRole("option", { name: "Draft" }));

        // `MultiSelectValue` only renders the placeholder when
        // `selectedValues.size === 0` — it must disappear the moment a
        // value lands, not just avoid erroring while one is present.
        expect(screen.queryByText("Choose a status")).not.toBeInTheDocument();
      });
    });

    describe("select: admin.searchable", () => {
      it("renders no search box by default (admin.searchable: false)", async () => {
        const user = userEvent.setup();
        render(<SelectHarness fieldDef={fixture.fieldDef} initialValue={[]} />);
        await user.click(screen.getByRole("combobox"));
        expect(
          document.querySelector('[data-slot="command-input"]'),
        ).not.toBeInTheDocument();
      });

      it("renders a search box when admin.searchable is true", async () => {
        const user = userEvent.setup();
        const searchableFieldDef = select({
          label: "Status",
          hasMany: true,
          options: fixture.fieldDef.options,
          admin: { searchable: true },
        });
        render(<SelectHarness fieldDef={searchableFieldDef} initialValue={[]} />);
        await user.click(screen.getByRole("combobox"));
        await waitFor(() =>
          expect(document.activeElement?.getAttribute("data-slot")).toBe(
            "command-input",
          ),
        );
        expect(document.activeElement).toHaveAttribute(
          "data-slot",
          "command-input",
        );
      });
    });

    describe("select: admin.display radio/checkbox list", () => {
      it("renders radio inputs instead of the dropdown when hasMany is false and display is radio", () => {
        const radioFieldDef = select({
          label: "Status",
          hasMany: false,
          options: fixture.fieldDef.options,
          admin: { display: SELECT_DISPLAYS.radio },
        });
        render(<SelectHarness fieldDef={radioFieldDef} initialValue={[]} />);
        expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
        for (const option of radioFieldDef.options) {
          expect(
            screen.getByRole("radio", { name: option.label }),
          ).toBeInTheDocument();
        }
      });

      it("renders checkboxes instead of radios when hasMany is true and display is radio", () => {
        const checkboxFieldDef = select({
          label: "Status",
          hasMany: true,
          options: fixture.fieldDef.options,
          admin: { display: SELECT_DISPLAYS.radio },
        });
        render(<SelectHarness fieldDef={checkboxFieldDef} initialValue={[]} />);
        for (const option of checkboxFieldDef.options) {
          expect(
            screen.getByRole("checkbox", { name: option.label }),
          ).toBeInTheDocument();
        }
      });

      it("selects a single value by clicking its radio, replacing any previous selection", async () => {
        const user = userEvent.setup();
        const radioFieldDef = select({
          label: "Status",
          hasMany: false,
          options: fixture.fieldDef.options,
          admin: { display: SELECT_DISPLAYS.radio },
        });
        const { container } = render(
          <SelectHarness fieldDef={radioFieldDef} initialValue={["draft"]} />,
        );
        // Base UI's visible `role="radio"` span handles clicks via a
        // `PointerEvent` jsdom doesn't implement — same gap
        // `dataTableSuite.tsx`'s checkbox-column test documents. Drive the
        // interaction through the hidden native `<input type="radio">`
        // instead.
        const publishedIndex = radioFieldDef.options.findIndex(
          (o) => o.label === "Published",
        );
        const hiddenInputs = container.querySelectorAll<HTMLInputElement>(
          'input[type="radio"]',
        );
        await user.click(hiddenInputs[publishedIndex]!);
        expect(screen.getByTestId("value-probe").textContent).toBe(
          JSON.stringify(["published"]),
        );
      });

      it("accumulates checked values by clicking multiple checkboxes when hasMany and display is radio", async () => {
        const user = userEvent.setup();
        const checkboxFieldDef = select({
          label: "Status",
          hasMany: true,
          options: fixture.fieldDef.options,
          admin: { display: SELECT_DISPLAYS.radio },
        });
        const { container } = render(
          <SelectHarness fieldDef={checkboxFieldDef} initialValue={[]} />,
        );
        // Same jsdom `PointerEvent` gap as above — drive through the hidden
        // native `<input type="checkbox">` elements.
        const draftIndex = checkboxFieldDef.options.findIndex(
          (o) => o.label === "Draft",
        );
        const publishedIndex = checkboxFieldDef.options.findIndex(
          (o) => o.label === "Published",
        );
        const hiddenInputs = container.querySelectorAll<HTMLInputElement>(
          'input[type="checkbox"]',
        );
        await user.click(hiddenInputs[draftIndex]!);
        await user.click(hiddenInputs[publishedIndex]!);
        expect(screen.getByTestId("value-probe").textContent).toBe(
          JSON.stringify(["draft", "published"]),
        );
      });
    });
  },
});
```

#### packages/react/src/components/fields/date/Field.test.tsx
New file (renamed from `Input.test.tsx`), full port — same mechanical substitution as
`text/Field.test.tsx` above (porting pattern):

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { describe, expect, it } from "vitest";
import { adminFieldToInputSchema, date, type DateField } from "@vexcms/core";
import { DateFieldAdmin } from "./Field";
import { AppForm } from "../../../forms";
import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { dateFieldFixture } from "./testFixture";
import { testCollection } from "../../../testing/harness/accessFixtures";

// "MMMM d, yyyy" — date-only trigger label (time.hidden: true)
const DATE_ONLY_LABEL = /^[A-Z][a-z]+ \d{1,2}, \d{4}$/;
// "MMM d, yyyy hh:mm:ss a" — default date+time trigger label (12-hour)
const DATE_TIME_LABEL = /^[A-Z][a-z]{2} \d{1,2}, \d{4} \d{2}:\d{2}:\d{2} (AM|PM)$/;
// "MMM d, yyyy HH:mm:ss" — date+time trigger label, time.use12HourFormat: false
const DATE_TIME_24H_LABEL = /^[A-Z][a-z]{2} \d{1,2}, \d{4} \d{2}:\d{2}:\d{2}$/;
// inline TimePicker's own button label, seconds hidden (timePicker.second: false, the default)
const TIME_NO_SECONDS = /^\d{2}:\d{2} (AM|PM)$/;
// inline TimePicker's own button label, seconds shown (timePicker.second: true)
const TIME_WITH_SECONDS = /^\d{2}:\d{2}:\d{2} (AM|PM)$/;
// inline TimePicker's own button label, hour hidden (timePicker.hour: false) — only minute + period remain
const TIME_MINUTE_ONLY = /^\d{2} (AM|PM)$/;

function DateHarness(props: { fieldDef: DateField; initialValue: string | undefined }) {
  const form = useForm({ defaultValues: { testField: props.initialValue } });
  return (
    <AppForm form={form}>
      <DateFieldAdmin
        name="testField"
        fieldDef={props.fieldDef}
        collection={testCollection}
        readOnly={false}
      />
      <form.Subscribe selector={(state) => state.values.testField}>
        {(value) => <output data-testid="value-probe">{JSON.stringify(value)}</output>}
      </form.Subscribe>
    </AppForm>
  );
}

/**
 * Finds a clickable, in-range, in-month calendar day cell in an already-open
 * picker — used by the day-selection tests instead of a hardcoded date, since
 * the exact days rendered depend on the fixture's local-timezone-rendered month.
 *
 * Queries `document.body` rather than the RTL `container`: the picker's
 * popover content renders through a Base UI `Portal` directly into
 * `document.body` (`ui/popover.tsx`), outside the RTL render container's own
 * subtree.
 */
function findSelectableDayCell(): HTMLElement {
  const cell = document.body.querySelector<HTMLElement>(
    "td[data-day]:not([data-outside]):not([data-selected]):not([data-disabled])",
  );
  if (!cell) throw new Error("No selectable day cell found in the open calendar.");
  return cell;
}

runFieldInputContractSuite({
  fixture: dateFieldFixture,
  Component: DateFieldAdmin,
  extra: ({ fixture }) => {
    describe("date field: date-only vs date+time formatting", () => {
      it("renders a date-only trigger label when time.hidden is true", () => {
        render(
          <DateHarness
            fieldDef={{
              ...fixture.fieldDef,
              time: { ...fixture.fieldDef.time, hidden: true },
            }}
            initialValue={fixture.valid}
          />,
        );
        expect(screen.getByText(DATE_ONLY_LABEL)).toBeInTheDocument();
      });

      it("renders a date+time trigger label in 12-hour format by default", () => {
        render(<DateHarness fieldDef={fixture.fieldDef} initialValue={fixture.valid} />);
        expect(screen.getByText(DATE_TIME_LABEL)).toBeInTheDocument();
      });

      it("renders a 24-hour date+time trigger label when time.use12HourFormat is false", () => {
        render(
          <DateHarness
            fieldDef={{
              ...fixture.fieldDef,
              time: { ...fixture.fieldDef.time, use12HourFormat: false },
            }}
            initialValue={fixture.valid}
          />,
        );
        expect(screen.getByText(DATE_TIME_24H_LABEL)).toBeInTheDocument();
      });
    });

    describe("date field: read-only", () => {
      it("does not open the picker or offer the clear button when admin.readOnly is set", async () => {
        const user = userEvent.setup();
        render(
          <DateHarness
            fieldDef={{ ...fixture.fieldDef, admin: { ...fixture.fieldDef.admin, readOnly: true } }}
            initialValue={fixture.valid}
          />,
        );
        await user.click(screen.getByText(DATE_TIME_LABEL));
        expect(screen.queryByText(TIME_NO_SECONDS)).not.toBeInTheDocument();
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Clear date" })).not.toBeInTheDocument();
      });
    });

    describe("date field: time.timePicker per-unit opt-in/opt-out", () => {
      it("hides the seconds column by default (timePicker.second: false)", async () => {
        const user = userEvent.setup();
        render(<DateHarness fieldDef={fixture.fieldDef} initialValue={fixture.valid} />);
        await user.click(screen.getByText(DATE_TIME_LABEL));
        expect(screen.getByText(TIME_NO_SECONDS)).toBeInTheDocument();
      });

      it("shows the seconds column when time.timePicker.second is opted in", async () => {
        const user = userEvent.setup();
        render(
          <DateHarness
            fieldDef={{
              ...fixture.fieldDef,
              time: {
                ...fixture.fieldDef.time,
                timePicker: { ...fixture.fieldDef.time.timePicker, second: true },
              },
            }}
            initialValue={fixture.valid}
          />,
        );
        await user.click(screen.getByText(DATE_TIME_LABEL));
        expect(screen.getByText(TIME_WITH_SECONDS)).toBeInTheDocument();
      });

      it("hides the hour column when time.timePicker.hour is opted out, independently of its minute/second siblings", async () => {
        const user = userEvent.setup();
        render(
          <DateHarness
            fieldDef={{
              ...fixture.fieldDef,
              time: {
                ...fixture.fieldDef.time,
                timePicker: { ...fixture.fieldDef.time.timePicker, hour: false },
              },
            }}
            initialValue={fixture.valid}
          />,
        );
        await user.click(screen.getByText(DATE_TIME_LABEL));
        expect(screen.getByText(TIME_MINUTE_ONLY)).toBeInTheDocument();
      });
    });

    describe("date field: calendar day selection commits only via Done", () => {
      it("selecting a different calendar day and clicking Done commits the new day, preserving the time-of-day", async () => {
        const user = userEvent.setup();
        render(<DateHarness fieldDef={fixture.fieldDef} initialValue={fixture.valid} />);
        await user.click(screen.getByText(DATE_TIME_LABEL));

        const initialDate = new Date(fixture.valid);
        const targetCell = findSelectableDayCell();
        const targetDay = targetCell.getAttribute("data-day")!; // "yyyy-MM-dd"
        await user.click(targetCell.querySelector("button")!);
        await user.click(screen.getByRole("button", { name: /done/i }));

        const probe = screen.getByTestId("value-probe").textContent;
        const committed = new Date(JSON.parse(probe!) as number);
        const [year, month, day] = targetDay.split("-").map(Number);
        expect(committed.getFullYear()).toBe(year);
        expect(committed.getMonth() + 1).toBe(month);
        expect(committed.getDate()).toBe(day);
        // onDayChanged (date-picker.tsx) only overwrites y/m/d — the clicked day's
        // h/m/s come from whatever internal `date` state already held, unchanged
        // since no time-of-day interaction happened in this test.
        expect(committed.getHours()).toBe(initialDate.getHours());
        expect(committed.getMinutes()).toBe(initialDate.getMinutes());
      });

      it("selecting a day but dismissing with Escape instead of Done leaves the committed value unchanged", async () => {
        const user = userEvent.setup();
        render(<DateHarness fieldDef={fixture.fieldDef} initialValue={fixture.valid} />);
        const before = screen.getByTestId("value-probe").textContent;

        await user.click(screen.getByText(DATE_TIME_LABEL));
        const targetCell = findSelectableDayCell();
        await user.click(targetCell.querySelector("button")!);
        await user.keyboard("{Escape}");

        expect(screen.getByTestId("value-probe").textContent).toBe(before);
      });
    });

    describe("date field: clearing to empty", () => {
      it("KNOWN GAP — clicking the clear button never reaches field.handleChange, so the value never actually clears", async () => {
        const user = userEvent.setup();
        render(<DateHarness fieldDef={fixture.fieldDef} initialValue={fixture.valid} />);
        const before = screen.getByTestId("value-probe").textContent;
        expect(before).not.toBe("");

        await user.click(screen.getByRole("button", { name: /clear date/i }));

        // Intended: clearable is unconditionally set on DateTimePicker (Input.tsx), so
        // clicking Clear should empty the field and restore the "Pick a date" placeholder.
        // Actual: Input.tsx's handleChange wrapper is `if (date) { ...handleChange(...) }` —
        // it silently drops the clear button's `onChange(undefined)`, so the form value
        // and the rendered trigger label never change.
        expect(screen.getByTestId("value-probe").textContent).toBe("");
        expect(screen.getByText("Pick a date")).toBeInTheDocument();
      });
    });

    describe('date field: min/max bounds (JSDoc: "Validated in the input schema")', () => {
      it("KNOWN GAP — accepts a timestamp before fieldDef.min: dateFieldToInputSchema never reads field.min", () => {
        const boundary = new Date(fixture.valid).getTime();
        const fieldWithMin: DateField = {
          ...fixture.fieldDef,
          min: [
            boundary,
            `Must be on or after ${new Date(boundary).toISOString().slice(0, 10)}.`,
          ],
        };
        const belowMin = boundary - 1;

        const result = adminFieldToInputSchema({ field: fieldWithMin }).safeParse(belowMin);

        expect(result.success).toBe(false);
      });

      it("KNOWN GAP — accepts a timestamp after fieldDef.max: dateFieldToInputSchema never reads field.max", () => {
        const boundary = new Date(fixture.valid).getTime();
        const fieldWithMax: DateField = {
          ...fixture.fieldDef,
          max: [
            boundary,
            `Must be on or before ${new Date(boundary).toISOString().slice(0, 10)}.`,
          ],
        };
        const aboveMax = boundary + 1;

        const result = adminFieldToInputSchema({ field: fieldWithMax }).safeParse(aboveMax);

        expect(result.success).toBe(false);
      });

      it("KNOWN GAP — DateFieldAdmin never forwards fieldDef.min/max to the calendar, so out-of-range days are never disabled", async () => {
        const user = userEvent.setup();
        const initial = new Date(fixture.valid);
        const fieldWithMin: DateField = {
          ...fixture.fieldDef,
          min: [
            initial.getTime(),
            `Must be on or after ${new Date(initial.getTime()).toISOString().slice(0, 10)}.`,
          ],
        };
        render(<DateHarness fieldDef={fieldWithMin} initialValue={fixture.valid} />);

        await user.click(screen.getByText(DATE_TIME_LABEL));

        const dayBefore = new Date(initial);
        dayBefore.setDate(dayBefore.getDate() - 1);
        const iso = [
          dayBefore.getFullYear(),
          String(dayBefore.getMonth() + 1).padStart(2, "0"),
          String(dayBefore.getDate()).padStart(2, "0"),
        ].join("-");
        const cell = document.body.querySelector(`td[data-day="${iso}"]`);

        // Intended: DateTimePicker's own `disabled` prop (date-picker.tsx's DayPicker)
        // already disables days before `min`/after `max` when those props are supplied.
        // Actual: Input.tsx's JSX never forwards `fieldDef.min`/`fieldDef.max` to
        // <DateTimePicker> (only value/onChange/disabled/clearable/hideTime/
        // use12HourFormat/timePicker are passed), so this day is always enabled.
        expect(cell).toHaveAttribute("data-disabled");
      });
    });

    describe("date field: ADMIN_FIELDS.date.defaultValue is undefined, never 0", () => {
      it("date() resolves defaultValue to undefined when unset — unlike number()'s 0 or checkbox()'s false", () => {
        expect(date().defaultValue).toBeUndefined();
      });

      it("mounting a brand-new document (unset defaultValue) shows the 'Pick a date' placeholder, never a Jan 1 1970 date", () => {
        expect(fixture.fieldDef.defaultValue).toBeUndefined();
        render(<DateHarness fieldDef={fixture.fieldDef} initialValue={undefined} />);
        expect(screen.getByText("Pick a date")).toBeInTheDocument();
        expect(screen.queryByText(/1970/)).not.toBeInTheDocument();
      });
    });
  },
});
```

#### packages/react/src/components/fields/color/Field.test.tsx
New file (renamed from `Input.test.tsx`), full port — same mechanical substitution as
`text/Field.test.tsx` above (porting pattern):

```tsx
import { describe, expect, it, beforeAll } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { colorFieldToInputSchema, type ColorField, type CollectionConfig } from "@vexcms/core";
import { AppForm } from "../../../forms";
import { installDomPolyfills } from "../../../testing/setup";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { getControl, runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { colorFieldFixture } from "./testFixture";
import { ColorFieldAdmin } from "./Field";

// The colour picker's popover is positioned by Base UI's floating-ui
// integration, which — like cmdk's virtual list in `ui/multi-select.test.tsx`
// — expects a real layout engine. jsdom has none; install the same
// ResizeObserver/scrollIntoView stubs before opening any popover in this file.
beforeAll(() => {
  installDomPolyfills();
});

/** Mounts `ColorFieldAdmin` behind a real `useForm` + `<AppForm>`. */
function ColorHarness(props: {
  fieldDef: ColorField;
  collection: CollectionConfig;
  initialValue: string | undefined;
}) {
  const form = useForm({ defaultValues: { testField: props.initialValue } });
  return (
    <AppForm form={form}>
      <ColorFieldAdmin
        name="testField"
        fieldDef={props.fieldDef}
        collection={props.collection}
        readOnly={false}
      />
    </AppForm>
  );
}

runFieldInputContractSuite({
  fixture: colorFieldFixture,
  Component: ColorFieldAdmin,
  extra: (options) => {
    const collection = options.collection ?? testCollection;
    const label = options.fixture.fieldDef.label;

    describe("color: the plain text input accepts any notation, mirrored to the swatch", () => {
      it("accepts a hex value and reflects it as the swatch's background colour", async () => {
        const user = userEvent.setup();
        const { container } = render(
          <ColorHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.empty}
          />,
        );
        const input = getControl(container, label);
        await user.type(input, "#ff0000");
        const swatch = screen.getByRole("button", { name: `Pick a colour for ${label}` });
        // jsdom normalizes a hex colour assigned to `style.backgroundColor` to rgb().
        expect(swatch.style.backgroundColor).toBe("rgb(255, 0, 0)");
      });

      it("accepts an rgb() value verbatim as the swatch's background colour", async () => {
        const user = userEvent.setup();
        const { container } = render(
          <ColorHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.empty}
          />,
        );
        const input = getControl(container, label);
        await user.type(input, "rgb(0, 128, 0)");
        const swatch = screen.getByRole("button", { name: `Pick a colour for ${label}` });
        expect(swatch.style.backgroundColor).toBe("rgb(0, 128, 0)");
      });
    });

    describe("color: colorFieldToInputSchema — format governs the picker's writes, not what submit accepts", () => {
      it('accepts every supported notation on submit even though fieldDef.format is "hex"', () => {
        const schema = colorFieldToInputSchema({ field: options.fixture.fieldDef });
        expect(schema.safeParse("rgb(0, 128, 0)").success).toBe(true);
        expect(schema.safeParse("hsl(120, 100%, 25%)").success).toBe(true);
        expect(schema.safeParse("oklch(50% 0.2 140)").success).toBe(true);
      });

      it("rejects a shorthand/invalid hex with the field's exact real error message", () => {
        const schema = colorFieldToInputSchema({ field: options.fixture.fieldDef });
        const result = schema.safeParse("#fff");
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe("Enter a colour, e.g. #E8622A.");
        }
      });

      it("accepts an 8-digit hex value with an alpha channel", () => {
        const schema = colorFieldToInputSchema({ field: options.fixture.fieldDef });
        expect(schema.safeParse("#e8622a80").success).toBe(true);
      });

      it("rejects a var(--token) theme reference when themeColors is off (this fixture's default)", () => {
        const schema = colorFieldToInputSchema({ field: options.fixture.fieldDef });
        const result = schema.safeParse("var(--primary)");
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe("Enter a colour, e.g. #E8622A.");
        }
      });
    });

    describe("color: the swatch button opens/closes a picker with its own value-commit path", () => {
      it("opens the picker on click, revealing its own Hex sub-input", async () => {
        const user = userEvent.setup();
        render(
          <ColorHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.valid}
          />,
        );
        expect(screen.queryByLabelText("Hex")).not.toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: `Pick a colour for ${label}` }));
        expect(await screen.findByLabelText("Hex")).toBeInTheDocument();
      });

      it("closes on Escape", async () => {
        const user = userEvent.setup();
        render(
          <ColorHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.valid}
          />,
        );
        await user.click(screen.getByRole("button", { name: `Pick a colour for ${label}` }));
        await screen.findByLabelText("Hex");
        await user.keyboard("{Escape}");
        await waitFor(() => {
          expect(screen.queryByLabelText("Hex")).not.toBeInTheDocument();
        });
      });

      it("typing a full value into the picker's own Hex sub-input commits through onChange, updating the outer text input and the swatch", async () => {
        const user = userEvent.setup();
        const { container } = render(
          <ColorHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.empty}
          />,
        );
        await user.click(screen.getByRole("button", { name: `Pick a colour for ${label}` }));
        const hexBox = await screen.findByLabelText("Hex");
        // A single fireEvent.change (one native "change" event carrying the
        // final string) rather than userEvent.type — the Hex sub-input only
        // forwards onChange once ITS OWN local value is a clean 3- or
        // 6-character hex string, so typing character by character fires
        // several intermediate 3-character commits (e.g. "e86") before the
        // full 6-character value lands.
        fireEvent.change(hexBox, { target: { value: "e8622a" } });
        expect(getControl(container, label)).toHaveValue("#e8622a");
        const swatch = screen.getByRole("button", { name: `Pick a colour for ${label}` });
        expect(swatch.style.backgroundColor).toBe("rgb(232, 98, 42)");
      });
    });
  },
});
```

#### packages/react/src/components/fields/json/Field.test.tsx
New file (renamed from `Input.test.tsx`), full port — same mechanical substitution as
`text/Field.test.tsx` above (porting pattern):

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { adminFieldToInputSchema, json, type CollectionConfig, type JsonField } from "@vexcms/core";
import { AppForm } from "../../../forms";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import type { JsonEditorProps } from "../../ui/JsonEditor";
import { jsonFieldFixture } from "./testFixture";
import { JsonFieldAdmin } from "./Field";

/**
 * Stubs the CodeMirror-backed `JsonEditorView` with a plain controlled
 * textarea mirroring `JsonEditorProps`, so the shared field-input contract
 * suite (and this file's own tests) can drive it with `@testing-library/user-event`
 * the same way every other text-entry field is driven, without mounting
 * real CodeMirror in jsdom.
 */
vi.mock("../../ui/JsonEditorView", () => ({
  JsonEditorView: ({
    id,
    value,
    onChange,
    onBlur,
    readOnly,
    invalid,
    "aria-labelledby": ariaLabelledBy,
    "aria-required": ariaRequired,
    placeholder,
  }: JsonEditorProps) => (
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      readOnly={readOnly}
      aria-invalid={invalid}
      aria-labelledby={ariaLabelledBy}
      aria-required={ariaRequired}
      placeholder={placeholder}
    />
  ),
}));

/**
 * Mounts `JsonFieldAdmin` behind a real `useForm` + `<AppForm>`, wired with
 * the same real `adminFieldToInputSchema`-driven `onSubmit` validator the
 * generic factory uses internally.
 */
function JsonValidationHarness(props: {
  fieldDef: JsonField;
  collection: CollectionConfig;
  initialValue: unknown;
  readOnly?: boolean;
}) {
  const form = useForm({
    defaultValues: { testField: props.initialValue },
    validators: {
      onSubmit: ({ value }) => {
        const schema = adminFieldToInputSchema({ field: props.fieldDef });
        const result = schema.safeParse(value.testField);
        if (result.success) return undefined;
        return { fields: { testField: result.error.issues[0]?.message ?? "Invalid value" } };
      },
    },
  });
  return (
    <AppForm form={form}>
      <JsonFieldAdmin
        name="testField"
        fieldDef={props.fieldDef}
        collection={props.collection}
        readOnly={props.readOnly ?? false}
      />
      <button type="submit">Submit</button>
    </AppForm>
  );
}

runFieldInputContractSuite({
  fixture: jsonFieldFixture,
  Component: JsonFieldAdmin,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("json: parse-on-change, Format button, and read-only preview", () => {
      it("commits the parsed value with no local parse-error shown for valid typed JSON", async () => {
        const user = userEvent.setup();
        const fieldDef = json({ label: "Settings" });
        const { container } = render(
          <JsonValidationHarness fieldDef={fieldDef} collection={collection} initialValue={undefined} />,
        );

        const textarea = await screen.findByLabelText("Settings", { exact: false });
        await user.clear(textarea);
        await user.type(textarea, "true");

        expect(container.querySelectorAll(".text-destructive")).toHaveLength(1);
      });

      it("shows a local parse-error message while the typed text fails to parse", async () => {
        const user = userEvent.setup();
        const fieldDef = json({ label: "Settings" });
        const { container } = render(
          <JsonValidationHarness fieldDef={fieldDef} collection={collection} initialValue={undefined} />,
        );

        const textarea = await screen.findByLabelText("Settings", { exact: false });
        await user.clear(textarea);
        await user.type(textarea, "not valid json");

        expect(container.querySelectorAll(".text-destructive")).toHaveLength(2);
        expect(textarea).toHaveValue("not valid json");
      });

      it("leaves the committed form value unchanged while the typed text fails to parse", async () => {
        const user = userEvent.setup();
        const fieldDef = json({ label: "Settings", required: true });
        render(<JsonValidationHarness fieldDef={fieldDef} collection={collection} initialValue={42} />);

        const textarea = await screen.findByLabelText("Settings", { exact: false });
        await user.type(textarea, "not valid json");
        await user.click(screen.getByRole("button", { name: /submit/i }));

        expect(screen.queryByText("This field is required.")).not.toBeInTheDocument();
      });

      it("the Format button normalizes the current valid JSON text and commits the parsed value", async () => {
        const user = userEvent.setup();
        const fieldDef = json({ label: "Settings" });
        render(
          <JsonValidationHarness fieldDef={fieldDef} collection={collection} initialValue={undefined} />,
        );

        const textarea = (await screen.findByLabelText("Settings", {
          exact: false,
        })) as HTMLTextAreaElement;
        await user.type(textarea, "1.500");
        await user.click(screen.getByRole("button", { name: "Format" }));

        expect(textarea.value).toBe("1.5");
      });

      it("disables the Format button while the current text doesn't parse", async () => {
        const user = userEvent.setup();
        const fieldDef = json({ label: "Settings" });
        render(
          <JsonValidationHarness fieldDef={fieldDef} collection={collection} initialValue={undefined} />,
        );

        const textarea = await screen.findByLabelText("Settings", { exact: false });
        await user.type(textarea, "not valid json");

        expect(screen.getByRole("button", { name: "Format" })).toBeDisabled();
      });

      it("renders a read-only JsonEditor with the pretty-printed value instead of an editable one", async () => {
        const fieldDef = json({ label: "Settings", admin: { readOnly: true } });
        const { container } = render(
          <JsonValidationHarness
            fieldDef={fieldDef}
            collection={collection}
            initialValue={{ a: 1 }}
            readOnly
          />,
        );

        const group = (await screen.findByText("Settings")).closest('[role="group"]') as HTMLElement;
        const textarea = (await within(group).findByRole("textbox")) as HTMLTextAreaElement;
        expect(textarea).toHaveAttribute("readonly");
        expect(textarea.value).toBe(JSON.stringify({ a: 1 }, null, 2));
        expect(container.querySelector("pre")).toBeNull();
      });
    });
  },
});
```

---

### Step 13 — Admin list, container, layout and custom-widget fields [agent]
Why: decision 7; array / blocks / group / layout / relationship / upload / richtext on the app
form.
Verify: `pnpm --filter @vexcms/react test && pnpm --filter @vexcms/richtext-plate test`
- [ ] `fields/array/Field.tsx` — `ArrayFieldAdmin` + `PrimitiveArrayItemControl` + registry item render + `array.itemActions` slot (built-ins ported from `FormArray.tsx:65-119`)
- [ ] `fields/blocks/Field.tsx` — `BlocksFieldAdmin` + URL picker + permissions + clipboard actions + `cloneBlock={(block) => cloneBlockWithFreshIds(...)}`; `BlockActionsMenu.tsx` + `clipboard.ts` (ported from `FormBlocks.tsx:90-250`) → `fields/blocks/`
- [ ] `fields/group/Field.tsx` — `GroupFieldAdmin`; `FormTabs`/`FormCollapsible`/`FormRow`/`FormUI` → `fields/{tabs,collapsible,row,ui}/Field.tsx`
- [ ] `fields/relationship/`, `fields/upload/`, `fields/richtext/` — `Field.tsx` (renamed from `Input.tsx`, prop destructuring removed, exported component renamed `RelationshipFieldAdmin`/`UploadFieldAdmin`/`RichTextFieldAdmin`) + custom control files unchanged; `InputTag.tsx` → `components/ui/InputTag.tsx`
- [ ] `adapter.ts` — the six composite/custom types' `fields[...]` entries repoint `field:` from the step 12 placeholder `*Input` components to this step's `ArrayFieldAdmin`/`BlocksFieldAdmin`/`GroupFieldAdmin`/`RelationshipFieldAdmin`/`UploadFieldAdmin`/`RichTextFieldAdmin`
- [ ] `packages/richtext-plate/src/editor/PlateEditorField.tsx` confirmed on the control contract (no edit)

#### `git mv`
```
packages/react/src/components/fields/array/Input.tsx       → packages/react/src/components/fields/array/Field.tsx
packages/react/src/components/fields/array/Input.test.tsx  → packages/react/src/components/fields/array/Field.test.tsx
packages/react/src/components/fields/blocks/Input.tsx       → packages/react/src/components/fields/blocks/Field.tsx
packages/react/src/components/fields/blocks/Input.test.tsx  → packages/react/src/components/fields/blocks/Field.test.tsx
packages/react/src/components/fields/group/Input.tsx        → packages/react/src/components/fields/group/Field.tsx
packages/react/src/components/fields/group/Input.test.tsx   → packages/react/src/components/fields/group/Field.test.tsx
packages/react/src/components/fields/relationship/Input.tsx       → packages/react/src/components/fields/relationship/Field.tsx
packages/react/src/components/fields/relationship/Input.test.tsx  → packages/react/src/components/fields/relationship/Field.test.tsx
packages/react/src/components/fields/upload/Input.tsx       → packages/react/src/components/fields/upload/Field.tsx
packages/react/src/components/fields/upload/Input.test.tsx  → packages/react/src/components/fields/upload/Field.test.tsx
packages/react/src/components/fields/richtext/Input.tsx       → packages/react/src/components/fields/richtext/Field.tsx
packages/react/src/components/fields/richtext/Input.test.tsx  → packages/react/src/components/fields/richtext/Field.test.tsx
packages/react/src/components/form/BlockActionsMenu.tsx       → packages/react/src/components/fields/blocks/BlockActionsMenu.tsx
packages/react/src/components/form/BlockActionsMenu.test.tsx  → packages/react/src/components/fields/blocks/BlockActionsMenu.test.tsx
packages/react/src/components/form/FormTabs.tsx       → packages/react/src/components/fields/tabs/Field.tsx
packages/react/src/components/form/FormTabs.test.tsx  → packages/react/src/components/fields/tabs/Field.test.tsx
packages/react/src/components/form/FormCollapsible.tsx       → packages/react/src/components/fields/collapsible/Field.tsx
packages/react/src/components/form/FormCollapsible.test.tsx  → packages/react/src/components/fields/collapsible/Field.test.tsx
packages/react/src/components/form/FormRow.tsx       → packages/react/src/components/fields/row/Field.tsx
packages/react/src/components/form/FormRow.test.tsx  → packages/react/src/components/fields/row/Field.test.tsx
packages/react/src/components/form/FormUI.tsx       → packages/react/src/components/fields/ui/Field.tsx
packages/react/src/components/form/FormUI.test.tsx  → packages/react/src/components/fields/ui/Field.test.tsx
packages/react/src/components/form/InputTag.tsx → packages/react/src/components/ui/InputTag.tsx
```

#### packages/react/src/components/fields/array/Field.tsx
New file (renamed from `Input.tsx`). Maps `fieldDef` and the registry (`fieldToFieldComponent`,
for rendering each item's child fields via `RenderFields`) onto the app form's `ArrayField`
(`renderItem`, `itemActions`):

```tsx
"use client";

import type { ArrayField as ArrayFieldDef, ArrayType } from "@vexcms/core";
import { BUILTIN_CONTRIBUTION_IDS, SLOT_IDS, isObjectShapedArrayItem } from "@vexcms/core";
import type { ComponentContributionInput, FieldComponentProps } from "@vexcms/core";
import { ArrayField } from "../../../forms";
import { ArrowDownIcon, ArrowUpIcon, CopyIcon, TrashIcon } from "lucide-react";
import type { ReactHKT } from "../../../adapter";
import { SlotOutlet } from "../../slots/SlotOutlet";
import { SurfacedAction, type ActionPlacement } from "../../forms/ActionsMenu";
import { RenderFields } from "../RenderFields";
import { fieldToFieldComponent } from "../registry";

/**
 * Props the `array.item.actions` slot's contributed component receives —
 * unchanged from `FormArray.tsx`'s own `ArrayItemActionsProps`.
 */
export interface ArrayItemActionsProps {
  itemIndex: number;
  itemCount: number;
  readOnly: boolean;
  atMax: boolean;
  itemLabel: string;
  /** The surface this render is for — the slot renders once per surface. */
  placement: ActionPlacement;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

/**
 * Built-in `array.item.actions` contributions — duplicate, move up/down,
 * remove — each rendered through `SurfacedAction`. Ported verbatim from
 * `FormArray.tsx:65-119`.
 */
const builtinItemActions: ComponentContributionInput<ReactHKT, ArrayItemActionsProps>[] = [
  {
    id: BUILTIN_CONTRIBUTION_IDS.array.duplicate,
    component: (p) => (
      <SurfacedAction
        placement={p.placement}
        icon={<CopyIcon className="size-4" />}
        label="Duplicate"
        ariaLabel={`Duplicate item ${p.itemIndex + 1} from ${p.itemLabel}`}
        disabled={p.readOnly || p.atMax}
        onClick={p.onDuplicate}
      />
    ),
  },
  {
    id: BUILTIN_CONTRIBUTION_IDS.array.moveUp,
    component: (p) => (
      <SurfacedAction
        placement={p.placement}
        icon={<ArrowUpIcon className="size-4" />}
        label="Move up"
        ariaLabel={`Move item ${p.itemIndex + 1} up`}
        disabled={p.readOnly || p.itemIndex === 0}
        onClick={p.onMoveUp}
      />
    ),
  },
  {
    id: BUILTIN_CONTRIBUTION_IDS.array.moveDown,
    component: (p) => (
      <SurfacedAction
        placement={p.placement}
        icon={<ArrowDownIcon className="size-4" />}
        label="Move down"
        ariaLabel={`Move item ${p.itemIndex + 1} down`}
        disabled={p.readOnly || p.itemIndex === p.itemCount - 1}
        onClick={p.onMoveDown}
      />
    ),
  },
  {
    id: BUILTIN_CONTRIBUTION_IDS.array.remove,
    component: (p) => (
      <SurfacedAction
        placement={p.placement}
        icon={<TrashIcon className="size-4" />}
        label="Remove"
        ariaLabel={`Remove item ${p.itemIndex + 1} from ${p.itemLabel}`}
        disabled={p.readOnly}
        onClick={p.onRemove}
        destructive
      />
    ),
  },
];

/**
 * Renders a scalar (non-object) array item's own admin field, resolved from
 * the registry the same way a top-level leaf field is — the item type's
 * `*FieldAdmin` component mounted against the item's own `name` path, with
 * no `fieldset`/label chrome of its own (the enclosing `ArrayField` row
 * already supplies drag handle, index and item actions).
 *
 * @param props - The item's form path (`name`), its field definition, and
 *   whether the array (and therefore the item) is read-only.
 * @returns The item type's admin field, mounted at `name`.
 */
function PrimitiveArrayItemControl(props: {
  name: string;
  itemType: ArrayFieldDef<any, ArrayType>["items"];
  readOnly: boolean;
}) {
  const ItemFieldAdmin = fieldToFieldComponent(props.itemType.type);
  if (!ItemFieldAdmin) {
    throw new Error("invalid array.items field type set");
  }
  return <ItemFieldAdmin name={props.name} fieldDef={props.itemType} readOnly={props.readOnly} />;
}

/**
 * Array admin field — maps `fieldDef` to the app form's `ArrayField`: item
 * labels, `renderItem` (each item's child fields via `RenderFields`,
 * unwrapped for a primitive item type, grouped for an object-shaped one via
 * `isObjectShapedArrayItem`), and the `array.item.actions` slot (built-ins +
 * project contributions via `SlotOutlet`).
 *
 * @param props - {@link FieldComponentProps} narrowed to `ArrayField`.
 * @returns The app form's `ArrayField`, configured for this field instance.
 */
export function ArrayFieldAdmin(props: FieldComponentProps<{}, ArrayFieldDef<any, ArrayType>>) {
  return (
    <ArrayField
      name={props.name}
      label={props.fieldDef.label || props.name}
      description={props.fieldDef.description}
      max={props.fieldDef.max}
      readOnly={props.readOnly || props.fieldDef.admin.readOnly}
      renderItem={({ name: itemName, item, index }) =>
        isObjectShapedArrayItem(props.fieldDef.items) ? (
          <RenderFields
            fields={props.fieldDef.items.fields}
            namePrefix={itemName}
            readOnly={props.readOnly}
          />
        ) : (
          <PrimitiveArrayItemControl
            name={itemName}
            itemType={props.fieldDef.items}
            readOnly={props.readOnly}
          />
        )
      }
      itemActions={(item) => (
        <SlotOutlet
          slotId={SLOT_IDS.array.itemActions}
          builtin={builtinItemActions}
          contributions={props.fieldDef.admin.components.contributions?.[SLOT_IDS.array.itemActions]}
          props={item}
        />
      )}
    />
  );
}
```

> `isObjectShapedArrayItem`/`withArrayItemId`/`arrayItemLabel`/`arrayPluralLabel` are core
> utilities already imported from `@vexcms/core` — unchanged by this move; `withArrayItemId`,
> `getStoredItemId`, add/duplicate/remove/move/reorder and `atMax` now live in the app form's
> `useArrayItems`/`ArrayField` (step 10), not here — this file only supplies `renderItem` and
> `itemActions`.

#### packages/react/src/components/fields/blocks/Field.tsx
New file (renamed from `Input.tsx`). Maps `fieldDef.blocks` to the app form's `blockTypes`, binds
the picker to the `MODALS.editBlocks` URL param (unchanged from `blocks/Input.tsx:7-8,29-36`),
fills `headerActions`/`itemActions` from `fields/blocks/BlockActionsMenu.tsx` (moved in this
step) plus the clipboard built-ins, and wires `cloneBlock` (decision 16) to core's
`cloneBlockWithFreshIds`:

```tsx
"use client";

import type { BlocksField as BlocksFieldDef, GenericBlock } from "@vexcms/core";
import { cloneBlockWithFreshIds, SLOT_IDS } from "@vexcms/core";
import type { FieldComponentProps } from "@vexcms/core";
import { BlocksField } from "../../../forms";
import { parseAsString, useQueryState } from "nuqs";
import { MODALS } from "../../modals";
import { RenderFields } from "../RenderFields";
import { SlotOutlet } from "../../slots/SlotOutlet";
import { BlockActionsMenu, builtinItemActions } from "./BlockActionsMenu";
import { builtinHeaderActions, resolvePasteCandidates, toastPasteOutcome } from "./clipboard";

/**
 * Blocks admin field — maps `fieldDef` to the app form's `BlocksField`:
 * URL-held picker state (`MODALS.editBlocks`), `blockTypes` from
 * `fieldDef.blocks`, `renderBlock` (each block's fields via `RenderFields`),
 * `cloneBlock` for the app form's built-in Duplicate action (decision 16),
 * and the `blocks.header.actions`/`blocks.item.actions` slots (built-ins
 * including the block clipboard, plus project contributions).
 *
 * @param props - {@link FieldComponentProps} narrowed to `BlocksField`.
 * @returns The app form's `BlocksField`, configured for this field instance.
 */
export function BlocksFieldAdmin(props: FieldComponentProps<{}, BlocksFieldDef>) {
  const [activeField, setActiveField] = useQueryState(MODALS.editBlocks.urlParam, parseAsString);
  const blockDefMap = new Map(props.fieldDef.blocks.map((blockDef) => [blockDef.blockType, blockDef]));
  return (
    <BlocksField
      name={props.name}
      label={props.fieldDef.label || props.name}
      description={props.fieldDef.description}
      max={props.fieldDef.max}
      readOnly={props.readOnly || props.fieldDef.admin.readOnly}
      blockTypes={props.fieldDef.blocks}
      picker={{
        open: activeField === props.name,
        onOpenChange: (open) => setActiveField(open ? props.name : null),
      }}
      cloneBlock={(block: GenericBlock) =>
        cloneBlockWithFreshIds({ block, blockDef: blockDefMap.get(block.blockType)! })
      }
      renderBlock={({ name: blockName, block }) => (
        <RenderFields fields={block.fields} namePrefix={blockName} readOnly={props.readOnly} />
      )}
      headerActions={(ctx) => (
        <SlotOutlet
          slotId={SLOT_IDS.blocks.headerActions}
          builtin={builtinHeaderActions}
          props={ctx}
        />
      )}
      itemActions={(item) => (
        <SlotOutlet
          slotId={SLOT_IDS.blocks.itemActions}
          builtin={builtinItemActions}
          props={item}
        />
      )}
    />
  );
}

export { resolvePasteCandidates, toastPasteOutcome };
```

#### packages/react/src/components/fields/blocks/BlockActionsMenu.tsx
Moved from `components/form/BlockActionsMenu.tsx`, unchanged — `BlockActionsMenuProps`,
`BlockItemActionProps`, `builtinItemActions`, `SURFACED_BLOCK_ACTION_IDS`, `BlockActionsMenu`
itself. 1 relative-import edit: `./FormCompactContext` → `../../forms/FormCompactContext`
(`useCompactForm`, one level deeper).

#### packages/react/src/components/fields/blocks/clipboard.ts
New file — extracted verbatim out of `FormBlocks.tsx:90-250` (the module deleted in step 14).
Pure functions/data, no React state — `FormBlocks.tsx`'s own accordion/dialog rendering
(`BlockPickerDialog`, `BlockAccordionItem`) does not move here; that mechanics lives in the app
form's `BlocksField` (step 10):

```ts
import { toast } from "sonner";
import type { BlockConfig, ComponentContributionInput, GenericBlock } from "@vexcms/core";
import { BUILTIN_CONTRIBUTION_IDS, cloneBlockWithFreshIds, coerceBlockToDefinition } from "@vexcms/core";
import { ClipboardCopyIcon, ClipboardPasteIcon, ReplaceAllIcon } from "lucide-react";
import type { ReactHKT } from "../../../adapter";
import { HeaderAction, type ActionPlacement } from "../../forms/ActionsMenu";

/**
 * Computes which block IDs should start open in the accordion. A block
 * starts closed when the field's own `admin.defaultCollapsed` is true, OR
 * when that specific block type's `admin.defaultCollapsed` is true.
 */
export function computeDefaultOpenBlocks(props: {
  items: GenericBlock[];
  fieldDefaultCollapsed: boolean;
  blockDefMap: Map<string, BlockConfig>;
}): string[] {
  if (props.fieldDefaultCollapsed) return [];
  return props.items
    .filter((item) => !props.blockDefMap.get(item.blockType as string)?.admin?.defaultCollapsed)
    .map((item) => item.id as string);
}

/**
 * Matches clipboard blocks against the target field's block definitions by
 * `blockType`. Unknown `blockType`s are skipped; known blocks are coerced to
 * the target definition (unknown keys dropped, missing keys defaulted) and
 * get fresh ids (nested blocks too) so pasting never collides with an
 * existing item's id — including re-pasting into the field it was copied
 * from.
 */
export function resolvePasteCandidates(props: {
  blocks: GenericBlock[];
  blockDefMap: Map<string, BlockConfig>;
}): { accepted: GenericBlock[]; skipped: number; droppedKeys: number } {
  let skipped = 0;
  let droppedKeys = 0;
  const accepted: GenericBlock[] = [];
  for (const block of props.blocks) {
    const blockDef = props.blockDefMap.get(block.blockType as string);
    if (!blockDef) {
      skipped += 1;
      continue;
    }
    const coerced = coerceBlockToDefinition({ block, blockDef });
    droppedKeys += coerced.droppedKeys.length;
    accepted.push(cloneBlockWithFreshIds({ block: coerced.block, blockDef }));
  }
  return { accepted, skipped, droppedKeys };
}

/**
 * Summarizes a paste outcome as a single toast — accepted count, plus how
 * many clipboard blocks were skipped (unsupported `blockType`) and how many
 * fields were dropped off the accepted blocks (not part of the target
 * block's definition).
 */
export function toastPasteOutcome(props: { acceptedCount: number; skipped: number; droppedKeys: number }): void {
  if (props.acceptedCount === 0) {
    toast.error("Nothing in the clipboard matches this field's block types.");
    return;
  }
  const parts = [`Pasted ${props.acceptedCount} block${props.acceptedCount === 1 ? "" : "s"}.`];
  if (props.skipped > 0) {
    parts.push(`Skipped ${props.skipped} unsupported block${props.skipped === 1 ? "" : "s"}.`);
  }
  if (props.droppedKeys > 0) {
    parts.push(`Dropped ${props.droppedKeys} field${props.droppedKeys === 1 ? "" : "s"} not in this block's definition.`);
  }
  toast(parts.join(" "));
}

/**
 * Header-row width (px) from which the blocks field's header actions render
 * inline beside its label instead of in a ⋯ menu — room for the label and
 * count plus five text buttons.
 */
export const BLOCKS_HEADER_INLINE_MIN_PX = 640;

/** Props passed to every `blocks.header.actions` contribution. */
export interface BlocksHeaderActionsProps {
  itemCount: number;
  canCopyAll: boolean;
  canPaste: boolean;
  canReplaceAll: boolean;
  pasteCount: number;
  singular: string;
  plural: string;
  placement: ActionPlacement;
  onCopyAll: () => void;
  onPasteAppend: () => void;
  onReplaceAllRequest: () => void;
}

/**
 * Built-in `blocks.header.actions` contributions — Copy all, Paste
 * (append), Replace all. Ported verbatim from `FormBlocks.tsx:213-250`.
 */
export const builtinHeaderActions: ComponentContributionInput<ReactHKT, BlocksHeaderActionsProps>[] = [
  {
    id: BUILTIN_CONTRIBUTION_IDS.blocksHeader.copyAll,
    component: (p) => (
      <HeaderAction
        placement={p.placement}
        icon={<ClipboardCopyIcon className="size-4" />}
        label="Copy all"
        disabled={!p.canCopyAll}
        onClick={p.onCopyAll}
      />
    ),
  },
  {
    id: BUILTIN_CONTRIBUTION_IDS.blocksHeader.pasteAppend,
    component: (p) => (
      <HeaderAction
        placement={p.placement}
        icon={<ClipboardPasteIcon className="size-4" />}
        label="Paste"
        disabled={!p.canPaste}
        onClick={p.onPasteAppend}
      />
    ),
  },
  {
    id: BUILTIN_CONTRIBUTION_IDS.blocksHeader.replaceAll,
    component: (p) => (
      <HeaderAction
        placement={p.placement}
        icon={<ReplaceAllIcon className="size-4" />}
        label="Replace all"
        disabled={!p.canReplaceAll}
        onClick={p.onReplaceAllRequest}
      />
    ),
  },
];
```

#### packages/react/src/components/fields/group/Field.tsx
New file (renamed from `Input.tsx`). Maps `fieldDef.fields` onto the app form's `GroupField`,
which only supplies the fieldset layout — the group's own child fields render through
`RenderFields`:

```tsx
"use client";

import type { GroupField as GroupFieldDef } from "@vexcms/core";
import { GroupField } from "../../../forms";
import type { FieldComponentProps } from "@vexcms/core";
import { RenderFields } from "../RenderFields";

/**
 * Group admin field — maps `fieldDef` to the app form's `GroupField`
 * fieldset layout, rendering the group's own fields through `RenderFields`
 * as `children`.
 *
 * @param props - {@link FieldComponentProps} narrowed to `GroupField`.
 * @returns The app form's `GroupField`, wrapping this group's rendered child fields.
 */
export function GroupFieldAdmin(props: FieldComponentProps<{}, GroupFieldDef>) {
  return (
    <GroupField label={props.fieldDef.label || props.name} description={props.fieldDef.description}>
      <RenderFields fields={props.fieldDef.fields} namePrefix={props.name} readOnly={props.readOnly} />
    </GroupField>
  );
}
```

`ArrayItemHeaderContext`/`FormCompactContext`/`FormCompactProvider`/`useCompactForm` now live in
`packages/react/src/forms/` (step 10) — `GroupFieldAdmin`'s own rendering does not read them
directly; a group nested inside an array item's accordion header still gets its drag
handle/actions from the enclosing `ArrayFieldAdmin`'s item chrome, unchanged plumbing.

#### packages/react/src/components/fields/tabs/Field.tsx
New file (renamed/moved from `components/form/FormTabs.tsx`). Layout renderer, not a data
field — reads `RenderFieldsContext` from `../RenderFields` (moved path), `useFieldErrorCounts`/
`useFailedSubmitAttempt` (`"../../hooks/useFieldErrorCount"` → `"../../forms/useFieldErrorCount"`,
step 12's consolidation — this file's own import was already repointed to `"../forms/
useFieldErrorCount"` in step 12, one level shallower, from its old `components/form/` location;
moving into `components/fields/tabs/` in this step goes one level deeper again, back to
`"../../forms/useFieldErrorCount"`), `useFieldSetsVisible`
(`../../hooks/useFieldCondition`, unchanged). Body otherwise identical to `FormTabs.tsx` — tab
strip with error-count badges, `tabErrorNames`, `nuqs`-held active-tab URL state. 1 edit beyond
import paths: no prop destructuring — the function signature and body read `props.x` throughout
(props were already not an app-form field's `props`, but this file's own component-props object;
P-028 applies to it too since it lives under `components/fields/`).

#### packages/react/src/components/fields/collapsible/Field.tsx
New file (renamed/moved from `components/form/FormCollapsible.tsx`), same relative-import
updates and no-destructuring edit as `tabs/Field.tsx`, body otherwise unchanged — accordion
section, error-count badge while collapsed, `field.admin.defaultCollapsed` default.

#### packages/react/src/components/fields/row/Field.tsx
New file (renamed/moved from `components/form/FormRow.tsx`), same no-destructuring edit,
otherwise unchanged beyond import paths — `resolveRowWidths` flex-wrap sub-row.

#### packages/react/src/components/fields/ui/Field.tsx
New file (renamed/moved from `components/form/FormUI.tsx`). 2 edits beyond the move: (1) no
prop destructuring; (2) reads the app form's `useFormContext()` (via `useVexForm`, step 12)
instead of the deleted `AppFormContext`'s `useAppForm` import — `FormUI.tsx:6`
(`import { useAppForm } from "./AppFormContext"`) becomes
`import { useVexForm } from "../../../hooks/useVexForm"`, and the body's
`const form = useAppForm();` becomes `const form = useVexForm();` (same `useStore(form.store, …)`
call after). This file renders a `ui()` field's own mandatory `admin.components.Field` (the
per-field custom component from `fields/ui/ui/types.ts` — see step 11's note) — unrelated to this
spec's new `admin.components.Field` override chain; no collision, both are named `Field` in
different places for different reasons.

#### packages/react/src/components/fields/relationship/Field.tsx
New file (renamed from `Input.tsx`, prop destructuring removed from the signature and body —
`props.name`/`props.fieldDef`/`props.field`/`props.readOnly`/`props.documentStatus` replace the
destructured `{ name, readOnly, fieldDef, field, index, submissionAttempts, documentStatus }`).
The picker/URL-state wiring (`MODALS.relationshipPicker`, `activeField === props.name`, `drafts`
visibility from `documentStatus`) stays admin-side, unchanged logic from `relationship/Input.tsx:
39-192` — this field has no single-control app-form leaf (it is a picker + chip list), so it
renders its own `role="group"` layout directly rather than going through `FormFieldLayout`, same
as today. `EmptyInput.tsx`/`FilledInput.tsx` stay as this field's custom control files (decision
6 — a custom-widget field keeps control files beside `Field.tsx`), unchanged bodies, only
re-exported from `Field.tsx` instead of the deleted `Input.tsx`; the exported function itself
renames `RelationshipFieldInput` → `RelationshipFieldAdmin`, matching decision 17 (admin field
components named `<Type>FieldAdmin`). `FormDescription`/`FormError`
imports (`relationship/Input.tsx:12-13`) are replaced with `FieldDescription`/`FieldError` from
`components/ui/field.tsx` (`../../ui/field`) and `isFieldShowingError` from `forms/FormFieldLayout`
(`../../../form`) — the same shared primitives `FormFieldLayout` itself is built on — rather than
duplicating their markup inline; no new JSX is authored here.

#### packages/react/src/components/fields/upload/Field.tsx
New file (renamed from `Input.tsx`), same destructuring removal and the same
`FieldDescription`/`FieldError`/`isFieldShowingError` swap as `relationship/Field.tsx` (same
reasoning — custom `role="group"` layout, no single control), otherwise unchanged
body/structure from `upload/Input.tsx` — `EmptyInput.tsx`/`FilledInput.tsx` stay as custom
control files for the same reason as `relationship`; exported function renames
`UploadFieldInput` → `UploadFieldAdmin`.

#### packages/react/src/components/fields/richtext/Field.tsx
New file (renamed from `Input.tsx`), same destructuring removal and the same
`FieldDescription`/`FieldError`/`isFieldShowingError` swap, otherwise unchanged body/structure —
reads `useVexConfig().editor.editorComponent` and renders it with the same prop set
`richtext/Input.tsx` already builds (`mediaCollectionSlug`, `mediaResults`,
`mediaSearchTerm`/`onMediaSearchChange`, pagination, upload handlers). No app-form leaf field
applies here either (custom editor widget, same reasoning as `relationship`/`upload`); exported
function renames `RichTextFieldInput` → `RichTextFieldAdmin`.

#### packages/richtext-plate/src/editor/PlateEditorField.tsx
No prop-shape change — `VexEditorComponentProps` (the contract `richtext/Field.tsx` already calls
`EditorComponent` against) is unchanged by this spec; `value`/`onChange`/`readOnly` already match
the shape `FieldControlProps` generalizes for leaf app-form fields. This step's only obligation
("on the control contract") is confirming `PlateEditorField`'s props still line up after
`richtext/Field.tsx`'s move — no edit needed; verified by `pnpm --filter @vexcms/richtext-plate
test` passing unchanged.

#### packages/react/src/components/ui/InputTag.tsx
Moved from `components/form/InputTag.tsx`, unchanged (`Button variant="outline" disabled` tag) —
`upload/FilledInput.tsx`'s "ALT" badge import path updates one level.

**Resolved (P-023):** `relationship/Input.tsx` and `upload/Input.tsx` currently import
`FormDescription`/`FormError` from `components/form/` (`relationship/Input.tsx:12-13`,
`upload/Input.tsx:5-6`) for their custom `role="group"` layout — the prior spec.md draft did not
account for these two imports disappearing when `components/form/FormDescription.tsx` and
`FormError.tsx` are deleted in step 14. Resolved above by pointing all three
(`relationship/Field.tsx`, `upload/Field.tsx`, `richtext/Field.tsx`) at the shared
`FieldDescription`/`FieldError` primitives (`components/ui/field.tsx`) and `isFieldShowingError`
(`forms/FormFieldLayout`) instead — no component is duplicated, nothing new to delete in step 14.

#### packages/react/src/components/fields/index.tsx
1 edit — every `export * from "./<type>"` stays (already re-exports each type's `index.ts`, which
now re-exports `Field.tsx`); `fieldToInputComponent`/`fieldToCellComponent` re-export becomes
`fieldToFieldComponent`/`fieldToCellComponent` (step 12's rename).

#### packages/react/src/adapter.ts
1 edit — the six composite/custom types' `fields[...]` entries (step 12 pointed `field:` at the
existing `*Input` components so the adapter's `FieldComponentMap` type-checked on its own) now
repoint `field:` at this step's renamed `*FieldAdmin` exports; import header's
`RelationshipFieldInput, ArrayFieldInput, GroupFieldInput, BlocksFieldInput, UploadFieldInput,
RichTextFieldInput` renamed `RelationshipFieldAdmin, ArrayFieldAdmin, GroupFieldAdmin,
BlocksFieldAdmin, UploadFieldAdmin, RichTextFieldAdmin`.

```ts
  [ADMIN_FIELDS.relationship.type]: {
    field: RelationshipFieldAdmin,
    cell: RelationshipFieldCell,
  },
  [ADMIN_FIELDS.array.type]: {
    field: ArrayFieldAdmin,
    cell: ArrayFieldCell,
  },
  [ADMIN_FIELDS.group.type]: {
    field: GroupFieldAdmin,
    cell: GroupFieldCell,
  },
  [ADMIN_FIELDS.blocks.type]: {
    field: BlocksFieldAdmin,
    cell: BlocksFieldCell,
  },
  [ADMIN_FIELDS.upload.type]: {
    field: UploadFieldAdmin,
    cell: UploadFieldCell,
  },
  [ADMIN_FIELDS.richtext.type]: {
    field: RichTextFieldAdmin,
    cell: RichTextFieldCell,
  },
```

---

### Step 14 — Remove the old form layer; public exports [agent]
Why: clean cutover — no `createFieldInput` path beside the new one.
Verify: `pnpm typecheck && pnpm test && node scripts/export-names.mjs --check`
- [ ] delete ALL of `components/form/`, with no exceptions — `AppForm.tsx`, `changedValues.ts` and `index.ts` included, since both components already moved to `forms/` (steps 8/10) and every admin importer already repoints to `../../form` / `../form` (steps 8/10/12/13); also `createFieldInput`, `AppFormContext`, `FormLabel`, `FormError`, `FormDescription`, `FormArray`, `FormBlocks`, `FormGroup`, `FormTabs`, `FormCollapsible`, `FormRow`, `FormUI`, `BlockActionsMenu`, `InputTag`, `ActionsMenu`, `FormCompactContext`, `ArrayItemHeaderContext`, `RenderFields`, `FieldConditionGate`, `DocumentTimestamps`, `FieldController` + every colocated test — each already moved by step 8/10/12/13, verify each one is moved or superseded before deleting its original
- [ ] `InputComponentProps` removed from core; `testing/fieldInputContract.ts` runs against `Field.tsx`
- [ ] `DocumentTimestamps.tsx` → `components/views/`; `packages/react/src/components/form/` directory no longer exists
- [ ] `packages/react/src/index.ts` exports: `*FieldInput` renamed `*FieldAdmin` for every admin field component; changeset: react form API + `@vexcms/react/form`
- [ ] JSDoc examples, `apps/docs` guides (`admin-customization.mdx`) on the new override contracts

#### Deletions — `packages/react/src/components/form/`
Delete, with their colocated tests. Every file below has already been moved (not copied) by an
earlier step; this deletion list exists so the implementer can verify each original is gone
rather than silently duplicated:

| File | Moved to (step) | Reason the original is gone, not kept |
|---|---|---|
| `createFieldInput.tsx` | superseded (steps 8–12) | no standalone test file exists; superseded by `useFieldContext`/`useAppForm` |
| `AppFormContext.ts` | `forms/formContext.ts` (step 8) | `AnyFormApi` moves there |
| `FormLabel.tsx` | superseded (step 8) | `FormFieldLayout` now renders the label; `HideFieldLabelContext` (only consumer was `FormArray.tsx`'s plain-item rows) has no replacement consumer — deleted rather than moved |
| `FormError.tsx` | superseded (step 8) | `isFieldShowingError` now lives in `FormFieldLayout.tsx` |
| `FormDescription.tsx` | superseded (step 8) | `FormFieldLayout`'s `description` prop |
| `FormArray.tsx` + `.test.tsx` | `forms/ArrayField.tsx` (step 10) + `fields/array/Field.tsx` (step 13) | `builtinItemActions`/`ArrayItemActionsProps` already moved to `fields/array/Field.tsx` |
| `FormBlocks.tsx` + `.test.tsx` | `forms/BlocksField.tsx` (step 10) + `fields/blocks/{Field,clipboard}.ts` (step 13) | — |
| `FormGroup.tsx` + `.test.tsx` | `forms/GroupField.tsx` (step 10) + `fields/group/Field.tsx` (step 13) | — |
| `FormTabs.tsx` + `.test.tsx` | `fields/tabs/Field.tsx` (step 13) | `git mv` in step 13 already removes the original |
| `FormCollapsible.tsx` + `.test.tsx` | `fields/collapsible/Field.tsx` (step 13) | same |
| `FormRow.tsx` + `.test.tsx` | `fields/row/Field.tsx` (step 13) | same |
| `FormUI.tsx` + `.test.tsx` | `fields/ui/Field.tsx` (step 13) | same |
| `BlockActionsMenu.tsx` + `.test.tsx` | `fields/blocks/BlockActionsMenu.tsx` (step 13) | same |
| `InputTag.tsx` | `components/ui/InputTag.tsx` (step 13) | same |
| `ActionsMenu.tsx` | `components/ui/ActionsMenu.tsx` (step 10 — spec-tasks.md) | same |
| `FormCompactContext.tsx` | `forms/FormCompactContext.tsx` (step 10) | same |
| `ArrayItemHeaderContext.ts` | `forms/ArrayItemHeaderContext.ts` (step 10) | same |
| `RenderFields.tsx` + `.test.tsx` | `fields/RenderFields.tsx` (step 12) | same |
| `FieldConditionGate.tsx` | `fields/FieldConditionGate.tsx` (step 12) | same |
| `DocumentTimestamps.tsx` | `components/views/DocumentTimestamps.tsx` (this step) | — |
| `FieldController.tsx` | deleted, no replacement | no internal consumer (launch-plan § K note); kept working but unreferenced until now — dead code, deleted with the rest of the directory rather than kept pending pass-2 |
| `AppForm.tsx` | `forms/AppForm.tsx` (step 8, ported) | old copy retained only for the admin form's own imports until this step's cutover; now unreferenced |
| `changedValues.ts` | `forms/changedValues.ts` (step 8, `git mv`) | already physically moved; row kept here for completeness |
| `index.ts` | no replacement — package-internal barrel, not re-created | `forms/index.ts` (step 8) is the only barrel admin code imports through now |

Every file in the table above is confirmed moved, superseded, or (for `FieldController.tsx`)
dead and safe to delete outright — `packages/react/src/components/form/` does not exist after
this step; nothing in the package re-creates it.

Every `components/fields/<type>/Input.tsx` and `Input.test.tsx` from steps 12–13 is already gone
(renamed `Field.tsx`/`Field.test.tsx` in place) — nothing left to delete there.

#### packages/core/src/fields/types.ts
`InputComponentProps` removed — `FieldComponentProps` (step 11) inlines its fields directly
instead of `extends InputComponentProps`:

```ts
export interface FieldComponentProps<
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
  TField extends AdminField<TFieldMeta> = AdminField<TFieldMeta>,
> {
  name: string;
  fieldDef: TField;
  readOnly: boolean;
  index?: number;
  collection: CollectionConfig | GlobalConfig;
  documentStatus?: VexVersionStatus;
  renderDefault: ComponentType<FieldComponentProps<TFieldMeta, TField>>;
}
```

Every remaining reference to `InputComponentProps` in core (`CellComponentProps`'s own doc
comment's `@see` at `packages/core/src/fields/types.ts:202`) is updated to `FieldComponentProps`
as part of this deletion. A repo-wide grep for `InputComponentProps` confirms no per-type
`types.ts` file imports it directly — this is a doc-comment-only sweep; a residual non-doc-comment
usage found at implementation time blocks the typecheck gate and must be converted to
`FieldComponentProps` before this step is considered done.

#### packages/react/src/testing/fieldInputContract.ts
Rewritten to mount each field's `Field.tsx` (`fieldToFieldComponent`) inside a bare
`useAppForm()`-created form rather than `createFieldInput`'s TanStack-`useForm` + `AppFormContext`
pair. `AppFormBoundary` (`:116-119`, `AppForm as unknown as ComponentType<{...}>`) narrows to the
app form's `formContext.ts` provider; `renderField`'s mount helper (`:474-565`) swaps its
`createFieldInput`-era field-registration for `useAppForm`'s `fieldComponents` map.
`getControl`/`getLabelNode`/`expectControlValue`/`hasInertSignal`/`setControlValue`/
`attemptEdit`/`waitForStableRender`/`isPopoverTriggerControl`/`isContentEditableControl`
(`:233-459`) are DOM-level assertions independent of which component rendered the DOM —
unchanged. `stubEditorAdapter`/`StubRichTextEditor`/`stubClientConfig` (`:137-187`) unchanged —
the editor contract (`VexEditorComponentProps`) does not change in this spec (step 13's finding).
`runFieldInputContractSuite`'s public options (`FieldInputContractOptions`, `:53-85`) keep the
same shape consumers (`text/Field.test.tsx` etc., step 12) already pass. The file itself is not
renamed in this step — renaming `fieldInputContract.ts` (the `Input` in its name is now stale,
same `react-field-module` naming concern step 20 covers for other files) is listed as a pass-2
finding, not fixed here, so the file set this step touches stays scoped to its body.

#### packages/react/src/components/views/DocumentTimestamps.tsx
Moved from `components/form/DocumentTimestamps.tsx`, unchanged (`formatDateFieldValue` import
path updates one level: `../fields/date/utils` → `../../fields/date/utils`).

#### packages/react/src/components/form/index.ts — deleted
Deleted along with the rest of the directory (see the deletions table above); not rewritten to a
smaller barrel. `AppForm` and `changedValues` are already exported from `forms/index.ts`
(`AppForm`) and imported by their own relative `../form`/`../../form` paths (`changedValues` is
deliberately not re-exported from `forms/index.ts` — step 8) — no code imports
`components/form` after this step.

#### packages/react/src/index.ts
Edits beyond the field-component re-export list (`:106-107`, now importing from
`./components/fields` with the renamed admin components — `TextFieldAdmin` etc. — rather than
`TextFieldInput` etc.; decision 17 settles the public export name as `*FieldAdmin`, matching the
`*FieldCell` pairing — not a pass-2 question):

1. `:106` `export { TextFieldInput, TextFieldCell, EmailFieldInput, EmailFieldCell, TextareaFieldInput, TextareaFieldCell } from "./components/fields";` becomes:
```ts
export { TextFieldAdmin, TextFieldCell, EmailFieldAdmin, EmailFieldCell, TextareaFieldAdmin, TextareaFieldCell } from "./components/fields";
```
2. `:107` `export { JsonFieldInput, JsonFieldCell } from "./components/fields";` becomes:
```ts
export { JsonFieldAdmin, JsonFieldCell, UrlFieldAdmin, UrlFieldCell, NumberFieldAdmin, NumberFieldCell, CheckboxFieldAdmin, CheckboxFieldCell, SelectFieldAdmin, SelectFieldCell, DateFieldAdmin, DateFieldCell, ColorFieldAdmin, ColorFieldCell, ArrayFieldAdmin, ArrayFieldCell, BlocksFieldAdmin, BlocksFieldCell, GroupFieldAdmin, GroupFieldCell, RelationshipFieldAdmin, RelationshipFieldCell, UploadFieldAdmin, UploadFieldCell, RichTextFieldAdmin, RichTextFieldCell } from "./components/fields";
```
3. `>120` (after the `ComponentOverrideInput`/`SlotAccessPredicate` type export block) insert:
```ts

// Form entry — re-exported from its own module so `@vexcms/react` users who
// only need `useAppForm`/`AppForm` are not forced to a second import; the
// app form's full surface is `@vexcms/react/form`.
export { useAppForm, AppForm } from "./forms";
export type { FieldControlProps, FieldComponentProps } from "@vexcms/core";
```

`SlotOverrideProps`/`SLOT_IDS`/`BUILTIN_CONTRIBUTION_IDS`/`ComponentContributionInput`/
`ComponentOverrideInput`/`SlotId`/`SlotAccessContext`/`SlotAccessPredicate` exports (`:109-120`)
unchanged.

#### packages/react/package.json
`exports["./form"]` entry (added in step 8) stays; no change in this step beyond confirming the
barrel (`src/index.ts`) no longer accidentally re-exports internal app-form modules by path
instead of through `@vexcms/react/form`.

#### Changeset
New changeset entry (`.changeset/<generated-name>.md`) covering: `@vexcms/react`'s public field
component rename (`*FieldInput` → `*FieldAdmin`), the new `@vexcms/react/form` entry, the
`InputComponentProps` → `FieldComponentProps`/`FieldControlProps` split in `@vexcms/core`, and
the `admin.components.Field` override slot — every one of these is a breaking public-surface
change pre-0.1.0 (decision 12 — the last window for this).

#### apps/docs JSDoc + guides
`InputComponentProps`'s own `@example` (deleted) and `createFieldInput`'s `@example` (file
deleted) were the only JSDoc examples teaching the old pattern in the files this spec read;
`apps/docs/.../admin-customization.mdx` (if it exists — not confirmed present by this spec,
flagged for the implementer to check) gets its `createFieldInput`/`AppFormContext` example
swapped for `useFieldContext()` + `admin.components.Input`/`.Field` override examples matching
step 11's `FieldControlProps`/`FieldComponentProps` JSDoc blocks.

---

### Step 15 — Move script; shared `ui/`, `utils/`, `config/`, `auth/`, `access/` [agent]
Why: decision 18; the React package moves from `components/`/`context/`/`lib/`/`hooks/` grouping
into top-level feature folders mirroring core, starting with the five folders nothing else in
this move depends on. A small codemod does every move in steps 15–18 the same mechanical way —
`git mv` plus a relative-import rewrite — so each step's own diff is the mapping, not hand-edited
import lines.
Verify: `node scripts/move-modules.mjs --dry-run <mapping>` matches the listed edits; `pnpm --filter @vexcms/react typecheck && pnpm --filter @vexcms/react test`
- [ ] `scripts/move-modules.mjs` — `git mv`s every `{ from, to }` pair in a JSON mapping, then rewrites every relative `import`/`export`/`import()`/`vi.mock()` specifier under `packages/react/src/**/*.{ts,tsx}` that resolves to a moved file, for both the moved file's own outgoing imports and every importer that references it
- [ ] `scripts/move-modules.test.mjs` — covers a moved file's own outgoing import, an importer's import, a directory-index import, and a `vi.mock` path, each rewritten; `--dry-run` performs no `git mv` and no file write
- [ ] `node scripts/move-modules.mjs step15-mapping.json` run against the mapping below
- [ ] `pnpm --filter @vexcms/react typecheck && pnpm --filter @vexcms/react test` green

#### scripts/move-modules.mjs
```js
#!/usr/bin/env node
/**
 * Moves a batch of files with `git mv` and rewrites every relative import,
 * export, dynamic `import()`, and `vi.mock(...)` specifier under
 * `packages/react/src/**` so it still resolves after the move — both the
 * importers that reference a moved file, and a moved file's own outgoing
 * relative imports.
 *
 * Usage:
 *   node scripts/move-modules.mjs <mapping.json> [--dry-run]
 *
 * `mapping.json` is an array of `{ from, to }` objects, paths relative to
 * the repo root, e.g.:
 *   [{ "from": "packages/react/src/components/ui/button.tsx",
 *      "to": "packages/react/src/ui/button.tsx" }]
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_DIR = "packages/react/src";
const SPECIFIER_RE =
  /((?:from|import)\s*\(?\s*|vi\.mock\(\s*)(["'])(\.\.?\/[^"']*)\2/g;

/**
 * @param {string} root - absolute repo root
 * @param {string} repoRelativePath
 * @returns {string} absolute filesystem path
 */
function abs(root, repoRelativePath) {
  return join(root, repoRelativePath);
}

/**
 * Strips a trailing `.ts`/`.tsx` extension and an `/index` segment from a
 * resolved repo-relative path, matching the extension-less + index-folding
 * import style this codebase writes.
 *
 * @param {string} repoRelativePath
 * @returns {string}
 */
function toImportTarget(repoRelativePath) {
  const noExt = repoRelativePath.replace(/\.(tsx|ts)$/, "");
  return noExt.endsWith("/index") ? noExt.slice(0, -"/index".length) : noExt;
}

/**
 * Resolves a relative import specifier written in `fromFile` to the
 * repo-relative file it points at, trying both the bare path and `/index`.
 *
 * @param {string} root - absolute repo root
 * @param {string} fromFile - repo-relative path of the file containing the specifier
 * @param {string} specifier - the relative import specifier
 * @param {Set<string>} knownFiles - every repo-relative `.ts`/`.tsx` path in the source tree
 * @returns {string | undefined} the repo-relative file the specifier resolves to
 */
function resolveSpecifier(root, fromFile, specifier, knownFiles) {
  const base = relative(root, resolve(dirname(abs(root, fromFile)), specifier));
  for (const candidate of [
    `${base}.ts`,
    `${base}.tsx`,
    `${base}/index.ts`,
    `${base}/index.tsx`,
  ]) {
    if (knownFiles.has(candidate)) return candidate;
  }
  return undefined;
}

/**
 * Rewrites every relative import/export/`import()`/`vi.mock()` specifier in
 * `content` that resolves to a moved file, pointing it at that file's new
 * location — relative to where `content` now lives.
 *
 * @param {string} root - absolute repo root
 * @param {string} content
 * @param {string} oldFromFile - repo-relative path `content` was written at (pre-move)
 * @param {string} newFromFile - repo-relative path `content` lives at now (post-move)
 * @param {Map<string, string>} moves - repo-relative `from` -> repo-relative `to`
 * @param {Set<string>} knownFiles
 * @returns {string}
 */
function rewriteSpecifiers(root, content, oldFromFile, newFromFile, moves, knownFiles) {
  return content.replace(SPECIFIER_RE, (full, prefix, quote, specifier) => {
    const resolved = resolveSpecifier(root, oldFromFile, specifier, knownFiles);
    const target = resolved && moves.has(resolved) ? moves.get(resolved) : resolved;
    if (!resolved) return full;
    if (!moves.has(resolved) && newFromFile === oldFromFile) return full;
    const newSpecifier = relative(dirname(abs(root, newFromFile)), abs(root, toImportTarget(target)));
    const withDot = newSpecifier.startsWith(".") ? newSpecifier : `./${newSpecifier}`;
    return `${prefix}${quote}${withDot}${quote}`;
  });
}


/**
 * Recursively collects every `.ts`/`.tsx` file under `dir`.
 *
 * @param {string} dir - absolute directory to walk
 * @returns {string[]} absolute file paths
 */
function walkTsFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkTsFiles(full));
    } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
      results.push(full);
    }
  }
  return results;
}

/**
 * @param {string[]} argv
 * @returns {{ mappingPath: string, dryRun: boolean }}
 */
function parseArgs(argv) {
  const dryRun = argv.includes("--dry-run");
  const mappingPath = argv.find((a) => !a.startsWith("--"));
  if (!mappingPath) {
    throw new Error("usage: node scripts/move-modules.mjs <mapping.json> [--dry-run]");
  }
  return { mappingPath, dryRun };
}

/**
 * Moves every file in `mapping` with `git mv` (creating destination
 * directories as needed) and rewrites every relative import/export/
 * `import()`/`vi.mock()` specifier under `packages/react/src/**` that
 * resolves to a moved file.
 *
 * @param {{ from: string, to: string }[]} mapping
 * @param {{ dryRun?: boolean, repoRoot?: string }} [options]
 * @returns {{ moved: { from: string, to: string }[], edits: { file: string, before: string, after: string }[] }}
 */
export function moveModules(mapping, options = {}) {
  const dryRun = options.dryRun ?? false;
  const root = options.repoRoot ?? REPO_ROOT;
  const moves = new Map(mapping.map((m) => [m.from, m.to]));

  // Captured before any git mv runs, so specifiers in every file's current
  // (pre-move) content resolve against the tree they were actually written for.
  const knownFiles = new Set(
    walkTsFiles(join(root, SOURCE_DIR)).map((p) => relative(root, p).split("\\").join("/")),
  );

  const moved = [];
  for (const { from, to } of mapping) {
    if (!dryRun) {
      mkdirSync(dirname(join(root, to)), { recursive: true });
      execFileSync("git", ["mv", from, to], { cwd: root, stdio: "inherit" });
    }
    moved.push({ from, to });
  }

  const edits = [];
  for (const oldFile of knownFiles) {
    const newFile = moves.get(oldFile) ?? oldFile;
    const readPath = dryRun ? abs(root, oldFile) : abs(root, newFile);
    if (!existsSync(readPath)) continue;
    const before = readFileSync(readPath, "utf8");
    const after = rewriteSpecifiers(root, before, oldFile, newFile, moves, knownFiles);
    if (after !== before) {
      edits.push({ file: newFile, before, after });
      if (!dryRun) writeFileSync(abs(root, newFile), after);
    }
  }

  return { moved, edits };
}

async function main() {
  const { mappingPath, dryRun } = parseArgs(process.argv.slice(2));
  const mapping = JSON.parse(readFileSync(resolve(process.cwd(), mappingPath), "utf8"));
  const { moved, edits } = moveModules(mapping, { dryRun });
  for (const { from, to } of moved) {
    console.log(`${dryRun ? "[dry-run] " : ""}git mv ${from} ${to}`);
  }
  for (const { file, before, after } of edits) {
    console.log(`\n--- ${file} ---`);
    const beforeLines = before.split("\n");
    const afterLines = after.split("\n");
    for (let i = 0; i < Math.max(beforeLines.length, afterLines.length); i++) {
      if (beforeLines[i] !== afterLines[i]) {
        if (beforeLines[i] !== undefined) console.log(`- ${beforeLines[i]}`);
        if (afterLines[i] !== undefined) console.log(`+ ${afterLines[i]}`);
      }
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
```

#### scripts/move-modules.test.mjs
```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { moveModules } from "./move-modules.mjs";

/**
 * Builds a throwaway git repo under `packages/react/src/**` with the given
 * `{ path: content }` files, so `git mv` (and `--dry-run`'s no-op path) have
 * a real working tree to operate on.
 *
 * @param {Record<string, string>} files - repo-relative path -> file content
 * @returns {string} the temp repo root
 */
function makeRepo(files) {
  const root = mkdtempSync(join(tmpdir(), "move-modules-"));
  execFileSync("git", ["init", "-q"], { cwd: root });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: root });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: root });
  for (const [path, content] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(full.slice(0, full.lastIndexOf("/")), { recursive: true });
    writeFileSync(full, content);
  }
  execFileSync("git", ["add", "-A"], { cwd: root });
  execFileSync("git", ["commit", "-q", "-m", "init"], { cwd: root });
  return root;
}

test("rewrites a moved file's own outgoing relative import", () => {
  const root = makeRepo({
    "packages/react/src/components/ui/button.tsx": `import { cn } from "../../styles/utils";\nexport const Button = () => null;\n`,
    "packages/react/src/styles/utils.ts": `export function cn() {}\n`,
  });
  moveModules(
    [{ from: "packages/react/src/components/ui/button.tsx", to: "packages/react/src/ui/button.tsx" }],
    { repoRoot: root },
  );
  const moved = readFileSync(join(root, "packages/react/src/ui/button.tsx"), "utf8");
  assert.match(moved, /from "\.\.\/styles\/utils"/);
  rmSync(root, { recursive: true, force: true });
});

test("rewrites an importer that references a moved file", () => {
  const root = makeRepo({
    "packages/react/src/components/ui/button.tsx": `export const Button = () => null;\n`,
    "packages/react/src/components/views/CollectionEditView.tsx": `import { Button } from "../ui/button";\n`,
  });
  moveModules(
    [{ from: "packages/react/src/components/ui/button.tsx", to: "packages/react/src/ui/button.tsx" }],
    { repoRoot: root },
  );
  const importer = readFileSync(
    join(root, "packages/react/src/components/views/CollectionEditView.tsx"),
    "utf8",
  );
  assert.match(importer, /from "\.\.\/\.\.\/ui\/button"/);
  rmSync(root, { recursive: true, force: true });
});

test("rewrites a directory-index import", () => {
  const root = makeRepo({
    "packages/react/src/components/slots/index.ts": `export * from "./formData";\n`,
    "packages/react/src/components/views/CollectionEditView.tsx": `import { SlotOutlet } from "../slots";\n`,
  });
  moveModules(
    [{ from: "packages/react/src/components/slots/index.ts", to: "packages/react/src/slots/index.ts" }],
    { repoRoot: root },
  );
  const importer = readFileSync(
    join(root, "packages/react/src/components/views/CollectionEditView.tsx"),
    "utf8",
  );
  assert.match(importer, /from "\.\.\/\.\.\/slots"/);
  rmSync(root, { recursive: true, force: true });
});

test("rewrites a vi.mock path", () => {
  const root = makeRepo({
    "packages/react/src/components/ui/button.tsx": `export const Button = () => null;\n`,
    "packages/react/src/components/views/CollectionEditView.test.tsx": `vi.mock("../ui/button", () => ({ Button: () => null }));\n`,
  });
  moveModules(
    [{ from: "packages/react/src/components/ui/button.tsx", to: "packages/react/src/ui/button.tsx" }],
    { repoRoot: root },
  );
  const importer = readFileSync(
    join(root, "packages/react/src/components/views/CollectionEditView.test.tsx"),
    "utf8",
  );
  assert.match(importer, /vi\.mock\("\.\.\/\.\.\/ui\/button"/);
  rmSync(root, { recursive: true, force: true });
});

test("--dry-run performs no git mv and no file writes", () => {
  const root = makeRepo({
    "packages/react/src/components/ui/button.tsx": `export const Button = () => null;\n`,
    "packages/react/src/components/views/CollectionEditView.tsx": `import { Button } from "../ui/button";\n`,
  });
  moveModules(
    [{ from: "packages/react/src/components/ui/button.tsx", to: "packages/react/src/ui/button.tsx" }],
    { repoRoot: root, dryRun: true },
  );
  assert.ok(readFileSync(join(root, "packages/react/src/components/ui/button.tsx"), "utf8"));
  const importer = readFileSync(
    join(root, "packages/react/src/components/views/CollectionEditView.tsx"),
    "utf8",
  );
  assert.match(importer, /from "\.\.\/ui\/button"/);
  rmSync(root, { recursive: true, force: true });
});
```

#### Mapping — `ui/`, `utils/`, `config/`, `auth/`, `access/`
`components/ui/**` (including `data-table/`, `datetime/`, `dnd/`) and `components/Icon.tsx` flatten
to `ui/`; `styles/utils.ts`'s `cn` becomes `utils/cn.ts` (named after its export, decision 2's
naming rule applied to a plain util module) and `lib/errors.ts` becomes `utils/errors.ts`;
`context/VexConfigContext.tsx` + `hooks/useFrameworkComponents.ts` become `config/`;
`context/VexAuthContext.tsx` becomes `auth/`; the four permission hooks
(`usePermission`, `useVexPermissions`, `useCanAccessAdminPanel`, `useFieldPermissions`) become
`access/`. Run:

```bash
node scripts/move-modules.mjs step15-mapping.json
```

```json
[
  {
    "from": "packages/react/src/components/Icon.tsx",
    "to": "packages/react/src/ui/Icon.tsx"
  },
  {
    "from": "packages/react/src/components/ui/ActionsMenu.tsx",
    "to": "packages/react/src/ui/ActionsMenu.tsx"
  },
  {
    "from": "packages/react/src/components/ui/InputTag.tsx",
    "to": "packages/react/src/ui/InputTag.tsx"
  },
  {
    "from": "packages/react/src/components/ui/JsonEditor.test.tsx",
    "to": "packages/react/src/ui/JsonEditor.test.tsx"
  },
  {
    "from": "packages/react/src/components/ui/JsonEditor.tsx",
    "to": "packages/react/src/ui/JsonEditor.tsx"
  },
  {
    "from": "packages/react/src/components/ui/JsonEditorView.tsx",
    "to": "packages/react/src/ui/JsonEditorView.tsx"
  },
  {
    "from": "packages/react/src/components/ui/ThemeProvider.tsx",
    "to": "packages/react/src/ui/ThemeProvider.tsx"
  },
  {
    "from": "packages/react/src/components/ui/ThemeScript.tsx",
    "to": "packages/react/src/ui/ThemeScript.tsx"
  },
  {
    "from": "packages/react/src/components/ui/ThemeToggle.tsx",
    "to": "packages/react/src/ui/ThemeToggle.tsx"
  },
  {
    "from": "packages/react/src/components/ui/VexImage.tsx",
    "to": "packages/react/src/ui/VexImage.tsx"
  },
  {
    "from": "packages/react/src/components/ui/VexLink.tsx",
    "to": "packages/react/src/ui/VexLink.tsx"
  },
  {
    "from": "packages/react/src/components/ui/accordion.test.tsx",
    "to": "packages/react/src/ui/accordion.test.tsx"
  },
  {
    "from": "packages/react/src/components/ui/accordion.tsx",
    "to": "packages/react/src/ui/accordion.tsx"
  },
  {
    "from": "packages/react/src/components/ui/alert-dialog.tsx",
    "to": "packages/react/src/ui/alert-dialog.tsx"
  },
  {
    "from": "packages/react/src/components/ui/badge.tsx",
    "to": "packages/react/src/ui/badge.tsx"
  },
  {
    "from": "packages/react/src/components/ui/button.tsx",
    "to": "packages/react/src/ui/button.tsx"
  },
  {
    "from": "packages/react/src/components/ui/card.tsx",
    "to": "packages/react/src/ui/card.tsx"
  },
  {
    "from": "packages/react/src/components/ui/checkbox.tsx",
    "to": "packages/react/src/ui/checkbox.tsx"
  },
  {
    "from": "packages/react/src/components/ui/command.tsx",
    "to": "packages/react/src/ui/command.tsx"
  },
  {
    "from": "packages/react/src/components/ui/data-table/DataTable.test.tsx",
    "to": "packages/react/src/ui/data-table/DataTable.test.tsx"
  },
  {
    "from": "packages/react/src/components/ui/data-table/DataTable.tsx",
    "to": "packages/react/src/ui/data-table/DataTable.tsx"
  },
  {
    "from": "packages/react/src/components/ui/data-table/DataTableBulkActions.test.tsx",
    "to": "packages/react/src/ui/data-table/DataTableBulkActions.test.tsx"
  },
  {
    "from": "packages/react/src/components/ui/data-table/DataTableBulkActions.tsx",
    "to": "packages/react/src/ui/data-table/DataTableBulkActions.tsx"
  },
  {
    "from": "packages/react/src/components/ui/data-table/DeleteManyModal.test.tsx",
    "to": "packages/react/src/ui/data-table/DeleteManyModal.test.tsx"
  },
  {
    "from": "packages/react/src/components/ui/data-table/DeleteManyModal.tsx",
    "to": "packages/react/src/ui/data-table/DeleteManyModal.tsx"
  },
  {
    "from": "packages/react/src/components/ui/data-table/index.ts",
    "to": "packages/react/src/ui/data-table/index.ts"
  },
  {
    "from": "packages/react/src/components/ui/datetime/date-picker.tsx",
    "to": "packages/react/src/ui/datetime/date-picker.tsx"
  },
  {
    "from": "packages/react/src/components/ui/datetime/index.ts",
    "to": "packages/react/src/ui/datetime/index.ts"
  },
  {
    "from": "packages/react/src/components/ui/datetime/input.tsx",
    "to": "packages/react/src/ui/datetime/input.tsx"
  },
  {
    "from": "packages/react/src/components/ui/datetime/time-picker.tsx",
    "to": "packages/react/src/ui/datetime/time-picker.tsx"
  },
  {
    "from": "packages/react/src/components/ui/dialog.tsx",
    "to": "packages/react/src/ui/dialog.tsx"
  },
  {
    "from": "packages/react/src/components/ui/dnd/DndProvider.tsx",
    "to": "packages/react/src/ui/dnd/DndProvider.tsx"
  },
  {
    "from": "packages/react/src/components/ui/dnd/DragHandle.test.tsx",
    "to": "packages/react/src/ui/dnd/DragHandle.test.tsx"
  },
  {
    "from": "packages/react/src/components/ui/dnd/DragHandle.tsx",
    "to": "packages/react/src/ui/dnd/DragHandle.tsx"
  },
  {
    "from": "packages/react/src/components/ui/dnd/Draggable.tsx",
    "to": "packages/react/src/ui/dnd/Draggable.tsx"
  },
  {
    "from": "packages/react/src/components/ui/dnd/Droppable.tsx",
    "to": "packages/react/src/ui/dnd/Droppable.tsx"
  },
  {
    "from": "packages/react/src/components/ui/dnd/context.ts",
    "to": "packages/react/src/ui/dnd/context.ts"
  },
  {
    "from": "packages/react/src/components/ui/dnd/index.ts",
    "to": "packages/react/src/ui/dnd/index.ts"
  },
  {
    "from": "packages/react/src/components/ui/dnd/useAccordionDndState.ts",
    "to": "packages/react/src/ui/dnd/useAccordionDndState.ts"
  },
  {
    "from": "packages/react/src/components/ui/dropdown-menu.tsx",
    "to": "packages/react/src/ui/dropdown-menu.tsx"
  },
  {
    "from": "packages/react/src/components/ui/index.ts",
    "to": "packages/react/src/ui/index.ts"
  },
  {
    "from": "packages/react/src/components/ui/input-group.tsx",
    "to": "packages/react/src/ui/input-group.tsx"
  },
  {
    "from": "packages/react/src/components/ui/input.tsx",
    "to": "packages/react/src/ui/input.tsx"
  },
  {
    "from": "packages/react/src/components/ui/label.tsx",
    "to": "packages/react/src/ui/label.tsx"
  },
  {
    "from": "packages/react/src/components/ui/multi-select.test.tsx",
    "to": "packages/react/src/ui/multi-select.test.tsx"
  },
  {
    "from": "packages/react/src/components/ui/multi-select.tsx",
    "to": "packages/react/src/ui/multi-select.tsx"
  },
  {
    "from": "packages/react/src/components/ui/pagination.tsx",
    "to": "packages/react/src/ui/pagination.tsx"
  },
  {
    "from": "packages/react/src/components/ui/popover.tsx",
    "to": "packages/react/src/ui/popover.tsx"
  },
  {
    "from": "packages/react/src/components/ui/radio-group.tsx",
    "to": "packages/react/src/ui/radio-group.tsx"
  },
  {
    "from": "packages/react/src/components/ui/resizable.tsx",
    "to": "packages/react/src/ui/resizable.tsx"
  },
  {
    "from": "packages/react/src/components/ui/scroll-area.tsx",
    "to": "packages/react/src/ui/scroll-area.tsx"
  },
  {
    "from": "packages/react/src/components/ui/select.tsx",
    "to": "packages/react/src/ui/select.tsx"
  },
  {
    "from": "packages/react/src/components/ui/separator.tsx",
    "to": "packages/react/src/ui/separator.tsx"
  },
  {
    "from": "packages/react/src/components/ui/sheet.tsx",
    "to": "packages/react/src/ui/sheet.tsx"
  },
  {
    "from": "packages/react/src/components/ui/sidebar.tsx",
    "to": "packages/react/src/ui/sidebar.tsx"
  },
  {
    "from": "packages/react/src/components/ui/skeleton.tsx",
    "to": "packages/react/src/ui/skeleton.tsx"
  },
  {
    "from": "packages/react/src/components/ui/sonner.tsx",
    "to": "packages/react/src/ui/sonner.tsx"
  },
  {
    "from": "packages/react/src/components/ui/table.tsx",
    "to": "packages/react/src/ui/table.tsx"
  },
  {
    "from": "packages/react/src/components/ui/tabs.tsx",
    "to": "packages/react/src/ui/tabs.tsx"
  },
  {
    "from": "packages/react/src/components/ui/textarea.tsx",
    "to": "packages/react/src/ui/textarea.tsx"
  },
  {
    "from": "packages/react/src/components/ui/tooltip.tsx",
    "to": "packages/react/src/ui/tooltip.tsx"
  },
  {
    "from": "packages/react/src/context/VexAuthContext.tsx",
    "to": "packages/react/src/auth/VexAuthContext.tsx"
  },
  {
    "from": "packages/react/src/context/VexConfigContext.test.tsx",
    "to": "packages/react/src/config/VexConfigContext.test.tsx"
  },
  {
    "from": "packages/react/src/context/VexConfigContext.tsx",
    "to": "packages/react/src/config/VexConfigContext.tsx"
  },
  {
    "from": "packages/react/src/hooks/useCanAccessAdminPanel.test.tsx",
    "to": "packages/react/src/access/useCanAccessAdminPanel.test.tsx"
  },
  {
    "from": "packages/react/src/hooks/useCanAccessAdminPanel.ts",
    "to": "packages/react/src/access/useCanAccessAdminPanel.ts"
  },
  {
    "from": "packages/react/src/hooks/useFieldPermissions.test.tsx",
    "to": "packages/react/src/access/useFieldPermissions.test.tsx"
  },
  {
    "from": "packages/react/src/hooks/useFieldPermissions.ts",
    "to": "packages/react/src/access/useFieldPermissions.ts"
  },
  {
    "from": "packages/react/src/hooks/useFrameworkComponents.ts",
    "to": "packages/react/src/config/useFrameworkComponents.ts"
  },
  {
    "from": "packages/react/src/hooks/usePermission.test.tsx",
    "to": "packages/react/src/access/usePermission.test.tsx"
  },
  {
    "from": "packages/react/src/hooks/usePermission.ts",
    "to": "packages/react/src/access/usePermission.ts"
  },
  {
    "from": "packages/react/src/hooks/useVexPermissions.test.tsx",
    "to": "packages/react/src/access/useVexPermissions.test.tsx"
  },
  {
    "from": "packages/react/src/hooks/useVexPermissions.ts",
    "to": "packages/react/src/access/useVexPermissions.ts"
  },
  {
    "from": "packages/react/src/lib/errors.ts",
    "to": "packages/react/src/utils/errors.ts"
  },
  {
    "from": "packages/react/src/styles/utils.ts",
    "to": "packages/react/src/utils/cn.ts"
  }
]
```

No non-relative edits — every reference the script does not already resolve (package.json
`exports`, tsup entries, `src/index.ts`'s own re-export list) is a relative import into one of
these files, already covered above.


### Step 16 — `slots/`, `modals/`, `livePreview/`, `revalidate/` [agent]
Why: decision 18; the four cross-cutting infrastructure folders.
Verify: `node scripts/move-modules.mjs --dry-run <mapping>` matches the listed edits; `pnpm --filter @vexcms/react typecheck && pnpm --filter @vexcms/react test`
- [ ] `node scripts/move-modules.mjs step16-mapping.json` run against the mapping below
- [ ] `pnpm --filter @vexcms/react typecheck && pnpm --filter @vexcms/react test` green

#### Mapping — `slots/`, `modals/`, `livePreview/`, `revalidate/`
`components/slots/**` flattens to `slots/` (already holding the step-12 `resolveFieldComponent.tsx`
rename — unaffected by this move, carried along as-is). `components/modals/BaseModal.tsx` +
`.test.tsx` + `constants.ts`, and `hooks/useModalSurface.tsx` + `.test.tsx`, become `modals/`
(`CreateDocumentForm`/`CreateDocumentModal`/`CreateMediaModal` move in step 18, beside the
domains they create documents for). `components/livePreview/LivePreviewPanel.{tsx,test.tsx}`,
`context/LivePreviewContext.{tsx,test.tsx}`, `context/livePreviewProtocol.{ts,test.ts}`, and the
three `useLivePreview*` hooks become `livePreview/`. `components/RevalidateButton.{tsx,test.tsx}`,
`context/VexRevalidateContext.tsx`, and `useVexRevalidate.{ts,test.tsx}` become `revalidate/`. Run:

```bash
node scripts/move-modules.mjs step16-mapping.json
```

```json
[
  {
    "from": "packages/react/src/components/RevalidateButton.test.tsx",
    "to": "packages/react/src/revalidate/RevalidateButton.test.tsx"
  },
  {
    "from": "packages/react/src/components/RevalidateButton.tsx",
    "to": "packages/react/src/revalidate/RevalidateButton.tsx"
  },
  {
    "from": "packages/react/src/components/livePreview/LivePreviewPanel.test.tsx",
    "to": "packages/react/src/livePreview/LivePreviewPanel.test.tsx"
  },
  {
    "from": "packages/react/src/components/livePreview/LivePreviewPanel.tsx",
    "to": "packages/react/src/livePreview/LivePreviewPanel.tsx"
  },
  {
    "from": "packages/react/src/components/modals/BaseModal.test.tsx",
    "to": "packages/react/src/modals/BaseModal.test.tsx"
  },
  {
    "from": "packages/react/src/components/modals/BaseModal.tsx",
    "to": "packages/react/src/modals/BaseModal.tsx"
  },
  {
    "from": "packages/react/src/components/modals/constants.ts",
    "to": "packages/react/src/modals/constants.ts"
  },
  {
    "from": "packages/react/src/components/slots/ComponentErrorBoundary.test.tsx",
    "to": "packages/react/src/slots/ComponentErrorBoundary.test.tsx"
  },
  {
    "from": "packages/react/src/components/slots/ComponentErrorBoundary.tsx",
    "to": "packages/react/src/slots/ComponentErrorBoundary.tsx"
  },
  {
    "from": "packages/react/src/components/slots/SlotOutlet.test.tsx",
    "to": "packages/react/src/slots/SlotOutlet.test.tsx"
  },
  {
    "from": "packages/react/src/components/slots/SlotOutlet.tsx",
    "to": "packages/react/src/slots/SlotOutlet.tsx"
  },
  {
    "from": "packages/react/src/components/slots/SlotOverrideOutlet.test.tsx",
    "to": "packages/react/src/slots/SlotOverrideOutlet.test.tsx"
  },
  {
    "from": "packages/react/src/components/slots/SlotOverrideOutlet.tsx",
    "to": "packages/react/src/slots/SlotOverrideOutlet.tsx"
  },
  {
    "from": "packages/react/src/components/slots/formData.test.tsx",
    "to": "packages/react/src/slots/formData.test.tsx"
  },
  {
    "from": "packages/react/src/components/slots/formData.ts",
    "to": "packages/react/src/slots/formData.ts"
  },
  {
    "from": "packages/react/src/components/slots/index.ts",
    "to": "packages/react/src/slots/index.ts"
  },
  {
    "from": "packages/react/src/components/slots/resolveFieldCellComponent.test.tsx",
    "to": "packages/react/src/slots/resolveFieldCellComponent.test.tsx"
  },
  {
    "from": "packages/react/src/components/slots/resolveFieldCellComponent.tsx",
    "to": "packages/react/src/slots/resolveFieldCellComponent.tsx"
  },
  {
    "from": "packages/react/src/components/slots/resolveFieldComponent.test.tsx",
    "to": "packages/react/src/slots/resolveFieldComponent.test.tsx"
  },
  {
    "from": "packages/react/src/components/slots/resolveFieldComponent.tsx",
    "to": "packages/react/src/slots/resolveFieldComponent.tsx"
  },
  {
    "from": "packages/react/src/components/slots/types.ts",
    "to": "packages/react/src/slots/types.ts"
  },
  {
    "from": "packages/react/src/context/LivePreviewContext.test.tsx",
    "to": "packages/react/src/livePreview/LivePreviewContext.test.tsx"
  },
  {
    "from": "packages/react/src/context/LivePreviewContext.tsx",
    "to": "packages/react/src/livePreview/LivePreviewContext.tsx"
  },
  {
    "from": "packages/react/src/context/VexRevalidateContext.tsx",
    "to": "packages/react/src/revalidate/VexRevalidateContext.tsx"
  },
  {
    "from": "packages/react/src/context/livePreviewProtocol.test.ts",
    "to": "packages/react/src/livePreview/livePreviewProtocol.test.ts"
  },
  {
    "from": "packages/react/src/context/livePreviewProtocol.ts",
    "to": "packages/react/src/livePreview/livePreviewProtocol.ts"
  },
  {
    "from": "packages/react/src/hooks/useLivePreviewPanelMinSize.test.tsx",
    "to": "packages/react/src/livePreview/useLivePreviewPanelMinSize.test.tsx"
  },
  {
    "from": "packages/react/src/hooks/useLivePreviewPanelState.ts",
    "to": "packages/react/src/livePreview/useLivePreviewPanelState.ts"
  },
  {
    "from": "packages/react/src/hooks/useLivePreviewServerUrl.test.tsx",
    "to": "packages/react/src/livePreview/useLivePreviewServerUrl.test.tsx"
  },
  {
    "from": "packages/react/src/hooks/useLivePreviewServerUrl.ts",
    "to": "packages/react/src/livePreview/useLivePreviewServerUrl.ts"
  },
  {
    "from": "packages/react/src/hooks/useLivePreviewSync.test.ts",
    "to": "packages/react/src/livePreview/useLivePreviewSync.test.ts"
  },
  {
    "from": "packages/react/src/hooks/useLivePreviewSync.ts",
    "to": "packages/react/src/livePreview/useLivePreviewSync.ts"
  },
  {
    "from": "packages/react/src/hooks/useModalSurface.test.tsx",
    "to": "packages/react/src/modals/useModalSurface.test.tsx"
  },
  {
    "from": "packages/react/src/hooks/useModalSurface.tsx",
    "to": "packages/react/src/modals/useModalSurface.tsx"
  },
  {
    "from": "packages/react/src/hooks/useVexRevalidate.test.tsx",
    "to": "packages/react/src/revalidate/useVexRevalidate.test.tsx"
  },
  {
    "from": "packages/react/src/hooks/useVexRevalidate.ts",
    "to": "packages/react/src/revalidate/useVexRevalidate.ts"
  }
]
```

No non-relative edits.


### Step 17 — `fields/` + `forms/useVexForm` [agent]
Why: decision 18; every field-type folder, the field-level infrastructure around them, and
`useVexForm` (the one hook `forms/` owns beside the app form itself) flatten out of `components/`.
Verify: `node scripts/move-modules.mjs --dry-run <mapping>` matches the listed edits; `pnpm --filter @vexcms/react typecheck && pnpm --filter @vexcms/react test`
- [ ] `node scripts/move-modules.mjs step17-mapping.json` run against the mapping below
- [ ] `pnpm --filter @vexcms/react typecheck && pnpm --filter @vexcms/react test` green

#### Mapping — `fields/` + `forms/useVexForm`
`components/fields/**` (every `<type>/` folder, `RenderFields`, `FieldConditionGate`,
`applyFieldPermissionReadOnly`, `readableFields`, `registry.ts`, `index.tsx`) flattens to `fields/`.
`components/RenderBlocks.{tsx,test.tsx}` and `components/relationship/**`
(`RelationshipPicker`, `RelationshipDocumentList` + tests) join their field types, at
`fields/blocks/` and `fields/relationship/` respectively — `relationship/index.ts`'s own export
list is left for this step's implementer to merge with `fields/relationship/index.ts`'s existing
barrel (both barrels exist pre-move; the script moves files, not barrel content). The field
hooks (`useFieldCondition`, `useFieldMask`, `useFieldsForm`, `useLiveFieldMerge`,
`useVisibleFields`, `useFieldControlOverride`) become `fields/`; `useBlockClipboard` becomes
`fields/blocks/`. `useVexForm.{ts,test.tsx}` becomes `forms/` (the app form's own `useVexForm.ts`
reads `../forms`'s `useFormContext` already — unaffected by its own move). Run:

```bash
node scripts/move-modules.mjs step17-mapping.json
```

```json
[
  {
    "from": "packages/react/src/components/RenderBlocks.test.tsx",
    "to": "packages/react/src/fields/blocks/RenderBlocks.test.tsx"
  },
  {
    "from": "packages/react/src/components/RenderBlocks.tsx",
    "to": "packages/react/src/fields/blocks/RenderBlocks.tsx"
  },
  {
    "from": "packages/react/src/components/fields/FieldConditionGate.tsx",
    "to": "packages/react/src/fields/FieldConditionGate.tsx"
  },
  {
    "from": "packages/react/src/components/fields/RenderFields.test.tsx",
    "to": "packages/react/src/fields/RenderFields.test.tsx"
  },
  {
    "from": "packages/react/src/components/fields/RenderFields.tsx",
    "to": "packages/react/src/fields/RenderFields.tsx"
  },
  {
    "from": "packages/react/src/components/fields/applyFieldPermissionReadOnly.ts",
    "to": "packages/react/src/fields/applyFieldPermissionReadOnly.ts"
  },
  {
    "from": "packages/react/src/components/fields/array/Cell.test.tsx",
    "to": "packages/react/src/fields/array/Cell.test.tsx"
  },
  {
    "from": "packages/react/src/components/fields/array/Cell.tsx",
    "to": "packages/react/src/fields/array/Cell.tsx"
  },
  {
    "from": "packages/react/src/components/fields/array/Field.test.tsx",
    "to": "packages/react/src/fields/array/Field.test.tsx"
  },
  {
    "from": "packages/react/src/components/fields/array/Field.tsx",
    "to": "packages/react/src/fields/array/Field.tsx"
  },
  {
    "from": "packages/react/src/components/fields/array/columnDef.test.ts",
    "to": "packages/react/src/fields/array/columnDef.test.ts"
  },
  {
    "from": "packages/react/src/components/fields/array/columnDef.tsx",
    "to": "packages/react/src/fields/array/columnDef.tsx"
  },
  {
    "from": "packages/react/src/components/fields/array/index.ts",
    "to": "packages/react/src/fields/array/index.ts"
  },
  {
    "from": "packages/react/src/components/fields/array/testFixture.ts",
    "to": "packages/react/src/fields/array/testFixture.ts"
  },
  {
    "from": "packages/react/src/components/fields/blocks/BlockActionsMenu.test.tsx",
    "to": "packages/react/src/fields/blocks/BlockActionsMenu.test.tsx"
  },
  {
    "from": "packages/react/src/components/fields/blocks/BlockActionsMenu.tsx",
    "to": "packages/react/src/fields/blocks/BlockActionsMenu.tsx"
  },
  {
    "from": "packages/react/src/components/fields/blocks/Cell.test.tsx",
    "to": "packages/react/src/fields/blocks/Cell.test.tsx"
  },
  {
    "from": "packages/react/src/components/fields/blocks/Cell.tsx",
    "to": "packages/react/src/fields/blocks/Cell.tsx"
  },
  {
    "from": "packages/react/src/components/fields/blocks/Field.test.tsx",
    "to": "packages/react/src/fields/blocks/Field.test.tsx"
  },
  {
    "from": "packages/react/src/components/fields/blocks/Field.tsx",
    "to": "packages/react/src/fields/blocks/Field.tsx"
  },
  {
    "from": "packages/react/src/components/fields/blocks/clipboard.ts",
    "to": "packages/react/src/fields/blocks/clipboard.ts"
  },
  {
    "from": "packages/react/src/components/fields/blocks/columnDef.test.ts",
    "to": "packages/react/src/fields/blocks/columnDef.test.ts"
  },
  {
    "from": "packages/react/src/components/fields/blocks/columnDef.tsx",
    "to": "packages/react/src/fields/blocks/columnDef.tsx"
  },
  {
    "from": "packages/react/src/components/fields/blocks/index.ts",
    "to": "packages/react/src/fields/blocks/index.ts"
  },
  {
    "from": "packages/react/src/components/fields/blocks/testFixture.ts",
    "to": "packages/react/src/fields/blocks/testFixture.ts"
  },
  {
    "from": "packages/react/src/components/fields/checkbox/Cell.test.tsx",
    "to": "packages/react/src/fields/checkbox/Cell.test.tsx"
  },
  {
    "from": "packages/react/src/components/fields/checkbox/Cell.tsx",
    "to": "packages/react/src/fields/checkbox/Cell.tsx"
  },
  {
    "from": "packages/react/src/components/fields/checkbox/Field.test.tsx",
    "to": "packages/react/src/fields/checkbox/Field.test.tsx"
  },
  {
    "from": "packages/react/src/components/fields/checkbox/Field.tsx",
    "to": "packages/react/src/fields/checkbox/Field.tsx"
  },
  {
    "from": "packages/react/src/components/fields/checkbox/columnDef.test.ts",
    "to": "packages/react/src/fields/checkbox/columnDef.test.ts"
  },
  {
    "from": "packages/react/src/components/fields/checkbox/columnDef.tsx",
    "to": "packages/react/src/fields/checkbox/columnDef.tsx"
  },
  {
    "from": "packages/react/src/components/fields/checkbox/index.ts",
    "to": "packages/react/src/fields/checkbox/index.ts"
  },
  {
    "from": "packages/react/src/components/fields/checkbox/testFixture.ts",
    "to": "packages/react/src/fields/checkbox/testFixture.ts"
  },
  {
    "from": "packages/react/src/components/fields/collapsible/Field.test.tsx",
    "to": "packages/react/src/fields/collapsible/Field.test.tsx"
  },
  {
    "from": "packages/react/src/components/fields/collapsible/Field.tsx",
    "to": "packages/react/src/fields/collapsible/Field.tsx"
  },
  {
    "from": "packages/react/src/components/fields/color/Cell.test.tsx",
    "to": "packages/react/src/fields/color/Cell.test.tsx"
  },
  {
    "from": "packages/react/src/components/fields/color/Cell.tsx",
    "to": "packages/react/src/fields/color/Cell.tsx"
  },
  {
    "from": "packages/react/src/components/fields/color/Field.test.tsx",
    "to": "packages/react/src/fields/color/Field.test.tsx"
  },
  {
    "from": "packages/react/src/components/fields/color/Field.tsx",
    "to": "packages/react/src/fields/color/Field.tsx"
  },
  {
    "from": "packages/react/src/components/fields/color/columnDef.test.ts",
    "to": "packages/react/src/fields/color/columnDef.test.ts"
  },
  {
    "from": "packages/react/src/components/fields/color/columnDef.tsx",
    "to": "packages/react/src/fields/color/columnDef.tsx"
  },
  {
    "from": "packages/react/src/components/fields/color/index.ts",
    "to": "packages/react/src/fields/color/index.ts"
  },
  {
    "from": "packages/react/src/components/fields/color/testFixture.ts",
    "to": "packages/react/src/fields/color/testFixture.ts"
  },
  {
    "from": "packages/react/src/components/fields/color/utils.test.ts",
    "to": "packages/react/src/fields/color/utils.test.ts"
  },
  {
    "from": "packages/react/src/components/fields/color/utils.ts",
    "to": "packages/react/src/fields/color/utils.ts"
  },
  {
    "from": "packages/react/src/components/fields/date/Cell.test.tsx",
    "to": "packages/react/src/fields/date/Cell.test.tsx"
  },
  {
    "from": "packages/react/src/components/fields/date/Cell.tsx",
    "to": "packages/react/src/fields/date/Cell.tsx"
  },
  {
    "from": "packages/react/src/components/fields/date/Field.test.tsx",
    "to": "packages/react/src/fields/date/Field.test.tsx"
  },
  {
    "from": "packages/react/src/components/fields/date/Field.tsx",
    "to": "packages/react/src/fields/date/Field.tsx"
  },
  {
    "from": "packages/react/src/components/fields/date/columnDef.test.ts",
    "to": "packages/react/src/fields/date/columnDef.test.ts"
  },
  {
    "from": "packages/react/src/components/fields/date/columnDef.tsx",
    "to": "packages/react/src/fields/date/columnDef.tsx"
  },
  {
    "from": "packages/react/src/components/fields/date/index.ts",
    "to": "packages/react/src/fields/date/index.ts"
  },
  {
    "from": "packages/react/src/components/fields/date/testFixture.ts",
    "to": "packages/react/src/fields/date/testFixture.ts"
  },
  {
    "from": "packages/react/src/components/fields/date/utils.test.ts",
    "to": "packages/react/src/fields/date/utils.test.ts"
  },
  {
    "from": "packages/react/src/components/fields/date/utils.ts",
    "to": "packages/react/src/fields/date/utils.ts"
  },
  {
    "from": "packages/react/src/components/fields/email/Cell.test.tsx",
    "to": "packages/react/src/fields/email/Cell.test.tsx"
  },
  {
    "from": "packages/react/src/components/fields/email/Cell.tsx",
    "to": "packages/react/src/fields/email/Cell.tsx"
  },
  {
    "from": "packages/react/src/components/fields/email/Field.test.tsx",
    "to": "packages/react/src/fields/email/Field.test.tsx"
  },
  {
    "from": "packages/react/src/components/fields/email/Field.tsx",
    "to": "packages/react/src/fields/email/Field.tsx"
  },
  {
    "from": "packages/react/src/components/fields/email/columnDef.test.ts",
    "to": "packages/react/src/fields/email/columnDef.test.ts"
  },
  {
    "from": "packages/react/src/components/fields/email/columnDef.tsx",
    "to": "packages/react/src/fields/email/columnDef.tsx"
  },
  {
    "from": "packages/react/src/components/fields/email/index.ts",
    "to": "packages/react/src/fields/email/index.ts"
  },
  {
    "from": "packages/react/src/components/fields/email/testFixture.ts",
    "to": "packages/react/src/fields/email/testFixture.ts"
  },
  {
    "from": "packages/react/src/components/fields/group/Cell.test.tsx",
    "to": "packages/react/src/fields/group/Cell.test.tsx"
  },
  {
    "from": "packages/react/src/components/fields/group/Cell.tsx",
    "to": "packages/react/src/fields/group/Cell.tsx"
  },
  {
    "from": "packages/react/src/components/fields/group/Field.test.tsx",
    "to": "packages/react/src/fields/group/Field.test.tsx"
  },
  {
    "from": "packages/react/src/components/fields/group/Field.tsx",
    "to": "packages/react/src/fields/group/Field.tsx"
  },
  {
    "from": "packages/react/src/components/fields/group/columnDef.test.ts",
    "to": "packages/react/src/fields/group/columnDef.test.ts"
  },
  {
    "from": "packages/react/src/components/fields/group/columnDef.tsx",
    "to": "packages/react/src/fields/group/columnDef.tsx"
  },
  {
    "from": "packages/react/src/components/fields/group/index.ts",
    "to": "packages/react/src/fields/group/index.ts"
  },
  {
    "from": "packages/react/src/components/fields/group/testFixture.ts",
    "to": "packages/react/src/fields/group/testFixture.ts"
  },
  {
    "from": "packages/react/src/components/fields/index.test.tsx",
    "to": "packages/react/src/fields/index.test.tsx"
  },
  {
    "from": "packages/react/src/components/fields/index.tsx",
    "to": "packages/react/src/fields/index.tsx"
  },
  {
    "from": "packages/react/src/components/fields/json/Cell.test.tsx",
    "to": "packages/react/src/fields/json/Cell.test.tsx"
  },
  {
    "from": "packages/react/src/components/fields/json/Cell.tsx",
    "to": "packages/react/src/fields/json/Cell.tsx"
  },
  {
    "from": "packages/react/src/components/fields/json/Field.test.tsx",
    "to": "packages/react/src/fields/json/Field.test.tsx"
  },
  {
    "from": "packages/react/src/components/fields/json/Field.tsx",
    "to": "packages/react/src/fields/json/Field.tsx"
  },
  {
    "from": "packages/react/src/components/fields/json/columnDef.test.ts",
    "to": "packages/react/src/fields/json/columnDef.test.ts"
  },
  {
    "from": "packages/react/src/components/fields/json/columnDef.tsx",
    "to": "packages/react/src/fields/json/columnDef.tsx"
  },
  {
    "from": "packages/react/src/components/fields/json/index.ts",
    "to": "packages/react/src/fields/json/index.ts"
  },
  {
    "from": "packages/react/src/components/fields/json/testFixture.ts",
    "to": "packages/react/src/fields/json/testFixture.ts"
  },
  {
    "from": "packages/react/src/components/fields/json/utils.test.ts",
    "to": "packages/react/src/fields/json/utils.test.ts"
  },
  {
    "from": "packages/react/src/components/fields/json/utils.ts",
    "to": "packages/react/src/fields/json/utils.ts"
  },
  {
    "from": "packages/react/src/components/fields/number/Cell.test.tsx",
    "to": "packages/react/src/fields/number/Cell.test.tsx"
  },
  {
    "from": "packages/react/src/components/fields/number/Cell.tsx",
    "to": "packages/react/src/fields/number/Cell.tsx"
  },
  {
    "from": "packages/react/src/components/fields/number/Field.test.tsx",
    "to": "packages/react/src/fields/number/Field.test.tsx"
  },
  {
    "from": "packages/react/src/components/fields/number/Field.tsx",
    "to": "packages/react/src/fields/number/Field.tsx"
  },
  {
    "from": "packages/react/src/components/fields/number/columnDef.test.ts",
    "to": "packages/react/src/fields/number/columnDef.test.ts"
  },
  {
    "from": "packages/react/src/components/fields/number/columnDef.tsx",
    "to": "packages/react/src/fields/number/columnDef.tsx"
  },
  {
    "from": "packages/react/src/components/fields/number/index.ts",
    "to": "packages/react/src/fields/number/index.ts"
  },
  {
    "from": "packages/react/src/components/fields/number/testFixture.ts",
    "to": "packages/react/src/fields/number/testFixture.ts"
  },
  {
    "from": "packages/react/src/components/fields/readableFields.ts",
    "to": "packages/react/src/fields/readableFields.ts"
  },
  {
    "from": "packages/react/src/components/fields/registry.ts",
    "to": "packages/react/src/fields/registry.ts"
  },
  {
    "from": "packages/react/src/components/fields/relationship/Cell.test.tsx",
    "to": "packages/react/src/fields/relationship/Cell.test.tsx"
  },
  {
    "from": "packages/react/src/components/fields/relationship/Cell.tsx",
    "to": "packages/react/src/fields/relationship/Cell.tsx"
  },
  {
    "from": "packages/react/src/components/fields/relationship/EmptyInput.test.tsx",
    "to": "packages/react/src/fields/relationship/EmptyInput.test.tsx"
  },
  {
    "from": "packages/react/src/components/fields/relationship/EmptyInput.tsx",
    "to": "packages/react/src/fields/relationship/EmptyInput.tsx"
  },
  {
    "from": "packages/react/src/components/fields/relationship/Field.test.tsx",
    "to": "packages/react/src/fields/relationship/Field.test.tsx"
  },
  {
    "from": "packages/react/src/components/fields/relationship/Field.tsx",
    "to": "packages/react/src/fields/relationship/Field.tsx"
  },
  {
    "from": "packages/react/src/components/fields/relationship/FilledInput.test.tsx",
    "to": "packages/react/src/fields/relationship/FilledInput.test.tsx"
  },
  {
    "from": "packages/react/src/components/fields/relationship/FilledInput.tsx",
    "to": "packages/react/src/fields/relationship/FilledInput.tsx"
  },
  {
    "from": "packages/react/src/components/fields/relationship/columnDef.test.ts",
    "to": "packages/react/src/fields/relationship/columnDef.test.ts"
  },
  {
    "from": "packages/react/src/components/fields/relationship/columnDef.tsx",
    "to": "packages/react/src/fields/relationship/columnDef.tsx"
  },
  {
    "from": "packages/react/src/components/fields/relationship/index.ts",
    "to": "packages/react/src/fields/relationship/index.ts"
  },
  {
    "from": "packages/react/src/components/fields/relationship/preview.tsx",
    "to": "packages/react/src/fields/relationship/preview.tsx"
  },
  {
    "from": "packages/react/src/components/fields/relationship/testFixture.ts",
    "to": "packages/react/src/fields/relationship/testFixture.ts"
  },
  {
    "from": "packages/react/src/components/fields/relationship/types.ts",
    "to": "packages/react/src/fields/relationship/types.ts"
  },
  {
    "from": "packages/react/src/components/fields/relationship/utils.ts",
    "to": "packages/react/src/fields/relationship/utils.ts"
  },
  {
    "from": "packages/react/src/components/fields/richtext/Cell.test.tsx",
    "to": "packages/react/src/fields/richtext/Cell.test.tsx"
  },
  {
    "from": "packages/react/src/components/fields/richtext/Cell.tsx",
    "to": "packages/react/src/fields/richtext/Cell.tsx"
  },
  {
    "from": "packages/react/src/components/fields/richtext/Field.test.tsx",
    "to": "packages/react/src/fields/richtext/Field.test.tsx"
  },
  {
    "from": "packages/react/src/components/fields/richtext/Field.tsx",
    "to": "packages/react/src/fields/richtext/Field.tsx"
  },
  {
    "from": "packages/react/src/components/fields/richtext/columnDef.test.ts",
    "to": "packages/react/src/fields/richtext/columnDef.test.ts"
  },
  {
    "from": "packages/react/src/components/fields/richtext/columnDef.tsx",
    "to": "packages/react/src/fields/richtext/columnDef.tsx"
  },
  {
    "from": "packages/react/src/components/fields/richtext/index.ts",
    "to": "packages/react/src/fields/richtext/index.ts"
  },
  {
    "from": "packages/react/src/components/fields/richtext/testFixture.ts",
    "to": "packages/react/src/fields/richtext/testFixture.ts"
  },
  {
    "from": "packages/react/src/components/fields/row/Field.test.tsx",
    "to": "packages/react/src/fields/row/Field.test.tsx"
  },
  {
    "from": "packages/react/src/components/fields/row/Field.tsx",
    "to": "packages/react/src/fields/row/Field.tsx"
  },
  {
    "from": "packages/react/src/components/fields/select/Cell.test.tsx",
    "to": "packages/react/src/fields/select/Cell.test.tsx"
  },
  {
    "from": "packages/react/src/components/fields/select/Cell.tsx",
    "to": "packages/react/src/fields/select/Cell.tsx"
  },
  {
    "from": "packages/react/src/components/fields/select/Field.test.tsx",
    "to": "packages/react/src/fields/select/Field.test.tsx"
  },
  {
    "from": "packages/react/src/components/fields/select/Field.tsx",
    "to": "packages/react/src/fields/select/Field.tsx"
  },
  {
    "from": "packages/react/src/components/fields/select/columnDef.test.ts",
    "to": "packages/react/src/fields/select/columnDef.test.ts"
  },
  {
    "from": "packages/react/src/components/fields/select/columnDef.tsx",
    "to": "packages/react/src/fields/select/columnDef.tsx"
  },
  {
    "from": "packages/react/src/components/fields/select/index.ts",
    "to": "packages/react/src/fields/select/index.ts"
  },
  {
    "from": "packages/react/src/components/fields/select/testFixture.ts",
    "to": "packages/react/src/fields/select/testFixture.ts"
  },
  {
    "from": "packages/react/src/components/fields/select/utils.ts",
    "to": "packages/react/src/fields/select/utils.ts"
  },
  {
    "from": "packages/react/src/components/fields/tabs/Field.test.tsx",
    "to": "packages/react/src/fields/tabs/Field.test.tsx"
  },
  {
    "from": "packages/react/src/components/fields/tabs/Field.tsx",
    "to": "packages/react/src/fields/tabs/Field.tsx"
  },
  {
    "from": "packages/react/src/components/fields/text/Cell.test.tsx",
    "to": "packages/react/src/fields/text/Cell.test.tsx"
  },
  {
    "from": "packages/react/src/components/fields/text/Cell.tsx",
    "to": "packages/react/src/fields/text/Cell.tsx"
  },
  {
    "from": "packages/react/src/components/fields/text/Field.test.tsx",
    "to": "packages/react/src/fields/text/Field.test.tsx"
  },
  {
    "from": "packages/react/src/components/fields/text/Field.tsx",
    "to": "packages/react/src/fields/text/Field.tsx"
  },
  {
    "from": "packages/react/src/components/fields/text/columnDef.test.ts",
    "to": "packages/react/src/fields/text/columnDef.test.ts"
  },
  {
    "from": "packages/react/src/components/fields/text/columnDef.tsx",
    "to": "packages/react/src/fields/text/columnDef.tsx"
  },
  {
    "from": "packages/react/src/components/fields/text/index.ts",
    "to": "packages/react/src/fields/text/index.ts"
  },
  {
    "from": "packages/react/src/components/fields/text/testFixture.ts",
    "to": "packages/react/src/fields/text/testFixture.ts"
  },
  {
    "from": "packages/react/src/components/fields/textarea/Cell.test.tsx",
    "to": "packages/react/src/fields/textarea/Cell.test.tsx"
  },
  {
    "from": "packages/react/src/components/fields/textarea/Cell.tsx",
    "to": "packages/react/src/fields/textarea/Cell.tsx"
  },
  {
    "from": "packages/react/src/components/fields/textarea/Field.test.tsx",
    "to": "packages/react/src/fields/textarea/Field.test.tsx"
  },
  {
    "from": "packages/react/src/components/fields/textarea/Field.tsx",
    "to": "packages/react/src/fields/textarea/Field.tsx"
  },
  {
    "from": "packages/react/src/components/fields/textarea/columnDef.test.ts",
    "to": "packages/react/src/fields/textarea/columnDef.test.ts"
  },
  {
    "from": "packages/react/src/components/fields/textarea/columnDef.tsx",
    "to": "packages/react/src/fields/textarea/columnDef.tsx"
  },
  {
    "from": "packages/react/src/components/fields/textarea/index.ts",
    "to": "packages/react/src/fields/textarea/index.ts"
  },
  {
    "from": "packages/react/src/components/fields/textarea/testFixture.ts",
    "to": "packages/react/src/fields/textarea/testFixture.ts"
  },
  {
    "from": "packages/react/src/components/fields/ui/Field.test.tsx",
    "to": "packages/react/src/fields/ui/Field.test.tsx"
  },
  {
    "from": "packages/react/src/components/fields/ui/Field.tsx",
    "to": "packages/react/src/fields/ui/Field.tsx"
  },
  {
    "from": "packages/react/src/components/fields/upload/Cell.test.tsx",
    "to": "packages/react/src/fields/upload/Cell.test.tsx"
  },
  {
    "from": "packages/react/src/components/fields/upload/Cell.tsx",
    "to": "packages/react/src/fields/upload/Cell.tsx"
  },
  {
    "from": "packages/react/src/components/fields/upload/EmptyInput.tsx",
    "to": "packages/react/src/fields/upload/EmptyInput.tsx"
  },
  {
    "from": "packages/react/src/components/fields/upload/Field.test.tsx",
    "to": "packages/react/src/fields/upload/Field.test.tsx"
  },
  {
    "from": "packages/react/src/components/fields/upload/Field.tsx",
    "to": "packages/react/src/fields/upload/Field.tsx"
  },
  {
    "from": "packages/react/src/components/fields/upload/FilledInput.tsx",
    "to": "packages/react/src/fields/upload/FilledInput.tsx"
  },
  {
    "from": "packages/react/src/components/fields/upload/columnDef.test.ts",
    "to": "packages/react/src/fields/upload/columnDef.test.ts"
  },
  {
    "from": "packages/react/src/components/fields/upload/columnDef.tsx",
    "to": "packages/react/src/fields/upload/columnDef.tsx"
  },
  {
    "from": "packages/react/src/components/fields/upload/index.ts",
    "to": "packages/react/src/fields/upload/index.ts"
  },
  {
    "from": "packages/react/src/components/fields/upload/testFixture.ts",
    "to": "packages/react/src/fields/upload/testFixture.ts"
  },
  {
    "from": "packages/react/src/components/fields/upload/utils.ts",
    "to": "packages/react/src/fields/upload/utils.ts"
  },
  {
    "from": "packages/react/src/components/fields/url/Cell.test.tsx",
    "to": "packages/react/src/fields/url/Cell.test.tsx"
  },
  {
    "from": "packages/react/src/components/fields/url/Cell.tsx",
    "to": "packages/react/src/fields/url/Cell.tsx"
  },
  {
    "from": "packages/react/src/components/fields/url/Field.test.tsx",
    "to": "packages/react/src/fields/url/Field.test.tsx"
  },
  {
    "from": "packages/react/src/components/fields/url/Field.tsx",
    "to": "packages/react/src/fields/url/Field.tsx"
  },
  {
    "from": "packages/react/src/components/fields/url/columnDef.test.ts",
    "to": "packages/react/src/fields/url/columnDef.test.ts"
  },
  {
    "from": "packages/react/src/components/fields/url/columnDef.tsx",
    "to": "packages/react/src/fields/url/columnDef.tsx"
  },
  {
    "from": "packages/react/src/components/fields/url/index.ts",
    "to": "packages/react/src/fields/url/index.ts"
  },
  {
    "from": "packages/react/src/components/fields/url/testFixture.ts",
    "to": "packages/react/src/fields/url/testFixture.ts"
  },
  {
    "from": "packages/react/src/components/relationship/RelationshipDocumentList.test.tsx",
    "to": "packages/react/src/fields/relationship/RelationshipDocumentList.test.tsx"
  },
  {
    "from": "packages/react/src/components/relationship/RelationshipDocumentList.tsx",
    "to": "packages/react/src/fields/relationship/RelationshipDocumentList.tsx"
  },
  {
    "from": "packages/react/src/components/relationship/RelationshipPicker.test.tsx",
    "to": "packages/react/src/fields/relationship/RelationshipPicker.test.tsx"
  },
  {
    "from": "packages/react/src/components/relationship/RelationshipPicker.tsx",
    "to": "packages/react/src/fields/relationship/RelationshipPicker.tsx"
  },
  {
    "from": "packages/react/src/components/relationship/index.ts",
    "to": "packages/react/src/fields/relationship/index.ts"
  },
  {
    "from": "packages/react/src/hooks/useBlockClipboard.test.ts",
    "to": "packages/react/src/fields/blocks/useBlockClipboard.test.ts"
  },
  {
    "from": "packages/react/src/hooks/useBlockClipboard.ts",
    "to": "packages/react/src/fields/blocks/useBlockClipboard.ts"
  },
  {
    "from": "packages/react/src/hooks/useFieldCondition.test.tsx",
    "to": "packages/react/src/fields/useFieldCondition.test.tsx"
  },
  {
    "from": "packages/react/src/hooks/useFieldCondition.ts",
    "to": "packages/react/src/fields/useFieldCondition.ts"
  },
  {
    "from": "packages/react/src/hooks/useFieldControlOverride.ts",
    "to": "packages/react/src/fields/useFieldControlOverride.ts"
  },
  {
    "from": "packages/react/src/hooks/useFieldMask.test.ts",
    "to": "packages/react/src/fields/useFieldMask.test.ts"
  },
  {
    "from": "packages/react/src/hooks/useFieldMask.ts",
    "to": "packages/react/src/fields/useFieldMask.ts"
  },
  {
    "from": "packages/react/src/hooks/useFieldsForm.test.ts",
    "to": "packages/react/src/fields/useFieldsForm.test.ts"
  },
  {
    "from": "packages/react/src/hooks/useFieldsForm.ts",
    "to": "packages/react/src/fields/useFieldsForm.ts"
  },
  {
    "from": "packages/react/src/hooks/useLiveFieldMerge.test.tsx",
    "to": "packages/react/src/fields/useLiveFieldMerge.test.tsx"
  },
  {
    "from": "packages/react/src/hooks/useLiveFieldMerge.ts",
    "to": "packages/react/src/fields/useLiveFieldMerge.ts"
  },
  {
    "from": "packages/react/src/hooks/useVexForm.test.tsx",
    "to": "packages/react/src/forms/useVexForm.test.tsx"
  },
  {
    "from": "packages/react/src/hooks/useVexForm.ts",
    "to": "packages/react/src/forms/useVexForm.ts"
  },
  {
    "from": "packages/react/src/hooks/useVisibleFields.ts",
    "to": "packages/react/src/fields/useVisibleFields.ts"
  }
]
```

#### packages/react/src/fields/relationship/index.ts
After the move, merge the two pre-existing barrels (`components/relationship/index.ts`'s
`RelationshipPicker`/`RelationshipDocumentList` exports into `components/fields/relationship/index.ts`'s
`Field`/`Cell`/`columnDef`/`testFixture` exports) into one `fields/relationship/index.ts`; the
second file (now empty) is deleted.

No other non-relative edits.


### Step 18 — `collections/`, `globals/`, `versions/`, `media/`, incl. client ops [agent]
Why: decisions 18–19; the four document-shaped domains, each gaining its own `api/<op>/client.ts`
beside the `server.ts` core already writes there, mirroring core's own domain-folder shape.
Verify: `node scripts/move-modules.mjs --dry-run <mapping>` matches the listed edits; `pnpm --filter @vexcms/react typecheck && pnpm --filter @vexcms/react test`
- [ ] `node scripts/move-modules.mjs step18-mapping.json` run against the mapping below
- [ ] `pnpm --filter @vexcms/react typecheck && pnpm --filter @vexcms/react test` green

#### Mapping — `collections/`, `globals/`, `versions/`, `media/`
Client operations move beside their domain: `client/{find,get,search,create,update,remove}/client.ts`
and `client/whereArg.ts` become `collections/api/<op>/client.ts` / `collections/api/whereArg.ts`;
`client/globals/<op>.client.ts` becomes `globals/api/<op>/client.ts`; `client/versions/<op>.client.ts`
becomes `versions/api/<op>/client.ts`. `components/views/{CollectionEditView,CollectionListView}`
and `components/modals/{CreateDocumentForm,CreateDocumentModal}` (+ tests) become `collections/`,
alongside `usePaginatedQuery`/`usePaginatedSearch`/`useTableSelection`.
`components/views/{GlobalEditView,GlobalsListView}` become `globals/`. `components/drafts/**`
(`DraftToolbar`, `StatusBadge`, `VersionHistoryDropdown`, `index.ts`), `useAutosave`,
`useResetWhenSaved`, and `components/views/DocumentTimestamps.tsx` (shared by both
`CollectionEditView` and `GlobalEditView` — placed with the version/document-metadata domain
rather than either collection, since it belongs to neither alone; see the import-graph note
below) become `versions/`. `components/media/**`, `components/views/{MediaCollectionEditView,
MediaCollectionListView}`, and `components/modals/CreateMediaModal` (+ tests) become `media/`. Run:

```bash
node scripts/move-modules.mjs step18-mapping.json
```

```json
[
  {
    "from": "packages/react/src/client/create/client.ts",
    "to": "packages/react/src/collections/api/create/client.ts"
  },
  {
    "from": "packages/react/src/client/find/client.ts",
    "to": "packages/react/src/collections/api/find/client.ts"
  },
  {
    "from": "packages/react/src/client/get/client.ts",
    "to": "packages/react/src/collections/api/get/client.ts"
  },
  {
    "from": "packages/react/src/client/globals/find.client.ts",
    "to": "packages/react/src/globals/api/find/client.ts"
  },
  {
    "from": "packages/react/src/client/globals/get.client.ts",
    "to": "packages/react/src/globals/api/get/client.ts"
  },
  {
    "from": "packages/react/src/client/globals/upsert.client.ts",
    "to": "packages/react/src/globals/api/upsert/client.ts"
  },
  {
    "from": "packages/react/src/client/remove/client.ts",
    "to": "packages/react/src/collections/api/remove/client.ts"
  },
  {
    "from": "packages/react/src/client/search/client.ts",
    "to": "packages/react/src/collections/api/search/client.ts"
  },
  {
    "from": "packages/react/src/client/update/client.ts",
    "to": "packages/react/src/collections/api/update/client.ts"
  },
  {
    "from": "packages/react/src/client/versions/deleteVersion.client.ts",
    "to": "packages/react/src/versions/api/deleteVersion/client.ts"
  },
  {
    "from": "packages/react/src/client/versions/getVersionSnapshot.client.ts",
    "to": "packages/react/src/versions/api/getVersionSnapshot/client.ts"
  },
  {
    "from": "packages/react/src/client/versions/listVersions.client.ts",
    "to": "packages/react/src/versions/api/listVersions/client.ts"
  },
  {
    "from": "packages/react/src/client/versions/publish.client.ts",
    "to": "packages/react/src/versions/api/publish/client.ts"
  },
  {
    "from": "packages/react/src/client/versions/saveDraft.client.ts",
    "to": "packages/react/src/versions/api/saveDraft/client.ts"
  },
  {
    "from": "packages/react/src/client/versions/unpublish.client.ts",
    "to": "packages/react/src/versions/api/unpublish/client.ts"
  },
  {
    "from": "packages/react/src/client/whereArg.ts",
    "to": "packages/react/src/collections/api/whereArg.ts"
  },
  {
    "from": "packages/react/src/components/drafts/DraftToolbar.tsx",
    "to": "packages/react/src/versions/DraftToolbar.tsx"
  },
  {
    "from": "packages/react/src/components/drafts/StatusBadge.test.tsx",
    "to": "packages/react/src/versions/StatusBadge.test.tsx"
  },
  {
    "from": "packages/react/src/components/drafts/StatusBadge.tsx",
    "to": "packages/react/src/versions/StatusBadge.tsx"
  },
  {
    "from": "packages/react/src/components/drafts/VersionHistoryDropdown.test.tsx",
    "to": "packages/react/src/versions/VersionHistoryDropdown.test.tsx"
  },
  {
    "from": "packages/react/src/components/drafts/VersionHistoryDropdown.tsx",
    "to": "packages/react/src/versions/VersionHistoryDropdown.tsx"
  },
  {
    "from": "packages/react/src/components/drafts/index.ts",
    "to": "packages/react/src/versions/index.ts"
  },
  {
    "from": "packages/react/src/components/media/FilePreview.test.tsx",
    "to": "packages/react/src/media/FilePreview.test.tsx"
  },
  {
    "from": "packages/react/src/components/media/FilePreview.tsx",
    "to": "packages/react/src/media/FilePreview.tsx"
  },
  {
    "from": "packages/react/src/components/media/MediaLibaryGrid.test.tsx",
    "to": "packages/react/src/media/MediaLibaryGrid.test.tsx"
  },
  {
    "from": "packages/react/src/components/media/MediaLibaryGrid.tsx",
    "to": "packages/react/src/media/MediaLibaryGrid.tsx"
  },
  {
    "from": "packages/react/src/components/media/MediaPicker.test.tsx",
    "to": "packages/react/src/media/MediaPicker.test.tsx"
  },
  {
    "from": "packages/react/src/components/media/MediaPicker.tsx",
    "to": "packages/react/src/media/MediaPicker.tsx"
  },
  {
    "from": "packages/react/src/components/media/MediaUploadDropzone.test.tsx",
    "to": "packages/react/src/media/MediaUploadDropzone.test.tsx"
  },
  {
    "from": "packages/react/src/components/media/MediaUploadDropzone.tsx",
    "to": "packages/react/src/media/MediaUploadDropzone.tsx"
  },
  {
    "from": "packages/react/src/components/media/MediaUploadForm.test.tsx",
    "to": "packages/react/src/media/MediaUploadForm.test.tsx"
  },
  {
    "from": "packages/react/src/components/media/MediaUploadForm.tsx",
    "to": "packages/react/src/media/MediaUploadForm.tsx"
  },
  {
    "from": "packages/react/src/components/media/index.ts",
    "to": "packages/react/src/media/index.ts"
  },
  {
    "from": "packages/react/src/components/modals/CreateDocumentForm.test.tsx",
    "to": "packages/react/src/collections/CreateDocumentForm.test.tsx"
  },
  {
    "from": "packages/react/src/components/modals/CreateDocumentForm.tsx",
    "to": "packages/react/src/collections/CreateDocumentForm.tsx"
  },
  {
    "from": "packages/react/src/components/modals/CreateDocumentModal.test.tsx",
    "to": "packages/react/src/collections/CreateDocumentModal.test.tsx"
  },
  {
    "from": "packages/react/src/components/modals/CreateDocumentModal.tsx",
    "to": "packages/react/src/collections/CreateDocumentModal.tsx"
  },
  {
    "from": "packages/react/src/components/modals/CreateMediaModal.test.tsx",
    "to": "packages/react/src/media/CreateMediaModal.test.tsx"
  },
  {
    "from": "packages/react/src/components/modals/CreateMediaModal.tsx",
    "to": "packages/react/src/media/CreateMediaModal.tsx"
  },
  {
    "from": "packages/react/src/components/views/CollectionEditView.test.tsx",
    "to": "packages/react/src/collections/CollectionEditView.test.tsx"
  },
  {
    "from": "packages/react/src/components/views/CollectionEditView.tsx",
    "to": "packages/react/src/collections/CollectionEditView.tsx"
  },
  {
    "from": "packages/react/src/components/views/CollectionListView.test.tsx",
    "to": "packages/react/src/collections/CollectionListView.test.tsx"
  },
  {
    "from": "packages/react/src/components/views/CollectionListView.tsx",
    "to": "packages/react/src/collections/CollectionListView.tsx"
  },
  {
    "from": "packages/react/src/components/views/DocumentTimestamps.tsx",
    "to": "packages/react/src/versions/DocumentTimestamps.tsx"
  },
  {
    "from": "packages/react/src/components/views/GlobalEditView.test.tsx",
    "to": "packages/react/src/globals/GlobalEditView.test.tsx"
  },
  {
    "from": "packages/react/src/components/views/GlobalEditView.tsx",
    "to": "packages/react/src/globals/GlobalEditView.tsx"
  },
  {
    "from": "packages/react/src/components/views/GlobalsListView.test.tsx",
    "to": "packages/react/src/globals/GlobalsListView.test.tsx"
  },
  {
    "from": "packages/react/src/components/views/GlobalsListView.tsx",
    "to": "packages/react/src/globals/GlobalsListView.tsx"
  },
  {
    "from": "packages/react/src/components/views/MediaCollectionEditView.test.tsx",
    "to": "packages/react/src/media/MediaCollectionEditView.test.tsx"
  },
  {
    "from": "packages/react/src/components/views/MediaCollectionEditView.tsx",
    "to": "packages/react/src/media/MediaCollectionEditView.tsx"
  },
  {
    "from": "packages/react/src/components/views/MediaCollectionListView.test.tsx",
    "to": "packages/react/src/media/MediaCollectionListView.test.tsx"
  },
  {
    "from": "packages/react/src/components/views/MediaCollectionListView.tsx",
    "to": "packages/react/src/media/MediaCollectionListView.tsx"
  },
  {
    "from": "packages/react/src/hooks/useAutosave.test.tsx",
    "to": "packages/react/src/versions/useAutosave.test.tsx"
  },
  {
    "from": "packages/react/src/hooks/useAutosave.tsx",
    "to": "packages/react/src/versions/useAutosave.tsx"
  },
  {
    "from": "packages/react/src/hooks/usePaginatedQuery.test.tsx",
    "to": "packages/react/src/collections/usePaginatedQuery.test.tsx"
  },
  {
    "from": "packages/react/src/hooks/usePaginatedQuery.ts",
    "to": "packages/react/src/collections/usePaginatedQuery.ts"
  },
  {
    "from": "packages/react/src/hooks/usePaginatedSearch.test.tsx",
    "to": "packages/react/src/collections/usePaginatedSearch.test.tsx"
  },
  {
    "from": "packages/react/src/hooks/usePaginatedSearch.ts",
    "to": "packages/react/src/collections/usePaginatedSearch.ts"
  },
  {
    "from": "packages/react/src/hooks/useResetWhenSaved.test.tsx",
    "to": "packages/react/src/versions/useResetWhenSaved.test.tsx"
  },
  {
    "from": "packages/react/src/hooks/useResetWhenSaved.ts",
    "to": "packages/react/src/versions/useResetWhenSaved.ts"
  },
  {
    "from": "packages/react/src/hooks/useTableSelection.test.tsx",
    "to": "packages/react/src/collections/useTableSelection.test.tsx"
  },
  {
    "from": "packages/react/src/hooks/useTableSelection.ts",
    "to": "packages/react/src/collections/useTableSelection.ts"
  }
]
```

#### Non-relative edits
- `packages/react/src/client/index.ts` — its own `export * from "./<op>/client"` /
  `export * from "./globals/<op>.client"` / `export * from "./versions/<op>.client"` lines are
  relative imports into files this step moves, so `scripts/move-modules.mjs` rewrites them to
  `../collections/api/<op>/client`, `../globals/api/<op>/client`, `../versions/api/<op>/client`
  automatically — confirm the resulting file re-exports the same public names, since `./client`
  is a published entry (`package.json` `exports["./client"]`, unaffected by this step's path
  change, still `./src/client/index.ts`).
- `packages/react/src/index.ts`'s field-component export block already points at `./fields`
  (steps 14/17); no further edit here.

#### Import-graph note — `DocumentTimestamps.tsx`
Both `CollectionEditView.tsx` and `GlobalEditView.tsx` import `DocumentTimestamps` (grep
confirms both, pre-move `../form/DocumentTimestamps`). It renders `creationTime`, the same
document metadata `DraftToolbar`/`StatusBadge` already render in `versions/` — placed there
rather than invented a split copy per collection/global, or a new cross-feature folder for one
two-import component.


### Step 19 — `admin/` + leftover hooks; barrels, deletions, `harness struct` [agent]
Why: decision 18; the last domain folder, the hooks no feature owns, and the manual cleanup the
mechanical moves (steps 15–18) could not do themselves — new top-level folders need their own
freshly-authored `index.ts`, the old cross-cutting barrels they replace are deleted, and the
emptied `components/`, `context/`, `lib/`, `styles/` directories go with them.
Verify: `pnpm --filter @vexcms/react typecheck && pnpm --filter @vexcms/react test && harness struct --check`
- [ ] `node scripts/move-modules.mjs step19-mapping.json` run against the mapping below
- [ ] every new top-level folder's `index.ts` authored (`access/`, `auth/`, `config/`, `utils/`,
      `slots/` unchanged, `modals/` trimmed, `livePreview/`, `revalidate/`, `fields/` unchanged,
      `collections/`, `globals/`, `versions/` extended, `media/` extended, `admin/`) — each
      re-exports what the stale barrel(s) it replaces exported for its own members, nothing else
- [ ] stale barrels deleted: `hooks/index.ts` (trimmed to re-export only `use-mobile.ts`/
      `useVexMutation.ts`, the two hooks no feature owns), `context/index.ts`,
      `components/index.ts`, `components/types.ts`, `components/views/index.tsx`,
      `components/modals/index.tsx` (the last two superseded by the feature folders their
      members moved into)
- [ ] `components/`, `context/`, `lib/`, `styles/` deleted — empty after the above
- [ ] `packages/react/src/index.ts` re-export paths confirmed pointing at the new top-level
      folders (already rewritten by steps 15–18's script runs against this unmoved file; this
      item is a verification pass, not new edits)
- [ ] `testing/**` imports into the moved tree confirmed rewritten (same — `testing/` itself
      stays at the root per decision 18, its outgoing imports into the moved files were rewritten
      by steps 15–18 since `testing/**` was never itself a move target)
- [ ] `.agent/docs/standards/naming-conventions.md` — every rule `scope` that read
      `packages/react/src/components/**` (or a `components/<X>/**` subpath) narrowed/repointed to
      the matching top-level folder (`react-components-pascal` → `packages/react/src/ui/**` +
      every feature folder's own components, `react-field-module` → `packages/react/src/fields/*/**`,
      `react-app-form` → `packages/react/src/forms/**`), so `harness struct --check` passes
      against the new tree; the new `react-feature-folders` rule itself is added in step 20,
      alongside the rest of pass 1's known-violations cleanup

#### Mapping — `admin/` + leftover hooks
`components/{AdminLayout,AdminSidebar,AdminTopNav}` (+ tests), `components/views/{DashboardView,
UnauthorizedView,utils.ts}` (+ tests), `hooks/usePreservedScrollTop` (+ test), and `utils/adminHref.ts` (+ test, already at that path on disk today — `utils/` is not a
pass-1 waypoint for it, decision 18 names `admin/` as its one destination) become `admin/`. Run:

```bash
node scripts/move-modules.mjs step19-mapping.json
```

```json
[
  {
    "from": "packages/react/src/components/AdminLayout.test.tsx",
    "to": "packages/react/src/admin/AdminLayout.test.tsx"
  },
  {
    "from": "packages/react/src/components/AdminLayout.tsx",
    "to": "packages/react/src/admin/AdminLayout.tsx"
  },
  {
    "from": "packages/react/src/components/AdminSidebar.test.tsx",
    "to": "packages/react/src/admin/AdminSidebar.test.tsx"
  },
  {
    "from": "packages/react/src/components/AdminSidebar.tsx",
    "to": "packages/react/src/admin/AdminSidebar.tsx"
  },
  {
    "from": "packages/react/src/components/AdminTopNav.test.tsx",
    "to": "packages/react/src/admin/AdminTopNav.test.tsx"
  },
  {
    "from": "packages/react/src/components/AdminTopNav.tsx",
    "to": "packages/react/src/admin/AdminTopNav.tsx"
  },
  {
    "from": "packages/react/src/components/views/DashboardView.test.tsx",
    "to": "packages/react/src/admin/DashboardView.test.tsx"
  },
  {
    "from": "packages/react/src/components/views/DashboardView.tsx",
    "to": "packages/react/src/admin/DashboardView.tsx"
  },
  {
    "from": "packages/react/src/components/views/UnauthorizedView.test.tsx",
    "to": "packages/react/src/admin/UnauthorizedView.test.tsx"
  },
  {
    "from": "packages/react/src/components/views/UnauthorizedView.tsx",
    "to": "packages/react/src/admin/UnauthorizedView.tsx"
  },
  {
    "from": "packages/react/src/components/views/utils.test.ts",
    "to": "packages/react/src/admin/utils.test.ts"
  },
  {
    "from": "packages/react/src/components/views/utils.ts",
    "to": "packages/react/src/admin/utils.ts"
  },
  {
    "from": "packages/react/src/hooks/usePreservedScrollTop.test.tsx",
    "to": "packages/react/src/admin/usePreservedScrollTop.test.tsx"
  },
  {
    "from": "packages/react/src/hooks/usePreservedScrollTop.ts",
    "to": "packages/react/src/admin/usePreservedScrollTop.ts"
  },
  {
    "from": "packages/react/src/utils/adminHref.test.ts",
    "to": "packages/react/src/admin/adminHref.test.ts"
  },
  {
    "from": "packages/react/src/utils/adminHref.ts",
    "to": "packages/react/src/admin/adminHref.ts"
  }
]
```


### Step 20 — Known violations + rule updates [agent]
Why: pass 1 scope; the flagged names and the stale rules.
Verify: `harness struct --check && pnpm typecheck`
- [ ] `slots/resolveFieldComponent.tsx` / `slots/resolveFieldCellComponent.tsx` → `.ts` if JSX-free, else the rule gains a `resolve*` exemption (decided in the step)
- [ ] `media/MediaLibaryGrid.tsx` → `MediaLibraryGrid.tsx`
- [ ] `naming-conventions.md`: `vexcms-resource-defs` narrowed to `collections/**`, new `vexcms-block-module` rule; `api-operation-split` → `<domain>/api/<op>/server.ts` + `<domain>Api.ts`; `react-field-module` → `Field.tsx`; new `react-app-form` rule; `react-components-pascal` scope repointed off the deleted `components/**`; new `react-feature-folders` rule for the flat top-level layout

**Decision for the first checkbox — resolvers keep `.tsx`, rule gains a `resolve*` exemption.**
Both resolvers return JSX, not just a component reference: `resolveFieldComponent.tsx:39-41`
and `resolveFieldCellComponent.tsx:42-44` each build a `Composed` function whose body is
`return <Override {...p} renderDefault={renderDefault} />;` — real JSX, inside a `.reduce`
callback that runs once per override in the chain. Neither file can become `.ts` without
rewriting that line through `React.createElement`, which is a behaviour-preserving but
needless churn `preferences.md` gives no reason to pay for. The fix is the rule, not the
files: `react-components-pascal` exempts `create[A-Z]...` factories but not `resolve[A-Z]...`
resolvers that return a `ComponentType`, which is exactly the shape of these two plus any
future `resolve*` the override system grows.

#### .agent/docs/standards/naming-conventions.md
1 edit, anchored on the `react-components-pascal` rule block (`id: react-components-pascal`).

**1 — widen the `pattern` to admit `resolve[A-Z]...` alongside `create[A-Z]...`, and name both in the description/examples.**

```yaml
  - id: react-components-pascal
    pattern: '^([A-Z][A-Za-z0-9]*|index|create[A-Z][A-Za-z0-9]*|resolve[A-Z][A-Za-z0-9]*)\.tsx$|^[a-zA-Z][A-Za-z0-9]*\.ts$'
    scope: ["packages/react/src/components/**/*.tsx", "!packages/react/src/components/ui/**", "!packages/react/src/fields/**", "packages/next/src/**/*.tsx"]
    description: React component files are PascalCase named after their default export; `create*` factories and `resolve*` component resolvers (functions returning a `ComponentType`, composing an override chain with JSX) keep their camelCase names.
    examples: ["AdminLayout.tsx", "CollectionListView.tsx", "MediaPicker.tsx", "resolveFieldComponent.tsx"]
    counter_examples: ["admin-layout.tsx", "collectionListView.tsx"]
```

**Rename: `MediaLibaryGrid.tsx` → `MediaLibraryGrid.tsx`.**
The export names are already correct (`MediaLibraryGridProps`, `MediaLibraryGrid` —
`MediaLibaryGrid.tsx:27,83`); only the file path and three string literals carry the typo.

```bash
git mv packages/react/src/media/MediaLibaryGrid.tsx packages/react/src/media/MediaLibraryGrid.tsx
git mv packages/react/src/media/MediaLibaryGrid.test.tsx packages/react/src/media/MediaLibraryGrid.test.tsx
```

#### packages/react/src/media/MediaPicker.tsx
1 edit, anchored on the existing import.

**1 — import path.** `import { MediaLibraryGrid } from "./MediaLibaryGrid";` →
```ts
import { MediaLibraryGrid } from "./MediaLibraryGrid";
```

#### packages/react/src/testing/mediaSuite.tsx
4 edits; everything else unchanged.

**1 — import path**, replacing `../media/MediaLibaryGrid`:
```ts
import { MediaLibraryGrid } from "../media/MediaLibraryGrid";
```

**2 — `MediaSuiteMember` union** (`:26`), drop the typo'd literal and its stale doc comment:
```ts
/** Member names {@link runMediaSuite}'s `only` option accepts. */
export type MediaSuiteMember = "FilePreview" | "MediaLibraryGrid" | "MediaUploadDropzone";
```

**3 — `describeMediaLibraryGrid`'s `describe` label** (`:234`), drop the parenthetical that
only existed to flag the typo:
```ts
describe("MediaLibraryGrid", () => {
```

**4 — `runMediaSuite`'s default `only` array and the two membership checks** (`:725,727`):
```ts
    props.only ?? ["FilePreview", "MediaLibraryGrid", "MediaUploadDropzone"];
  if (members.includes("FilePreview")) describeFilePreview();
  if (members.includes("MediaLibraryGrid")) describeMediaLibraryGrid(props.access);
```

#### packages/react/src/media/MediaLibraryGrid.test.tsx
Renamed from `MediaLibaryGrid.test.tsx`; 1 edit — the `only` filter string.
```ts
import { runMediaSuite } from "../../testing/mediaSuite";

runMediaSuite({ only: ["MediaLibraryGrid"] });
```

#### packages/react/src/testing/index.ts
1 edit — the doc-comment list at `:100` drops the typo'd member name (`MediaLibaryGrid` → `MediaLibraryGrid`); no code changes.

> Note: `apps/test/src/vexcms/blocks/logo-cloud.ts` does not exist. Every block definition in
> `apps/test/src/vexcms/blocks/` is a PascalCase directory (`CTA/`, `Hero/`, `LogoCloud/`, …)
> holding `config.ts` + `index.tsx`, confirmed by `ls apps/test/src/vexcms/blocks/` (14 such
> directories, none a bare `.ts` file) and by the only `logo-cloud` string left in the
> tree being the `blockType: "logo-cloud"` data literal (`vex.types.ts:185`,
> `convex/vex.schema.ts:191`) and the registry key (`blocks/index.ts:59`) — field data, not a
> filename, and out of scope for a naming rule. The launch plan's finding (§ K, Finding 3) and
> the `naming-conventions.md` "Known inconsistencies" entry both describe a tree state that
> predates the block restructuring; there is nothing left to rename. The checkbox is void.
>
> The real violation hiding under it: `vexcms-resource-defs` (`naming-conventions.md:96-101`)
> still scopes `apps/test/src/vexcms/blocks/**` as camelCase-flat (`blocks/stats.ts`), but
> every block is now a directory-per-block with `config.ts` + `index.tsx` — the collections
> half of the rule's scope is still accurate (`collections/*.ts` are flat camelCase files,
> confirmed by `ls apps/test/src/vexcms/collections/`), only the blocks half drifted. The fix:
> narrow `vexcms-resource-defs` to `collections/**` only, and add a `vexcms-block-module` rule
> for the directory-per-block shape, mirroring `react-field-module`'s per-type-folder pattern.

#### .agent/docs/standards/naming-conventions.md (continued)
1 edit, anchored on the `vexcms-resource-defs` rule block.

**2 — narrow scope to collections only; add `vexcms-block-module`.**
```yaml
  - id: vexcms-resource-defs
    pattern: '^[a-z][a-zA-Z0-9-]*\.ts$'
    scope: ["apps/test/src/vexcms/collections/**"]
    description: Collection definitions are camelCase resource names (no PascalCase, no type suffixes). Preferred camelCase; kebab tolerated for legacy files pending rename.
    examples: ["collections/pages.ts", "collections/siteSettings.ts"]
    counter_examples: ["collections/PageCollection.ts"]
  - id: vexcms-block-module
    pattern: '^(config|index|constants)\.(ts|tsx)$'
    scope: ["apps/test/src/vexcms/blocks/*/**"]
    description: Each block is a PascalCase directory (named for the block, matching its `blockType` literal in title case) holding config.ts (the defineBlock() call) and index.tsx (the renderer); blocks/config.ts and blocks/index.ts at the top level only aggregate.
    examples: ["blocks/LogoCloud/config.ts", "blocks/LogoCloud/index.tsx", "blocks/Hero/config.ts"]
    counter_examples: ["blocks/logo-cloud.ts", "blocks/LogoCloud/LogoCloudConfig.ts"]
```

Remove the three-item "Known inconsistencies" list at the end of `naming-conventions.md`
(`:116-120`) — `MediaLibaryGrid.tsx` is renamed above, `logo-cloud.ts` never existed as
described, and `use-mobile.ts` already has its own exemption inside `hooks-camel-use`
(`:31`, "shadcn-generated hooks … keep kebab-case") so it was never an open item.

**3 — rewrite `api-operation-split` for the post-K tree (steps 3–7 landed the moved files).**
```yaml
  - id: api-operation-split
    pattern: '^[a-z][A-Za-z0-9]*Api\.ts$|^(server|types|index)(\.test)?\.ts$|^[a-z][A-Za-z0-9]*\.(ts)$'
    scope: ["packages/core/src/*/api/**"]
    description: Each domain's api/ folder holds one <op>/server.ts (+ server.test.ts) per operation, a <domain>Api.ts factory named after its export, and an index.ts that only re-exports. A types.ts holds arg/result types shared across that domain's operations.
    examples: ["collections/api/find/server.ts", "globals/api/upsert/server.ts", "versions/api/publish/server.ts", "media/api/mediaApi.ts"]
    counter_examples: ["collections/api/find.server.ts", "globals/api/upsertServer.ts", "media/api/queries.ts"]
```

**4 — rewrite `react-field-module` for `Field.tsx` (step 12–14 landed the rename).**
```yaml
  - id: react-field-module
    pattern: '^(Field|Cell|columnDef|preview|index|types|utils|constants|testFixture)\.(tsx|ts)$|^(Input|EmptyInput|FilledInput)\.(tsx|ts)$'
    scope: ["packages/react/src/fields/*/**"]
    description: Each react field dir mirrors the core field name and contains Field.tsx (fieldDef → the app form's plain props, admin wiring), Cell.tsx, columnDef.tsx (+ index.ts barrel), plus testFixture.ts exporting that field type's FieldFixture. A control file (Input.tsx/EmptyInput.tsx/FilledInput.tsx) exists only for a custom widget (relationship, upload, richtext) — every other field type renders its control through the app form field's renderControl and has no Input.tsx.
    examples: ["text/Field.tsx", "text/Cell.tsx", "upload/FilledInput.tsx", "blocks/columnDef.tsx"]
    counter_examples: ["text/Input.tsx (text has no custom widget)", "text/TextField.tsx"]
```

**5 — new `react-app-form` rule for `@vexcms/react/form`.**
```yaml
  - id: react-app-form
    pattern: '^([A-Z][A-Za-z0-9]*Field|AppForm|FormFieldLayout|useAppForm|formContext|useArrayItems|FormCompactContext|ArrayItemHeaderContext|types|index)\.(tsx|ts)$'
    scope: ["packages/react/src/forms/**"]
    description: The exported app form (@vexcms/react/form) is named after each field it exports (TextField.tsx, ArrayField.tsx, BlocksField.tsx), plus the fixed roles formContext.ts, useAppForm.ts, AppForm.tsx, FormFieldLayout.tsx, types.ts. These files read useFieldContext()/useFormContext() and plain props only — never fieldDef, VexConfigContext, or permissions; that wiring belongs in fields/<type>/Field.tsx.
    examples: ["forms/TextField.tsx", "forms/ArrayField.tsx", "forms/useAppForm.ts", "forms/FormFieldLayout.tsx"]
    counter_examples: ["forms/Input.tsx", "forms/TextField.tsx importing VexConfigContext"]
```

> Note: decision 2 also relocates document types and the shared pipeline to `src/documents/`
> and `src/db/` (steps 1–2), neither of which has a dedicated naming rule today — `documents/`
> and `db/` both already fit the general `non-component-camel` rule (`types.ts`, `constants.ts`,
> `context.ts`, `documents.ts` are all lowercase-camel `.ts`), so no new rule is needed for
> them; `non-component-camel`'s scope (`packages/core/src/**`) already covers `src/documents/**`
> and `src/db/**` without edits.

**6 — new `react-feature-folders` rule for the flat top-level layout (decision 18, steps 15–19).**
```yaml
  - id: react-feature-folders
    pattern: '^(api|[a-z][a-zA-Z0-9]*)$'
    scope: ["packages/react/src/*"]
    description: The react package is grouped by domain at the top level (collections/, globals/, versions/, media/, fields/, forms/, access/, auth/, config/, admin/, slots/, livePreview/, revalidate/, modals/, ui/, hooks/, utils/), mirroring core/src/. Inside a feature folder every file is flat — component PascalCase.tsx, hook useX.ts, context XContext.ts(x), constants.ts, types.ts, index.ts — the only subfolders are api/ (server.ts + client.ts per operation) and, in fields/, one directory per field type. adapter.ts, index.ts and testing/ stay at the root; there is no components/, context/, lib/, or styles/ directory.
    examples: ["collections/CollectionEditView.tsx", "access/usePermission.ts", "versions/api/publish/client.ts", "fields/text/Field.tsx"]
    counter_examples: ["components/views/CollectionEditView.tsx", "hooks/usePermission.ts", "client/versions/publish.client.ts"]
```

### Step 21 — Browser smoke in `apps/test` [agent]
Why: the form layer is rewritten; tests alone are not proof.
Verify: checklist below recorded in the session log.

Executed by an agent using the browser tool against the developer's already-running `apps/test`
dev server (P-024 — never start one; if no dev server is reachable at the expected URL, this step
blocks and reports that rather than starting one). Every item below maps to a real document in
`apps/test/src/vexcms/collections/fields.ts` (`slug: TABLE_SLUG_FIELDS`, admin-visible as
**Fields**), the one collection exercising every field type in one document, including every
layout and container field:

| Field type | Source in `fields.ts` |
|---|---|
| text, textarea, email, url, number, checkbox, select, date, color, json | `:186-243` (`title`, `bio`, `contactEmail`, `website`, `rating`, `isFeatured`, `status`/`tags`, `dueOn`/`eventAt`, `accentColor`, `settings`) |
| relationship (single + hasMany) | `:257,264` (`relatedUser`, `relatedUsers`) |
| upload (single + hasMany) | `:272,280` (`avatar`, `gallery`) |
| richtext | `:289` (`body`) |
| array (of text, of group) | `:295,302` (`tagList`, `gridItems`) |
| group | `:315` (`info`, nested array of text at `:321`) |
| blocks (nested blocks + array-of-group inside a block) | `:333` (`content`, using `containerBlock`/`statGroupBlock`/`nestedStatGroupBlock` defined `:37-121`) |
| row (conditional on sibling data) | `statGroupBlock.headingRow` (`:42-50`), reachable by adding a `stat_group` block and toggling `showHeading` |
| collapsible | `nestedStatGroupBlock.statsSection` (`:78-91`) and `callout.options` (`:133-136`), reachable inside `content` |
| tabs | `containerBlock.info` (`:109-114`, named tab `meta`), reachable inside `content` |

- [ ] **Create + save, every field type:** open **Fields → Create**, fill every leaf field listed
  above (text/textarea/email/url/number/checkbox/select/date/color/json/relationship/upload/
  richtext), save, reload the document, confirm every value round-trips.
- [ ] **Validation on blur and on submit:** clear a `required` field (e.g. `title`), tab out —
  the error shows on blur without submitting; submit the form with another required field (e.g.
  `contactEmail`) empty — the error shows on submit for a field never blurred.
- [ ] **Array — `tagList` (scalar) and `gridItems` (group):** add three items, reorder by drag,
  duplicate one, remove one, confirm `atMax` disables Add once the field's `max` (if set) is hit,
  confirm the field-level error shows when the array itself is invalid.
- [ ] **Blocks — `content`:** open the block picker, add a `container` block (exercises nested
  `blocks` + `tabs`), add a `stat_group` block (exercises `row` + array-of-group), add a
  `callout` block (exercises `collapsible`), reorder blocks, duplicate one, remove one, copy a
  block then paste it, then paste-replace-all — confirm the clipboard actions and the picker
  (opened via the URL param) all work.
- [ ] **Permission-denied + read-only:** sign in as a role whose `access` config denies write on
  the Fields collection (or one scoped-out field via `admin.condition`/field-level access) and
  confirm the document opens read-only — controls disabled, no save button acting on them — and
  the specific denied field renders through `applyFieldPermissionReadOnly`.
- [ ] **`admin.components.Input` override (`apps/test`):** register one `admin.components.Input`
  override on a leaf field in `apps/test/src/vexcms/collections/fields.ts` (e.g. `title`),
  confirm it receives `{ id, value, onChange, onBlur, readOnly, invalid, describedBy }` via
  `renderControl` and the surrounding `FormFieldLayout` (label/description/error) still renders.
- [ ] **`admin.components.Field` override (`apps/test`):** register one `admin.components.Field`
  override on a different field, confirm it fully replaces the admin field's output (layout
  included) and the document still saves.

Record pass/fail for each bullet, with the field(s)/role used, in the session log entry for this
step.

### Step 22 — Pass 2 review [agent]
Why: derive the conventions from the refactored tree (launch plan § K, "Pass 2 — the review method").
Verify: `review-1.md` exists with every finding classified; developer decisions recorded.
- [ ] one reviewer per package/app → `review-1.md` (convention / violation / gap, paths + counts)
- [ ] developer decides each violation and gap → `Pass 1 decisions` step group appended below

**Per-package list (one reviewer agent each, 11 total):** `core`, `react`, `next`, `cli`,
`better-auth`, `file-storage-convex`, `richtext-plate`, `create-vexcms` (both templates,
`templates/base-nextjs` + `templates/marketing-site`, one reviewer), `apps/test`, `apps/www`,
`apps/docs`.

**Reviewer prompt template** (one per package, context filled in per target):

```
# Goal
Review the <package/app> tree at <path> against the method in launch-plan § K ("Pass 2 — the
review method") and report findings to `.agent/docs/specs/2026-10-25-codebase-conventions-refactor/review-1.md`
(append your section; do not overwrite another reviewer's section).

# Method
Read the whole tree under <path>. For each of the four lenses below, classify every finding as
CONVENTION (observed and consistent — propose it as a rule, with examples), VIOLATION (breaks
an observed convention — propose the fix), or GAP (no consistent convention exists — list the
options and how many files follow each):

1. Grouping — domain or layer folders; code living away from its only consumer; folders mixing
   domains.
2. File roles — every filename that recurs (config.ts, types.ts, index.ts, server.ts, utils.ts,
   constants.ts, Field.tsx, Cell.tsx, …): what the role means here, and any file whose content
   does not match its role name.
3. Exports and imports — what each index.ts re-exports and whether it should; package.json
   `exports` entries; import direction (domain → shared, never the reverse; no cycles);
   relative imports crossing into another domain's internals.
4. Identifiers — functions, types, variables, constants, booleans, hooks, components: does the
   name say what the value IS in this context (watch for `field` meaning a field config in core
   vs. a TanStack FieldApi in react — the config is `fieldDef`)? Confirm or reject the existing
   families: `<type>FieldToValidator`, `Xxx`/`XxxInput` pairs, `XxxServerArgs`, `XxxProps`,
   B3's `Query*`/`Convex*` prefixes in access/.

Cite every finding with real `file:line` evidence — no finding without a path and (for
violation/gap) a count of how many files are affected.

# Output
Append a `## <package/app>` section to `review-1.md` with one table:

| kind | rule/area | paths | count | proposed fix |
|---|---|---|---|---|
| convention | <rule name or area> | <path or path glob> | <N files> | <rule text / "codify as-is"> |
| violation | <rule it breaks> | <paths> | <N files> | <concrete fix> |
| gap | <area with no rule> | <paths> | <N files per option> | <options, with tradeoffs> |

Do not edit any source file. Read-only.
```

**`review-1.md` format** (one file, one `## <package/app>` section per reviewer, each with the
table above; a `## Summary` section at the top, filled in after all reviewers return, counting
total violations/gaps across all sections).

**Decision-append procedure:** after every reviewer section lands in `review-1.md`, the
developer reviews the `## Summary` and each `## <package/app>` table and decides each violation
and gap row — either "apply the proposed fix", "apply this fix instead" (stated), or "codify
as a convention, no change". Each decision is recorded as a `- [ ]` checkbox under a new
`## Pass 1 decisions` step group appended to `spec-tasks.md` (and mirrored into `spec.md`)
directly below Step 22, in the placeholder the step list already reserves
(`<!-- Pass N decisions step groups are appended here, one per review round. -->`). Each
checkbox names the file(s)/rule changed and cites the `review-1.md` row it resolves. That step
group is implemented as pass 3, then review-2 (a second Step 22-shaped pass) runs over the
post-pass-3 tree; passes 2–3 repeat — `Pass 2 decisions`, `Pass 3 decisions`, … — until a
review returns zero open violations and zero open gaps, per decision 11 (one spec, passes as
step groups) and the acceptance criterion "the last review returns no open violation or gap."

<!-- Pass N decisions step groups are appended here, one per review round. -->

### Step 24 — Pass 1 decisions [agent]
Why: developer decisions on review-1.md violations/gaps (2026-10-26).
Verify: `pnpm typecheck && pnpm test && harness struct --check && pnpm --filter docs build`
- [ ] delete empty files: `packages/core/src/globals/config/{config,types}.ts` (+ dir if empty), `packages/better-auth/src/utils.ts`, `packages/file-storage-convex/src/adapter/types.ts` (review-1 core gap, better-auth + file-storage-convex violations)
- [ ] core: `versions/publish.ts` (and any other `versions/*.ts` domain-root file) stops importing from `versions/api/` — move the shared piece down into the domain layer (review-1 core violation "versions layer imports api")
- [ ] core: codify `access/` → `collections/`/`globals/` imports (AccessResource, resolveCollectionIndexes) as the documented RBAC exception in `naming-conventions.md` (review-1 core violation "access imports from domains")
- [ ] apps/test, apps/www, both create-vexcms templates: rename `component-example.tsx`/`example.tsx` to PascalCase or delete if unused; `motion-primitives/{animated-group,text-effect}.tsx` → PascalCase; update importers (review-1 apps/test, apps/www, create-vexcms naming violations)
- [ ] codify app layer folders as the app convention in `naming-conventions.md`: `components/` (PascalCase, `ui/` shadcn kebab), `lib/` (camelCase utils/hooks), `components/providers/` fixed roles (`client`/`server`/`auth`/`convex`), `context/` for `*Context.tsx` (apps/www `CodeHighlightContext.tsx` moves to `context/`); no restructure to feature folders (review-1 create-vexcms layering violations, apps/test + apps/www gaps)
- [ ] react: codify as-is — field module may hold `utils.ts` and helper widget components; layout fields (`tabs`/`row`/`collapsible`/`ui`) are `Field.tsx` only; `BlocksField.cloneBlock` stays optional (review-1 react gaps)
- [ ] next: codify as-is — root `Next*.tsx` components + capability folders `cache/`, `seo/`, `testing/` (review-1 next gaps)
- [ ] docs: add `apps/docs/src/content/docs/fields/richtext.mdx` documenting the richtext field via `@vexcms/richtext-plate` (review-1 apps/docs gap)
- [ ] review-2 (Step 22-shaped) over the post-pass-3 tree returns zero open violations/gaps, else append `Pass 2 decisions`

### Step 25 — Pass 2 decisions [agent]
Why: developer decisions on review-2.md violations/gaps (2026-10-26).
Verify: `pnpm typecheck && pnpm test && harness struct --check && node scripts/export-names.mjs --check`
- [ ] core: move `flattenGlobalRow` from `globals/api/utils.ts` to `globals/utils.ts`; repoint `db/triggers.ts` and api importers; document db→globals domain-layer import as an exception alongside the access RBAC exception in `naming-conventions.md` (review-2 core violation)
- [ ] core: flatten layout fields `fields/ui/{ui,tabs,collapsible,row}/` → `fields/{ui,tabs,collapsible,row}/`; fix barrels/importers; public export names unchanged (review-2 core gap)
- [ ] react: delete empty `fields/relationship/utils.ts`, `fields/select/utils.ts` (review-2 react violation; Pass 1 empty-file decision)
- [ ] move `CodeHighlightContext.tsx` from `src/components/` to `src/context/` in `apps/test` and `templates/marketing-site`; repoint importers (review-2 apps/test + create-vexcms violation)
- [ ] extend `host-app-*` / `react-context-suffix` rule scopes in `naming-conventions.md` to `packages/create-vexcms/templates/*/src/**` per the Pass 1 decision covering templates (review-2 create-vexcms gap)
- [ ] file-storage-convex: add `src/adapter/uploadFile.test.ts` (review-2 file-storage-convex gap)
- [ ] review-3 over the post-pass tree returns zero open violations/gaps, else append `Pass 3 decisions`

### Step 26 — Pass 3 decisions [agent]
Why: review-3.md violations; both apply codified rules with one obvious fix (2026-10-26).
Verify: `pnpm typecheck && pnpm test && harness struct --check`
- [ ] richtext-plate: `editor/components/editorElements.tsx` → `EditorElements.tsx`; repoint importers (review-3 richtext-plate violation)
- [ ] marketing-site template: `motion-primitives/{AnimatedGroup,TextEffect}.tsx` import `cn` from `@vexcms/react` (review-3 create-vexcms violation)
- [ ] richtext-plate: `render/components/{elements,leaves}.tsx` → `Elements.tsx`/`Leaves.tsx`; extend `react-components-pascal` scope to `packages/richtext-plate/src/**/*.tsx` (review-4 richtext-plate violation)
- [ ] review-4 over richtext-plate + create-vexcms (only packages changed since review-3) (+ review-5 richtext-plate after the review-4 fix) returns zero open violations/gaps

### Step 23 — Record and enforce [agent]
Why: decision 10; conventions documented once, enforced by `harness struct --check`.
Verify: `pnpm --filter docs build && harness struct --check && harness doctor`
- [ ] `apps/docs/src/content/docs/dev/` — `project-structure.mdx`, `package-layout.mdx`, `naming-conventions.mdx`, `adding-a-field-type.mdx`; `astro.config.mjs` sidebar group
- [ ] `.agent/docs/standards/` — `naming-conventions.md` (rules only, links to docs), `frontend/forms.md`, `core/adding-a-field-type.md`, `testing/convex-integration-testing.md`
- [ ] `harness struct` regenerated; `tech-stack.md` refreshed; `harness sync`

Written from the final review's conventions (last `Pass N decisions` applied, review returning
no open violation/gap), not drafted ahead of it — the outlines below are structural, not
content, since the content is whatever that review settled.

#### apps/docs/src/content/docs/dev/project-structure.mdx
New file. Outline:
1. What a "package" vs. an "app" vs. a "template" is in this repo (one paragraph each).
2. Dependency diagram in prose: `core` → `react` → `next`; `richtext-plate`/`better-auth`/
   `file-storage-convex` as core/react peers; `cli` scaffolds `create-vexcms`; `apps/test` and
   `apps/www` consume the published surface the same way a user's app would.
3. Entry points table: package → its `exports` map (from the post-K `package.json`s), one row
   per entry (`./server`, `./form`, `./client`, `./testing`, …), one sentence on what each is
   for and who imports it.
4. Link to `package-layout.mdx` for what's inside each package.

#### apps/docs/src/content/docs/dev/package-layout.mdx
New file. Outline:
1. The rule stated once: "code is grouped by domain; a folder's filenames name roles, not
   domains" (launch plan § K framing), with `core/src/fields/<type>/` as the worked example
   (`config.ts`/`types.ts`/`validator.ts`/`inputSchema.ts`/`index.ts`).
2. Core layout: domain folders (`access`, `collections`, `fields`, `globals`, `media`,
   `versions`, …), each domain's `api/<op>/server.ts` + `<domain>Api.ts` shape, `db/` (pipeline
   only), `documents/` (shared shapes), `access/` (dispatchers), the one entry `src/server.ts`.
3. React layout: top-level feature folders mirroring core (decision 18) — the exported app form
   (`forms/` → `@vexcms/react/form`, reads `useFieldContext`/`useFormContext` + plain props only)
   vs. admin fields (`fields/<type>/Field.tsx`, reads `fieldDef` + config + permissions) — plus
   `ui/`, `admin/`, and the rest of the domain folders decision 18 lists; no `components/`.
4. Whatever review-1 (+ later passes) codified for `next`, `cli`, `better-auth`,
   `file-storage-convex`, `richtext-plate`, `create-vexcms` — one subsection per package, each
   stating its domain folders and file-role conventions as decided.

#### apps/docs/src/content/docs/dev/naming-conventions.mdx
New file. Outline:
1. One paragraph per identifier family from `naming-conventions.md` § Identifiers (hooks,
   event handlers, booleans, components, types, constants, field types, Convex functions),
   each with a short "why" the standards file states tersely.
2. One section per file/folder rule family in `naming-conventions.md`'s `rules:` block, in
   prose with the same examples/counter-examples, grouped by package (not a yaml dump).
3. A closing note: "the machine-checked source of truth is
   `.agent/docs/standards/naming-conventions.md`; `harness struct --check` enforces it" — this
   page explains, that file enforces (decision 10).

#### apps/docs/src/content/docs/dev/adding-a-field-type.mdx
New file. Outline — public twin of `standards/core/adding-a-field-type.md`:
1. The core half: copy an existing `fields/<type>/` folder, what each of its five files must
   export, the three shared registrations (`fields/constants.ts` `ADMIN_FIELDS`, the
   `AdminField` union, the validator/input-schema switch statements).
2. The react half, post-K: copy an existing `fields/<type>/` folder
   (`Field.tsx`/`Cell.tsx`/`columnDef.tsx`/`testFixture.ts`), map the new `fieldDef` to an app
   form component's props (or add an app form component first, under `forms/`, if the widget
   needs new list/layout mechanics), register in `fields/registry.ts`.
3. A worked example naming one real field type's pair of folders as the template to copy.

#### apps/docs/astro.config.mjs
1 edit, anchored on the `sidebar:` array (`:69-88`).

**1 — new `Development` group**, inserted after `Fields` and before `typeDocSidebarGroup`:
```js
				{
					label: 'Fields',
					autogenerate: { directory: 'fields' },
				},
				{
					label: 'Development',
					autogenerate: { directory: 'dev' },
				},
				typeDocSidebarGroup,
```

#### .agent/docs/standards/naming-conventions.md (final form)
Rewritten to hold only the machine-checked `rules:` yaml block (as updated across steps 19–20 and
whichever `Pass N decisions` groups touch it) plus the `## Identifiers` section, with every
rule's `description` ending in a link to the matching `dev/naming-conventions.mdx` anchor for
the "why". No narrative, no "Known inconsistencies" list (removed in step 20) — decision 10's
split: docs explain, this file enforces.

#### .agent/docs/standards/frontend/forms.md
Rewritten. Replace every reference to `createFieldInput`/`AppFormContext`/`FormLabel`/
`FormError`/`FormDescription` (the deleted layer, step 14) with the post-K pattern: the app form
(`@vexcms/react/form`, `useFieldContext`/`useFormContext`, `FormFieldLayout`), the two override
slots (`admin.components.Input` via `renderControl`, `admin.components.Field`), and
`useFieldsForm`/`useVexForm` as the admin-side entry points. Content follows whatever
review-1 (+ later passes) found the actual final shape of `components/fields/` to be —
this file is written after that shape is settled, not predicted here.

#### .agent/docs/standards/core/adding-a-field-type.md
Rewritten. Update every `components/fields/<type>/Input.tsx` reference to `Field.tsx`, and
describe the new mapping step (`fieldDef` → the app form's props) that didn't exist before K.

#### .agent/docs/standards/testing/convex-integration-testing.md
1 edit — the `api/test/` path reference (moved to `db/test/` in step 2) updated to the new
location.

```bash
harness struct
harness sync
```
Regenerates `.agent/docs/standards/directory-structure.md` from the final tree and refreshes
`.agent/docs/product/tech-stack.md` paths/package list (`verified_at` bumped) and
`context-rules.yaml` from the rewritten standards files' `applies_to` globs.

## Verification

`pnpm typecheck && pnpm test && pnpm build`, `node scripts/export-names.mjs --check`, `node scripts/verify-scaffold.mjs`, `pnpm --filter www build`, `harness struct --check`, `harness doctor` — all green before each review round and after step 23.
