---
applies_to: ["packages/*/tsup.config.ts", "packages/*/package.json"]
---
# tsup & Package Exports

- **Server/client split:** a package exporting both async server components and
  `"use client"` components uses an ARRAY of tsup configs — server entries with NO banner
  (+ client files listed as `external`), client entries with
  `banner: { js: '"use client";' }` (`packages/next/tsup.config.ts`). A single config's
  banner stamps ALL entries and mislabels server components. Exposed as `./server` and
  `./client` sub-path exports; only the second config sets `clean: false`.
- **Externals:** library packages externalize peers, workspace siblings, and runtime deps
  (`packages/react/tsup.config.ts:7-27`: react, react-dom, @vexcms/core, convex,
  /^convex\//, @tanstack/react-query, ...) to keep React a singleton and avoid double
  bundling.
- **DTS currently disabled:** all packages set `dts: false` ("Temporarily disable DTS to
  fix CPU issue" — packages/{cli,core,react}/tsup.config.ts). Dev-time types flow through
  the `source` export condition instead. When re-enabling, ensure `exports.*.types` points
  at real dist output.
- Exports fields are locked down — no accidental deep imports; every entry maps
  source/types/import explicitly.

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
