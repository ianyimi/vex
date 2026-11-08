import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ScrollSection } from "./ScrollSection";

describe("ScrollSection", () => {
  it("renders children without a header when title is omitted", () => {
    render(
      <ScrollSection>
        <div>Body</div>
      </ScrollSection>,
    );
    expect(screen.getByText("Body")).toBeInTheDocument();
  });

  it("renders a title and count badge", () => {
    render(
      <ScrollSection title="Shared" count={12}>
        <div>Body</div>
      </ScrollSection>,
    );
    expect(screen.getByText("Shared")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("collapses and expands the body on header click when collapsible", async () => {
    const user = userEvent.setup();
    render(
      <ScrollSection title="Shared" collapsible>
        <div>Body</div>
      </ScrollSection>,
    );
    expect(screen.getByText("Body")).toBeVisible();
    await user.click(screen.getByRole("button", { name: /shared/i }));
    expect(screen.queryByText("Body")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /shared/i }));
    expect(screen.getByText("Body")).toBeVisible();
  });

  it("starts collapsed when defaultCollapsed is true", () => {
    render(
      <ScrollSection title="Shared" collapsible defaultCollapsed>
        <div>Body</div>
      </ScrollSection>,
    );
    expect(screen.queryByText("Body")).not.toBeInTheDocument();
  });

  it("remembers collapsed state per persistKey across remounts", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <ScrollSection title="Shared" collapsible persistKey="scroll-section-test">
        <div>Body</div>
      </ScrollSection>,
    );
    await user.click(screen.getByRole("button", { name: /shared/i }));
    unmount();

    render(
      <ScrollSection title="Shared" collapsible persistKey="scroll-section-test">
        <div>Body</div>
      </ScrollSection>,
    );
    expect(screen.queryByText("Body")).not.toBeInTheDocument();
    window.localStorage.removeItem("scroll-section-test");
  });

  it("forwards title as the underlying ScrollArea's accessible name", () => {
    render(
      <ScrollSection title="Shared">
        <div>Body</div>
      </ScrollSection>,
    );
    expect(screen.getByLabelText("Shared")).toBeInTheDocument();
  });
});
