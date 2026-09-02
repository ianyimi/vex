import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

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
