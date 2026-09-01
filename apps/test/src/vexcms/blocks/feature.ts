import { defineBlock, text, url } from "@vexcms/core"

/**
 * Feature — single feature card with icon, title, and description.
 * Usually placed in a 3-column grid on the page.
 */
export const featureBlock = defineBlock({
  slug: "feature",
  label: "Feature",
  name: "feature",
  admin: { icon: "Puzzle" },
  fields: {
    icon: text({
      label: "Icon",
      description: "Lucide icon name, e.g. 'zap', 'shield-check', 'layers'.",
    }),
    title: text({ required: true, label: "Title" }),
    description: text({ label: "Description" }),
    linkLabel: text({ label: "Link Label" }),
    linkHref: url({ label: "Link URL" }),
  },
})
