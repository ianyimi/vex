import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { expectNoA11yViolations } from "@vexcms/react/testing"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./accordion"

describe("www Accordion", () => {
  it("has no detectable accessibility violations with a panel open", async () => {
    const { container } = render(
      <Accordion defaultValue={["a"]}>
        <AccordionItem value="a">
          <AccordionTrigger>What is vexcms?</AccordionTrigger>
          <AccordionContent>A type-safe headless CMS.</AccordionContent>
        </AccordionItem>
      </Accordion>,
    )
    await expectNoA11yViolations(container)
  })

  it("toggles aria-expanded with Enter", async () => {
    const user = userEvent.setup()
    render(
      <Accordion>
        <AccordionItem value="a">
          <AccordionTrigger>What is vexcms?</AccordionTrigger>
          <AccordionContent>A type-safe headless CMS.</AccordionContent>
        </AccordionItem>
      </Accordion>,
    )
    const trigger = screen.getByRole("button", { name: "What is vexcms?" })
    trigger.focus()
    await user.keyboard("{Enter}")
    expect(trigger).toHaveAttribute("aria-expanded", "true")
  })
})
