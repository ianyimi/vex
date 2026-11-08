import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { expectNoA11yViolations } from "@vexcms/react/testing"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog"

describe("www AlertDialog", () => {
  it("has no detectable accessibility violations while open", async () => {
    const { container } = render(
      <AlertDialog defaultOpen>
        <AlertDialogTrigger>Unsubscribe</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Unsubscribe from updates?</AlertDialogTitle>
          <AlertDialogDescription>You can resubscribe at any time.</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Unsubscribe</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    )
    await screen.findByRole("alertdialog", { name: "Unsubscribe from updates?" })
    await expectNoA11yViolations(container)
  })

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup()
    render(
      <AlertDialog>
        <AlertDialogTrigger>Unsubscribe</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Unsubscribe from updates?</AlertDialogTitle>
          <AlertDialogDescription>You can resubscribe at any time.</AlertDialogDescription>
        </AlertDialogContent>
      </AlertDialog>,
    )
    const trigger = screen.getByRole("button", { name: "Unsubscribe" })
    await user.click(trigger)
    await screen.findByRole("alertdialog", { name: "Unsubscribe from updates?" })
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
  })
})
