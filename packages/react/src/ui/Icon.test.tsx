import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { icons } from "lucide-react";
import { Icon, IconComponentsProvider, IconNodeProvider, isIconName, type IconNodeMap } from "./Icon";

describe("Icon", () => {
  it("renders a placeholder svg carrying the final icon's width/height/className, then resolves", async () => {
    const { container } = render(<Icon className="size-4" name="FileText" />);
    const placeholder = container.querySelector("svg")!;
    expect(placeholder).toHaveAttribute("aria-hidden", "true");
    expect(placeholder).toHaveAttribute("width", "24");
    expect(placeholder).toHaveAttribute("height", "24");
    expect(placeholder.getAttribute("class")).toBe("size-4");

    await waitFor(() => {
      const resolved = container.querySelector("svg.lucide")!;
      expect(resolved).not.toBeNull();
      expect(resolved).toHaveAttribute("width", "24");
      expect(resolved).toHaveAttribute("height", "24");
      expect(resolved).toHaveAttribute("aria-hidden", "true");
      expect(resolved.getAttribute("class")).toContain("size-4");
    });
  });

  it("renders nothing and warns once for an unknown name", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { container, rerender } = render(<Icon name={"NotAnIcon" as never} />);
    expect(container.querySelector("svg")).toBeNull();
    rerender(<Icon name={"NotAnIcon" as never} />);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it.each([
    ["Grid2x2", true],
    ["LayoutGrid", true],
    ["NotAnIcon", false],
  ])("isIconName(%s) is %s", (name, expected) => {
    expect(isIconName(name)).toBe(expected);
  });

  it("renders a provider-supplied node synchronously, with no placeholder", () => {
    const nodes = { "layout-grid": [["rect", { width: "7", height: "7", x: "3", y: "3", rx: "1", key: "a" }]] } as IconNodeMap;
    const { container } = render(
      <IconNodeProvider nodes={nodes}>
        <Icon className="size-4" name="LayoutGrid" />
      </IconNodeProvider>,
    );
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("class")).toContain("lucide");
    expect(svg.querySelector("rect")).not.toBeNull();
  });

  it("falls back to the lazy path for a name the provider does not carry", () => {
    const { container } = render(
      <IconNodeProvider nodes={{}}>
        <Icon className="size-4" name="FileText" />
      </IconNodeProvider>,
    );
    expect(container.querySelector("svg")!.getAttribute("class")).toBe("size-4");
  });

  it("renders the real icon on first render under IconComponentsProvider (admin: no placeholder flash)", () => {
    const { container } = render(
      <IconComponentsProvider icons={icons}>
        <Icon className="size-4" name="FileText" />
      </IconComponentsProvider>,
    );
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("class")).toContain("lucide-file-text");
    expect(svg.getAttribute("class")).toContain("size-4");
  });
});
