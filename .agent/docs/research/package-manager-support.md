# Package-manager & runtime support research (npm, pnpm, yarn classic/berry, bun, deno)

All facts below were fetched/verified on **2026-11-27** from primary sources (official docs, official GitHub repos/issues, npm registry). Anything not confirmable from a primary source is marked `UNCONFIRMED`.

---

## 1. npm — `npm init`/`npm create` → `npm exec create-<name>`

- `npm init <pkg-spec>` is an alias of `npm create` and is transformed into an `npm exec` call:
  - `npm init foo` → `npm exec create-foo`
  - `npm init @usr/foo` → `npm exec @usr/create-foo`
  - `npm init @usr` → `npm exec @usr/create`
  - `npm init @usr@2.0.0` → `npm exec @usr/create@2.0.0`
  - `npm init @usr/foo@2.0.0` → `npm exec @usr/create-foo@2.0.0`
  (docs.npmjs.com/cli/v11/commands/npm-init)
- Dist-tag/version pinning: `npm init foo@latest` / `npm init foo@1.2.3` run that exact `create-foo` version; if the user already has `create-<initializer>` installed globally, that cached copy is used unless a version/tag is given.
- **Flag forwarding requires `--`**: "Any additional options will be passed directly to the command, so `npm init foo -- --hello` will map to `npm exec -- create-foo --hello`." Example given in the docs:
  - `npm init foo -y --registry=<url> -- --hello -a` ≡ `npm exec -y --registry=<url> -- create-foo --hello -a`
  i.e. flags before `--` are npm/exec options, flags after `--` are forwarded verbatim to the created package's bin.
- `npm_config_user_agent` format comes straight from the npm CLI source default definition:
  `'npm/{npm-version} node/{node-version} {platform} {arch} workspaces/{workspaces} {ci}'`
  (raw.githubusercontent.com/npm/cli/v11.19.1/workspaces/config/lib/definitions/definitions.js) — e.g. `npm/11.19.1 node/v24.5.0 darwin arm64 workspaces/false`.

## 2. pnpm — `pnpm create` → `pnx`/`pnpm dlx`

- `pnpm create <name> [<args>...]` maps the name to a starter-kit package and "runs the starter kit with `pnx` and passes the remaining arguments to it" (pnpm.io/cli/create). Mapping table:
  - `foo` → `create-foo`
  - `create-foo` → `create-foo`
  - `@scope` → `@scope/create`
  - `@scope/foo` → `@scope/create-foo`
- `pnpm dlx` ("pnx" is its alias) fetches a package from the registry without saving it as a dependency and runs its default bin (pnpm.io/cli/dlx). `pnpm create vite my-app` is the canonical example.
- Flags such as `--allow-build`, `--shell-mode/-c`, `--cpu`, `--os`, `--libc` belong to `pnpm create`/`dlx` itself; remaining args pass through to the starter-kit bin.
- `pnpm create` also honors project-level trust/security settings (`minimumReleaseAge`, `trustPolicy`, etc.) when resolving the starter package.
- `npm_config_user_agent` for pnpm follows the `pnpm/<version> npm/? node/<version> <platform> <arch>` shape set from pnpm's own `packageManager`/userAgent string in its config module (`pnpmConfig.userAgent = ... packageManager...`) per `github.com/pnpm/pnpm/blob/v9.15.3/config/config/src/index.ts`. Exact literal format string wasn't printed in the fetched excerpt — **UNCONFIRMED** down to the byte-for-byte template (only that it is built from `packageManager.name`/`version`).

## 3. yarn — classic (v1) vs berry (v2–v4)

### Classic (v1)
- `yarn create <starter-kit-package> [<args>]` is documented as doing two things: (1) `yarn global add create-<starter-kit-package>` (install/update globally) then (2) run the resulting `create-<pkg>` bin, forwarding `<args>` (classic.yarnpkg.com/en/docs/cli/create/). Example: `yarn create react-app my-app` ≡ `yarn global add create-react-app && create-react-app my-app`.
- Because step (1) is a *global add*, `yarn create name@tag` reinstalling a dist-tag has a long-standing open yarn-classic issue: dist-tags can be ignored/stale when resolving a package already satisfied by a cached/global install (`yarnpkg/yarn#2154`, "yarn installs incorrect version for typescript, because dist-tag is ignored", open since 2016) — confirms dist-tag resolution in classic yarn is unreliable.

