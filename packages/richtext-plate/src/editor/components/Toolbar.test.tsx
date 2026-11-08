import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { PLATE_52_DOCUMENT } from "../../test/fixtures";
import { defaultFeatures } from "../features/defaultFeatures";
import { PlateEditorField } from "../PlateEditorField";

afterEach(cleanup);

function renderEditor() {
  render(
    <PlateEditorField
      name="body"
      label="Body"
      value={PLATE_52_DOCUMENT}
      onChange={vi.fn()}
      features={defaultFeatures}
      mediaCollectionSlug="images"
    />,
  );
}

describe("Toolbar — button accessible names", () => {
  it("names every mark button with its real word, not the bare glyph, matching its tooltip", () => {
    renderEditor();
    expect(screen.getByRole("button", { name: "Bold (Ctrl+B)" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Italic (Ctrl+I)" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Underline (Ctrl+U)" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Strikethrough (Ctrl+Shift+S)" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Inline code (Ctrl+E)" })).toBeTruthy();
  });

  it("names the block/list/insert buttons with their real word, not the bare glyph", () => {
    renderEditor();
    expect(screen.getByRole("button", { name: "Blockquote" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Code block" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Bullet list" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "1. Numbered list" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Horizontal rule" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Insert table" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Insert link" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Heading level: H" })).toBeTruthy();
  });

  it("hides each button's visible glyph from the accessibility tree so it can't conflict with the aria-label (axe label-content-name-mismatch)", () => {
    renderEditor();
    const codeBlockButton = screen.getByRole("button", { name: "Code block" });
    expect(codeBlockButton.querySelector('[aria-hidden="true"]')?.textContent).toBe("{ }");
    const linkButton = screen.getByRole("button", { name: "Insert link" });
    expect(linkButton.querySelector('[aria-hidden="true"]')?.textContent).toBe("🔗");
    const tableButton = screen.getByRole("button", { name: "Insert table" });
    expect(tableButton.querySelector('[aria-hidden="true"]')?.textContent).toBe("▦");
    const hrButton = screen.getByRole("button", { name: "Horizontal rule" });
    expect(hrButton.querySelector('[aria-hidden="true"]')?.textContent).toBe("―");
    const headingButton = screen.getByRole("button", { name: "Heading level: H" });
    expect(headingButton.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it("includes each button's visible glyph (not just the bare glyph) in its accessible name when the glyph is alphanumeric (axe label-content-name-mismatch)", () => {
    renderEditor();
    const boldButton = screen.getByRole("button", { name: "Bold (Ctrl+B)" });
    expect(boldButton.querySelector('[aria-hidden="true"]')?.textContent).toBe("B");
    const italicButton = screen.getByRole("button", { name: "Italic (Ctrl+I)" });
    expect(italicButton.querySelector('[aria-hidden="true"]')?.textContent).toBe("I");
    const underlineButton = screen.getByRole("button", { name: "Underline (Ctrl+U)" });
    expect(underlineButton.querySelector('[aria-hidden="true"]')?.textContent).toBe("U");
    const strikethroughButton = screen.getByRole("button", {
      name: "Strikethrough (Ctrl+Shift+S)",
    });
    expect(strikethroughButton.querySelector('[aria-hidden="true"]')?.textContent).toBe("S");
    const codeButton = screen.getByRole("button", { name: "Inline code (Ctrl+E)" });
    expect(codeButton.querySelector('[aria-hidden="true"]')?.textContent).toBe("code");
    const numberedListButton = screen.getByRole("button", { name: "1. Numbered list" });
    expect(numberedListButton.querySelector('[aria-hidden="true"]')?.textContent).toBe("1.");
  });

  it("shows a tooltip on keyboard focus (:focus-within), not just mouse hover", () => {
    renderEditor();
    const toolbarStyle = Array.from(document.querySelectorAll("style")).find((tag) =>
      tag.textContent?.includes(".vex-tb-wrap"),
    );
    expect(toolbarStyle?.textContent).toContain(".vex-tb-wrap:focus-within > .vex-tb-tip");
  });

  it("focuses the link popover's URL field when it opens, via a ref effect, not the autoFocus attribute, and labels it", () => {
    renderEditor();
    fireEvent.mouseDown(screen.getByRole("button", { name: "Insert link" }));
    const urlInput = screen.getByLabelText("Link URL");
    expect(urlInput.hasAttribute("autofocus")).toBe(false);
    expect(document.activeElement).toBe(urlInput);
  });
});
