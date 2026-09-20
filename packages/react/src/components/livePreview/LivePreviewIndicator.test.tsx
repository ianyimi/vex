import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { LivePreviewIndicator } from "./LivePreviewIndicator";

describe("LivePreviewIndicator", () => {
  it("renders collapsed by default with no stored position", () => {
    vi.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
    render(<LivePreviewIndicator />);
    expect(screen.getByRole("button", { name: "Preview" })).toBeInTheDocument();
  });

  it("expands to show the Live Preview label on click", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
    render(<LivePreviewIndicator />);
    screen.getByRole("button", { name: "Preview" }).click();
    expect(await screen.findByText("Live Preview")).toBeInTheDocument();
  });

  it("renders nothing inside an embedded frame — the admin's split view owns that chrome", async () => {
    // `window.top !== window.self` is exactly the embedded case; a tab opened
    // from the panel's preview link is top-level and keeps the indicator.
    vi.stubGlobal("top", {} as Window);
    render(<LivePreviewIndicator />);
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Preview" })).not.toBeInTheDocument(),
    );
    vi.unstubAllGlobals();
  });
});
