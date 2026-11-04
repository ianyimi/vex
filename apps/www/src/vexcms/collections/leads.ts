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
      {
        viewId: "won",
        name: "Won",
        description: "Leads that closed as won.",
        state: {
          where: { field: "status", op: "eq", value: "won" },
          columns: ["fullName", "company", "score", "updatedAt"],
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
      description: "How this lead found us.",
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
