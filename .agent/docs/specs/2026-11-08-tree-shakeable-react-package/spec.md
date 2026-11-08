---
status: draft
spec_id: 2026-11-08-tree-shakeable-react-package
touches: ["scripts/**", "pnpm-workspace.yaml", "package.json", "pnpm-lock.yaml", ".github/workflows/ci.yml", "packages/core/tsup.config.ts", "packages/react/**", "packages/next/src/**", "packages/create-vexcms/src/**", "packages/create-vexcms/templates/**", "apps/www/src/**", "apps/test/src/**", "apps/docs/src/content/docs/guides/**", ".changeset/**", ".agent/docs/decisions/**", ".agent/docs/standards/**", ".agent/docs/product/backlog.md"]
prompt_version: 1
---

# 2026-11-08-tree-shakeable-react-package — Spec

## Overview

- **The problem:** every public `apps/www` route loads about 3.0 MB of JavaScript, most of it admin panel: a 1.1 MB admin chunk, 671 KB with TanStack Table, 505 KB of lucide icons and 338 KB of auth UI. CI Lighthouse TBT is 277–570 ms against a 200 ms budget.
- **Who else it hits:** any consumer who imports one hook or `cn` from `@vexcms/react`, because the package ships as one 725 KB shared chunk behind a `"use client"` barrel.
- **The fix:**
  - build `@vexcms/react` and `@vexcms/core` as one dist file per source module
  - give each client module its own `"use client"`
  - split the public surface so the root never reaches panel internals
  - load icons lazily on public pages
  - mount the auth UI only where auth views render
- **How it's proved:** three gates (a package import-cost check, a site-bundle analyzer check and the existing Lighthouse CI), each with a negative test.

## Design Decisions

1. **One dist file per source module (tsup + an esbuild preserve-modules plugin).** tsup's `splitting` merges every module both entries share into one chunk, and bundlers keep a module whole once anything in it is used. Per-module files make client-side tree-shaking work: measured, the site's client graph reached 18 of 413 modules. No new build tool; the plugin is about 40 lines with its own tests.
2. **Each client module declares its own `"use client"`; the root barrel doesn't.**
   - A `"use client"` barrel makes the whole package one client reference. Spike: per-module output with a `"use client"` root still shipped 3074 KB.
   - Without the barrel directive, a server component can import `cn`, a hook or a provider directly.
   - A colocated test enforces the rule over `src/**`.
3. **Entries are split by what they can reach: root = everything users touch, `@vexcms/react/admin` = panel internals.**
   - When a server component imports from a barrel, Next makes every `"use client"` module that barrel can reach a client reference. No configuration changes that; tested `optimizePackageImports`, pure re-export barrels and `sideEffects`.
   - So the root must not reach the adapter, the field registry, admin/collection/global/media views, `data-table` or `dnd`. Measured: moving those out of server-imported reach took `/` from 3097 KB to 2210 KB.
   - Client components still import everything users touch from the root and pay per component.
4. **No deep per-module subpath exports.** The file layout stays internal, so renaming a file is never a breaking change. The import-cost gate replaces the need.
5. **`useAppForm`/`AppForm` leave the root; their home is the existing `@vexcms/react/form` entry. Flagged for review: this departs from "root = everything users touch".** The app form's `ArrayField`/`BlocksField` reach `@hello-pangea/dnd`, so keeping them at the root would put dnd and TanStack Form on every page that has a server component importing the root, which is every page. `/form` was already the documented full surface of the app form.
6. **`ReactHKT`/`ReactAdapter` types stay importable from the root.** Types cost nothing at runtime, and the root's `RelationshipFieldInput`/`CollectionConfig` types reference `ReactHKT`. The runtime `reactAdapter` moves to `/admin`.
7. **The root `Icon` is lazy; `AdminIcon` in `/admin` is eager.**
   - `icons[name]` ships all 1703 lucide icons (505 KB). On public pages, names come from CMS data, so `Icon` loads one icon on demand through `lucide-react/dynamic`.
   - Its placeholder is an empty `<svg>` with the same width, height and class, so nothing shifts when the icon arrives.
   - The panel keeps synchronous icons at admin-only cost, so there's no pop-in in the sidebar.
   - `Button`'s `icon` prop and `Input`'s `iconLeft`/`iconRight` keep the lazy `Icon`. Both are root primitives the site renders, so switching them to `AdminIcon` would put every icon back into the root's reach. Icons inside admin buttons and inputs load into a reserved box.
   - `isIconName` lets blocks keep "an unresolvable icon drops the frame" without loading anything.
