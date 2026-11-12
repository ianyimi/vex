import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ThemeProvider } from "./ThemeProvider";
import { ThemeToggle } from "./ThemeToggle";

function renderToggle(props?: { disabled?: boolean; size?: "icon" | "icon-lg" }) {
  return render(
    <ThemeProvider>
      <ThemeToggle {...props} />
    </ThemeProvider>,
  );
}

describe("ThemeToggle", () => {
  it("renders enabled by default", () => {
    renderToggle();
    const trigger = screen.getByText("Toggle theme").closest("button");
    expect(trigger).not.toBeNull();
    expect(trigger).not.toBeDisabled();
    expect(trigger).not.toHaveAttribute("aria-disabled", "true");
  });

  it("renders disabled + aria-disabled, same icon/size/position, when props.disabled is set — the first-paint skeleton placeholder (AdminSidebarSkeleton) needs the SAME button present and inert, not a different element swapped in later", () => {
    renderToggle({ disabled: true, size: "icon-lg" });
    const trigger = screen.getByText("Toggle theme").closest("button");
    expect(trigger).not.toBeNull();
    expect(trigger).toBeDisabled();
    expect(trigger).toHaveAttribute("aria-disabled", "true");
  });

  it("a disabled toggle's dropdown does not open on click", async () => {
    const { container } = renderToggle({ disabled: true });
    const trigger = screen.getByText("Toggle theme").closest("button")!;
    trigger.click();
    expect(container.querySelector('[role="menu"]')).toBeNull();
  });
});
