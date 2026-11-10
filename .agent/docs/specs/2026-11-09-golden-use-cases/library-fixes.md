# Library fixes found by the golden-use-case run (plan, awaiting approval)

Decisions (developer, 2026-11-10): **D1** raw Local API server functions require `config` (type
error when omitted; `auth` stays optional and runs as `anonRole`). **D3** the template `env.mjs`
skips validation inside the Convex runtime; lazy component references stay in backlog. **D4**
region-scoped themes (`buildThemeCss` `scope: { selector }`). **D5** scope is bugs + docs gaps only;
unshipped roadmap features are out.

Source: the four local run-throughs (`golden-runthrough.md`), root-caused against monorepo source
2026-11-10. Order = build order: each work package leaves `pnpm typecheck`, `pnpm test`,
`pnpm lint` green; one changeset per package touched (`patch`, P-025). After the last package: publish
the next alpha (human), then the examples drop their workarounds (WP-8).

## WP-1 — Access: owner checks find a relationship's automatic index (`@vexcms/core`)

- Bug: `indexNameFor` (`packages/core/src/access/buildChecks.ts:54-65`) reads only the field's own
  `index` option; a `relationship` field's automatic `by_<field>` index
  (`collections/resolveCollectionIndexes.ts`) is invisible to it, so `indexedOwnerCheck` /
  `ownerPredicateCheck` throw "leads no declared index" unless `index: "by_<field>"` is added by hand.
  The access-control guide (rewritten in Step 3) recommends exactly that call.
- Fix: resolve the field's index through the same `resolveCollectionIndexes` result the schema
  generator uses (one source of truth), not a second `by_${field}` string rule. An index replaced by a
  collection-level entry resolves to that entry's name.
- Tests (`buildChecks.test.ts`): relationship without `index` → range on `by_<field>` with `[user._id]`;
  explicit `index` still wins; a collection-level replacement wins; a plain text field without an
  index still throws.
- Example workaround removed: `index: "by_author"` on `magazine` `articles.author`, the same on
  real-estate `listings.agent`.

## WP-2 — Local API: raw server functions can't silently drop versioning and access (`@vexcms/core`, `create-vexcms`)