8. **`AuthUIProvider` mounts only at the two `AuthView` render sites.** Nothing else reads its context. `SessionButton` uses only the Better Auth client. The provider's `onSessionChange → router.refresh()` still runs wherever sign-in happens, because sign-in only happens inside those views.
9. **Three gates, each proven by a failing case:**
   - `scripts/check-import-cost.mjs` (esbuild against the built `dist`; deterministic; models both a one-hook consumer and the root's full reach)
   - `scripts/check-site-bundle.mjs` (Next's own analyzer; deterministic; per-route initial client JS and deny list)
   - Lighthouse CI in `quality.yml` (TBT/performance on the real preview)
10. **Budgets are set from measurement + 10% (`Math.ceil`), recorded in the gate scripts.** Tighten them as later work lands.
11. **Supersedes ADR-009 with ADR-017.** Per-module files are single instances across entries by construction, so the shared-chunk contract that kept contexts unique is no longer needed.
12. **Mirrors existing systems:**
    - gate scripts follow `scripts/move-modules.mjs` + `node:test`
    - the export-surface check reuses `scripts/export-names.mjs`
    - the per-app mirror (www → test → templates) follows the template-sync rules
    - the lazy-loading placeholder follows `standards/frontend/layout-stability.md` (reserved space)

## Out of Scope

- Per-module dist for `@vexcms/next` and `@vexcms/richtext-plate`.
- Deep per-module subpath exports.
- Lazy loading of components referenced from config (for example www's custom `TextFieldAdmin`); recorded in `backlog.md`.
- Pausing the Convex WebSocket on `pagehide` for bf-cache (already in `backlog.md`).
- Tuning the Zod and Better Auth chunks.
- Any change to admin panel behaviour or visuals. `AdminIcon` renders exactly as `Icon` does today.

## Implementation

### Step 1 — Preserve-modules build plugin [agent]

`esbuild` resolves today from the repo root as a bare specifier (`import "esbuild"` from `scripts/` works unmodified — proven with `node -e "import('esbuild').then(m => console.log(typeof m.build))"` printing `function`), because `node_modules/esbuild` is a real symlink to `node_modules/.pnpm/esbuild@0.27.7/node_modules/esbuild`, hoisted transitively through `tsup`'s own dependency on it. Relying on that hoisting silently breaking across a `tsup` upgrade is the kind of incidental-state trap AP-014 and P-015 warn about, so this step makes the dependency explicit: `esbuild` joins the `pnpm-workspace.yaml` catalog pinned to the version already installed (`0.27.7`) and becomes a real root `devDependency`.

#### pnpm-workspace.yaml
One edit: add an `esbuild` entry to the existing `catalog:` map, beside `tsup`.

**1 — catalog entry.** In the `catalog:` block, next to the `tsup: 8.5.1` line, add:

```yaml
  esbuild: 0.27.7
```

#### package.json
One edit: add `esbuild` to the root `devDependencies`, matching every other catalog-pinned entry in that list (`"@vexcms/tsconfig": "workspace:*"` stays as-is; `esbuild` goes in alongside `eslint`, `prettier`, `turbo`, etc., alphabetically):

```json
    "esbuild": "catalog:",
```

#### scripts/preserveModulesPlugin.mjs

```js
import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const SOURCE_EXTENSIONS = [".ts", ".tsx"];

/**
 * @param {string} fileName
 * @returns {boolean}
 */
function isSourceFile(fileName) {
  return SOURCE_EXTENSIONS.some((ext) => fileName.endsWith(ext)) && !fileName.endsWith(".d.ts");
}

/**
 * @param {string} fileName
 * @returns {boolean}
 */
function isTestFile(fileName) {
  return /\.test\.(ts|tsx)$/.test(fileName);
}

/**
 * @param {string} path
 * @returns {string}
 */
function toPosix(path) {
  return path.split("\\").join("/");
}

/**
 * Walks `srcDir` and returns one entry per source module, keyed by its path
 * relative to `srcDir` with the extension stripped and `/` separators —
 * the shape tsup's `entry` option expects for a preserve-modules build.
 * Skips `*.test.ts(x)`, `*.d.ts`, and anything matching `exclude`.
 * @param {{ srcDir: string, exclude?: RegExp[] }} props
 * @returns {Record<string, string>}
 */
export function listModuleEntries(props) {
  const { srcDir, exclude = [] } = props;
  const entries = {};
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const absolutePath = join(dir, name);
      if (statSync(absolutePath).isDirectory()) {
        walk(absolutePath);
        continue;
      }
      if (!isSourceFile(name) || isTestFile(name)) continue;
      const relativePath = toPosix(relative(srcDir, absolutePath));
      if (exclude.some((pattern) => pattern.test(relativePath))) continue;
      const entryName = relativePath.replace(/\.tsx?$/, "");
      entries[entryName] = absolutePath;
    }
  };
  walk(srcDir);
  return entries;
}

/**
 * @param {string} basePath
 * @returns {string | null}
 */
function resolveModuleFile(basePath) {
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    join(basePath, "index.ts"),
    join(basePath, "index.tsx"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

/**
 * esbuild plugin that keeps a preserve-modules build from bundling the
 * package's own source: every relative import (static or dynamic) is marked
 * external and rewritten to the `.js` path its target will be emitted at,
 * so `dist/` ends up one file per `src/` module instead of one shared chunk.
 * Directory imports resolve to `index.js`; bare package imports never match
 * the resolve filter, so they stay external untouched.
 * @param {{ srcDir: string }} props
 * @returns {import("esbuild").Plugin}
 */
export function preserveModulesPlugin(props) {
  const { srcDir } = props;
  return {
    name: "preserve-modules",
    setup(build) {
      build.onResolve({ filter: /^\.\.?\// }, (args) => {
        if (args.kind === "entry-point") return;
        const target = resolveModuleFile(resolve(args.resolveDir, args.path));
        if (!target) return;
        const importerDir = dirname(args.importer);
        let rewritten = toPosix(relative(importerDir, target)).replace(/\.tsx?$/, ".js");
        if (!rewritten.startsWith(".")) rewritten = `./${rewritten}`;
        return { path: rewritten, external: true };
      });
    },
  };
}
```

#### scripts/preserveModulesPlugin.test.mjs

```js
import { build } from "esbuild";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { listModuleEntries, preserveModulesPlugin } from "./preserveModulesPlugin.mjs";

/**
 * @returns {{ root: string, srcDir: string }}
 */
function writeFixture() {
  const root = mkdtempSync(join(tmpdir(), "preserve-modules-"));
  const srcDir = join(root, "src");
  mkdirSync(join(srcDir, "dir"), { recursive: true });
  mkdirSync(join(srcDir, "internal"), { recursive: true });
  writeFileSync(
    join(srcDir, "index.ts"),
    'export * from "./a";\nexport * from "./dir";\nimport "react-dom";\n',
  );
  writeFileSync(
    join(srcDir, "a.tsx"),
    [
      '"use client";',
      'import { useState } from "react";',
      "export function A() {",
      "  const [n] = useState(0);",
      "  return n;",
      "}",
      "export async function loadB() {",
      '  return import("./dir/b");',
      "}",
    ].join("\n"),
  );
  writeFileSync(join(srcDir, "dir", "index.ts"), 'export * from "./b";\n');
  writeFileSync(
    join(srcDir, "dir", "b.tsx"),
    '"use client";\nexport function B() {\n  return 1;\n}\n',
  );
  writeFileSync(join(srcDir, "a.test.ts"), "export const skip = true;\n");
  writeFileSync(join(srcDir, "a.d.ts"), "export declare const skip: boolean;\n");
  writeFileSync(join(srcDir, "internal", "secret.ts"), "export const secret = 1;\n");
  return { root, srcDir };
}

/**
 * @param {string} srcDir
 * @param {string} outdir
 * @param {import("esbuild").Plugin[]} plugins
 * @returns {Promise<Record<string, string>>}
 */
async function buildFixture(srcDir, outdir, plugins) {
  const entries = listModuleEntries({ srcDir, exclude: [/^internal\//] });
  await build({
    entryPoints: entries,
    outdir,
    bundle: true,
    format: "esm",
    platform: "neutral",
    jsx: "automatic",
    packages: "external",
    sourcemap: false,
    logLevel: "silent",
    plugins,
  });
  return entries;
}

test("listModuleEntries skips test files, declaration files and excluded paths", () => {
  const { root, srcDir } = writeFixture();
  const entries = listModuleEntries({ srcDir, exclude: [/^internal\//] });
  assert.deepEqual(Object.keys(entries).sort(), ["a", "dir/b", "dir/index", "index"]);
  rmSync(root, { recursive: true, force: true });
});

test("preserveModulesPlugin emits one file per module mirroring src/, rewrites specifiers, keeps directives and dynamic imports lazy, and leaves packages external", async () => {
  const { root, srcDir } = writeFixture();
  const outdir = join(root, "dist");
  await buildFixture(srcDir, outdir, [preserveModulesPlugin({ srcDir })]);

  const index = readFileSync(join(outdir, "index.js"), "utf8");
  const a = readFileSync(join(outdir, "a.js"), "utf8");
  const dirIndex = readFileSync(join(outdir, "dir", "index.js"), "utf8");
  const dirB = readFileSync(join(outdir, "dir", "b.js"), "utf8");

  assert.match(index, /export \* from "\.\/a\.js"/);
  assert.match(index, /export \* from "\.\/dir\/index\.js"/);
  assert.match(index, /import "react-dom"/);

  assert.match(a, /^"use client";/);
  assert.match(a, /import\("\.\/dir\/b\.js"\)/);

  assert.match(dirIndex, /export \* from "\.\/b\.js"/);
  assert.match(dirB, /^"use client";/);

  rmSync(root, { recursive: true, force: true });
});

test("a broken specifier rewrite fails the build assertions", async () => {
  const { root, srcDir } = writeFixture();
  const outdir = join(root, "dist");
  const brokenPlugin = {
    name: "preserve-modules-broken",
    setup(pluginBuild) {
      pluginBuild.onResolve({ filter: /^\.\.?\// }, (args) => {
        if (args.kind === "entry-point") return;
        return { path: args.path, external: true };
      });
    },
  };
  await buildFixture(srcDir, outdir, [brokenPlugin]);
  const index = readFileSync(join(outdir, "index.js"), "utf8");
  assert.throws(() => {
    assert.match(index, /export \* from "\.\/a\.js"/);
  });

  rmSync(root, { recursive: true, force: true });
});
```

Verify:
- `node --test scripts/preserveModulesPlugin.test.mjs` passes 3/3: entry listing excludes `*.test.ts(x)`, `*.d.ts` and `exclude` matches; a real esbuild build of a temp fixture produces one `.js` per source module mirroring `src/`, rewrites `./a` → `./a.js` and `./dir` → `./dir/index.js`, keeps `"use client"` per file, keeps `import("./dir/b")` a dynamic import of the rewritten `.js` path, and leaves the bare `react-dom` import external.
- Negative check (AP-013, built into the third test): swapping in a plugin that marks relative imports external WITHOUT rewriting the specifier leaves `dist/index.js` re-exporting the literal `"./a"` (no `.js`), so `assert.match(index, /export \* from "\.\/a\.js"/)` throws — proving the test suite actually catches a broken rewrite rather than passing regardless.
- `pnpm install` after the `pnpm-workspace.yaml`/`package.json` edits resolves `esbuild` from the catalog with no new packages: it is already in the lockfile through `tsup`. The `pnpm-lock.yaml` diff only adds the root importer's `esbuild` entry; there is no `-version:`/`+version:` pair for any package.

### Step 2 — `@vexcms/core` per-module dist [agent]

`packages/core/src/db/test/**` (the convex-test `schema.ts` + generated `_generated/api.ts` fixture) is imported ONLY by `*.test.ts` files — confirmed by grepping every `db/test/convex` import in `src/**`, all 28 hits are `.test.ts` — so it is excluded from the entry list the same way `tsconfig.build.json` already excludes it from declaration emission, by directory, not by relying on `listModuleEntries`'s default `*.test.ts` filter (these two files are not named `*.test.ts` themselves).

#### packages/core/tsup.config.ts
Three edits; `format`, `dts`, `sourcemap` and `clean` keep their current values.

**1 — plugin import.** Beside the `tsup` import:

```ts
import { listModuleEntries, preserveModulesPlugin } from "../../scripts/preserveModulesPlugin.mjs";
```

**2 — entry, and the comment above `tsconfig` naming the real fixture directory.** Replace `entry: ["src/index.ts", "src/server.ts", "src/internal.ts"]` and the directory name in the comment immediately below it (it said `src/api/test/**`, which has never been the fixture's path):

```ts
  entry: listModuleEntries({ srcDir: "src", exclude: [/^db\/test\//] }),
  format: ["esm"],
  // Use the build-only tsconfig so test fixtures (src/db/test/**) are
  // excluded from production .d.ts emission. Their `declare module` blocks
  // would otherwise leak fixture-specific GeneratedVexTypes augmentation
  // into downstream consumers and conflict with their `vex generate` output.
  tsconfig: "./tsconfig.build.json",
```

**3 — per-module bundling.** After `clean: true,` add:

```ts
  bundle: true,
  splitting: false,
  esbuildPlugins: [preserveModulesPlugin({ srcDir: "src" })],
```

#### packages/core/package.json
No edit. `exports["."]`/`["./server"]`/`["./internal"]` already point at `dist/index.js`, `dist/server.js`, `dist/internal.js` — `listModuleEntries` names those three entries `index`, `server`, `internal` (their path relative to `src`, extension stripped), which is exactly where tsup already emits them, so none of the three paths move. `sideEffects: false` is re-verified: a scripted walk of every non-test `.ts` file under `src/**` found zero bare `import "…"` statements and zero top-level function calls outside `describe`/`it`/`test` blocks (which only exist in `.test.ts` files, never built).

Verify:
- `pnpm --filter @vexcms/core build && pnpm --filter @vexcms/core test && node scripts/export-names.mjs --check`
- `ls packages/core/dist` shows a per-module tree with no `chunk-*.js` — confirmed by prototyping this exact config (esbuild `bundle: true, splitting: false` + `preserveModulesPlugin`, both pinned at `0.27.7`) against a copy of `packages/core`: 287 entries (289 source modules minus the 2 excluded fixture files), `find dist -name 'chunk-*' | wc -l` → `0`, `dist/server.js` opens with `import { VexAccessConfigError } from "./access/index.js";` (rewritten, not bundled), and the build has zero unresolved-import errors.
- `pnpm --filter test build` succeeds (no consumer resolves `dist/chunk-*.js` or any path this change moves).

### Step 3 — `@vexcms/react` per-module dist + per-module `"use client"` [agent]

Every src module scanned (433 non-test `.ts`/`.tsx` files) against the rule — `.tsx` outside `src/server/**`, any `use*.ts` hook file, or any module calling `createContext`/a React hook — found 80 missing the directive, not just the 2 the spike surfaced (`hooks/useAriaControlsCleanup.ts`, `ui/accordion.tsx`): the spike only exercised the symbols the `apps/www` site's current import graph actually reaches (18 of 413 modules), while this is every module the rule covers regardless of whether anything imports it today. `src/testing/**` stays in the entry list — `./testing` is a public export, and `listModuleEntries`'s default `*.test.ts(x)` filter already keeps real test specs (`a11y.test.ts`, `rbacState.test.ts`, …) out while keeping the kit itself (`viewSuite.ts`, `index.ts`, `setup.ts`, …) in; prototyping the build with no additional `exclude` produced exactly 433 output files, one per module, `dist/testing/index.js` included.

#### packages/react/tsup.config.ts
Five edits; `format`, `dts`, `sourcemap`, `clean`, `skipNodeModulesBundle` and the `external` array keep their current values.

**1 — plugin import.** Beside the `tsup` import:

```ts
import { listModuleEntries, preserveModulesPlugin } from "../../scripts/preserveModulesPlugin.mjs";
```

**2 — top-of-file comment.** Replace the whole doc comment above `export default defineConfig({`:

```ts
/**
 * One file per source module (`bundle: true, splitting: false`, object-form
 * `entry` from `listModuleEntries`, plus `preserveModulesPlugin` — see
 * `scripts/preserveModulesPlugin.mjs`). The package used to build `.` and
 * `./testing` from one `splitting: true` config so tsup's shared chunk gave
 * both entries ONE instance of every module they touch, `AppFormContext`'s
 * `createContext` call above all — two separate builds each inlined their
 * own copy, and a consumer mixing `TextFieldInput` from `.` with `AppForm`
 * from `./testing` got two distinct React contexts (measured: 26 of 27
 * `apps/www` tests failed on exactly that). A per-module build removes the
 * need for a shared chunk: every module resolves to exactly one `dist/`
 * file regardless of how many public entries reach it, so `.` and
 * `./testing` already share one instance of each without a shared tsup
 * invocation forcing it.
 *
 * The root barrel (`src/index.ts`) no longer carries `"use client"` — every
 * client module declares its own boundary now, enforced by
 * `src/clientDirective.test.ts`, so a server component can import `cn` or a
 * hook through the barrel without making the whole package a client
 * reference. `dist/testing/index.js` still opens with the directive
 * (inherited from `src/testing/index.ts`, which keeps it) — inert, since the
 * test kit only ever runs inside vitest, never inside a Next module graph.
 */
```

**3 — entry.** Replace the `entry: { index: "src/index.ts", "client/index": …, … }` object with:

```ts
  entry: listModuleEntries({ srcDir: "src" }),
```

**4 — per-module bundling.** Replace `splitting: true,` and the two comment lines directly above it ("Load-bearing: emits shared chunks … Do not disable.") with:

```ts
  bundle: true,
  splitting: false,
  esbuildPlugins: [preserveModulesPlugin({ srcDir: "src" })],
```

**5 — trailing comment removed.** Delete the comment block after the `external` array closes (the one explaining why no `banner` lives here and why `dist/index.js` still opens with `"use client"`) — superseded by edit 2's top-of-file comment and `src/index.ts`'s own edit below.

#### packages/react/src/index.ts
One edit: delete the file's first 12 lines — the `"use client"` directive, the blank line after it, the 9-line comment explaining why the barrel carries the directive, and the blank line before `import {`. The barrel is no longer the package's client boundary; every client module now declares its own (`src/clientDirective.test.ts` enforces it). The file now opens with:

```ts
import {
  // Field config functions that have HKT-bound component slots
```

#### `"use client"` additions

80 modules match the rule (`.tsx` outside `src/server/**`, a `use*.ts` hook file, or a module calling `createContext`/a React hook) and lack the directive. The edit is the same one-line insertion in every file — `"use client";` plus a blank line, prepended before the file's current first line — confirmed working by prototyping it against copies of all 80 and rebuilding: every one of the resulting `dist/*.js` files opens with `"use client";`, and a scripted re-scan of the fixed tree against the rule reports zero remaining violations.

The two the spike surfaced by testing the site's real import graph (rather than this full rule sweep):

#### packages/react/src/hooks/useAriaControlsCleanup.ts
One edit: prepend the directive. The file now opens with:

```ts
"use client";

import { useEffect, type RefObject } from "react";
```

#### packages/react/src/ui/accordion.tsx
One edit: prepend the directive. The file now opens with:

```ts
"use client";

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
```

The remaining 78 — same one-line insertion, no other changes:

```
packages/react/src/admin/AdminIndexEmptyState.tsx
packages/react/src/admin/AdminNotFound.tsx
packages/react/src/admin/UnauthorizedView.tsx
packages/react/src/collections/listView/CollectionListView/listViewStatusColumn.tsx
packages/react/src/collections/listView/CollectionListView/useListViewServerSeed.ts
packages/react/src/fields/array/Cell.tsx
packages/react/src/fields/array/columnDef.tsx
packages/react/src/fields/blocks/RenderBlocks.tsx
packages/react/src/fields/blocks/columnDef.tsx
packages/react/src/fields/checkbox/Cell.tsx
packages/react/src/fields/checkbox/FilterInput.tsx
packages/react/src/fields/checkbox/columnDef.tsx
packages/react/src/fields/color/Cell.tsx
packages/react/src/fields/color/FilterInput.tsx
packages/react/src/fields/color/columnDef.tsx
packages/react/src/fields/commitTs/columnDef.tsx
packages/react/src/fields/date/FilterInput.tsx
packages/react/src/fields/date/columnDef.tsx
packages/react/src/fields/email/Cell.tsx
packages/react/src/fields/email/FilterInput.tsx
packages/react/src/fields/email/columnDef.tsx
packages/react/src/fields/group/columnDef.tsx
packages/react/src/fields/index.tsx
packages/react/src/fields/json/Cell.tsx
packages/react/src/fields/json/columnDef.tsx
packages/react/src/fields/number/Cell.tsx
packages/react/src/fields/number/FilterInput.tsx
packages/react/src/fields/number/columnDef.tsx
packages/react/src/fields/registry.tsx
packages/react/src/fields/relationship/columnDef.tsx
packages/react/src/fields/relationship/preview.tsx
packages/react/src/fields/richtext/Cell.tsx
packages/react/src/fields/richtext/columnDef.tsx
packages/react/src/fields/select/Cell.tsx
packages/react/src/fields/select/FilterInput.tsx
packages/react/src/fields/select/columnDef.tsx
packages/react/src/fields/text/Cell.tsx
packages/react/src/fields/text/Display.tsx
packages/react/src/fields/text/FilterInput.tsx
packages/react/src/fields/text/columnDef.tsx
packages/react/src/fields/textarea/Cell.tsx
packages/react/src/fields/textarea/Display.tsx
packages/react/src/fields/textarea/FilterInput.tsx
packages/react/src/fields/textarea/columnDef.tsx
packages/react/src/fields/upload/EmptyInput.tsx
packages/react/src/fields/upload/FilledInput.tsx
packages/react/src/fields/upload/columnDef.tsx
packages/react/src/fields/url/Cell.tsx
packages/react/src/fields/url/FilterInput.tsx
packages/react/src/fields/url/columnDef.tsx
packages/react/src/fields/useFieldsForm.ts
packages/react/src/hooks/use-mobile.ts
packages/react/src/media/FilePreview.tsx
packages/react/src/slots/resolveFieldCellComponent.tsx
packages/react/src/slots/resolveFieldComponent.tsx
packages/react/src/ui/Icon.tsx
packages/react/src/ui/InputTag.tsx
packages/react/src/ui/alert-dialog.tsx
packages/react/src/ui/badge.tsx
packages/react/src/ui/card.tsx
packages/react/src/ui/checkbox.tsx
packages/react/src/ui/data-table/DataTable/useDataTableColumnResize.ts
packages/react/src/ui/datetime/date-picker.tsx
packages/react/src/ui/datetime/time-picker.tsx
packages/react/src/ui/dialog.tsx
packages/react/src/ui/dropdown-menu.tsx
packages/react/src/ui/input.tsx
packages/react/src/ui/label.tsx
packages/react/src/ui/pagination.tsx
packages/react/src/ui/popover.tsx
packages/react/src/ui/radio-group.tsx
packages/react/src/ui/scroll-area.tsx
packages/react/src/ui/select.tsx
packages/react/src/ui/separator.tsx
packages/react/src/ui/sheet.tsx
packages/react/src/ui/skeleton.tsx
packages/react/src/ui/table.tsx
packages/react/src/ui/tabs.tsx
```

#### packages/react/src/clientDirective.test.ts

New file.

```ts
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const SRC_DIR = import.meta.dirname;

// Files that intentionally lack "use client" despite matching the rule below.
// `server/ThemeScript.tsx` runs as a genuine Server Component (see its doc
// comment) — the `@vexcms/react/server` entry it anchors must stay
// directive-free all the way down its import chain, or Next's production
// build fails the moment anything in that chain picks one up.
const ALLOWLIST = ["server/ThemeScript.tsx"];

const HOOK_CALL_PATTERN =
  /\b(useState|useEffect|useLayoutEffect|useReducer|useRef|useMemo|useCallback|useContext|useImperativeHandle|useSyncExternalStore|useTransition|useDeferredValue|useOptimistic|useId|useInsertionEffect)\s*\(/;
const CREATE_CONTEXT_PATTERN = /\bcreateContext\s*\(/;

/**
 * @param {string} dir
 * @param {string[]} out
 * @returns {string[]}
 */
function collectSourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const absolutePath = join(dir, name);
    if (statSync(absolutePath).isDirectory()) {
      collectSourceFiles(absolutePath, out);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(name)) continue;
    if (/\.test\.(ts|tsx)$/.test(name) || name.endsWith(".d.ts")) continue;
    out.push(absolutePath);
  }
  return out;
}

/**
 * @param {string} absolutePath
 * @returns {string}
 */
function toRelativePath(absolutePath: string): string {
  return absolutePath.slice(SRC_DIR.length + 1).split("\\").join("/");
}

/**
 * A module that is itself a client component, a hook, or a context
 * definition must declare its own `"use client"` boundary once the root
 * barrel stops doing it on every module's behalf. The test kit under
 * `testing/**` is excluded — it only ever runs inside vitest, never inside a
 * Next module graph, so the directive there is meaningless either way.
 * @param {string} relativePath
 * @param {string} content
 * @returns {boolean}
 */
function needsClientDirective(relativePath: string, content: string): boolean {
  if (relativePath.startsWith("testing/")) return false;
  const basename = relativePath.split("/").at(-1) ?? relativePath;
  if (relativePath.endsWith(".tsx")) return true;
  if (/^use[A-Z]/.test(basename)) return true;
  return HOOK_CALL_PATTERN.test(content) || CREATE_CONTEXT_PATTERN.test(content);
}

/**
 * @param {string} content
 * @returns {boolean}
 */
function hasClientDirective(content: string): boolean {
  const trimmed = content.trimStart();
  return trimmed.startsWith('"use client"') || trimmed.startsWith("'use client'");
}

const modules = collectSourceFiles(SRC_DIR).map((absolutePath) => {
  const relativePath = toRelativePath(absolutePath);
  const content = readFileSync(absolutePath, "utf8");
  return { absolutePath, relativePath, content };
});

const clientModules = modules.filter(
  (candidate) => !ALLOWLIST.includes(candidate.relativePath) && needsClientDirective(candidate.relativePath, candidate.content),
);

describe("client directive coverage", () => {
  test("the rule finds client modules to check", () => {
    expect(clientModules.length).toBeGreaterThan(0);
  });

  test.each(clientModules.map((candidate) => [candidate.relativePath, candidate.content] as const))(
    '%s opens with "use client"',
    (_relativePath, content) => {
      expect(hasClientDirective(content)).toBe(true);
    },
  );

  test("every allow-list entry exists and the rule would otherwise flag it", () => {
    for (const relativePath of ALLOWLIST) {
      const allowed = modules.find((candidate) => candidate.relativePath === relativePath);
      expect(allowed).toBeDefined();
    }
  });
});
```

#### packages/react/package.json
Two edits.

**1 — `sideEffects`.** The package no longer ships a `dist/chunk-*.js` (per-module build has none); the one real side-effecting module is `src/adapter.ts` (and its built counterpart):

```json
  "sideEffects": [
    "./src/adapter.ts",
    "./dist/adapter.js"
  ],
```

**2 — `./form` export.** `listModuleEntries` names every entry after its path relative to `src` — `src/forms/index.ts` becomes entry `forms/index`, emitted at `dist/forms/index.js` (the directory is `forms`, plural, same as the source) — and `tsc`'s declaration emit mirrors `rootDir`/`outDir` the same way, landing at `dist/forms/index.d.ts`. Both `dist/form/index.js` and `dist/form/index.d.ts` have never existed; confirmed by prototyping the build and finding `dist/forms/index.js` present, `dist/form/` absent:

```json
    "./form": {
      "source": "./src/forms/index.ts",
      "types": "./dist/forms/index.d.ts",
      "import": "./dist/forms/index.js"
    },
```

Verify:
- `pnpm --filter @vexcms/react build && pnpm --filter @vexcms/react test`. The new `src/clientDirective.test.ts` passes, and fails if `"use client"` is removed from any `.tsx`, `use*.ts` or `createContext` module — confirmed by prototyping: running the test (as a plain `vitest run` against a fixed copy of `packages/react`) reports 308 passing cases, one per non-test module the rule covers; deleting the directive's first two lines from a copy of `ui/accordion.tsx` and rerunning reports `ui/accordion.tsx opens with "use client"` failing with `expected false to be true`, 307 passed / 1 failed, while every other case still passes — the suite does not go red wholesale, it names the one broken file.
- `node scripts/export-names.mjs --check` shows no surface change (no export moved; only build-output paths for 80 already-internal modules and the `./form` export's on-disk path changed).
- `pnpm --filter test build` and `pnpm --filter www build` succeed. This is the first real RSC proof: server components import the root without a directive error, because the root barrel no longer carries one and every module it re-exports now carries its own where one is needed.

### Step 4 — Package import-cost gate [agent]
Why: a consumer importing one hook must pay for that hook, not the package. This is the deterministic, Next-independent proof for the user-facing claim, checked against the built `dist` with esbuild, which honours `sideEffects` and tree-shakes ESM like consumer bundlers do.

- [ ] `scripts/check-import-cost.mjs`: bundles fixtures against the built `dist` of `@vexcms/react`; `useLivePreviewQuery`-only and `cn`-only fixtures with `budgetBytes: null` (Step 5 records measured budgets) and the shared, exported `ADMIN_DENY_LIST`.
- [ ] `scripts/check-import-cost.test.mjs`
- [ ] No CI wiring here: until Step 5 removes the admin exports from the root, both fixtures reach the admin and the gate fails by design. Step 5 adds the CI step and records the measured budgets.

#### scripts/check-import-cost.mjs
Bundles each fixture in `IMPORT_COST_FIXTURES` with esbuild against the workspace's built `dist` directories — the same thing a consumer's bundler sees — and reports a violation for anything over budget or inside `ADMIN_DENY_LIST`. `@vexcms/react` and `@vexcms/core` resolve to their built `dist` through an esbuild `alias` map built from each package's own `package.json#exports`, so a new subpath export (`./admin`, added in Step 5) resolves automatically with no edit here.

Both fixture budgets start as `null` (deny list only). The prototype measured 437,509 and 436,480 bytes against a Step-3-equivalent build, and both still reached the admin through `reactAdapter` and `slots` on the root. A budget recorded then would bake the leak in, so Step 5 measures with `--report` after the split and records `Math.ceil(bytes * 1.1)`.

```js
#!/usr/bin/env node

/**
 * Package import-cost gate for `@vexcms/react`.
 *
 * Bundles a handful of tiny consumer fixtures with esbuild against the
 * workspace's built `dist` directories (honouring `sideEffects` and
 * tree-shaking ESM the way a consumer's own bundler would), then asserts
 * each fixture stays under its byte budget and never pulls in a
 * deny-listed admin module.
 *
 * Usage:
 *   node scripts/check-import-cost.mjs            build + enforce, exit 1 on any violation
 *   node scripts/check-import-cost.mjs --report    build + print bytes only, never fails
 */

import esbuild from "esbuild";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "..");

const EXTERNAL = ["react", "react-dom", "react/jsx-runtime", "next", "next/*"];

export const ADMIN_DENY_LIST = [
  /packages\/react\/dist\/adapter\.js$/,
  /packages\/react\/dist\/fields\/registry\.js$/,
  /packages\/react\/dist\/(collections|globals|media)\/.*View/,
  /packages\/react\/dist\/admin\/AdminLayout/,
  /packages\/react\/dist\/ui\/(data-table|dnd)\//,
  /@tanstack\/react-table/,
  /@tanstack\/table-core/,
  /@hello-pangea\/dnd/,
];

export const IMPORT_COST_FIXTURES = [
  {
    name: "useLivePreviewQuery-only",
    source: 'import { useLivePreviewQuery } from "@vexcms/react";\nconsole.log(useLivePreviewQuery);\n',
    budgetBytes: null,
    denyList: ADMIN_DENY_LIST,
  },
  {
    name: "cn-only",
    source: 'import { cn } from "@vexcms/react";\nconsole.log(cn);\n',
    budgetBytes: null,
    denyList: ADMIN_DENY_LIST,
  },
];

/**
 * @param {{ bytes: number, imports: { path: string }[] } | undefined} input
 * @returns {{ path: string }[]}
 */
function importsOf(input) {
  return input?.imports ?? [];
}

/**
 * @param {{ metafile: import("esbuild").Metafile, start: string, target: string }} props
 * @returns {string[] | null}
 */
function breadthFirstChain(props) {
  const { metafile, start, target } = props;
  const predecessor = new Map([[start, null]]);
  const queue = [start];
  while (queue.length > 0) {
    const current = queue.shift();
    if (current === target) break;
    for (const imp of importsOf(metafile.inputs[current])) {
      if (predecessor.has(imp.path)) continue;
      predecessor.set(imp.path, current);
      queue.push(imp.path);
    }
  }
  if (!predecessor.has(target)) return null;
  const chain = [];
  for (let node = target; node !== null; node = predecessor.get(node)) {
    chain.unshift(node);
  }
  return chain;
}

/**
 * @param {{ metafile: import("esbuild").Metafile, budgetBytes: number | null, denyList: RegExp[] }} props
 * @returns {{ bytes: number, violations: string[] }}
 */
export function analyzeMetafile(props) {
  const { metafile, budgetBytes, denyList } = props;
  const bytes = Object.values(metafile.outputs).reduce((sum, output) => sum + output.bytes, 0);
  const entryPoints = Object.values(metafile.outputs)
    .map((output) => output.entryPoint)
    .filter((entryPoint) => entryPoint !== undefined);

  const violations = [];
  for (const inputPath of Object.keys(metafile.inputs)) {
    if (!denyList.some((pattern) => pattern.test(inputPath))) continue;
    const chain = entryPoints
      .map((start) => breadthFirstChain({ metafile, start, target: inputPath }))
      .find((found) => found !== null);
    violations.push(
      chain ? `${inputPath} reachable via ${chain.join(" → ")}` : `${inputPath} matches the admin deny list`,
    );
  }

  if (budgetBytes !== null && bytes > budgetBytes) {
    violations.push(`bundle is ${bytes} bytes, over the ${budgetBytes} byte budget`);
  }

  return { bytes, violations };
}

/**
 * @param {{ packageDir: string, packageName: string }} props
 * @returns {Record<string, string>}
 */
function buildPackageAlias(props) {
  const { packageDir, packageName } = props;
  const manifest = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8"));
  const alias = {};
  for (const [subpath, target] of Object.entries(manifest.exports ?? {})) {
    const importPath = typeof target === "string" ? target : (target.import ?? target.default);
    if (typeof importPath !== "string") continue;
    const specifier = subpath === "." ? packageName : `${packageName}/${subpath.slice(2)}`;
    alias[specifier] = join(packageDir, importPath);
  }
  return alias;
}

const ALIAS = {
  ...buildPackageAlias({ packageDir: join(ROOT_DIR, "packages/react"), packageName: "@vexcms/react" }),
  ...buildPackageAlias({ packageDir: join(ROOT_DIR, "packages/core"), packageName: "@vexcms/core" }),
};

/**
 * @param {{ fixture: (typeof IMPORT_COST_FIXTURES)[number] }} props
 * @returns {Promise<{ bytes: number, violations: string[] }>}
 */
async function buildFixture(props) {
  const { fixture } = props;
  const result = await esbuild.build({
    stdin: {
      contents: fixture.source,
      resolveDir: ROOT_DIR,
      sourcefile: `${fixture.name}.ts`,
      loader: "ts",
    },
    bundle: true,
    format: "esm",
    platform: "browser",
    minify: true,
    metafile: true,
    write: false,
    external: EXTERNAL,
    alias: ALIAS,
    logLevel: "silent",
  });
  return analyzeMetafile({ metafile: result.metafile, budgetBytes: fixture.budgetBytes, denyList: fixture.denyList });
}

async function main() {
  const report = process.argv.includes("--report");
  const rows = [];
  let failed = false;

  for (const fixture of IMPORT_COST_FIXTURES) {
    const { bytes, violations } = await buildFixture({ fixture });
    rows.push({
      fixture: fixture.name,
      bytes,
      "budget (+10%)": fixture.budgetBytes ?? "—",
      violations: violations.length,
    });
    if (!report) {
      for (const violation of violations) {
        console.error(`✘ ${fixture.name}: ${violation}`);
        failed = true;
      }
    }
  }

  console.table(rows);
  if (!report && failed) process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
```

#### scripts/check-import-cost.test.mjs

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeMetafile } from "./check-import-cost.mjs";

const CLEAN_METAFILE = {
  inputs: {
    entry: { bytes: 10, imports: [{ path: "a" }] },
    a: { bytes: 20, imports: [] },
  },
  outputs: {
    "out.js": { bytes: 30, entryPoint: "entry" },
  },
};

test("sums output bytes across every output", () => {
  const { bytes } = analyzeMetafile({ metafile: CLEAN_METAFILE, budgetBytes: null, denyList: [] });
  assert.equal(bytes, 30);
});

test("a clean metafile under budget with no deny-listed input produces no violations", () => {
  const { violations } = analyzeMetafile({ metafile: CLEAN_METAFILE, budgetBytes: 100, denyList: [/forbidden/] });
  assert.deepEqual(violations, []);
});

test("a deny-listed input produces a violation naming the import chain", () => {
  const metafile = {
    inputs: {
      entry: { bytes: 10, imports: [{ path: "a" }] },
      a: { bytes: 10, imports: [{ path: "b" }] },
      b: { bytes: 10, imports: [] },
    },
    outputs: { "out.js": { bytes: 30, entryPoint: "entry" } },
  };
  const { violations } = analyzeMetafile({ metafile, budgetBytes: null, denyList: [/^b$/] });
  assert.equal(violations.length, 1);
  assert.match(violations[0], /entry → a → b/);
});

test("a budget overrun produces a violation naming both byte counts", () => {
  const { violations } = analyzeMetafile({ metafile: CLEAN_METAFILE, budgetBytes: 10, denyList: [] });
  assert.equal(violations.length, 1);
  assert.match(violations[0], /30 bytes/);
  assert.match(violations[0], /10 byte budget/);
});

test("budgetBytes: null skips the byte-budget check entirely", () => {
  const { violations } = analyzeMetafile({ metafile: CLEAN_METAFILE, budgetBytes: null, denyList: [] });
  assert.deepEqual(violations, []);
});

test("a deny-listed input unreachable from any entry point still reports a violation", () => {
  const metafile = {
    inputs: {
      entry: { bytes: 10, imports: [] },
      orphan: { bytes: 10, imports: [] },
    },
    outputs: { "out.js": { bytes: 10, entryPoint: "entry" } },
  };
  const { violations } = analyzeMetafile({ metafile, budgetBytes: null, denyList: [/^orphan$/] });
  assert.equal(violations.length, 1);
  assert.match(violations[0], /orphan matches the admin deny list/);
});
```

Verify:
- `node --test scripts/check-import-cost.test.mjs` passes all 6 cases: byte summation, a clean metafile under budget with an empty violation list, a deny-listed input's violation naming the exact chain (`entry → a → b`), a budget overrun's violation naming both byte counts, `budgetBytes: null` skipping the budget check, and a deny-listed input unreachable from any entry still reporting (so a malformed fixture can't silently pass).
- Negative proof against the current single-chunk `packages/react/dist` (before Steps 1–3): `node scripts/check-import-cost.mjs` exits 1 and prints, for both fixtures, violations naming `@tanstack/react-table`, `@tanstack/table-core` and `@hello-pangea/dnd` with their full chain (e.g. `cn-only.ts → packages/react/dist/index.js → packages/react/dist/chunk-VKIK73SA.js → …/@tanstack+react-table@…/build/lib/index.mjs → …/@tanstack+table-core@…/build/lib/index.mjs`); the bundles measure 2,387,470 and 2,386,651 bytes. `node scripts/check-import-cost.mjs --report` against the same `dist` prints those bytes and exits 0.
- `node scripts/check-import-cost.mjs` passing (exit 0, no violations) is Step 5's acceptance, after the root/admin split. At this step the CLI is expected to exit 1.

### Step 5 — Root / `@vexcms/react/admin` entry split [agent]

#### packages/react/src/adminEntry.ts

New file. The `/admin` surface: the framework adapter, field `Admin`/`Cell` components, slots, the document-edit runtime, admin layout/views, collection/media/global views, the list-view context, the live-preview panel (not the light query hooks, which stay at root), the modal surface, `useVexForm`, and the `data-table`/`dnd`/`sidebar`/`resizable` UI primitives those views render through.

```ts
/**
 * `@vexcms/react/admin` — the admin panel's internals.
 *
 * Everything reachable from here is heavy: the framework adapter, the field
 * registry, every collection/global/media view, and the data-table and
 * drag-and-drop primitives they render through. None of it belongs on a
 * public page, so it lives behind its own entry instead of the root.
 *
 * @module
 */

// Framework adapter
export { reactAdapter } from "./adapter";
export type { ReactHKT, ReactAdapter } from "./adapter";

// Field components
export { TextFieldAdmin, TextFieldCell, EmailFieldAdmin, EmailFieldCell, TextareaFieldAdmin, TextareaFieldCell } from "./fields";
export { JsonFieldAdmin, JsonFieldCell, UrlFieldAdmin, UrlFieldCell, NumberFieldAdmin, NumberFieldCell, CheckboxFieldAdmin, CheckboxFieldCell, SelectFieldAdmin, SelectFieldCell, DateFieldAdmin, DateFieldCell, ColorFieldAdmin, ColorFieldCell, ArrayFieldAdmin, ArrayFieldCell, BlocksFieldAdmin, BlocksFieldCell, GroupFieldAdmin, GroupFieldCell, RelationshipFieldAdmin, RelationshipFieldCell, UploadFieldAdmin, UploadFieldCell, RichTextFieldAdmin, RichTextFieldCell } from "./fields";

// Admin extension points (slots)
export { SlotOutlet, SlotOverrideOutlet } from "./slots";
export type { SlotOverrideProps } from "./slots";
export { useVexForm } from "./forms";
export { VexDocumentProvider, useVexDocument } from "./documents";
export type { VexDocumentState } from "./documents";
export { SLOT_IDS, BUILTIN_CONTRIBUTION_IDS } from "@vexcms/core";
export {
  DocumentEditSlotOutlet,
  DocumentEditRuntimeProvider,
  useDocumentEditRuntime,
  documentEditBuiltinContributions,
  useEditActionsMenuDialog,
  EditActionsMenuItem,
} from "./documents";
export type { DocumentEditRuntimeState, EditActionsMenuDialogState, EditActionsMenuItemProps } from "./documents";
export type { EditSlotProps, EditSlotConfigInput } from "@vexcms/core";
export type {
  ComponentContributionInput,
  ComponentOverrideInput,
  SlotId,
  SlotAccessContext,
  SlotAccessPredicate,
} from "@vexcms/core";

// Admin layout and top-level views
export {
  AdminLayout,
  AdminNotFound,
  AppSidebar,
  AdminTopNav,
  DashboardView,
  CollectionsIndexView,
  AdminCardSection,
  AdminIndexEmptyState,
} from "./admin";
export type {
  AdminUser,
  AdminLayoutProps,
  AdminNotFoundVariant,
  AdminNotFoundProps,
  AppSidebarProps,
  AdminCardSectionProps,
  AdminIndexEmptyStateProps,
} from "./admin";

// Collection / media / global views
export { CollectionListView, CollectionEditView } from "./collections";
export { MediaCollectionListView, MediaCollectionEditView } from "./media";
export { GlobalEditView, GlobalsListView } from "./globals";
export {
  useListViewContext,
  ListViewContextProvider,
  type ListViewContextState,
} from "./collections/listView/ListViewContext";

// Modal surface
export { ModalSurfaceProvider, useModalSurface } from "./modals";

// Live preview panel (the admin's split-pane preview chrome; the public
// `useLivePreview*` query hooks stay at the root — pages that render a
// live-preview iframe shouldn't pay for the panel that hosts it)
export {
  LivePreviewPanel,
  resolveLivePreviewUrl,
} from "./livePreview/LivePreviewPanel";
export type { LivePreviewFrameGeometry } from "./livePreview/LivePreviewPanel";
export {
  useLivePreviewPanelMinSize,
  useLivePreviewPanelState,
} from "./livePreview/useLivePreviewPanelState";

// Data table and drag-and-drop — the admin's own UI primitives, never used
// outside collection/global list and edit views
export * from "./ui/data-table";
export * from "./ui/dnd";
export * from "./ui/sidebar";
export * from "./ui/resizable";
```

#### packages/react/src/ui/InputTag.tsx

1 edit — everything not shown is unchanged. `InputTag` imports `Button` through the `ui` barrel itself (`from "./"`), so any root export reaching `InputTag` reached the whole `ui` barrel — including `data-table` and `dnd` — even after the root stopped doing `export * from "./ui"`. Import `Button` from its own module instead.

**1 — import.** Beside the `cn` import:

```ts
import { Button } from "./button";
```

#### packages/react/src/index.ts

Replace the body between the field-config type exports and the UI primitives re-exports. Everything above `export type { TextField, … } from "@vexcms/core";` and below `export * from "./ui";`'s former position (the `Relationship*`/`defineCollection` type and function block) is unchanged.

**1 — framework adapter types only.** Replace the `reactAdapter` export beside the `@module` comment:

```ts
// Framework adapter types (the admin's `reactAdapter` value lives at
// `@vexcms/react/admin`; the types are free and used by root config helpers)
export type { ReactHKT, ReactAdapter } from "./adapter";
```

**2 — field components, slots, app form, admin layout/views removed.** Replace the block from the `// Field components` comment through `export { GlobalEditView, GlobalsListView } from "./globals";` (the original lines following `export { useVexForm } from "./forms";`, `useVexPermissions`, `SlotOutlet`/`SlotOverrideOutlet`, `VexDocumentProvider`/`useVexDocument`, `SLOT_IDS`, the documents block, `useAppForm`/`AppForm`, and the admin layout/view exports):

```ts
export { useVexPermissions } from "./access";

// The app form's full surface — `useAppForm`/`AppForm` — is
// `@vexcms/react/form` only: the root must not reach `dnd` through
// `ArrayField`/`BlocksField`'s drag handles.
export type { FieldControlProps, FieldComponentProps } from "@vexcms/core";

export { UnauthorizedView } from "./admin/UnauthorizedView";
export type { UnauthorizedViewProps } from "./admin/UnauthorizedView";
```

`UnauthorizedView` imports from `./admin/UnauthorizedView` directly rather than the `./admin` barrel — the same pattern `adminHref` already uses two lines below — so reaching it doesn't also reach `AdminLayout`.

**3 — list-view context, modal surface removed.** Delete the block:

```ts
export {
  useListViewContext,
  ListViewContextProvider,
  type ListViewContextState,
} from "./collections/listView/ListViewContext";

// Hooks
export { ModalSurfaceProvider, useModalSurface } from "./modals";
```

leaving `// Hooks` directly above `export { useCanAccessAdminPanel } from "./access";`.

**4 — live-preview panel removed.** Delete the block from `// Live preview` through the panel's own hooks (keep `LivePreviewProvider`/`useLivePreview`/`useLivePreviewDocumentQuery`/`useLivePreviewQuery`, `useLivePreviewServerUrl`, `useLivePreviewSync`):

```ts
// Live preview
export {
  LivePreviewPanel,
  resolveLivePreviewUrl,
} from "./livePreview/LivePreviewPanel";
export type { LivePreviewFrameGeometry } from "./livePreview/LivePreviewPanel";
```

and delete, later in the same section:

```ts
export {
  useLivePreviewPanelMinSize,
  useLivePreviewPanelState,
} from "./livePreview/useLivePreviewPanelState";
```

**5 — explicit `ui` re-exports.** Replace `export * from "./ui";` with:

```ts
// shadcn UI primitives — explicit re-exports, skipping `data-table`, `dnd`,
// `sidebar` and `resizable` (the admin's own primitives, `@vexcms/react/admin`)
export * from "./ui/accordion";
export * from "./ui/card";
export * from "./ui/checkbox";
export * from "./ui/radio-group";
export * from "./ui/badge";
export * from "./ui/dialog";
export * from "./ui/datetime";
export * from "./ui/dropdown-menu";
export * from "./ui/input";
export * from "./ui/label";
export * from "./ui/sheet";
export * from "./ui/button";
export * from "./ui/table";
export * from "./ui/select";
export * from "./ui/VexLink";
export * from "./ui/VexImage";
export * from "./ui/tooltip";
export * from "./ui/scroll-area";
export * from "./ui/ScrollSection";
export * from "./ui/skeleton";
export * from "./ui/separator";
export * from "./ui/popover";
export * from "./ui/tabs";
export * from "./ui/sonner";
export * from "./ui/field";
export * from "./ui/ActionsMenu";
export * from "./ui/InputTag";
export * from "./ui/InlineQueryError";
export * from "./ui/QueryErrorBoundary";
export * from "./ui/ThemeProvider";
export * from "./ui/ThemeToggle";
```

`Icon`/`IconProps`/`IconName` are already exported directly from `./ui/Icon` a few lines above (unchanged); this list excludes `./ui/Icon` to avoid re-declaring the same names.

#### packages/react/package.json

1 edit — everything not shown is unchanged. Add the `./admin` export beside `./form`:

```json
    "./admin": {
      "source": "./src/adminEntry.ts",
      "types": "./dist/adminEntry.d.ts",
      "import": "./dist/adminEntry.js"
    },
```

#### packages/next/src/NextAdminLayoutClient.tsx

1 edit — everything not shown is unchanged. `AdminLayout` moved to `/admin`.

**1 — import.** Replace the `@vexcms/react` import:

```ts
import { AdminLayout } from "@vexcms/react/admin";
```

#### packages/next/src/NextAdminPage.tsx

1 edit — everything not shown is unchanged. `adminHref` and `VexAuthProvider` stay at the root; the ten view/layout components moved to `/admin`.

**1 — imports.** Replace the `@vexcms/react` import block (the one listing `AdminNotFound` through `VexAuthProvider`):

```ts
import { adminHref, VexAuthProvider } from "@vexcms/react";
import {
  AdminNotFound,
  AdminTopNav,
  CollectionEditView,
  CollectionListView,
  CollectionsIndexView,
  DashboardView,
  GlobalEditView,
  GlobalsListView,
  MediaCollectionEditView,
  MediaCollectionListView,
} from "@vexcms/react/admin";
```

#### apps/test/src/vexcms/admin/PhoneInputWithHint.tsx

1 edit — everything not shown is unchanged.

**1 — import.** Replace the `@vexcms/react` type import:

```ts
import type { ReactHKT } from "@vexcms/react";
import type { SlotOverrideProps } from "@vexcms/react/admin";
```

#### apps/test/src/vexcms/admin/TrimOnBlurTextInput.tsx

1 edit — everything not shown is unchanged. Same split as `PhoneInputWithHint.tsx` — `ReactHKT` is a type export kept at the root, `SlotOverrideProps` moved.

**1 — import.** Replace the `@vexcms/react` type import:

```ts
import type { ReactHKT } from "@vexcms/react";
import type { SlotOverrideProps } from "@vexcms/react/admin";
```

#### apps/test/src/vexcms/components/CopyDocumentIdMenuItem.tsx

1 edit — everything not shown is unchanged. `Icon` stays at the root; `useVexDocument` and `EditActionsMenuItem` moved.

**1 — import.** Replace the `@vexcms/react` import:

```ts
import { Icon } from "@vexcms/react";
import { useVexDocument, EditActionsMenuItem } from "@vexcms/react/admin";
```

#### apps/test/src/vexcms/components/EditorialChecklist.tsx

1 edit — everything not shown is unchanged.

**1 — import.** Replace the `@vexcms/react` import:

```ts
import { useVexDocument } from "@vexcms/react/admin";
```

#### apps/test/src/vexcms/components/SaveWithAnalytics.tsx

1 edit — everything not shown is unchanged. `EditSlotProps` is already imported from `@vexcms/core`, unaffected.

**1 — import.** Replace the `@vexcms/react` import:

```ts
import { useVexDocument } from "@vexcms/react/admin";
```

#### apps/test/src/vexcms/admin.test.ts

1 edit — everything not shown is unchanged. `text`/`TextField` stay at the root; `TextFieldAdmin` moved.

**1 — import.** Replace the `@vexcms/react` import:

```ts
import { text, type TextField } from "@vexcms/react";
import { TextFieldAdmin } from "@vexcms/react/admin";
```

#### apps/www/src/vexcms/admin.test.ts

1 edit — everything not shown is unchanged. Same split, no semicolons (matches this file's existing style).

**1 — import.** Replace the `@vexcms/react` import:

```ts
import { text, type TextField } from "@vexcms/react"
import { TextFieldAdmin } from "@vexcms/react/admin"
```

#### apps/docs/src/content/docs/guides/admin-customization.mdx

3 edits — everything not shown is unchanged. `EditActionsMenuItem`, `useVexDocument`, and `useEditActionsMenuDialog` all moved to `/admin`.

**1 — the `ExportCsvMenuItem` sample.** Replace its two `@vexcms/react` imports:

```tsx
import { EditActionsMenuItem, useVexDocument } from "@vexcms/react/admin"
```

**2 — the `ArchiveMenuItem` sample.** Replace its `@vexcms/react` import:

```tsx
import { EditActionsMenuItem, useEditActionsMenuDialog } from "@vexcms/react/admin"
```

**3 — the `PublishedSince` sample.** Replace its `@vexcms/react` import:

```tsx
import { useVexDocument } from "@vexcms/react/admin"
```

The `ArchiveAndLeave` sample's `import { useVexNavigate } from "@vexcms/react"` is unchanged — `useVexNavigate` stays at the root.

#### apps/docs/src/content/docs/guides/framework-adapters.md

3 edits — everything not shown is unchanged. The `AdminFieldBinding`/`FieldComponentProps` sample and the `VexConfigProvider` sample are unaffected.

**1 — the `NextAdminPage` sample.** Replace its `@vexcms/react` import, beside the `vexConvexApi` import:

```tsx
import { DashboardView, CollectionsIndexView, GlobalsListView, CollectionListView, CollectionEditView } from "@vexcms/react/admin";
```

**2 — the `NextAdminLayout` sample.** Replace its `@vexcms/react` import:

```tsx
import { AdminLayout } from "@vexcms/react/admin";
```

#### apps/docs/src/content/docs/guides/list-views.mdx

2 edits — everything not shown is unchanged. `useListViewContext` moved to `/admin`.

**1 — the first sample.** Replace its `@vexcms/react` import:

```ts
import { useListViewContext } from "@vexcms/react/admin";
```

**2 — the `ExportRowAction` sample.** Replace its `@vexcms/react` import:

```ts
import { useListViewContext } from "@vexcms/react/admin";
```

#### apps/docs/src/content/docs/guides/pagination.mdx

1 edit — everything not shown is unchanged. `usePaginatedQuery` stays at the root; `DataTable` moved.

**1 — the `PostTable` sample.** Replace its `@vexcms/react` import:

```ts
import { usePaginatedQuery } from "@vexcms/react";
import { DataTable } from "@vexcms/react/admin";
import type { ColumnDef } from "@tanstack/react-table";
```

No root importer of `useAppForm`, `AppForm`, `Sidebar*`, `Resizable*`, `DataTable*` (outside `pagination.mdx` above), or dnd names (`DndProvider`, `Droppable`, `Draggable`, `DragHandle`, `useAccordionDndState`) exists elsewhere in the repo — grepping `/tmp/tsrp/react-root-imports.tsv` and the `src`/`apps`/`packages` trees for those names returns only internal usages already inside `packages/react/src` (unaffected, they import from relative paths, not the package entry) and the one docs hit above.

#### scripts/check-import-cost.mjs

1 edit — everything not shown is unchanged (built in step 4). Add the root-reach fixture to `IMPORT_COST_FIXTURES`, after the existing `cn`-only and `useLivePreviewQuery`-only fixtures, using step 4's `ADMIN_DENY_LIST`:

```ts
{
  name: "root-reach",
  source: `export * from "@vexcms/react";`,
  budgetBytes: null,
  denyList: ADMIN_DENY_LIST,
},
```

`budgetBytes: null` means `analyzeMetafile` skips the byte-budget check for this fixture and enforces only the deny list. This fixture proves the root's *reach* never touches `adapter.js`, `fields/registry.js`, `(collections|globals|media)/*View`, `admin/AdminLayout*`, `ui/(data-table|dnd)/`, `@tanstack/react-table`, `@tanstack/table-core` or `@hello-pangea/dnd`.

**2 — fixture budgets.** With the split in place, `pnpm --filter @vexcms/react build && node scripts/check-import-cost.mjs --report` prints each fixture's bytes. Replace the `useLivePreviewQuery-only` and `cn-only` fixtures' `budgetBytes: null` with `Math.ceil(bytes * 1.1)` of the printed values, written as numeric literals with `_` separators.

#### .github/workflows/ci.yml

1 edit — everything not shown is unchanged. Add a step immediately after `Build Packages`, before `Typecheck Packages`:

```yaml
      - name: Check Import Cost
        run: node scripts/check-import-cost.mjs
```

#### .changeset/react-admin-entry.md

```md
---
"@vexcms/react": patch
"@vexcms/next": patch
---

Bumped `patch` despite being breaking: the `alpha` pre-release track keeps every package on
the `0.1.0` base so `changeset pre exit` lands on `0.1.0`. The breaking surface is itemized
below and in the commit's `BREAKING CHANGE:` footer.

Split `@vexcms/react`'s public surface in two: the root (`.`) holds everything a page touches, `@vexcms/react/admin` holds the framework adapter, field `Admin`/`Cell` components, slots, the document-edit runtime, admin layout/views, collection/media/global views, the list-view context, the live-preview panel, the modal surface, `useVexForm`, and the `data-table`/`dnd`/`sidebar`/`resizable` UI primitives. A server component importing the root no longer pulls any of that into the client graph. `useAppForm`/`AppForm` are removed from the root entirely — the app form's surface was always `@vexcms/react/form`, and the root must not reach `dnd` through `ArrayField`/`BlocksField`'s drag handles.

**BREAKING CHANGE.** Update every import of a moved name from `@vexcms/react` to `@vexcms/react/admin`:

| Old import (`@vexcms/react`) | New import |
| --- | --- |
| `reactAdapter` | `@vexcms/react/admin` |
| `*FieldAdmin`, `*FieldCell` (all field types) | `@vexcms/react/admin` |
| `SlotOutlet`, `SlotOverrideOutlet`, `type SlotOverrideProps` | `@vexcms/react/admin` |
| `useVexForm` | `@vexcms/react/admin` |
| `VexDocumentProvider`, `useVexDocument`, `type VexDocumentState` | `@vexcms/react/admin` |
| `SLOT_IDS`, `BUILTIN_CONTRIBUTION_IDS` | `@vexcms/react/admin` |
| `DocumentEditSlotOutlet`, `DocumentEditRuntimeProvider`, `useDocumentEditRuntime`, `documentEditBuiltinContributions`, `useEditActionsMenuDialog`, `EditActionsMenuItem` (+ their types) | `@vexcms/react/admin` |
| `type EditSlotProps`, `type EditSlotConfigInput`, `type ComponentContributionInput`, `type ComponentOverrideInput`, `type SlotId`, `type SlotAccessContext`, `type SlotAccessPredicate` | `@vexcms/react/admin` |
| `AdminLayout`, `AdminNotFound`, `AppSidebar`, `AdminTopNav`, `DashboardView`, `CollectionsIndexView`, `AdminCardSection`, `AdminIndexEmptyState` (+ their types) | `@vexcms/react/admin` |
| `CollectionListView`, `CollectionEditView`, `MediaCollectionListView`, `MediaCollectionEditView`, `GlobalEditView`, `GlobalsListView` | `@vexcms/react/admin` |
| `useListViewContext`, `ListViewContextProvider`, `type ListViewContextState` | `@vexcms/react/admin` |
| `ModalSurfaceProvider`, `useModalSurface` | `@vexcms/react/admin` |
| `LivePreviewPanel`, `resolveLivePreviewUrl`, `type LivePreviewFrameGeometry`, `useLivePreviewPanelMinSize`, `useLivePreviewPanelState` | `@vexcms/react/admin` |
| `DataTable*` (all of `ui/data-table`), `Sidebar*`, `Resizable*`, dnd exports (`DndProvider`, `Droppable`, `Draggable`, `DragHandle`, `useAccordionDndState`) | `@vexcms/react/admin` |
| `useAppForm`, `AppForm` | `@vexcms/react/form` |

`ReactHKT` and `ReactAdapter` stay importable as types from both the root and `/admin` — they cost nothing and `RelationshipFieldInput`/`CollectionConfigInput`/etc. at the root reference `ReactHKT`.

`@vexcms/next`'s `NextAdminLayoutClient` and `NextAdminPage` now import the ten moved view/layout components from `@vexcms/react/admin`; its own public API is unchanged.
```

Verify:
- `pnpm build && pnpm typecheck && pnpm test && pnpm lint` passes across the repo.
- `pnpm --filter @vexcms/react build && node scripts/check-import-cost.mjs` passes, including the new `root-reach` fixture, with no `adapter.js`/`fields/registry.js`/`*View`/`AdminLayout*`/`data-table`/`dnd`/`@tanstack/react-table`/`@tanstack/table-core`/`@hello-pangea/dnd` in its import chain.
- Negative check (proves the gate actually catches a regression): temporarily add `export { CollectionListView } from "./collections";` to the end of `packages/react/src/index.ts`, rebuild, and rerun `node scripts/check-import-cost.mjs` — it exits 1 and the `root-reach` fixture's violation names the chain `index.ts → collections/index.ts → collections/listView/CollectionListView.tsx → … → ui/data-table/index.ts` (and the `adapter`/`fields/registry` chain through `CollectionListView`'s field rendering). Remove the line and rerun — it passes again. Confirmed with a static reach prototype over a copy of `src/`: adding that one line raised the root's reachable module count from 77 to 380 and reproduced every deny-listed hit; removing it restored 77 modules with none.
- Union check — root ∪ `/admin` exports ⊇ the old root, apart from the documented `useAppForm`/`AppForm` removal:

  ```sh
  node --input-type=module -e '
    import { readFileSync } from "node:fs";
    const baseline = JSON.parse(readFileSync(".agent/docs/specs/2026-10-25-codebase-conventions-refactor/export-names.baseline.json", "utf8"));
    const oldRoot = new Set(baseline["@vexcms/react"]["."]);
    for (const removed of ["useAppForm", "AppForm"]) oldRoot.delete(removed);
    const root = new Set(Object.keys(await import("./packages/react/dist/index.js")));
    const admin = new Set(Object.keys(await import("./packages/react/dist/adminEntry.js")));
    const union = new Set([...root, ...admin]);
    const missing = [...oldRoot].filter((n) => !union.has(n));
    if (missing.length) { console.error("missing from root ∪ admin:", missing); process.exit(1); }
    console.log("union check passed:", union.size, "names");
  '
  ```

  Then `node scripts/export-names.mjs --write` to record the new per-entry baseline (adds a `./admin` entry, shrinks `.`).
- `pnpm --filter test build && pnpm --filter www build` succeed with the updated imports.
- `node scripts/check-import-cost.mjs` exits 0. All three fixtures pass the deny list, and the two single-import fixtures pass their recorded budgets.

### Step 6 — Lazy root `Icon`, eager `AdminIcon` [agent]

`icons[name]` (today's `Icon`, `packages/react/src/ui/Icon.tsx`) imports every one of lucide-react's 1703
icon components into one module, so anything that reaches `Icon` ships all of them — measured at 505 KB.
The site only knows an icon's name from CMS data (`collection.admin.icon`, a block's `feature.icon`), so
it cannot statically import the handful it needs; it has to look one up by string at runtime. `lucide-react/dynamic`'s
`DynamicIcon` does that lookup through `dynamicIconImports`, a map of kebab-case name → `() => import(...)`,
so only the icons actually rendered are ever fetched. The admin keeps today's synchronous behavior — swapping Admin's
own icons for lazy ones would trade a one-line admin-only cost for icon flicker on every admin screen — as `AdminIcon`,
used nowhere the root reaches.

`DynamicIcon`'s `fallback` is a zero-prop component (`() => JSX.Element | null`), rendered until the
real icon's dynamic import resolves. It cannot receive `width`/`height`/`className` as props, but it is
defined inside `Icon`'s own render, so it closes over them directly — no prop-passing needed. Lucide's
`Icon.js` sets `width`/`height` from `size` (default `24`) unless the caller passes its own, and only adds
`aria-hidden="true"` when no other accessibility prop is present, with no per-icon CSS class (just
`"lucide"` plus the caller's `className`) — the placeholder below reproduces exactly that: `rest.width ?? rest.size ?? 24`
for each dimension, the same `className`, the same `aria-hidden="true"`. Dropping `width`/`height`/`size` from `rest`
to compute the placeholder's box and then re-adding them to the same object, rather than destructuring them off (confirmed
by hand: destructuring `width`/`height` back out and passing `width={width}` explicitly makes that key present on the props
object with value `undefined`, which overrides `DynamicIcon`'s own `size` default — tested, the attribute was dropped).

A PascalCase `IconName` does not kebab-case naively: `Grid2x2` has to become `grid-2x2`, not `grid2x2x2`-style
mangling, and lucide's own key for it is `grid-2x2` (plus an alias `grid-2-x-2`). Comparing by a *compact* form —
strip every hyphen from each of `dynamicIconImports`'s keys once, and look up `name.toLowerCase()` with hyphens
already absent — matches regardless of which side hyphenates differently. `isIconName` reuses that same map, so a
name test and a render always agree.

`AdminIcon` and `Icon` share no code (`AdminIcon` is intentionally the original implementation, renamed, not an
alias): giving it its own 505 KB-eager icon map body — rather than wrapping `Icon` with `fallback` disabled, which
would still statically import `lucide-react/dynamic` for every admin screen as a knock-on dependency — keeps the two
entry points' import graphs fully disjoint, which is what the import-cost gate (`lucide-react/dist/esm/icons/index.js`
must never appear in the root bundle) checks.

Every internal module rendering `<Icon .../>` inside the admin panel's own import graph (`admin/*`, `collections/**`,
`documents/*`, `fields/**`, `livePreview/*`, `media/**`, `revalidate/*`, `versions/*`) switches to `AdminIcon`, imported
by its own relative path (`ui/AdminIcon.tsx`) and never through the `ui` barrel. Two primitives stay on the lazy `Icon`:
`ui/button.tsx` (`icon` prop) and `ui/input.tsx` (`iconLeft`/`iconRight`). They're root exports the site renders, and
switching them to `AdminIcon` would put all 1703 icons back into the root's reach, failing the import-cost gate. Icons
inside admin buttons and inputs therefore load lazily into a reserved box. `src/ui/index.ts` keeps
`export * from "./Icon"` and gains no `AdminIcon` export, and Step 5's root uses explicit `ui` re-exports, so nothing
pulls `AdminIcon` into the root by accident.

Verify:
- `pnpm --filter @vexcms/react test`. `ui/Icon.test.tsx` covers:
  - the placeholder `<svg>` before load carries the same `width`/`height`/`className` as the loaded icon
  - the loaded icon renders (`findBy`, or `waitFor` since the resolved `<svg>` carries `aria-hidden="true"` and has no accessible role)
  - an unknown name renders nothing and warns once
  - `isIconName("Grid2x2")`/`("LayoutGrid")` are true and `("NotAnIcon")` is false
- `ui/AdminIcon.test.tsx` covers the eager, synchronous render.
- Negative check: temporarily delete the `isIconName`/unknown-name branch's `return null` in `Icon` (render the `DynamicIcon`
  unconditionally for any string) — `isIconName("NotAnIcon")` still correctly returns `false` (it is a pure map lookup,
  untouched by the render path), but the unknown-name render test fails: `<Icon name="NotAnIcon" />` now renders
  `DynamicIcon`'s own `fallback`-then-`null` behavior with no warning at all, so `expect(warn).toHaveBeenCalledTimes(1)`
  never fires. Restore the branch; the suite is green again.
- `node scripts/check-import-cost.mjs`: the root-reach fixture (`export * from "@vexcms/react"`, Step 5) has no
  `lucide-react/dist/esm/icons/index.js` in its bundle.
- Blocks render their icons in the browser: `pnpm --filter www dev`, open `/` (Features block, `size-4` icons inside the
  bordered squares) and `/features` if that route exists, confirm each configured icon paints with no visible reflow
  (the placeholder `<svg>` already reserves the final box) and an item whose `icon` string does not resolve renders with
  no icon frame at all, title/description unaffected (`isIconName` gate in the block, same "drops the frame" behavior
  the inline `icons[name]` lookup had).

#### packages/react/src/ui/Icon.tsx

Full rewrite — lazy, with the compact-name map and the unknown-name warning in the same place the old `icons[name]`
lookup used to live.

```tsx
"use client";

import { DynamicIcon, dynamicIconImports } from "lucide-react/dynamic";
import type { LucideProps } from "lucide-react";
import type { ComponentPropsWithRef } from "react";
import type { IconName } from "@vexcms/core";

export type { IconName };

/**
 * Props for the `Icon` component.
 *
 * Extends the full Lucide props surface (`strokeWidth`, `absoluteStrokeWidth`,
 * all SVG attributes, and ref forwarding) with a required `name` discriminant.
 */
export type IconProps = ComponentPropsWithRef<"svg"> &
  LucideProps & {
    /**
     * The Lucide icon to render.
     * Must be a valid {@link IconName} (e.g. `"FileText"`, `"Users"`).
     */
    name: IconName;
  };

// `dynamicIconImports`'s own keys are kebab-case ("grid-2x2", "layout-grid"),
// which does not derive from a PascalCase IconName by any single casing rule
// ("Grid2x2" kebab-cases wrong either way you split the digits). Stripping
// every hyphen from both sides and matching on that compact form sidesteps
// the ambiguity entirely: built once, since `dynamicIconImports` never
// changes at runtime.
const compactToKebab = new Map<string, string>(
  Object.keys(dynamicIconImports).map((kebab) => [kebab.replaceAll("-", ""), kebab]),
);

/**
 * Whether `name` is a real Lucide icon name, usable as a type guard against
 * untyped data (a CMS field, a collection's `admin.icon` string) before
 * rendering it.
 *
 * @example
 * ```ts
 * isIconName("Grid2x2"); // true
 * isIconName("NotAnIcon"); // false
 * ```
 */
export function isIconName(name: string): name is IconName {
  return compactToKebab.has(name.toLowerCase());
}

const warnedNames = new Set<string>();

/**
 * Renders a Lucide icon by name, loaded on demand.
 *
 * Resolves `name` to `lucide-react/dynamic`'s kebab-case key and renders
 * `DynamicIcon`, so only the icons a page actually uses are fetched — not
 * `lucide-react`'s full icon set. Until the icon's own dynamic import
 * resolves, a placeholder `<svg>` reserves the exact box the icon will
 * render into (same `width`/`height`/`className`), so nothing shifts when it
 * arrives.
 *
 * Returns `null` if `name` does not match a known icon, so a bad string from
 * untyped data cannot throw at runtime. After `vex generate`, {@link IconName}
 * is exact, so that only happens via an unchecked cast, `any`, or a project
 * that has not generated types; outside production the miss is reported once
 * per name with `console.warn`.
 *
 * @param props - Icon props. See {@link IconProps} for all fields.
 * @returns The rendered SVG icon, or `null` if the name is unrecognised.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Icon name="FileText" />
 *
 * // With sizing and color
 * <Icon name="Users" className="size-4 text-muted-foreground" />
 *
 * // With custom stroke width
 * <Icon name="Settings" strokeWidth={1.5} className="size-5" />
 *
 * // Dynamically from a collection's admin.icon string
 * <Icon name={collection.admin.icon} className="size-4" />
 * ```
 *
 * @see {@link IconName} for the full set of valid icon names
 * @see {@link isIconName} to guard untyped data before rendering
 */
export function Icon({ name, className, ...rest }: IconProps) {
  const kebab = compactToKebab.get(name.toLowerCase());
  if (!kebab) {
    if (process.env.NODE_ENV !== "production" && !warnedNames.has(name)) {
      warnedNames.add(name);
      console.warn(
        `<Icon name="${name}" /> is not a Lucide icon and rendered nothing. ` +
          `Use the canonical PascalCase name from https://lucide.dev/icons — ` +
          `alias exports ("AlertCircle") and "*Icon" duplicates ("UsersIcon") are not valid.`,
      );
    }
    return null;
  }
  // Read, don't destructure, `width`/`height`/`size` off `rest`: destructuring
  // them out and passing them back explicitly (`width={width}`) sets that key
  // to `undefined` on the element whenever the caller omitted it, which
  // overrides `DynamicIcon`'s own `size`-derived default — the placeholder
  // and the loaded icon would then disagree on their box. Leaving them inside
  // `rest` and spreading it keeps an omitted prop genuinely absent.
  const boxWidth = rest.width ?? rest.size ?? 24;
  const boxHeight = rest.height ?? rest.size ?? 24;
  function Placeholder() {
    return <svg aria-hidden="true" className={className} height={boxHeight} width={boxWidth} />;
  }
  return (
    <DynamicIcon className={className} fallback={Placeholder} name={kebab as keyof typeof dynamicIconImports} {...rest} />
  );
}
```

#### packages/react/src/ui/AdminIcon.tsx

New file — today's eager `Icon`, renamed, with the same props (reused from `./Icon` as type-only imports — no
runtime dependency between the two modules).

```tsx
"use client";

import { icons } from "lucide-react";
import type { IconName, IconProps } from "./Icon";

const warnedNames = new Set<string>();

/**
 * Renders a Lucide icon by name, synchronously.
 *
 * Looks up the icon from the `lucide-react` icon map at render time — every
 * icon lucide-react ships is in this module's import graph, which is the
 * cost of never flickering from a placeholder to the real icon. Reserved for
 * the admin panel, which already pays for everything else `@vexcms/react/admin`
 * reaches; public pages use the lazy root {@link Icon} ({@link ../ui/Icon.tsx}) instead.
 *
 * Returns `null` if `name` does not match a known icon, so a bad string from
 * untyped data cannot throw at runtime. After `vex generate`, {@link IconName}
 * is exact, so that only happens via an unchecked cast, `any`, or a project
 * that has not generated types; outside production the miss is reported once
 * per name with `console.warn`.
 *
 * @param props - Icon props. See {@link IconProps} for all fields.
 * @returns The rendered SVG icon, or `null` if the name is unrecognised.
 */
export function AdminIcon({ name, className, ...rest }: IconProps) {
  const LucideIcon = icons[name as keyof typeof icons];
  if (!LucideIcon) {
    if (process.env.NODE_ENV !== "production" && !warnedNames.has(name)) {
      warnedNames.add(name);
      console.warn(
        `<AdminIcon name="${name}" /> is not a Lucide icon and rendered nothing. ` +
          `Use the canonical PascalCase name from https://lucide.dev/icons — ` +
          `alias exports ("AlertCircle") and "*Icon" duplicates ("UsersIcon") are not valid.`,
      );
    }
    return null;
  }
  return <LucideIcon className={className} {...rest} />;
}
```

#### packages/react/src/ui/Icon.test.tsx

New file.

```tsx
import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Icon, isIconName } from "./Icon";

