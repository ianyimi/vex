---
"@vexcms/core": patch
"@vexcms/react": patch
"@vexcms/next": patch
"@vexcms/cli": patch
"@vexcms/better-auth": patch
"@vexcms/file-storage-convex": patch
"@vexcms/richtext-plate": patch
---

Ship type declarations. Published packages contained no `.d.ts` at all.

Every `tsup.config.ts` carried `dts: false` — tsup's rollup-dts pegs the CPU on this
dependency graph — so `types: "./dist/index.d.ts"` pointed at a file that was never
emitted. Installing any `@vexcms/*` package gave you `any`.

Declarations now come from `tsc -p tsconfig.build.json --emitDeclarationOnly`, run after
tsup in each package's `build` script. `dts: false` stays, deliberately: tsup builds JS,
tsc builds types.

The blocker was TS6059 (`File is not under rootDir`). Workspace deps resolved through the
`source` export condition, pulling sibling `src/` into each program. The build configs now
set `"customConditions": []` so deps resolve through their published `types` entry
instead; Turbo's `dependsOn: ["^build"]` guarantees upstream `dist/` exists first. Dev
configs are untouched and still resolve through `source`.

Also exports `AuthFieldMeta` from `@vexcms/core`. `@vexcms/better-auth` had been importing
it through `../../core/src/auth/types`, a cross-package source path that cannot produce a
correct declaration.
