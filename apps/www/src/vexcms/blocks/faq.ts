import { array, defineBlock, group, text } from "@vexcms/core"

/**
 * FAQ — an accordion of questions and answers.
 */
export const faqBlock = defineBlock({
  slug: "faq",
  label: "FAQ",
  name: "faq",
  admin: { icon: "CircleHelp" },
  fields: {
    title: text({ label: "Section Title", description: "Optional heading above the FAQ list." }),
    questions: array({
      label: "Questions",
      labels: { singular: "question", plural: "questions" },
      items: group({
        label: "Question",
        fields: {
          question: text({ required: true, label: "Question" }),
          answer: text({
            required: true,
            label: "Answer",
            description: "The answer text. Supports basic formatting.",
          }),
        },
      }),
    }),
  },
})
