import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import type { JsonEditorProps } from "./JsonEditor";
import { JsonEditor } from "./JsonEditor";

/**
 * Stubs `JsonEditorView` the same way `fields/json/Input.test.tsx` does.
 * Kept in its own file: `JsonEditor`'s `React.lazy(() =>
 * import("./JsonEditorView"))` is a module-level singleton that, once
 * resolved by any earlier render in the SAME test file, stays resolved for
 * every later render in that file — so observing the Suspense fallback in
 * its unresolved state needs a render that is the first (and only) one to
 * touch this lazy component, which only this file's own module registry
 * guarantees.
 */
vi.mock("./JsonEditorView", () => ({
  JsonEditorView: ({ id, value }: JsonEditorProps) => (
    <textarea data-testid="real-editor" id={id} value={value} readOnly />
  ),
}));

describe("JsonEditor", () => {
  it("shows the Suspense fallback textarea synchronously before the lazy-loaded CodeMirror view resolves", () => {
    const { container } = render(
      <JsonEditor id="settings" value={JSON.stringify({ a: 1 }, null, 2)} onChange={() => {}} />,
    );

    // Queried synchronously, before any `await`: the dynamic
    // `import("./JsonEditorView")` only resolves on a later microtask, so
    // this is still the Suspense `fallback` — a read-only
    // `data-slot="textarea"` `<Textarea>`, not the mocked `JsonEditorView`.
    const fallback = container.querySelector('[data-slot="textarea"]');
    expect(fallback).not.toBeNull();
    expect(fallback).toHaveAttribute("readonly");
    expect(fallback).toHaveValue(JSON.stringify({ a: 1 }, null, 2));
    expect(container.querySelector('[data-testid="real-editor"]')).toBeNull();
  });
});
