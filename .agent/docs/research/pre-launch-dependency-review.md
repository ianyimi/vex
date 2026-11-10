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
proxy-addr, fast-uri, ip-address via both `shadcn` and `@lhci/cli`; brace-expansion/minimatch via
eslint; js-yaml via changesets) are caret-ranged transitives. New projects install without our
lockfile and resolve patched versions; for this repo, `pnpm update --recursive` inside existing
ranges clears most (measured 2026-11-09: 98 of 126 root-lockfile Dependabot alerts, § Dependabot
triage). `deepmerge` (via better-auth-ui → react-email, and `shadcn`) has no patched release.

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

## Dependabot triage (2026-11-09)

GitHub Dependabot alerts were turned on for `ianyimi/vex` on 2026-11-09: **297 open alerts**
(14 critical, 114 high, 137 medium, 32 low). Scanned branch: `master` (default); its
`pnpm-lock.yaml` is identical to `dev`'s. Re-pull with
`gh api -X GET repos/ianyimi/vex/dependabot/alerts --paginate -f state=open -f per_page=100`.

### Where they come from

| Manifest | Alerts | Real exposure | Notes |
|---|---|---|---|
| `apps/test/pnpm-lock.yaml` | 155 | **None — stale file** | Committed in `b4ff20ba` (2026-09-01) with a stray `apps/test/pnpm-workspace.yaml` (`packages: ["."]`). Predates the catalog: `apps/test/package.json` has 52 `catalog:` specifiers, this lockfile has 0 (`next` 16.1.2, `better-auth` 1.6.1). Nothing installs from it; `apps/test` resolves through the root lockfile. The template has no `pnpm-workspace.yaml`. |
| `templates/base-nextjs/package.json` | 16 | **Yes — every new scaffold** | `next` 16.3.3 (11 alerts, 4 critical RCE), `better-auth` 1.6.23 (4), `zod` 4.4.3 (1). Same as § Must do. |
| `pnpm-lock.yaml`: shipped | 7 | **Yes** | `better-auth` + `@better-auth/{drizzle,kysely}-adapter` 1.6.23 (6) and `zod` 4.4.3 (1, exact dep of `@vexcms/core`/`@vexcms/react`; core's array/blocks input schemas are the vulnerable shape). Our own apps enable only `admin`/`anonymous`, so the better-auth advisories (magicLink + social, oauthProxy, deviceAuthorization) don't hit them; consumers who enable those plugins are exposed, and `catalogs.peers.better-auth` `<1.7.0` blocks them from taking the fix. |
| `pnpm-lock.yaml`: `shadcn` CLI tree | 69 | Low | undici, `@modelcontextprotocol/sdk`, express (`proxy-addr` is the critical), body-parser, qs, hono/`@hono/node-server`, fast-uri, ip-address, systeminformation, deepmerge. `shadcn` sits in `dependencies` of `apps/www`, `apps/test` and the base template, but only `@import "shadcn/tailwind.css"` is used — its CLI code never runs in a deployed app. Dependabot still labels the whole tree `runtime`. |
| `pnpm-lock.yaml`: docs (Astro) | 26 | Low | astro, sharp, devalue, svgo, smol-toml, markdown-it (typedoc). Build-time over trusted content (§ Docs site only). |
| `pnpm-lock.yaml`: test/lint/build tooling | 24 | Low | vitest, `@vitest/mocker`, vite, esbuild, js-yaml, brace-expansion, minimatch, glob, basic-ftp, source-map-js, browserslist, baseline-browser-mapping, postcss-selector-parser. |

**Address now: 23** (16 template + 7 shipped). **Real but low risk: 119.** **Noise: 155.**

### Fix path per alert (all 297)

| Fix | Alerts | What |
|---|---|---|
| Delete stale files | 155 | `git rm apps/test/pnpm-lock.yaml apps/test/pnpm-workspace.yaml` |
| In-range lockfile refresh | 98 | **Measured:** `pnpm update -r --depth Infinity --lockfile-only` in a throwaway worktree of `dev@35b64119` cleared 98 of the 126 root-lockfile alerts (2026-11-09) |
| Patch bump of an exact pin | 21 | Template `next` ≥16.4.1 (11); catalog `vitest`/`@vitest/coverage-v8` 4.1.12 (3, incl. `@vitest/mocker`); catalog `vite` 7.3.6 → ≥7.3.7 (5); `zod` ≥4.6.6 in catalog + template (2) |
| Breaking upgrade | 20 | better-auth 1.7 stack (10: 6 root + 4 template; § Auth upgrade work list); Astro 7 + sharp 0.35 (9); `esbuild` 0.28 (1, needs `tsup` 9 — `tsup` 8.5.1 pins `esbuild ^0.27.0`) |
| No in-range fix | 3 | `minimatch` 11.0.1 (typedoc 0.28.20 and typescript-eslint 8.x pin `^10`); `basic-ftp` 6.2.1 (`get-uri` 6/8 pin `^5`, via `@lhci/cli` → `proxy-agent`); `deepmerge` 4.3.1 (no patched release) |

Residue after the measured refresh (28): better-auth ×4, drizzle-adapter, kysely-adapter, zod
(4.4.3 **and** 3.25.76), astro ×6, sharp ×3, vite ×5, vitest, `@vitest/mocker` ×2, esbuild,
minimatch, basic-ftp, deepmerge. Every one is covered by a row above.

### What the spec does not cover yet

`2026-11-07-pre-launch-dependency-upgrades` already covers the template `next` pin, zod,
vitest, the better-auth 1.7 stack, Astro 7 + sharp 0.35, and the `pnpm update -r` refresh. Fold
these in when the spec is (re)written:

1. **Delete `apps/test/pnpm-lock.yaml` and `apps/test/pnpm-workspace.yaml`** (−155 alerts). Not the
   root lockfile, so Design Decision 14 doesn't apply. Check: `pnpm install --frozen-lockfile`
   from the root still passes, and `pnpm --filter test build` resolves through the root lockfile.
2. **`vite` catalog pin 7.3.6 → ≥7.3.7.** The spec never names `vite`; it is an exact catalog pin
   (direct dev dep of `apps/www`), so `pnpm update -r` can't move it. Keep the catalog comment's
   rule: pin to the version vitest resolves.
3. **`zod` 3.25.76 under `shadcn` 3.6.3** (`zod ^3.24.1`) keeps the zod alert open after the
   catalog bump; `shadcn` 4 is out of scope. Related: `shadcn` is in `dependencies` of the template
   and both apps although only its CSS is imported, so under the spec's residue rule ("ships to
   users" = template `dependencies`) its whole CLI tree counts as shipped. Decide: move `shadcn` to
   `devDependencies` (the CSS `@import` resolves at build; Vercel installs dev deps), or record
   the tree as accepted residue with that reasoning.
4. **`esbuild` 0.28** (low; Windows dev-server file read): take it with `tsup` 9, or record it as
   residue.
5. **Record the 3 no-fix rows** (`minimatch`, `basic-ftp`, `deepmerge`) as accepted residue, then
   dismiss the matching alerts in GitHub with a reason, so the alert count tracks only actionable work.
6. **Add `.github/dependabot.yml`** (config below). Different from the spec's Out of Scope "advisory
   check script or CI gate": this groups GitHub's own security PRs. `2026-08-30-wpa-dependency-pinning`
   deferred an update bot as a follow-up; this is that follow-up. Also add a `dependencies` label to
   `.github/labels.yml`, or `sync-labels --check` reports drift and `--prune` deletes it.
7. **Reconcile with `backlog.md` § Upgrade the Better Auth stack.** That entry records developer
   decision D4 (auth stack upgrade after launch); the spec's step 3 and this triage put it before
   launch (critical GHSA-965c-763c-88jm, plus the `<1.7.0` peer cap that blocks consumers).

### Proposed `.github/dependabot.yml`

Security updates only (`open-pull-requests-limit: 0` disables version-update PRs and makes the
rest apply to security PRs). Catalog versions keep moving by hand, through this spec. The
template manifest is left out on purpose: making `sync-template-versions.mjs` (or the spec's
catalog-equality check) the only thing that moves template pins avoids a second way to change
versions.

```yaml
version: 2
updates:
  - package-ecosystem: "npm" # pnpm detected from pnpm-lock.yaml
    directory: "/" # root lockfile + catalog cover packages/* and apps/*
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 0 # security updates only
    labels:
      - "dependencies"
    commit-message:
      prefix: "fix(deps)"
    groups:
      # Must move together: @convex-dev/better-auth pins the better-auth range,
      # a patch file targets its version, and catalogs.peers caps consumers.
      auth:
        applies-to: security-updates
        patterns:
          - "better-auth"
          - "@better-auth/*"
          - "better-call"
          - "@convex-dev/better-auth"
          - "@daveyplate/*"
      # Build-time only (apps/docs).
      docs-site:
        applies-to: security-updates
        patterns:
          - "astro"
          - "@astrojs/*"
          - "starlight-*"
          - "sharp"
          - "devalue"
          - "svgo"
          - "smol-toml"
          - "typedoc*"
          - "markdown-it"
      # Everything else non-breaking in one PR; majors fall through to individual PRs.
      security-patches:
        applies-to: security-updates
        patterns:
          - "*"
        update-types:
          - "minor"
          - "patch"
```

Constraints that come with it:
- Security PRs always target the default branch (`master`); `target-branch` applies only to
  version updates. CI runs on PRs to `master`; merged fixes then need a back-merge into `dev`
  (or `dev` becomes the default branch).
- A zod bump inside `@vexcms/core`/`@vexcms/react` reaches consumers only with a changeset — add one
  to the Dependabot PR.
- Dependabot's cooldown doesn't apply to security updates, but its pnpm install still honours
  `minimumReleaseAge: 4320`: a fix younger than 72h fails the PR until it ages in. Expected.
- Breaking upgrades show up as "security update not possible"; they are this spec's manual steps.

## Sources

- `pnpm outdated -r`, `pnpm audit --json` (2026-11-07)
- npm bulk advisory endpoint against catalog and template pins
- https://github.com/advisories/GHSA-965c-763c-88jm
- https://github.com/better-auth/better-auth/releases/tag/v1.6.34 (no security fix in 1.6 line)
- `npm view @convex-dev/better-auth@{0.11.5..0.13.0} peerDependencies`
- `npm pack @convex-dev/better-auth@0.13.0` → `dist/nextjs/index.js`
- Base UI releases 1.3.0–1.9.0 (https://base-ui.com/react/overview/releases)
- `gh api repos/ianyimi/vex/dependabot/alerts` (297 open, 2026-11-09)
- Throwaway worktree: `pnpm update -r --depth Infinity --lockfile-only`, alerts re-matched against
  the refreshed lockfile with `semver.satisfies` (98/126 cleared)
- https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference
  (`groups.applies-to`, `cooldown` excludes security updates, `target-branch` is version-updates only)
- https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/manage-your-dependency-security/customizing-dependabot-security-prs
  (`open-pull-requests-limit: 0` → config applies to security updates only)

## Open questions

- Does better-auth-ui 3.4.0 type-check and run cleanly against better-auth 1.7.x?
- Template ships neither patch (`patchedDependencies` absent), so scaffolded projects already
  lack the #422 `getToken` fix and the better-auth-ui a11y fix. Intended?
