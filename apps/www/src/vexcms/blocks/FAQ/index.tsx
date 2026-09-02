import type { BlockComponentProps } from "@vexcms/react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  buttonVariants,
  cn,
} from "@vexcms/react"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

import type { FaqBlock } from "~/vex.types"

import { Container } from "~/components/Container"

export { faqBlock } from "./config"

/**
 * FAQ — question left, answer under it.
 *
 * Two columns rather than the sourced centred layout: it gives the support
 * link a home, holds answers at a 68ch measure instead of 90ch, and stops the
 * centred-heading pattern appearing three times on one page.
 *
 * Items are rules, not cards — no radius, no background, no shadow, which is
 * the only treatment that reads the same in both themes.
 */
export default function FAQBlockRenderer({ block }: BlockComponentProps) {
  const { heading, items, subheading, supportLink } = block as FaqBlock
  const faqs = items ?? []

  if (faqs.length === 0) {return null}

  return (
    <section className="py-14 md:py-20 xl:py-28">
      <Container>
        <div className="grid gap-8 xl:grid-cols-[4fr_7fr] xl:items-start xl:gap-14">
          <div>
            <h2 className="text-[26px] leading-[1.18] font-bold tracking-[-0.025em] text-balance text-foreground md:text-3xl xl:text-4xl">
              {heading}
            </h2>
            {subheading ? (
              <p className="mt-4 text-[17px] leading-[1.6] text-pretty text-muted-foreground">
                {subheading}
              </p>
            ) : null}
            {supportLink ? (
              // Fixed copy in the renderer: the field stores only an href.
              <Link
                className={cn(
                  buttonVariants({ variant: "link" }),
                  "mt-5 h-auto gap-1.5 p-0 text-[15px] font-medium text-primary no-underline hover:underline"
                )}
                href={supportLink}
              >
                Open an issue
                <ArrowRight className="size-4" />
              </Link>
            ) : null}
          </div>

          <Accordion className="border-t border-border" defaultValue={["faq-0"]}>
            {faqs.map((faq, index) => (
              <AccordionItem
                className="border-b border-border"
                key={`${faq.question}-${index}`}
                value={`faq-${index}`}
              >
                <AccordionTrigger className="flex min-h-[52px] w-full items-start justify-between gap-6 py-[18px] text-left text-base font-medium text-foreground">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="max-w-[68ch] pt-3 pb-[18px] text-[15px] leading-[1.65] text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Container>
    </section>
  )
}
