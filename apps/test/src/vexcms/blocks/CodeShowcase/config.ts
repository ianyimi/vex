import { array, defineBlock, group, select, text } from "@vexcms/core"

import { BLOCK_SLUG_CODE_SHOWCASE } from "../constants"

export const codeShowcaseBlock = defineBlock({
  slug: BLOCK_SLUG_CODE_SHOWCASE,
  label: "Code Showcase",
  fields: {
    heading: text({
      label: "Heading",
      required: true,
      defaultValue: "Write the collection. Get the database.",
    }),
    subheading: text({
      label: "Subheading",
      defaultValue:
        "The left pane is hand-written; the right one is the Convex schema vex dev emits from it and never edited.",
    }),
    panes: array({
      label: "Panes",
      required: true,
      description:
        "Two panes render side by side in one frame. Three or more render as a tab set.",
      items: group({
        label: "Pane",
        fields: {
          label: text({
            label: "Pane Label",
            required: true,
            description: "Shown uppercase in the chrome bar.",
          }),
          filename: text({ label: "Filename" }),
          language: select({
            label: "Language",
            options: [
              { label: "TypeScript", value: "ts" },
              { label: "TSX", value: "tsx" },
              { label: "Shell", value: "bash" },
              { label: "JSON", value: "json" },
            ],
            defaultValue: ["ts"],
          }),
          authored: select({
            label: "Origin",
            description:
              "Hand-written panes carry the primary-coloured label — the only signal separating human input from generated output.",
            options: [
              { label: "Hand-written", value: "authored" },
              { label: "Generated", value: "generated" },
            ],
            defaultValue: ["generated"],
          }),
          code: text({ label: "Code", required: true }),
          caption: text({ label: "Caption" }),
        },
      }),
    }),
  },
  admin: {
    icon: "FileCode",
  },
})
