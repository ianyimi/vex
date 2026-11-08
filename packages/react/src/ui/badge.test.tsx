import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./badge";

describe("Badge", () => {
  it("renders the destructive variant", () => {
    render(<Badge variant="destructive">Error</Badge>);
    expect(screen.getByText("Error")).toBeInTheDocument();
  });

  it("keeps the destructive variant's background tint light enough for AA text contrast (F-088: was bg-destructive/10 light, /20 dark — measured 3.71:1/4.30:1; /3 and /10 measure 4.59:1/4.81:1)", () => {
    render(<Badge variant="destructive">Error</Badge>);
    const badge = screen.getByText("Error");
    expect(badge.className).toContain("bg-destructive/3");
    expect(badge.className).toContain("dark:bg-destructive/10");
    expect(badge.className).not.toMatch(/(?<!dark:)bg-destructive\/10\b/);
    expect(badge.className).not.toContain("dark:bg-destructive/20");
  });
});
