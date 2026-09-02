import { checkbox, defineCollection, select, text } from "@vexcms/core"

import { TABLE_SLUG_CHANGELOG } from "~/db/constants"

import { editorialAccessFields, editorialContentFields } from "./editorialFields"

/**
 * Release notes.
 *
 * Third collection sharing {@link editorialAccessFields}. Together with `articles` and
 * `caseStudies` it forms the three-resource set that `~/auth/access.ts` governs with
 * one rule per action.
 */
export const changelog = defineCollection({
  slug: TABLE_SLUG_CHANGELOG,
  interfaceName: "ChangelogEntry",
  labels: {
    singular: "Changelog Entry",
    plural: "Changelog",
  },
  admin: {
    useAsTitle: "title",
    icon: "GitCommitVertical",
  },
  fields: {
    ...editorialContentFields,
    ...editorialAccessFields,

    // ── Changelog specific ─────────────────────────────────────────────────
    version: text({
      label: "Version",
      required: true,
      index: "by_version",
      description: "Semver tag for this release, e.g. `0.4.2`.",
    }),
    releaseType: select({
      label: "Release Type",
      defaultValue: ["patch"],
      options: [
        { label: "Major", value: "major" },
        { label: "Minor", value: "minor" },
        { label: "Patch", value: "patch" },
      ],
      description: "Drives the badge colour on the changelog page.",
    }),
    breaking: checkbox({
      label: "Breaking Change",
      description: "Surfaces a migration warning above the entry.",
    }),
    notes: text({
      label: "Notes",
      description: "Markdown list of changes in this release.",
    }),
  },
})
