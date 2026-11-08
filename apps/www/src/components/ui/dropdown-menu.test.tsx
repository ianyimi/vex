import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { expectNoA11yViolations } from "@vexcms/react/testing"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu"

// Base UI's non-modal floating surfaces render an internal `FocusGuard`
// span whose `role` only becomes `"button"` when `isSafari` is true
// (`@base-ui/utils/detectBrowser`'s `isSafari` reads `navigator.vendor`).
// jsdom's default `navigator.vendor` is literally "Apple Computer, Inc.", so
// every jsdom run takes Base UI's real-Safari-only code path and the guard
// is left without `aria-hidden`/a name — a jsdom environment artifact, not
// a reachable state in any real non-Safari browser.
const FOCUS_GUARD_JSDOM_SAFARI_RULES = { "aria-command-name": { enabled: false } }

describe("www DropdownMenu", () => {
  it("has no detectable accessibility violations while open", async () => {
    const { container } = render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Theme</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Light</DropdownMenuItem>
          <DropdownMenuItem>Dark</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    )
    await screen.findByRole("menu")
    await expectNoA11yViolations(container, { rules: FOCUS_GUARD_JSDOM_SAFARI_RULES })
  })

  it("selects the focused item with Enter", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Theme</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={onSelect}>Light</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    )
    await screen.findByRole("menuitem", { name: "Light" })
    await user.keyboard("{ArrowDown}{Enter}")
    expect(onSelect).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument())
  })
})
