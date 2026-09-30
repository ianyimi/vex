# Maprios Migration — Roadmap Gap Analysis

> **Re-verified 2026-09-23 against package source at `bf49cd0` (`0.1.0-alpha.23`).**
> Original written 2026-08-21. Every status line below is evidence-backed with a
> `path:line` citation; where the original claimed something was built and it is
> not in the rebuild, the row says so.
>
> **Two framing corrections before reading:**
>
> 1. **The numeric spec scheme is dead.** Spec 07/09c/10/13–19/24/28–29/30.5/34/38/43a–b
>    survive only in `.agent/docs/research/legacy-planning/`. The live track is
>    `v0.1.0-launch-plan.md` specs **A–J** plus date-prefixed dirs under
>    `.agent/docs/specs/`. Mappings below use the live labels.
> 2. **`apps/www` is VexCMS's own marketing site, not maprios.** Its 11 blocks are
>    not maprios ports. The maprios block port (~35–40 configs) is Milestone 2 and
>    has not started.

---

## 1. Corrected baseline — what actually exists today

| Maprios feature | Original claim | Verified state (2026-09-23) | Evidence |
|---|---|---|---|
| Auth (Users, Sessions, Accounts, Verifications) | ✅ built | ✅ **Built** — `@vexcms/better-auth` ships, incl. `anonRoleDatabaseHook` | `packages/better-auth/`, `templates/base-nextjs/convex/auth/options.ts:3` |
| Pages collection with blocks | ✅ built | ✅ **Built** — `blocks()` field, `defineBlock`, `RenderBlocks` | `packages/core/src/fields/blocks/`, `packages/react/src/index.ts:151` |
| Media collection with upload | ✅ built | ✅ **Built** — `defineMediaCollection`, `upload()` field | `apps/www/src/vexcms/collections/images.ts` |
| Draft/published status | ✅ built | ❌ **NOT built** — spec C re-scoped 2026-09-20, 18 task groups, status `draft`, implementation not started | `.agent/docs/specs/2026-09-20-versioning-drafts/`, `v0.1.0-launch-plan.md:64` |
| Access control (read by status) | ✅ built | ◐ **RBAC built, status filter not** — doc-level + field-level RBAC shipped; the `_status` filter lands with C | `packages/core/src/access/`, spec `2026-09-07-field-level-rbac-permissions` (complete) |
| Globals (SiteConfig) | ✅ built | ✅ **Built** — `defineGlobal`; `siteSettings` global live in `apps/www` | `apps/www/src/vexcms/globals/siteSettings.ts` |
| Theme system with color field | ✅ built | ✅ **Built** — `color()` field + `themes`/`themeColors` collections | `packages/core/src/fields/color/`, spec `2026-08-30-wpc-color-field` (complete) |
| Block style controls | ✅ built | ❌ **NOT built** — `BlockAdminConfig` carries only `icon` + `defaultCollapsed` | `packages/core/src/fields/blocks/types.ts:38-57` |
| Live preview | ✅ built | ✅ **Built** — shipped `b5263dc`, 2026-09-20; `postMessage` + `BroadcastChannel`, preview globals + server-resolved URLs in `649cafa` | `packages/react/src/context/LivePreviewContext.tsx`, spec `2026-09-18-live-preview` (complete) |
| Rich text | ✅ built | ❌ **NOT wired** — `packages/richtext-plate` exists but there is no `richtext()` field in the core union. This is spec **D**, not started | `packages/core/src/fields/types.ts:64-76`, `v0.1.0-launch-plan.md:65` |
| Custom admin components | ✅ built | ◐ **Partial** — only `relationship.admin.components.preview` has a slot; there is no general per-field component override | `packages/core/src/fields/relationship/types.ts:34` |
| Icon picker | ✅ built | ❌ **No icon field** — `apps/www` models icons as `text()` holding a Lucide name; `<Icon>` renders them. No picker input | `apps/www/src/vexcms/blocks/HowItWorks/config.ts:25-27`, `packages/react/src/index.ts:149` |
| Form submission collection | 📋 planned | ❌ **Still absent** — no `defineFormCollection`, no form-builder spec anywhere | searched `packages/`, `.agent/docs/specs/` |
| email / textarea field types | 📋 planned | ❌ **Still absent** — deferred out of 0.1.0 as leaf fields | `roadmap.md:61-63` |
| Cross-component auth / multi-component | 📋 planned | ❌ **Still absent** — Milestone 3, deliberately last | `roadmap.md:73-77` |
| Team management, API keys, hooks *system* | 📋 planned | ❌ Team/API-keys absent (post-v1 backlog). **Lifecycle hooks DID ship** (see below) | `roadmap.md:98-102` |

