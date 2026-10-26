import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DndProvider } from "./DndProvider";
import { Draggable } from "./Draggable";
import { DragHandle } from "./DragHandle";
import { Droppable } from "./Droppable";

describe("DragHandle", () => {
  it("renders inert without throwing when there is no Draggable ancestor (globals-style array row)", () => {
    // Mirrors a single-value upload field row rendered outside a Draggable
    // wrapper (e.g. FilledInput's non-hasMany branch) — DndProvider is
    // present (every AppForm provides one) but no Draggable/Droppable pair
    // wraps this particular row.
    expect(() =>
      render(
        <DndProvider>
          <DragHandle disabled={false} />
        </DndProvider>,
      ),
    ).not.toThrow();
  });

  it("does not throw across a whole Array.map of rows rendered outside Draggable", () => {
    const rows = ["a", "b", "c"];
    expect(() =>
      render(
        <DndProvider>
          <div>
            {rows.map((id) => (
              <DragHandle key={id} disabled={false} />
            ))}
          </div>
        </DndProvider>,
      ),
    ).not.toThrow();
  });

  it("resolves real drag handle props from the nearest Draggable ancestor when present", () => {
    const { container } = render(
      <DndProvider>
        <Droppable id="test-list" onReorder={() => {}}>
          <Draggable id="item-1" index={0}>
            <DragHandle disabled={false} />
          </Draggable>
        </Droppable>
      </DndProvider>,
    );

    const handle = container.querySelector("[data-rfd-drag-handle-draggable-id]");
    expect(handle).not.toBeNull();
  });
});
