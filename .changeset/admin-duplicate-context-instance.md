---
"@vexcms/react": patch
"@vexcms/next": patch
---

Fixed a production-only 500 on `/admin`: `useVexConfig() must be used within a
VexConfigProvider`, thrown even with a real `VexConfigProvider` mounted as an
ancestor. Root cause confirmed by disassembling the live Next.js/Turbopack
production build: `VexConfigContext`'s `createContext(null)` call was compiled
into TWO independently-instantiated modules (different module IDs, each its
own `createContext` call) — one reached through `@vexcms/react`'s root export
(the app's own provider mount), one through `@vexcms/react/admin` (`AdminLayout`'s
own import chain). This is a known class of Turbopack production bug (scope
hoisting evaluating a shared module's factory more than once across a
module-graph shape like multiple `package.json` `exports` subpaths reaching
one file — see vercel/next.js#96648, #96691, #96697) — not a `tsup`/package
build defect (`packages/react`'s own build already produces exactly one
`dist/` file per source module) and not introduced by any recent change to
`@vexcms/react`'s or `@vexcms/next`'s build config.

Dev was never affected: `apps/test`'s/`apps/www`'s `next.config.ts` resolves
every workspace package to its TypeScript source in dev (for Fast Refresh),
which happens to also unify module identity; production intentionally
resolves the published `dist`, which is where Turbopack's duplication
surfaced.

Fix: every `createContext()` (and `createFormHookContexts()`) call in
`@vexcms/react` is now pinned to `globalThis` via a new `globalSingleton`
helper (`src/utils/globalSingleton.ts`, keyed by `Symbol.for()`), so no
matter how many times Turbopack's production build evaluates the defining
module's factory, every caller converges on the same Context identity. This
doesn't stop the module from being duplicated — it makes the duplication
harmless. Applied to all ~26 contexts the package defines (`VexConfigContext`,
`VexAuthContext`, `ListViewContext`, the DnD/form/document/live-preview/modal/
theme/icon contexts, and the `AppForm` field/form context pair), not just the
one that happened to throw first.

`globalSingleton` is now exported from `@vexcms/react`, and `@vexcms/next`'s
`VexAdminAuthAdapterContext` uses it too, so a duplicated copy of that module
can no longer hide the admin's Sign in/out control.

Validated against both consumption shapes a real app uses: an isolated
production build of `apps/test` against the rebuilt package (workspace link,
`/admin` 500 → 200), and `scripts/verify-scaffold.mjs` (packed-tarball
install, the same path `pnpm create vexcms` users get) — which now asserts
every scaffolded template's production server serves `/admin` without a 500
and without a "must be used within a ...Provider" context-identity error, so
this class of regression fails the gate going forward instead of shipping
silently.