**Field types actually shipped — 12, not "everything":**
`text` · `number` · `checkbox` · `date` · `select` · `url` · `color` · `relationship` ·
`array` · `group` · `blocks` · `upload`
(`packages/core/src/fields/types.ts:64-76`)

**Absent:** `email` · `textarea` · `json` · `richtext` · `icon` · `tabs` · `ui`.

**Shipped since the original analysis and not in it at all:**
lifecycle hooks (`beforeChange`/`beforeDelete` inline, `afterChange`/`afterDelete` on
convex-helpers triggers — `packages/core/src/collections/hooks.ts:83-96`,
`packages/core/src/api/triggers.ts:48-61`) · server-side field validation ·
SEO prerendering + revalidation · the exported React test kit (`@vexcms/react/testing`) ·
the client/server config split (ADR-013) · access constraint builder / index resolution.

---

## 2. The eight gaps, re-statused

### 1. Block group categorization — 🔴 **STILL OPEN, unchanged**

`BlockAdminConfig` exposes `icon` and `defaultCollapsed` only — no `group`
(`packages/core/src/fields/blocks/types.ts:38-57`). `BlockPickerDialog` renders a
flat filtered list with no grouping wrapper (`packages/react/src/components/form/FormBlocks.tsx:90-210`).

Explicitly **deferred out of 0.1.0** (`roadmap.md:61-63`). Still HIGH impact for a
37-variant maprios picker; still LOW effort. Lands in the post-launch quick-wins batch.

### 2. Additional block categories — 🔴 **STILL OPEN; the original table was misread**

`apps/www` and the `marketing-site` template each ship **11 blocks**, and they are
VexCMS's own marketing blocks, not maprios ports:

`Hero` · `Stats` · `Features` · `CodeShowcase` · `Split` · `HowItWorks` · `Roadmap` ·
`FAQ` · `CTA` (page blocks) + `Header` + `Footer` (collection-level)
(`apps/www/src/vexcms/blocks/config.ts`)

`base-nextjs` ships **zero** blocks (`images` + `users` collections only).

So of the maprios categories: **Contact, Gallery, Team, Testimonial, CaseStudy,
Industries, Service/Services, and the 4 Navbar variants do not exist anywhere.**
`Stats` now exists, but as VexCMS's own block, not the maprios one.

Impact unchanged: MEDIUM, pure `defineBlock()` work, no framework feature needed.
This is the bulk of Milestone 2.

### 3. Contact form block — 🔴 **STILL OPEN**

No Contact block, no `contactMethods` array, no form-config group anywhere in
`apps/www` or either template. No `ContactSubmissions` collection —
`apps/www/src/db/constants/index.ts` defines `pages`, `headers`, `footers`, `themes`,
`images`, `users`, `siteSettings` and nothing else.

Blocked on `email()` + `textarea()`, which are not in the field union.

### 4. Public mutation access — 🟡 **PARTIALLY CLOSED**

