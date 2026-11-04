---
status: draft
spec_id: 2026-11-02-www-live-demo-admin-content
touches:
  - apps/www/src/db/constants/index.ts
  - apps/www/src/components/TestimonialFeatureRowAction.tsx
  - apps/www/src/components/TestimonialBulkApproveAction.tsx
  - apps/www/src/vexcms/collections/**
  - apps/www/src/vex.config.ts
  - apps/www/src/auth/access.ts
  - apps/www/convex/seed.ts
  - apps/www/convex/vex.schema.ts
prompt_version: 1
---

# 2026-11-02-www-live-demo-admin-content — Spec

## Overview

`apps/www`'s `/admin` already opens for anonymous visitors (Polish — anonymous admin access:
`src/proxy.ts` `guardAdminRequest`, `app/(vexcms)/admin/[[...path]]/page.tsx`, and
`AdminDemoButton` as a plain link), but the demo they land in shows only the site's own
chrome collections. This spec fills it with content worth demoing: a port of `apps/test`'s
proven `testimonials` list-view showcase, two new marketing-friendly collections (`products`,
`leads`) that together with `pages` exercise every field type except `richtext` (deferred
until launch item D's Plate upgrade lands), demo-role field-level read restrictions with the
hidden-filter badge, `admin.views` column presets, and idempotent seed
data (200 testimonials). Launch plan § S ("Harden the live demo",
`.agent/docs/product/v0.1.0-launch-plan.md:1681`) hardens this surface separately — its
cleanup cron, rate limits, and direct-call attack checks are referenced, not duplicated here.

## Design Decisions

1. **Port `testimonials` from `apps/test` near-verbatim** (`apps/test/src/vexcms/collections/testimonials.ts`,
   the list-view-overhaul Step 24 acceptance collection) — it is the verified showcase of
   `commitTs` `updatedAt` sort, pinned/resized/hidden columns, `searchFields`,
   index-pushdown select sorting, relationship fields, 3 `admin.views` presets (including the
   hidden-`where` "Needs Review"), and row/bulk action contributions. Deviations: contribution
   ids are `www.testimonials.*` (project-prefixed like `test.testimonials.*`), and imports
   resolve against `apps/www`'s constants (`TABLE_SLUG_USERS = "user"`, same value).
2. **Two new collections, `products` and `leads`, complete the field-type matrix.** Coverage
   of the field types across the demo: `pages` already has `blocks` + `upload`;
   `testimonials` brings `text`, `textarea`, `number`, `select`, `checkbox`, `relationship`;
   `products` adds `date`, `color`, `url`, `email`, `json`, `group`, `array`,
   `upload`; `leads` re-exercises `email`/`date`/`number`/`textarea` as the hidden-field
   showcase. Layout helpers (`tabs`/`row`/`collapsible`/`ui`) stay in `apps/test`'s
   kitchen-sink `fields` collection. That is 15 of the 16 data field types the www Stats
   block advertises (`apps/www/convex/seed.ts` "16 field types") — see decision 3 for the
   missing one.
3. **No `richtext()` yet (developer decision 2026-11-02):** `products.description` ships as
   `textarea()` now, so www takes no `@vexcms/richtext-plate` dependency and no
   `editor: plateEditor()` while launch item D steps 6–8 (Plate upgrade, dogfood) are open.
   Follow-up recorded in Out of Scope: swap to `richtext()` after D completes, mirroring
   `apps/test/src/vex.config.ts:47`.
4. **The demo role is the existing `user` role — no new role.** `access.ts` already pins
   `anonRole: USER_ROLES.user` and grants `user` `adminPanel.access` (`src/auth/access.ts:28,40`);
   the proxy and admin page already skip the session redirect when `anonRole` grants panel
   access. A signed-in non-admin gets the identical read-only surface, which is correct for a
   marketing site with exactly two roles. (`apps/test` uses a separate `guest` role because it
   has four real roles to contrast; www doesn't.)
   **Already exists / needs adding:**
   - Exists: `anonRole` wiring, `adminPanel.access: true` for `user`, default-deny posture
     (P-007), `pages`/`themes`/`images`/`siteSettings` read-only entries, anonymous admin
     gates in `proxy.ts` + `admin/[[...path]]/page.tsx`, `AdminDemoButton` plain link,
     `anonymousClient()` in `auth/client.tsx`.
   - Needs adding: `resources` entries and `user`-role permissions for `testimonials`,
     `products`, `leads` (with `readViews`) plus `headers`/`footers` read-only (developer
     decision 2026-11-02), the field-level read maps, and a `user`-collection read map.
5. **Hidden fields, both kinds (developer decision 2026-11-02):** per-role field read
   restrictions — `testimonials.internalScore`, `leads.email`/`score`/`internalNotes`, and
   `user.*` except `name` are unreadable for the demo role — AND `admin.views` column presets
   with different columns/pins. Two preset views carry a hidden `where` on a field the demo
   role cannot read (`testimonials` "Needs Review" on `internalScore`, `leads` "Hot Leads" on
   `score`), so the demo visitor sees the hidden-filter badge (the declared-filter read
   exemption, `composeSavedListViewWhere` / `matchDeclaredSavedListViewFilter`).
6. **`user` collection gets a `{ name: true }` read map for the demo role** so the
   `contributorId` relationship cell resolves its title (`useAsTitle: "name"`) without
   exposing emails or any other Better Auth field of real accounts.
7. **`readViews: true` on all three new collections** so the preset tabs render for the demo
   visitor; `createView`/`updateView`/`deleteView` stay denied by the role's `"*": false`
   (view actions are collection-level booleans — `packages/core/src/access/constants.ts`
   `VIEW_ACTIONS`).
8. **Preset-view `where` nodes only use shapes proven in `apps/test`**: checkbox `eq`,
   number `lt`/`gte`, relationship `neq null` (`FilterOp = "eq" | "gt" | "gte" | "lt" |
   "lte" | "neq"`, `packages/core/src/access/queryConstraintTypes.ts:26`). No preset ships
   filtering a `select` field — selects store single-value arrays (`source: ["website"]` in
   both seeds) and no existing view filters one. Developer decision 2026-11-02: Step 6
   verifies live whether `{ field: "status", op: "eq", value: "won" }` matches the
   array-stored select; a "Won" leads preset is added only if it does, otherwise the finding
   is recorded here.

   **Finding (Step 6, verified live as the anonymous demo role, 2026-11-03):** it does not
   match. Filtering Testimonials on `{ field: "source", op: "eq", value: "website" }` (same
   array-stored-select shape) via `?filter=(source.eq.website)` returns "No testimonials
   match all of these filters" even though multiple visible rows carry the `Website` source
   badge. The identical probe on Leads, `?filter=(status.eq.won)`, returns "No leads match
   all of these filters" against a seeded dataset with multiple `Won`-status rows visible in
   the unfiltered list (seed cycles 5 statuses evenly across 60 rows ⇒ 12 expected `won`
   rows, 0 returned). `eq` evidently compares the filter value against the whole stored
   array rather than testing membership, so it can never match a single-value array. No
   "Won" preset was added to `leads.ts`; the array-membership gap applies to every `select`
   field in this spec (`testimonials.source`, `products.status`, `leads.source`/`status`)
   and is out of scope for this spec to fix (a query-engine change, not a collection
   config). Relatedly, `with-contributor`'s shipped `{ field: "contributorId", op: "neq",
   value: null }` (a relationship field, also array-stored) shows the same symptom from the
   other direction: it returns all 200 testimonials instead of excluding the ~1/3 with an
   empty `contributorId` array, because `[]` is never `=== null`. Worth a follow-up ticket
   against the filter/query-constraint engine; not actioned here.

   **Resolution (follow-up, verified live 2026-11-03):** fixed at the core
   where→query translation. Root cause: `select`/`relationship`/`upload`
   fields always store `v.array(...)` regardless of `hasMany`
   (`packages/core/src/fields/{select,relationship,upload}/validator.ts`),
   but a `where` leaf's `value` compares ONE value (Decision 50) — an
   unwrapped `eq "won"` compared a bare string against the stored array and
   never matched. New `normalizeArrayStoredWhere` (`packages/core/src/db/queryArgs.ts`)
   runs in `find`/`search` before `resolveQueryIndex`'s pushdown and before
   `.filter()` compilation: a `hasMany: false` field's `eq`/`neq` leaf is
   wrapped in a one-element array (`eq "won"` → `eq ["won"]`, still
   index-pushable — Convex compares an array-valued `eq` by content in both
   an index range and a `.filter()` expression); an empty check on ANY
   array-stored field (`isEmpty`/`isNotEmpty`'s `value: undefined` wire form,
   or an explicit `value: null` leaf like `with-contributor`'s) is rewritten
   to match the stored empty array OR a legacy field-missing document.
   `matchDeclaredSavedListViewFilter` normalizes a declared view's `where`
   the same way before comparing, so the Decision 26 trusted-filter
   exemption still recognizes a config view's own array-stored-field filter.
   `hasMany: true` fields are explicitly OUT of scope — a membership/
   "contains" test has no sound `eq`/`neq` rewrite, and no post-read filter
   stage in `find`/`search` keeps pagination/count correct for a
   majority-excluding predicate (`readableDocuments`'s own under-fill is
   tolerated only because an RBAC drop is rare; a `hasMany` "contains" filter
   would drop routinely and often fill most of a page). Re-verified live:
   `?filter=(status.eq.won)` on Leads returns the 12 `won` rows;
   `?filter=(source.eq.website)` on Testimonials matches the `Website`-source
   rows; the "From Contributors" preset and apps/test's filter-builder UI on
   a `select` field (`articles.status`) both filter correctly. A "Won" leads
   preset was added to `leads.ts` (`viewId: "won"`) now that the underlying
   bug is fixed.
9. **Seed style follows both precedents in one file**: the new sections are deterministic
   batch inserts, insert-if-missing by total count and mode-independent (`apps/test/convex/seed.ts`
   testimonials section), appended to `runSeed` before its return — the main www sections'
   per-document insert/patch reconcile stays untouched. Unlike `apps/test`, the www seed must
   NOT throw when no user exists (www seeds on a fresh deployment before first sign-in —
   `FirstAdminBootstrap`); `contributorId` is simply left empty until an admin exists and
   `seed:reinit` is NOT needed for it (the testimonials section is count-gated, so re-running
   after sign-up only fills contributors on a wiped table — documented in the section comment).
10. **Row/bulk actions are permission-gated project contributions**: ported components call
    `usePermission` on `testimonials.update`, so the anonymous visitor sees neither — itself a
    demo that contributions respect the access matrix (server re-checks regardless).
11. **`products.description` (textarea, decision 3) is seeded** like every other text field —
    the earlier richtext variant had to ship unseeded because no seed pins the Plate document
    storage shape; that constraint returns with the post-D swap.
12. **Prerequisite, not a task:** the root-level `@auth` parallel/intercepting route move is
    being done in `apps/test` now. Implementation of this spec waits until the developer
    confirms the `apps/test` root `@auth` modal AND it is ported to `apps/www`. This spec
    never touches `src/app/**`, but the demo entry flow (`AdminDemoButton` → `/admin`,
    sign-in interception) must be re-verified on the post-move tree.

## Out of Scope

- Launch plan § S's other items: anonymous-user cleanup cron, per-IP sign-in rate limits,
  read-only-under-attack direct-call verification, Convex sizing, graceful degradation.
- The `@auth` root-level route move itself (prerequisite, separate work).
- `marketing-site` template sync (launch item N picks up `apps/www` changes wholesale).
- New public-site pages or blocks — the demo content is admin-panel-only; the marketing
  pages don't render `products`/`leads`/`testimonials`.
- Responsive/mobile pass (launch item J).
- Versioning/drafts on the new collections (pages already demos drafts).
- Swapping `products.description` to `richtext()` — follow-up after launch item D (Plate
  upgrade) completes: add `@vexcms/richtext-plate`, `editor: plateEditor()`
  (mirroring `apps/test/src/vex.config.ts:47`), change the field, and decide the seeded value.

## Implementation

### Step 1 — Demo-collection constants [agent]

- [ ] `apps/www/src/db/constants/index.ts` — table slugs + option maps

#### apps/www/src/db/constants/index.ts

1 edit; everything not shown is unchanged.

**1 — demo collection constants.** Append after the existing
`GLOBAL_SLUG_SITE_SETTINGS` export:

```ts
// Live-demo admin content
export const TABLE_SLUG_TESTIMONIALS = "testimonials" as const
export const TABLE_SLUG_PRODUCTS = "products" as const
export const TABLE_SLUG_LEADS = "leads" as const

/** Where a testimonial was collected from — indexed (`by_source`) for sorted/filtered list queries. */
export const TESTIMONIAL_SOURCES = {
  website: "website",
  import: "import",
  survey: "survey",
  referral: "referral",
} as const

