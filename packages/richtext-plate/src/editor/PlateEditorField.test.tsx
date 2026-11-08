import { afterEach, describe, expect, it, vi } from "vitest";
import { setTimeout as sleep } from "node:timers/promises";
import { act, cleanup, render, screen } from "@testing-library/react";

import { PLATE_52_DOCUMENT } from "../test/fixtures";
import { defaultFeatures } from "./features/defaultFeatures";
import { PlateEditorField } from "./PlateEditorField";

afterEach(cleanup);

function renderEditor(onChange = vi.fn()) {
  render(
    <PlateEditorField
      name="body"
      label="Body"
      value={PLATE_52_DOCUMENT}
      onChange={onChange}
      features={defaultFeatures}
      mediaCollectionSlug="images"
    />,
  );
  return { onChange, editable: screen.getByRole("textbox", { name: "Body" }) };
}

describe("PlateEditorField — content stored under Plate 52", () => {
  it("loads every node of the 52 document into the editor", () => {
    const { editable } = renderEditor();

    expect(editable.querySelector("h2")?.textContent).toBe("Upgrade heading");
    expect(editable.textContent).toContain("Plain then bold and italic text.");
    expect(editable.textContent).toContain("First bullet");
    expect(editable.textContent).toContain("Second bullet");
    // `trim()`: the inline element ends in a non-breaking-space spacer.
    expect(editable.querySelector(".slate-a")?.textContent?.trim()).toBe("docs site");
    expect(editable.querySelector("img")?.getAttribute("src")).toBe(
      "https://example.convex.cloud/api/storage/71ade08e-225b-46c2-bd81-dee8dc29e021",
    );
  });

  it("opens a flat (pre-53) blockquote as a container holding a paragraph", () => {
    const { editable } = renderEditor();

    const quote = editable.querySelector("blockquote");
    const child = quote?.querySelector(":scope > [data-slate-node='element']");
    expect(child?.textContent).toBe("A quoted line");
  });

  it("does not emit a change just for opening a 52 document", async () => {
    const { onChange } = renderEditor();

    // Slate flushes onValueChange asynchronously; let any pending emit land.
    await act(() => sleep(50));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("names the Insert image toolbar button and hides its glyph from the accessibility tree (F-083)", () => {
    renderEditor();
    const imageButton = screen.getByRole("button", { name: "Insert image" });
    expect(imageButton.querySelector('[aria-hidden="true"]')?.textContent).toBe("🖼");
  });

  it("makes the scroll wrapper around the read-only content focusable so axe's scrollable-region-focusable has a keyboard path (F-093)", () => {
    const { editable } = renderEditor();
    const scrollWrapper = editable.closest('[data-slot="editor-scroll-wrapper"]');
    expect(scrollWrapper?.getAttribute("tabindex")).toBe("0");
  });
});