**Closed:** `anonRole` shipped. `defineAccess({ anonRole })`
(`packages/core/src/access/config.ts:183`) and `hasPermission` falls back when a
caller resolves to zero roles (`packages/core/src/access/hasPermission.ts:235`).
Live in production: `apps/www/src/auth/access.ts:13` (`anonRole: USER_ROLES.user`)
powers anonymous page + media reads. `create` is a first-class matrix action
(`packages/core/src/access/constants.ts:8`), so **unauthenticated create is
expressible today** — grant `create` on the submissions collection to the anon role.

**Still open:** no rate limiting, no honeypot, no spam protection anywhere in the
repo. The only `rateLimit*` identifiers are inert schema columns in the Better Auth
plugin schema (`packages/better-auth/src/pluginSchemas.generated.ts:121-136`) — no
enforcement path. That work was scoped to land with the form builder.

### 5. Admin form row layout — 🟡 **CHANGED — now a dead-config bug, not a missing feature**

`admin.width?: "full" | "half"` is defined (`packages/core/src/fields/baseTypes.ts:243-251`)
but **no React code reads it** — `RenderFieldInputComponents` renders a flat column
(`packages/react/src/components/fields/index.tsx:133-165`). There is still no `row`
concept.

Already tracked: honoring `admin.placeholder` / `admin.width` / `admin.cellAlignment`
is in spec **G** (`v0.1.0-launch-plan.md:699-701`). No new roadmap entry needed.

### 6. Seed data with block content — ✅ **CLOSED**

Both seeds exist and do exactly what the gap asked for — nested arrays and groups
inside block content:
- `apps/www/convex/seed.ts` — 1,599 lines; `THEME_PRESETS` (6 themes) + pages with
  nested Split bullets, HowItWorks steps, FAQ items, Roadmap items, Stats, Features.
- `packages/create-vexcms/templates/marketing-site/convex/seed.ts` — 1,240 lines, same shape.
- `base-nextjs` ships no seed (intentional — no content collections).

The pattern the gap analysis asked the CLI template to demonstrate is shipped.

### 7. Form submission admin table — ⚪ **UNCHANGED — still trivially covered**

Standard `defineCollection` list view. Note that `defaultColumns` is one of the
dead-config items spec **A** is auditing, so verify it is actually read before
relying on it.

### 8. Block defaults / presets — ✅ **CLOSED**

`defaultValue` works on `array()` and `group()` with nested object content
(`packages/core/src/fields/array/types.ts:77`,
`packages/core/src/fields/group/types.ts:96`), and is exercised in production across
every `apps/www` block (e.g. `Header/config.ts:34-39`, `Footer/config.ts:32-38`).
No verification debt left.

---

## 3. Implementation order (decided 2026-08-21) — re-statused