export const PRODUCT_STATUSES = {
  draft: "draft",
  active: "active",
  archived: "archived",
} as const

export const LEAD_SOURCES = {
  website: "website",
  referral: "referral",
  event: "event",
  outbound: "outbound",
} as const

export const LEAD_STATUSES = {
  new: "new",
  contacted: "contacted",
  qualified: "qualified",
  won: "won",
  lost: "lost",
} as const
```

Verify: `pnpm --filter www typecheck`

### Step 2 — Testimonial list-action components [agent]

Ports of `apps/test/src/components/{TestimonialFeatureRowAction,TestimonialBulkApproveAction}.tsx`
with www import paths, `www.`-prefixed contribution ids in the doc comments, and www's
prettier style (no semicolons). `testimonials.ts` (Step 3) imports both.

- [ ] `apps/www/src/components/TestimonialFeatureRowAction.tsx`
- [ ] `apps/www/src/components/TestimonialBulkApproveAction.tsx`

#### apps/www/src/components/TestimonialFeatureRowAction.tsx

```tsx
"use client"

import { useMutation } from "convex/react"
import { toast } from "sonner"
import { CRUD_ACTIONS, PERMISSION_SCOPES, vexConvexApi, type TDocument } from "@vexcms/core"
import { DropdownMenuItem, Icon, usePermission } from "@vexcms/react"