- Bug: raw `find`/`get`/`search`/`create`/`update`/`remove` from `@vexcms/core/server` take an
  optional `config` and `auth`. Omit `config` and `requiresPublishedOnly`
  (`versions/statusQueryConstraint.ts:27-35`) can't see `versions.drafts`, so **draft rows are
  returned** (magazine's public queries leaked drafts). Omit `auth` and `hasPermission` resolves the
  caller as `anonRole` (`db/prepareEdit.ts`), so **a custom action is denied for everyone**
  (real-estate `markSold`). The bound `vexServerApi()` injects both (`server.ts:367-373`), but only
  the marketing template ships a bound module (`templates/marketing-site/src/vexcms/api.ts`);
  `base-nextjs`/`--bare` has none, so bare projects reach for the raw functions.
- Fix:
  1. (D1) `config` becomes required on every raw collection/global/version server function (several
     already require it: `listViews`, `saveView`, `deleteVersion`…); omission is a type error.
  2. `base-nextjs` ships `src/vexcms/api.ts` (moved from the marketing overlay, which then inherits it).
  3. Raw functions' JSDoc + `guides/local-api.mdx` § Gotchas: "call the bound API; a raw call without
     `auth` runs as `anonRole`".
- Breaking: type-level for raw callers that omitted `config` (apps/www, apps/test, templates
  audited and fixed in the same WP). Patch changeset with a **Breaking** note.
- Tests: `find/server.test.ts` versioned collection via the bound API without `drafts` → published only;
  `update/server.test.ts` custom action through the bound API with an authed ctx → allowed for the
  owner, denied for another user; scaffold integration test asserts `src/vexcms/api.ts` exists in
  `--bare`.
- Example workarounds removed: magazine's explicit `where vex_status published` + raw `find`;
  real-estate `markSold`'s hand-rolled `resolveGetAuth`.

## WP-3 — Auth: one source for the user table (`create-vexcms` templates, apps)

- Bug: fields added to the `users` collection reach generated `convex/vex.schema.ts` but not the
  hand-written Better Auth `user` table in `convex/schema.ts`, so `Doc<"user">` and the deployed
  schema lack them (magazine bylines needed a hand edit).
- Fix: `convex/schema.ts` uses the generated `user` table export instead of redeclaring it (the
  generated one already carries every Better Auth column + `roles`); same change in apps/www,
  apps/test and both templates. If Better Auth needs indexes the generated table lacks, generation
  emits them from the adapter's collection definition (verify first; no second declaration).
- Tests: `packages/cli` generation test: extend the user collection with `bio`, generated `user`
  export contains `bio`; scaffold smoke: `tsc` passes on a scaffold whose `users.ts` adds a field.
- Docs: `guides/auth.mdx` § Extending the user collection says the field reaches the schema with no
  second edit.

## WP-4 — Config: admin components must not break Convex pushes (`create-vexcms` templates, docs)

- Bug: `convex/vex.ts` → `vex.config.server.ts` → `vex.config.ts` → registered admin components →
  `~/env.mjs`; `createEnv()` runs during the Convex push, where `NEXT_PUBLIC_*` is unset, and every
  `vex dev` push fails ("Invalid environment variables").
- Fix (decision D3): template `src/env.mjs` skips validation inside the Convex runtime (detect a
  Convex-only variable such as `CONVEX_CLOUD_URL`, never set by Next), keeping full validation for
  `next dev`/`next build`; `guides/admin-customization.mdx` states that config-registered components
  are bundled into Convex and must not do server-only work at import time. Lazy component references
  (config holds a module path, not the component) stay in backlog as the structural fix.
- Tests: a unit test on the template env module — with `CONVEX_CLOUD_URL` set and `NEXT_PUBLIC_*`
  unset, importing it does not throw; without `CONVEX_CLOUD_URL`, it throws. (A real `vex dev` push
  can't run in CI without a deployment; WP-8's example re-run covers it end to end.)

## WP-5 — Scaffolder hygiene (`create-vexcms`)

| # | Bug | Fix | Test |
|---|---|---|---|
| a | `.env.example` keeps `localhost:3010` after a custom port (`installers/base.ts` `configurePort` ~204-243) | rewrite `.env.example` like `.env.local`/README | integration: port 3020 → `.env.example` has `:3020` |
| b | `writeAuthSecret()` (~401-413) writes a real secret into `.env.example` | secret only in `.env.local`; `.env.example` keeps `BETTER_AUTH_SECRET=` | integration: `.env.example` secret empty, `.env.local` set |
| c | template `.gitignore` ignores `.env.*` with no `!.env.example` | add the negation (matches root/apps) | smoke: `git check-ignore .env.example` exits 1 |
| d | no `packageManager` field | write the detected `pm@version` from `npm_config_user_agent` | integration with a stubbed user agent |
| e | `npm install` ERESOLVE (`@daveyplate/better-auth-ui@3.4.0` → `@better-auth/passkey@latest` needs `better-auth@^1.7.20`; the pin lives only in `pnpm.overrides`) | mirror the pin into npm `overrides` (and `resolutions` for yarn); versions stay on the catalog's 1.7.18 (DEP owns bumps) | smoke: `npm install --dry-run` in a scaffold exits 0 |
| f | `--bare` keeps `"seed": "convex run seed:init"` with no `convex/seed.ts` | drop `seed` from base; the marketing overlay adds it | integration: bare has no `seed` script |

## WP-6 — React (`@vexcms/react`, marketing template, apps/www)

- `ThemeLive` re-applies the site theme after hydration with the same `:root` specificity as any
  page-level theme, and wins by DOM order (template `ThemeLive.tsx:27-44`, apps/www `:35-53`).
  Fix (decision D4): `buildThemeCss` gains a region scope (`scope: { selector }`) so a page theme
  applies to its own wrapper (`[data-vex-theme="…"]`) instead of competing for `:root`; `ThemeLive`
  stays site-only. Test in `packages/core` color utils: region scope emits the selector; template
  doc in `guides/theming.mdx` § Page-level themes. Restaurant drops its `scope: "admin"` trick.
- `useLivePreviewQuery` (`livePreview/LivePreviewContext.tsx:350-369`): callers cast
  `convexQuery(...) as never` (apps/www `ThemeLive.tsx`, templates, conference). Reproduce in a
  type test (`*.typecheck.ts`, P-008 style) with `convexQuery(api.x.y, args)`; fix the generics so
  it infers without a cast; remove every `as never`.
- Test kit: `runVexReactSuite`'s `custom[].Component` type rejects a real field component
  (`testing/index.ts` `FieldInputComponent`); align it with the real `FieldComponentProps`. Type
  test passes `CheckboxFieldAdmin` without a cast. `convex-test` stays an optional peer; the
  `./testing` barrel JSDoc and the new guide say it is required for that entry point.

## WP-7 — Docs gaps

- `guides/testing.mdx` (new): what the kit runs, `convex-test` devDependency, sections, custom field
  fixtures, access configs, the conference test as the example.
- `guides/deployment.mdx` § OAuth per environment: one OAuth app (or callback URL) per environment,
  ids/secrets set on that environment's Convex deployment.
- `fields/relationship.mdx` § Querying by a relationship: every relationship is stored as a list;
  a single relationship matches with `eq("author", [id])` and is index-pushable (list filters wrap it
  for you); `hasMany` membership can't use an index.
- `fields/select.mdx` + `guides/conditional-fields-and-masks.mdx`: select values (even single) are
  lists; conditions compare `siblingData.season?.[0]` or use `includes`.
- `guides/auth.mdx` § Creating accounts from a script: Better Auth requires an `Origin` header
  matching `SITE_URL`/trusted origins on server-to-server sign-up.
- `guides/local-api.mdx`: bound vs raw (WP-2).

## WP-8 — After the next alpha: examples + spec

- Bump the four examples to the new alpha, remove every workaround listed above, re-run each
  example's run-through rows for the touched areas, re-run CI, push.
- Re-check the two untested rows (real-estate cross-agent "Mark sold"; blocks clipboard).
- Spec sync: correct the spec code that was wrong (seed helper generics, `useQuery` import,
  `useLivePreviewQuery` `[0]`, `convex-test` devDependency, `checkbox` fixture `required`, Origin
  header + Convex-side `DEMO_*` env for seeds, explicit `adminPanel` grants, select-condition arrays,
  bound API instead of raw functions) and fold the run-through into `inventory.md` § Gaps.

## Not in this plan

- Unshipped roadmap features (localization, scheduled publishing, form builder, webhooks, API keys,
  TanStack Start, plugins, brownfield) and geo search: features, not bugs (decision D5).
- Better Auth version bumps (DEP's call).
