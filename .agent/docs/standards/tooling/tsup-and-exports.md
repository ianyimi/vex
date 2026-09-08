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

- **One bundle graph per package when entries share stateful modules.** `@vexcms/react` builds `.` and `./testing` from a SINGLE config with `splitting: true`, deliberately overriding the array-of-configs guidance above: two invocations cannot share a chunk, so a module-scope `createContext` gets evaluated twice and a consumer mounting components from one entry cannot see providers from the other. See ADR-009.