import { TABLE_SLUG_TESTIMONIALS } from "~/db/constants"

/** Same shape as `@vexcms/react`'s internal `ListRowSlotProps` — one row for `list.row.actions`. */
interface TestimonialRowActionProps {
  docs: TDocument[]
}

/**
 * `www.testimonials.feature` — a project `list.row.actions` contribution, ported from
 * `apps/test`'s list-view showcase. Toggles `featured` on a single testimonial via the
 * generic `update` mutation, respecting `access`: gated client-side on the `testimonials`
 * `update` permission (the server re-checks on every call regardless — this is UX, not the
 * security boundary), so the anonymous demo visitor never sees it.
 */
export function TestimonialFeatureRowAction(props: TestimonialRowActionProps) {
  const doc = props.docs[0]
  const canUpdate = usePermission({
    resource: TABLE_SLUG_TESTIMONIALS,
    action: CRUD_ACTIONS.update,
    scope: PERMISSION_SCOPES.any,
  })
  const update = useMutation(vexConvexApi.update)

  if (!doc || !canUpdate) return null

  const isFeatured = doc.featured === true

  return (
    <DropdownMenuItem
      onClick={() => {
        void update({
          collection: TABLE_SLUG_TESTIMONIALS,
          id: doc._id,
          data: { featured: !isFeatured },
        })
          .then(() => {
            toast(isFeatured ? "Removed from Featured." : "Marked as Featured.")
          })
          .catch(() => {
            toast.error("Could not update this testimonial.")
          })
      }}
    >
      <Icon name="Star" />
      {isFeatured ? "Unfeature" : "Feature"}
    </DropdownMenuItem>
  )
}
```

#### apps/www/src/components/TestimonialBulkApproveAction.tsx

```tsx
"use client"

import { useMutation } from "convex/react"
import { useState } from "react"
import { toast } from "sonner"
import { CRUD_ACTIONS, PERMISSION_SCOPES, vexConvexApi, type TDocument } from "@vexcms/core"
import { Button, usePermission } from "@vexcms/react"

import { TABLE_SLUG_TESTIMONIALS } from "~/db/constants"

/** Same shape as `@vexcms/react`'s internal `ListRowSlotProps` — every selected row for `list.bulkActions`. */
interface TestimonialBulkActionProps {
  docs: TDocument[]
}

/**
 * `www.testimonials.bulkApprove` — a project `list.bulkActions` contribution, ported from
 * `apps/test`'s list-view showcase. Sets `approved: true` on every selected, not-yet-approved
 * testimonial via the generic `update` mutation, one call per row (no bespoke server
 * endpoint). Gated client-side on the `testimonials` `update` permission and renders nothing
 * with no selection — same convention as the built-in `vex.list.bulk.delete`.
 */
export function TestimonialBulkApproveAction(props: TestimonialBulkActionProps) {
  const canUpdate = usePermission({
    resource: TABLE_SLUG_TESTIMONIALS,
    action: CRUD_ACTIONS.update,
    scope: PERMISSION_SCOPES.any,
  })
  const update = useMutation(vexConvexApi.update)
  const [isApproving, setIsApproving] = useState(false)

  const unapproved = props.docs.filter((doc) => doc.approved !== true)

  if (props.docs.length === 0 || !canUpdate) return null

  return (
    <Button
      variant="outline"
      size="sm"
      icon="Check"
      disabled={isApproving || unapproved.length === 0}
      onClick={() => {
        setIsApproving(true)
        void Promise.all(
          unapproved.map((doc) =>
            update({ collection: TABLE_SLUG_TESTIMONIALS, id: doc._id, data: { approved: true } })
          )
        )
          .then(() => {
            toast(`Approved ${unapproved.length} testimonial${unapproved.length === 1 ? "" : "s"}.`)
          })
          .catch(() => {
            toast.error("Could not approve the selected testimonials.")
          })
          .finally(() => {
            setIsApproving(false)
          })
      }}
    >
      Approve
    </Button>
  )
}
```

Verify: `pnpm --filter www typecheck`

### Step 3 — Collections, config registration, schema generation [agent]

- [ ] `apps/www/src/vexcms/collections/testimonials.ts`
- [ ] `apps/www/src/vexcms/collections/products.ts`
- [ ] `apps/www/src/vexcms/collections/leads.ts`
- [ ] `apps/www/src/vexcms/collections/index.ts` — barrel additions
- [ ] `apps/www/src/vex.config.ts` — `collections` registration
- [ ] Run `pnpm --filter www vex:generate`; commit the regenerated `convex/vex.schema.ts` and
      type output

#### apps/www/src/vexcms/collections/testimonials.ts

Port of `apps/test/src/vexcms/collections/testimonials.ts` (verbatim field/view config,
www imports, P-017 icon/labels kept):

```ts
import { checkbox, defineCollection, number, relationship, select, text, textarea } from "@vexcms/core"

