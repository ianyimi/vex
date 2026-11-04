import { checkbox, defineCollection, number, relationship, select, text, textarea } from "@vexcms/core"

import { TestimonialBulkApproveAction } from "~/components/TestimonialBulkApproveAction"
import { TestimonialFeatureRowAction } from "~/components/TestimonialFeatureRowAction"
import { TABLE_SLUG_IMAGES, TABLE_SLUG_TESTIMONIALS, TABLE_SLUG_USERS, TESTIMONIAL_SOURCES } from "~/db/constants"

/**
 * Live-demo list-view showcase: 200 seeded rows, exercising every list-view
 * behavior `apps/test`'s `testimonials` collection proved out. Deviations:
 * contribution ids are `www.testimonials.*` (project-prefixed like
 * `test.testimonials.*`), and imports resolve against `apps/www`'s constants
 * (`TABLE_SLUG_USERS = "user"`, same value).
 *
 * - `admin.view.sort` — `updatedAt` desc, the auto-injected `commitTs()` field.
 * - `admin.view.columns` — `customerName` pinned left plus explicit widths.
 * - `admin.view.searchFields` — `customerName` + `company`, both declaring
 *   their own `searchIndex`.
 * - `source` — indexed (`by_source`) + `enableSorting: true`.
 * - `admin.views` — 3 presets:
 *   1. `featured` — a declared filter + its OWN pinned column entry
 *      (`rating` pinned right, different from the default view's pin).
 *   2. `with-contributor` — filters on the `contributorId` relationship field.
 *   3. `needs-review` — a server-resolved hidden `where` on `internalScore`,
 *      a field the demo role cannot read at all (`~/auth/access.ts`).
 * - `contributorId` — relationship field (auto-indexed `by_contributorId`).
 * - `avatar`/`quote`/`rating`/`featured`/`approved` — a peek-friendly field
 *   mix (image relation, long text, number, 2 checkboxes) for the Fields tab.
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
        description: "Low internal quality score — hidden from contributor/user roles.",
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
      description: "Where this testimonial was collected from.",
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
      description: "Internal quality score (0-100). Not visible to contributor/user roles.",
    }),
  },
})
