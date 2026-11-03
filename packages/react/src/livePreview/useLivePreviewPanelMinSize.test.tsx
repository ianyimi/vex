import { useState } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DEFAULT_LIVE_PREVIEW_PANEL_MIN_SIZE } from "@vexcms/core";
import { useLivePreviewPanelMinSize } from "./useLivePreviewPanelState";

const SPLIT_WIDTH_PX = 1600;

function TogglingSplit() {
  const { ref, minSizes } = useLivePreviewPanelMinSize();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setIsOpen((open) => !open)}>
        toggle
      </button>
      <output>{`${minSizes.form}/${minSizes.preview}`}</output>
      {isOpen ? (
        <div
          ref={(element) => {
            if (element) {
              Object.defineProperty(element, "clientWidth", { value: SPLIT_WIDTH_PX });
            }
            ref(element);
          }}
        />
      ) : null}
    </>
  );
}

describe("useLivePreviewPanelMinSize", () => {
  it("measures the split when the preview is opened, not only when it is open on mount", async () => {
    render(<TogglingSplit />);
    const unmeasured = `${DEFAULT_LIVE_PREVIEW_PANEL_MIN_SIZE}/${DEFAULT_LIVE_PREVIEW_PANEL_MIN_SIZE}`;
    expect(screen.getByRole("status")).toHaveTextContent(unmeasured);

    await act(async () => {
      screen.getByRole("button", { name: "toggle" }).click();
    });

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("35/45");
    });
  });

  it("re-measures after the split is closed and reopened", async () => {
    render(<TogglingSplit />);
    const toggle = screen.getByRole("button", { name: "toggle" });

    await act(async () => toggle.click());
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("35/45"));

    await act(async () => toggle.click());
    await act(async () => toggle.click());

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("35/45"));
  });
});