import { TestimonialBulkApproveAction } from "~/components/TestimonialBulkApproveAction"
import { TestimonialFeatureRowAction } from "~/components/TestimonialFeatureRowAction"
import { TABLE_SLUG_IMAGES, TABLE_SLUG_TESTIMONIALS, TABLE_SLUG_USERS, TESTIMONIAL_SOURCES } from "~/db/constants"

/**
 * Live-demo list-view showcase, ported from `apps/test`'s proven Step 24 acceptance
 * collection (list-view-overhaul): 200 seeded rows exercising every list-view behavior
 * in one place.
 *
 * - `admin.view.sort` — `updatedAt` desc, the auto-injected `commitTs()` field.
 * - `admin.view.columns` — `customerName` pinned left plus explicit widths.
 * - `admin.view.searchFields` — `customerName` + `company`, each declaring its own
 *   `searchIndex` (required by `validateSavedListViewConfig`).
 * - `source` — indexed (`by_source`) + `enableSorting: true` (index pushdown).
 * - `admin.views` — 3 presets: `featured` (own pinned column entry), `with-contributor`
 *   (relationship-filtered), `needs-review` (hidden `where` on `internalScore`, a field
 *   the demo role cannot read — the hidden-filter badge demo, `~/auth/access.ts`).
 * - `www.testimonials.*` — project row/bulk action contributions, permission-gated.
 */
export const testimonials = defineCollection({
  slug: TABLE_SLUG_TESTIMONIALS,
  interfaceName: "Testimonial",
  labels: {
    singular: "Testimonial",
    plural: "Testimonials",
  },
  admin: {
    useAsTitle: "customerName",
    icon: "Quote",
    view: {
      sort: { field: "updatedAt", order: "desc" },
      searchFields: ["customerName", "company"],
      columns: [
        { field: "customerName", pinned: "left", width: 220 },
        { field: "company", width: 180 },
        { field: "rating", width: 90 },
        { field: "source", width: 130 },
        { field: "featured", width: 100 },
        { field: "approved", width: 100 },
        { field: "contributorId", width: 180 },
        { field: "updatedAt", width: 170 },
        { field: "quote", hidden: true },
        { field: "internalScore", hidden: true },
        { field: "avatar", hidden: true },
      ],
      bulkActions: { delete: true },
    },
    views: [
      {
        viewId: "featured",
        name: "Featured",
        description: "Testimonials flagged for homepage display — pins Rating on the right.",
        state: {
          where: { field: "featured", op: "eq", value: true },
          columns: [
            { field: "customerName", pinned: "left", width: 220 },
            { field: "company", width: 180 },
            { field: "quote" },
            { field: "source", width: 130 },
            { field: "rating", pinned: "right", width: 90 },
          ],
        },
      },
      {
        viewId: "with-contributor",
        name: "From Contributors",
        description: "Testimonials linked to a known contributor account.",
        state: {
          where: { field: "contributorId", op: "neq", value: null },
          columns: ["customerName", "company", "contributorId", "source", "updatedAt"],
        },
      },
      {
        viewId: "needs-review",
        name: "Needs Review",
        description: "Low internal quality score — hidden from the demo role.",
        state: {
          where: { field: "internalScore", op: "lt", value: 50 },
          columns: ["customerName", "company", "rating", "source", "updatedAt"],
        },
      },
    ],
    components: {
      rowActions: [{ id: "www.testimonials.feature", component: TestimonialFeatureRowAction }],
      bulkActions: [{ id: "www.testimonials.bulkApprove", component: TestimonialBulkApproveAction }],
    },
  },
  fields: {
    customerName: text({
      label: "Customer Name",
      required: true,
      searchIndex: { name: "search_testimonials_customer_name", filterFields: [] },
      description: "Who gave the testimonial.",
    }),
    company: text({
      label: "Company",
      searchIndex: { name: "search_testimonials_company", filterFields: [] },
      description: "Customer's company, when given.",
    }),
    quote: textarea({
      label: "Quote",
      required: true,
      description: "The testimonial text itself.",
    }),
    rating: number({
      label: "Rating",
      required: true,
      min: [1, "Rating must be at least 1."],
      max: [5, "Rating cannot exceed 5."],
      description: "1-5 star rating.",
    }),
    source: select({
      label: "Source",
      required: true,
      index: "by_source",
      admin: { enableSorting: true },
      options: [
        { label: "Website", value: TESTIMONIAL_SOURCES.website },
        { label: "Import", value: TESTIMONIAL_SOURCES.import },
        { label: "Survey", value: TESTIMONIAL_SOURCES.survey },
        { label: "Referral", value: TESTIMONIAL_SOURCES.referral },
      ],
      description: "Where this testimonial was collected from — indexed for sorted/filtered list queries.",
    }),
    featured: checkbox({
      label: "Featured",
      description: "Pinned to the homepage testimonials section.",
    }),
    approved: checkbox({
      label: "Approved",
      description: "Reviewed and cleared for public display.",
    }),
    contributorId: relationship({
      label: "Contributor",
      collection: {
        slug: TABLE_SLUG_USERS,
      },
      description: "The internal user who submitted/collected this testimonial, when known.",
    }),
    avatar: relationship({
      label: "Avatar",
      collection: {
        slug: TABLE_SLUG_IMAGES,
      },
      description: "Customer headshot, shown in the peek panel.",
    }),
    internalScore: number({
      label: "Internal Score",
      admin: { position: "sidebar" },
      description: "Internal quality score (0-100). Not visible to the demo role.",
    }),
  },
})
```

#### apps/www/src/vexcms/collections/products.ts

New marketing collection covering the field types `testimonials`/`pages` don't:
`date`, `color`, `url`, `email`, `json`, `group`, `array`, `upload`. Two
`admin.views` column presets with different pins; preset `where`s stay on the proven
checkbox shape (Design Decision 8). Fully readable for the demo role — the contrast case
to `leads`.

```ts
import {
  array,
  checkbox,
  color,
  date,
  defineCollection,
  email,
  group,
  json,
  number,
  select,
  text,
  textarea,
  upload,
  url,
} from "@vexcms/core"

