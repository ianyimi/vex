---
status: draft
spec_id: 2026-11-07-pre-launch-dependency-upgrades
touches:
  - "pnpm-workspace.yaml"
  - "pnpm-lock.yaml"
  - "package.json"
  - "patches/*.patch"
  - ".changeset/*.md"
  - "apps/test/package.json"
  - "apps/test/eslint.config.mjs"
  - "apps/test/convex/http.ts"
  - "apps/test/src/auth/plugins.ts"
  - "apps/www/package.json"
  - "apps/www/eslint.config.mjs"
  - "apps/www/convex/http.ts"
  - "apps/www/convex/auth/plugins/index.ts"
  - "apps/docs/package.json"
  - "apps/docs/astro.config.mjs"
  - "apps/docs/src/content.config.ts"
  - "apps/docs/src/content/i18n/en.json"
  - "apps/docs/src/content/docs/guides/auth.mdx"
  - "packages/better-auth/package.json"
  - "packages/better-auth/README.md"
  - "packages/better-auth/src/pluginSchemas.ts"
  - "packages/better-auth/src/pluginSchemas.test.ts"
  - "packages/better-auth/src/pluginSchemas.generated.ts"
  - "packages/next/eslint.config.mjs"
  - "packages/create-vexcms/templates/base-nextjs/package.json"
  - "packages/create-vexcms/templates/base-nextjs/eslint.config.mjs"
  - "packages/create-vexcms/templates/base-nextjs/convex/http.ts"
  - "packages/create-vexcms/templates/base-nextjs/convex/auth/plugins/index.ts"
  - ".agent/docs/product/tech-stack.md"
  - ".agent/manifest.json"
  - ".agent/dependencies/registry.md"
  - ".agent/docs/research/pre-launch-dependency-review.md"
  - ".agent/docs/tasks.md"
prompt_version: 1
---

# 2026-11-07-pre-launch-dependency-upgrades — Spec

## Overview

Before v0.1.0 locks, every pinned dependency moves to a current, advisory-free version so
`create-vexcms` projects start clean. Two findings make this a launch blocker: the scaffold
template still pins `next` 16.3.3 (critical RCE advisories; the catalog had already moved to
16.4.3), and better-auth 1.6.x carries a critical account-takeover advisory fixed only in the 1.7
line. The rest is same-major freshness, the Next 16 ESLint config, the docs site's Astro 7 move,
and a transitive lockfile refresh. Findings: `.agent/docs/research/pre-launch-dependency-review.md`.
Implementation starts after the current working tree is committed.

## Design Decisions

1. **Security pins land first, alone (step 1).** No code change, so the advisory gate is proven on
   the smallest possible diff before anything riskier moves.
2. **Every target is ≥72h old when installed.** `minimumReleaseAge: 4320` is the supply-chain
   control for transitives; it is never relaxed. Versions published inside the window at
   2026-11-08 12:00Z were skipped in favour of the newest eligible one (`@tanstack/react-query`
   5.106.1, `astro` 7.4.5, `@astrojs/starlight` 0.42.9, `@playwright/test` stays 1.64.1). The
   better-auth 1.7.18 train clears the window at 2026-11-08T15:00:30Z; before that instant step 3
   uses the 1.7.17 train, which `@convex-dev/better-auth` 0.13.0 admits identically.
3. **Template pins are mirrored by hand in every step.** `scripts/sync-template-versions.mjs`
   syncs only `@vexcms/*`, which is how the template's `next` drifted; step 1 adds an explicit
   catalog-equality check and step 6 proves the template with a real scaffold run (AP-020).
4. **React stays on 19.2.x (19.2.9).** 19.3 is a new minor line with its own typings; nothing in
   the launch needs it.
5. **`convex` 1.49.0 raises root `engines.node` to `>=22.0.0`.** `npm view convex@1.49.0 engines`
   is `node >=22.0.0` (1.48 was `>=20`). Node 20 reached end of life on 2026-04-30 and CI already
   runs Node 22, so the floor states what the pinned toolchain needs.
6. **better-auth 1.7.18 + `@convex-dev/better-auth` 0.13.0.** GHSA-965c-763c-88jm (critical),
   GHSA-r4xp-prcw-77qf and GHSA-q84f-53jg-9ppm (high) are fixed only in ≥1.7.7; 1.6.34 is not
   patched. 0.13.0 is the only `@convex-dev/better-auth` release whose peer admits 1.7.
7. **`catalogs.peers.better-auth` becomes `">=1.7.16 <1.8.0"`.** Floor and ceiling are 0.13.0's
   own peer walls (P-012); the old `<1.7.0` ceiling existed only for 0.11.5.
8. **One `oauthProvider` descriptor replaces `mcp` and `oidcProvider`.** Better Auth 1.7 removed
   both from `better-auth/plugins`; `@better-auth/mcp` composes `oauthProvider` and declares no
   tables of its own, so a second key would always resolve to the same schema.
9. **Only the `getToken` half of the #422 patch is re-created.** 0.13.0's route handler already
   drops `x-forwarded-host` (`dist/nextjs/index.js:36-41`); `cachedGetToken` still forwards it.
10. **`allowedVersions["@convex-dev/better-auth>better-auth"]` is deleted; the passkey override
    moves to the better-auth version.** 0.13.0's range admits 1.7.x directly; better-auth-ui's
    `@better-auth/passkey >=1.4.6` peer still floats to the newest release without the override.
11. **ESLint: `eslint-config-next/core-web-vitals` imported natively, `FlatCompat` removed.**
    `@next/eslint-plugin-next` and `@eslint/eslintrc` leave the catalog because nothing imports
    them afterwards (P-015). `packages/next/eslint.config.mjs` uses the same shim and moves too.
12. **The app configs drop their own `jsx-a11y` `plugins` registration.** eslint-config-next 16
    registers `jsx-a11y` through `_interop_require_wildcard`, a different object from the apps'
    ESM import, so ESLint 9 throws `Cannot redefine plugin "jsx-a11y"`. The rule overrides stay.
13. **Docs: Astro 7.4.5 + Starlight 0.42.9.** Starlight 0.39 removed the `{ label, autogenerate }`
    sidebar shorthand (hard build failure), and Starlight 0.42 queries an `i18n` collection; both
    are fixed in config. The pre-existing `Entry docs → 404 was not found` notice is accepted:
    the documented `404.md` fix trades it for a `PrerenderRouteConflict` warning and adds
    unrequested content scope.
14. **Transitives refresh via `pnpm update -r`, not lockfile deletion.** Same effect on transitive
    ranges, and any manifest rewrite is visible and revertible.
15. **Template patches stay out of scope and become an inbox task.** A pnpm `patchedDependencies`
    entry in the template would fix only pnpm users; npm/yarn/bun would silently differ.
16. **Changesets are `patch` (P-025)** and name only publishable packages whose packed output
    moved; private apps (`test`, `www`, `docs`) get none.

## Out of Scope

- Major upgrades: `@tanstack/react-table` 9, `lucide-react` 1, `typescript` 7, `eslint` 10,
  `@convex-dev/eslint-plugin` 5, `shadcn` 4, `jsdom` 30, `react-day-picker` 10,
  `react-dropzone` 20, `react-resizable-panels` 4, `@changesets/cli` 3, and the `create-vexcms`
  CLI majors (`chalk` 6, `commander` 15, `ora` 10, `execa` 10, `@inquirer/prompts` 8,
  `sort-package-json` 4, `validate-npm-package-name` 8, `chokidar` 6, `nanoid` 6).
- React 19.3 and `@types/react` 19.3.
- `convex-test` and `@convex-dev/rate-limiter` — owned by `2026-11-06-launch-infrastructure`.
- Shipping `patches/` or `pnpm.patchedDependencies` in the scaffold templates (inbox task).
- Replacing `@daveyplate/better-auth-ui` (3.4.0 is still latest; no successor package).
- `pnpm.overrides` for transitive advisories — residue is recorded, and residue that ships to
  users is escalated rather than overridden.
- A permanent advisory-check script or CI gate — the step-1 advisory query is a Verify command.
- Rule-level tuning of the Next 16 ESLint rule set beyond fixing what it reports.
- A custom docs 404 page or multilingual docs.

## Implementation

### Step 1 — Security pins without API changes [agent]

Moves the three advisory-carrying pins that need no code change, and closes the template's
`next` drift. Every later step reuses the advisory query defined here.

- [ ] `pnpm-workspace.yaml`: `next`, `zod`, `vitest`, `@vitest/coverage-v8`
- [ ] `packages/create-vexcms/templates/base-nextjs/package.json`: `next`, `zod`
- [ ] `.changeset/security-pins-next-zod.md`: new
- [ ] `pnpm install`, then `pnpm build`, `pnpm typecheck`, `pnpm test`, `pnpm lint`
- [ ] Advisory query (below)

#### pnpm-workspace.yaml

4 value edits in `catalog:`; everything not shown is unchanged. `catalogs.peers` is untouched:
`zod: ">=4.0.0 <5"` and `vitest: ">=4.0.0 <5"` describe the API surface consumers need
(P-012), and the consumer's own `zod`/`vitest` resolution is theirs to patch.

**1 — `catalog:` entries `"@vitest/coverage-v8"`, `next`, `vitest`, `zod`.**

```yaml
  "@vitest/coverage-v8": 4.1.12
```

```yaml
  next: 16.4.5
```

```yaml
  vitest: 4.1.12
```

```yaml
  zod: 4.6.7
```

#### packages/create-vexcms/templates/base-nextjs/package.json

2 value edits in `dependencies`; everything not shown is unchanged.

**1 — `dependencies.next`, `dependencies.zod`.**

```json
    "next": "16.4.5",
```

```json
    "zod": "4.6.7"
```

#### .changeset/security-pins-next-zod.md

New file. `@vexcms/core` and `@vexcms/react` publish `zod` as an exact `dependencies` entry;
`create-vexcms` ships the template pins.

