import { defineBlock, text } from "@vexcms/core"

import { BLOCK_SLUG_HERO } from "../constants"

export const heroBlock = defineBlock({
  slug: BLOCK_SLUG_HERO,
  label: "Hero Section",
  fields: {
    badgeText: text({
      label: "Badge Text",
      defaultValue: "Now in public beta",
      admin: { description: "Small text shown in the announcement badge" },
    }),
    badgeLink: text({
      label: "Badge Link",
      defaultValue: "/docs",
      admin: { description: "URL the badge links to" },
    }),
    heading: text({
      label: "Heading",
      required: true,
      defaultValue: "The CMS built for Convex",
    }),
    subheading: text({
      label: "Subheading",
      defaultValue:
        "Vex CMS gives you a full-featured content management system powered by Convex — real-time data, type-safe schemas, and a beautiful admin panel out of the box.",
    }),
    primaryCtaLabel: text({
      label: "Primary CTA Label",
      required: true,
      defaultValue: "Get Started",
    }),
    primaryCtaHref: text({
      label: "Primary CTA Link",
      required: true,
      defaultValue: "/docs",
    }),
    secondaryCtaLabel: text({
      label: "Secondary CTA Label",
      defaultValue: "View on GitHub",
    }),
    secondaryCtaHref: text({
      label: "Secondary CTA Link",
      defaultValue: "https://github.com/vexcms/vex",
    }),
  },
  admin: {
    icon: "sparkles",
  },
})
