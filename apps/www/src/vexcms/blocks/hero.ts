import { checkbox, defineBlock, text, url } from "@vexcms/core"

/**
 * Hero section — big headline, subtitle, and primary + secondary CTA buttons.
 * The most common first block on a marketing page.
 */
export const heroBlock = defineBlock({
  slug: "hero",
  label: "Hero",
  name: "hero",
  admin: { icon: "Sparkles" },
  fields: {
    badge: text({
      label: "Badge",
      description: "Small label shown above the headline, e.g. 'Now in Public Beta'.",
    }),
    title: text({
      required: true,
      label: "Title",
      description: "Main H1 headline. Keep it punchy — one line on desktop if possible.",
    }),
    subtitle: text({
      label: "Subtitle",
      description: "Supporting paragraph. 1–2 sentences explaining the value proposition.",
    }),
    primaryCtaLabel: text({ label: "Primary CTA Label" }),
    primaryCtaHref: url({ label: "Primary CTA URL" }),
    secondaryCtaLabel: text({ label: "Secondary CTA Label" }),
    secondaryCtaHref: url({ label: "Secondary CTA URL" }),
    showImage: checkbox({ label: "Show Hero Image" }),
    image: url({
      label: "Hero Image",
      description: "Hero illustration or screenshot. Shows to the right of the text on desktop.",
    }),
  },
})
