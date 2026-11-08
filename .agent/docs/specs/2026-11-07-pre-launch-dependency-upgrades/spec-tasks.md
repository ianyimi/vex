---
status: draft
spec_id: 2026-11-07-pre-launch-dependency-upgrades
touches:
  - "pnpm-workspace.yaml"
  - "pnpm-lock.yaml"
  - "package.json"
  - "patches/*.patch"
  - ".changeset/*.md"
  - "apps/*/package.json"
  - "apps/*/eslint.config.mjs"
  - "apps/*/convex/http.ts"
  - "apps/test/src/auth/plugins.ts"
  - "apps/www/convex/auth/plugins/index.ts"
  - "apps/docs/astro.config.mjs"
  - "apps/docs/src/content.config.ts"
  - "apps/docs/src/content/i18n/en.json"
  - "apps/docs/src/content/docs/guides/auth.mdx"
  - "packages/better-auth/**"
  - "packages/next/eslint.config.mjs"
  - "packages/create-vexcms/templates/base-nextjs/**"
  - ".agent/docs/product/tech-stack.md"
  - ".agent/manifest.json"
  - ".agent/dependencies/registry.md"
  - ".agent/docs/research/pre-launch-dependency-review.md"
  - ".agent/docs/tasks.md"
prompt_version: 1
---

# 2026-11-07-pre-launch-dependency-upgrades — Tasks

All groups are `[agent]`. Starts after the current working tree (launch-infrastructure,
public-presence, quality-pass sessions) is committed. Findings behind every target version:
`.agent/docs/research/pre-launch-dependency-review.md`.

Every step changes `pnpm-workspace.yaml` `catalog:` AND mirrors the same pins into
`packages/create-vexcms/templates/base-nextjs/package.json` by hand —
`scripts/sync-template-versions.mjs` syncs only `@vexcms/*`, which is how the template's
`next` drifted to 16.3.3. Each step leaves `pnpm install`, `pnpm build`, `pnpm typecheck`,
`pnpm test` and `pnpm lint` green.