import { PRODUCT_STATUSES, TABLE_SLUG_IMAGES, TABLE_SLUG_PRODUCTS } from "~/db/constants"

/**
 * Demo catalog collection — exercises the field types the other demo collections
 * don't (`date`, `color`, `url`, `email`, `json`, `group`, `array`,
 * `upload`), plus two column-preset views with different pins. Every field is
 * readable by the demo role: the contrast case to `leads`' hidden fields.
 */
export const products = defineCollection({
  slug: TABLE_SLUG_PRODUCTS,
  interfaceName: "Product",
  labels: {
    singular: "Product",
    plural: "Products",
  },
  admin: {
    useAsTitle: "name",
    icon: "Package",
    view: {
      sort: { field: "updatedAt", order: "desc" },
      searchFields: ["name"],
      columns: [
        { field: "name", pinned: "left", width: 220 },
        { field: "tagline", width: 240 },
        { field: "status", width: 120 },
        { field: "price", width: 100 },
        { field: "launchedOn", width: 140 },
        { field: "updatedAt", width: 170 },
        { field: "website", hidden: true },
        { field: "brandColor", hidden: true },
        { field: "supportEmail", hidden: true },
      ],
      bulkActions: { delete: true },
    },
    views: [
      {
        viewId: "catalog",
        name: "Catalog",
        description: "Everything that is not archived, launch date first.",
        state: {
          where: { field: "archived", op: "eq", value: false },
          columns: [
            { field: "name", pinned: "left", width: 220 },
            { field: "tagline", width: 260 },
            { field: "launchedOn", width: 140 },
            { field: "status", width: 120 },
            { field: "website", width: 200 },
          ],
        },
      },
      {
        viewId: "pricing",
        name: "Pricing",
        description: "Price pinned right for quick scanning.",
        state: {
          where: { field: "archived", op: "eq", value: false },
          columns: [
            { field: "name", pinned: "left", width: 220 },
            { field: "status", width: 120 },
            { field: "supportEmail", width: 200 },
            { field: "price", pinned: "right", width: 100 },
          ],
        },
      },
    ],
  },
  fields: {
    name: text({
      label: "Name",
      required: true,
      searchIndex: { name: "search_products_name", filterFields: [] },
      description: "Product name.",
    }),
    tagline: text({
      label: "Tagline",
      description: "One-line pitch shown in list views.",
    }),
    description: textarea({
      label: "Description",
      description: "Long-form product description. Swaps to richtext() after launch item D.",
    }),
    status: select({
      label: "Status",
      required: true,
      index: "by_status",
      admin: { enableSorting: true },
      options: [
        { label: "Draft", value: PRODUCT_STATUSES.draft },
        { label: "Active", value: PRODUCT_STATUSES.active },
        { label: "Archived", value: PRODUCT_STATUSES.archived },
      ],
      description: "Catalog lifecycle state — indexed for sorted/filtered list queries.",
    }),
    archived: checkbox({
      label: "Archived",
      description: "Hidden from the Catalog and Pricing views.",
    }),
    price: number({
      label: "Price",
      min: [0, "Price cannot be negative."],
      description: "Monthly price in USD.",
    }),
    launchedOn: date({
      label: "Launched On",
      time: { hidden: true },
      description: "Public launch date.",
    }),
    website: url({
      label: "Website",
      description: "Public product page.",
    }),
    supportEmail: email({
      label: "Support Email",
      description: "Where customers reach this product's team.",
    }),
    brandColor: color({
      label: "Brand Color",
      format: "oklch",
      description: "Accent color used in marketing material.",
    }),
    heroImage: upload({
      to: TABLE_SLUG_IMAGES,
      label: "Hero Image",
      admin: { position: "sidebar" },
    }),
    highlights: array({
      label: "Highlights",
      items: group({
        label: "Highlight",
        fields: {
          title: text({ label: "Title", required: true }),
          detail: text({ label: "Detail" }),
        },
      }),
    }),
    specs: group({
      label: "Specs",
      fields: {
        sku: text({ label: "SKU" }),
        weightGrams: number({ label: "Weight (g)" }),
      },
    }),
    metadata: json({
      label: "Metadata",
      description: "Arbitrary integration metadata blob.",
    }),
  },
})
```

#### apps/www/src/vexcms/collections/leads.ts

New hidden-fields showcase: `email`, `score`, and `internalNotes` exist for admins and are
denied to the demo role in Step 4. The "Hot Leads" preset's hidden `where` filters on
`score` — unreadable for the demo role → hidden-filter badge, the second instance beside
testimonials' "Needs Review".

```ts
import { checkbox, date, defineCollection, email, number, select, text, textarea } from "@vexcms/core"

import { LEAD_SOURCES, LEAD_STATUSES, TABLE_SLUG_LEADS } from "~/db/constants"

/**
 * Demo CRM collection — the hidden-fields showcase. `email`, `score`, and
 * `internalNotes` are readable only by admins (`~/auth/access.ts`); the "Hot Leads"
 * preset filters on `score`, so the demo role sees the hidden-filter badge on that
 * tab and never the filter's value.
 */
