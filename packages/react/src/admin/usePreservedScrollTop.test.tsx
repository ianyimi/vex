import { useState } from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { usePreservedScrollTop } from "./usePreservedScrollTop";

/**
 * Mirrors the edit view: toggling swaps which element scrolls, so the two
 * containers are never mounted at the same time.
 */
function SwappingScrollers() {
  const [isSplit, setIsSplit] = useState(false);
  const formScroll = usePreservedScrollTop();

  return (
    <>
      <button type="button" onClick={() => setIsSplit((previous) => !previous)}>
        toggle
      </button>
      {isSplit ? (
        <div data-testid="split-scroller" ref={formScroll.ref} onScroll={formScroll.onScroll} />
      ) : (
        <div data-testid="plain-scroller" ref={formScroll.ref} onScroll={formScroll.onScroll} />
      )}
    </>
  );
}

describe("usePreservedScrollTop", () => {
  it("carries the offset onto the container that replaces it, and back again", () => {
    render(<SwappingScrollers />);

    const plain = screen.getByTestId("plain-scroller");
    plain.scrollTop = 420;
    fireEvent.scroll(plain);

    // Opening the split mounts a different element, which would otherwise
    // start at zero — the form visibly jumping back to the top.
    fireEvent.click(screen.getByRole("button", { name: "toggle" }));
    expect(screen.getByTestId("split-scroller").scrollTop).toBe(420);

    const split = screen.getByTestId("split-scroller");
    split.scrollTop = 96;
    fireEvent.scroll(split);
    fireEvent.click(screen.getByRole("button", { name: "toggle" }));
    expect(screen.getByTestId("plain-scroller").scrollTop).toBe(96);
  });

  it("starts a first-mounted container at the top", () => {
    render(<SwappingScrollers />);
    expect(screen.getByTestId("plain-scroller").scrollTop).toBe(0);
  });
});