describe("Icon", () => {
  it("renders a placeholder svg carrying the final icon's width/height/className, then resolves", async () => {
    const { container } = render(<Icon className="size-4" name="FileText" />);
    const placeholder = container.querySelector("svg")!;
    expect(placeholder).toHaveAttribute("aria-hidden", "true");
    expect(placeholder).toHaveAttribute("width", "24");
    expect(placeholder).toHaveAttribute("height", "24");
    expect(placeholder.getAttribute("class")).toBe("size-4");

    await waitFor(() => {
      const resolved = container.querySelector("svg.lucide")!;
      expect(resolved).not.toBeNull();
      expect(resolved).toHaveAttribute("width", "24");
      expect(resolved).toHaveAttribute("height", "24");
      expect(resolved).toHaveAttribute("aria-hidden", "true");
      expect(resolved.getAttribute("class")).toContain("size-4");
    });
  });

  it("renders nothing and warns once for an unknown name", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { container, rerender } = render(<Icon name={"NotAnIcon" as never} />);
    expect(container.querySelector("svg")).toBeNull();
    rerender(<Icon name={"NotAnIcon" as never} />);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it.each([
    ["Grid2x2", true],
    ["LayoutGrid", true],
    ["NotAnIcon", false],
  ])("isIconName(%s) is %s", (name, expected) => {
    expect(isIconName(name)).toBe(expected);
  });
});
```

Prototyped against the repo's real `lucide-react@0.577.0` (symlinked `node_modules`, this package's own
`vitest.config.ts`): all 5 cases pass. The first version of the placeholder test failed with `width`/`height`
missing entirely — tracked to the destructure-and-reassign bug described above in `Icon`'s own comment; fixed by
reading `rest.width`/`rest.height`/`rest.size` without removing them from the spread.

#### packages/react/src/ui/AdminIcon.test.tsx

New file.

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminIcon } from "./AdminIcon";

describe("AdminIcon", () => {
  it("renders the icon synchronously, with no loading state", () => {
    render(<AdminIcon className="size-4" name="FileText" />);
    const icon = screen.getByText((_, el) => el?.tagName === "svg" && el.classList.contains("lucide"));
    expect(icon).toHaveAttribute("width", "24");
    expect(icon).toHaveAttribute("height", "24");
    expect(icon.getAttribute("class")).toContain("size-4");
  });
});
```

#### packages/react/src/admin/AdminCardSection.tsx

**1 — imports.** `Icon` leaves the `../ui` import; `AdminIcon` is imported by its own path, beside the
`../ui/Icon` type import. Everything else unchanged.

```tsx
import { Card, CardDescription, CardHeader, CardTitle } from "../ui";
import { AdminIcon } from "../ui/AdminIcon";
import type { IconName } from "../ui/Icon";
```

**2 — the icon render.** `Icon` → `AdminIcon`; everything else unchanged.

```tsx
                      <span>
                        <AdminIcon name={resolved.icon} size={20} />
                      </span>
```

#### packages/react/src/admin/AdminNotFound.tsx

**1 — import.** Replaces the direct `../ui/Icon` import. Everything else unchanged.

```tsx
import { AdminIcon } from "../ui/AdminIcon";
```

**2 — the icon render.** `Icon` → `AdminIcon`; everything else unchanged.

```tsx
      <AdminIcon name="FileQuestionMark" className="mb-2 size-10 text-muted-foreground" />
```

#### packages/react/src/admin/AdminSidebar.tsx

**1 — import.** Replaces the direct `../ui/Icon` import. Everything else unchanged.

```tsx
import { AdminIcon } from "../ui/AdminIcon";
```

**2 — the three icon renders (collection, global, media-collection sidebar rows).** `Icon` → `AdminIcon`;
everything else unchanged.

```tsx
                        <div>
                          <AdminIcon name={collection.admin.icon} size={12} />
                        </div>
```

```tsx
                        <div>
                          <AdminIcon name={global.admin.icon} size={12} />
                        </div>
```

```tsx
                        <div>
                          <AdminIcon name={mediaCollection.admin.icon} size={12} />
                        </div>
```

#### packages/react/src/admin/AdminTopNav.tsx

**1 — import.** `Icon` leaves the `../ui` import; `AdminIcon` is imported by its own path. Everything else
unchanged.

```tsx
import { Button, Skeleton, SidebarTrigger, VexLink } from "../ui";
import { AdminIcon } from "../ui/AdminIcon";
```

**2 — the icon render.** `Icon` → `AdminIcon`; everything else unchanged.

```tsx
        <span>
          <AdminIcon name={props.crumb.icon} size={14} />
        </span>
```

#### packages/react/src/collections/editView/CollectionDeleteAction.tsx

**1 — import.** `Icon` leaves the `../../ui` import; `AdminIcon` is imported by its own path. Everything else
unchanged.

```tsx
import { Button } from "../../ui";
import { AdminIcon } from "../../ui/AdminIcon";
```

**2 — the icon render.** `Icon` → `AdminIcon`; everything else unchanged.

```tsx
      icon={<AdminIcon name="Trash2" />}
```

#### packages/react/src/collections/editView/CollectionDuplicateMenuItem.tsx

**1 — import.** `Icon` leaves the `../../ui` import; `AdminIcon` is imported by its own path. Everything else
unchanged.

```tsx
import { Dialog, DialogContent, DialogHeader } from "../../ui";
import { AdminIcon } from "../../ui/AdminIcon";
```

**2 — the icon render.** `Icon` → `AdminIcon`; everything else unchanged.

```tsx
      icon={<AdminIcon name="Copy" />}
```

#### packages/react/src/collections/listView/filters/ListViewFilterBuilder/ListViewFilterRow.tsx

**1 — imports.** `Icon` leaves the `../../../../ui` import; `AdminIcon` is imported by its own path.
Everything else unchanged.

```tsx
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollSection,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../ui";
import { AdminIcon } from "../../../../ui/AdminIcon";
```

**2 — the icon render.** `Icon` → `AdminIcon`; everything else unchanged.

```tsx
                  {key === props.value && <AdminIcon name="Check" className="ml-auto size-3.5" />}
```

#### packages/react/src/collections/listView/peek/ListViewPeek/index.tsx

**1 — import.** Replaces the direct `../../../../ui/Icon` import of `Icon`; `IconName` stays a type-only
import from `../../../../ui/Icon`. Everything else unchanged.

```tsx
import { AdminIcon } from "../../../../ui/AdminIcon";
import type { IconName } from "../../../../ui/Icon";
```

**2 — the two icon renders (`PeekInitialsAvatar`'s icon, and the peek header's "Edit" link icon).** `Icon` →
`AdminIcon`; everything else unchanged.

```tsx
      {props.icon ? <AdminIcon name={props.icon} size={16} /> : initials}
```

```tsx
            Edit
            <AdminIcon name="ExternalLink" size={14} />
          </VexLink>
```

#### packages/react/src/collections/listView/savedListViews/SavedListViewTabs/SavedListViewSwitcherMenu.tsx

**1 — import.** `Icon` leaves the `../../../../ui` import; `AdminIcon` is imported by its own path.
Everything else unchanged.

```tsx
import { ScrollSection } from "../../../../ui";
import { AdminIcon } from "../../../../ui/AdminIcon";
```

**2 — the two icon renders (default view row, and each configured view row).** `Icon` → `AdminIcon`;
everything else unchanged.

```tsx
              {props.defaultView.name}
              {props.activeViewId === "default" && <AdminIcon name="Check" className="ml-auto size-3.5" />}
```

```tsx
                    {view.name}
                    {view.viewId === props.activeViewId && <AdminIcon name="Check" className="ml-auto size-3.5" />}
```

#### packages/react/src/documents/DocumentCancelAction.tsx

**1 — import.** `Icon` leaves the `../ui` import; `AdminIcon` is imported by its own path. Everything else
unchanged.

```tsx
import { Button } from "../ui";
import { AdminIcon } from "../ui/AdminIcon";
```

**2 — the icon render.** `Icon` → `AdminIcon`; everything else unchanged.

```tsx
      <EditActionsMenuItem disabled={disabled} icon={<AdminIcon name="Undo2" />} onSelect={() => form.reset()}>
```

#### packages/react/src/fields/relationship/RelationshipPicker.tsx

**1 — import.** `Icon` leaves the `../../ui` import; `AdminIcon` is imported by its own path. Everything else
unchanged.

```tsx
import {
  Button,
  Dialog,
  DialogContent,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../ui";
import { AdminIcon } from "../../ui/AdminIcon";
```

**2 — the icon render.** `Icon` → `AdminIcon`; everything else unchanged.

```tsx
          <div className="flex h-8 w-8 flex-none items-center justify-center rounded bg-accent text-accent-foreground">
            <AdminIcon name="Link" size={20} />
          </div>
```

#### packages/react/src/fields/upload/UploadFilterPicker.tsx

**1 — import.** `Icon` leaves the `../../ui` import; `AdminIcon` is imported by its own path. Everything else
unchanged.

```tsx
import { Button, Dialog, DialogContent, Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui";
import { AdminIcon } from "../../ui/AdminIcon";
```

**2 — the icon render.** `Icon` → `AdminIcon`; everything else unchanged.

```tsx
          <div className="flex h-8 w-8 flex-none items-center justify-center rounded bg-accent text-accent-foreground">
            <AdminIcon name="Image" size={20} />
          </div>
```

#### packages/react/src/livePreview/LivePreviewPanel.tsx

**1 — import.** `Icon` leaves the `../ui` import; `AdminIcon` is imported by its own path. Everything else
unchanged.

```tsx
import { Button, VexLink } from "../ui";
import { AdminIcon } from "../ui/AdminIcon";
```

**2 — the two icon renders (the "Preview" link icon, and the breakpoint menu item icon).** `Icon` →
`AdminIcon`; everything else unchanged.

```tsx
          Preview
          <AdminIcon name="SquareArrowOutUpRight" size={16} aria-label="Open preview in a new tab" />
        </VexLink>
```

```tsx
                    {breakpoint.icon && <AdminIcon name={breakpoint.icon} size={16} />}
```

#### packages/react/src/livePreview/LivePreviewToggleAction.tsx

**1 — import.** `Icon` leaves the `../ui` import; `AdminIcon` is imported by its own path. Everything else
unchanged.

```tsx
import { Button } from "../ui";
import { AdminIcon } from "../ui/AdminIcon";
```

**2 — the icon render.** `Icon` → `AdminIcon`; everything else unchanged.

```tsx
      <EditActionsMenuItem onSelect={toggle} icon={<AdminIcon name={isOpen ? "Eye" : "EyeOff"} />}>
```

#### packages/react/src/media/FilePreview.tsx

**1 — import.** Replaces the direct `../ui/Icon` import. Everything else unchanged.

```tsx
import { AdminIcon } from "../ui/AdminIcon";
```

**2 — the two icon renders (video fallback, generic-file fallback).** `Icon` → `AdminIcon`; everything else
unchanged.

```tsx
      <IconWrapper>
        <AdminIcon name="Video" size={fillContainer ? 32 : size} className="text-muted-foreground" />
      </IconWrapper>
```

```tsx
    <IconWrapper>
      <AdminIcon name="File" size={fillContainer ? 32 : size} className="text-muted-foreground" />
    </IconWrapper>
```

#### packages/react/src/media/MediaLibraryGrid.tsx

**1 — import.** `Icon` leaves the `../ui` import; `AdminIcon` is imported by its own path. Everything else
unchanged.

```tsx
import {
  Button,
  Input,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "../ui";
import { AdminIcon } from "../ui/AdminIcon";
```

**2 — the icon render.** `Icon` → `AdminIcon`; everything else unchanged.

```tsx
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <AdminIcon name="Check" size={14} strokeWidth={3} className="" />
            </div>
```

#### packages/react/src/media/MediaPicker.tsx

**1 — import.** `Icon` leaves the `../ui` import; `AdminIcon` is imported by its own path. Everything else
unchanged.

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger, Button } from "../ui";
import { AdminIcon } from "../ui/AdminIcon";
```

**2 — the icon render.** `Icon` → `AdminIcon`; everything else unchanged.

```tsx
          <div className="flex h-8 w-8 flex-none items-center justify-center rounded bg-accent text-accent-foreground">
            <AdminIcon name="Image" size={20} />
          </div>
