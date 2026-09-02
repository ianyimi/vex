import { defineBlock, text, url, number } from "@vexcms/core"

/**
 * Testimonial — a customer quote with author name, role, and avatar.
 */
export const testimonialBlock = defineBlock({
  slug: "testimonial",
  label: "Testimonial",
  name: "testimonial",
  admin: { icon: "MessageSquareQuote" },
  fields: {
    quote: text({
      required: true,
      label: "Quote",
      description: "The customer's quote. Keep it under ~200 characters for best display.",
    }),
    authorName: text({ required: true, label: "Author Name" }),
    authorRole: text({ label: "Author Role", description: "e.g. 'CTO at Acme Inc.'" }),
    authorAvatar: url({ label: "Author Avatar URL" }),
    company: text({ label: "Company" }),
    rating: number({
      label: "Rating",
      description: "Star rating 1–5.",
      min: { value: 1 },
      max: { value: 5 },
    }),
  },
})
