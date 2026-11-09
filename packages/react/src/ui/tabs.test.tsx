import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { expectNoA11yViolations } from "../testing/a11y";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

function renderTabs() {
  return render(
    <Tabs defaultValue="content">
      <TabsList>
        <TabsTrigger value="content">Content</TabsTrigger>
        <TabsTrigger value="history">Version history</TabsTrigger>
      </TabsList>
      <TabsContent value="content">Content panel</TabsContent>
      <TabsContent value="history">History panel</TabsContent>
    </Tabs>,
  );
}

describe("Tabs", () => {
  it("has no detectable accessibility violations", async () => {
    const { container } = renderTabs();
    await expectNoA11yViolations(container);
  });

  // Base UI's `Tabs.List` defaults `activateOnFocus` to `false` — the APG's
  // manual-activation model: arrow keys move focus between tabs without
  // selecting them, and the user presses Enter/Space to activate the
  // focused tab. (Automatic activation, where the arrow key itself selects,
  // is the other APG-sanctioned model but isn't this primitive's default.)
  it("moves focus with ArrowRight/ArrowLeft and activates the focused tab with Enter", async () => {
    const user = userEvent.setup();
    renderTabs();
    const content = screen.getByRole("tab", { name: "Content" });
    const history = screen.getByRole("tab", { name: "Version history" });
    content.focus();

    await user.keyboard("{ArrowRight}");
    expect(history).toHaveFocus();
    expect(history).toHaveAttribute("aria-selected", "false");

    await user.keyboard("{Enter}");
    expect(history).toHaveAttribute("aria-selected", "true");
    expect(content).toHaveAttribute("aria-selected", "false");
  });

  it("moves focus to the first/last tab with Home/End", async () => {
    const user = userEvent.setup();
    renderTabs();
    const content = screen.getByRole("tab", { name: "Content" });
    const history = screen.getByRole("tab", { name: "Version history" });
    history.focus();

    await user.keyboard("{Home}");
    expect(content).toHaveFocus();

    await user.keyboard("{End}");
    expect(history).toHaveFocus();
  });
});
