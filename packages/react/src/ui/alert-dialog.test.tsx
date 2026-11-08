import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { expectNoA11yViolations } from "../testing/a11y";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";

function renderAlertDialog(props: { defaultOpen?: boolean } = {}) {
  return render(
    <AlertDialog defaultOpen={props.defaultOpen ?? true}>
      <AlertDialogTrigger>Delete</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>Delete document?</AlertDialogTitle>
        <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>,
  );
}

describe("AlertDialog", () => {
  it("has no detectable accessibility violations while open", async () => {
    const { container } = renderAlertDialog();
    await screen.findByRole("alertdialog", { name: "Delete document?" });
    await expectNoA11yViolations(container);
  });

  it("marks the popup aria-modal so screen readers treat background content as hidden", async () => {
    renderAlertDialog();
    const dialog = await screen.findByRole("alertdialog", { name: "Delete document?" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    renderAlertDialog({ defaultOpen: false });
    const trigger = screen.getByRole("button", { name: "Delete" });
    await user.click(trigger);
    await screen.findByRole("alertdialog", { name: "Delete document?" });
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("closes when Cancel is activated via the keyboard", async () => {
    const user = userEvent.setup();
    renderAlertDialog();
    const cancel = await screen.findByRole("button", { name: "Cancel" });
    cancel.focus();
    await user.keyboard("{Enter}");
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  });
});