```md
---
"@vexcms/core": patch
"@vexcms/react": patch
"create-vexcms": patch
---

Security: `zod` 4.4.3 → 4.6.7 (GHSA-mrhx-c7xc-m3w5, memory exhaustion validating oversized
constrained collections, fixed in 4.6.6). New projects scaffold with `next` 16.4.5 instead of
16.3.3, which carried critical remote-code-execution advisories in the image optimizer,
`use cache` functions and `next/og`.
```

#### Advisory query

Run from the repo root. Posts every non-`@vexcms` catalog and template pin to npm's bulk
advisory endpoint and prints the names that still carry an advisory. `yaml` is a root
devDependency, so no install is needed. Later steps say "run the advisory query" and mean
this command.

```sh
node --input-type=module -e '
import { readFileSync } from "node:fs";
import { parse } from "yaml";
const catalog = parse(readFileSync("pnpm-workspace.yaml", "utf8")).catalog;
const template = JSON.parse(readFileSync("packages/create-vexcms/templates/base-nextjs/package.json", "utf8"));
const query = {};
for (const [name, version] of [...Object.entries(catalog), ...Object.entries({ ...template.dependencies, ...template.devDependencies })]) {
  if (name.startsWith("@vexcms/")) continue;
  (query[name] ??= new Set()).add(String(version).replace(/^[\^~]/, ""));
}
const body = Object.fromEntries(Object.entries(query).map(([name, versions]) => [name, [...versions]]));
const response = await fetch("https://registry.npmjs.org/-/npm/v1/security/advisories/bulk", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const advisories = await response.json();
const flagged = Object.keys(advisories).sort();
console.log(flagged.length ? flagged.join(" ") : "no advisories");
'
```

Measured before this step (2026-11-07): `astro better-auth next sharp vitest zod`.

Verify:
- [ ] Advisory query prints exactly `astro better-auth sharp` (the remaining three belong to
      steps 3 and 5). Negative check: temporarily set the template's `next` back to `16.3.3`,
      re-run, and confirm `next` reappears; restore.
- [ ] `node -e 'const t=require("./packages/create-vexcms/templates/base-nextjs/package.json");const y=require("yaml").parse(require("fs").readFileSync("pnpm-workspace.yaml","utf8"));process.exit(t.dependencies.next===y.catalog.next?0:1)'` exits 0
- [ ] `pnpm install` exits 0 with no peer errors; `pnpm build`, `pnpm typecheck`, `pnpm test`,
      `pnpm lint` green
- [ ] `pnpm changeset status` lists `@vexcms/core`, `@vexcms/react`, `create-vexcms`

### Step 2 — Same-major freshness refresh [agent]

New `create-vexcms` projects start on current minors/patches instead of versions that
drifted months behind their own major while step 1's security pins were chosen.

- [ ] `pnpm-workspace.yaml` — 29 catalog values bumped (same major/minor family, all
      verified ≥72h old against `npm view <pkg> time --json` at 2026-11-08 12:00Z)
- [ ] `package.json` (root) — `engines.node` floor raised
- [ ] `packages/create-vexcms/templates/base-nextjs/package.json` — mirror the 14 template
      pins that moved
- [ ] `.changeset/same-major-refresh.md` — new file, `@vexcms/react` + `create-vexcms` patch
- [ ] `pnpm install && pnpm build && pnpm typecheck && pnpm test && pnpm lint`

#### pnpm-workspace.yaml

31 edits inside the `catalog:` block; everything else (key order, the `catalogs.peers`
block, `minimumReleaseAge`, `onlyBuiltDependencies`, `strictPeerDependencies`) is
unchanged — every bumped version stays inside its existing `catalogs.peers` floor/ceiling
(`convex >=1.44.0 <2`, `nuqs >=2.8.0 <3`, `react >=18.0.0`, `@tanstack/react-form >=1.33.0
<2`, `@tanstack/react-query >=5.0.0 <6`, `@testing-library/react >=16.0.0 <17`,
`@testing-library/user-event >=14.0.0 <15`), so P-012's "floors only rise when a consumed
API needs it" leaves none of them touched.

| Key | Old → New | Why not newer |
| --- | --- | --- |
| `@base-ui/react` | `1.2.0` → `1.9.0` | latest 1.x; no 🚨 breaking change in 1.3–1.9 release notes touches `Accordion`, `AlertDialog`, `Button`, `Checkbox`, `Dialog`, `Menu`, `Input`, `Popover`, `Radio`/`RadioGroup`, `ScrollArea`, `Select`, `Separator`, `Tabs`, or `Tooltip` — the only 🚨 entries are `Drawer` (preview→stable rename) and `OTP Field`, neither imported anywhere under `packages/react/src/ui`, `apps/*/src/components/ui`, or the template's `src/components/ui`. 1.9.0's "Remove presentational viewport role" on Scroll Area is the change `packages/react/src/ui/scroll-area.tsx` already overrides. |
| `@codemirror/view` | `6.43.14` → `6.43.15` | latest patch; siblings (`@codemirror/commands` `6.11.1`, `lang-json` `6.0.2`, `language` `6.13.1`, `lint` `6.9.7`, `state` `6.7.6`) have no newer release, left untouched |
| `@tailwindcss/postcss` | `4.3.2` → `4.3.4` | latest eligible (`4.3.5` published 2026-11-06, <72h old) |
| `@tanstack/react-form` | `1.33.1` → `1.33.5` | latest 1.x (`2.0.0-alpha.*` is a prerelease major, excluded) |
| `@tanstack/react-query` | `5.101.2` → `5.106.1` | latest eligible (`5.107.0`/`5.107.1` published 2026-11-06, <72h old) |
| `@testing-library/react` | `16.3.2` → `16.3.3` | latest 16.x |
| `@testing-library/user-event` | `14.6.7` → `14.6.8` | latest 14.x |
| `@types/react` | `19.2.17` → `19.2.18` | latest 19.2.x typings (`19.3.0` ships only alongside React 19.3, excluded) |
| `@types/react-dom` | `19.2.3` → `19.2.7` | latest 19.2.x typings, same reasoning |
| `@typescript-eslint/eslint-plugin` | `8.63.0` → `8.72.1` | latest stable (`8.72.2-alpha.*` prereleases excluded) |
| `@typescript-eslint/parser` | `8.63.0` → `8.72.1` | same |
| `@uiw/react-color-sketch` | `2.9.6` → `2.10.3` | latest 2.x; changelog between 2.9.6 and 2.10.x is color-format/a11y fixes only, no prop removal |
| `convex` | `1.44.0` → `1.49.0` | latest 1.x; see codegen/Node floor note below |
| `convex-helpers` | `0.1.120` → `0.1.134` | latest eligible (published 2026-11-05 07:29Z, before the 2026-11-05 12:00Z cutoff) |
| `eslint-plugin-perfectionist` | `5.10.0` → `5.13.0` | latest 5.x |
| `fs-extra` | `11.3.6` → `11.4.1` | latest 11.x |
| `geist` | `1.7.2` → `1.9.1` | latest eligible (`1.9.2` published 2026-11-06, <72h old) |
| `nuqs` | `2.9.0` → `2.10.2` | latest 2.x |
| `prettier` | `3.9.5` → `3.9.10` | latest 3.x |
| `react` | `19.2.7` → `19.2.9` | latest 19.2.x — `19.3.1` is the current `latest` dist-tag but is the excluded next major line |
| `react-dom` | `19.2.7` → `19.2.9` | same |
| `shiki` | `4.4.3` → `4.6.0` | latest 4.x |
| `tailwind-merge` | `3.5.0` → `3.7.0` | latest 3.x |
| `tailwindcss` | `4.3.2` → `4.3.4` | latest eligible, matches `@tailwindcss/postcss` |
| `turbo` | `2.10.4` → `2.11.10` | latest eligible (`2.11.11-canary.*` prereleases excluded) |
| `typescript-eslint` | `8.63.0` → `8.72.1` | matches the plugin/parser bump |
| `use-mask-input` | `3.14.2` → `3.14.3` | latest 3.x patch |
| `yaml` | `2.9.0` → `2.9.1` | latest 2.x (`3.0.0-*` prereleases excluded) |

Unlisted catalog entries from the task's candidate set (`@axe-core/playwright`,
`@hello-pangea/dnd`, `@platejs/*`, `@playwright/test`, `@t3-oss/env-nextjs`,
`class-variance-authority`, `clsx`, `cmdk`, `date-fns`, `jiti`, `platejs`, `sonner`,
`tw-animate-css`) already pin the latest eligible release and are left untouched —
`@playwright/test`'s `1.65.0` published 2026-11-05T18:30Z, 30 minutes past the
2026-11-05T12:00Z cutoff, so `1.64.1` stays.

**Convex 1.49 does not change committed codegen output.** `apps/test/convex/_generated/`,
`apps/www/convex/_generated/`, and both templates' `convex/_generated/` are committed
(not gitignored). Diffing the `codegen_templates` sources packed in `convex@1.44.0` vs
`convex@1.49.0`: the only change is `validator_helpers.ts` gaining a branch for
`validator.type === "function"` (the new `v.function()` validator from 1.49's changelog,
emitting `FunctionHandle_future<...>`). A repo-wide grep for `v.function(` under
`apps/test/convex`, `apps/www/convex`, and both templates returns nothing, so
`npx convex codegen` (no deployment connection required — it reads local function files
only) regenerates byte-identical `_generated/*` output; no regenerate command needs to
run as part of this step.

**`engines.node` needs to rise with this bump.** Convex 1.49's changelog: "This version
drops support for Node.js 20. Please update to Node.js 22 or newer" — the CLI used by
`vex:generate`/`vex:dev` and every `convex dev`/`convex deploy` call. CI already runs
Node 22 (`.github/workflows/*.yml`), but root `package.json#engines.node` still reads
`>=20.0.0`, silently promising a floor the pinned `convex` no longer honors.

