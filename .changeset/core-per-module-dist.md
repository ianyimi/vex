---
"@vexcms/core": patch
---

Builds with one dist file per source module instead of a shared chunk (`tsup`'s
`splitting: false` plus an esbuild preserve-modules plugin that rewrites relative imports to
the sibling module's output path). `exports` is unchanged — `.`, `./server` and `./internal`
still resolve to `dist/index.js`, `dist/server.js` and `dist/internal.js` — and so is every
export name; this only changes which modules a consumer's bundler can shake out of an import
that doesn't need them.
