# Golden use cases — feature inventory and coverage matrix

Built 2026-11-09 from the v0.1.0 launch plan's done list, `apps/docs/src/content/docs/**`, the
111 pending changesets in `.changeset/`, `packages/*/CHANGELOG.md`, `packages/cli/src/index.ts`
and `packages/create-vexcms/{src,templates}`. Every doc link below maps to a file that exists under
`apps/docs/src/content/docs/`. Binding for the spec's coverage (Design Decision 4).

## Shipped features

| # | Area | Feature | Doc |
|---|---|---|---|
| F1 | Config | `vex.config.ts` + `vex.config.server.ts` split, `defineConfig`, `defineCollection` | https://docs.vexcms.dev/guides/quickstart/ |
| F2 | Codegen | Convex schema + type generation (`convex/vex.schema.ts`, `src/vex.types.ts`) | https://docs.vexcms.dev/guides/quickstart/ |
| F3 | Globals | `defineGlobal`, global edit view | https://docs.vexcms.dev/guides/globals/ |
| F4 | Fields | `text` | https://docs.vexcms.dev/fields/text/ |
| F5 | Fields | `number` | https://docs.vexcms.dev/fields/number/ |
| F6 | Fields | `checkbox` | https://docs.vexcms.dev/fields/checkbox/ |
| F7 | Fields | `select` | https://docs.vexcms.dev/fields/select/ |
| F8 | Fields | `date` | https://docs.vexcms.dev/fields/date/ |
| F9 | Fields | `url` | https://docs.vexcms.dev/fields/url/ |
| F10 | Fields | `email` | https://docs.vexcms.dev/fields/email/ |
| F11 | Fields | `textarea` | https://docs.vexcms.dev/fields/textarea/ |
| F12 | Fields | `json` | https://docs.vexcms.dev/fields/json/ |
| F13 | Fields | `relationship` | https://docs.vexcms.dev/fields/relationship/ |
| F14 | Fields | `upload` (+ `accept`, width/height) | https://docs.vexcms.dev/fields/upload/ |
| F15 | Fields | `array` | https://docs.vexcms.dev/fields/array/ |
| F16 | Fields | `group` | https://docs.vexcms.dev/fields/group/ |
| F17 | Fields | `blocks` + block clipboard | https://docs.vexcms.dev/fields/blocks/ |
| F18 | Fields | `color` | https://docs.vexcms.dev/fields/color/ |
| F19 | Fields | `richtext` (Plate, inline media images, `@vexcms/richtext-plate/render`) | https://docs.vexcms.dev/fields/richtext/ |
| F20 | Layout fields | `tabs`, `row`, `collapsible` | https://docs.vexcms.dev/fields/tabs/, https://docs.vexcms.dev/fields/row/, https://docs.vexcms.dev/fields/collapsible/ |
| F21 | Layout fields | `ui` (non-persisted component) | https://docs.vexcms.dev/fields/ui/ |
| F22 | Field behaviour | `admin.condition` (client + server), `admin.mask` | https://docs.vexcms.dev/guides/conditional-fields-and-masks/ |
| F23 | Field behaviour | `commitTs()` / auto `updatedAt` | https://docs.vexcms.dev/guides/list-views/ |
| F24 | List view | search, sort, AND/OR filter builder, columns (visibility/order/pin/resize), page size, prerendered first paint | https://docs.vexcms.dev/guides/list-views/ |
| F25 | List view | local + shared saved views (`admin.view` / `admin.views`), saved-view permissions | https://docs.vexcms.dev/guides/list-views/ |
| F26 | List view | peek (Inspect) panel | https://docs.vexcms.dev/guides/list-views/ |
| F27 | List view | row + bulk actions, slot contributions | https://docs.vexcms.dev/guides/list-views/ |
| F28 | List view | pagination, count cap | https://docs.vexcms.dev/guides/pagination/ |
| F29 | Edit view | ⋯ actions menu, unsaved-changes guard, duplicate, create dialog | https://docs.vexcms.dev/guides/admin-customization/ |
| F30 | Edit view | `disableCreate` | https://docs.vexcms.dev/guides/auth/ |
| F31 | Versions | drafts, publish, unpublish, autosave | https://docs.vexcms.dev/guides/versioning-and-drafts/ |
| F32 | Versions | version history + restore | https://docs.vexcms.dev/guides/versioning-and-drafts/ |
| F33 | Live preview | collections: unsaved state on the real route, URL resolvers, origin allowlist, session-cookie gate | https://docs.vexcms.dev/guides/live-preview/ |
| F34 | Live preview | globals | https://docs.vexcms.dev/guides/live-preview/ |
| F35 | Live preview | Draft Mode for never-published documents (`createVexDraftModeRoute`) | https://docs.vexcms.dev/guides/live-preview/ |
| F36 | Media | `defineMediaCollection`, Convex file storage, media library (search, pagination, MIME filter) | https://docs.vexcms.dev/fields/upload/ |
| F37 | Auth | Better Auth, first sign-up becomes admin, email/password | https://docs.vexcms.dev/guides/auth/ |
| F38 | Auth | OAuth providers (create-vexcms prompt) | https://docs.vexcms.dev/guides/auth/ |
| F39 | RBAC | collection/document rules: `withIndex` / `where`, callbacks, booleans | https://docs.vexcms.dev/guides/access-control/ |
| F40 | RBAC | field-level permission maps | https://docs.vexcms.dev/guides/access-control/ |
| F41 | RBAC | `anonRole` read-only public admin | https://docs.vexcms.dev/guides/access-control/ |
| F42 | RBAC | custom actions and resources | https://docs.vexcms.dev/guides/access-control/ |
| F43 | Hooks | `beforeChange`, `beforeDelete` | https://docs.vexcms.dev/guides/lifecycle-hooks/ |
| F44 | Hooks | `afterChange`, `afterDelete` (triggers) | https://docs.vexcms.dev/guides/lifecycle-hooks/ |
| F45 | Validation | async, database-aware `validate()`, `VexError` | https://docs.vexcms.dev/guides/lifecycle-hooks/ |
| F46 | Slots | per-field `Input` overrides, project-wide overrides | https://docs.vexcms.dev/guides/admin-customization/ |
| F47 | Slots | edit-view slots, hiding/wrapping built-in actions, `useVexDocument` | https://docs.vexcms.dev/guides/admin-customization/ |
| F48 | Theming | database-driven themes, `buildThemeCss`, site/admin scope | https://docs.vexcms.dev/guides/theming/ |
| F49 | Front end | Local API: `find`, `get`, `search`, writes, globals, `access.bypass` | https://docs.vexcms.dev/guides/local-api/ |
| F50 | Front end | static prerendering, revalidate route, `sitemap.xml`, `robots.txt`, metadata | https://docs.vexcms.dev/guides/caching-and-seo/ |
| F51 | Front end | Vercel Web Analytics / Speed Insights | https://docs.vexcms.dev/guides/caching-and-seo/ |
| F52 | CLI | `vex dev`, `vex generate` | https://docs.vexcms.dev/guides/quickstart/ |
| F53 | CLI | `vex deploy` | https://docs.vexcms.dev/guides/telemetry/ (only mention today; Step 3 adds https://docs.vexcms.dev/guides/deployment/) |
| F54 | CLI | `vex telemetry status/enable/disable`, `DO_NOT_TRACK` | https://docs.vexcms.dev/guides/telemetry/ |
| F55 | Scaffolder | `create-vexcms`: 8 prompts, `base-nextjs` (`--bare`), `marketing-site` | https://docs.vexcms.dev/guides/quickstart/ |
| F56 | Scaffolder | `--orgs` organizations | https://docs.vexcms.dev/guides/quickstart/ |
| F57 | Scaffolder | `--monorepo`, `--yes` | https://docs.vexcms.dev/guides/quickstart/ |
| F58 | Testing | exported test kit `@vexcms/react/testing`, `@vexcms/next/testing` | none (roadmap line only) |
| F59 | Storage | custom storage adapter interface | https://docs.vexcms.dev/guides/custom-storage-adapter/ |
| F60 | Admin | admin cookies (zero-layout-shift first paint) | https://docs.vexcms.dev/guides/admin-cookies/ |
| F61 | Framework | Next.js adapter (`@vexcms/next`), framework-adapter interface | https://docs.vexcms.dev/guides/framework-adapters/ |

