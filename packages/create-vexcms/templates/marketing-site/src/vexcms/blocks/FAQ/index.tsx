import type { BlockComponentProps } from "@vexcms/react"

import Link from "next/link"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@vexcms/react"

export { faqBlock } from "./config"

export default function FAQBlock({ block }: BlockComponentProps) {
  const { heading, subheading, supportLink, items } = block as unknown as {
    heading: string
    subheading?: string
    supportLink?: string
    items?: Array<{ question: string; answer: string }>
  }

  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-3xl font-bold text-balance md:text-4xl lg:text-5xl">
            {heading}
          </h2>
          {subheading && (
            <p className="text-muted-foreground mt-4 text-balance">
              {subheading}
            </p>
          )}
        </div>

        <div className="mx-auto mt-12 max-w-xl">
          <Accordion className="bg-muted dark:bg-muted/50 w-full rounded-2xl p-1">
            {(items ?? []).map((faq, index) => (
              <div className="group" key={index}>
                <AccordionItem
                  className="data-open:bg-card dark:data-open:bg-muted rounded-xl border-none px-7 py-1 data-open:border-none data-open:shadow-sm"
                  value={`${index}`}
                >
                  <AccordionTrigger className="cursor-pointer text-base hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-base">{faq.answer}</p>
                  </AccordionContent>
                </AccordionItem>
                <hr className="mx-7 border-dashed group-last:hidden" />
              </div>
            ))}
          </Accordion>

          {supportLink && (
            <p className="text-muted-foreground mt-6 px-8">
              {"Can't find what you're looking for? Contact our "}
              <Link
                className="text-primary font-medium hover:underline"
                href={supportLink}
              >
                support team
              </Link>
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
