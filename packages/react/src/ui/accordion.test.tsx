import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { expectNoA11yViolations } from "../testing/a11y";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./accordion";

describe("AccordionTrigger", () => {
  it("renders postIconChildren as a Header sibling, never nested inside the trigger button", () => {
    const { container } = render(
      <Accordion>
        <AccordionItem value="a">
          <AccordionTrigger
            postIconChildren={
              <button type="button" aria-label="Remove item">
                Remove
              </button>
            }
          >
            Item label
          </AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    const triggerButton = container.querySelector('[data-slot="accordion-trigger"]');
    expect(triggerButton).not.toBeNull();
    expect(triggerButton?.tagName).toBe("BUTTON");

    const actionButton = container.querySelector('[aria-label="Remove item"]');
    expect(actionButton).not.toBeNull();
    expect(actionButton?.tagName).toBe("BUTTON");

    // The action button must be a sibling of the trigger, never nested inside
    // it — a <button> descendant of a <button> is invalid HTML and breaks
    // hydration.
    expect(triggerButton?.contains(actionButton)).toBe(false);

    // No button anywhere in the rendered tree contains another button.
    const buttons = Array.from(container.querySelectorAll("button"));
    expect(buttons.length).toBeGreaterThanOrEqual(2);
    for (const button of buttons) {
      expect(button.querySelector("button")).toBeNull();
    }
  });

  it("renders without postIconChildren unaffected", () => {
    const { container } = render(
      <Accordion>
        <AccordionItem value="a">
          <AccordionTrigger>Item label</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    const triggerButton = container.querySelector('[data-slot="accordion-trigger"]');
    expect(triggerButton).not.toBeNull();
    expect(triggerButton?.textContent).toContain("Item label");
  });
});

describe("Accordion a11y and keyboard model", () => {
  function renderMultiItem() {
    return render(
      <Accordion>
        <AccordionItem value="a">
          <AccordionTrigger>First</AccordionTrigger>
          <AccordionContent>First content</AccordionContent>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger>Second</AccordionTrigger>
          <AccordionContent>Second content</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
  }

  it("has no detectable accessibility violations with a panel open", async () => {
    const { container } = render(
      <Accordion defaultValue={["a"]}>
        <AccordionItem value="a">
          <AccordionTrigger>First</AccordionTrigger>
          <AccordionContent>First content</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    await expectNoA11yViolations(container);
  });

  it("has no detectable accessibility violations with every panel collapsed", async () => {
    const { container } = render(
      <Accordion>
        <AccordionItem value="a">
          <AccordionTrigger>First</AccordionTrigger>
          <AccordionContent>First content</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    await expectNoA11yViolations(container);
  });

  it("toggles aria-expanded with Enter and Space", async () => {
    const user = userEvent.setup();
    renderMultiItem();
    const trigger = screen.getByRole("button", { name: "First" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    trigger.focus();
    await user.keyboard("{Enter}");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    await user.keyboard(" ");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("points aria-controls at the real panel id while open, and never leaves it dangling once collapsed (Base UI unmounts the panel on close)", async () => {
    const user = userEvent.setup();
    const { container } = renderMultiItem();
    const trigger = screen.getByRole("button", { name: "First" });
    trigger.focus();
    await user.keyboard("{Enter}");
    const controlsId = trigger.getAttribute("aria-controls");
    expect(controlsId).toBeTruthy();
    expect(document.getElementById(controlsId!)).not.toBeNull();

    await user.keyboard("{Enter}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    const collapsedControls = trigger.getAttribute("aria-controls");
    if (collapsedControls) {
      expect(document.getElementById(collapsedControls)).not.toBeNull();
    }
    await expectNoA11yViolations(container);
  });
});