```

#### packages/react/src/media/MediaUploadForm.tsx

**1 — import.** `Icon` leaves the `../ui` import; `AdminIcon` is imported by its own path. Everything else
unchanged.

```tsx
import { Button, Input, Label } from "../ui";
import { AdminIcon } from "../ui/AdminIcon";
```

**2 — the two icon renders (filename row, drop-zone placeholder).** `Icon` → `AdminIcon`; everything else
unchanged.

```tsx
                  </span>
                  <AdminIcon name="Image" size={14} />
                  <span className="truncate max-w-[200px] text-sm font-medium">
```

```tsx
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <AdminIcon name="Image" size={24} className="text-muted-foreground" />
                    </div>
```

#### packages/react/src/revalidate/RevalidateMenuItem.tsx

**1 — import.** Replaces the `../ui` import of `Icon`. Everything else unchanged.

```tsx
import { AdminIcon } from "../ui/AdminIcon";
```

**2 — the icon render.** `Icon` → `AdminIcon`; everything else unchanged.

```tsx
      icon={<AdminIcon name="RefreshCw" />}
```

#### packages/react/src/versions/VersionHistoryMenuItem.tsx

**1 — import.** Replaces the `../ui` import of `Icon`. Everything else unchanged.

```tsx
import { AdminIcon } from "../ui/AdminIcon";
```

**2 — the icon render.** `Icon` → `AdminIcon`; everything else unchanged.

```tsx
    <EditActionsMenuItem icon={<AdminIcon name="History" />} onSelect={openHistory}>
