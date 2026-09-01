---
status: draft
spec_id: 2026-08-31-wp2-cli-templates
touches:
  - "packages/core/src/schema/**"
  - "packages/cli/src/**"
  - "packages/cli/*.json"
  - "packages/cli/vitest.config.ts"
  - "packages/cli/README.md"
  - "packages/react/src/components/RenderBlocks.tsx"
  - "packages/react/src/components/RenderBlocks.test.tsx"
  - "packages/react/src/index.ts"
  - "packages/create-vexcms/src/**"
  - "packages/create-vexcms/templates/**"
  - "packages/create-vexcms/README.md"
  - "apps/www/**"
  - "apps/test/**"
  - ".changeset/config.json"
  - ".changeset/pre.json"
  - ".agent/docs/standards/**"
  - ".agent/docs/product/tech-stack.md"
  - ".agent/docs/product/dev-processes.md"
  - "scripts/vex-dev.mjs"
  - "scripts/update-www-deps.mjs"
  - "scripts/scaffold-smoke.mjs"
  - "scripts/verify-scaffold.mjs"
  - "pnpm-workspace.yaml"
  - "package.json"
  - ".changeset/*.md"
  - ".agent/skills/template-sync/**"
  - "README.md"
  - "apps/docs/src/content/docs/guides/quickstart*"
prompt_version: 1
---

# 2026-08-31-wp2-cli-templates — Tasks

Parent: `.agent/docs/specs/2026-08-30-launch-readiness/spec.md` § WP-2.
Gated on WP-A + WP-C (both ✅). Absorbs WP-3's rename (Step 0); gates the rest
of WP-3 (generating the new www site) and the live
scaffold demo. All steps `[agent]`; the developer reviews and runs the final
gate before the alpha publish (WP-5).

**Ground truth that reshapes the launch plan's WP-2 list** (verified 2026-08-31):
the CLI is already ported and typechecks — `scripts/vex-dev.mjs` runs
`vex dev` against the app daily. What remains of "port the CLI" is deleting the
vestigial per-collection file generation (`generateCollectionFiles.ts` calls a
core stub `generateCollectionQueries` that returns `{}`; `apps/test/convex/vex/{api,model/api}`
are empty dirs; rebuild's runtime API is factory-registered via `collectionsApi`
et al.). The templates are README stubs; the installer machinery (8 prompts,
base+overlay, `{{PLACEHOLDER}}` substitution) is fully implemented and waiting.

**Interview decisions (2026-08-31):** cut the generation machinery; templates
carry app-side *copies* of the theme wiring (no `themeApi()` extraction — a new
`template-sync` harness skill keeps app→template copies honest instead); port
master's first-admin bootstrap flow; master-parity template split (bare base,
marketing overlay); Roadmap block stays defaults-driven with corrected content
(12 field types); `ogImage` becomes `upload({ to: media })`; `--monorepo` is
catalog-aware; pre-publish verification via packed tarballs; seed fills a
complete home page. **Amended by developer directive (2026-08-31):** D7's
`apps/www` → `apps/test` rename moves from WP-3 into this spec as Step 0, so
the new www can be scaffolded from scratch without overwriting the test app —
every later step reads `apps/test` for paradigms and master's reference for
features.

