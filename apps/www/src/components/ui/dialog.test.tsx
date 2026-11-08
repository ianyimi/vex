import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { expectNoA11yViolations } from "@vexcms/react/testing"

import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "./dialog"

describe("www Dialog", () => {
  it("has no detectable accessibility violations while open", async () => {
    const { container } = render(
      <Dialog defaultOpen>
        <DialogTrigger>Sign in</DialogTrigger>
        <DialogContent>
          <DialogTitle>Sign in</DialogTitle>
          <DialogDescription>Continue with your email.</DialogDescription>
        </DialogContent>
      </Dialog>,
    )
    await screen.findByRole("dialog", { name: "Sign in" })
    await expectNoA11yViolations(container)
  })

  it("names its close button", async () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Sign in</DialogTitle>
          <DialogDescription>Continue with your email.</DialogDescription>
        </DialogContent>
      </Dialog>,
    )
    await screen.findByRole("dialog")
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument()
  })

  it("keeps #main inert until every open dialog has unmounted", () => {
    document.body.insertAdjacentHTML("afterbegin", '<main id="main"></main>')
    const main = document.getElementById("main")!

    const { rerender } = render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Outer</DialogTitle>
          <DialogDescription>Outer dialog.</DialogDescription>
        </DialogContent>
      </Dialog>,
    )
    expect(main).toHaveAttribute("inert")

    // A second dialog opens on top (e.g. a confirm dialog from inside the first).
    rerender(
      <>
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Outer</DialogTitle>
            <DialogDescription>Outer dialog.</DialogDescription>
          </DialogContent>
        </Dialog>
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Inner</DialogTitle>
            <DialogDescription>Inner dialog.</DialogDescription>
          </DialogContent>
        </Dialog>
      </>,
    )
    expect(main).toHaveAttribute("inert")

    // Closing the inner dialog alone must not unlock #main — the outer is still open.
    rerender(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Outer</DialogTitle>
          <DialogDescription>Outer dialog.</DialogDescription>
        </DialogContent>
      </Dialog>,
    )
    expect(main).toHaveAttribute("inert")

    // Closing the last dialog unlocks #main.
    rerender(<></>)
    expect(main).not.toHaveAttribute("inert")

    main.remove()
  })
})