## Step 1 — Security pins without API changes [agent]
Why: the scaffold template pins `next` 16.3.3 (3 critical RCE advisories, fixed ≤16.4.0 →
catalog's 16.4.3 is clean, 16.4.5 is latest patch); `zod` 4.4.3 has a high memory-exhaustion
advisory (<4.6.6) and ships as an exact dependency of `@vexcms/core` and `@vexcms/react`;
`vitest` 4.1.10 has a moderate path traversal (<4.1.11) and is the test kit's peer floor.
Verify:
- [ ] npm bulk-advisory query over every catalog and template pin reports nothing for
      `next`, `zod`, `vitest`
- [ ] Template `next` equals catalog `next`
- [ ] build/typecheck/test/lint green; changeset (`patch`) for `@vexcms/core`, `@vexcms/react`,
      `create-vexcms`

## Step 2 — Same-major freshness refresh [agent]
Why: new projects should start on current minors. Base UI 1.2.0 → 1.9.0 (no breaking change
reaches our components; ScrollArea viewport role already overridden), TanStack Query/Form,
convex, convex-helpers, nuqs, react/react-dom 19.2.x latest patch, and patch-level tooling.
All stay inside existing peer ranges. `convex` 1.49 requires Node ≥22, so root `engines.node`
rises to `>=22.0.0` (CI already runs 22; Node 20 is end-of-life).
Verify:
- [ ] `pnpm outdated -r` lists only packages named in Out of Scope (majors, React 19.3,
      launch-infrastructure-owned `convex-test`/`@convex-dev/rate-limiter`, auth stack until step 3,
      eslint-config-next until step 4, docs site until step 5)
- [ ] build/typecheck/test/lint green; changeset for packages whose published deps moved

## Step 3 — Auth stack: better-auth 1.7.18 + @convex-dev/better-auth 0.13.0 [agent]
Why: better-auth 1.6.x carries critical GHSA-965c-763c-88jm and high GHSA-r4xp-prcw-77qf /
GHSA-q84f-53jg-9ppm, patched only in ≥1.7.7 (the 1.6 line is not backported). Only
`@convex-dev/better-auth` 0.13.0 accepts better-auth 1.7 (peer `>=1.7.16 <1.8.0`). 1.7 also
drops `mcp`/`oidcProvider` from `better-auth/plugins` in favour of `@better-auth/oauth-provider`
`oauthProvider`, so `betterAuthCollections()` swaps both descriptors for one `oauthProvider`.
The root patch is re-created against 0.13.0 — upstream fixed the route-handler half of #422,
not the `getToken` half.
Verify:
- [ ] Bulk-advisory query reports nothing for `better-auth`
- [ ] Plain `pnpm install` exits 0 under `strictPeerDependencies: true`; deleting each kept
      `allowedVersions`/override entry makes it exit 1 (AP-013)
- [ ] `pluginSchemas.test.ts` regenerated and green; `betterAuthCollections({ plugins: { oauthProvider: true } })`
      parity with the adapter
- [ ] Manual: sign-in, sign-up, anonymous sign-in, admin load on `apps/test` (attach to running
      dev server, P-024)
- [ ] build/typecheck/test/lint green; changeset for `@vexcms/better-auth`, `create-vexcms`

## Step 4 — eslint-config-next 16 alignment [agent]
Why: `eslint-config-next` 15.5.9 and `@next/eslint-plugin-next` 15.5.20 are Next 15 configs on
a Next 16 app. v16 ships native flat configs (`eslint-config-next/core-web-vitals`), so the
`FlatCompat` shim in `apps/test`, `apps/www`, `packages/next` and the template goes away, and
`@next/eslint-plugin-next`/`@eslint/eslintrc` leave the catalog.
Verify:
- [ ] `pnpm --filter test lint`, `pnpm --filter www lint`: findings new to the Next 16 rule set
      are fixed or listed with the rule name; no `Cannot redefine plugin`
- [ ] No `FlatCompat`/`@eslint/eslintrc` import remains where only `next/core-web-vitals` used it

## Step 5 — Docs site: Astro 7 + Starlight [agent]
Why: `astro` 6.4.8 carries a critical (AVIF optimizer RCE, fixed 7.2.8) and several XSS
advisories; `sharp` 0.34.5 three high libvips/libheif/librsvg advisories (fixed 0.35.5).
Static site, build-time exposure only, but the deployed docs should not ship flagged versions.
Starlight, starlight-typedoc and starlight-llms-txt move with Astro.
Verify:
- [ ] `pnpm --filter docs build` exits 0 with only the pre-existing `Entry docs → 404 was not
      found` notice; page set identical to before the step
- [ ] Bulk-advisory query reports nothing for `astro`, `sharp`
- [ ] Visual check of the built docs (home, a guide, an API reference page, llms.txt)

## Step 6 — Transitive refresh, scaffold gate, records [agent]
Why: most remaining `pnpm audit` findings are caret-ranged transitives (undici, MCP SDK,
systeminformation via `shadcn`; proxy-addr, fast-uri, ip-address via `@lhci/cli`; minimatch,
brace-expansion via eslint; js-yaml via changesets) that a lockfile refresh inside existing
ranges clears. Template changes are only proven by a real scaffold run (AP-020). Records
(tech-stack, dependency registry, research doc, inbox task for the unshipped template patches)
close the loop.
Verify:
- [ ] `pnpm audit --audit-level high` lists only advisories with no patched release in range
      (record each in the spec's Verification section)
- [ ] `pnpm verify:scaffold` green; manual scaffold run of `base-nextjs` and `marketing-site`
      (sign-up, admin load, `pnpm build`)
- [ ] `harness deps` re-cloned at the new versions; `harness tasks` shows the template-patch task