## Step 0 — Rename `apps/www` → `apps/test` [agent]
Why: the scaffolder must be able to generate the new `apps/www` from scratch
(Step 5's `--monorepo`, WP-3) — impossible while the hand-built app occupies
the path. The app moves unchanged (same Convex deployment, `.env.local`,
sandbox content, port 3020); everything addressing it by name or path is
repointed in the same stroke, including harness globs that would silently stop
matching (cascade-checks: directory rename).
Verify: pnpm install && pnpm build && pnpm typecheck && ! git grep -q "apps/www" -- package.json scripts/vex-dev.mjs .changeset/config.json .agent/docs/standards && harness doctor
- [x] `git mv apps/www apps/test`; `apps/test/package.json` name `"www"` → `"test"`
- [x] Root `package.json` (`dev:app` filter, `clear` paths), `scripts/vex-dev.mjs` (`--cwd`), `.changeset/config.json` (`ignore`), `.changeset/pre.json` (`initialVersions` key), `scripts/update-www-deps.mjs` (repoint; flag for post-launch deletion)
- [x] Harness cascade: `naming-conventions.md` scopes (4 rules + 1 known-inconsistency), `applies_to` globs across `.agent/docs/standards/**`, `tech-stack.md` + `dev-processes.md` rows, non-done specs' `touches:` frontmatter; then `harness sync` + `harness struct`
- [x] `pnpm install` — lockfile importer key moves, nothing else
- [x] Residue check: `git grep "apps/www"` hits only historical docs and WP-3 forward references

## Step 1 — Cut the per-collection generation subsystem from core + cli [agent]
Why: rebuild registers its runtime API through factories (`collectionsApi`,
globals/media factories) — nothing consumes generated `convex/vex/api/*` files
(the dirs are empty, the core generator is a stub returning `{}`), and the one
cli test exercising it is excluded from both vitest and typecheck. Leaving a
second, dead convention contradicts the factory pattern and ships a lie.
Verify: pnpm --filter @vexcms/core --filter @vexcms/cli build && pnpm --filter @vexcms/core --filter @vexcms/cli typecheck && pnpm --filter @vexcms/cli test && node packages/cli/dist/index.js generate --cwd apps/test && git diff --exit-code apps/test/convex/vex.schema.ts apps/test/src/vex.types.ts
- [x] `packages/core/src/schema/generateCollectionQueries.ts` — delete (stub + `GENERATED_HEADER` + `CollectionQueryImports`; no consumers outside the cut)
- [x] `packages/core/src/schema/index.ts` — drop the export line
- [x] `packages/cli/src/lib/generateCollectionFiles.ts` + `generateCollectionFiles.test.ts` — delete
- [x] `packages/cli/src/commands/generate.ts` — drop the `generateAndWriteCollectionFiles` call + imports
- [x] `packages/cli/src/commands/generate.ts` + `src/index.ts` — `vex generate` gains the `--cwd` flag `vex dev` already has (the Verify line depends on it); usage text updated
- [x] `packages/cli/src/lib/generateSchema.ts` — drop the call at the end of `generateAndWrite`
- [x] `packages/cli/vitest.config.ts` — remove the exclude and `passWithNoTests`
- [x] `packages/cli/tsconfig.check.json` — remove both excludes (second one references a file that never existed on this branch)
- [x] `packages/cli/src/lib/resolveConfigPath.test.ts` — new: real tests for the search-dir/extension contract
- [x] `packages/cli/src/lib/resolveConvexUrl.test.ts` — new: env-var precedence + `.env.local` parsing
- [x] `packages/cli/README.md` — remove the per-collection generation claims from the command contract
- [x] Delete the empty `apps/test/convex/vex/api/` + `apps/test/convex/vex/model/` dirs

## Step 2 — `RenderBlocks` in `@vexcms/react`, proven against apps/test [agent]
Why: both templates and the future www site need the block dispatcher; master's
came from `@vexcms/ui`, which no longer exists. Migrating apps/test's
`BlockRenderer` switch to it immediately proves the component against live data
before any template depends on it.
Verify: pnpm --filter @vexcms/react test && pnpm --filter @vexcms/react build && pnpm --filter test typecheck && pnpm --filter test build
- [x] `packages/react/src/components/RenderBlocks.tsx` — new: generic typed dispatch (`components` map keyed by `blockType`, `Extract`-narrowed per entry, `fallback` slot, `block.id` keys)
- [x] `packages/react/src/components/RenderBlocks.test.tsx` — new: dispatch, narrowing, unknown-type fallback, empty/undefined blocks
- [x] `packages/react/src/index.ts` — export `RenderBlocks`, `RenderBlocksProps`, `BlockComponents`, `BlockComponentProps`
- [x] `apps/test/src/app/(frontend)/PageContent.tsx` — replace the `BlockRenderer` switch with `RenderBlocks` (the 9 per-block renderers stay; only dispatch changes; sandbox junk is untouched — it stays in `apps/test` per WP-3)

## Step 3 — Author `templates/base-nextjs` from apps/test [agent]
Why: the bare scaffold (admin + auth + media, no site content) is the foundation
the marketing overlay lands on, and the structural source of truth is apps/test —
not master. The template must re-add the installer's `{{PLACEHOLDER}}` markers
(apps/test carries none) and ship pre-generated artifacts so a clean-dir scaffold
typechecks and builds before `npx convex dev` has ever run.
(Verify scaffolds to a tmp dir via the installer with install/git skipped, then asserts the tree, placeholder substitution, and that no `{{...}}` marker survives — full install/typecheck/build proof lands in Step 7.)
Verify: node scripts/scaffold-smoke.mjs --bare
- [x] `packages/create-vexcms/templates/base-nextjs/**` — authored from apps/test per the spec's translation table (junk stripped; theme system, marketing collections, nav global omitted; `_gitignore`/`_env.example`/`_prettierrc` underscore-renames; `{{PROJECT_NAME}}`, OAuth/org/env placeholders re-added; Better Auth config relocated to `convex/auth/{options.ts,plugins/index.ts}` — the layout the unedited installer machinery targets)
- [x] `scripts/scaffold-smoke.mjs` — new (drives the installer programmatically; the Step 3/4 verification gate); root `package.json` gains a `jiti: catalog:` devDependency for it
- [x] Bootstrap flow ported from master to rebuild APIs: `convex/vex/firstUser.ts` (`isBootstrapped` query + `promoteFirstAdmin` mutation, guarded on zero admins) + `WelcomePage` fallback in the frontend page
- [x] Pre-generated artifacts: `convex/_generated/*` stubs, `convex/vex.schema.ts`, `src/vex.types.ts` produced by scaffolding to tmp and running `vex generate` — not hand-written
- [x] Template `package.json`: literal catalog-resolved versions; `@vexcms/*` at the workspace version (kept current by `scripts/sync-template-versions.mjs`)
- [x] `packages/create-vexcms/src/installers/base.ts` — `.env.local` now gets the generated `BETTER_AUTH_SECRET` and placeholder Convex URL vars so env validation and `new ConvexReactClient(url)` survive a deployment-less build; `SITE_URL` added (missing from apps/test's `.env.example`)
- [x] Template `README.md` — real stand-up sequence: create → `npx convex dev` → paste env vars → `pnpm dev` (+ `vex dev`) → sign up → first admin via bootstrap page

## Step 4 — Author `templates/marketing-site` overlay [agent]
Why: the overlay is what makes `pnpm create vexcms` produce a complete marketing
site — and it is the template WP-3 generates the real apps/www from. Ported from
`.rebuild/reference/create-vexcms-templates/marketing-site` with every API delta
applied, master's draft/preview machinery stripped (versioning is unshipped),
and the theme system copied from apps/test (the WP-C shape: 32-token × light/dark
`themeColors` factory, `ThemeStyle`/`ThemeLive`, `convex/theme.ts`).
(Full scaffold; tree + placeholder assertions; seed file parses; no `object(`, `ui(`, `tabs(`, `imageUrl(`, `richtext(`, `blockStyles`, `_vexDrafts`, scalar select `defaultValue` anywhere in the scaffolded output.)
Verify: node scripts/scaffold-smoke.mjs
- [x] Collections: `pages` (ogImage → `upload({ to: media })`), `headers`, `footers`, `themes` (apps/test shape incl. `themeColors.ts`); globals: `siteSettings` (with `activeTheme`/`adminTheme`)
- [x] 8 colocated blocks `blocks/<Name>/{config.ts,index.tsx}` with deltas: `object()`→`group()` ×9 (Header and Footer each carry two array-item groups; Hero has none), select `defaultValue` array-wrapped ×2, `blockStyles` stripped ×3 (config + the matching component destructures), `ui()` importTheme field cut, `IconPickerField`/`ThemeImportField`/`ThemeImport` cut (icon fields become plain `text()` holding a lucide name)
- [x] Roadmap block defaults corrected: "12 Field Types" with the real list; honest shipped/planned items consistent with WP-4's roadmap corrections
- [x] Draft/preview machinery stripped: no `_vexDrafts` args, no `/preview` routes, no `livePreview` admin config, no `vex_status`/`vex_version` in seed data
- [x] `colorConvert.ts` + `culori` dropped (color field stores oklch verbatim; `buildThemeCss` from core); `ThemeInjector` superseded by `ThemeLive`
- [x] `convex/seed.ts` — idempotent `init` internalMutation seeding: `siteSettings` (activeTheme set), main header, main footer, the 4 tweakcn palettes from apps/test's seed, and a **complete home page** (hero, features, how-it-works, roadmap, faq, cta from block defaults); `pnpm seed` script in template package.json
- [x] Frontend: `RenderBlocks` from `@vexcms/react` everywhere (PageContent, SiteHeader, SiteFooter); no giant switch

## Step 5 — `--monorepo` and `--yes` flags in create-vexcms [agent]
Why: WP-3 generates the real apps/www by running the scaffolder inside this
repo, where P-015 forbids literal versions in manifests — so `--monorepo` must
be catalog-aware. `--yes` (accept defaults, no prompts) is required for the
Step 6/7 automation to drive the CLI at all.
(Runs inside the repo. Root installs link the transient workspace member for the typecheck leg, then re-settle the lockfile after cleanup — monorepo mode skips per-project install by design; the root install owns it.)
Verify: pnpm --filter create-vexcms build && node packages/create-vexcms/dist/index.js scaffold-smoke --monorepo --yes && pnpm install --no-frozen-lockfile && pnpm --filter scaffold-smoke typecheck && rm -rf apps/scaffold-smoke && pnpm install --no-frozen-lockfile
- [x] `packages/create-vexcms/src/index.ts` — `--monorepo` + `--yes` options; `--yes` fills every prompt's default
- [x] `packages/create-vexcms/src/installers/types.ts` — `monorepo`/`yes` on `ProjectOptions`
- [x] `packages/create-vexcms/src/installers/base.ts` — monorepo mode: target `apps/<name>` under the detected workspace root (walk up for `pnpm-workspace.yaml`; error if absent), rewrite `@vexcms/*` deps → `workspace:*`, rewrite every dep present in the host catalog → `catalog:`, keep literals otherwise, skip git init + install (root install owns it)
- [x] `pnpm-workspace.yaml` — add `yaml` to the catalog (workspace-file parsing); `packages/create-vexcms/package.json` picks it up as `catalog:`

## Step 6 — Honest integration tests [agent]
Why: the current suite is falsely green — 20+ cases open with
`if (!fs.existsSync(...)) return;`, so an empty templates dir passes. AP-013:
a gate is proven by making it fail.
(Manual negative gate first: temporarily point the suite at an empty templates dir and confirm it FAILS before restoring.)
Verify: pnpm --filter create-vexcms test
- [x] `packages/create-vexcms/src/__tests__/integration.test.ts` — rewrite: template presence is a hard `beforeAll` failure; scaffold via the installer into tmp (`installDependencies: false`, `initGit: false`) and assert tree, placeholder substitution, package.json protocols, overlay merge, `--bare`, `--monorepo` rewrites
- [x] `fileOperations.test.ts` / `validation.test.ts` — same policy sweep (no silent-return guards anywhere)
- [x] `scripts/scaffold-smoke.mjs` — the Step 3/4 assertion script graduates into being called by the tests (single source of tree truth)

## Step 7 — Packed-tarball demo gate: `scripts/verify-scaffold.mjs` [agent]
Why: the WP-2 demo gate (clean dir: create → install → typecheck → build) must
be provable BEFORE the alphas exist on npm. Packing the 8 publishables and
overriding `@vexcms/*` → `file:` tarballs is the same class of proof WP-0/WP-A
used for consumers, and the script reruns unchanged (minus overrides) after
WP-5 publishes.
(Both `--bare` and full: scaffold outside the repo via `--yes`, apply overrides, pnpm install + typecheck + build, all green. Manual negative test first: break one tarball mapping and confirm exit 1.)
Verify: node scripts/verify-scaffold.mjs
- [x] `scripts/verify-scaffold.mjs` — new: pack publishables to a tmp store (one dir per package per AP-017), scaffold both templates via the built CLI, inject `pnpm.overrides`, run install/typecheck/build per scaffold, report per-template; non-zero exit on any failure
- [x] Root `package.json` — `verify:scaffold` script
- [x] Run the gate for both templates and record the output in the spec

## Step 8 — `template-sync` skill, docs, changesets [agent]
Why: the developer chose template copies over extraction — the skill is the
mechanism that keeps copies from rotting ("add this to the templates" → agent
adapts the just-implemented change into both templates). The quickstart
one-liner was deliberately parked in WP-4 pending this work; changesets must
exist before the WP-5 publish.
(harness doctor must show no new errors; changeset status must show core, cli, react, create-vexcms.)
Verify: harness doctor && pnpm changeset status
- [x] `.agent/skills/template-sync/SKILL.md` — new skill: triggers ("add this to the templates", "save this to the create templates", "sync templates"), reads the just-landed diff, applies the app→template translation table (junk/placeholder/version-protocol rules from this spec), updates both templates + `harness-changelog.md`
- [x] `harness sync` after adding the skill
- [x] Root `README.md` + `apps/docs` quickstart — restore the `pnpm create vexcms@latest` one-liner (replacing WP-4's manual-install stopgap)
- [x] `packages/create-vexcms/README.md` — flags (`--bare`, `--orgs`, `--monorepo`, `--yes`), template inventory, stand-up sequence
- [x] Changesets: `@vexcms/core` (remove dead stub export), `@vexcms/cli` (drop per-collection generation), `@vexcms/react` (RenderBlocks), `create-vexcms` (real templates + flags)
