import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DataTableColumnsMenu, reorderColumns } from "./DataTableColumnsMenu";

const columnMenuEntries = [
  { field: "title", label: "Title", hideable: true },
  { field: "body", label: "Body", hideable: true },
];

const columns = ["title", "body"];

/**
 * Opens the columns menu and waits for it to actually mount — `DataTableColumnsMenu`'s
 * `placement="inline"` form renders through `DataTableResponsiveMenu`, a `Popover` at
 * `useIsMobile() === false` (the default in these tests), whose `PopoverContent` carries
 * `role="dialog"` (the same convention `ListViewFilterBuilder.test.tsx`'s own Popover-opening
 * helper already relies on).
 */
async function openMenu() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: /columns/i }));
  await screen.findByRole("dialog");
  return user;
}

describe("DataTableColumnsMenu", () => {
  it("renders nothing with no readable columns", () => {
    const { container } = render(
      <DataTableColumnsMenu
        columnMenuEntries={[]}
        columns={[]}
        onColumnsChange={vi.fn()}
        density="comfortable"
        onDensityChange={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("lists every column with its checked state reflecting each entry's own hidden flag", async () => {
    render(
      <DataTableColumnsMenu
        columnMenuEntries={columnMenuEntries}
        columns={["title", { field: "body", hidden: true }]}
        onColumnsChange={vi.fn()}
        density="comfortable"
        onDensityChange={vi.fn()}
      />,
    );
    await openMenu();
    expect(screen.getByRole("checkbox", { name: "Title" })).toHaveAttribute("data-checked", "");
    expect(screen.getByRole("checkbox", { name: "Body" })).not.toHaveAttribute("data-checked");
  });

  it("renders rows in columns' own sequence, not columnMenuEntries' own array order", async () => {
    render(
      <DataTableColumnsMenu
        columnMenuEntries={columnMenuEntries}
        columns={["body", "title"]}
        onColumnsChange={vi.fn()}
        density="comfortable"
        onDensityChange={vi.fn()}
      />,
    );
    await openMenu();
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.map((c) => c.getAttribute("aria-label"))).toEqual(["Body", "Title"]);
  });

  it("checking a hidden column un-hides its entry in the next array", async () => {
    const onColumnsChange = vi.fn();
    render(
      <DataTableColumnsMenu
        columnMenuEntries={columnMenuEntries}
        columns={["title", { field: "body", hidden: true }]}
        onColumnsChange={onColumnsChange}
        density="comfortable"
        onDensityChange={vi.fn()}
      />,
    );
    const user = await openMenu();
    // Base UI's visible `role="checkbox"` span handles clicks via a `PointerEvent`
    // jsdom doesn't implement (`dataTableSuite.tsx`'s own row-selection tests document
    // the same gap) — clicking the row's label TEXT instead exercises the native
    // `<label>` → hidden `<input type="checkbox">` click delegation, which DOES fire
    // in jsdom (`fields/checkbox/Field.test.tsx`'s established pattern).
    await user.click(screen.getByText("Body"));
    expect(onColumnsChange).toHaveBeenCalledWith(["title", { field: "body", hidden: false }]);
  });

  it("unchecking the sole remaining visible column is a no-op", async () => {
    const onColumnsChange = vi.fn();
    render(
      <DataTableColumnsMenu
        columnMenuEntries={columnMenuEntries}
        columns={["title", { field: "body", hidden: true }]}
        onColumnsChange={onColumnsChange}
        density="comfortable"
        onDensityChange={vi.fn()}
      />,
    );
    const user = await openMenu();
    await user.click(screen.getByText("Title"));
    expect(onColumnsChange).not.toHaveBeenCalled();
  });

  it("a non-hideable column renders a disabled, permanently-checked checkbox, still with a drag handle", async () => {
    render(
      <DataTableColumnsMenu
        columnMenuEntries={[
          { field: "title", label: "Title", hideable: true },
          { field: "_pinned", label: "Pinned Field", hideable: false },
        ]}
        columns={["title", "_pinned"]}
        onColumnsChange={vi.fn()}
        density="comfortable"
        onDensityChange={vi.fn()}
      />,
    );
    await openMenu();
    const checkbox = screen.getByRole("checkbox", { name: "Pinned Field" });
    expect(checkbox).toHaveAttribute("data-checked", "");
    expect(checkbox).toHaveAttribute("data-disabled", "");
    // Still participates in drag (Decision 47: every row, hideable or
    // not) — `PopoverContent` renders through a portal (a direct child
    // of `<body>`, outside `render()`'s own container), so query from
    // `document` instead, matching the density test's own convention.
    expect(document.querySelectorAll("[data-rfd-drag-handle-draggable-id]")).toHaveLength(2);
  });

  it("the pin-left button pins the column left, clicking it again unpins", async () => {
    const onColumnsChange = vi.fn();
    render(
      <DataTableColumnsMenu
        columnMenuEntries={columnMenuEntries}
        columns={columns}
        onColumnsChange={onColumnsChange}
        density="comfortable"
        onDensityChange={vi.fn()}
      />,
    );
    const user = await openMenu();
    await user.click(screen.getByRole("button", { name: "Pin Title left" }));
    expect(onColumnsChange).toHaveBeenCalledWith([{ field: "title", pinned: "left" }, "body"]);
  });

  it("the pin-right button pins the column right", async () => {
    const onColumnsChange = vi.fn();
    render(
      <DataTableColumnsMenu
        columnMenuEntries={columnMenuEntries}
        columns={columns}
        onColumnsChange={onColumnsChange}
        density="comfortable"
        onDensityChange={vi.fn()}
      />,
    );
    const user = await openMenu();
    await user.click(screen.getByRole("button", { name: "Pin Body right" }));
    expect(onColumnsChange).toHaveBeenCalledWith(["title", { field: "body", pinned: "right" }]);
  });

  it("clicking the currently-pinned side again unpins, preserving other overrides", async () => {
    const onColumnsChange = vi.fn();
    render(
      <DataTableColumnsMenu
        columnMenuEntries={columnMenuEntries}
        columns={[{ field: "title", width: 240, pinned: "left" }, "body"]}
        onColumnsChange={onColumnsChange}
        density="comfortable"
        onDensityChange={vi.fn()}
      />,
    );
    const user = await openMenu();
    await user.click(screen.getByRole("button", { name: "Unpin Title" }));
    expect(onColumnsChange).toHaveBeenCalledWith([{ field: "title", width: 240 }, "body"]);
  });

  it("switching from pinned-left to pinned-right replaces the side", async () => {
    const onColumnsChange = vi.fn();
    render(
      <DataTableColumnsMenu
        columnMenuEntries={columnMenuEntries}
        columns={[{ field: "title", pinned: "left" }, "body"]}
        onColumnsChange={onColumnsChange}
        density="comfortable"
        onDensityChange={vi.fn()}
      />,
    );
    const user = await openMenu();
    await user.click(screen.getByRole("button", { name: "Pin Title right" }));
    expect(onColumnsChange).toHaveBeenCalledWith([{ field: "title", pinned: "right" }, "body"]);
  });

  // Developer-reported follow-up: the pin buttons worked, but gave no
  // obvious visual indication of WHICH side (if any) a column was
  // actually pinned to.
  it("the active pin side's icon reads text-primary, aria-pressed=true; the inactive side reads text-muted-foreground, aria-pressed=false", async () => {
    render(
      <DataTableColumnsMenu
        columnMenuEntries={columnMenuEntries}
        columns={[{ field: "title", pinned: "left" }, "body"]}
        onColumnsChange={vi.fn()}
        density="comfortable"
        onDensityChange={vi.fn()}
      />,
    );
    await openMenu();
    const unpinButton = screen.getByRole("button", { name: "Unpin Title" });
    expect(unpinButton).toHaveAttribute("aria-pressed", "true");
    expect(unpinButton).toHaveClass("text-primary");

    const pinRightButton = screen.getByRole("button", { name: "Pin Title right" });
    expect(pinRightButton).toHaveAttribute("aria-pressed", "false");
    expect(pinRightButton).toHaveClass("text-muted-foreground");
  });

  it("shows the session-only notice when no view is active", async () => {
    render(
      <DataTableColumnsMenu
        columnMenuEntries={columnMenuEntries}
        columns={columns}
        onColumnsChange={vi.fn()}
        hasActiveView={false}
        density="comfortable"
        onDensityChange={vi.fn()}
      />,
    );
    await openMenu();
    expect(screen.getByText(/save a view to keep them/i)).toBeInTheDocument();
  });

  it("reflects the controlled density prop and calls onDensityChange on toggle — never touches localStorage", async () => {
    const onDensityChange = vi.fn();
    render(
      <DataTableColumnsMenu
        columnMenuEntries={columnMenuEntries}
        columns={columns}
        onColumnsChange={vi.fn()}
        density="comfortable"
        onDensityChange={onDensityChange}
      />,
    );
    const user = await openMenu();
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(2);
    expect(radios[0]).toHaveAttribute("data-checked", "");
    // Same jsdom PointerEvent gap as the checkbox clicks above — drive the toggle
    // through the hidden native `<input type="radio">` instead of the visible span.
    // `PopoverContent` renders through a portal (a direct child of `<body>`, outside
    // the `render()` call's own `container`), so query from `document` instead.
    const hiddenInputs = document.querySelectorAll<HTMLInputElement>('input[type="radio"]');
    expect(hiddenInputs).toHaveLength(2);
    await user.click(hiddenInputs[1]!);
    expect(onDensityChange).toHaveBeenCalledWith("compact");
  });

  it("always renders the 'Columns' label in the DOM — the @xl/list collapse is a CSS class, not a conditional render", () => {
    render(
      <DataTableColumnsMenu
        columnMenuEntries={columnMenuEntries}
        columns={columns}
        onColumnsChange={vi.fn()}
        density="comfortable"
        onDensityChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Columns")).toBeInTheDocument();
  });

  it('placement="menu" renders the same body as a labeled section, with no Menu.Root dependency', () => {
    render(
      <DataTableColumnsMenu
        columnMenuEntries={columnMenuEntries}
        columns={columns}
        onColumnsChange={vi.fn()}
        density="comfortable"
        onDensityChange={vi.fn()}
        placement="menu"
      />,
    );
    expect(screen.getByRole("checkbox", { name: "Title" })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(2);
  });

  // Developer-reported fix, binding: the Base UI `ScrollArea`'s scrollbar is an
  // OVERLAY (absolutely positioned at the Viewport's own right edge, not
  // reserving space in normal flow) — the row list's pin-right buttons sit
  // flush against that same right edge, so the thumb painted directly over
  // them. `pr-3` on the row list reserves a gutter wider than the scrollbar's
  // own `w-2.5` track, always (not conditional on whether the list actually
  // overflows its fixed 240px height) — "zero shift whether or not it scrolls".
  it("reserves a scrollbar gutter on the row list so the pin-right buttons never render under the overlay scrollbar", () => {
    render(
      <DataTableColumnsMenu
        columnMenuEntries={columnMenuEntries}
        columns={columns}
        onColumnsChange={vi.fn()}
        density="comfortable"
        onDensityChange={vi.fn()}
        placement="menu"
      />,
    );
    const rowList = document.querySelector('[data-slot="columns-menu-rows"]');
    expect(rowList).toHaveClass("pr-3");
    // The pin-right button lives INSIDE the gutter-reserving container, not
    // in some sibling the padding wouldn't protect.
    const pinRightButton = screen.getByRole("button", { name: "Pin Title right" });
    expect(rowList).toContainElement(pinRightButton);
  });

});

describe("reorderColumns", () => {
  it("moves a field within an all-readable order", () => {
    expect(
      reorderColumns({
        columns: ["a", "b", "c"],
        readableFields: ["a", "b", "c"],
        from: 0,
        to: 2,
      }),
    ).toEqual(["b", "c", "a"]);
  });

  it("returns the unchanged order when from equals to", () => {
    const columnsInput = ["a", "b", "c"];
    expect(
      reorderColumns({ columns: columnsInput, readableFields: ["a", "b", "c"], from: 1, to: 1 }),
    ).toBe(columnsInput);
  });

  it("keeps an unreadable field's absolute position untouched, shifting only readable fields around it", () => {
    // Full order: a (unreadable), b, c, d — only b/c/d have rows in this
    // menu (readableFields). Dragging "d" (readable index 2) to readable
    // index 0 must still leave "a" at absolute position 0.
    expect(
      reorderColumns({
        columns: ["a", "b", "c", "d"],
        readableFields: ["b", "c", "d"],
        from: 2,
        to: 0,
      }),
    ).toEqual(["a", "d", "b", "c"]);
  });

  it("moving the first readable field to the last position", () => {
    expect(
      reorderColumns({
        columns: ["a", "b", "c"],
        readableFields: ["a", "b", "c"],
        from: 0,
        to: 2,
      }),
    ).toEqual(["b", "c", "a"]);
  });

  it("preserves each moved entry's own width/pinned/hidden overrides", () => {
    expect(
      reorderColumns({
        columns: [{ field: "a", width: 200 }, "b", { field: "c", pinned: "left" }],
        readableFields: ["a", "b", "c"],
        from: 2,
        to: 0,
      }),
    ).toEqual([{ field: "c", pinned: "left" }, { field: "a", width: 200 }, "b"]);
  });
});