| # | Work | Status 2026-09-23 | Evidence |
|---|---|---|---|
| 1 | Public access (anon read + create) | ✅ **Done** for the access model (`anonRole` shipped, anon read live on `apps/www`). Rate limiting still documentation-only — nothing enforces it | `access/config.ts:183`, `hasPermission.ts:235`, `apps/www/src/auth/access.ts:13` |
| 2 | Versioning / drafts (now spec **C**) | 🔴 **Not started.** Re-scoped 2026-09-20 to 18 task groups; the 2026-08-23 draft (56 tasks) is superseded and kept for design history only | `.agent/docs/specs/2026-09-20-versioning-drafts/`, `v0.1.0-launch-plan.md:17-27` |
| 3 | Live Preview (now spec **E**) | ✅ **Shipped** `b5263dc`, 2026-09-20 — *and it shipped before C, not after.* The original ordering assumption (preview needs drafts) was wrong: the overlay sits on whatever document the consumer's query returned, so C only swaps the base layer | ADR-012, spec `2026-09-18-live-preview` (complete) |
| 4 | TanStack form context port | 🟡 **Built internally, not exported.** `AppForm`, `AppFormContext`, `createFieldInput`, `useCollectionForm`, `useGlobalForm` all exist under `packages/react/src/components/form/` and `src/hooks/`, but **none appear in `packages/react/src/index.ts`** — consumers cannot build their own `appForm` off the VexCMS one yet. The export surface is the remaining work | `packages/react/src/index.ts:98-183` (absent), `components/form/AppForm.tsx`, `hooks/useCollectionForm.ts` |
| 5 | Form Builder | 🔴 **Not started.** No `defineFormCollection`, no spec dir, no `email`/`textarea` fields. Only a "future" roadmap card in the www seed copy | `apps/www/convex/seed.ts:1512-1515` |
| 6 | Quick wins (json field, PDF block, block group categorization) | 🔴 **Not started** — explicitly deferred out of 0.1.0 | `roadmap.md:61-63` |
| 7 | React UI testing framework | ✅ **Shipped.** `@vexcms/react/testing` exports `runVexReactSuite`, `runFieldInputContractSuite`, `runNestedFieldContainerSuite`, `runHooksSuite`, `runRbacStateSuite`, `fieldFixtures`, `renderWithVexProviders` | `packages/react/package.json` exports `./testing`; `packages/react/src/testing/index.ts:158-268` |
| 8 | Publish + migrate www | ◐ **Alphas publishing** — at `0.1.0-alpha.23`, changesets in pre mode. Remaining: `changeset pre exit`, 0.1.0 tag, then the maprios migration. Note `apps/www` (VexCMS's own site) is already built and Payload-free; the *maprios* www migration has not begun | `bf49cd0`, `.changeset/pre.json`, spec `2026-09-01-wp5-publish-alphas` (7 open) |
| 9 | Multi-component (43a → 43b) | 🔴 **Not started**, still deliberately last (Milestone 3) | `roadmap.md:73-77` |

**The order changed in one material way:** the 0.1.0 launch track (`v0.1.0-launch-plan.md`,
A–J) now supersedes this list. Live preview moved ahead of drafts, lifecycle hooks
(**F**) moved ahead of both, and richtext (**D**) / field polish (**G**) / edit view
(**H**) / list view (**I**) / responsive (**J**) were added as launch gates that did
not exist in the 2026-08-21 framing. The form builder and quick wins now sit *after*
the whole A–J track, not inside it.

---

## 4. What actually blocks the maprios migration now

Ordered by what must exist before the maprios content port can start.

**Framework work still required:**

| Item | Why it blocks | Where it lives now |
|---|---|---|
| **Versioning / drafts (C)** | maprios pages carry draft/published status; the README already promises it | spec `2026-09-20-versioning-drafts`, not started |
| **Richtext field (D)** | maprios content is rich text; `richtext-plate` is published but unreachable | launch plan D, not started |
| **`email()` + `textarea()` fields** | contact form cannot be modeled without them | deferred; pull forward with the form builder |
| **Form builder + public-create hardening** | rate limiting / honeypot for the contact endpoint; the access model itself is ready | no spec exists |
| **Block group categorization** | 37+ variants in a flat picker is unusable | quick-wins batch |
| **`admin.width` honoring (G)** | side-by-side field pairs in the contact form config | launch plan G, already scoped |

**Not framework work — pure content porting (Milestone 2):**

~35–40 `defineBlock()` configs + React renderers across the 8 missing categories
(Contact, Gallery, Team, Testimonial, CaseStudy, Industries, Service/Services, plus
the 4 Navbar variants), the `ContactSubmissions` collection, and a maprios seed. The
seed pattern, theme system, globals, media, block defaults, and anon read are all
proven in `apps/www` and copyable.

**Revised bottom line:** the framework covers less than the original "95%" claimed —
drafts, richtext, the icon picker, and block style controls were counted as built and
are not. But three of the eight gaps closed outright (seed data, block defaults,
public access model), one turned into an already-scoped launch-plan item
(`admin.width` → G), and the remaining framework work is fully enumerated above.