export const leads = defineCollection({
  slug: TABLE_SLUG_LEADS,
  interfaceName: "Lead",
  labels: {
    singular: "Lead",
    plural: "Leads",
  },
  admin: {
    useAsTitle: "fullName",
    icon: "Inbox",
    view: {
      sort: { field: "updatedAt", order: "desc" },
      searchFields: ["fullName", "company"],
      columns: [
        { field: "fullName", pinned: "left", width: 200 },
        { field: "company", width: 180 },
        { field: "source", width: 130 },
        { field: "status", width: 120 },
        { field: "score", width: 90 },
        { field: "followUpOn", width: 140 },
        { field: "subscribed", width: 110 },
        { field: "updatedAt", width: 170 },
        { field: "email", hidden: true },
        { field: "internalNotes", hidden: true },
      ],
      bulkActions: { delete: true },
    },
    views: [
      {
        viewId: "hot-leads",
        name: "Hot Leads",
        description: "Score 80+ — the score itself is hidden from the demo role.",
        state: {
          where: { field: "score", op: "gte", value: 80 },
          columns: ["fullName", "company", "source", "status", "followUpOn"],
        },
      },
      {
        viewId: "newsletter",
        name: "Newsletter",
        description: "Leads who opted into the newsletter.",
        state: {
          where: { field: "subscribed", op: "eq", value: true },
          columns: [
            { field: "fullName", pinned: "left", width: 200 },
            { field: "company", width: 180 },
            { field: "source", width: 130 },
            { field: "followUpOn", width: 140 },
            { field: "updatedAt", width: 170 },
          ],
        },
      },
    ],
  },
  fields: {
    fullName: text({
      label: "Full Name",
      required: true,
      searchIndex: { name: "search_leads_full_name", filterFields: [] },
      description: "The lead's name.",
    }),
    company: text({
      label: "Company",
      searchIndex: { name: "search_leads_company", filterFields: [] },
      description: "The lead's company, when known.",
    }),
    email: email({
      label: "Email",
      required: true,
      description: "Contact email. Not visible to the demo role.",
    }),
    source: select({
      label: "Source",
      required: true,
      index: "by_source",
      admin: { enableSorting: true },
      options: [
        { label: "Website", value: LEAD_SOURCES.website },
        { label: "Referral", value: LEAD_SOURCES.referral },
        { label: "Event", value: LEAD_SOURCES.event },
        { label: "Outbound", value: LEAD_SOURCES.outbound },
      ],
      description: "How this lead found us — indexed for sorted/filtered list queries.",
    }),
    status: select({
      label: "Status",
      required: true,
      options: [
        { label: "New", value: LEAD_STATUSES.new },
        { label: "Contacted", value: LEAD_STATUSES.contacted },
        { label: "Qualified", value: LEAD_STATUSES.qualified },
        { label: "Won", value: LEAD_STATUSES.won },
        { label: "Lost", value: LEAD_STATUSES.lost },
      ],
      description: "Pipeline stage.",
    }),
    score: number({
      label: "Score",
      min: [0, "Score cannot be negative."],
      max: [100, "Score cannot exceed 100."],
      admin: { position: "sidebar" },
      description: "Internal lead score (0-100). Not visible to the demo role.",
    }),
    internalNotes: textarea({
      label: "Internal Notes",
      admin: { position: "sidebar" },
      description: "Private sales notes. Not visible to the demo role.",
    }),
    followUpOn: date({
      label: "Follow Up On",
      time: { hidden: true },
      description: "Next scheduled touchpoint.",
    }),
    subscribed: checkbox({
      label: "Subscribed",
      description: "Opted into the newsletter.",
    }),
  },
})
```

#### apps/www/src/vexcms/collections/index.ts

1 edit; everything not shown is unchanged. Keep the barrel alphabetized:

```ts
export * from "./footers"
export * from "./headers"
export * from "./images"
export * from "./leads"
export * from "./pages"
export * from "./products"
export * from "./testimonials"
export * from "./themeColors"
export * from "./themes"
export * from "./users"
```

#### apps/www/src/vex.config.ts

2 edits; everything not shown is unchanged.

**1 — imports.** Widen the collections barrel import:

```ts
import { footers, headers, images, leads, pages, products, testimonials, themes, users } from "~/vexcms/collections"
```

**2 — collections registration.** Replace the existing `collections:` array entry:

```ts
collections: [users, pages, headers, footers, themes, testimonials, products, leads],
```

Verify: `pnpm --filter www typecheck`; the regenerated `apps/www/convex/vex.schema.ts`
contains `testimonials`, `products`, `leads` tables with `by_source`, `by_status`, the
auto-generated `by_contributorId`/`by_avatar`/`by_heroImage` relationship indexes, and the
five declared search indexes.

### Step 4 — Access: anonymous demo role, read-only + hidden fields [dev]

The security boundary of the live demo. The anonymous wiring itself already exists
(`anonRole: USER_ROLES.user`, `adminPanel.access`, the proxy/page gates — Design Decision 4);
this step only adds the new resources and their `user`-role permissions, read-only
`headers`/`footers` (developer decision 2026-11-02), the field-level read maps, and the
`user`-collection title map.

- [ ] `apps/www/src/auth/access.ts` — resources + demo-role entries, incl. `headers`/`footers` read-only

#### apps/www/src/auth/access.ts

3 edits; everything not shown is unchanged.

**1 — imports.** Widen the collections import:

```ts
import { footers, headers, images, leads, pages, products, testimonials, themes, users } from "~/vexcms/collections"
```

**2 — resources.** Replace the existing `resources:` entry:

```ts
resources: [images, users, pages, siteSettings, themes, headers, footers, testimonials, products, leads],
```

**3 — demo-role permissions.** Inside `permissions[USER_ROLES.user]`, after the existing
`images: readOnly` entry (the `siteSettings` entry stays last, unchanged):

```ts
// ── Live-demo content (anonymous visitors resolve to this role via `anonRole`).
// Read-only is enforced server-side by default-deny (P-007), not by hiding buttons.
// `readViews` makes the preset tabs visible; createView/updateView/deleteView stay
// denied by `"*": false` (view actions are collection-level booleans).
//
// Testimonials: every public field EXCEPT `internalScore` — the "Needs Review"
// preset's hidden `where` filters on exactly that field, so this role sees the
// hidden-filter badge on that tab and never the filter's own value.
testimonials: {
  "*": false,
  read: () => ({ "*": true, internalScore: false }),
  readViews: true,
},
// Headers/Footers: read-only, so the demo visitor can browse the site-chrome
// collections (incl. `headers`' live-preview config) — developer decision 2026-11-02.
headers: readOnly,
footers: readOnly,
// Products: fully readable — the contrast case proving the UI hides exactly the
// denied fields elsewhere, nothing more.
products: {
  "*": false,
  read: true,
  readViews: true,
},
// Leads: the hidden-fields showcase — contact email, lead score, and sales notes
// are admin-only. "Hot Leads" filters on `score` → hidden-filter badge.
leads: {
  "*": false,
  read: () => ({ "*": true, email: false, score: false, internalNotes: false }),
  readViews: true,
},
// Users: name only, so `contributorId` relationship cells resolve their title
// (`useAsTitle: "name"`) without exposing emails or any other Better Auth field.
user: {
  "*": false,
  read: () => ({ name: true }),
},
```

Verify: `pnpm --filter www typecheck && pnpm --filter www test` — `src/vexcms/admin.test.ts`'s
shell suite validates the real `access` config through the real `VexConfigProvider`.

### Step 5 — Seed: demo rows [agent]

- [ ] `apps/www/convex/seed.ts`

#### apps/www/convex/seed.ts

2 edits; everything not shown is unchanged.

**1 — imports.** Extend the existing `~/db/constants` import:

```ts
import {
  GLOBAL_SLUG_SITE_SETTINGS,
  LEAD_SOURCES,
  LEAD_STATUSES,
  PRODUCT_STATUSES,
  TABLE_SLUG_FOOTERS,
  TABLE_SLUG_HEADERS,
  TABLE_SLUG_LEADS,
  TABLE_SLUG_PAGES,
  TABLE_SLUG_PRODUCTS,
  TABLE_SLUG_TESTIMONIALS,
  TABLE_SLUG_THEMES,
  TABLE_SLUG_USERS,
  TESTIMONIAL_SOURCES,
} from "~/db/constants"
```

**2 — demo sections.** Inside `runSeed`, after the roadmap-page section and immediately
before `return { created, patched, skipped }`:

```ts
// ── Live-demo admin content ──────────────────────────────────────────────
// Deterministic batch inserts, insert-if-missing by total count and
// mode-independent (`"patch"` never reconciles these — there is no natural
// per-row identifier, and the demo only needs the rows to exist once),
// matching apps/test/convex/seed.ts's testimonials section. Unlike apps/test
// this never throws when no user exists yet: www seeds a fresh deployment
// before first sign-in, so `contributorId` stays empty until the table is
// wiped and re-seeded after an admin account exists.
const demoUsers = await ctx.db.query(TABLE_SLUG_USERS).take(2)
const contributorIds = demoUsers.map((user) => user._id)

