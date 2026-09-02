import { array, checkbox, defineBlock, text, url } from "@vexcms/core"

/**
 * Pricing — a pricing card with plan name, price, features, and CTA.
 */
export const pricingBlock = defineBlock({
  slug: "pricing",
  label: "Pricing",
  name: "pricing",
  admin: { icon: "CreditCard" },
  fields: {
    planName: text({ required: true, label: "Plan Name" }),
    price: text({
      required: true,
      label: "Price",
      description: "Display price, e.g. '$29' or 'Free'.",
    }),
    period: text({
      label: "Period",
      description: "Billing period, e.g. '/month' or '/year'.",
    }),
    description: text({ label: "Description" }),
    features: array({
      label: "Features",
      labels: { singular: "feature", plural: "features" },
      items: text({ label: "Feature" }),
    }),
    ctaLabel: text({ label: "Button Label" }),
    ctaHref: url({ label: "Button URL" }),
    highlighted: checkbox({
      label: "Highlighted",
      description: "When checked, renders this card with emphasis (border, scale, badge).",
    }),
    badge: text({
      label: "Badge",
      description: "Badge text for highlighted cards, e.g. 'Most Popular'.",
    }),
  },
})
