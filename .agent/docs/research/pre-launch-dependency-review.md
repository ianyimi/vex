# Pre-launch dependency review (2026-11-07)

## Question

Which pinned dependencies should move before v0.1.0 so new `create-vexcms` projects start on
current, non-vulnerable versions? Focus: better-auth, @convex-dev/better-auth, better-auth-ui,
Base UI, TanStack; security fixes are mandatory.

## Answer

Two items are security blockers for the scaffold; the rest are optional freshness bumps.

### Must do (security, user-facing)

| Package | Now | Target | Why |
|---|---|---|---|
| `next` (template only) | 16.3.3 | 16.4.5 | Template drifted from catalog (16.4.3). 16.3.3 has 3 critical (RCE in image optimizer, `use cache`, `next/og`) + 1 high + 7 moderate advisories. Catalog 16.4.3 has none; 16.4.5 is latest patch. |
| `better-auth` | 1.6.23 | 1.7.17 (or 1.7.18 after 2026-11-08 15:00Z) | Critical GHSA-965c-763c-88jm, high GHSA-r4xp-prcw-77qf, high GHSA-q84f-53jg-9ppm. Fixed only in ≥1.7.7; the 1.6 line (1.6.34) is not patched. |
| `@better-auth/api-key`, `@better-auth/passkey` override | 1.6.23 | same as better-auth | Released in lockstep. |
| `@convex-dev/better-auth` | 0.11.5 | 0.13.0 | Forced: only 0.13.0 accepts better-auth 1.7 (peer `>=1.7.16 <1.8.0`; 0.12.x is `<1.7.0`). |
| `zod` | 4.4.3 | 4.6.7 | High: memory exhaustion validating oversized constrained collections (<4.6.6). Shipped as an exact dep of `@vexcms/core` and `@vexcms/react`, so users get our pin. |
| `vitest` | 4.1.10 | 4.1.12 | Moderate @vitest/mocker path traversal (<4.1.11). Peer floor of the test kit; dev-only. |

### Recommended (low risk, same major)

`@base-ui/react` 1.2.0→1.9.0 (no breaking change hits our components; ScrollArea role change already
overridden in `packages/react/src/ui/scroll-area.tsx`), `@tanstack/react-query` 5.101.2→5.106.0,
`@tanstack/react-form` 1.33.1→1.33.5, `convex` 1.44.0→1.49.0, `convex-helpers` 0.1.120→0.1.133,
`nuqs` 2.9.0→2.10.2, `react`/`react-dom` 19.2.7→19.2.9, patch-level tooling (tailwindcss 4.3.4,
prettier 3.9.10, typescript-eslint 8.72.1, @codemirror/view, use-mask-input, tailwind-merge 3.7.0).

### Should consider (consistency, not security)

`eslint-config-next` 15.5.9 / `@next/eslint-plugin-next` 15.5.20 are Next 15 configs on a Next 16
app. v16 ships native flat config; the template's `compat.extends("next/core-web-vitals")`
(`templates/base-nextjs/eslint.config.mjs:45`) must become a direct import.

### Defer past launch (majors, peer caps)

`@tanstack/react-table` 9, `lucide-react` 1 (brand icons removed; peers cap `<1`), `typescript` 7,
`eslint` 10, `@convex-dev/eslint-plugin` 5, `shadcn` 4, `jsdom` 30, `convex-test` 0.0.67,
`react-day-picker` 10, `react-dropzone` 20, `react-resizable-panels` 4, create-vexcms CLI deps
(chalk 6, commander 15, ora 10, execa 10, @inquirer/prompts 8), `@changesets/cli` 3.

### Docs site only (not shipped)

`astro` 6.4.8 has a critical advisory (AVIF optimizer RCE, fixed 7.2.8) plus XSS fixes; `sharp`
0.34.5 has three high libvips/libheif/librsvg advisories (fixed 0.35.5). The docs build is static
over trusted content, so exposure is build-time only. Astro 7 is a major; schedule post-launch.

### Transitive advisories

Most `pnpm audit` hits (undici, @modelcontextprotocol/sdk, systeminformation via `shadcn`;
proxy-addr, fast-uri, ip-address via `@lhci/cli`; brace-expansion/minimatch via eslint;
js-yaml via changesets) are caret-ranged transitives. New projects install without our lockfile
and resolve patched versions; for this repo, `pnpm update --recursive` inside existing ranges
clears most. `deepmerge` (via better-auth-ui → react-email) has no patched release.

## Auth upgrade work list

1. Catalog: `better-auth`, `@better-auth/api-key` → 1.7.17; `@convex-dev/better-auth` → 0.13.0.
2. `catalogs.peers.better-auth`: `">=1.6.23 <1.7.0"` → `">=1.7.16 <1.8.0"` (published promise of
   `@vexcms/better-auth`).
3. Root + template `pnpm.overrides["@better-auth/passkey"]` and
   `peerDependencyRules.allowedVersions["@convex-dev/better-auth>better-auth"]`: bump or drop
   (0.13.0's peer range now covers better-auth directly).
4. Re-create `patches/@convex-dev__better-auth@0.11.5.patch` against 0.13.0: hunk 1 (proxy
   handler drops `x-forwarded-host`) is upstream (`dist/nextjs/index.js:36-41`); hunk 2
   (`getToken` path remaps `x-forwarded-host`, get-convex/better-auth#422) is NOT in 0.13.0.
5. Regenerate `packages/better-auth/src/pluginSchemas.generated.ts` (`UPDATE_AUTH_SCHEMAS=1`).
   Verified in the 1.7.17 tarball: `better-auth/plugins` no longer ships `mcp` or `oidcProvider`
   (moved to `@better-auth/mcp` / `@better-auth/oauth-provider`, 1.7.18). `pluginSchemas.test.ts`
   imports both, and `betterAuthCollections()` exposes both descriptors
   (`packages/better-auth/src/pluginSchemas.ts:85,87`) — repoint the probe to the new packages
   or drop the descriptors (public API change → changeset).
6. better-auth-ui 3.4.0 is still latest (no successor package); peer `better-auth ^1.4.6` admits 1.7.
   Runtime compatibility unverified — smoke sign-in/sign-up/anonymous flows.
7. Template: mirror every catalog change into `templates/base-nextjs/package.json` by hand —
   `scripts/sync-template-versions.mjs` only syncs `@vexcms/*`, which is how `next` drifted.

## Sources

- `pnpm outdated -r`, `pnpm audit --json` (2026-11-07)
- npm bulk advisory endpoint against catalog and template pins
- https://github.com/advisories/GHSA-965c-763c-88jm
- https://github.com/better-auth/better-auth/releases/tag/v1.6.34 (no security fix in 1.6 line)
- `npm view @convex-dev/better-auth@{0.11.5..0.13.0} peerDependencies`
- `npm pack @convex-dev/better-auth@0.13.0` → `dist/nextjs/index.js`
- Base UI releases 1.3.0–1.9.0 (https://base-ui.com/react/overview/releases)

## Open questions

- Does better-auth-ui 3.4.0 type-check and run cleanly against better-auth 1.7.x?
- Template ships neither patch (`patchedDependencies` absent), so scaffolded projects already
  lack the #422 `getToken` fix and the better-auth-ui a11y fix. Intended?
