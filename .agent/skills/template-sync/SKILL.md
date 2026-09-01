---
name: template-sync
description: Keep the create-vexcms templates (`base-nextjs`, `marketing-site`) honest against
  the app they were authored from — apps/test is the source of truth, the templates are
  hand-maintained copies with no extraction layer. Triggers on "add this to the templates",
  "save this to the create templates", "sync templates", "/template-sync". Reads the just-landed
  diff, classifies which template owns it, and applies the app-to-template translation rules
  before reverifying both scaffolds.
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
2. **Identify the just-landed change.** Prefer the current session's context (the diff just
   discussed or applied). Absent that, run `git status --porcelain` then `git diff` against the
   files it lists, scoped to `packages/core/src/**`, `packages/react/src/**`,
   `apps/test/src/**`, and `apps/test/convex/**` — the only trees a template copy is ever sourced
   from. Ignore changes under `.agent/`, `.changeset/`, `scripts/`, and the templates themselves.
3. **Classify ownership.** Decide which template(s) the change belongs in against the
   base-vs-overlay boundary: `templates/base-nextjs` owns auth, the admin panel, media, users,
   providers, env plumbing, and the first-admin bootstrap flow (`convex/vex/firstUser.ts`,
   `WelcomePage.tsx`) — never pages, blocks, themes, or site content.
   `templates/marketing-site` is an overlay applied over base with `overwrite: true` and owns
   pages/headers/footers/themes(+`themeColors`) collections, the `siteSettings` global, the 8
   colocated `blocks/<Name>/{config.ts,index.tsx}`, theme wiring copies (`ThemeStyle`,
   `ThemeLive`, `convex/theme.ts`), `convex/seed.ts`, and the frontend routes/components that
   render them. A file that exists in both trees (rare — e.g. a shared provider) is translated
   into both; grep both template roots for the source file's basename to check before assuming
   single ownership.
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
   - **Regenerate template artifacts when schema/types changed.** If the change touched
     `vex.config.ts`, a collection, a block config, or anything under `packages/core/src/schema`,
     do not hand-edit the template's `convex/_generated/*`, `convex/vex.schema.ts`, or
     `src/vex.types.ts`. Follow the Step 3 procedure: scaffold the affected template to a tmp dir
     via the built installer, run `vex generate` there, then copy the produced artifacts back
     into the template tree.
5. **Verify.** Run `node scripts/scaffold-smoke.mjs --bare` and `node scripts/scaffold-smoke.mjs`
   (full marketing scaffold) — both must exit 0 before the sync is considered done, even when the
   change only touched base files (the marketing overlay is applied on top of base and can
   surface a base regression the bare run alone would miss).
6. **Record.** Append one line to `.agent/docs/harness-changelog.md`: date, the template files
   touched, a one-line summary of the translated change, and the trigger quote (e.g. `"add this
   to the templates"`) — same format as every other harness-changelog entry.
7. **Report.** List every template file added/changed/deleted, grouped by template, and confirm
   both `scaffold-smoke.mjs` runs exited 0. Nothing is synced silently.
