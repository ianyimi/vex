---
name: template-sync
description: Keep the create-vexcms templates (`base-nextjs`, `marketing-site`) honest against
  the apps they were authored from — `apps/www` is the source of truth for the marketing
  overlay and `apps/test` for base; the templates are hand-maintained copies with no
  extraction layer. Triggers on "add this to the templates", "save this to the create
  templates", "sync templates", "/template-sync". Diffs the app against the templates,
  classifies which template owns each change, and applies the app-to-template translation
  rules before reverifying both scaffolds.
harness_model_role: default
---

# Template Sync

## Preflight
1. If `.agent/manifest.json` is missing → stop; tell the user to run `harness init`.
2. Run `harness doctor`. Fix 🔴 errors before proceeding.
3. Run `harness state` and read the output.

## Steps
1. **Load the reference.** Read the app→template translation table in
   `.agent/docs/specs/2026-08-31-wp2-cli-templates/spec.md` before touching anything — it is the
   authoritative source-path → template-path → edit mapping this skill applies. Never invent a
   mapping the spec already states; if the just-landed change has no entry, extend the table in
   the spec first (small addition, same format) rather than guessing an ad hoc translation.
2. **Identify the drift.** Run `node scripts/template-diff.mjs --app apps/www` (and
   `--app apps/test` when base plumbing changed). It reports three buckets against the
   *effective* template file — the overlay's copy wins when a path exists in both, because
   that is what a marketing scaffold actually receives:
   - `MISSING` — in the app, in no template. A candidate addition.
   - `CHANGED` — in both, contents differ. A candidate sync.
   - `ORPHANED` — in a template, absent from the app. A candidate deletion, and frequently
     correct as-is: base deliberately ships files the marketing overlay drops.

   The script is advisory and never writes; ownership and translation stay this skill's
   call. Cross-check against the current session's context (the diff just applied) — the
   script cannot tell an intentional customisation from an unsynced fix.
3. **Classify ownership.** Decide which template(s) the change belongs in against the
   base-vs-overlay boundary: `templates/base-nextjs` owns auth, the admin panel, media, users,
   providers, env plumbing, and the first-admin bootstrap flow (`convex/vex/firstUser.ts`,
   `WelcomePage.tsx`) — never pages, blocks, themes, or site content.
   `templates/marketing-site` is an overlay applied over base with `overwrite: true` and owns
   pages/headers/footers/themes(+`themeColors`) collections, the `siteSettings` global, the
   colocated `blocks/<Name>/{config.ts,index.tsx}`, theme wiring copies (`ThemeStyle`,
   `ThemeLive`, `convex/theme.ts`), `convex/seed.ts`, `src/proxy.ts`, `src/app/globals.css`,
   `src/app/layout.tsx`, and the frontend routes/components that render them. A file that
   exists in both trees is translated into whichever tree owns it — grep both template roots
   for the basename before assuming single ownership, and remember the overlay's copy is the
   one a marketing scaffold receives.

   **The overlay cannot delete.** `overlayTemplate` only adds and overwrites. Anything that
   requires removing a base file, or editing `package.json`, belongs in
   `VexFrameworkInstaller.finalizeMarketingOverlay()` — that is where base's
   `(frontend)/page.tsx` is removed (it collides with the overlay's `(site)/page.tsx` on `/`)
   and where marketing-only dependencies are added so `--bare` does not pay for them.
4. **Apply the translation rules** to every touched file, in this order:
   - **Strip sandbox junk.** Debug-only routes, `apps/test` fixtures, and dev-console scaffolding
     never cross into a template — apps/test and apps/test are allowed to carry junk a shipped
     scaffold is not.
   - **Preserve `{{...}}` installer markers.** Before overwriting a template file wholesale, diff
     it against its last-known translation to recover any `{{PROJECT_NAME}}` / OAuth / org / env
     markers and underscore-renamed dotfiles (`_gitignore`, `_env.example`, `_prettierrc`, …) it
     carries — cross-check the exact marker names against
     `packages/create-vexcms/src/installers/{base,nextjs,providers,string-utils}.ts`, the source
     of truth for what the installer substitutes. A marker silently dropped from a template is a
     scaffold that ships literal `{{PROJECT_NAME}}` in a user's project.
   - **Version protocol (Contract 5).** Third-party dependency versions in a template
     `package.json` are literals copied from the resolved `pnpm-workspace.yaml` catalog entry;
     `@vexcms/*` dependencies pin to the current workspace package version. Never write
     `catalog:` or `workspace:` into a template file — those protocols apply only during
     `--monorepo` rewriting. Re-run `node scripts/sync-template-versions.mjs` rather than
     hand-editing a version string.
   - **Prohibited-pattern sweep.** Grep every translated file for `object(`, `ui(`, `tabs(`,
     `imageUrl(`, `richtext(`, `admin.blockStyles`, a scalar (non-array) `select`
     `defaultValue`, `_vexDrafts`, `livePreview`, `vex_status`/`vex_version`, and any
     per-instance `admin.components.Field` — none may survive translation. These are current-API
     violations or unshipped-feature (versioning/drafts) leftovers, not stylistic nits.
   - **Regenerate every template artifact when schema/types changed.** If the change touched
     `vex.config.ts`, a collection, a block config, or anything under `packages/core/src/schema`
     or `packages/core/src/fields`, do not hand-edit the template's generated files. All three
     move together — `convex/_generated/*`, **`convex/vex.schema.ts`**, and `src/vex.types.ts`.
     Missing `vex.schema.ts` is the easy mistake: it carries the `select` literal unions, so a
     stale copy fails a fresh scaffold's typecheck with an unassignable status value while
     `vex.types.ts` looks correct. Either copy all three from the source app after running
     `vex generate` there, or scaffold to a tmp dir, run `vex generate`, and copy back.
5. **Verify.** Run `node scripts/scaffold-smoke.mjs --bare` and `node scripts/scaffold-smoke.mjs`
   (full marketing scaffold) — both must exit 0 before the sync is considered done, even when the
   change only touched base files (the marketing overlay is applied on top of base and can
   surface a base regression the bare run alone would miss).
6. **Record.** Append one line to `.agent/docs/harness-changelog.md`: date, the template files
   touched, a one-line summary of the translated change, and the trigger quote (e.g. `"add this
   to the templates"`) — same format as every other harness-changelog entry.
7. **Report.** List every template file added/changed/deleted, grouped by template, and confirm
   both `scaffold-smoke.mjs` runs exited 0. Nothing is synced silently.
