import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { JsonEditorView } from "./JsonEditorView";

describe("JsonEditorView", () => {
  it("dims the editor for readOnly but not for displayOnly, both non-editable", () => {
    const { container: readOnlyContainer } = render(
      <JsonEditorView id="read-only" value="{}" onChange={() => {}} readOnly />,
    );
    const { container: displayOnlyContainer } = render(
      <JsonEditorView id="display-only" value="{}" onChange={() => {}} displayOnly />,
    );

    const readOnlyHost = readOnlyContainer.querySelector(".cm-editor")?.parentElement;
    const displayOnlyHost = displayOnlyContainer.querySelector(".cm-editor")?.parentElement;
    expect(readOnlyHost).toHaveClass("opacity-50");
    expect(displayOnlyHost).not.toHaveClass("opacity-50");

    const readOnlyContent = readOnlyContainer.querySelector(".cm-content");
    const displayOnlyContent = displayOnlyContainer.querySelector(".cm-content");
    expect(readOnlyContent).toHaveAttribute("contenteditable", "false");
    expect(displayOnlyContent).toHaveAttribute("contenteditable", "false");
  });

  it("leaves the editor undimmed and editable when neither readOnly nor displayOnly is set", () => {
    const { container } = render(<JsonEditorView id="editable" value="{}" onChange={() => {}} />);

    const host = container.querySelector(".cm-editor")?.parentElement;
    const content = container.querySelector(".cm-content");
    expect(host).not.toHaveClass("opacity-50");
    expect(content).toHaveAttribute("contenteditable", "true");
  });
});