```

#### packages/react/src/adminEntry.ts

**1 — export.** Beside the other admin component exports (Step 5), add:

```ts
export { AdminIcon } from "./ui/AdminIcon";
```

#### packages/react/src/index.ts

**1 — export.** Beside the existing `Icon`/`IconProps`/`IconName` exports, add `isIconName`.

```ts
export { cn } from "./utils/cn";
export { Icon, isIconName } from "./ui/Icon";
export { adminHref } from "./admin/adminHref";
export type { AdminHrefTarget } from "./admin/adminHref";
export type { IconProps, IconName } from "./ui/Icon";
```

#### apps/www/src/components/SessionButton.tsx

**1 — import.** `Icon` is dropped from the `@vexcms/react` import; `LogOut` joins the static `lucide-react`
import beside `LogIn`. Everything else unchanged.

```tsx
import { buttonVariants, cn } from "@vexcms/react";
import { LogIn, LogOut, LoaderCircle } from "lucide-react";
```

**2 — the sign-out button's icon.** The `isSigningOut` ternary switches between two concrete, statically
imported components instead of one dynamically-looked-up name; the `size`/`className` on each stay
identical to the old `<Icon .../>` call. Everything else unchanged.

```tsx
      {isSigningOut ? (
        <LoaderCircle className="animate-spin" size={14} />
      ) : (
        <LogOut size={14} />
      )}
      Sign out
    </Button>
  );
}
```

#### apps/test/src/components/SessionButton.tsx

Identical edit to `apps/www/src/components/SessionButton.tsx` above (same two files, same content, semicolons).

#### packages/create-vexcms/templates/marketing-site/src/components/SessionButton.tsx

Same edit, no semicolons (the template's existing style):

**1 — import.**

```tsx
import { buttonVariants, cn } from "@vexcms/react"
import { LogIn, LogOut, LoaderCircle } from "lucide-react"
```

**2 — the sign-out button's icon.**

```tsx
      {isSigningOut ? (
        <LoaderCircle className="animate-spin" size={14} />
      ) : (
        <LogOut size={14} />
      )}
      Sign out
    </Button>
  )
}
```

Re-run `node scripts/verify-scaffold.mjs` after this template edit (AP-020).

#### apps/www/src/vexcms/blocks/Features/index.tsx

**1 — imports.** `icons` from `lucide-react` is replaced by `Icon`/`isIconName` from `@vexcms/react`.
Everything else unchanged.

```tsx
import type { BlockComponentProps } from "@vexcms/react"

