import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { json, type TDocument } from "@vexcms/core";
import { JsonFieldDisplay } from "./Display";
import { testCollection } from "../../testing/harness/accessFixtures";
import type { JsonEditorProps } from "../../ui/JsonEditor";

// Stubs the lazy CodeMirror view the same way `fields/json/Input.test.tsx` and
// `ui/JsonEditor.test.tsx` do. Unstubbed, `JsonEditor`'s `React.lazy` chunk resolves
// at a timing-dependent point and then stays resolved for the rest of this file: a
// slow runner (CI) rendered the real CodeMirror, whose `role="textbox"` element is a
// contenteditable `<div>` with no `.value`, while a fast one still saw the Suspense
// fallback `<textarea>`. The stub makes what this file asserts — the formatted text
// and read-only flag `JsonFieldDisplay` passes down — deterministic.
vi.mock("../../ui/JsonEditorView", () => ({
  JsonEditorView: ({ id, value, readOnly }: JsonEditorProps) => (
    <textarea data-testid="json-editor-view" id={id} value={value} readOnly={readOnly} />
  ),
}));

const field = json({ label: "Settings" });
const document: TDocument = { _id: "doc_1", _creationTime: 0 };

describe("JsonFieldDisplay", () => {
  it("renders the lazy JsonEditor view read-only with the value formatted", async () => {
    render(<JsonFieldDisplay field={field} value={{ a: 1, b: [2, 3] }} document={document} collection={testCollection} />);
    const editor = await waitFor(() => screen.getByTestId("json-editor-view") as HTMLTextAreaElement);
    expect(editor.value).toBe(JSON.stringify({ a: 1, b: [2, 3] }, null, 2));
    expect(editor).toHaveAttribute("readonly");
  });

  it("shows formatted null for an absent value, never crashing on undefined", async () => {
    render(<JsonFieldDisplay field={field} value={undefined} document={document} collection={testCollection} />);
    const editor = await waitFor(() => screen.getByTestId("json-editor-view") as HTMLTextAreaElement);
    expect(editor.value).toBe("null");
  });
});
