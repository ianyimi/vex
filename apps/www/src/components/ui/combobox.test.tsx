import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeAll, describe, expect, it } from "vitest"
import { expectNoA11yViolations } from "@vexcms/react/testing"

import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxList } from "./combobox"

beforeAll(() => {
  Element.prototype.scrollIntoView ??= () => undefined
})

describe("www Combobox", () => {
  it("has no detectable accessibility violations while open", async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Combobox items={["Rust", "TypeScript"]}>
        <ComboboxInput aria-label="Search languages" placeholder="Search..." />
        <ComboboxContent>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>,
    )
    await user.click(screen.getByRole("combobox", { name: "Search languages" }))
    await screen.findByText("Rust")
    await expectNoA11yViolations(container)
  })

  it("filters the list by typed text", async () => {
    const user = userEvent.setup()
    render(
      <Combobox items={["Rust", "TypeScript"]}>
        <ComboboxInput aria-label="Search languages" placeholder="Search..." />
        <ComboboxContent>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>,
    )
    const input = screen.getByRole("combobox", { name: "Search languages" })
    await user.type(input, "Type")
    await screen.findByText("TypeScript")
    expect(screen.queryByText("Rust")).not.toBeInTheDocument()
  })
})
