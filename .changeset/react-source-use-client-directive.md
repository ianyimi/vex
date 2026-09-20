---
"@vexcms/react": patch
---

Move the package's `"use client"` boundary from a tsup banner into the source barrels
(`src/index.ts`, `src/testing/index.ts`).

No behavioral change to the published bundle: esbuild preserves an entry's directive
prologue, so `dist/index.js` and `dist/testing/index.js` still open with exactly one
`"use client";`, and the tsup `banner` that previously injected it is now redundant and
removed (keeping both emitted the directive twice).

The reason it has to live in the source: a monorepo app that resolves this package
through its `exports.source` condition — which is how the workspace now gets Fast Refresh
on package edits — imports `src/index.ts` directly, where a bundle banner does not exist.
Without the directive there, the first RSC import fails with "You're importing a module
that depends on useState into a React Server Component module". Marking the barrel
reproduces the banner's semantics exactly: everything reachable from it joins the client
graph.