```yaml
catalog:
  "@base-ui/react": 1.9.0
  "@codemirror/view": 6.43.15
  "@tailwindcss/postcss": 4.3.4
  "@tanstack/react-form": 1.33.5
  "@tanstack/react-query": 5.106.1
  "@testing-library/react": 16.3.3
  "@testing-library/user-event": 14.6.8
  "@types/react": 19.2.18
  "@types/react-dom": 19.2.7
  "@typescript-eslint/eslint-plugin": 8.72.1
  "@typescript-eslint/parser": 8.72.1
  "@uiw/react-color-sketch": 2.10.3
  convex: 1.49.0
  convex-helpers: 0.1.134
  eslint-plugin-perfectionist: 5.13.0
  fs-extra: 11.4.1
  geist: 1.9.1
  nuqs: 2.10.2
  prettier: 3.9.10
  react: 19.2.9
  react-dom: 19.2.9
  shiki: 4.6.0
  tailwind-merge: 3.7.0
  tailwindcss: 4.3.4
  turbo: 2.11.10
  typescript-eslint: 8.72.1
  use-mask-input: 3.14.3
  yaml: 2.9.1
```

#### package.json

1 edit; everything not shown is unchanged.

**1 — `engines.node` floor.** Replace the `"node": ">=20.0.0"` line inside `engines`:

```json
  "engines": {
    "node": ">=22.0.0"
  },
```

#### packages/create-vexcms/templates/base-nextjs/package.json

14 edits across `dependencies` and `devDependencies`; everything not shown (scripts,
`@vexcms/*` pins synced separately by `scripts/sync-template-versions.mjs`, `next`/`zod`
from step 1, `better-auth`/`@convex-dev/better-auth`/`@daveyplate/better-auth-ui`/
`@better-auth/api-key` from step 3, `eslint-config-next`/`@next/eslint-plugin-next` from
step 4) is unchanged.

**1 — `dependencies["@base-ui/react"]`.**

```json
    "@base-ui/react": "1.9.0",
```

**2 — `dependencies["@tanstack/react-form"]`.**

```json
    "@tanstack/react-form": "1.33.5",
```

**3 — `dependencies["@tanstack/react-query"]`.**

```json
    "@tanstack/react-query": "5.106.1",
```

**4 — `dependencies.convex`.**

```json
    "convex": "1.49.0",
```

**5 — `dependencies["convex-helpers"]`.**

```json
    "convex-helpers": "0.1.134",
```

**6 — `dependencies.nuqs`.**

```json
    "nuqs": "2.10.2",
```

**7 — `dependencies.react`.**

```json
    "react": "19.2.9",
```

**8 — `dependencies["react-dom"]`.**

```json
    "react-dom": "19.2.9",
```

**9 — `dependencies["tailwind-merge"]`.**

```json
    "tailwind-merge": "3.7.0",
```

**10 — `devDependencies["@tailwindcss/postcss"]`.**

```json
    "@tailwindcss/postcss": "4.3.4",
```

**11 — `devDependencies["@types/react"]`.**

```json
    "@types/react": "19.2.18",
```

**12 — `devDependencies["@types/react-dom"]`.**

```json
    "@types/react-dom": "19.2.7",
```

**13 — `devDependencies["eslint-plugin-perfectionist"]`.**

```json
    "eslint-plugin-perfectionist": "5.13.0",
```

**14 — `devDependencies.prettier`, `devDependencies.tailwindcss`,
`devDependencies["typescript-eslint"]`.**

```json
    "prettier": "3.9.10",
    "tailwindcss": "4.3.4",
    "typescript-eslint": "8.72.1"
```

#### .changeset/same-major-refresh.md

New file. `@vexcms/react`'s packed `dependencies` move (`@base-ui/react`, `@codemirror/view`,
`@tanstack/react-form`, `@uiw/react-color-sketch`, `tailwind-merge`, `use-mask-input` all read
`"catalog:"` there); `create-vexcms`'s packed `dependencies` move (`fs-extra`, `yaml`) and its
template pins move.

```markdown
---
"@vexcms/react": patch
"create-vexcms": patch
---

Same-major dependency refresh. `@vexcms/react`: `@base-ui/react` 1.2.0 → 1.9.0,
`@codemirror/view` 6.43.14 → 6.43.15, `@tanstack/react-form` 1.33.1 → 1.33.5,
`@uiw/react-color-sketch` 2.9.6 → 2.10.3, `tailwind-merge` 3.5.0 → 3.7.0, `use-mask-input`
3.14.2 → 3.14.3; no import or prop changes. `create-vexcms`: `fs-extra` 11.3.6 → 11.4.1, `yaml`
2.9.0 → 2.9.1, and new projects scaffold with `convex` 1.49.0, React 19.2.9, Base UI 1.9.0,
TanStack Query 5.106.1 and Form 1.33.5, `convex-helpers` 0.1.134 and `nuqs` 2.10.2. `convex`
1.49 requires Node.js 22 or newer.
```

Verify:

- [ ] `pnpm outdated -r` lists only packages from this step's Out of Scope table plus
      majors (`@tanstack/react-table`, `lucide-react`, `typescript`, `eslint`,
      `@convex-dev/eslint-plugin`, `shadcn`, `jsdom`, `convex-test`, `react-day-picker`,
      `react-dropzone`, `react-resizable-panels`, `chalk`, `commander`, `ora`,
      `execa`, `@inquirer/prompts`, `@changesets/cli`), React 19.3
      (`react`/`react-dom`/`@types/react`/`@types/react-dom` holding at 19.2.x), the
      `convex-test`/`@convex-dev/rate-limiter` launch-infrastructure packages, the full
      auth stack (`better-auth`, `@better-auth/api-key`, `@convex-dev/better-auth`,
      `@daveyplate/better-auth-ui`) until step 3, `eslint-config-next`/
      `@next/eslint-plugin-next` until step 4, and the docs-site-only packages (`astro`,
      `@astrojs/*`, `starlight-*`, `sharp`, `typedoc`) until step 5
- [ ] `grep -rn "v\.function(" apps/*/convex packages/create-vexcms/templates/*/convex`
      — expect no output, confirming the convex 1.49 codegen branch is inert; run
      `npx convex codegen` under `apps/test` afterward and `git diff --stat
      apps/test/convex/_generated` — expect no output (byte-identical regenerate)
- [ ] `pnpm install && pnpm build && pnpm typecheck && pnpm test && pnpm lint` all green
- [ ] `node scripts/check-packed-manifests.mjs --packed` exits 0 (packed `@vexcms/react` and
      `create-vexcms` manifests carry the new exact versions, no `catalog:` leak)

### Step 3 — Auth stack: better-auth 1.7.18 + @convex-dev/better-auth 0.13.0 [agent]

Moves off better-auth 1.6.23 (critical GHSA-965c-763c-88jm, high GHSA-r4xp-prcw-77qf /
GHSA-q84f-53jg-9ppm, none backported to 1.6) to 1.7.18, forcing `@convex-dev/better-auth`
0.11.5 → 0.13.0 (the only line whose peer admits better-auth 1.7), swaps the removed
`mcp`/`oidcProvider` plugin descriptors for one `oauthProvider` descriptor, and re-creates the
root `getToken` patch against 0.13.0.

- [ ] `pnpm-workspace.yaml` — catalog + `catalogs.peers` bumps
- [ ] `package.json` (root) — `pnpm.overrides`, `pnpm.peerDependencyRules.allowedVersions`
- [ ] `packages/better-auth/package.json` — new `@better-auth/oauth-provider` devDependency
- [ ] `packages/better-auth/src/pluginSchemas.ts` — `mcp`/`oidcProvider` → `oauthProvider`
- [ ] `packages/better-auth/src/pluginSchemas.test.ts` — probes + imports
- [ ] `pnpm --filter @vexcms/better-auth gen:auth-schemas` — regenerates `pluginSchemas.generated.ts`
- [ ] `packages/better-auth/README.md` — modelled-plugins list, peer line
- [ ] `apps/docs/src/content/docs/guides/auth.mdx` — modelled-plugins list
- [ ] `.agent/docs/product/tech-stack.md` — Better Auth peer range (both rows)
- [ ] `pnpm patch @convex-dev/better-auth@0.13.0` + `pnpm patch-commit <tmp-dir>` — new
      `patches/@convex-dev__better-auth@0.13.0.patch`, old `@...@0.11.5.patch` deleted
- [ ] `packages/create-vexcms/templates/base-nextjs/package.json` — mirror every bump by hand
- [ ] `apps/test/convex/http.ts`, `apps/www/convex/http.ts`,
      `packages/create-vexcms/templates/base-nextjs/convex/http.ts` — drop the dead
      oidc-provider `console.warn` filter
- [ ] `apps/test/src/auth/plugins.ts`, `apps/www/convex/auth/plugins/index.ts`,
      `packages/create-vexcms/templates/base-nextjs/convex/auth/plugins/index.ts` — correct the
      stale "convex() calls the deprecated oidc-provider plugin" JSDoc
- [ ] `.changeset/better-auth-1-7-upgrade.md` — new file
- [ ] `pnpm install && pnpm build && pnpm typecheck && pnpm test && pnpm lint`

**Publish-age caveat, measure before running `pnpm install`.** The whole better-auth 1.7.18
release train (`better-auth`, `@better-auth/api-key`, `@better-auth/oauth-provider`,
`@better-auth/passkey`) published within one three-minute window on 2026-11-05
(14:57:42Z–15:00:30Z); `minimumReleaseAge: 4320` (72h) makes every one of those four resolvable
only from **2026-11-08T15:00:30Z** onward (the latest of the four). If this step runs before
that instant, `pnpm install` fails closed on all four with `ERR_PNPM_MINIMUM_RELEASE_AGE_NOT_SATISFIED`
— that is correct behavior, not a bug, and the fix is **not** to touch `minimumReleaseAge`.
Fall back to the 1.7.17 train instead (`better-auth` 1.7.17, `@better-auth/api-key` 1.7.17,
`@better-auth/oauth-provider` 1.7.17, `@better-auth/passkey` 1.7.17 — all published
2026-11-04T15:53–15:56Z, so safely 72h old from 2026-11-07T15:56Z on), which
`@convex-dev/better-auth@0.13.0`'s peer (`>=1.7.16 <1.8.0`) admits identically. Confirm first:

```bash
npm view better-auth time --json | grep '"1.7.18"'
# if (now - published) < 72h, use 1.7.17 everywhere below instead of 1.7.18 —
# identical behavior; 0.13.0's peer admits both.
```