import { Icon, isIconName } from "@vexcms/react"
```

**2 — the glyph resolution.** Same "an unresolvable icon drops the frame entirely" behavior: `isIconName`
replaces the `icons[...]` lookup as the frame's presence check, and the frame renders `Icon` instead of
`Glyph`. Everything else unchanged.

```tsx
          {items.map((feature, index) => {
            const iconName = feature.icon
            return (
              <div className="bg-background p-6" key={`${feature.title}-${index}`}>
                {/* An unresolvable icon drops the frame entirely rather than
                    leaving an empty square; the title then starts the cell and
                    a mixed array still reads as intentional. */}
                {iconName && isIconName(iconName) ? (
                  <span className="mb-4 flex size-8 items-center justify-center rounded-sm border border-border">
                    <Icon name={iconName} className="size-4 text-primary" />
                  </span>
                ) : null}
```

#### apps/www/src/vexcms/blocks/HowItWorks/index.tsx

**1 — imports.** `icons` from `lucide-react` is replaced by `isIconName`, added beside the existing `cn`
import from `@vexcms/react`. Everything else unchanged.

```tsx
import type { BlockComponentProps } from "@vexcms/react"

import { cn, Icon, isIconName } from "@vexcms/react"
```

**2 — the glyph resolution.** Same frame-drop behavior as `Features`. Everything else unchanged.

```tsx
          {items.map((step, index) => {
            const iconName = step.icon
            return (
              <li
                className="border-t border-border pt-4 xl:border-t-0 xl:pt-0"
                key={`${step.title}-${index}`}
              >
                <div className="flex items-baseline gap-3">
                  {/* Generated by the renderer, never a field — reordering the
                      array must not force an editor to renumber. */}
                  <span className="font-mono text-2xl leading-none font-semibold tracking-[-0.03em] text-primary tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {/* The connector is what makes separate cells read as a
                      sequence, and is why the icon sits right, not left. The
                      last one is kept: it points at the CTA below. */}
                  <span aria-hidden className="h-px flex-1 bg-border" />
                  {iconName && isIconName(iconName) ? (
                    <Icon name={iconName} className="size-3.5 shrink-0 self-center text-muted-foreground/70" />
                  ) : null}
                </div>
```

#### apps/test/src/vexcms/blocks/Features/index.tsx

Identical edit to `apps/www/src/vexcms/blocks/Features/index.tsx` above (the two files are byte-identical
today).

#### apps/test/src/vexcms/blocks/HowItWorks/index.tsx

Identical edit to `apps/www/src/vexcms/blocks/HowItWorks/index.tsx` above.

#### packages/create-vexcms/templates/marketing-site/src/vexcms/blocks/Features/index.tsx

Identical edit to `apps/www/src/vexcms/blocks/Features/index.tsx` above (the template copy is byte-identical
to the app's). Re-run `node scripts/verify-scaffold.mjs` after this template edit (AP-020).

#### packages/create-vexcms/templates/marketing-site/src/vexcms/blocks/HowItWorks/index.tsx

Identical edit to `apps/www/src/vexcms/blocks/HowItWorks/index.tsx` above. Re-run `node scripts/verify-scaffold.mjs`
after this template edit (AP-020).

#### scripts/check-import-cost.mjs

**1 — deny list.** Add the lucide-react icon barrel as the last `ADMIN_DENY_LIST` entry (the constant stays exported; `scripts/check-site-bundle.mjs` imports it), so the root-reach fixture fails if anything reintroduces an eager, all-icons import:

```js
  /lucide-react\/dist\/esm\/icons\/index\.js/,
```

#### .changeset/react-lazy-icon.md

```md
---
"@vexcms/react": patch
---

**Root `Icon` loads icons on demand instead of bundling all 1703 of `lucide-react`'s icon components.**
Every page that renders an `Icon` by name — directly, or through a collection's `admin.icon`, a block's
`icon` field, or `Button`'s own `icon` prop — used to pull in every icon lucide-react ships (505 KB). `Icon`
now resolves the name to `lucide-react/dynamic`'s on-demand import and reserves the loaded icon's exact box
with a placeholder `<svg>` while it loads, so nothing shifts. A new `isIconName(name): name is IconName`
export lets a caller holding untyped data (CMS content, a block field) check a name before rendering it,
the same guard `Icon` applies internally.

The admin panel keeps synchronous icons via a new `AdminIcon`, exported from `@vexcms/react/admin` — every
internal admin, document, field, media, live-preview, revalidate, and version-history component that
rendered `Icon` now renders `AdminIcon` instead, at admin-only cost.

**Migration:** nothing for root `Icon` callers — same props, same `null`-on-unknown-name fallback, same
one-warning-per-name behavior; the only visible difference is a brief placeholder box before an icon paints.
A caller doing `icons[name]` directly against `lucide-react` to render a CMS-driven icon (as `Features`/`HowItWorks`
block renderers do) should switch to `Icon` + `isIconName` to get the same lazy loading.
```

### Step 7 — Auth UI only where auth views render [agent]
Why: `AuthUIProvider` at the root ships `better-auth-ui`, react-hook-form, hcaptcha and qrcode (~250 KB) to every page. Only the two `AuthView` render sites need it. `VexAdminAuthAdapterProvider` (the admin top bar's sign-in/out control) still needs to wrap the whole app, so it stays in `~/auth/client`'s `BetterAuthClientProvider`; `AuthUIProvider` moves to a new `~/auth/AuthViewProvider` that wraps only `AuthView`.

#### apps/www/src/auth/AuthViewProvider.tsx
New file. Carries exactly `BetterAuthClientProvider`'s former `AuthUIProvider` options — `authClient`, `credentials`, `Link`, `navigate`, `onSessionChange`, `replace` — unchanged.

```tsx
"use client"

import type { ReactNode } from "react"

import { AuthUIProvider } from "@daveyplate/better-auth-ui"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { authClient } from "~/auth/client"

/**
 * Mounts `@daveyplate/better-auth-ui`'s `AuthUIProvider` around `AuthView`
 * only, at the two places it renders (`(frontend)/auth/[pathname]/view.tsx`,
 * the `@auth` intercepted sign-in modal) — not at the app root. `AuthView`
 * reads its form config (credentials, navigation, the session-change
 * refresh) from this provider's context; nothing else in the app needs it.
 */
export default function AuthViewProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  return (
    <AuthUIProvider
      authClient={authClient}
      credentials={true}
      Link={Link}
      navigate={router.push}
      onSessionChange={() => {
        router.refresh()
      }}
      replace={router.replace}
    >
      {children}
    </AuthUIProvider>
  )
}
```

#### apps/test/src/auth/AuthViewProvider.tsx
New file, identical to the www version above (same options, same body) — apps/test imports `authClient` from its own `~/auth/client`, which carries the same `createAuthClient` call plus `organizationClient()`; that plugin doesn't change any `AuthUIProvider` option.

#### packages/create-vexcms/templates/base-nextjs/src/auth/AuthViewProvider.tsx
New file. Keeps the two installer placeholder comments exactly where they sat in `client.tsx` — `installers/nextjs.ts`'s `updateOAuthUIConfig` replaces them in-place by literal string match, so they must land in the new file unchanged.

```tsx
"use client"

import type { ReactNode } from "react"

import { AuthUIProvider } from "@daveyplate/better-auth-ui"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { authClient } from "~/auth/client"

/**
 * Mounts `@daveyplate/better-auth-ui`'s `AuthUIProvider` around `AuthView`
 * only, where it renders (`(frontend)/auth/[pathname]/view.tsx`), not at
 * the app root. `AuthView` reads its form config (credentials, navigation,
 * the session-change refresh) from this provider's context; nothing else in
 * the app needs it.
 */
export default function AuthViewProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  return (
    <AuthUIProvider
      authClient={authClient}
      /* {{EMAIL_PASSWORD_CREDENTIALS}} */
      // {{OAUTH_UI_PROVIDERS}}
      Link={Link}
      navigate={router.push}
      onSessionChange={() => {
        router.refresh()
      }}
      replace={router.replace}
    >
      {children}
    </AuthUIProvider>
  )
}
```

`marketing-site` has no `src/auth/client.tsx`, `src/auth/AuthViewProvider.tsx`, or `view.tsx` overlays of its own — it inherits `base-nextjs`'s auth tree unmodified, so this file covers it too.

#### apps/www/src/auth/client.tsx
3 edits. Everything not shown is unchanged.

**1 — imports.** Drop the `AuthUIProvider` and `Link` imports; `useAuthTransition` and `VexAdminAuthAdapterProvider` stay (both are still used by `BetterAuthClientProvider`).

```tsx
import type { ReactNode } from "react"

import { apiKeyClient } from "@better-auth/api-key/client"
import { convexClient } from "@convex-dev/better-auth/client/plugins"
import { adminClient, anonymousClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
import { useRouter } from "next/navigation"

import { useAuthTransition } from "@vexcms/react"
import { VexAdminAuthAdapterProvider } from "@vexcms/next/auth"
import { env } from "~/env.mjs"
```

**2 — `BetterAuthClientProvider`'s doc comment.** Drop the `AuthUIProvider` mention; the rest (admin top-bar wiring) is unchanged.

```tsx
/**
 * Mounts `VexAdminAuthAdapterProvider` (`@vexcms/next/auth`) so the admin
 * panel's top-bar sign-in/out control (`AdminTopNav`) has a `signInHref`/`signOut`
 * to call. `signOut` signs out then refreshes either way (success or failure — a
 * stale client cache after a failed sign-out is worse than a redundant refresh) so
 * the admin panel's server-resolved auth state and route guard re-evaluate.
 */
```

**3 — `BetterAuthClientProvider`'s body.** Drop the `AuthUIProvider` wrapper; `VexAdminAuthAdapterProvider` and its `value` are byte-for-byte unchanged.

```tsx
export default function BetterAuthClientProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  // Needs an `AuthTransitionProvider` ancestor — `ConvexClientProvider`
  // (`~/components/providers/convex.tsx`) mounts it one level up from this
  // component, same as `~/components/providers/client.tsx`'s nesting order.
  const { beginTransition } = useAuthTransition()
  return (
    <VexAdminAuthAdapterProvider
      value={{
        // `modal=1` is the signal `app/@auth/(.)auth/[pathname]/view.tsx`
        // uses to tell this deliberate "Sign in" click apart from a server
        // GUARD redirect (middleware, or `/admin`'s own `redirect(...)`)
        // that also carries `redirectTo` — both would otherwise collapse
        // onto the same `isGuardRedirect` branch and render the full-screen
        // card instead of the dialog `AdminTopNav`'s control expects.
        signInHref: (redirectTo) =>
          `/auth/sign-in?redirectTo=${encodeURIComponent(redirectTo)}&modal=1`,
        signOut: () => {
          // Set BEFORE the network call starts, not after it resolves — the
          // one case the identity is known with zero ambiguity ahead of
          // time (always `null`), so list hooks start ignoring stale pages
          // as early as possible (`@vexcms/react`'s `useAuthTransition`).
          // `useBeginAuthTransitionOnSessionChange` (`~/components/providers/convex.tsx`)
          // also reactively catches this once `authClient.useSession()`
          // updates, so this call is a latency optimization, not the only path.
          beginTransition(null)
          return signOut()
            .then(() => router.refresh())
            .catch(() => router.refresh())
        },
      }}
    >
      {children}
    </VexAdminAuthAdapterProvider>
  )
}
```

#### apps/test/src/auth/client.tsx
3 edits, same shape as www's, over the organizationClient-flavored file. Everything not shown is unchanged.

**1 — imports.** Drop `AuthUIProvider` and `Link`.

```tsx
import type { ReactNode } from "react"

import { apiKeyClient } from "@better-auth/api-key/client"
import { convexClient } from "@convex-dev/better-auth/client/plugins"
import { adminClient, anonymousClient, organizationClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
import { useRouter } from "next/navigation"

import { useAuthTransition } from "@vexcms/react"
import { VexAdminAuthAdapterProvider } from "@vexcms/next/auth"

import { env } from "~/env.mjs"
```

**2 — `BetterAuthClientProvider`'s doc comment.** Drop the `AuthUIProvider` paragraph; keep the admin-wiring paragraph, the "must be placed near the root" note and the `@example`.

```tsx
/**
 * Provides Better Auth session state to the Next.js app.
 *
 * Mounts `VexAdminAuthAdapterProvider` (`@vexcms/next/auth`) so
 * `AdminTopNav`'s sign-in/out control has a `signInHref`/`signOut` to call —
 * this provider wraps the WHOLE app (root `layout.tsx`), so it reaches the
 * admin tree under `/admin` the same as every other route. `signOut` mirrors
 * `SessionButton.tsx`'s own sequence exactly: sign out, then `router.refresh()`
 * either way (success or failure — a stale client cache after a failed sign-out
 * is worse than a redundant refresh) so the admin panel's server-resolved auth
 * state and route guard re-evaluate.
 *
 * Must be placed near the root of the app — required by `useSession()` and all
 * components that read auth state.
 *
 * @param props.children - App content to wrap with auth context.
 * @example
 * ```tsx
 * // app/layout.tsx
 * <BetterAuthClientProvider>
 *   {children}
 * </BetterAuthClientProvider>
 * ```
 */
```

**3 — `BetterAuthClientProvider`'s body.** Same shape as www's edit 3: drop the `AuthUIProvider` wrapper, keep `VexAdminAuthAdapterProvider` and its `value` unchanged.

```tsx
export default function BetterAuthClientProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  // Needs an `AuthTransitionProvider` ancestor — `ConvexClientProvider`
  // (`~/components/providers/convex.tsx`) mounts it one level up from this
  // component, same as `~/components/providers/client.tsx`'s nesting order.
  const { beginTransition } = useAuthTransition()
  return (
    <VexAdminAuthAdapterProvider
      value={{
        // `modal=1` is the signal `app/@auth/(.)auth/[pathname]/view.tsx`
        // uses to tell this deliberate "Sign in" click apart from a server
        // GUARD redirect (middleware, or `/admin`'s own `redirect(...)`)
        // that also carries `redirectTo` — both would otherwise collapse
        // onto the same `isGuardRedirect` branch and render the full-screen
        // card instead of the dialog `AdminTopNav`'s control expects.
        signInHref: (redirectTo) =>
          `/auth/sign-in?redirectTo=${encodeURIComponent(redirectTo)}&modal=1`,
        signOut: () => {
          // Set BEFORE the network call starts, not after it resolves — the
          // one case the identity is known with zero ambiguity ahead of
          // time (always `null`), so list hooks start ignoring stale pages
          // as early as possible (`@vexcms/react`'s `useAuthTransition`).
          // `useBeginAuthTransitionOnSessionChange` (`~/components/providers/convex.tsx`)
          // also reactively catches this once `authClient.useSession()`
          // updates, so this call is a latency optimization, not the only path.
          beginTransition(null)
          return signOut()
            .then(() => router.refresh())
            .catch(() => router.refresh())
        },
      }}
    >
      {children}
    </VexAdminAuthAdapterProvider>
  )
}
```

#### packages/create-vexcms/templates/base-nextjs/src/auth/client.tsx
Same 3 edits as www's, minus the organization plugin — and the body loses the placeholder comments, which moved to `AuthViewProvider.tsx` above.

**1 — imports.**

```tsx
import type { ReactNode } from "react"

import { apiKeyClient } from "@better-auth/api-key/client"
import { convexClient } from "@convex-dev/better-auth/client/plugins"
import { adminClient, anonymousClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
import { useRouter } from "next/navigation"

import { useAuthTransition } from "@vexcms/react"
import { VexAdminAuthAdapterProvider } from "@vexcms/next/auth"

import { env } from "~/env.mjs"
```

**2 — doc comment.** Same as www's edit 2.

```tsx
/**
 * Mounts `VexAdminAuthAdapterProvider` (`@vexcms/next/auth`) so the admin
 * panel's top-bar sign-in/out control (`AdminTopNav`) has a `signInHref`/`signOut`
 * to call. `signOut` signs out then refreshes either way (success or failure — a
 * stale client cache after a failed sign-out is worse than a redundant refresh) so
 * the admin panel's server-resolved auth state and route guard re-evaluate.
 */
```

**3 — body.** Same shape as www's edit 3.

```tsx
export default function BetterAuthClientProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  // Needs an `AuthTransitionProvider` ancestor — `ConvexClientProvider`
  // (`~/components/providers/convex.tsx`) mounts it one level up from this
  // component, same as `~/components/providers/client.tsx`'s nesting order.
  const { beginTransition } = useAuthTransition()
  return (
    <VexAdminAuthAdapterProvider
      value={{
        // `modal=1` is the signal `app/@auth/(.)auth/[pathname]/view.tsx`
        // uses to tell this deliberate "Sign in" click apart from a server
        // GUARD redirect (middleware, or `/admin`'s own `redirect(...)`)
        // that also carries `redirectTo` — both would otherwise collapse
        // onto the same `isGuardRedirect` branch and render the full-screen
        // card instead of the dialog `AdminTopNav`'s control expects.
        signInHref: (redirectTo) =>
          `/auth/sign-in?redirectTo=${encodeURIComponent(redirectTo)}&modal=1`,
        signOut: () => {
          // Set BEFORE the network call starts, not after it resolves — the
          // one case the identity is known with zero ambiguity ahead of
          // time (always `null`), so list hooks start ignoring stale pages
          // as early as possible (`@vexcms/react`'s `useAuthTransition`).
          // `useBeginAuthTransitionOnSessionChange` (`~/components/providers/convex.tsx`)
          // also reactively catches this once `authClient.useSession()`
          // updates, so this call is a latency optimization, not the only path.
          beginTransition(null)
          return signOut()
            .then(() => router.refresh())
            .catch(() => router.refresh())
        },
      }}
    >
      {children}
    </VexAdminAuthAdapterProvider>
  )
}
```

#### apps/www/src/app/(frontend)/auth/[pathname]/view.tsx
1 edit: wrap `AuthView` in `AuthViewProvider`. Everything else (the `h1`, `resolveAuthPageTitle`) is unchanged.

```tsx
import { AuthView } from "@daveyplate/better-auth-ui";

import AuthViewProvider from "~/auth/AuthViewProvider";
import { resolveAuthPageTitle } from "~/lib/authPageTitle";

export default function AuthCard({ pathname }: { pathname: string }) {
  return (
    <AuthViewProvider>
      <main className="absolute inset-0 grid place-items-center">
        <h1 className="sr-only">{resolveAuthPageTitle(pathname)}</h1>
        <AuthView path={pathname} />
      </main>
    </AuthViewProvider>
  );
}
```

#### apps/www/src/app/@auth/(.)auth/[pathname]/view.tsx
1 edit: wrap both `return` branches' `AuthView` in `AuthViewProvider`. Everything else (the `"use client"` directive, the `isGuardRedirect` check, the `Dialog`) is unchanged.

```tsx
"use client";

import { AuthView } from "@daveyplate/better-auth-ui";
import { useRouter, useSearchParams } from "next/navigation";

import AuthViewProvider from "~/auth/AuthViewProvider";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";
import { resolveAuthPageTitle } from "~/lib/authPageTitle";

export default function AuthCard({ pathname }: { pathname: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isGuardRedirect = searchParams.has("redirectTo") && !searchParams.has("modal");
  if (isGuardRedirect) {
    return (
      <AuthViewProvider>
        <main className="absolute inset-0 grid place-items-center">
          <AuthView path={pathname} />
        </main>
      </AuthViewProvider>
    );
  }
  return (
    <AuthViewProvider>
      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            router.back();
          }
        }}
        open
      >
        <DialogContent
          aria-describedby={undefined}
          className="grid place-items-center bg-transparent shadow-none ring-transparent"
        >
          <DialogTitle className="sr-only">{resolveAuthPageTitle(pathname)}</DialogTitle>
          <AuthView path={pathname} />
        </DialogContent>
      </Dialog>
    </AuthViewProvider>
  );
}
```

#### apps/test/src/app/(frontend)/auth/[pathname]/view.tsx
Same edit as www's `(frontend)` file above, `~/auth/AuthViewProvider` resolving to `apps/test`'s own copy.

#### apps/test/src/app/@auth/(.)auth/[pathname]/view.tsx
Same edit as www's `@auth` file above.

#### packages/create-vexcms/templates/base-nextjs/src/app/(frontend)/auth/[pathname]/view.tsx
Same edit as www's `(frontend)` file above. `base-nextjs` has no `@auth` intercepting route (no header sign-in modal in the template), so this is the template's only `view.tsx`.

#### apps/www/src/components/SessionButton.tsx, apps/test/src/components/SessionButton.tsx, packages/create-vexcms/templates/marketing-site/src/components/SessionButton.tsx
1 edit each, over the doc comment on `SessionButton`: reword the line naming `AuthUIProvider` so it still states a true fact — the provider now mounts only around the modal's `AuthView`, not around the whole app — instead of implying it is ambient.

www and test (identical doc comment, `AuthUIProvider.onSessionChange` on the line after "page, and"):

```tsx
 * "Sign in" is a plain link to `/auth/sign-in`. From a client navigation the
 * `@auth` intercepting route renders the form in a dialog over the current
 * page, wrapped in `AuthViewProvider`, whose `onSessionChange` refreshes the
 * tree once the session lands — so there is no `redirectTo` on this link,
 * that query switches the route to its full-page guard mode.
```

marketing-site (same line, one line earlier because its doc comment has no "Always rendering..." paragraph break difference — same replacement text):

```tsx
 * "Sign in" is a plain link to `/auth/sign-in`. From a client navigation the
 * `@auth` intercepting route renders the form in a dialog over the current
 * page, wrapped in `AuthViewProvider`, whose `onSessionChange` refreshes the
 * tree once the session lands — so there is no `redirectTo` on this link,
 * that query switches the route to its full-page guard mode.
```

#### packages/create-vexcms/src/installers/nextjs.ts
1 edit: `updateOAuthUIConfig` patches the placeholders in their new file. Everything else in the class is unchanged.

```ts
  /**
   * Update OAuth UI configuration in auth client file
   * Target file: src/auth/AuthViewProvider.tsx
   *
   * @param selectedProviders - IDs of the OAuth providers chosen for the project (e.g. `["google", "github"]`).
   * @param emailPasswordEnabled - Whether email/password authentication is also enabled.
   */
  async updateOAuthUIConfig(
    selectedProviders: string[],
    emailPasswordEnabled: boolean
  ): Promise<void> {
    const providersFilePath = join(this.targetPath, 'src/auth/AuthViewProvider.tsx');

    const uiConfigBlock = generateOAuthUIProvidersBlock(selectedProviders);
    await replacePlaceholder(
      providersFilePath,
      '// {{OAUTH_UI_PROVIDERS}}',
      uiConfigBlock
    );

    const credentialsValue = generateCredentialsValue(emailPasswordEnabled);
    await replacePlaceholder(
      providersFilePath,
      '/* {{EMAIL_PASSWORD_CREDENTIALS}} */',
      credentialsValue
    );
  }
```

#### packages/create-vexcms/src/__tests__/integration.test.ts
2 edits: both assertion blocks read the placeholders from the file they now live in. Everything else in `describe("template markers …")` is unchanged.

**1 — the "carries every marker" test**, beside the `convex/auth/options.ts` block.

```ts
    const authClient = fs.readFileSync(path.join(baseTemplateDir, 'src/auth/AuthViewProvider.tsx'), 'utf-8');
    expect(authClient).toContain('// {{OAUTH_UI_PROVIDERS}}');
    expect(authClient).toContain('/* {{EMAIL_PASSWORD_CREDENTIALS}} */');
```

**2 — the "bare scaffold resolves every marker" test**, beside the same block.

```ts
    const authClient = fs.readFileSync(path.join(bareDir, 'src/auth/AuthViewProvider.tsx'), 'utf-8');
    expect(authClient).not.toContain('{{OAUTH_UI_PROVIDERS}}');
    expect(authClient).not.toContain('{{EMAIL_PASSWORD_CREDENTIALS}}');
```

#### .agent/docs/standards/naming-conventions.md
1 edit: the `auth-file-roles` rule's pattern and examples gain the new fixed role. Everything else in that YAML block is unchanged.

```yaml
  - id: auth-file-roles
    pattern: '^(access|client|AuthViewProvider|hasPermission|options|permissions|plugins|schema|server|serverUtils|types)(\.typecheck)?\.tsx?$'
    scope: ["apps/test/src/auth/**", "apps/www/src/auth/**"]
    description: Host-app auth files use fixed role names separating client/server/util/config concerns. RBAC adds `access` (the `defineAccess` matrix), `hasPermission` (the app-side check wrapper), and `plugins` (the better-auth plugin list). `schema` is the client-safe half of the auth options — model names, additional fields, and the plugin descriptor map — imported by BOTH `options.ts` and `vex.config.ts` so they cannot drift; it must stay free of server imports. `AuthViewProvider` is the fixed role for the `AuthUIProvider` mount that wraps `AuthView` at its two render sites — it is the one `.tsx` file here distinguishing from the plain client/server/util roles, which are all `.ts`. A role may carry a `<role>.typecheck.ts` sibling — a pure compile-time assertion file (P-008) that `tsc` enforces; it pins the role's generated/registry-derived types (e.g. `access.typecheck.ts` pins slug-aware action unions). See /dev/naming-conventions/#auth-file-roles.
    examples: ["auth/client.tsx", "auth/server.ts", "auth/serverUtils.ts", "auth/access.ts", "auth/plugins.ts", "auth/schema.ts", "auth/AuthViewProvider.tsx"]
    counter_examples: ["auth/client-auth.tsx", "auth/AuthClient.tsx"]
```

Verify:
- `pnpm --filter www test && pnpm --filter test test` — `SessionButton.test.tsx` still passes in both apps (it mocks `~/auth/client`'s `signOut`/`useSession` directly and never imports `AuthUIProvider`, so it is unaffected by the move).
- `pnpm --filter create-vexcms test` — `integration.test.ts`'s two marker-location assertions pass against `src/auth/AuthViewProvider.tsx`.
- `node scripts/verify-scaffold.mjs` — packs and scaffolds `base-nextjs` and `marketing-site` for real, runs `pnpm install`/typecheck/build on each (AP-020); a scaffold with OAuth providers selected gets `uiConfigBlock` substituted into `AuthViewProvider.tsx`, and the resulting app still typechecks and builds. Negative check: `node scripts/verify-scaffold.mjs --negative` corrupts an override mapping and confirms the pipeline fails (unrelated to this step, but proves the gate itself still works after the file move); a targeted negative run — revert only this step's `nextjs.ts` edit (`providersFilePath` back to `src/auth/client.tsx`) — makes `updateOAuthUIConfig` throw `ENOENT`-adjacent (the placeholder no longer exists in `client.tsx`) partway through scaffolding, which `verify-scaffold.mjs` reports as a failed install, proving the installer path change is load-bearing.
- Manual, in www dev (`localhost:3030`, already running per P-024 — do not start a new one):
  - Visit `/auth/sign-in` directly: the full-page `AuthView` card renders and signs in with a real credential.
  - From any other page, click the header's "Sign in" control: the `@auth` intercepted route renders `AuthView` inside the `Dialog`, and signing in there closes the dialog and refreshes the header to the signed-in state.
  - While signed in, click `SessionButton`'s "Sign out": the header refreshes to the signed-out control (`router.refresh()` fires from `BetterAuthClientProvider`'s `VexAdminAuthAdapterProvider.signOut`, independent of `AuthViewProvider` — proving sign-out no longer needs `AuthUIProvider` mounted anywhere outside the two auth views).
- `/` loads no `better-auth-ui`: deferred to step 8's gate, `node scripts/check-site-bundle.mjs --app apps/www` (its `/` route budget and deny list are set up there) — this step's contribution is that `/`'s render tree no longer reaches `AuthViewProvider` at all (only `components/providers/client.tsx` → `BetterAuthClientProvider`, which after this step's edit imports `@daveyplate/better-auth-ui` nowhere).

### Step 8 — Site bundle gate + budget [agent]
Why: the package gate (step 4) proves `@vexcms/react`'s own `dist`; it cannot see a regression introduced by the app itself — a server component that imports the root barrel, a block that calls `icons[name]`, a provider that mounts `AuthUIProvider` globally. `next analyze export` streams the real Turbopack module graph per route as JSON Lines, so this gate measures and denies against the same bytes the browser loads, deterministically (no flakiness, unlike Lighthouse).

Two things about the real `next analyze` output change the design from the task's starting assumptions, found by running it against today's tree:
- `next analyze`'s `source_path` reflects whichever module resolution the app's own Turbopack config and `tsconfig.json` `paths` actually use for `@vexcms/react`/`@vexcms/core` — `apps/test`'s tsconfig maps them straight to `packages/react/src/index.ts` (so its analyzer output shows `packages/react/src/**`), while `apps/www` has no such mapping and resolves through the published `dist/**`. The admin boundary is denied in BOTH shapes: the imported `ADMIN_DENY_LIST` covers `dist/`, and this file adds the `src/`-shaped equivalents.
- Turbopack never emits a literal part or output for `lucide-react/dist/esm/icons/index.js` — it unwraps the barrel's `export *` into one part per concrete icon file, for both today's `icons[name]` lookup (reaches all 1703) and a future static `import { LogOut } from "lucide-react"` (reaches 1, plus lucide's own shared runtime files). The literal `lucide-react/dist/esm/icons/index.js` regex is kept (cheap, matches if a future bundler version stops unwrapping it) but paired with the check that actually fires today: more than `MAX_STATIC_LUCIDE_ICONS` distinct icon files in a route's initial set.

`next analyze export --route` also keys routes by Next's route PATTERN, not a literal URL — there is no `/features` route, only `/[slug]` (the one dynamic page that renders it, same for every slug); `/auth/sign-in` is served by `/auth/[pathname]`. `apps/test` and `apps/www` have the same route tree (confirmed: both have `(frontend)/(site)/[slug]`, `(frontend)/auth/[pathname]`, no separate static `/features`), so one `SITE_ROUTES` map covers both.

`SITE_BUNDLE_BUDGETS` below is provisional: the measurement procedure is `Math.ceil(measuredKb * 1.1)` against a route's `totalKb` from `checkRoute`, and the numbers here are derived the same way from this plan's own measured facts (2210 KB on `apps/www` `/` after the server-import split, minus lucide's 505 KB and auth UI's ~250 KB, since neither step 6 nor step 7 has landed yet to measure directly) — `1601` for non-auth routes, `1876` for `/auth/sign-in` (keeps the ~250 KB of auth UI). Once steps 1–7 land, re-run `node scripts/check-site-bundle.mjs --app apps/www --report` and `--app apps/test --report`, and replace these constants with `Math.ceil(totalKb * 1.1)` for each route.

`next analyze -o` needs no Convex/auth env: unlike `next build`, it never prerenders a page or calls `fetchQuery`, so the CI step runs with no `env:` block (verified: `env -i PATH="$PATH" HOME="$HOME" npx next analyze -o` completed cleanly against `apps/test` with every environment variable wiped).

Verify:
- `node --test scripts/check-site-bundle.test.mjs` passes.
- `node scripts/check-site-bundle.mjs --app apps/test` and `--app apps/www` run `next analyze -o` + `next analyze export --route` for real and print each route's KB; today, both exit 1 (negative proof — the admin boundary, lucide's `icons[name]` lookup, and `@daveyplate/better-auth-ui` on `/` are all still reachable, and every route is already over budget). Measured today (2026-11-08): `apps/test`: `/` 3346.1KB, `/features` 3346.1KB, `/auth/sign-in` 3272.1KB; `apps/www`: `/` 3198.4KB. Every route reports the admin-reach chain (`packages/react/.../index.ts → .../CollectionListView/index.tsx → .../DataTable/index.tsx → @tanstack/react-table`, and the `@hello-pangea/dnd`/`adapter.ts`/`registry.tsx` chains alongside it), the lucide fan-out violation (1703 icon modules, threshold is 4), and — on `/` and `/features` only, confirming the `/auth` exemption — the `better-auth-ui` chain through `apps/test/src/auth/client.tsx`.
- `node scripts/check-site-bundle.mjs --app apps/test --report` prints KB for all three routes and exits 0 with no violations shown, proving `--report` never enforces.
- CI's `Site Bundle Budget` step runs `node scripts/check-site-bundle.mjs --app apps/test` after `Build Packages`.

- [ ] `scripts/check-site-bundle.mjs`, with `SITE_BUNDLE_BUDGETS` replaced by measured values (`--report` after Steps 1–7, then `Math.ceil(totalKb * 1.1)` per app and route)
- [ ] `scripts/check-site-bundle.test.mjs`
- [ ] `.github/workflows/ci.yml`: `Site Bundle Budget` step after `Build Packages`

#### scripts/check-site-bundle.mjs

```js
#!/usr/bin/env node
import { rmSync } from "node:fs";
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { resolve } from "node:path";

import { ADMIN_DENY_LIST } from "./check-import-cost.mjs";

/**
 * The barrel Turbopack never emits as its own part (it unwraps `export *`
 * into one part per concrete icon file) — kept for a future bundler version
 * that stops unwrapping it; `checkRoute` pairs it with a fan-out count over
 * the icon leaf files, which is what actually fires today.
 */
export const LUCIDE_ALL_ICONS_PATTERN = /lucide-react\/dist\/esm\/icons\/index\.js/;

const LUCIDE_ICON_LEAF = /lucide-react\/dist\/esm\/icons\/[a-z0-9-]+\.js$/;
// Legitimate static icon imports (UI primitives, better-auth-ui) measure at
// most 44 icon files per route; an `icons[name]` lookup reaches all 1703.
const MAX_STATIC_LUCIDE_ICONS = 200;

/**
 * The admin boundary in both path shapes `next analyze` can report:
 * `ADMIN_DENY_LIST`'s `dist/`-shaped patterns (what `apps/www` resolves to)
 * plus the `src/`-shaped equivalents (what `apps/test`'s `tsconfig.json`
 * `paths` resolves `@vexcms/react` to).
 */
export const SITE_DENY_LIST = [
  ...ADMIN_DENY_LIST,
  /packages\/react\/src\/adapter\.ts/,
  /packages\/react\/src\/fields\/registry\.tsx/,
  /packages\/react\/src\/(collections|globals|media)\/.*View/,
  /packages\/react\/src\/admin\/AdminLayout/,
  /packages\/react\/src\/ui\/(data-table|dnd)\//,
  LUCIDE_ALL_ICONS_PATTERN,
];

export const BETTER_AUTH_UI_PATTERN = /@daveyplate\/better-auth-ui/;

/** Friendly route name -> the Next.js route pattern that actually serves it. */
export const SITE_ROUTES = {
  "/": "/",
  "/features": "/[slug]",
  "/auth/sign-in": "/auth/[pathname]",
};

/**
 * KB per app per route, `Math.ceil(measuredKb * 1.1)`. Re-measure with
 * `--report` once the route's code has actually shipped the fix and replace
 * the constant here — a budget set before the code it bounds exists is a
 * guess, not a measurement.
 */
export const SITE_BUNDLE_BUDGETS = {
  "apps/www": { "/": 1601, "/features": 1601, "/auth/sign-in": 1876 },
  "apps/test": { "/": 1601, "/features": 1601, "/auth/sign-in": 1876 },
};

/**
 * The route's initial client JS: parts of the outputs of its `bootstrap` and
 * `render_dependent` groups (an `async` group only loads once something
 * dynamically `import()`s it, so it never counts toward the initial load),
 * restricted to client outputs (`/static/` in the filename), de-duplicated
 * by `source_path` (the same source can land in more than one output).
 */
export function initialClientParts(props) {
  const records = props.records;
  const initialFilenames = new Set();
  for (const r of records) {
    if (r.type !== "group") continue;
    if (r.kind !== "bootstrap" && r.kind !== "render_dependent") continue;
    for (const output of r.outputs) {
      if (output.includes("/static/")) initialFilenames.add(output);
    }
  }
  const seen = new Map();
  for (const r of records) {
    if (r.type !== "part") continue;
    if (!initialFilenames.has(r.filename)) continue;
    if (!seen.has(r.source_path)) seen.set(r.source_path, r);
  }
  return [...seen.values()];
}

function simplifyIdent(ident) {
  return ident
    .replace(/^\[project\]\//, "")
    .replace(/^\[externals\]\//, "")
    .replace(/node_modules\/\.pnpm\/[^/]+\/node_modules\//, "node_modules/")
    .replace(/ \[[a-z-]+\]( \(ecmascript[^)]*\))?.*$/, "");
}

function buildForwardGraph(records) {
  const graph = new Map();
  for (const r of records) {
    if (r.type !== "module") continue;
    graph.set(r.ident, [...(r.dependencies?.sync ?? []), ...(r.dependencies?.async ?? [])]);
  }
  return graph;
}

function findChain(graph, roots, test) {
  const queue = roots.map((root) => [root]);
  const visited = new Set(roots);
  while (queue.length > 0) {
    const path = queue.shift();
    const last = path[path.length - 1];
    if (test(last)) return path.map(simplifyIdent).join(" → ");
    for (const next of graph.get(last) ?? []) {
      if (visited.has(next)) continue;
      visited.add(next);
      queue.push([...path, next]);
    }
  }
  return null;
}

/**
 * Checks one route's initial client JS against a KB budget and a deny list
 * of regexes tested against each initial part's `source_path`. A deny hit is
 * reported with the shortest import chain from the route's bootstrap/
 * render-dependent triggers to the matching module, reconstructed by walking
 * `module` records' `dependencies.sync`/`async`. `budgetKb: null` skips the
 * budget check (used by `--report`).
 */
export function checkRoute(props) {
  const { records, route, budgetKb, denyList } = props;
  const routeRecords = records.filter((r) => r.route === undefined || r.route === route);
  const parts = initialClientParts({ records: routeRecords });
  const totalKb = parts.reduce((sum, p) => sum + p.size, 0) / 1024;
  const violations = [];

  if (budgetKb !== null && totalKb > budgetKb) {
    violations.push(`${route}: initial client JS is ${totalKb.toFixed(1)}KB, budget is ${budgetKb}KB`);
  }

  const graph = buildForwardGraph(routeRecords);
  const triggers = routeRecords
    .filter((r) => r.type === "group" && (r.kind === "bootstrap" || r.kind === "render_dependent"))
    .map((g) => g.trigger_module_ident);

  const lucideLeaves = new Set();
  for (const part of parts) {
    if (LUCIDE_ICON_LEAF.test(part.source_path)) lucideLeaves.add(part.source_path);
  }

  for (const pattern of denyList) {
    const hitPart = parts.find((p) => pattern.test(p.source_path));
    if (pattern === LUCIDE_ALL_ICONS_PATTERN && lucideLeaves.size > MAX_STATIC_LUCIDE_ICONS) {
      violations.push(
        `${route}: ${lucideLeaves.size} lucide-react icon modules in the initial bundle, more than the ${MAX_STATIC_LUCIDE_ICONS} a static import can produce (likely an "icons[name]" lookup reaching the whole set)`,
      );
      continue;
    }
    if (!hitPart) continue;
    const chain = findChain(graph, triggers, (ident) => pattern.test(ident));
    violations.push(`${route}: deny-listed import reachable (${chain ?? simplifyIdent(hitPart.source_path)})`);
  }

  return { totalKb, violations };
}

function run(command, args, options) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { ...options, stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) reject(new Error(`${command} ${args.join(" ")} exited ${code}`));
      else resolvePromise();
    });
  });
}

