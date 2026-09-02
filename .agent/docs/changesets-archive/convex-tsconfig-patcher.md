---
"@vexcms/cli": patch
---

`patchConvexTsconfig` no longer injects `baseUrl` into `convex/tsconfig.json` — it's deprecated
in TypeScript 6/7 and errors under `moduleResolution: "Bundler"`. A `baseUrl` of exactly `"."`
left over from an older scaffold is now actively deleted (self-heal for already-scaffolded
alpha.2 projects). The patcher also now ensures `../src/vex.types.ts` is listed in `include` —
Convex rewrites this file on every provisioning pass and would otherwise drop it, making the
project's `GeneratedVexTypes` module augmentation invisible to the convex program.
