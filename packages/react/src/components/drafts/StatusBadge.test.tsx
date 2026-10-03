import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "./StatusBadge";
import { badgeVariants } from "../ui/badge";
import { cn } from "../../styles/utils";

describe("StatusBadge", () => {
  it("renders a Published badge, using the default (emphasized) Badge variant", () => {
    render(<StatusBadge status="published" />);

    const badge = screen.getByText("Published");
    expect(badge).toHaveAttribute("data-slot", "badge");
    expect(badge.className).toBe(badgeVariants({ variant: "default" }));
  });

  it("renders a Draft badge, using the outline Badge variant", () => {
    render(<StatusBadge status="draft" />);

    const badge = screen.getByText("Draft");
    expect(screen.queryByText("Published")).toBeNull();
    expect(badge.className).toBe(cn(badgeVariants({ variant: "outline" })));
  });
});
