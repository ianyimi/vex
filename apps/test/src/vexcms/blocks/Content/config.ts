import { defineBlock, text, select } from "@vexcms/core";

/**
 * Content — a free-form text block for prose sections.
 * Use when you need a simple paragraph or two between structured blocks.
 */
export const contentBlock = defineBlock({
  slug: "content",
  label: "Content",
  name: "content",
  admin: { icon: "Notebook" },
  fields: {
    body: text({
      required: true,
      label: "Body",
      description: "Body text. Renders as prose with preserved line breaks.",
    }),
    align: select({
      label: "Alignment",
      defaultValue: ["left"],
      options: [
        { label: "Left", value: "left" },
        { label: "Center", value: "center" },
      ],
    }),
    maxWidth: select({
      label: "Max Width",
      defaultValue: ["prose"],
      options: [
        { label: "Prose (narrow)", value: "prose" },
        { label: "Wide", value: "wide" },
        { label: "Full", value: "full" },
      ],
    }),
  },
});