## Not shipped — never faked on camera

| Gap | Tracking |
|---|---|
| Localization | https://github.com/ianyimi/vex/issues/59 |
| Scheduled publishing | https://github.com/ianyimi/vex/issues/63 |
| TanStack Start adapter | https://github.com/ianyimi/vex/issues/64 |
| Form builder (visitor submissions) | https://github.com/ianyimi/vex/issues/57 |
| Outbound webhooks | https://github.com/ianyimi/vex/issues/60 |
| API keys + team management (invites) | https://github.com/ianyimi/vex/issues/53 |
| Brownfield adoption | https://github.com/ianyimi/vex/issues/54 |
| Plugin system | https://github.com/ianyimi/vex/issues/61 |
| Custom admin routes / views | no `backlog.md` entry yet — Step 28 adds one |
| List-view keyboard shortcuts | list-views guide "specced, not shipped" |
| Presence / live cursors | `backlog.md` (off every public surface, cross-spec edge) |
| S3 / R2 storage adapters | no `backlog.md` entry yet (closest: "Multi-adapter media collections") — Step 28 adds one |

## Coverage matrix

● carries the feature on camera (5- or 15-min script and a shot); ○ also present in the build.
M = magazine (scenario 1), R = real-estate, C = conference, F = restaurant.

| Feature | M | R | C | F |
|---|---|---|---|---|
| Template | `--bare` | `--bare` | marketing | marketing |
| F1, F2, F52 config + codegen + `vex dev`/`generate` | ● | ● | ● | ● |
| F4, F7, F8, F11, F13 text/select/date/textarea/relationship | ● | ○ | ○ | ○ |
| F19 richtext | ● | | ○ (speaker bios) | |
| F5, F9, F10 number/url/email + F22 masks | | ● | | ○ (price) |
| F22 conditional fields | | ● (sale/rent) | | ○ (seasonal) |
| F20 tabs/row/collapsible | | ● | | ○ |
| F15, F16 array/group | | ○ (open houses) | ○ (venue group) | ● (menu) |
| F17 blocks + clipboard | | | ● (landing) | ○ |
| F18 color, F48 themes | | | ○ | ● (per brand) |
| F12 json, F6 checkbox, F21 ui | | | ● | ○ |
| F14, F36 upload/media + dimensions + `accept` | ○ | ● (gallery) | ○ | ○ |
| F3 globals, F34 global live preview | | | ● (eventSettings) | ● (hours banner) |
| F24–F26 list view, saved views, peek | ○ | ● | | |
| F27, F42 bulk + custom actions, F25 saved-view permissions | | ● (Mark sold) | | |
| F28 pagination, F49 search | ○ | ● | | |
| F31, F32 drafts, autosave, restore | ● | | | ○ |
| F33 collection live preview, F35 Draft Mode | ● | | ○ | ○ (menus) |
| F39 owner rule (`withIndex`) | ● (author = user) | ● (agents) | | |
| F40 field-level permission maps | ○ (featured) | ● (commission) | | |
| F41 `anonRole` read-only admin | | | ● | |
| F43, F45 `beforeChange` / `validate()` | ● (slug unique) | ● (MLS unique) | ● (room/slot clash) | |
| F44, F43 `afterChange` / `beforeDelete` / `afterDelete` | | ○ | ● (counts, delete guard) | |
| F46, F47 `Input` override / edit + list slots | ○ (header action) | ○ (bulk) | | ● (price preview) |
| F29, F30 duplicate, unsaved guard, create dialog, `disableCreate` | ○ | | | ● (duplicate menu) |
| F49, F50 Local API front end, prerender, revalidate, sitemap | ● | ○ | ● | ○ |
| F51 Vercel Analytics | | | ○ | |
| F37 first sign-up admin, user-collection extension | ● (bylines) | ○ | ○ | ○ |
| F38 OAuth (GitHub) | | | ● | |
| F54 `vex telemetry status` | | ○ | | |
| F58 test kit | | | ○ | |
| F53 `vex deploy` + Vercel production | ● | ● | ● | ● |
| F55 `create-vexcms` | ● | ● | ● | ● |
| F60 admin cookies, F61 Next adapter | ○ | ○ | ○ | ○ |
| Launch day served | D2–D5 | D4 alt | D3/D4 alt | D2 alt |