#### pnpm-workspace.yaml

3 edits; everything not shown is unchanged.

**1 — `@better-auth/api-key`, plus a new `@better-auth/oauth-provider` entry.** Between
`"@base-ui/react"` and `"@changesets/cli"`:

```yaml
  "@better-auth/api-key": 1.7.18
  "@better-auth/oauth-provider": 1.7.18
  "@changesets/cli": 2.30.0
```

**2 — `@convex-dev/better-auth`.** Beside `"@convex-dev/eslint-plugin"`:

```yaml
  "@convex-dev/better-auth": 0.13.0
```

**3 — `better-auth` (default catalog) and `catalogs.peers.better-auth`.** The default-catalog
entry:

```yaml
  better-auth: 1.7.18
```

And the peer range — the floor moves to `@convex-dev/better-auth@0.13.0`'s own peer floor
(1.7.16, the earliest 1.7 release its adapter contract was verified against) and the ceiling
to its `<1.8.0`, replacing the stale `<1.7.0` ceiling that existed only because 0.11.5's peer
rejected 1.7 outright:

```yaml
    better-auth: ">=1.7.16 <1.8.0"
```

#### package.json

2 edits inside the existing `pnpm` block; everything else (`patchedDependencies` key names
update per the patch step below) is unchanged.

**1 — bump the passkey override.** `@daveyplate/better-auth-ui@3.4.0`'s undeclared-optional
peer `"@better-auth/passkey": ">=1.4.6"` still floats to whatever is latest on npm without
this override; pinning it to the catalog's better-auth version keeps the two in lockstep, same
as today:

```json
    "overrides": {
      "@better-auth/passkey": "1.7.18"
    },
```

**2 — delete the now-unneeded `@convex-dev/better-auth>better-auth` exception.** Verified via
`npm view @convex-dev/better-auth@0.13.0 peerDependencies`: the range is
`>=1.7.16 <1.8.0`, which 1.7.18 satisfies directly — the exception existed only because
0.11.5's `>=1.5.0 <1.6.0` was stale. `better-call` and `typescript` are unaffected: `npm view`
confirms `@better-auth/api-key@1.7.18`, `@better-auth/oauth-provider@1.7.18`, and
`@better-auth/passkey@1.7.18` still peer on `better-call: "1.4.5"` exactly, while
`@daveyplate/better-auth-ui@3.4.0` still depends on `better-call@2.0.2` directly — the same
major-version split the exception has always suppressed. `proxy-agent` is unrelated (comes from
`@lhci/cli` → `lighthouse`, confirmed in `pnpm-lock.yaml`) and untouched by this step.

```json
    "peerDependencyRules": {
      "allowedVersions": {
        "better-call": "2",
        "proxy-agent": "6",
        "typescript": "6"
      }
    }
```

#### packages/better-auth/package.json

1 edit; everything not shown is unchanged.

**1 — add `@better-auth/oauth-provider` as a devDependency**, alongside the existing peer
`better-auth`'s own devDependency pin (P-014): the new descriptor in `pluginSchemas.ts` derives
its probe from this package directly, so it needs its own catalog-pinned copy, not a floated
transitive of `better-auth`. Between `"@better-auth/api-key"` and `"@convex-dev/better-auth"`:

```json
    "@better-auth/oauth-provider": "catalog:",
```

#### packages/better-auth/src/pluginSchemas.ts

1 edit; everything not shown is unchanged.

**1 — replace the `mcp`/`oidcProvider` descriptors in `ModelledPluginDescriptors` with one
`oauthProvider` descriptor.** Better Auth 1.7 removed both `mcp` and `oidcProvider` from
`better-auth/plugins` (confirmed: neither symbol exists in the installed 1.7.18 tarball's
`better-auth/plugins` export map); `@better-auth/mcp@1.7.18` depends directly on
`@better-auth/oauth-provider@^1.7.18` and declares no `modelName` of its own, so its entire DB
footprint is `oauthProvider`'s. Replace the two properties currently between `jwt` and
`organization`:

```ts
  /**
   * The `oauthClient`, `oauthResource`, `oauthClientResource`,
   * `oauthClientAssertion`, `oauthAccessToken`, and `oauthConsent` tables
   * Better Auth's OAuth provider registers. Enable this for
   * `@better-auth/mcp`, which composes `oauthProvider` internally and
   * declares no tables of its own.
   */
  oauthProvider?: true | { schema?: PluginSchemaOverride };
```

No other type in this file changes: `BetterAuthPluginName` is still derived structurally from
`keyof typeof BetterAuthPlugins` (the `better-auth/plugins` namespace), so once `better-auth`
is upgraded, `mcp`/`oidcProvider` simply stop appearing in that union on their own —
`oauthProvider` never appeared in it to begin with (it ships from a different package), so
adding it to `ModelledPluginDescriptors` does not need a matching change to
`UnmodelledPluginName` or the `assertEveryPluginClassified` exhaustiveness check.

#### packages/better-auth/src/pluginSchemas.test.ts

3 edits; everything not shown is unchanged.

**1 — imports.** Replace the import block at the top of the file (from `apiKey` through the
`better-auth/plugins` import):

```ts
import { apiKey } from "@better-auth/api-key";
import { oauthProvider } from "@better-auth/oauth-provider";
import { convex } from "@convex-dev/better-auth/plugins";
import { describe, expect, it } from "vitest";
import {
  admin,
  anonymous,
  deviceAuthorization,
  jwt,
  organization,
  phoneNumber,
  siwe,
  twoFactor,
} from "better-auth/plugins";
```