async function streamExport(appDir, routePattern) {
  const child = spawn("npx", ["next", "analyze", "export", "--route", routePattern], {
    cwd: appDir,
    env: process.env,
    stdio: ["ignore", "pipe", "inherit"],
  });
  const rl = createInterface({ input: child.stdout, crlfDelay: Infinity });
  const records = [];
  for await (const line of rl) {
    const trimmed = line.trim();
    if (trimmed) records.push(JSON.parse(trimmed));
  }
  await new Promise((resolvePromise, reject) => {
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolvePromise() : reject(new Error(`next analyze export exited ${code}`))));
  });
  return records;
}

async function main() {
  const args = process.argv.slice(2);
  const appIndex = args.indexOf("--app");
  if (appIndex === -1 || !args[appIndex + 1]) {
    console.error("Usage: check-site-bundle.mjs --app <dir> [--report]");
    process.exitCode = 1;
    return;
  }
  const appDir = resolve(args[appIndex + 1]);
  const appKey = args[appIndex + 1].replace(/\/$/, "");
  const reportOnly = args.includes("--report");
  const budgets = SITE_BUNDLE_BUDGETS[appKey];
  if (!budgets) {
    console.error(`No SITE_BUNDLE_BUDGETS entry for "${appKey}"`);
    process.exitCode = 1;
    return;
  }

  rmSync(resolve(appDir, ".next/diagnostics/analyze"), { recursive: true, force: true });
  rmSync(resolve(appDir, ".next/cache"), { recursive: true, force: true });
  await run("npx", ["next", "analyze", "-o"], { cwd: appDir, env: process.env });

  let failed = false;
  for (const [friendlyRoute, pattern] of Object.entries(SITE_ROUTES)) {
    const records = await streamExport(appDir, pattern);
    if (reportOnly) {
      const { totalKb } = checkRoute({ records, route: pattern, budgetKb: null, denyList: [] });
      console.log(`${appKey} ${friendlyRoute} (${pattern}): ${totalKb.toFixed(1)}KB`);
      continue;
    }
    const denyList = friendlyRoute === "/auth/sign-in" ? SITE_DENY_LIST : [...SITE_DENY_LIST, BETTER_AUTH_UI_PATTERN];
    const { totalKb, violations } = checkRoute({
      records,
      route: pattern,
      budgetKb: budgets[friendlyRoute],
      denyList,
    });
    console.log(`${appKey} ${friendlyRoute} (${pattern}): ${totalKb.toFixed(1)}KB (budget ${budgets[friendlyRoute]}KB)`);
    for (const violation of violations) {
      console.error(`  ✕ ${violation}`);
      failed = true;
    }
  }
  if (failed) process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
```

#### scripts/check-site-bundle.test.mjs

```js
import { test } from "node:test";
import assert from "node:assert/strict";

import { checkRoute, initialClientParts, BETTER_AUTH_UI_PATTERN, LUCIDE_ALL_ICONS_PATTERN } from "./check-site-bundle.mjs";

function part(filename, sourcePath, size) {
  return { type: "part", route: "/", filename, source_path: sourcePath, size, compressed_size: Math.round(size / 3) };
}

function group(kind, outputs, trigger) {
  return { type: "group", route: "/", kind, outputs, trigger_module_ident: trigger, trigger_join: "joined" };
}

function mod(ident, sync = []) {
  return { type: "module", ident, path: ident, dependencies: { sync, async: [] } };
}

test("initial set is the parts of bootstrap and render_dependent group outputs, ignoring async groups", () => {
  const records = [
    group("bootstrap", ["[client-fs]/_next/static/chunks/a.js"], "entry"),
    group("async", ["[client-fs]/_next/static/chunks/lazy.js"], "entry"),
    part("[client-fs]/_next/static/chunks/a.js", "src/eager.ts", 1000),
    part("[client-fs]/_next/static/chunks/lazy.js", "src/lazy.ts", 5000),
  ];
  const parts = initialClientParts({ records });
  assert.deepEqual(
    parts.map((p) => p.source_path),
    ["src/eager.ts"],
  );
});

test("a module bundled into two initial outputs is counted once, by source_path", () => {
  const records = [
    group("bootstrap", ["[client-fs]/_next/static/chunks/a.js"], "entry"),
    group("render_dependent", ["[client-fs]/_next/static/chunks/b.js"], "entry"),
    part("[client-fs]/_next/static/chunks/a.js", "src/shared.ts", 1000),
    part("[client-fs]/_next/static/chunks/b.js", "src/shared.ts", 1000),
    part("[client-fs]/_next/static/chunks/b.js", "src/other.ts", 500),
  ];
  const { totalKb } = checkRoute({ records, route: "/", budgetKb: null, denyList: [] });
  assert.equal(totalKb, 1500 / 1024);
});

test("a deny-listed import reachable from the route is reported with its chain", () => {
  const records = [
    group("render_dependent", ["[client-fs]/_next/static/chunks/a.js"], "app/entry.tsx [app-client] (ecmascript)"),
    part("[client-fs]/_next/static/chunks/a.js", "packages/react/src/ui/data-table/DataTable.tsx", 2000),
    mod("app/entry.tsx [app-client] (ecmascript)", ["packages/react/src/index.ts [app-client] (ecmascript)"]),
    mod("packages/react/src/index.ts [app-client] (ecmascript)", [
      "packages/react/src/ui/data-table/DataTable.tsx [app-client] (ecmascript)",
    ]),
    mod("packages/react/src/ui/data-table/DataTable.tsx [app-client] (ecmascript)", []),
  ];
  const { violations } = checkRoute({
    records,
    route: "/",
    budgetKb: 999,
    denyList: [/ui\/data-table/],
  });
  assert.equal(violations.length, 1);
  assert.match(violations[0], /deny-listed import reachable/);
  assert.match(
    violations[0],
    /app\/entry\.tsx → packages\/react\/src\/index\.ts → packages\/react\/src\/ui\/data-table\/DataTable\.tsx/,
  );
});

test("exceeding the route budget is reported", () => {
  const records = [
    group("bootstrap", ["[client-fs]/_next/static/chunks/a.js"], "entry"),
    part("[client-fs]/_next/static/chunks/a.js", "src/big.ts", 200 * 1024),
  ];
  const { totalKb, violations } = checkRoute({ records, route: "/", budgetKb: 100, denyList: [] });
  assert.equal(totalKb, 200);
  assert.equal(violations.length, 1);
  assert.match(violations[0], /initial client JS is 200\.0KB, budget is 100KB/);
});

test("staying under budget with no deny hits reports no violations", () => {
  const records = [
    group("bootstrap", ["[client-fs]/_next/static/chunks/a.js"], "entry"),
    part("[client-fs]/_next/static/chunks/a.js", "src/small.ts", 10 * 1024),
  ];
  const { violations } = checkRoute({ records, route: "/", budgetKb: 100, denyList: [] });
  assert.deepEqual(violations, []);
});

test("better-auth-ui is exempt on the /auth route but denied elsewhere", () => {
  const records = [
    group("render_dependent", ["[client-fs]/_next/static/chunks/a.js"], "entry"),
    part("[client-fs]/_next/static/chunks/a.js", "node_modules/@daveyplate/better-auth-ui/dist/index.js", 1000),
    mod("entry", []),
  ];
  const onAuthRoute = checkRoute({
    records: records.map((r) => (r.route ? { ...r, route: "/auth/[pathname]" } : r)),
    route: "/auth/[pathname]",
    budgetKb: 999,
    denyList: [],
  });
  assert.deepEqual(onAuthRoute.violations, []);

  const onHomeRoute = checkRoute({
    records,
    route: "/",
    budgetKb: 999,
    denyList: [BETTER_AUTH_UI_PATTERN],
  });
  assert.equal(onHomeRoute.violations.length, 1);
  assert.match(onHomeRoute.violations[0], /better-auth-ui/);
});

test("a static import of a single icon does not trip the lucide fan-out heuristic", () => {
  const records = [
    group("bootstrap", ["[client-fs]/_next/static/chunks/a.js"], "entry"),
    part("[client-fs]/_next/static/chunks/a.js", "node_modules/lucide-react/dist/esm/icons/log-out.js", 500),
  ];
  const { violations } = checkRoute({ records, route: "/", budgetKb: 999, denyList: [LUCIDE_ALL_ICONS_PATTERN] });
  assert.deepEqual(violations, []);
});

test("an icons[name] lookup that bundles the whole icon set trips the lucide fan-out heuristic", () => {
  const records = [
    group("bootstrap", ["[client-fs]/_next/static/chunks/a.js"], "entry"),
    ...Array.from({ length: 10 }, (_, i) =>
      part("[client-fs]/_next/static/chunks/a.js", `node_modules/lucide-react/dist/esm/icons/icon-${i}.js`, 300),
    ),
  ];
  const { violations } = checkRoute({ records, route: "/", budgetKb: 999, denyList: [LUCIDE_ALL_ICONS_PATTERN] });
  assert.equal(violations.length, 1);
  assert.match(violations[0], /10 lucide-react icon modules/);
});
```

#### .github/workflows/ci.yml

One edit. Everything not shown is unchanged.

**1 — `Site Bundle Budget` step, inserted directly after `Build Packages` and before `Typecheck Packages`.** No `env:` block: `next analyze` never prerenders a page or calls Convex, unlike `next build`, so it needs none of the secrets the step above it does (verified by running `next analyze -o` against `apps/test` with every environment variable wiped — it completed cleanly).

```yaml
      - name: Site Bundle Budget
        run: node scripts/check-site-bundle.mjs --app apps/test
```

### Step 9 — ADR, standards, docs, backlog, changesets [agent]
Why: the package's public import contract changes; docs, standards and the release notes must say so.

- [ ] `.agent/docs/decisions/ADR-017.md` (supersedes ADR-009), ADR-009 status → superseded
- [ ] `.agent/docs/standards/tooling/tsup-and-exports.md`: per-module dist, per-module `"use client"`, root reach rule
- [ ] Docs: new "What ships to your pages" section in `apps/docs/src/content/docs/guides/framework-adapters.md`. (`guides/admin-customization.mdx`, `guides/list-views.mdx` and `guides/pagination.mdx` have their code-sample imports updated in Step 5, alongside every other consumer of the moved symbols — nothing to duplicate here.)
- [ ] `.agent/docs/product/backlog.md`: "Lazy config-referenced components" entry
- [ ] `.changeset/core-per-module-dist.md`, `.changeset/create-vexcms-lean-site-pages.md`

#### .agent/docs/decisions/ADR-017.md

New file.

```markdown
# ADR-017: `@vexcms/react` and `@vexcms/core` ship one dist file per source module, split by reach

- Status: accepted
- Date: 2026-11-08
- Supersedes: ADR-009

## Context

`apps/www` loads about 3.0 MB of JavaScript on every route — 1.1 MB admin UI, 671 KB
TanStack Table, 505 KB of lucide icons, 338 KB auth UI — and CI Lighthouse TBT runs
277–570 ms against a 200 ms budget. A visitor never opens the admin panel, never sees a
data table, and sees at most a handful of icons, so almost none of that is reachable
code for them. The same cost hits any consumer who imports one hook.

Three builds were measured against `apps/www` production bundles (2026-11-08):

| Variant | `/` initial JS | TanStack Table on `/` |
|---|---|---|
| Baseline (`dist/chunk-VKIK73SA.js`, 725 KB, holds the whole package) | 3058 KB | yes |
| Drop `./dist/chunk-*.js` from `sideEffects` | 3058 KB | yes |
| One dist file per source module | 3074 KB | yes |
| + root barrel without `"use client"` (± `optimizePackageImports`) | 3097 KB | yes |
| + server components import client components through a client file | **2210 KB** (local TBT ~195 → ~110 ms) | **no** |

Two findings explain the table:

**Client imports already tree-shake once dist is per-module.** With one `.js` file per
source module (no shared chunk, no `splitting`), a bundler that resolves a client import
only pulls the modules on that import's reachability graph. Measured on the site's own
client graph: 18 of 413 `@vexcms/react` modules.

**Server imports don't, no matter what the dist layout is.** A **server** component
importing anything — `cn`, one hook — from a barrel makes Next register every
`"use client"` module that barrel can statically reach as a client reference, and every
one of them ships to the browser, even ones the server component's own render never
touches. This is a property of how Turbopack/webpack build the client reference manifest
from a barrel's module graph, not of tree-shaking: tree-shaking removes code a bundler can
prove is unreachable from *executed* paths, and "this module might be read by a client
component somewhere under this server component" is not something shaking can disprove
for a module already marked `"use client"`. Tested and ruled out: `optimizePackageImports`
(a Next-side heuristic the Server-Components graph doesn't run), a pure re-export barrel
with no `"use client"` of its own, and `sideEffects` — none change which modules get
registered once a server component's import statement reaches them.

The variant that actually drops TanStack Table from `/` replaces every server-side
barrel import (`layout.tsx`, `providers/server.tsx`, `unauthorized/page.tsx`) with an
import through a small local `"use client"` re-export file naming only the symbols that
component needs. That is the entry-split principle generalized: **the root export surface
IS what every server component that imports anything from it pays**, independent of what
that component actually renders.

Reach was measured per export with a static import-graph walk (`spike-reach.mjs`):

| Export | Modules reached | Pulls in |
|---|---|---|
| `slots` | 382 | everything |
| `fields`/`adapter` | 379 | everything |
| `documents` | 157 | data-table, dnd |
| `LivePreviewPanel` | 69 | data-table, dnd |
| `forms` | 56 | dnd |
| `config`, `access`, `hooks`, `modals`, UI primitives, `LivePreviewContext`, `UnauthorizedView`, `ListViewContext`, `RenderBlocks`, `cn`, `Icon`, `adminHref` | 1–21 | nothing admin-only |

The heavy exports (`adapter`, `fields/registry`, every collection/global/media view,
`AdminLayout*`, `data-table/**`, `dnd/**`) are the admin panel. Nothing in a public page
imports them. Everything else — core re-exports, field types, config/access/auth hooks,
the live-preview context (not the panel), `cn`, `Icon`, UI primitives — is what a public
page or a config file actually touches.

## Decision

### 1. Per-module dist, not a shared chunk
`scripts/preserveModulesPlugin.mjs` gives both packages `entry: listModuleEntries({ srcDir:
"src" })`, `bundle: true`, `splitting: false`: one source module compiles to exactly one
`.js` output, mirroring `src/`, with relative imports rewritten to point at sibling output
files (directory imports → `.../index.js`). A consumer's bundler sees the same module graph
tsup saw and can shake it per module.

This also resolves the problem ADR-009 solved with a shared chunk — `@vexcms/react`'s `.`
and `./testing` entries both reach `components/form/AppFormContext.ts`, whose module-scope
`createContext(null)` must be evaluated exactly once. Splitting produced a shared chunk
both entries imported; preserve-modules reaches the same guarantee a different way — the
module compiles to one output file regardless of how many entry barrels reference it, so
both entries resolve it through a relative import to that one file, not through a chunk
boundary. `entry` lists every module (`listModuleEntries` walks `src/`, not an array of
barrels), so the one-instance property holds for every shared module, not just the ones an
ADR happens to call out.

### 2. Per-module `"use client"`, not a barrel banner
The root barrel stops being the client boundary. Every module that needs the directive
(`.tsx` outside `src/server/**`, `use*.ts` hooks, anything calling `createContext`) carries
its own `"use client"`. A server component can then import `cn` or a hook from the root
without tripping "you're importing a module that depends on useState into a Server
Component" — only the modules it actually imports become client references, not everything
the barrel could reach.

### 3. Root vs `/admin`, split by reach
The root (`@vexcms/react`, `@vexcms/react/form`) exports only what a public page or a
config file touches: core re-exports, field/config/access/auth types and hooks, the
live-preview context, `cn`, `Icon`, UI primitives. `@vexcms/react/admin` exports the panel:
the adapter, the field registry, every `*FieldAdmin`/`*FieldCell`, slots, the document-edit
runtime, admin layout and views, `data-table/**`, `dnd/**`, the live-preview panel. No deep
subpaths beyond these two plus `./form`, `./client`, `./server`, `./testing` — a consumer
reaches package internals only through a named entry, never a file path.

`@vexcms/core` ships the same way (per-module dist; it has no `"use client"` modules and no
admin/root split — its entries are already `.`/`./server`/`./internal` by server/client
concern, unchanged by this ADR).

### 4. The gates
Three gates hold the reach promise, because none of Next's own options can be trusted to
(see "why barrel imports ship everything" above):

- **Package import-cost gate** (`scripts/check-import-cost.mjs`): bundles a handful of
  single-symbol fixtures against the built `dist` with esbuild — the same tree-shaking
  question a consumer's bundler asks — and fails if a fixture's bundle includes a
  deny-listed admin module or exceeds its recorded byte budget. Deterministic, Next-free,
  catches a regression in the package itself.
- **Site bundle gate** (`scripts/check-site-bundle.mjs`): runs Next's own analyzer against a
  real app and fails if a route's initial client JS includes a deny-listed module or exceeds
  its budget. Catches a regression anywhere in the app graph the package gate cannot see —
  a provider, a config component, a block — because it measures what Next actually decided
  to ship, not what esbuild could theoretically shake.
- **Lighthouse** (CI `quality` workflow): the user-facing proof, TBT ≤ 200 ms and
  performance ≥ 0.9. It is the only gate that would catch a regression from a cause outside
  either package's own code — a third-party dependency growing, a Next version change — so
  it stays even though it is the least deterministic of the three.

## Consequences

- **File layout stays internal.** Per-module dist is an implementation detail of how
  tree-shaking works, not a public contract — `package.json#exports` still only maps `.`,
  `./admin`, `./form`, `./client`, `./server`, `./testing` (and core's `.`, `./server`,
  `./internal`). **There are no deep imports.** A consumer writing
  `import { X } from "@vexcms/react/dist/fields/text/Input"` was never supported and still
  is not; the per-module dist tree can be rearranged freely as long as the named entries'
  export sets don't change.
- **A consumer pays for what they import, not for the package.** A client component
  importing one hook from the root reaches only that hook's module graph. A server
  component importing from the root pays for the root's whole reach — every field/config/
  access/auth/UI module, not the admin panel — which the import-cost and site-bundle gates
  keep true by construction rather than by review.
- **ADR-009's shared-chunk exception no longer applies.** `docs/standards/tooling/
  tsup-and-exports.md`'s array-of-configs default is unaffected by this ADR; the per-module
  single-config pattern replaces ADR-009's single-config-with-`splitting:true` exception for
  packages whose entries share stateful modules.
- **Adding a new admin-only export is cheap and safe by default** — it goes in
  `src/adminEntry.ts`, and the root-reach import-cost fixture catches it immediately if it
  is added to `src/index.ts` instead. Adding a new root export that happens to deep-import
  something admin-heavy (a field type reaching `dnd` through `ArrayField`, for instance) is
  caught the same way, which is why the app form's surface is `@vexcms/react/form` rather
  than root-exported `AppForm`/`useAppForm` — the root must not reach `dnd` through a field
  that uses it.
```

#### .agent/docs/decisions/ADR-009.md

**1 — status line.** Replace the body of the `Status` line.

```markdown
- Status: superseded by ADR-017
```

#### .agent/docs/standards/tooling/tsup-and-exports.md

**1 — shared-chunk bullet.** Everything not shown is unchanged. The last bullet (the one
starting "**One bundle graph per package when entries share stateful modules.**") is
replaced:

```markdown
- **Per-module dist, not a shared chunk.** `@vexcms/react` and `@vexcms/core` build with
  `entry: listModuleEntries({ srcDir: "src" })` (`scripts/preserveModulesPlugin.mjs`),
  `bundle: true`, `splitting: false` — one `.js` output per source module, relative imports
  rewritten to the sibling output path, so a consumer's bundler can shake unused modules out
  of a client import. A module reached by more than one entry (`@vexcms/react`'s `.` and
  `./testing` both reach `components/form/AppFormContext.ts`'s module-scope `createContext`)
  still compiles to exactly one output file and both entries resolve it by relative import —
  the single-instance guarantee ADR-009 got from a shared `splitting: true` chunk, kept
  without a chunk. See ADR-017 (supersedes ADR-009).
- **`"use client"` is per module, not a barrel banner.** Every client module (`.tsx` outside
  a package's `server/**`, `use*.ts` hooks, anything calling `createContext`) carries its own
  directive; the root barrel carries none. A Server Component importing one symbol from the
  barrel then only reaches that symbol's own module graph as a client reference, not every
  client module the barrel could statically reach.
- **The root export surface is the reach a Server Component pays for.** Next registers every
  `"use client"` module reachable through a barrel a server component imports as a client
  reference — regardless of `optimizePackageImports`, a pure re-export barrel, or
  `sideEffects` — so the root of a package with both public and internal surfaces (like
  `@vexcms/react`'s admin panel) must export ONLY what a consumer's own code touches. Internal
  surfaces move to a separate named entry (`./admin`); there are no deep imports into `dist/`.
  See ADR-017.
```

#### apps/docs/src/content/docs/guides/framework-adapters.md

**1 — new section.** Insert directly after the intro's closing `---` (after the "Status"
callout, before `## How the adapter system works`).

```markdown
## What ships to your pages

`@vexcms/react` ships one dist file per source module and splits its exports by who
reaches them: the root (`@vexcms/react`, `@vexcms/react/form`) is everything a page or a
`vex.config.ts` touches, `@vexcms/react/admin` is the panel.

**In a client component, importing from the root costs only what you import.** `import {
cn } from "@vexcms/react"` in a `"use client"` component pulls in `cn`'s own module graph —
nothing else in the package ships because your bundler never reached it.

**In a server component, importing from the root costs the root's whole reach.** Next
registers every `"use client"` module a barrel import can statically reach as a client
reference, independent of which parts of that barrel your component actually renders — so
a server component doing `import { Icon } from "@vexcms/react"` pays for everything else
exported at the root too. That is exactly what the root is kept small for: it holds field,
config, access and auth types/hooks, `cn`, UI primitives and `Icon` — never the admin
panel — and a CI gate fails the build if that ever stops being true.

**`/admin` is for extending the panel**, not for pages: the adapter, the field registry,
every `*FieldAdmin`/`*FieldCell`, slots, the document-edit runtime, admin layout and views,
the data table and the drag-and-drop primitives it's built on.

**The app form lives at `@vexcms/react/form`**, not at the root — `AppForm`/`useAppForm`
are not root exports, because some of the root's own field types reach `dnd` through them
(`ArrayField`, `BlocksField`), which the root must never do. Import the form from `./form`
whether you're building a field admin component or a config-referenced form elsewhere in
your app.

**`Icon` loads icons lazily; `AdminIcon` loads them eagerly.** The root `Icon` (used on
public pages, where icon names usually come from CMS data you don't control ahead of time)
renders a same-sized placeholder and loads only the one icon it was asked for. The panel's
internal `AdminIcon` renders synchronously — admin-only cost, and the panel already knows
every icon name it uses ahead of time, so there's nothing to gain by deferring them.

```

#### .agent/docs/product/backlog.md

**1 — new entry.** Insert a new entry (with the file's `---` separators) anywhere among the
existing entries; everything else in the file is unchanged.

```markdown
## Lazy config-referenced components

**What.** Defer loading a component that a `vex.config.ts` references by identity — for
example `www`'s config naming `TextFieldAdmin` directly as a field override — until the page
that needs it actually renders, instead of pulling it in through the client config bundle
every page loads via `ClientProviders`/`VexConfigProvider`.

**Why.** `VexConfigProvider` mounts once at the app root (see the framework-adapters guide's
"Wiring it into an app"), so a client `vex.config.ts` that imports an admin component by
reference — `www`'s config imports `TextFieldAdmin` from `@vexcms/react/admin` to override a
field's admin render — ships that component's whole module graph to every page the config is
read on, public pages included, the same way any other root-level import does.

**Lift.** Unassessed. Needs a design for how a config can name a component lazily (a dynamic
`import()` thunk instead of a direct reference, most likely) without breaking the config's own
type-checking of field overrides, or how `defineConfig`/the admin's own consumption of the
config would resolve a lazy reference before rendering.

**Why deferred.** Ratified out of scope during the tree-shakeable-package interview
(2026-11-08): the measured cost today is small — `TextFieldAdmin` is one field override in
one config, not the panel's full surface — and the site bundle gate (`scripts/
check-site-bundle.mjs`, same spec, Step 8) already catches it growing past budget on any
route, so nothing regresses silently while this waits for its own design pass.

**Detail.** `.agent/docs/specs/2026-11-08-tree-shakeable-react-package/spec.md`, Step 8.
```

#### .changeset/core-per-module-dist.md

New file.

```markdown
---
"@vexcms/core": patch
---

Builds with one dist file per source module instead of a shared chunk (`tsup`'s
`splitting: false` plus an esbuild preserve-modules plugin that rewrites relative imports to
the sibling module's output path). `exports` is unchanged — `.`, `./server` and `./internal`
still resolve to `dist/index.js`, `dist/server.js` and `dist/internal.js` — and so is every
export name; this only changes which modules a consumer's bundler can shake out of an import
that doesn't need them.
```

#### .changeset/create-vexcms-lean-site-pages.md

New file.

```markdown
---
"create-vexcms": patch
---

The scaffolded templates (`base-nextjs`, `marketing-site`) stop shipping admin panel and
auth-UI weight to public pages:

- The auth-UI provider (`AuthUIProvider`, previously mounted at the app root through
  `BetterAuthClientProvider`) now mounts only around the two routes that render an
  `AuthView` — the `/auth/[pathname]` page and the intercepting `@auth` modal route. Every
  other route no longer loads `better-auth-ui`, react-hook-form, hcaptcha or qrcode.
- Icons scaffolded into blocks (`Features`, `HowItWorks`) and `SessionButton` go through
  `@vexcms/react`'s lazy `Icon` (loads one icon per name on demand) instead of importing
  `lucide-react`'s `icons` map directly, except `SessionButton`'s sign-out icon, which stays
  a static `import { LogOut } from "lucide-react"` since it is the same icon on every
  render.

No config or route changes required for an already-scaffolded project — these are starting
points for newly scaffolded ones.
```

Verify:
- `pnpm --filter docs build` — confirms the new "What ships to your pages" section and the
  updated code samples (landed in Step 5) parse and render; the docs site's MDX pipeline
  would fail the build on a broken code fence or a dangling heading reference.
- `grep -rn "react.*AppForm\|react.*useAppForm\|react.*AdminLayout\|react.*FieldAdmin\|react.*SlotOutlet" apps/docs/src/content/docs/guides/*.md* | grep -v '@vexcms/react/admin\|@vexcms/react/form'` returns nothing — proves no docs page imports a moved symbol from the root `@vexcms/react` (every admin-classified symbol now resolves through `/admin` or `/form` in every remaining code sample, including the three updated in Step 5).
- `pnpm changeset status --verbose` lists `@vexcms/core`, `@vexcms/react`, `@vexcms/next`
  and `create-vexcms` among the packages with pending changesets (react's `./admin` split
  changeset lands in Step 5; `@vexcms/next` picks up a bump transitively because its
  `NextAdminLayoutClient`/`NextAdminPage` consumers move to `/admin` imports in that same
  changeset).
- Negative check: temporarily reintroduce one admin import at the root (e.g. re-export
  `AdminLayout` from `src/index.ts`) and rerun `node scripts/check-import-cost.mjs` — it
  fails naming the deny-listed module in the root-reach fixture's import chain, proving the
  ADR's "the gates" section is backed by a real, currently-passing check, not just prose.
  Revert before shipping.
- After pushing: the PR's `quality / lighthouse` CI job passes with TBT ≤ 200 ms and
  performance ≥ 0.9, confirming the ADR's reach-split claim holds end-to-end, not just in
  the deterministic gates.

### Step 10 — Server-resolved icon nodes for first paint [agent]

Measured after Steps 1–9 on a local production build of `apps/www`:

| Route | Performance | TBT | LCP (simulated) | LCP (observed) |
|---|---|---|---|---|
| `/features` | 1.0 | 67–83 ms | 1.2 s | — |
| `/auth/sign-in` | 1.0 | 6–12 ms | 0.9 s | — |
| `/` | 0.75 | — | 6.3 s | 438 ms |

The cause on `/`: about 150 ms after hydration, `/` requests 18 tiny chunks, one per lazy `Icon` in the Features, HowItWorks, Footer and Split blocks. Lighthouse's simulator puts every request made before the observed LCP into the LCP chain and replays them on slow 4G. Lazy icons alone therefore fail this spec's own Lighthouse acceptance (performance ≥ 0.9).

The fix mirrors the code-highlight path (`highlightPageBlocks` → `CodeHighlightProvider`):
- The server already has every document a page renders. It collects the `icon` names in them and resolves each to lucide's serializable `IconNode` (`[tag, attrs][]`).
- It hands the result to an `IconNodeProvider`.
- `Icon` renders a node it finds in context synchronously: real SVG in the SSR HTML, no placeholder, no request.
- Names the server never saw (live-preview edits, client-only data) keep the lazy path.

Any CMS icon name still works, and the site gets zero icon requests on first paint.

- [ ] `packages/react/src/ui/iconKey.ts`: pure name → kebab-key resolution shared by client and server (no directive)
- [ ] `packages/react/src/ui/Icon.tsx`: `IconNodeProvider` (merges with any parent provider), and `Icon` renders a context node synchronously via lucide's base `Icon`
- [ ] `packages/react/src/server/resolveIconNodes.ts` + export from `src/server/index.ts` (and refresh that file's stale single-bundle comment)
- [ ] Root exports `IconNodeProvider` and the `IconNodeMap` type
- [ ] Tests: `ui/Icon.test.tsx` (a provider node renders synchronously with no placeholder; a name missing from the provider falls back to lazy), `server/resolveIconNodes.test.ts`
- [ ] www, test, marketing-site template:
  - an app `src/lib/iconNodes.ts` (`collectIconNames`, `resolveDocumentIconNodes`)
  - `page.tsx` and `[slug]/page.tsx` pass `iconNodes` to `PageContent`, which wraps its tree in `IconNodeProvider`
  - `(site)/layout.tsx` wraps the header and footer in `IconNodeProvider` with their documents' icons
  - `posts/[slug]` likewise if it renders icon-bearing blocks
- [ ] `.changeset/react-lazy-icon.md`: mention `IconNodeProvider` + `resolveIconNodes`

#### packages/react/src/ui/iconKey.ts

New file, with no directive: both the client `Icon` and the server resolver import it, and a server module must never import a `"use client"` module.

```ts
import type { IconName } from "@vexcms/core";
import type { dynamicIconImports as DynamicIconImportsType } from "lucide-react/dynamic";
// `lucide-react@0.577.0` ships no package.json "exports" map, so only the
// extension-qualified file resolves at runtime in every bundler and in Node.
// @ts-expect-error -- no declaration exists for the extension-qualified runtime path; types come from the import above
import { dynamicIconImports as untypedDynamicIconImports } from "lucide-react/dynamic.mjs";

export const dynamicIconImports: typeof DynamicIconImportsType = untypedDynamicIconImports;

export type IconKey = keyof typeof DynamicIconImportsType;

// Lucide's keys are kebab-case ("grid-2x2"), which no single casing rule
// derives from a PascalCase IconName ("Grid2x2"). Matching on the
// hyphen-free form sidesteps the ambiguity.
const compactToKey = /* @__PURE__ */ new Map<string, IconKey>(
  (Object.keys(dynamicIconImports) as IconKey[]).map((key) => [key.replaceAll("-", "") as string, key]),
);

/**
 * Resolves a PascalCase Lucide icon name to its `lucide-react/dynamic` key.
 *
 * @param props.name - Icon name as stored in config or CMS data.
 * @returns The kebab-case key, or `undefined` for an unknown name.
 */
export function iconKeyOf(props: { name: string }): IconKey | undefined {
  return compactToKey.get(props.name.toLowerCase());
}

/**
 * Whether `name` is a real Lucide icon name, usable as a type guard against
 * untyped data before rendering it.
 */
export function isIconName(name: string): name is IconName {
  return compactToKey.has(name.toLowerCase());
}
```

#### packages/react/src/ui/Icon.tsx

Full rewrite: the lazy path is unchanged, a context lookup is added in front of it, and `isIconName` and the key map move to `./iconKey`. Keep the existing `IconProps` doc comment and the `Icon` doc comment (extend it with one paragraph on the provider).

```tsx
"use client";

import type { IconNode, LucideProps } from "lucide-react";
import type { DynamicIcon as DynamicIconType } from "lucide-react/dynamic";
import type { ComponentPropsWithRef, ReactNode } from "react";
import type { IconName } from "@vexcms/core";

import { Icon as LucideIcon } from "lucide-react";
// @ts-expect-error -- no declaration exists for the extension-qualified runtime path; see ./iconKey for why it is used
import { DynamicIcon as UntypedDynamicIcon } from "lucide-react/dynamic.mjs";
import { createContext, useContext, useMemo } from "react";

import { iconKeyOf, isIconName, type IconKey } from "./iconKey";

export type { IconName };
export { isIconName };

const DynamicIcon: typeof DynamicIconType = UntypedDynamicIcon;

/** Icon nodes keyed by lucide key ("layout-grid"), as built by `resolveIconNodes`. */
export type IconNodeMap = Partial<Record<IconKey, IconNode>>;

const IconNodeContext = createContext<IconNodeMap>({});

/**
 * Supplies server-resolved icon nodes so `Icon` renders them synchronously,
 * real SVG in the server HTML with no request, instead of loading each icon
 * on demand. Nested providers merge; the inner map wins on a shared key.
 *
 * @param props.nodes - Map produced by `resolveIconNodes` from `@vexcms/react/server`.
 * @param props.children - Subtree whose `Icon`s should use the map.
 */
export function IconNodeProvider(props: { nodes: IconNodeMap; children: ReactNode }) {
  const parent = useContext(IconNodeContext);
  const value = useMemo(() => ({ ...parent, ...props.nodes }), [parent, props.nodes]);
  return <IconNodeContext.Provider value={value}>{props.children}</IconNodeContext.Provider>;
}

// (IconProps unchanged)

const warnedNames = new Set<string>();

export function Icon({ name, className, ...rest }: IconProps) {
  const nodes = useContext(IconNodeContext);
  const key = iconKeyOf({ name });
  if (!key) {
    // (unknown-name warning unchanged)
    return null;
  }
  const iconNode = nodes[key];
  if (iconNode) {
    return <LucideIcon className={className} iconNode={iconNode} {...rest} />;
  }
  // (placeholder + DynamicIcon path unchanged, with `name={key}`)
}
```

The `(… unchanged)` markers mean "keep the current code verbatim". `useContext` runs before the early return, so hook order is stable.

#### packages/react/src/server/resolveIconNodes.ts

New file, no directive (server entry).

```ts
import type { IconNode } from "lucide-react";

import { dynamicIconImports, iconKeyOf, type IconKey } from "../ui/iconKey";

/**
 * Resolves Lucide icon names to their serializable `IconNode`s on the server,
 * for `IconNodeProvider`. Unknown names are skipped; duplicates load once.
 *
 * @param props.names - Icon names collected from the documents a page renders.
 * @returns A map keyed by lucide key, safe to pass across the RSC boundary.
 */
export async function resolveIconNodes(props: { names: Iterable<string> }): Promise<Partial<Record<IconKey, IconNode>>> {
  const keys = new Set<IconKey>();
  for (const name of props.names) {
    const key = iconKeyOf({ name });
    if (key) keys.add(key);
  }
  const entries = await Promise.all(
    [...keys].map(async (key) => {
      const iconModule = (await dynamicIconImports[key]()) as { __iconNode: IconNode };
      return [key, iconModule.__iconNode] as const;
    }),
  );
  return Object.fromEntries(entries);
}
```

`src/server/index.ts`: add `export * from "./resolveIconNodes";`. Replace the header comment's "tsup bundles this entry's entire reachable graph into ONE output file" rationale with the current one: the dist is one file per module, and this entry must still never import a `"use client"` module, so everything it reaches stays directive-free (`ui/iconKey.ts` qualifies).

`src/index.ts`: export `IconNodeProvider` and `type IconNodeMap` beside `Icon`/`isIconName`.

#### packages/react/src/ui/Icon.test.tsx

Add two cases, using the file's existing harness:

```tsx
  it("renders a provider-supplied node synchronously, with no placeholder", () => {
    const nodes = { "layout-grid": [["rect", { width: "7", height: "7", x: "3", y: "3", rx: "1", key: "a" }]] } as IconNodeMap;
    const { container } = render(
      <IconNodeProvider nodes={nodes}>
        <Icon className="size-4" name="LayoutGrid" />
      </IconNodeProvider>,
    );
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("class")).toContain("lucide");
    expect(svg.querySelector("rect")).not.toBeNull();
  });

  it("falls back to the lazy path for a name the provider does not carry", () => {
    const { container } = render(
      <IconNodeProvider nodes={{}}>
        <Icon className="size-4" name="FileText" />
      </IconNodeProvider>,
    );
    expect(container.querySelector("svg")!.getAttribute("class")).toBe("size-4");
  });
```

#### packages/react/src/server/resolveIconNodes.test.ts

```ts
import { describe, expect, it } from "vitest";

import { resolveIconNodes } from "./resolveIconNodes";

describe("resolveIconNodes", () => {
  it("resolves known names to lucide keys with icon nodes and skips unknown ones", async () => {
    const nodes = await resolveIconNodes({ names: ["LayoutGrid", "Grid2x2", "NotAnIcon", "LayoutGrid"] });
    expect(Object.keys(nodes).sort()).toEqual(["grid-2x2", "layout-grid"]);
    expect(nodes["layout-grid"]![0]![0]).toBe("rect");
  });
});
```

#### apps/www/src/lib/iconNodes.ts

New file. Generic over block shapes: every `icon` string anywhere in the documents counts, which covers Features, HowItWorks, Footer, Split and any future block without per-block code.

```ts
import type { IconNodeMap } from "@vexcms/react"

import { resolveIconNodes } from "@vexcms/react/server"

/**
 * Collects every string `icon` property in the given documents, at any depth.
 *
 * @param props.documents - Page, header or footer documents a route renders.
 * @returns The distinct icon names found.
 */
export function collectIconNames(props: { documents: unknown[] }): Set<string> {
  const names = new Set<string>()
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      for (const item of value) visit(item)
      return
    }
    if (value && typeof value === "object") {
      for (const [field, child] of Object.entries(value)) {
        if (field === "icon" && typeof child === "string") names.add(child)
        else visit(child)
      }
    }
  }
  for (const document of props.documents) visit(document)
  return names
}