### Listed exceptions (shipped, not demoed)

| Feature | Why not | Where it lands |
|---|---|---|
| F56 `--orgs` | Organizations without invites (#53) can't be shown honestly end to end | `use-case-backlog.md` → Agency multi-client |
| F59 custom storage adapter | Guide-only extension point; no S3/R2 adapter exists to demo | `use-case-backlog.md` → needs S3/R2 adapters |
| F57 `--monorepo`, `--yes` | Examples are independent folders (Design Decision 5); scenario answers are typed live, not defaulted | none — revisit if a monorepo example is added |

## Gaps found while specifying (each lands in Step 28's bookkeeping)

| Gap | Evidence | Disposition |
|---|---|---|
| No deployment guide | `vex deploy` appears only in `guides/telemetry.mdx`; Vercel only in `caching-and-seo.mdx` § analytics | fixed by Steps 3–4 |
| Scaffold README says `npx convex deploy`; no `vex:deploy` script | `templates/base-nextjs/README.md` § Deployment, `templates/base-nextjs/package.json` | fixed by Step 4 |
| `vex deploy` parses no flags (ignores `--cwd`, no `--cmd`) and times out at 120 s | `packages/cli/src/index.ts` parser, `commands/deploy.ts` `deployCommand()`, `lib/convexProcess.ts` `deployToProduction` | fixed by Step 3 |
| No test-kit guide | no docs page for `@vexcms/react/testing` | `backlog.md` entry |
| `--bare` keeps `"seed": "convex run seed:init"` with no `convex/seed.ts` | `templates/base-nextjs/package.json`, `create-vexcms` integration test `marketingOnly` list | confirm in Step 6; `backlog.md` entry |
| npm `@vexcms/react` `alpha` dist-tag lags (alpha.33 while alpha.34 exists) | `npm view @vexcms/react dist-tags` 2026-11-09 | Step 6 precondition checks every `@vexcms/*` tag reads alpha.35 |
| No geo / map search for listings | Local API `search` is text-only | real-estate gap callout; `use-case-backlog.md` + `backlog.md` entry |
| `access-control.mdx` owner example compares `ix.eq("authorId", user._id)` against a relationship field stored as an id array | `packages/core/src/access/buildChecks.ts` relationship branch + its test | fixed by Step 3 (docs); examples use `indexedOwnerCheck`/`ownerPredicateCheck` |
| Array-relationship index `.eq()` semantics undocumented (`sessions.speakers`) | no doc or example | confirm on first conference build; note in `fields/relationship.mdx` → `backlog.md` |
| Single relationships stored as one-item lists, so owner rules compare `[id]` | `normalizeArrayStoredWhere` (`packages/core/src/db/queryArgs.ts`), `indexedOwnerCheck` | assessed, not a gap for indexing; plain-id storage → `backlog.md` (decision 23) |
| Deployment guide doesn't cover per-environment OAuth apps | `guides/deployment.mdx` (Step 3) | decided in conference Step 21; guide edited in that step |
