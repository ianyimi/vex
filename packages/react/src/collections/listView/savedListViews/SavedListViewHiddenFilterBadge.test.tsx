import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SavedListViewHiddenFilterBadge } from "./SavedListViewHiddenFilterBadge";

describe("SavedListViewHiddenFilterBadge", () => {
  it("renders a lock badge naming the hidden filter count", () => {
    render(<SavedListViewHiddenFilterBadge count={1} />);
    expect(screen.getByRole("button", { name: "1 hidden filter" })).toBeInTheDocument();
  });

  it("pluralizes the label for more than one hidden filter", () => {
    render(<SavedListViewHiddenFilterBadge count={3} />);
    expect(screen.getByRole("button", { name: "3 hidden filters" })).toBeInTheDocument();
  });

  it("opens a popover showing the view's description", async () => {
    const user = userEvent.setup();
    render(<SavedListViewHiddenFilterBadge count={1} description="Only featured posts." />);
    await user.click(screen.getByRole("button", { name: "1 hidden filter" }));
    expect(await screen.findByText("Only featured posts.")).toBeInTheDocument();
  });

  it("falls back to generic copy when the view has no description", async () => {
    const user = userEvent.setup();
    render(<SavedListViewHiddenFilterBadge count={1} />);
    await user.click(screen.getByRole("button", { name: "1 hidden filter" }));
    expect(
      await screen.findByText(/filter condition that isn't shown here/i),
    ).toBeInTheDocument();
  });
});
