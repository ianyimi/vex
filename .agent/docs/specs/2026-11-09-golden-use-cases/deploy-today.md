# Live deployments — TODAY (developer, 2026-11-11)

The developer has a VC meeting tomorrow and wants all four examples live today as demos.
Sequence agreed in session (do not lose across compaction):

1. Developer finishes reviewing restaurant (:3230, in progress).
2. Developer publishes the next alpha (alpha.38) with every queued monorepo fix (lock rows, populate
   RBAC + nested populate, admin lockout, first-publish, topbar/UserDisplay, select popup, row slots,
   toolbar selection, media-table overflow, sidebar skeletons + theme toggle, form-error scroll,
   `dependsOn`, type gaps).
3. GU (this session) then, per example in `~/Documents/Projects/vex-examples` (ONE repo, each
   subfolder its own Vercel app + its own Convex project/creds — the developer's chosen shape):
   - bump to alpha.38, remove remaining alpha.37 workarounds (conference room-clash triple-validate →
     `dependsOn`; restaurant `resolveBlockImages` → nested populate; hand-written `Populated*` types;
     real-estate `.env.local` points at the wrong deployment — fix when relinking), verify locally;
   - Convex prod: developer creates 4 Convex projects (or GU may create via CLI if the developer
     grants it — ask) `vex-example-<slug>`; `npx convex env set SITE_URL/<auth vars> --prod`;
     Also on the bump: replace hand-rolled seed array-item ids with `assignArrayItemIds` (it IS exported
     from `@vexcms/core` via `fields/array/utils`); restaurant PriceInput can render `renderDefault`
     either way once the stable-identity fix ships; masked numbers left-align in the library now.
     `pnpm vex:deploy --cmd 'pnpm build'` runs via Vercel build;
   - Vercel: 4 projects `vexcms-example-<slug>`, one repo `ianyimi/vex-examples`, each with
     Root Directory = `<slug>/`, build command `pnpm vex:deploy --cmd 'pnpm build'`,
     `CONVEX_DEPLOY_KEY` (Production scope, per project) + env per `guides/deployment.mdx`;
     developer creates projects/tokens, GU verifies builds + seeds;
   - prod seed + `demo:accounts` against prod, then `npx convex env set AUTH_DISABLE_SIGN_UP true --prod`
     (developer signs up FIRST on each prod site to become admin before lockdown);
   - README live-demo links (Step 26 shape: root "Live demos" table + per-app REVIEW/README links),
     `live-check.yml` enabled;
   - golden-runthrough prod rows, spec Steps 11/17/21/25 verify/done, board GU rows.
4. Meeting-prep extras: confirm read-only public admin works on conference prod (anonRole), magazine
   author/editor flow rehearsal from playbooks.

Constraints: deploy guide `apps/docs/.../guides/deployment.mdx` is the verbatim script; fix guide
deviations in the monorepo as found. OAuth (conference GitHub) optional for tomorrow — skip unless
the developer creates the app.
