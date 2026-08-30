import { defineCollection, number, text, url } from "@vexcms/core"

import { TABLE_SLUG_CASE_STUDIES } from "~/db/constants"

import { editorialAccessFields, editorialContentFields } from "./editorialFields"

/**
 * Customer case studies.
 *
 * Shares {@link editorialAccessFields} with `articles` and `changelog`, so the same
 * access checks from `~/auth/permissions.ts` apply without restating a constraint.
 */
export const caseStudies = defineCollection({
  slug: TABLE_SLUG_CASE_STUDIES,
  interfaceName: "CaseStudy",
  labels: {
    singular: "Case Study",
    plural: "Case Studies",
  },
  admin: {
    useAsTitle: "title",
    icon: "BriefcaseBusiness",
  },
  fields: {
    ...editorialContentFields,
    ...editorialAccessFields,

    // ── Case-study specific ────────────────────────────────────────────────
    clientName: text({
      label: "Client Name",
      required: true,
      description: "Company the study is about.",
    }),
    industry: text({
      label: "Industry",
      description: "Client's industry, used to group studies on the index page.",
    }),
    clientUrl: url({
      label: "Client Website",
      description: "Link to the client's site, shown in the study header.",
    }),
    outcomeSummary: text({
      label: "Outcome Summary",
      description: "One-line result, e.g. \"cut page build time by 60%\".",
    }),
    contractValue: number({
      label: "Contract Value (USD)",
      description: "Internal figure. Never rendered on the public site.",
    }),
  },
})