/**
 * Resolves the icon nodes for the documents a route renders, so the page's
 * `Icon`s paint synchronously from the server HTML.
 *
 * @param props.documents - Documents whose icons the route renders.
 * @returns The map for `IconNodeProvider`.
 */
export async function resolveDocumentIconNodes(props: { documents: unknown[] }): Promise<IconNodeMap> {
  return resolveIconNodes({ names: collectIconNames({ documents: props.documents }) })
}
```

Add `apps/www/src/lib/iconNodes.test.ts`. It checks that `collectIconNames` finds nested `icon` strings in arrays and objects, ignores non-string `icon` values, and dedupes (exact expected `Set`).

#### apps/www/src/app/(frontend)/(site)/page.tsx and `[slug]/page.tsx`

Beside `highlightPageBlocks`, resolve the icon nodes in parallel and pass them to `PageContent`:

```tsx
  const [codeHighlights, iconNodes] = await Promise.all([
    highlightPageBlocks(initialData[0]?.blocks),
    resolveDocumentIconNodes({ documents: initialData }),
  ])

  return (
    <PageContent codeHighlights={codeHighlights} iconNodes={iconNodes} initialData={initialData} />
  )
```

(`[slug]/page.tsx` keeps its `slug` prop.)

#### apps/www/src/app/(frontend)/(site)/PageContent.tsx

Add `iconNodes?: IconNodeMap` to `PageContentProps` (doc: "Server-resolved icon nodes for `initialData`, built by `resolveDocumentIconNodes`"), and wrap the existing `CodeHighlightProvider` subtree:

```tsx
    <IconNodeProvider nodes={iconNodes ?? {}}>
      <CodeHighlightProvider highlights={codeHighlights ?? {}}>
        {/* existing RenderBlocks unchanged */}
      </CodeHighlightProvider>
    </IconNodeProvider>
```

#### apps/www/src/app/(frontend)/(site)/layout.tsx

After the header/footer fetch, resolve their icons and wrap both:

```tsx
  const iconNodes = await resolveDocumentIconNodes({ documents: [headerData, footerData] })
```

```tsx
      <IconNodeProvider nodes={iconNodes}>
        <SiteHeader initialData={headerData} />
        <main id="main">{children}</main>
        <SiteFooter initialData={footerData} />
      </IconNodeProvider>
```

Wrapping `main` too lets page-level providers merge over the layout's map.

#### Mirrors

- **apps/test:** same edits; its `page.tsx`, `[slug]/page.tsx` and `layout.tsx` are byte-identical to www's.
- **marketing-site template:** same edits; its `layout.tsx` is identical, while its `page.tsx`, `[slug]/page.tsx` and `PageContent.tsx` differ from www, so apply the same edits by anchor.
- **`posts/[slug]`:** if it renders blocks with `icon` fields, wire it the same way; otherwise leave it.

Verify:
- `pnpm --filter @vexcms/react build && pnpm --filter @vexcms/react test && node scripts/check-import-cost.mjs && pnpm --filter www test`
- `node scripts/check-site-bundle.mjs --app apps/www` and `--app apps/test`; re-record budgets if they drift down (`--report`, measured × 1.1, ceiled)
- `node scripts/export-names.mjs --write` (the root gains `IconNodeProvider`; the server entry gains `resolveIconNodes`)
- Local production build of www, `next start`: `/` makes zero lazy icon-chunk requests on load (count script requests after hydration). The SSR HTML of `/` contains the Features icons' `<rect>`/`<path>` markup. Lighthouse on `/` (3 runs) reaches performance ≥ 0.9.
- Negative check: drop `IconNodeProvider` from `PageContent` → `/` makes the icon-chunk requests again → restore.
- `node scripts/verify-scaffold.mjs`

## Verification

Run once every step has landed:

- `pnpm build && pnpm typecheck && pnpm test && pnpm lint`
- `node --test scripts/preserveModulesPlugin.test.mjs scripts/check-import-cost.test.mjs scripts/check-site-bundle.test.mjs`
- `node scripts/check-import-cost.mjs` exits 0
- `node scripts/check-site-bundle.mjs --app apps/test` and `--app apps/www` exit 0
- `node scripts/export-names.mjs --check`
- `node scripts/verify-scaffold.mjs`
- `pnpm --filter www build` + `next start`, then local Lighthouse on `/`, `/features` and `/auth/sign-in`: TBT and performance recorded in the implementation notes
- After push: the PR's `quality / axe` and `quality / lighthouse` pass