// Testimonials: 200 rows — enough for count, pagination, and filters. Varied on
// every axis the collection config exercises: `source` rotates through all 4
// values (index pushdown), `rating` 1-5, `featured`/`approved` each true for
// roughly 1 in 3 rows (row/bulk actions + the "Featured" preset have something
// to act on), `contributorId` set for 2 of 3 rows when users exist ("From
// Contributors"), `internalScore` spans 10-99 with every 4th row under 50
// ("Needs Review", the hidden-where preset).
const existingTestimonials = await ctx.db.query(TABLE_SLUG_TESTIMONIALS).take(1)
if (existingTestimonials.length > 0) {
  skipped.push("testimonials (already seeded)")
} else {
  const sources = Object.values(TESTIMONIAL_SOURCES)
  const companies = [
    "Northwind",
    "Acme Robotics",
    "Globex",
    "Initech",
    "Umbrella Labs",
    "Hooli",
    "Soylent",
    "Stark Industries",
  ]
  const names = [
    "Alex Rivera",
    "Jordan Lee",
    "Sam Patel",
    "Morgan Chen",
    "Taylor Brooks",
    "Casey Nguyen",
    "Riley Okafor",
    "Jamie Fischer",
    "Drew Tanaka",
    "Avery Costa",
  ]
  for (let i = 0; i < 200; i++) {
    const name = names[i % names.length]
    await ctx.db.insert(TABLE_SLUG_TESTIMONIALS, {
      customerName: `${name} ${i}`,
      company: companies[i % companies.length],
      quote: `Testimonial #${i} — switching to VexCMS cut our admin workflow time dramatically.`,
      rating: (i % 5) + 1,
      source: [sources[i % sources.length]],
      featured: i % 3 === 0,
      approved: i % 3 !== 1,
      contributorId:
        contributorIds.length === 0 || i % 3 === 2 ? [] : [contributorIds[i % contributorIds.length]],
      internalScore: 10 + ((i * 7) % 90),
    })
  }
  created.push("testimonials x200")
}

