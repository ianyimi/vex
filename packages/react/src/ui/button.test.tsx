import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("renders the destructive variant", () => {
    render(<Button variant="destructive">Delete</Button>);
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("keeps the destructive variant's background tint light enough for AA text contrast (F-088: was bg-destructive/10 light, /20 dark — measured 3.71:1/4.30:1; /3 and /10 measure 4.59:1/4.81:1)", () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole("button", { name: "Delete" });
    expect(button.className).toContain("bg-destructive/3");
    expect(button.className).toContain("dark:bg-destructive/10");
    expect(button.className).not.toMatch(/(?<!dark:)bg-destructive\/10\b/);
    expect(button.className).not.toContain("dark:bg-destructive/20");
  });
});