**2 — `PLUGIN_PROBES`, and its JSDoc's inert-placeholder note.** `oauthProvider`'s `loginPage`
and `consentPage` are both required, non-schema-affecting strings (verified in
`@better-auth/oauth-provider@1.7.18`'s type declarations — neither is optional):

```ts
 * `siwe`/`oauthProvider` take required options that do not affect their
 * schema; the values here are inert placeholders.
 */
const PLUGIN_PROBES: Record<string, () => { schema?: PluginDBSchema | undefined }> = {
  admin: () => admin(),
  anonymous: () => anonymous(),
  apiKey: () => apiKey(),
  convex: () => convex({ authConfig: PROBE_AUTH_CONFIG }),
  deviceAuthorization: () => deviceAuthorization(),
  jwt: () => jwt(),
  oauthProvider: () => oauthProvider({ loginPage: "/sign-in", consentPage: "/consent" }),
  organization: () => organization(),
  "organization.teams": () => organization({ teams: { enabled: true } }),
  phoneNumber: () => phoneNumber(),
  siwe: () =>
    siwe({
      domain: "probe.example.com",
      getNonce: async () => "probe-nonce",
      verifyMessage: async () => true,
    }),
  twoFactor: () => twoFactor(),
};
```

Nothing else in this file changes: `describe("betterAuthCollections parity with betterAuthAdapter", …)` iterates `Object.keys(PLUGIN_PROBES)` generically and the multi-plugin-setup test
(`admin`/`anonymous`/`organization`/`apiKey`/`convex`) never named `mcp`/`oidcProvider`.

#### packages/better-auth/src/pluginSchemas.generated.ts

Entirely regenerated — never hand-edit (its own banner says so). Run:

```bash
pnpm --filter @vexcms/better-auth gen:auth-schemas
```

This harvests `oauthProvider({ loginPage: "/sign-in", consentPage: "/consent" }).schema` from
the real `@better-auth/oauth-provider` factory and writes it under the `"oauthProvider"` key,
replacing the removed `"mcp"` (6136 bytes, 3 tables) and `"oidcProvider"` (6064 bytes, 3
tables) entries. Expect the regenerated `oauthProvider` entry to declare 6 tables
(`oauthClient`, `oauthResource`, `oauthClientResource`, `oauthClientAssertion`,
`oauthAccessToken`, `oauthConsent` — confirmed by grepping `modelName:` out of the installed
`@better-auth/oauth-provider@1.7.18` dist) versus the 3 each `mcp`/`oidcProvider` declared
(`oauthApplication`, `oauthAccessToken`, `oauthConsent`). If the regen run throws instead of
writing a schema for the `oauthProvider` key — e.g. because the factory requires a co-registered
`jwt()` plugin to compute its tables, unlike the standalone `mcp`/`oidcProvider` probes it
replaces — stop and report per P-023 rather than hand-authoring the snapshot or dropping the
probe's required options; every other plugin here already probes standalone, so this would be
the first exception.

#### packages/better-auth/README.md

2 edits; everything not shown is unchanged.

**1 — modelled-plugins list.** The line between `apiKey`/`convex`/`deviceAuthorization`/`jwt`
and `organization`:

```md
`apiKey`, `convex`, `deviceAuthorization`, `jwt`, `oauthProvider`, `organization`
```

**2 — peer dependencies list.** The `better-auth` line:

```md
- `better-auth` — Better Auth (>=1.7.16 <1.8.0)
```

#### apps/docs/src/content/docs/guides/auth.mdx

1 edit; everything not shown is unchanged.

**1 — modelled-plugins list**, the "Modelled plugins and `extraSchema`" section's second line:

```mdx
`convex`, `deviceAuthorization`, `jwt`, `oauthProvider`, `organization` (`teams` is the
```

#### .agent/docs/product/tech-stack.md

2 edits; everything not shown is unchanged. Both rows already understated the peer
(`^1.5.0`, stale since the 2026-08-30 wpa-dependency-pinning spec moved the real catalog peer
to `>=1.6.23 <1.7.0`) — corrected to the real value while this row is touched anyway.

**1 — `@vexcms/better-auth` package table row:**

```md
| @vexcms/better-auth | packages/better-auth | Better Auth <-> Convex adapter (peer: catalog `>=1.7.16 <1.8.0`) |
```

**2 — stack table row:**

```md
| Better Auth >=1.7.16 <1.8.0 (+ @convex-dev/better-auth) | Auth (OAuth, sessions) |
```

#### patches/@convex-dev__better-auth@0.13.0.patch

New file, replacing `patches/@convex-dev__better-auth@0.11.5.patch` (deleted — `pnpm patch`
targets the new version, and `patchedDependencies` below points at the new filename, so the
old patch is orphaned and must go). Generate it against the real 0.13.0 tarball rather than
hand-editing:

```bash
pnpm patch @convex-dev/better-auth@0.13.0
# prints a tmp dir, e.g. /path/to/<store>/@convex-dev/better-auth@0.13.0
```

Edit `<tmp-dir>/dist/nextjs/index.js`'s `cachedGetToken` (inside `convexBetterAuthNextJs`) to
add the same header remap the 0.11.5 patch's second hunk added — get-convex/better-auth#422's
`getToken` half was never fixed upstream, only the route-handler half was (0.12.6,
GHSA-pgx2-m66h-x29f — confirmed: 0.13.0's `dist/nextjs/index.js` lines 36–41 already delete
inbound `x-forwarded-host`/`x-forwarded-proto` and set the `x-better-auth-forwarded-*` pair
itself; `cachedGetToken` at lines 64–71 is untouched and matches the pre-patch 0.11.5 shape
byte-for-byte):

```bash
pnpm patch-commit <tmp-dir>
```

Verified against a real `npm pack @convex-dev/better-auth@0.13.0`, this is the resulting diff
(the `index` line's blob hashes are illustrative — `patch-commit` computes its own):

```diff
diff --git a/dist/nextjs/index.js b/dist/nextjs/index.js
index 5f56e5c..887f6d7 100644
--- a/dist/nextjs/index.js
+++ b/dist/nextjs/index.js
@@ -67,6 +67,15 @@ export const convexBetterAuthNextJs = (opts) => {
         mutableHeaders.delete("content-length");
         mutableHeaders.delete("transfer-encoding");
         mutableHeaders.set("accept-encoding", "identity");
+        const forwardedHost = mutableHeaders.get("x-forwarded-host");
+        if (forwardedHost) {
+            mutableHeaders.set("x-better-auth-forwarded-host", forwardedHost);
+            mutableHeaders.delete("x-forwarded-host");
+        }
+        const forwardedProto = mutableHeaders.get("x-forwarded-proto");
+        if (forwardedProto) {
+            mutableHeaders.set("x-better-auth-forwarded-proto", forwardedProto);
+        }
         return getToken(siteUrl, mutableHeaders, { ...opts, forceRefresh });
     });
     const callWithToken = async (fn) => {
```

#### package.json (patchedDependencies)

1 edit, inside the same `pnpm` block as the overrides/allowedVersions edit above:

```json
    "patchedDependencies": {
      "@convex-dev/better-auth@0.13.0": "patches/@convex-dev__better-auth@0.13.0.patch",
      "@daveyplate/better-auth-ui@3.4.0": "patches/@daveyplate__better-auth-ui@3.4.0.patch"
    },
```

#### packages/create-vexcms/templates/base-nextjs/package.json

3 edits; everything not shown (including `@daveyplate/better-auth-ui`, which stays `3.4.0`
with no template patch — out of scope) is unchanged.

**1 — dependency pins**, mirroring the catalog bumps by hand per `scripts/sync-template-versions.mjs`'s
`@vexcms/*`-only scope:

```json
    "@better-auth/api-key": "1.7.18",
    "@convex-dev/better-auth": "0.13.0",
```

And further down:

```json
    "better-auth": "1.7.18",
```

**2 — `pnpm.overrides`:**

```json
    "overrides": {
      "@better-auth/passkey": "1.7.18"
    },
```

**3 — `pnpm.peerDependencyRules.allowedVersions`** — same deletion as the root manifest, same
reasoning (0.13.0's peer directly admits 1.7.18):

```json
    "peerDependencyRules": {
      "allowedVersions": {
        "better-call": "2",
        "typescript": "6"
      }
    }
```

#### apps/test/convex/http.ts

1 edit (deletion); everything else unchanged.

**1 — delete the oidc-provider `console.warn` filter.** Its own comment named its expiry
condition ("Remove once @convex-dev/better-auth migrates to @better-auth/oauth-provider") —
0.13.0 no longer calls the deprecated plugin internally (confirmed: the installed 0.13.0
`dist/plugins/convex/index.js` comment reads "nothing serves the `/oauth2/*` paths since
Better Auth 1.7 removed the oidcProvider plugin" — the warning this suppressed cannot fire
anymore). Remove the whole `const _warn = …` / `console.warn = …` / `try`/`finally` wrapper,
collapsing the handler to:

```ts
const authRequestHandler = httpAction(async (ctx, request) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const auth = createAuth(ctx)
  return await auth.handler(request)
})
```

#### apps/www/convex/http.ts

Same deletion, inside the `try` that also calls `limitAuthRequest`; the `finally` block and its
`console.warn = _warn` restore go with it:

```ts
const authRequestHandler = httpAction(async (ctx, request) => {
  const limited = await limitAuthRequest({ ctx, request })
  if (limited) {
    return limited
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const auth = createAuth(ctx)
  return await auth.handler(request)
})
```

#### packages/create-vexcms/templates/base-nextjs/convex/http.ts

Same deletion as `apps/test/convex/http.ts`:

```ts
const authRequestHandler = httpAction(async (ctx, request) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const auth = createAuth(ctx)
  return await auth.handler(request)
})
```

#### apps/test/src/auth/plugins.ts

1 edit; everything not shown (the plugin array itself) is unchanged.

**1 — correct the stale JSDoc.** `convex()` no longer calls a deprecated plugin at 0.13.0, so
the reason given for returning a fresh array on every call is gone; the behavior itself
(fresh array per call, so plugin init runs inside `createAuth()`) is unrelated to oidc and
stays:

```ts
/**
 * Returns a fresh array of Better Auth plugins for each VexCMS auth session.
 *
 * Includes: admin roles, anonymous access, organization/team support, API key auth,
 * and Convex session storage.
 *
 * @see authOptions in apps/test/src/auth/options.ts
 * @see betterAuthAdapter in @vexcms/better-auth
 */
```

#### apps/www/convex/auth/plugins/index.ts

Same JSDoc correction:

```ts
/**
 * Returns a fresh array of Better Auth plugins for each VexCMS auth session.
 */
```

#### packages/create-vexcms/templates/base-nextjs/convex/auth/plugins/index.ts

Same JSDoc correction:

```ts
/**
 * Returns a fresh array of Better Auth plugins for each VexCMS auth session.
 */
```

#### .changeset/better-auth-1-7-upgrade.md

New file. `patch` (P-025) for the two publishable packages this step's manifests touch —
`@vexcms/better-auth` (the descriptor swap is a public API break) and `create-vexcms` (the
scaffold template's pins and `pnpm` rules changed, same precedent as
`2026-08-30-wpa-dependency-pinning` step 7).

```md
---
"@vexcms/better-auth": patch
"create-vexcms": patch
---

Upgrade `better-auth` to 1.7.18 and `@convex-dev/better-auth` to 0.13.0. 1.6.x carries
critical GHSA-965c-763c-88jm and high GHSA-r4xp-prcw-77qf / GHSA-q84f-53jg-9ppm, fixed only
in >=1.7.7; only 0.13.0 accepts better-auth 1.7 (peer `>=1.7.16 <1.8.0`).

`betterAuthCollections()` drops the separate `mcp` and `oidcProvider` plugin descriptors —
Better Auth 1.7 removed both from `better-auth/plugins` — for one `oauthProvider` descriptor
modelling the six tables `@better-auth/oauth-provider` registers (`oauthClient`,
`oauthResource`, `oauthClientResource`, `oauthClientAssertion`, `oauthAccessToken`,
`oauthConsent`). Projects using `@better-auth/mcp` enable `oauthProvider: true` — `mcp()`
composes `oauthProvider` internally and declares no tables of its own. Breaking for any
project whose `authSchema.plugins` named `mcp` or `oidcProvider` directly.

The root `getToken`-path patch is re-created against 0.13.0's `dist/nextjs/index.js`: upstream
fixed the route-handler half of get-convex/better-auth#422 in 0.12.6 (GHSA-pgx2-m66h-x29f),
but `cachedGetToken`'s own header remap was never ported, so the patch now carries only that
hunk.

`@better-auth/passkey`'s pinned override and the scaffold template's dependency pins move to
1.7.18 in lockstep.
```

Verify:
- [ ] `npm view better-auth time --json | grep '"1.7.18"'` (and the same for
      `@better-auth/api-key`, `@better-auth/oauth-provider`, `@better-auth/passkey`) — all ≥72h
      before the instant `pnpm install` runs, else use the 1.7.17 fallback train (above)
- [ ] Advisory query (step 1) prints exactly `astro sharp`
- [ ] `pnpm install` — exits 0 under `strictPeerDependencies: true` with no
      `patchedDependencies` warning naming a stale hash. `@better-auth/oauth-provider` peers on
      exact `better-call` 1.4.5 and `@better-fetch/fetch` 1.3.3; if either raises a new peer
      conflict, report it (P-023) instead of adding an `allowedVersions` entry
- [ ] AP-013 negative tests, one at a time, each restored before the next: delete
      `pnpm.overrides["@better-auth/passkey"]` → `pnpm install` exits 1 naming
      `better-auth@^1.7.2` (or whatever the floated passkey peer resolves to) conflicting with
      the catalog's 1.7.18; delete `allowedVersions["better-call"]` → exits 1 naming
      `better-call@"1.4.5"` found `2.0.2`; delete `allowedVersions["typescript"]` → exits 1
      naming `typescript@"^5.0.0"` found `6.0.3`
- [ ] `pnpm --filter @vexcms/better-auth test` — `pluginSchemas.test.ts` green, including
      "is the only file that needs regenerating" (key-set parity) and every
      `betterAuthCollections` parity case, with `oauthProvider` present and `mcp`/`oidcProvider`
      absent from both `PLUGIN_SCHEMAS` and `PLUGIN_PROBES`
- [ ] `git apply --check patches/@convex-dev__better-auth@0.13.0.patch` against a fresh
      `node_modules/.pnpm/@convex-dev+better-auth@0.13.0*/node_modules/@convex-dev/better-auth`
      — applies cleanly at offset 0 (proves the patch was authored against the real installed
      tree, not a stale `npm pack`)
- [ ] `grep -rn "oidc-provider" apps/test/convex apps/www/convex packages/create-vexcms/templates` —
      no output (the dead filter and its stale comment are fully removed)
- [ ] Manual, attached to the already-running `apps/test` dev server (P-024, port 3020 per its
      `dev` script; if the port refuses connections, ask the developer to start it — never
      start one, P-024): sign in with email/password, sign up a new account, anonymous
      sign-in, then load `/admin` and confirm the session persists and the dashboard renders
- [ ] `pnpm build && pnpm typecheck && pnpm test && pnpm lint` — all green; `pnpm test` count
      is the pre-step baseline plus/minus only the `pluginSchemas.test.ts` delta (11 probe
      cases replace 12 — `mcp`+`oidcProvider` collapse to one `oauthProvider`, net −1)
- [ ] `pnpm changeset status` — `@vexcms/better-auth` and `create-vexcms` both listed

### Step 4 — eslint-config-next 16 alignment [agent]

`eslint-config-next`/`@next/eslint-plugin-next` 15.5.x are Next 15 configs running
against a Next 16 app. v16 ships native flat configs, so every `FlatCompat` shim
reachable from `next/core-web-vitals` is replaced with a direct import.

- [ ] `pnpm-workspace.yaml` — bump `eslint-config-next`, delete `@next/eslint-plugin-next` and `@eslint/eslintrc`
- [ ] `apps/test/eslint.config.mjs` — native import, drop the `jsx-a11y` plugin re-registration
- [ ] `apps/test/package.json` — drop `@eslint/eslintrc`, `@next/eslint-plugin-next` devDependencies
- [ ] `apps/www/eslint.config.mjs` — native import, drop the `jsx-a11y` plugin re-registration
- [ ] `apps/www/package.json` — drop `@eslint/eslintrc`, `@next/eslint-plugin-next` devDependencies
- [ ] `packages/next/eslint.config.mjs` — native import (same `FlatCompat` shim on the same `next/core-web-vitals` config)
- [ ] `packages/next/package.json` — no eslint devDependency changes (package carries none of the three removed/bumped entries)
- [ ] `packages/create-vexcms/templates/base-nextjs/eslint.config.mjs` — native import
- [ ] `packages/create-vexcms/templates/base-nextjs/package.json` — mirror catalog bump/deletions as literal pins
- [ ] `.changeset/eslint-config-next-16.md` — new changeset
- [ ] `pnpm install && pnpm build && pnpm typecheck && pnpm test && pnpm lint`

`eslint-config-next@16.4.5` was published 2026-11-03T17:52Z — 90h before the
2026-11-08 12:00Z cutoff, clearing `minimumReleaseAge: 4320`. `@next/eslint-plugin-next`
is **deleted**, not bumped: unpacking `eslint-config-next@16.4.5` shows its
`dist/core-web-vitals.js` already `require("@next/eslint-plugin-next")` as the
config's own dependency (`eslint-config-next`'s published `package.json` lists
`"@next/eslint-plugin-next": "16.4.5"`), and a repo-wide grep for a direct
`@next/eslint-plugin-next` import returns nothing — nothing in this repo ever
imported the plugin package itself, only the config that bundles it. `@eslint/eslintrc`
is deleted for the same reason: once `FlatCompat` is gone from all four configs
that used it (`apps/test`, `apps/www`, `packages/next`, the template), no file
imports `@eslint/eslintrc` — confirmed by grep against `packages/react/eslint.config.mjs`
and the root `eslint.config.mjs`, neither of which ever used `FlatCompat`.

#### pnpm-workspace.yaml

3 edits; everything not shown is unchanged.

**1 — delete `@eslint/eslintrc`.** In the `catalog:` block, delete the
`"@eslint/eslintrc": 3.3.6` line, leaving `"@edge-runtime/vm": 5.0.0` followed
directly by `"@eslint/js": 9.39.5`.

**2 — delete `@next/eslint-plugin-next`.** Delete the
`"@next/eslint-plugin-next": 15.5.20` line, leaving `"@lhci/cli": 0.16.0`
followed directly by `"@platejs/basic-nodes": 53.0.0`.

**3 — bump `eslint-config-next`.**
```yaml
  eslint-config-next: 16.4.5
```
replacing the `eslint-config-next: 15.5.9` line (same position, between
`eslint: 9.39.5` and `eslint-plugin-import-x: 4.17.1`).

#### apps/test/eslint.config.mjs

2 edits; everything not shown is unchanged.

**1 — native flat import, drop `FlatCompat`.**
```javascript
import convexPlugin from "@convex-dev/eslint-plugin"
import nextCoreWebVitals from "eslint-config-next/core-web-vitals"
import importX from "eslint-plugin-import-x"
import jsxA11y from "eslint-plugin-jsx-a11y"
import perfectionist from "eslint-plugin-perfectionist"
import tseslint from "typescript-eslint"

const convexConfig = convexPlugin.configs.recommended[0]
const convexRules = convexConfig.rules
```
replaces the import block through `const convexRules = convexConfig.rules`
(deletes the `FlatCompat` import and the `compat` construction — nothing else
in this file reads `compat`). Further down, the `tseslint.config(` call's
second argument:
```javascript
  ...nextCoreWebVitals,
```
replaces `...compat.extends("next/core-web-vitals"),`.

**2 — drop the `jsx-a11y` plugin re-registration.** `eslint-config-next/core-web-vitals`'s
first config object applies to `**/*.{js,jsx,mjs,ts,tsx,mts,cts}` and already
registers the plugin key `"jsx-a11y"` (via `require("eslint-plugin-jsx-a11y")`,
CJS-interop-wrapped). This file's own `**/*.tsx` block re-registers the same
key from an ESM default import of the same package — a different object
reference under the same name, which ESLint 9's flat config rejects with
`TypeError: Cannot redefine plugin "jsx-a11y"` wherever both configs apply
(every `.tsx` file). The fix keeps the rule overrides — defined from the
`jsxA11y` import's own rule list, so they still need the import — and drops
only the now-conflicting `plugins` key; the plugin itself was already
registered by `nextCoreWebVitals`, and a flat-config object may set `rules`
for a plugin without re-declaring `plugins` as long as some earlier entry in
the array did.
```javascript
  {
    files: ["**/*.tsx"],
    rules: {
      ...Object.fromEntries(
        Object.keys(jsxA11y.flatConfigs.recommended.rules).map((rule) => [rule, "error"]),
      ),
      // Deprecated by the plugin itself in favor of
      // `label-has-associated-control`, which covers the same cases; this one
      // only double-fires alongside it.
      "jsx-a11y/label-has-for": "off",
    },
  },
```
replaces the matching block (deletes the `plugins: { "jsx-a11y": jsxA11y },`
line only).

Verify:
- [ ] `pnpm --filter test lint 2>&1 | tee /tmp/test-lint-before.txt` run BEFORE this
      step's edits land (on the pre-step tree) to record the baseline; re-run after and
      diff. Every finding new to the Next 16 rule set is either fixed in this step or
      listed under this step with the rule name and why it is deferred
- [ ] `pnpm --filter test lint` exits without `Cannot redefine plugin` — if it
      still throws, the measured procedure is: run with `DEBUG=eslint:eslint`
      and read which plugin name collides, since the flat-config merge order
      can surface a second collision statically unreachable from the four
      source files alone (e.g. a transitive config shipped by a future
      `eslint-config-next` patch)
- [ ] negative test: add `<img src="/x.png" />` to a scratch `.tsx` file under
      `apps/test/src`, confirm `@next/next/no-img-element` fires, then discard
      the file — proves the Next 16 plugin rules are actually active, not just
      that the config loads

#### apps/www/eslint.config.mjs

2 edits, same shape as `apps/test/eslint.config.mjs` (this file carries no
`@convex-dev/eslint-plugin` block, so the import list and the `tseslint.config()`
argument list are otherwise identical); everything not shown is unchanged.

**1 — native flat import, drop `FlatCompat`.**
```javascript
import convexPlugin from "@convex-dev/eslint-plugin"
import nextCoreWebVitals from "eslint-config-next/core-web-vitals"
import importX from "eslint-plugin-import-x"
import jsxA11y from "eslint-plugin-jsx-a11y"
import perfectionist from "eslint-plugin-perfectionist"
import tseslint from "typescript-eslint"

const convexConfig = convexPlugin.configs.recommended[0]
const convexRules = convexConfig.rules
```
replaces the import block through `const convexRules = convexConfig.rules`.
```javascript
  ...nextCoreWebVitals,
```
replaces `...compat.extends("next/core-web-vitals"),`.

**2 — drop the `jsx-a11y` plugin re-registration.** Same conflict as
`apps/test`: `nextCoreWebVitals` already registers `"jsx-a11y"` for every
`.tsx` file.
```javascript
  {
    files: ["**/*.tsx"],
    rules: {
      ...Object.fromEntries(
        Object.keys(jsxA11y.flatConfigs.recommended.rules).map((rule) => [rule, "error"]),
      ),
      // Deprecated by the plugin itself in favor of
      // `label-has-associated-control`, which covers the same cases; this one
      // only double-fires alongside it.
      "jsx-a11y/label-has-for": "off",
    },
  },
```
replaces the matching block.

Verify:
- [ ] `pnpm --filter www lint 2>&1 | tee /tmp/www-lint-before.txt` baselined
      before this step's edits land, diffed after: new findings fixed or listed, as above
- [ ] `pnpm --filter www lint` exits without `Cannot redefine plugin`
- [ ] negative test: add `<img src="/x.png" />` to a scratch `.tsx` file under
      `apps/www/src`, confirm `@next/next/no-img-element` fires, then discard

#### packages/next/eslint.config.mjs

1 edit; everything not shown is unchanged. This file has no custom `jsx-a11y`
or `@convex-dev` block, so only the `FlatCompat` shim moves. It uses the identical
`compat.extends("next/core-web-vitals")` call and would otherwise stay on the Next 15
config. `packages/next` has no `lint` script and declares no ESLint devDependencies; the
root `pnpm lint` runs the root `eslint.config.mjs`, so this file loads only when invoked
explicitly, resolving its plugins through the hoisted root `node_modules`.

**1 — native flat import, drop `FlatCompat`.**
```javascript
import nextCoreWebVitals from "eslint-config-next/core-web-vitals"
import importX from "eslint-plugin-import-x"
import perfectionist from "eslint-plugin-perfectionist"
import globals from "globals"
import tseslint from "typescript-eslint"
```
replaces the 5-line import block (deletes the `FlatCompat` import; the
`compat` construction on the following lines is deleted with it — nothing
else in this file reads `compat`).
```javascript
  ...nextCoreWebVitals,
```
replaces `...compat.extends("next/core-web-vitals"),`.

Verify:
- [ ] `pnpm exec eslint -c packages/next/eslint.config.mjs packages/next/src` from the repo
      root loads the config (no `Cannot find package`, no `Cannot redefine plugin`); its
      findings are informational — the root `pnpm lint` remains the gate for this package

#### packages/create-vexcms/templates/base-nextjs/eslint.config.mjs

1 edit, same shape as `packages/next/eslint.config.mjs` (no custom `jsx-a11y`
or `@convex-dev` block); everything not shown is unchanged.

**1 — native flat import, drop `FlatCompat`.**
```javascript
import convexPlugin from "@convex-dev/eslint-plugin"
import nextCoreWebVitals from "eslint-config-next/core-web-vitals"
import importX from "eslint-plugin-import-x"
import perfectionist from "eslint-plugin-perfectionist"
import tseslint from "typescript-eslint"

const convexConfig = convexPlugin.configs.recommended[0]
const convexRules = convexConfig.rules
```
replaces the import block through `const convexRules = convexConfig.rules`.
```javascript
  ...nextCoreWebVitals,
```
replaces `...compat.extends("next/core-web-vitals"),`.

No `next.config.ts` edit is needed anywhere: `apps/test`, `apps/www`, and the
template's `next.config.ts` were all read in full for this step and none sets
the removed `eslint` key (Next 16 dropped `eslint.ignoreDuringBuilds`/`dirs`
from `NextConfig`) — confirmed absent in all three files.

Verify:
- [ ] grep the template's `eslint.config.mjs` for `FlatCompat`/`@eslint/eslintrc`
      — zero matches

#### apps/test/package.json

1 edit; everything not shown is unchanged.

**1 — drop the two deleted catalog entries.** Delete the
`"@eslint/eslintrc": "catalog:",` and `"@next/eslint-plugin-next": "catalog:",`
lines from `devDependencies`, leaving `"@convex-dev/eslint-plugin": "catalog:",`
followed directly by `"@lhci/cli": "catalog:",` followed directly by
`"@playwright/test": "catalog:",`.

Verify:
- [ ] `pnpm install` (part of the step's final gate) resolves clean with
      `strictPeerDependencies: true`

#### apps/www/package.json

1 edit; everything not shown is unchanged.

**1 — drop the two deleted catalog entries.** Delete the
`"@eslint/eslintrc": "catalog:",` and `"@next/eslint-plugin-next": "catalog:",`
lines from `devDependencies`, leaving `"@convex-dev/eslint-plugin": "catalog:",`
followed directly by `"@edge-runtime/vm": "catalog:",` followed directly by
`"@lhci/cli": "catalog:",` followed directly by `"@playwright/test": "catalog:",`.

#### packages/create-vexcms/templates/base-nextjs/package.json

2 edits; everything not shown is unchanged.

**1 — drop the two deleted catalog entries, mirrored as literal pins.** Delete
the `"@eslint/eslintrc": "3.3.6",` and `"@next/eslint-plugin-next": "15.5.20",`
lines from `devDependencies`, leaving `"@convex-dev/eslint-plugin": "1.2.2",`
followed directly by `"@tailwindcss/postcss": "4.3.2",`.

**2 — bump the mirrored `eslint-config-next` pin.**
```json
    "eslint-config-next": "16.4.5",
```
replaces `"eslint-config-next": "15.5.9",`.

Verify:
- [ ] grep this file for `@eslint/eslintrc`/`@next/eslint-plugin-next` —
      zero matches; `eslint-config-next` equals the catalog value

#### .changeset/eslint-config-next-16.md

New file. Only `create-vexcms` ships an ESLint config (the template); `packages/next`'s
`eslint.config.mjs` is not in its published `files`.

```markdown
---
"create-vexcms": patch
---

New projects lint with `eslint-config-next` 16 (native flat config) instead of the Next 15
config through `FlatCompat`; `@eslint/eslintrc` and `@next/eslint-plugin-next` are no longer
template devDependencies.
```

Verify:
- [ ] `pnpm --filter test lint`, `pnpm --filter www lint` — baseline captured
      before the step's edits land (per-file Verify blocks above), diffed
      after: every new finding fixed or listed
- [ ] no `FlatCompat`/`@eslint/eslintrc` import remains anywhere in the repo:
      `grep -rl "@eslint/eslintrc" --include="*.mjs" apps packages` returns
      nothing
- [ ] negative test (both apps, see per-file Verify blocks): a scratch
      `<img>` element fires `@next/next/no-img-element`, proving the Next 16
      rule set is live and not silently empty
- [ ] `pnpm install && pnpm build && pnpm typecheck && pnpm test && pnpm lint`
      green
- [ ] deferred to step 6: `pnpm verify:scaffold`'s `base-nextjs` run exercises
      this template's `eslint.config.mjs` as scaffolded, catching anything a
      manual read of the template in isolation cannot (AP-020)

### Step 5 — Docs site: Astro 7 + Starlight [agent]

`astro` 6.4.8 → 7.4.5 and `@astrojs/starlight` 0.38.5 → 0.42.9 clear a critical AVIF-optimizer
RCE and several XSS advisories; `sharp` 0.34.5 → 0.35.5 clears three high libvips/libheif/librsvg
advisories. `starlight-typedoc` and `starlight-llms-txt` move to the releases that declare Astro
7 / Starlight ≥0.41 peers.

- [ ] `pnpm-workspace.yaml` — bump `astro`, `@astrojs/starlight`, `sharp`, `starlight-llms-txt`,
      `starlight-typedoc`; correct the `onlyBuiltDependencies` comment
- [ ] `apps/docs/package.json` — add `engines.node`
- [ ] `apps/docs/astro.config.mjs` — sidebar `autogenerate` groups to the `items` array shape
- [ ] `apps/docs/src/content.config.ts` — declare the `i18n` collection
- [ ] `apps/docs/src/content/i18n/en.json` — new file
- [ ] `pnpm install && pnpm --filter docs build`

Starlight 0.39 removed the `{ label, autogenerate }` sidebar shorthand our config still uses for
the Guides/Fields/Development groups — the build hard-fails with `AstroUserError` without the fix
below (reproduced). Astro's content layer also now warns `[content] The collection "i18n" does
not exist or is empty` on every build once Starlight (0.42) queries it, confirmed in an isolated
from-scratch Starlight 0.42 + Astro 7 repro unrelated to any project-specific config — declaring
the collection with one placeholder locale file is the only way found to silence it. No
`src/content/docs/404.md` is added: tested, and it trades the existing (and harmless)
`Entry docs → 404 was not found` notice for a different non-fatal `PrerenderRouteConflict`
warning — a known upstream interaction between a content entry named `404` and Starlight's own
injected `/404` route, reproduced in the same isolated minimal project. Adding a custom 404 page
is also new content/design scope this step does not ask for.

#### pnpm-workspace.yaml

6 edits; everything not shown is unchanged.

**1 — `@astrojs/starlight` entry.**

```yaml
  "@astrojs/starlight": 0.42.9
```

**2 — `astro` entry.**

```yaml
  astro: 7.4.5
```

**3 — `sharp` entry.**

```yaml
  sharp: 0.35.5
```

**4 — `starlight-llms-txt` entry.**

```yaml
  starlight-llms-txt: 0.12.0
```

**5 — `starlight-typedoc` entry.**

```yaml
  starlight-typedoc: 0.23.2
```

**6 — `onlyBuiltDependencies` comment.** `sharp@0.35.5` dropped its `install` lifecycle script
entirely (`0.34.5` declares `"install": "node install/check.js || npm run build"`; `0.35.5`'s
`scripts` has no `install`/`postinstall` key at all — confirmed via `npm view`), so a fresh
install now blocks 6 scripts, not 7, and `sharp` is no longer one of them:

```yaml
# pnpm 10 blocks dependency lifecycle scripts by default; this states the posture
# explicitly so it is greppable and so allowing one becomes a visible diff rather
# than a silent capability grant. It is deliberately EMPTY, not vacuous: a fresh
# install blocks 6 scripts — core-js, esbuild (x2), msw (x2), unrs-resolver — and
# the tree works anyway because the ones that matter ship prebuilt platform
# binaries (@esbuild/*; sharp >=0.35 dropped its install-time binary check
# entirely). Adding a name here grants arbitrary code execution at install time;
# require evidence that the package cannot work without it.
onlyBuiltDependencies: []
```

#### apps/docs/package.json

1 edit; everything not shown is unchanged.

**1 — `engines`.** Astro 7.4.5's own floor (`npm view astro@7.4.5 engines` → `node: ">=22.23.4"`).
Root `package.json#engines.node` (`>=22.0.0` after step 2) is a looser floor than Astro's, so
this floor lives on `docs` alone. Add after `devDependencies`:

```json
  "engines": {
    "node": ">=22.23.4"
  }
```

#### apps/docs/astro.config.mjs

1 edit; everything not shown is unchanged.

**1 — sidebar `autogenerate` groups.** Replace the `Guides`/`Fields`/`Development` entries'
`autogenerate` shorthand with the `items` array Starlight ≥0.39 requires:

```js
				{
					label: 'Guides',
					items: [{ autogenerate: { directory: 'guides' } }],
				},
				{
					label: 'Fields',
					items: [{ autogenerate: { directory: 'fields' } }],
				},
				{
					label: 'Development',
					items: [{ autogenerate: { directory: 'dev' } }],
				},
```

#### apps/docs/src/content.config.ts

2 edits; everything not shown is unchanged.

**1 — imports.** Add `i18nLoader`/`i18nSchema` beside the existing `docsLoader`/`docsSchema`
imports:

```ts
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';
```

**2 — `collections`.** Add the `i18n` collection beside `docs`:

```ts
export const collections = {
	docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
	i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema() }),
};
```

#### apps/docs/src/content/i18n/en.json

New file. Carries zero UI-string overrides — it exists only so Astro's content layer finds the
`i18n` collection non-empty for the project's single (English) locale.

```json
{}
```

Verify:

- [ ] `pnpm install` — "Ignored build scripts" (if printed) lists `core-js`, `esbuild` (×2),
      `msw` (×2), `unrs-resolver` only; `sharp` does not appear (measured: it was in the list at
      0.34.5, gone at 0.35.5)
- [ ] `pnpm --filter docs build` exits 0. The only `[WARN]`-tagged line is
      `[content] Entry docs → 404 was not found.` — the same notice Starlight has always emitted
      for this project's un-customized 404 page (confirmed present, untagged, in a build of the
      pre-upgrade versions); no other warning class is new. (AP-012: this is the invariant that
      actually holds — the task's literal "zero-warning" cannot be reached without adding an
      out-of-scope custom 404 page, and doing so only trades this warning for a different one,
      proven below.)
- [ ] Negative test (AP-013): revert the `items: [...]` wrap on any one of the three
      `autogenerate` sidebar groups and rebuild — `astro build` now exits non-zero with
      `AstroUserError: Invalid config passed to starlight integration` /
      `Support for autogenerated sidebar groups was removed in Starlight v0.39.0`
- [ ] Negative test for the warning claim above: add `src/content/docs/404.md` (any valid
      Starlight 404 frontmatter) and rebuild — a *different* non-fatal warning appears,
      `[WARN] [build] Could not render /404 from route /[...slug] as it conflicts with higher
      priority route /404`, confirming the trade-off is real and not a symptom of this project's
      config (reproduces identically in a from-scratch two-file Starlight 0.42 + Astro 7 project)
- [ ] `find apps/docs/dist -iname '*.html' | wc -l` → `1116`, matching the pre-upgrade build
      exactly; `diff <(cd <pre-upgrade dist> && find . -iname index.html | sort) <(cd
      apps/docs/dist && find . -iname index.html | sort)` → no output (identical page set, not
      just a matching count)
- [ ] Advisory query (step 1) prints `no advisories`
- [ ] Visual check (read the built files directly — never start a dev/preview server, P-024):
      `apps/docs/dist/index.html` (home — title `VexCMS | VexCMS`, Vercel Analytics script
      present), `apps/docs/dist/guides/quickstart/index.html` (a guide), one API reference page
      e.g. `apps/docs/dist/api/core/src/classes/vexaccesserror/index.html` (typedoc output intact,
      `treatWarningsAsErrors: true` still passed with zero errors), `apps/docs/dist/llms.txt`,
      `llms-full.txt`, `llms-small.txt` (all three still generated)
- [ ] Node floor: confirm the environment/CI running the build is ≥22.23.4 — both
      `.github/workflows/ci.yml` and `release.yml` already request `node-version: 22` (no pin),
      which resolves to the latest 22.x release and already clears this; no workflow change needed
- [ ] Vercel (manual, not expressible as a repo command): `apps/docs` ships no `vercel.json`, so
      the project's Node.js Version is set in the Vercel dashboard for the `docs` project —
      confirm it is ≥22.x before the next deploy

### Step 6 — Transitive refresh, scaffold gate, records [agent]

Refreshes caret-ranged transitive dependencies inside their existing ranges, proves the
scaffold end to end, and brings the project records in line with the new versions.

- [ ] `pnpm update -r` (transitive refresh; manifests must not change)
- [ ] `pnpm audit --audit-level high` residue recorded in this spec's `## Verification`
- [ ] `pnpm --filter "@vexcms/*" --filter create-vexcms build`, then `pnpm verify:scaffold`
- [ ] Manual scaffold run of both templates
- [ ] `.agent/docs/product/tech-stack.md`: version rows + `verified_at`
- [ ] `.agent/manifest.json`: `dependencies[].version`, then `harness deps sync`
- [ ] `.agent/docs/research/pre-launch-dependency-review.md`: status line
- [ ] `harness tasks add` for the unshipped template patches

#### pnpm-lock.yaml

Run `pnpm update -r` from the repo root. pnpm's default `--depth` is `Infinity`, so every
transitive dependency re-resolves to the newest version its parent's range allows and that
`minimumReleaseAge` admits. Direct dependencies cannot move: every catalog value is exact.

The command must change ONLY `pnpm-lock.yaml`. If it rewrites any manifest or the catalog,
`git checkout` those files and run `pnpm install` to re-sync the lockfile before continuing.

#### Audit residue

Run `pnpm audit --audit-level high --json` and list every remaining advisory under
`## Verification` → "Accepted audit residue" with: package, version, path, why it cannot move
inside the current range (e.g. `basic-ftp` 5.x under `@lhci/cli` → `proxy-agent@6`, whose range
excludes the patched 6.2.1), and whether the path ships to users (`dependencies` of a
publishable package or the template) or is dev/CI-only. Measured before this spec: 60 high +
4 critical findings, all transitive except the ones steps 1, 3 and 5 move.

A residue entry that ships to users is a blocker: report it to the developer (P-023) instead of
adding an override.

#### .agent/docs/product/tech-stack.md

5 edits; everything not shown is unchanged.

**1 — frontmatter `verified_at`.** Set to `git rev-parse HEAD` at the time this step runs,
after re-reading the file against the catalog.

**2 — Repo Structure table, `docs` row.**

```md
| docs | apps/docs | Astro 7 + Starlight docs site (port 4321) |
```

**3 — Language + Runtime, `Runtime` line.** Step 2 raised the root floor.

```md
- Runtime: Node.js >= 22
```

**4 — Libraries table, `Convex` row.** Use the catalog value step 2 pinned.

```md
| Convex (catalog 1.49.0, exact) | Real-time DB, serverless functions, file storage |
```

**5 — Libraries table, `Astro` row.**

```md
| Astro 7 + Starlight (+ starlight-typedoc) | Docs site (apps/docs) |
```

Step 3 owns the `Better Auth` Libraries row.

#### .agent/manifest.json

1 edit; everything not shown is unchanged.

**1 — `dependencies[].version`.** Set each entry to the catalog value after steps 1–5:
`convex`, `better-auth` (`1.7.18`), `@convex-dev/better-auth` (`0.13.0`), `convex-helpers`,
`@tanstack/react-form`, `@base-ui/react` (`1.9.0`), `zod` (`4.6.7`), `platejs`
(catalog `platejs`), `@tanstack/react-table` (unchanged `8.21.3`). Then run `harness deps sync`
so `.agent/dependencies/` clones and `registry.md` match.

#### .agent/docs/research/pre-launch-dependency-review.md

1 edit; everything not shown is unchanged.

**1 — directly under the `# Pre-launch dependency review (2026-11-07)` title.**

```md
Status: implemented by `.agent/docs/specs/2026-11-07-pre-launch-dependency-upgrades/`.
```

#### Inbox task

```sh
harness tasks add "Template ships no dependency patches: scaffolded projects miss the @convex-dev/better-auth getToken x-forwarded-host remap (#422, dormant) and the better-auth-ui password-toggle label + footer-link nesting fixes; needs a package-manager-neutral fix or upstream PRs"
```

#### Manual scaffold run

AP-020: only a real scaffold run proves template changes. Pack and scaffold through
`verify:scaffold --keep` (it already scaffolds both templates against the packed tarballs),
then in each kept project directory:

1. `npx convex dev --once` against a fresh dev deployment (needs the developer's Convex login;
   ask the developer to run it if the CLI prompts for auth).
2. Set the env from `_env.example`, run `pnpm build`, then `pnpm start` on a free port.
3. Sign up with email/password, load `/admin`, create and save one document, sign out, sign in
   again.
4. `pnpm lint` exits 0 (proves step 4's flat config in the template).

Verify:
- [ ] `git diff --name-only` after `pnpm update -r` lists only `pnpm-lock.yaml`
- [ ] `pnpm install --frozen-lockfile` exits 0; `pnpm build`, `pnpm typecheck`, `pnpm test`,
      `pnpm lint` green
- [ ] `node scripts/check-packed-manifests.mjs` exits 0 (sweep + packed)
- [ ] Advisory query (step 1) prints `no advisories`
- [ ] `pnpm audit --audit-level high` residue fully listed under `## Verification`, none shipping
      to users
- [ ] `pnpm verify:scaffold` exits 0; `node scripts/verify-scaffold.mjs --negative` exits 1
      (the override gate still bites)
- [ ] Manual scaffold run passes for `base-nextjs` and `marketing-site`
- [ ] `harness deps list` shows the new versions; `harness doctor` reports no `stale-dependencies`
- [ ] `harness state` shows the template-patch task in the inbox

## Verification

Run after step 6, from a clean checkout of the final tree:

- [ ] `pnpm install --frozen-lockfile` exits 0 under `strictPeerDependencies: true`
- [ ] `pnpm build`, `pnpm typecheck`, `pnpm test`, `pnpm lint` green
- [ ] `pnpm --filter docs build` exits 0 with only the accepted 404 notice
- [ ] `node scripts/check-packed-manifests.mjs` exits 0
- [ ] Advisory query (step 1) prints `no advisories`
- [ ] `pnpm verify:scaffold` exits 0; `node scripts/verify-scaffold.mjs --negative` exits 1
- [ ] Manual scaffold run of `base-nextjs` and `marketing-site` passes (step 6)
- [ ] `pnpm changeset status` lists `@vexcms/core`, `@vexcms/react`, `@vexcms/better-auth`,
      `create-vexcms`

**Accepted audit residue.**

Filled in during step 6 from `pnpm audit --audit-level high --json`. One row per remaining
advisory; any row with "Ships to users: yes" blocks the spec.

| Package | Version | Path | Why it cannot move in range | Ships to users |
| --- | --- | --- | --- | --- |