// Products: a small catalog. Every 5th product is archived (the "Catalog"/
// "Pricing" presets filter on `archived`).
const existingProducts = await ctx.db.query(TABLE_SLUG_PRODUCTS).take(1)
if (existingProducts.length > 0) {
  skipped.push("products (already seeded)")
} else {
  const productNames = [
    "Atlas CMS",
    "Beacon Forms",
    "Cascade Search",
    "Drift Analytics",
    "Ember Mail",
    "Flux Media",
    "Granite Auth",
    "Harbor Docs",
    "Ion Preview",
    "Junction Sync",
  ]
  for (let i = 0; i < productNames.length; i++) {
    const isArchived = i % 5 === 4
    await ctx.db.insert(TABLE_SLUG_PRODUCTS, {
      name: productNames[i],
      tagline: `Everything ${productNames[i].split(" ")[0]} does, typed end to end.`,
      description: `${productNames[i]} pairs a typed collection definition with a generated Convex schema and a real-time admin panel.`,
      status: [isArchived ? PRODUCT_STATUSES.archived : i % 5 === 0 ? PRODUCT_STATUSES.draft : PRODUCT_STATUSES.active],
      archived: isArchived,
      price: 9 + (i % 4) * 10,
      launchedOn: Date.UTC(2026, i % 12, (i % 27) + 1),
      website: `https://example.com/${productNames[i].toLowerCase().replace(/\s+/g, "-")}`,
      supportEmail: `support+${i}@example.com`,
      brandColor: `oklch(${55 + (i % 5) * 8}% 0.15 ${(i * 36) % 360})`,
      highlights: [
        { title: "Typed schema", detail: "Generated from the collection definition." },
        { title: "Real-time admin", detail: "Convex subscriptions out of the box." },
      ],
      specs: { sku: `VEX-${1000 + i}`, weightGrams: 120 + i * 5 },
      metadata: { tier: i % 2 === 0 ? "standard" : "plus", sortHint: i },
    })
  }
  created.push("products x10")
}

// Leads: 60 rows — a second paginated collection. `score` spans 10-99 with a
// stable fraction at 80+ ("Hot Leads", the hidden-where preset the demo role
// cannot read), `subscribed` true for every 2nd row ("Newsletter").
const existingLeads = await ctx.db.query(TABLE_SLUG_LEADS).take(1)
if (existingLeads.length > 0) {
  skipped.push("leads (already seeded)")
} else {
  const leadSources = Object.values(LEAD_SOURCES)
  const leadStatuses = Object.values(LEAD_STATUSES)
  const leadNames = [
    "Priya Sharma",
    "Diego Alvarez",
    "Mei Watanabe",
    "Omar Haddad",
    "Ingrid Olsen",
    "Kofi Mensah",
    "Lucia Romano",
    "Noah Becker",
  ]
  const leadCompanies = [
    "Wayne Enterprises",
    "Tyrell Corp",
    "Cyberdyne",
    "Aperture",
    "Black Mesa",
    "Wonka Industries",
  ]
  for (let i = 0; i < 60; i++) {
    await ctx.db.insert(TABLE_SLUG_LEADS, {
      fullName: `${leadNames[i % leadNames.length]} ${i}`,
      company: leadCompanies[i % leadCompanies.length],
      email: `lead${i}@example.com`,
      source: [leadSources[i % leadSources.length]],
      status: [leadStatuses[i % leadStatuses.length]],
      score: 10 + ((i * 13) % 90),
      internalNotes: i % 3 === 0 ? `Met at conference booth, follow up re: migration #${i}.` : undefined,
      followUpOn: Date.UTC(2026, i % 12, (i % 27) + 1),
      subscribed: i % 2 === 0,
    })
  }
  created.push("leads x60")
}
```

Verify: `pnpm --filter www typecheck`. Then, from a terminal against the dev deployment
(never start a server — P-024; the developer's `convex dev` is already running): run
pnpm seed and confirm the report lists `testimonials x200`, `products x10`, `leads x60`
under `created`; run it a second time and confirm all three appear under `skipped`.

### Step 6 — Verification

- [ ] `pnpm --filter www typecheck && pnpm --filter www test`
- [ ] Select-`eq` probe (Design Decision 8, developer decision 2026-11-02): as admin, apply a
      manual filter `status` = `won` on Leads. If it matches the array-stored select
      (`status: ["won"]`), add a "Won" preset to `leads.ts` (`viewId: "won"`, `where:
      { field: "status", op: "eq", value: "won" }`, columns `["fullName", "company", "score",
      "updatedAt"]`) and re-verify its tab; if it does not, record the finding in this spec's
      Design Decision 8 and ship without the preset.
- [ ] Manual browser walkthrough (below, § Verification)

## Verification

Run the project checks:

- `pnpm --filter www typecheck`
- `pnpm --filter www test`
- `pnpm --filter www build`

Manual browser walkthrough, against the developer's running dev servers (www on port 3030 —
P-024, attach, never start):

**Anonymous (the demo role):** open the site in a private window, click the header's Admin
link without signing in.

1. `/admin` renders the dashboard — no redirect to sign-in, no session cookie minted.
2. The sidebar lists Pages, Headers, Footers, Themes, Images, Site Settings, Testimonials,
   Products, Leads — and no create buttons anywhere. Headers and Footers open read-only
   (developer decision 2026-11-02).
3. Testimonials list: ~200 total count, pagination works, default sort is Updated At
   descending, Customer Name is pinned left at its configured width, search finds rows by
   customer name and company, the filter builder filters by Source, and the Internal Score
   column/field is absent everywhere (list, peek, edit view, filter field list).
4. Preset tabs Featured / From Contributors / Needs Review all render (readViews). The
   Featured tab pins Rating right; Needs Review shows the hidden-filter badge and does not
   reveal the `internalScore` condition.
5. The Contributor relationship cell shows the contributor's name (after re-seeding with a
   user present); opening a user document or peek shows name only — no email.
6. Products list: every field readable; Catalog and Pricing tabs switch columns and pins
   (Price pinned right on Pricing). The edit view renders every field-type input read-only
   (`description` is a textarea until the post-D richtext swap).
7. Leads list: Email, Score, and Internal Notes are absent for the anonymous visitor; Hot
   Leads shows the hidden-filter badge; Newsletter filters to subscribed rows.
8. No row-action "Feature", no bulk "Approve", no bulk delete, no save/create/delete
   affordance anywhere; attempting a direct URL to a new-document route stays read-only.

**Admin:** sign in with the admin account.

9. Internal Score, Email, Score, Internal Notes are all visible again; Needs Review and Hot
   Leads show their real filter conditions instead of the badge.
10. The "Feature" row action toggles `featured` with a toast; selecting rows shows the
    "Approve" bulk action and it approves the selection; both lists update in real time.
11. Creating/editing/deleting a testimonial, product, and lead works.

Fix any failures before marking the spec done.