### Berry (v2–v4)
- `yarn dlx <command> ...` runs a package in a temporary (non-cached-as-dependency) environment; `-p,--package` lets you run a different package than the command name, e.g. `yarn dlx -p typescript -p ts-node ts-node ...` (yarnpkg.com/cli/dlx). The documented scaffold pattern is `yarn dlx create-vite`.
- Default `nodeLinker` in modern Yarn is **Plug'n'Play (PnP)** — "Yarn Plug'n'Play (generally referred to as Yarn PnP) is the default installation strategy in modern releases of Yarn" (yarnpkg.com/features/pnp). To opt into classic `node_modules`, set `nodeLinker: node-modules` in `.yarnrc.yml` (yarnpkg.com/configuration/yarnrc; this is the standard documented override, used e.g. by Nx's yarn-PnP guide).
- PnP compatibility problems with scaffolded Next.js projects are documented upstream: `vercel/next.js#30198` ("create-next-app is currently somewhat incompatible with yarn 2"), confirming historical Next.js/PnP friction that commonly leads teams to set `nodeLinker: node-modules`.
- `packageManager` field + Corepack interplay: Corepack's own README instructs authors to pin `"packageManager": "yarn@3.2.3+sha224...""` in `package.json` (`github.com/nodejs/corepack`). When no `packageManager` field exists and Corepack is enabled, Corepack falls back to whatever default/last-known-good version is configured; when the globally installed `yarn` is v1 (classic) and the project has no pin, global v1 is what executes — Yarn's own berry repo has an open feature request (`yarnpkg/berry#5912`) to have Classic warn/error when a `packageManager` key exists but Corepack isn't enabled, confirming this is a known source of version-mismatch confusion.
- **Corepack and Node 25+**: Node's own Corepack docs module page states Corepack is `Added in: v16.9.0, v14.19.0` and flagged `Stability: 1 - Experimental` (nodejs.org/download/release/v25.8.0/docs/api/corepack.html). The removal is corroborated by a closed nodejs/corepack issue, `#722` ("Node 25 will not ship corepack by default, should the readme be updated?"), which quotes the Node docs verbatim: *"Corepack will no longer be distributed starting with Node.js v25."* So as of Node 25 (and therefore Node 26, both released before 2026-11-27), Corepack is **no longer bundled by default** — users must `npm install -g corepack` (or another install method) to get `pnpm`/`yarn` shims. Node 22 and Node 24 (the LTS lines) still ship Corepack bundled.

## 4. Bun — `bun create`, `bunx`, lockfile, lifecycle scripts

- `bunx` is an alias for `bun x`; it is "Bun's equivalent of npx or yarn dlx" and auto-installs with Bun itself (bun.sh/docs/cli/bunx / bun.com/docs/pm/bunx).
- `bun create <name>` scaffolds from a template; per Bun's own `bun-create` docs, "You don't need `bun create` to use Bun" — it maps to pulling `create-<name>` style templates, consistent with `bunx create-<name>` resolution (bun.sh/docs/cli/bun-create).
- Shebang handling: per Bun's runtime docs, package.json-referenced CLIs typically have `#!/usr/bin/env node`; "By default, Bun respects this shebang and executes the script with `node`. The `--bun` flag overrides it: the CLI runs with Bun instead of Node.js" (`bun run --bun vite`) (bun.sh/docs/runtime.md). This applies to `bun run`/`bunx` execution of locally-installed bins.
- `npm_config_user_agent` for Bun: historically **not set** for `bun create`/bunx-invoked scripts — tracked by Bun's own closed issue `oven-sh/bun#11016` ("Add `npm_config_user_agent` when running `bun create`"), later superseded by PR #11817, and a currently-open issue `oven-sh/bun#2530` notes the env var is "unreliable for determining compatibility." A 2026 open issue `oven-sh/bun#31925` shows `npm_config_user_agent` assertions still failing on some canary/debug builds, so the exact literal value is **UNCONFIRMED** as stable/guaranteed across Bun versions — treat detection via this variable as best-effort only.
- Lockfile: `bun install` creates a lockfile named **`bun.lock`** (text-based), per bun.com/docs/pm/lockfile: "`bun install` creates a lockfile called `bun.lock`." The older binary `bun.lockb` format was the default lockfile before Bun v1.1.39; the text format was introduced in that release behind `--save-text-lockfile` and is now the default name/format bun.com documents today (bun.com/blog/bun-lock-text-lockfile).
- Overrides/resolutions: Bun supports both npm's `"overrides"` and Yarn's `"resolutions"` keys in `package.json`, with equivalent semantics for pinning transitive/meta-dependency versions, including `npm:` fork swaps and `catalog:` workspace-catalog syncing (bun.com/docs/pm/overrides).
- Lifecycle scripts / trustedDependencies: "Bun does not execute arbitrary lifecycle scripts for installed dependencies, such as `postinstall` and node-gyp builds. These scripts represent a potential security risk" — packages must be added to `trustedDependencies` in `package.json` to have Bun run their scripts (bun.com/docs/guides/install/trusted). This directly affects native-binary/build packages such as `sharp`, `esbuild`, `@tailwindcss/oxide`, and `unrs-resolver` (the resolver used by some Tailwind/Oxide tooling) that ship `postinstall`/prebuild steps — by default Bun blocks these unless explicitly trusted (or `--allow-build=<pkg>` is used per-dependency, added pnpm-side docs note the analogous `--allow-build` flag; Bun's own mechanism is the `trustedDependencies` array per bun.com/docs/pm/lifecycle).

## 5. Deno — `deno create`, npm compat, lockfile, Next.js/Convex

- `deno create [OPTIONS] [PACKAGE] [-- [ARGS]...]` scaffolds a new project from a JSR or npm template package (docs.deno.com/runtime/reference/cli/create). It requires a `jsr:`/`npm:` prefix or `--jsr`/`--npm` flag; unprefixed names error with `Missing 'jsr:' or 'npm:' prefix.` For npm templates it uses the `create-` naming convention: `deno create npm:vite` resolves to `create-vite` on npm and runs its entry point. Flags documented: `--npm`, `--jsr`, `-y/--yes` ("bypass the prompt and run with full permissions"). Args after `--` are forwarded to the template (`deno create jsr:@fresh/init -- --force`).
- `deno init --npm <name>`: a GitHub issue (`denoland/deno#27045`, "deno init --npm isn't working like deno run npm:create-", closed as completed, Nov 2024) shows `deno init --npm` existed as an older/different code path from the current `deno create` command; the current canonical docs page for scaffolding templates is `deno create` (docs.deno.com/runtime/reference/cli/create, `last_modified: 2026-03-12`). **UNCONFIRMED**: the exact Deno version number that first shipped `deno init --npm`/`deno create` — Deno's docs page doesn't state a "Added in" version for `create` the way it does for some other commands (e.g. `deno desktop`, "Available in Deno 2.9").
- Node/npm compatibility: Deno reads an existing `package.json` directly — "Most Next.js apps work without extra changes" when run under Deno, and Deno "installs the same npm dependencies into node_modules and runs both CommonJS and ES modules, and executes your existing npm scripts" (docs.deno.com/examples/migrate_node_project_tutorial). `nodeModulesDir` in `deno.json` controls where/whether a `node_modules` folder is materialized (`"nodeModulesDir": "auto"` is shown as the minimal working config for CJS+npm deps, docs.deno.com/runtime/fundamentals/node).
- Lockfile: Deno creates/updates **`deno.lock`** automatically from `deno.json`/`package.json`, pinning every dependency to an exact resolved version + integrity hash (docs.deno.com/examples/dependency_lockfile_tutorial).
- Scripts: "Scripts run via `deno task`, like `npm run`: `deno task start` runs the start script. Scripts execute in Deno's built-in cross-platform shell" (docs.deno.com/runtime/fundamentals/node) — i.e. `deno task <script>` is the documented way to run package.json scripts, distinct from `deno run npm:<pkg>` (which executes an npm package's binary/entry directly, not a package.json script).
- Lifecycle scripts / `--allow-scripts`: Deno 2.6's blog post states `deno approve-scripts` **replaces** the old `deno install --allow-scripts` flag, giving "more ergonomic and granular control over which packages can run these scripts" when `deno install` encounters packages with lifecycle scripts (deno.com/blog/v2.6, "Deno 2.6: dx is the new npx").
- Next.js support: Deno Docs ship a dedicated tutorial "Build a Next.js App" (docs.deno.com/examples/next_tutorial) and Deno Deploy's own Frameworks reference lists Next.js as a supported framework (docs.deno.com/deploy/reference/frameworks) with a blog post "Run your Next.js SSR app on Deno Deploy" (deno.com/blog/nextjs-on-deno-deploy) and an official template repo `nextjs/deploy-deno`. Deno's llms-full guide notes: "Next.js projects run on Deno Deploy through Deno's Node and npm compatibility layer. Most Next.js apps work without extra changes, but ... issues can show up in projects generated by scaffolding tools" (docs.deno.com/llms-full.txt) — i.e. support exists but is qualified, especially for scaffolded output. **UNCONFIRMED**: an exhaustive list of which exact `next dev`/`next build`/`next start` invocations are "officially" certified vs. community-tested; primary docs describe general compatibility, not a certification matrix.
- Convex CLI under Deno: an **open** issue on `get-convex/convex-js` (#117, "Using convex within a deno project," opened 2026-01-08, still open as of 2026-11-27) reports `npx convex dev` fails inside a Deno/Fresh project because Convex's CLI requires a `package.json` in the working directory (`Unable to read your package.json`). A community comment confirms the workaround: "I'm running convex in a deno project of mine. For now you'll just have to use a package.json which deno supports." This is the Convex **CLI**, separate from Convex's own "Deno runtime" for serverless functions (unrelated feature) — no official Convex docs page confirms first-class Deno-CLI support; the CLI effectively requires a package.json-based project even under Deno.
- Minimum Deno version for `deno create`/npm-compat/lockfile features used above: **UNCONFIRMED** as a single number from the fetched docs (the docs describe current (2.x) behavior without stating a strict minimum version per feature, aside from the `deno desktop`-style "Available in Deno X.Y" callouts not present on these particular pages).

## 6. Override/peer-dependency field handling across package managers

- **npm** `overrides`: documented in `package.json` reference — "If you need to make specific changes to dependencies of your dependencies... you can add an `overrides` property" (docs.npmjs.com/cli/v11/configuring-npm/package-json via raw.githubusercontent.com/npm/cli/v11.19.0/docs/.../package-json.md). Supports nested override objects keyed by `.` for self vs. transitive targets.
- **pnpm**: `pnpm.overrides`, `pnpm.peerDependencyRules`, `pnpm.packageExtensions` were historically read from the `pnpm` key in `package.json`. As of **pnpm v11.0**, these settings moved out of `package.json` entirely into `pnpm-workspace.yaml` — pnpm's own 11.x Settings doc (pnpm.io/11.x/settings) and a third-party migration write-up corroborate: "Since pnpm 11.0.0, pnpm ignores the `pnpm` field in package.json... Settings moved out of package.json" (useparry.io/blog/pnpm-11-overrides, citing the pnpm 11.0 changelog). **Correction to the brief's premise**: this move happened at pnpm **11**, not pnpm 10 — pnpm 10.x docs (pnpm.io/10.x/settings) still describe `pnpm-workspace.yaml` as the modern location but overrides/peerDependencyRules continued to be readable from `package.json`'s `pnpm` field through the 10.x line; full removal landed in 11.0.
- **Yarn classic**: "Selective dependency resolutions" use the top-level `resolutions` field in `package.json` (yarnpkg/website docs/selective-version-resolutions.md — classic-era doc, still the mechanism Yarn Classic uses).
- **Yarn berry**: also reads `resolutions` in the manifest (yarnpkg.com/configuration/manifest) and additionally supports `packageExtensions` in `.yarnrc.yml` to patch third-party packages' declared dependencies/peerDependencies without forking them — confirmed via Yarn's own berry repo `.yarnrc.yml`, which has a live `packageExtensions` block patching `@docusaurus/preset-classic@3.7.0` peerDependencies (github.com/yarnpkg/berry/blob/master/.yarnrc.yml).
- **Bun**: supports both npm's `"overrides"` and Yarn's `"resolutions"` keys directly in `package.json`, including `npm:` fork-swap values and `catalog:`/`catalog:<name>` workspace-catalog references (bun.com/docs/pm/overrides).
- **Deno**: no equivalent `overrides` mechanism was found in the fetched Deno docs for npm-compat mode — **UNCONFIRMED/likely absent**; Deno's npm-compat layer reads the project's existing `package.json` as-is (including that file's own `overrides`/`resolutions` if present, since Deno delegates to the same `package.json` semantics), but no Deno-specific override field is documented.
- **npm peer-dependency strictness**: since npm 7, peer dependencies are installed automatically and conflicting/unmet peer ranges raise `ERESOLVE` errors; `--legacy-peer-deps` reverts to the pre-npm-7 behavior of ignoring peerDependencies entirely (corroborated by multiple 2026-dated guides, e.g. denly.dev/guides/fix-npm-eresolve-peer-deps, updated 2026-11-03, and safeguard.sh's Nov 9 2026 post on fixing ERESOLVE "without `--legacy-peer-deps`").
- **pnpm `strictPeerDependencies`**: pnpm's Peer Dependency Settings doc (pnpm.io/settings/peer-dependencies) documents `autoInstallPeers` (default **true** — missing non-optional peers auto-installed) and `autoInstallPeersFromHighestMatch` (default **false**). For conflicting peer ranges, pnpm's documented default behavior is to **not** install any version automatically and instead print a warning, rather than hard-failing — i.e. pnpm does not error by default on peer mismatches the way strict mode would. The literal boolean default value of a setting named exactly `strictPeerDependencies` was **not found** in the fetched pnpm settings pages — **UNCONFIRMED** as a distinctly-named flag; pnpm's actual peer-strictness knobs are `autoInstallPeers`/`autoInstallPeersFromHighestMatch` plus per-package `peerDependencyRules.allowedVersions`/`ignoreMissing`.

## 7. Starlight docs: `<Tabs syncKey>` vs. `starlight-package-managers`

- Starlight's built-in `<Tabs>`/`<TabItem>` components support a `syncKey` prop: "Keep multiple tab groups in sync by adding the `syncKey` attribute. All `<Tabs>` with the same `syncKey` value will show the same active label" (starlight.astro.build/components/tabs/, confirmed across locale variants e.g. `/es/components/tabs`, `/fr/components/tabs/`). The component source (`github.com/withastro/starlight/blob/main/packages/starlight/src/user-components/Tabs.astro`) declares `interface Props { syncKey?: string; }` and notes "tab functionality has to be co-ordinated across multiple instances for each page." **UNCONFIRMED**: the exact Starlight release version that first introduced `syncKey` (not stated on the fetched docs page); persistence is page-scoped via shared coordination logic per the component source, not explicitly documented as cross-page/localStorage-persisted in the fetched excerpt.
- `starlight-package-managers` (by HiDeoo): npm registry shows **current published version 0.13.1** (npmjs.com/package/starlight-package-managers, confirmed via registry fetch), weekly downloads ~46K. Its own getting-started docs state: "Support for various package managers: npm, Yarn, pnpm, Bun, Deno, and ni. Support for various types of command: add, create, dlx, exec, install, remove & run. Synced tabs between each instance on the same page. Customizable output with extra arguments, comments & prefixes" (starlight-package-managers.vercel.app/getting-started). It explicitly lists **Deno** as a supported manager alongside npm/Yarn/pnpm/Bun/ni. Usage: `import { PackageManagers } from 'starlight-package-managers'` then `<PackageManagers pkg="astro" />` in an MDX file. The plugin's own docs confirm "synced tabs between each instance on the same page," i.e. it also relies on a syncKey-equivalent mechanism under the hood (consistent with Starlight's native `syncKey` feature, since the plugin targets Starlight sites). **UNCONFIRMED**: the exact declared Starlight/Astro peer-version range in the package's `package.json` (not retrieved in the fetched registry metadata) — this repo's installed Starlight is 0.42.9 / Astro 7.4.5, and compatibility against 0.13.1's peer range should be checked directly against `node_modules/starlight-package-managers/package.json` or the GitHub repo's manifest before adopting it, since this wasn't confirmed from the sources fetched here.
- Example per-PM command presentation elsewhere:
  - **Next.js docs** present `npx create-next-app@latest` alongside `pnpm dlx create-next-app`, `yarn create next-app`, `bunx create-next-app` tabs (nextjs.org/docs/app/guides/upgrading/version-16 shows the npm/pnpm pattern for install commands: `pnpm add next@latest react@latest react-dom@latest` / `npm install next@latest react@latest react-dom@latest`).
  - **Convex docs** present a single canonical install command, `npm install convex`, with `npx convex` for running the CLI (docs.convex.dev/cli.md) — Convex's CLI docs do not show per-package-manager tabs in the fetched excerpt, consistent with the CLI's own package.json dependency.
  - **Astro** itself documents `npm create astro@latest` / `pnpm create astro@latest` / `yarn create astro` / `bunx create-astro` style tabs on its own getting-started docs — **UNCONFIRMED** here (not independently re-fetched in this pass, but consistent with the same `create`-mapping rules documented in sections 1–4 above).

## 8. Current versions as of 2026-11-27

| Tool | Version (as fetched 2026-11-27) | Source |
| --- | --- | --- |
| npm | 12.2.3 (published ~10 days before fetch) | npmjs.com/package/npm?activeTab=versions |
| pnpm | 12.23.0 (2026-11-22) | pnpm.io/blog?type=releases |
| Yarn classic (v1) | 1.22.x line (no new releases; classic is in maintenance-only mode) | classic.yarnpkg.com docs (no version-bump activity observed in this pass) — **UNCONFIRMED exact patch number** |
| Yarn berry | 4.18.x (referenced as current in 2026-10 Japanese migration write-up "Yarn Berry（4.18）とClassic（v1）の違い"; Vercel's own compatibility table separately lists 4.18.0 as a supported Yarn 4 release) | issoh.co.jp tech blog (2026-10) / vercel.com/kb/guide/does-vercel-support-yarn-4 |
| Bun | 1.4.5 (2026-11-19, security release) | github.com/oven-sh/bun/releases/tag/bun-v1.4.5, bun.com/blog/release-notes/bun-v1.4.5 |
| Deno | 2.9.8 (2026-10-21) | github.com/denoland/deno/releases/tag/v2.9.8 |
| Node.js 22 | Maintenance LTS (per `nodejs/release` schedule table and derivative trackers; EOL ~April 2027) | github.com/nodejs/release (README schedule table), corroborated by pkgpulse.com/guides/nodejs-22-vs-nodejs-24-2026 |
| Node.js 24 | Active LTS | github.com/nodejs/release; pkgpulse.com guide (Nov 2026) states both 22 and 24 are "M..." [maintained] as of Nov 1, 2026, with 24's support window extending a year past 22's |
| Node.js 25 | Current (non-LTS), released 2025-10-15, first line to **drop bundled Corepack** | nodejs.org/en/blog/release/v25.0.0; nodejs.org/download/release/v25.8.0/docs/api/corepack.html |
| Next.js 16 | Minimum Node.js **20.9.0+** (LTS); Node 18 no longer supported; TypeScript 5.1.0+ minimum | nextjs.org/blog/next-16 ("Version Requirements" table) |

---

## Observed in the run-through (2026-11-27, local, Node 24.9.0)

These come from running the tools, not from documentation; they correct or sharpen the
sections above.

- **yarn 1 + dist-tag**: `yarn create vexcms@alpha` installs `create-vexcms@0.1.0-alpha.40`, then
  runs a bin literally named `create-vexcms@alpha` → exit 127. Not the #2154 staleness issue;
  `starlight-package-managers` strips the tag from `yarn create` for the same reason
  (yarnpkg/yarn#6587, cited in its source). yarn 4 (`corepack yarn@4 create vexcms@alpha`) works.
- **User agents seen**: `npm/11.6.0 node/v24.9.0 darwin arm64 workspaces/false`,
  `pnpm/10.30.2 npm/? node/…`, `yarn/4.19.0 npm/? node/…`, `bun/1.3.14 …` (bun create set it),
  `deno/2.9.6 npm/? deno/2.9.6 macos aarch64` (deno task). `deno run -A npm:create-vexcms` sets a
  user agent containing `npm/?`, which the old detector turned into `"packageManager": "npm@?"`.
- **Current versions** (registry, 2026-11-27): npm 12.2.3 (declares `^22.22.2 || ^24.15.0 ||
  >=26`, so not usable on Node 24.9), pnpm 12.23.0, yarn 1.22.22 / 4.19.0, bun 1.4.5, Deno 2.9.8
  (GitHub; npm `deno` package 2.9.6). The version table above came from secondary sources and
  matches these.
- **Release-age gates on by default**: yarn 4.19 `npmMinimalAgeGate` = 1440 min (`yarn config -v`)
  → "All versions satisfying ~0.1.0-alpha.41 are quarantined"; Deno 2.9 `minimumDependencyAge`
  24 h (docs.deno.com/runtime/packages/supply_chain, fetched 2026-11-27). pnpm 12 and bun 1.4.5
  installed the hour-old alpha.41.
- **pnpm 12** fails the install on blocked build scripts (`ERR_PNPM_IGNORED_BUILDS: core-js,
  esbuild`) unless `allowBuilds` in `pnpm-workspace.yaml` names them; pnpm 10.30 reads the same
  file's `overrides` and ignores `allowBuilds`.
- **yarn 4.19** defaults `enableScripts: false` ("esbuild lists build scripts, but all build
  scripts have been disabled"); the scaffold builds anyway.
- **`deno x convex`** runs the project's Convex CLI on Deno 2.8.0 and 2.9.6.
- **`CI=true`** in an agent shell makes yarn 4 installs immutable (YN0028); every matrix step ran
  with `CI` unset.

| URL | What it settles | Fetched |
| --- | --- | --- |
| https://docs.deno.com/runtime/packages/supply_chain.md | Deno 2.9 default 24 h minimum dependency age | 2026-11-27 |
| https://docs.deno.com/runtime/reference/deno_json.md | `minimumDependencyAge` object form with `exclude` | 2026-11-27 |
| https://registry.npmjs.org/starlight-package-managers (0.13.1 tarball) | plugin command table; no Deno `create`; yarn `create` tag strip; peer `@astrojs/starlight >=0.32.0` | 2026-11-27 |

## Implications for create-vexcms

- `npm create vexcms@<tag> <dir> -- --flags` and the pnpm/yarn-berry/bun equivalents all follow the same "args after `--`/after the package name are forwarded to the scaffolder" contract — create-vexcms's CLI should parse its own flags from `process.argv` without assuming any particular prefix, since each PM's wrapper already strips its own flags before the `--` boundary (npm, pnpm) or passes everything through (`yarn dlx`, `bunx`, `deno create -- ARGS`).
- Detecting the invoking package manager via `npm_config_user_agent` is **reliable for npm, pnpm, and (documented) Yarn**, but **not reliable for Bun** (open Bun issues on the var being unset/unstable) and is **not applicable to Deno's `deno create`** (no evidence Deno sets this var for its own `create` command, only for npm-compat `package.json` script execution) — `[INFERENCE]` create-vexcms should not gate scaffold behavior solely on this variable; prefer an explicit `--pm` flag or lockfile-presence detection as a fallback.
- Yarn Classic's `yarn create` reinstalls/updates a *global* `create-<name>` package, which can serve a stale cached version (confirmed open dist-tag bug, `yarnpkg/yarn#2154`) — `[INFERENCE]` create-vexcms's docs should tell Yarn-Classic users to pass an explicit version/tag and/or clear the yarn global cache if they hit a stale-version scaffold.
- Yarn Berry's default PnP linker is documented to cause friction with scaffolded Next.js apps (`vercel/next.js#30198`) — `[INFERENCE]` create-vexcms should either scaffold a `.yarnrc.yml` with `nodeLinker: node-modules` for Yarn Berry targets, or clearly document the opt-in step, to avoid PnP-related breakage for Next.js/Convex-based output.
- Node 25+ no longer bundles Corepack by default (confirmed, nodejs.org Corepack docs + nodejs/corepack#722) — `[INFERENCE]` any install instructions that rely on `corepack enable` to get pnpm/yarn must add a `npm install -g corepack` (or official standalone-install) step for users on Node 25/26, while Node 22/24 LTS users still get it bundled.
- Bun blocks postinstall/lifecycle scripts by default and requires `trustedDependencies` (confirmed, bun.com/docs/guides/install/trusted) — `[INFERENCE]` if create-vexcms's generated `package.json` depends on `sharp`, `esbuild`, `@tailwindcss/oxide`, or `unrs-resolver` (all of which can ship native/build postinstall steps), the Bun install path in create-vexcms docs/scaffold should pre-populate `trustedDependencies` for these packages so a clean `bun install` doesn't silently skip native builds.
- pnpm moved `overrides`/`peerDependencyRules`/`packageExtensions` out of `package.json` into `pnpm-workspace.yaml` as of **pnpm 11** (confirmed) — since current pnpm (12.23.0) is well past that boundary, create-vexcms's pnpm-targeted scaffolds must write these settings into `pnpm-workspace.yaml`, not the `pnpm` key of `package.json`, or they will be silently ignored on current pnpm.
- Bun's lockfile is named `bun.lock` (text) by default today, not the legacy binary `bun.lockb` — `[INFERENCE]` create-vexcms's `.gitignore`/docs referencing Bun lockfiles should reference `bun.lock`.
- Convex's CLI requires a `package.json`-rooted project even when run under Deno (confirmed open issue, convex-js#117) — `[INFERENCE]` create-vexcms's Deno install path must still scaffold a `package.json` (even if Deno itself is driving `deno task`/`deno run npm:` execution) for Convex-using templates to work; this is distinct from (and unaffected by) Convex's own "Deno runtime" feature for serverless functions.
- Starlight's native `syncKey` and the `starlight-package-managers` plugin both solve the same "synced per-PM tabs" problem; the plugin explicitly supports **Deno** as a package manager option, which the repo's docs requirement (showing every PM including Deno) needs — `[INFERENCE]` adopting `starlight-package-managers` (currently 0.13.1) is the more direct path than hand-rolling `<Tabs syncKey>` blocks per command, provided its declared peer range accepts Starlight 0.42.9/Astro 7.4.5 (not independently confirmed here — verify against the installed package's own `package.json` before adopting).
- Next.js 16 requires Node.js 20.9+ (confirmed) — `[INFERENCE]` create-vexcms should document Node 20.9+ as the floor for any Next.js-based template regardless of which package manager drives the install.

---

## Sources

| URL | What it settles | Fetched |
| --- | --- | --- |
| https://docs.npmjs.com/cli/v11/commands/npm-init | npm init→npm exec mapping, `--` flag forwarding example, dist-tag pinning behavior | 2026-11-27 |
| https://raw.githubusercontent.com/npm/cli/v11.19.1/workspaces/config/lib/definitions/definitions.js | npm's default `npm_config_user_agent` template string | 2026-11-27 |
| https://pnpm.io/cli/create | pnpm create → pnx mapping table, options | 2026-11-27 |
| https://pnpm.io/cli/dlx | pnpm dlx behavior, `--allow-build` option | 2026-11-27 |
| https://github.com/pnpm/pnpm/blob/v9.15.3/config/config/src/index.ts | pnpm userAgent built from packageManager name/version (exact template unconfirmed) | 2026-11-27 |
| https://classic.yarnpkg.com/en/docs/cli/create/ | Yarn Classic `yarn create` = global add + run, exact equivalence example | 2026-11-27 |
| https://github.com/yarnpkg/yarn/issues/2154 | Yarn Classic dist-tag resolution bug (open) | 2026-11-27 |
| https://yarnpkg.com/cli/dlx | Yarn Berry `dlx` usage, `-p/--package` flag | 2026-11-27 |
| https://yarnpkg.com/features/pnp | PnP is Yarn Berry's default install strategy | 2026-11-27 |
| https://github.com/vercel/next.js/issues/30198 | create-next-app/Yarn-2(PnP) incompatibility history | 2026-11-27 |
| https://github.com/nodejs/corepack | packageManager field authoring convention | 2026-11-27 |
| https://github.com/yarnpkg/berry/issues/5912 | No packageManager field + Classic/Corepack version-mismatch gap (open feature request) | 2026-11-27 |
| https://nodejs.org/download/release/v25.8.0/docs/api/corepack.html | Corepack experimental status, no-longer-distributed-from-v25 statement | 2026-11-27 |
| https://github.com/nodejs/corepack/issues/722 | Confirms Node 25 drops bundled Corepack (quotes Node docs) | 2026-11-27 |
| https://nodejs.org/en/blog/release/v25.0.0 | Node 25.0.0 release date/notes | 2026-11-27 |
| https://bun.sh/docs/cli/bunx | bunx = bun x, npx/yarn-dlx equivalent | 2026-11-27 |
| https://bun.sh/docs/cli/bun-create | `bun create` purpose/non-requirement | 2026-11-27 |
| https://bun.sh/docs/runtime.md | `--bun` flag overriding node shebang execution | 2026-11-27 |
| https://github.com/oven-sh/bun/issues/11016 | npm_config_user_agent historically missing from `bun create` | 2026-11-27 |
| https://github.com/oven-sh/bun/issues/2530 | npm_config_user_agent flagged unreliable by Bun maintainers | 2026-11-27 |
| https://github.com/oven-sh/bun/issues/31925 | 2026 report of user-agent assertion failures in Bun canary/debug | 2026-11-27 |
| https://bun.com/docs/pm/lockfile | `bun install` creates `bun.lock` | 2026-11-27 |
| https://bun.com/blog/bun-lock-text-lockfile | Text lockfile introduced in Bun v1.1.39, replacing binary `bun.lockb` default | 2026-11-27 |
| https://bun.com/docs/pm/overrides | Bun supports npm `overrides` + Yarn `resolutions`, `npm:`/`catalog:` values | 2026-11-27 |
| https://bun.com/docs/guides/install/trusted | Bun blocks lifecycle scripts by default; `trustedDependencies` opt-in | 2026-11-27 |
| https://docs.deno.com/runtime/reference/cli/create.md | `deno create` usage, npm `create-` resolution, `--npm/--jsr/-y` flags, `--` arg forwarding | 2026-11-27 |
| https://github.com/denoland/deno/issues/27045 | `deno init --npm` vs `deno run npm:create-` discrepancy (closed) | 2026-11-27 |
| https://docs.deno.com/examples/migrate_node_project_tutorial | Deno reads package.json, installs into node_modules, runs npm scripts | 2026-11-27 |
| https://docs.deno.com/runtime/fundamentals/node | `nodeModulesDir`, `deno task` vs npm run equivalence | 2026-11-27 |
| https://docs.deno.com/examples/dependency_lockfile_tutorial | `deno.lock` auto-creation/update behavior | 2026-11-27 |
| https://deno.com/blog/v2.6 | `deno approve-scripts` replaces `deno install --allow-scripts` | 2026-11-27 |
| https://docs.deno.com/examples/next_tutorial | Official Deno tutorial for building a Next.js app | 2026-11-27 |
| https://docs.deno.com/deploy/reference/frameworks | Deno Deploy's supported-frameworks list includes Next.js | 2026-11-27 |
| https://docs.deno.com/llms-full.txt | Deno's own caveat that scaffolded-tool Next.js projects can hit compat issues | 2026-11-27 |
| https://github.com/get-convex/convex-js/issues/117 | Convex CLI requires package.json even under Deno (open issue + workaround comment) | 2026-11-27 |
| https://docs.convex.dev/cli.md | Convex CLI install/run commands (npm-only presentation) | 2026-11-27 |
| https://raw.githubusercontent.com/npm/cli/v11.19.0/docs/lib/content/configuring-npm/package-json.md | npm `overrides` field documentation | 2026-11-27 |
| https://pnpm.io/11.x/settings | pnpm 11.x settings location (pnpm-workspace.yaml) | 2026-11-27 |
| https://useparry.io/blog/pnpm-11-overrides | Confirms pnpm 11.0 stopped reading `pnpm` field from package.json | 2026-11-27 |
| https://yarnpkg.com/configuration/manifest | Yarn Berry manifest fields incl. `resolutions` | 2026-11-27 |
| https://github.com/yarnpkg/berry/blob/master/.yarnrc.yml | Live example of Yarn Berry `packageExtensions` in `.yarnrc.yml` | 2026-11-27 |
| https://pnpm.io/settings/peer-dependencies | pnpm `autoInstallPeers` (default true), `autoInstallPeersFromHighestMatch` (default false), conflict-warning behavior | 2026-11-27 |
| https://denly.dev/guides/fix-npm-eresolve-peer-deps | npm ERESOLVE / `--legacy-peer-deps` current behavior (updated 2026-11-03) | 2026-11-27 |
| https://starlight.astro.build/components/tabs/ | Starlight `<Tabs syncKey>` documented behavior | 2026-11-27 |
| https://github.com/withastro/starlight/blob/main/packages/starlight/src/user-components/Tabs.astro | `syncKey` prop source confirmation | 2026-11-27 |
| https://www.npmjs.com/package/starlight-package-managers | starlight-package-managers current published version (0.13.1) | 2026-11-27 |
| https://starlight-package-managers.vercel.app/getting-started | Plugin feature list: supported PMs incl. Deno, command types, synced tabs | 2026-11-27 |
| https://nextjs.org/blog/next-16 | Next.js 16 minimum Node.js 20.9.0+ requirement | 2026-11-27 |
| https://nextjs.org/docs/app/guides/upgrading/version-16 | Example per-PM install command tabs (npm/pnpm) | 2026-11-27 |
| https://www.npmjs.com/package/npm?activeTab=versions | npm registry current version 12.2.3 | 2026-11-27 |
| https://pnpm.io/blog?type=releases | pnpm current release 12.23.0 (2026-11-22) | 2026-11-27 |
| https://github.com/oven-sh/bun/releases/tag/bun-v1.4.5 | Bun current release 1.4.5 (2026-11-19) | 2026-11-27 |
| https://github.com/denoland/deno/releases/tag/v2.9.8 | Deno current release 2.9.8 (2026-10-21) | 2026-11-27 |
| https://github.com/nodejs/release | Node.js release/LTS schedule table | 2026-11-27 |
| https://www.pkgpulse.com/guides/nodejs-22-vs-nodejs-24-2026 | Node 22 vs 24 LTS/maintenance status as of Nov 2026 | 2026-11-27 |
| https://vercel.com/kb/guide/does-vercel-support-yarn-4 | Yarn Berry 4.18.0 cited as a current supported release | 2026-11-27 |
</content>
