import { defineBlock, select, text } from "@vexcms/core"

import { BLOCK_SLUG_HERO } from "../constants"

export const heroBlock = defineBlock({
  slug: BLOCK_SLUG_HERO,
  label: "Hero Section",
  fields: {
    variant: select({
      label: "Variant",
      description:
        "Full is the landing hero — 90vh, centred, decorative background. Compact is an interior page-header band.",
      options: [
        { label: "Full", value: "full" },
        { label: "Compact", value: "compact" },
      ],
      defaultValue: ["full"],
    }),
    badgeText: text({
      label: "Badge Text",
      defaultValue: "v0.1.0-alpha — now on npm",
      description:
        "Announcement pill on the full variant; the uppercase eyebrow on the compact one.",
    }),
    badgeLink: text({
      label: "Badge Link",
      defaultValue: "https://www.npmjs.com/package/@vexcms/core",
      description: "Optional. Without it the badge renders as plain text, not a link.",
    }),
    heading: text({
      label: "Heading",
      required: true,
      defaultValue: "The CMS that thinks in types.",
    }),
    subheading: text({
      label: "Subheading",
      defaultValue:
        "A headless CMS built natively on Convex. Declare your collections in TypeScript and Vex generates the Convex schema, the types, and the queries — no translation layer. Every edit reaches every subscriber in milliseconds.",
    }),
    installCommand: text({
      label: "Install Command",
      defaultValue: "pnpm create vexcms@latest",
      description:
        "Optional. Renders a copy-to-clipboard command row under the CTAs. Full variant only.",
    }),
    primaryCtaLabel: text({
      label: "Primary CTA Label",
      defaultValue: "Read the docs",
    }),
    primaryCtaHref: text({
      label: "Primary CTA Link",
      defaultValue: "https://docs.vexcms.dev/guides/quickstart/",
    }),
    secondaryCtaLabel: text({
      label: "Secondary CTA Label",
      defaultValue: "View on GitHub",
    }),
    secondaryCtaHref: text({
      label: "Secondary CTA Link",
      defaultValue: "https://github.com/ianyimi/vex",
    }),
  },
  admin: {
    icon: "Sparkles",
  },
})
