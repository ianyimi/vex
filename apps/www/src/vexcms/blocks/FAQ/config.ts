import { array, defineBlock, group, text } from "@vexcms/core"

import { BLOCK_SLUG_FAQ } from "../constants"

export const faqBlock = defineBlock({
  slug: BLOCK_SLUG_FAQ,
  label: "FAQ",
  fields: {
    heading: text({
      label: "Heading",
      required: true,
      defaultValue: "Frequently Asked Questions",
    }),
    subheading: text({
      label: "Subheading",
      defaultValue:
        "Everything you need to know about Vex CMS and building with Convex.",
    }),
    supportLink: text({
      label: "Support Link",
      defaultValue: "https://github.com/ianyimi/vex/issues",
      description: "URL to contact support page",
    }),
    items: array({
      label: "FAQ Items",
      required: true,
      items: group({
        label: "Question",
        fields: {
          question: text({ label: "Question", required: true }),
          answer: text({ label: "Answer", required: true }),
        },
      }),
      defaultValue: [
        {
          question: "What is Vex CMS?",
          answer:
            "Vex CMS is a headless content management system built on Convex. It provides real-time data, type-safe schemas, draft/publish workflows, live preview, and a beautiful admin panel — all configured with TypeScript.",
        },
        {
          question: "How is Vex different from other headless CMS platforms?",
          answer:
            "Unlike traditional headless CMS platforms that use REST or GraphQL APIs, Vex is powered by Convex's real-time database. This means content updates are instant across all clients, with no polling or webhooks needed. Your schema is defined in code, giving you full type safety from database to frontend.",
        },
        {
          question: "Do I need to know Convex to use Vex CMS?",
          answer:
            "Basic familiarity with Convex helps, but Vex handles most of the complexity for you. The CLI generates your Convex schema, queries, and types automatically from your collection definitions. You just define your fields and Vex does the rest.",
        },
        {
          question: "Can I use Vex with any frontend framework?",
          answer:
            "Vex CMS is framework-agnostic at the data layer — any app that can use Convex can use Vex. The admin panel and UI components are built for Next.js, but the core package and generated queries work with any Convex-compatible frontend.",
        },
        {
          question: "Is Vex CMS free?",
          answer:
            "Yes, Vex CMS is open source and free to use. You only pay for your Convex usage, which has a generous free tier for most projects.",
        },
        {
          question: "How do I get started?",
          answer:
            "Run `npx create-vexcms@alpha` to scaffold a new project with Vex CMS pre-configured. The CLI sets up your Next.js app, Convex backend, authentication, and admin panel in under a minute.",
        },
      ],
    }),
  },
  admin: {
    icon: "CircleQuestionMark",
  },
})
