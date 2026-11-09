import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeAll, describe, expect, it } from "vitest"
import { expectNoA11yViolations } from "@vexcms/react/testing"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"

beforeAll(() => {
  Element.prototype.hasPointerCapture ??= () => false
  Element.prototype.releasePointerCapture ??= () => undefined
  Element.prototype.setPointerCapture ??= () => undefined
})

// See packages/react/src/ui/select.test.tsx for why this is disabled:
// jsdom's `navigator.vendor` trips Base UI's `isSafari` detection, the only
// condition under which its internal FocusGuard span gets a `role` with no
// accessible name.
const FOCUS_GUARD_JSDOM_SAFARI_RULES = { "aria-command-name": { enabled: false } }

describe("www Select", () => {
  it("has no detectable accessibility violations while open", async () => {
    const { container } = render(
      <Select defaultOpen>
        <SelectTrigger aria-label="Language">
          <SelectValue placeholder="Pick a language" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ts">TypeScript</SelectItem>
          <SelectItem value="js">JavaScript</SelectItem>
        </SelectContent>
      </Select>,
    )
    await screen.findByRole("listbox")
    await expectNoA11yViolations(container, { rules: FOCUS_GUARD_JSDOM_SAFARI_RULES })
  })

  it("selects an option with ArrowDown + Enter", async () => {
    const user = userEvent.setup()
    render(
      <Select defaultOpen>
        <SelectTrigger aria-label="Language">
          <SelectValue placeholder="Pick a language" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ts">TypeScript</SelectItem>
          <SelectItem value="js">JavaScript</SelectItem>
        </SelectContent>
      </Select>,
    )
    await screen.findByRole("listbox")
    await user.keyboard("{ArrowDown}{Enter}")
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument())
  })
})
