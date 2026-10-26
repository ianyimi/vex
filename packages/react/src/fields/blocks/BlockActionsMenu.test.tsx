import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { BlockActionsMenu } from "./BlockActionsMenu";
import { FormCompactContext } from "../../forms/FormCompactContext";

const baseProps = {
  index: 1,
  count: 3,
  readOnly: false,
  canAdd: true,
  blockLabel: "Heading",
  onDuplicate: vi.fn(),
  onInsertAbove: vi.fn(),
  onInsertBelow: vi.fn(),
  onMoveUp: vi.fn(),
  onMoveDown: vi.fn(),
  onRemove: vi.fn(),
  onCopy: vi.fn(),
  onPasteAbove: vi.fn(),
  onPasteBelow: vi.fn(),
  canPaste: true,
};

async function openMenu() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Heading actions" }));
  await screen.findByRole("menu");
  return user;
}

/** Renders the menu in a compact form column, where every action lives in the ⋯ menu. */
function renderCompact(props: ComponentProps<typeof BlockActionsMenu>) {
  return render(
    <FormCompactContext.Provider value>
      <BlockActionsMenu {...props} />
    </FormCompactContext.Provider>,
  );
}

describe("BlockActionsMenu", () => {
  it("invokes each handler when its menu item is clicked", async () => {
    const props = {
      ...baseProps,
      onDuplicate: vi.fn(),
      onInsertAbove: vi.fn(),
      onInsertBelow: vi.fn(),
      onMoveUp: vi.fn(),
      onMoveDown: vi.fn(),
      onRemove: vi.fn(),
    };
    renderCompact(props);

    let user = await openMenu();
    await user.click(screen.getByRole("menuitem", { name: "Duplicate" }));
    expect(props.onDuplicate).toHaveBeenCalledTimes(1);

    user = await openMenu();
    await user.click(await screen.findByRole("menuitem", { name: "Insert above" }));
    expect(props.onInsertAbove).toHaveBeenCalledTimes(1);

    user = await openMenu();
    await user.click(await screen.findByRole("menuitem", { name: "Insert below" }));
    expect(props.onInsertBelow).toHaveBeenCalledTimes(1);

    user = await openMenu();
    await user.click(await screen.findByRole("menuitem", { name: "Move up" }));
    expect(props.onMoveUp).toHaveBeenCalledTimes(1);

    user = await openMenu();
    await user.click(await screen.findByRole("menuitem", { name: "Move down" }));
    expect(props.onMoveDown).toHaveBeenCalledTimes(1);

    user = await openMenu();
    await user.click(await screen.findByRole("menuitem", { name: "Remove" }));
    expect(props.onRemove).toHaveBeenCalledTimes(1);
  });

  it("does not invoke onMoveUp when the block is already first", async () => {
    const onMoveUp = vi.fn();
    renderCompact({ ...baseProps, index: 0, count: 3, onMoveUp });
    const user = await openMenu();
    await user.click(screen.getByRole("menuitem", { name: "Move up" }));
    expect(onMoveUp).not.toHaveBeenCalled();
  });

  it("does not invoke onMoveDown when the block is already last", async () => {
    const onMoveDown = vi.fn();
    renderCompact({ ...baseProps, index: 2, count: 3, onMoveDown });
    const user = await openMenu();
    await user.click(screen.getByRole("menuitem", { name: "Move down" }));
    expect(onMoveDown).not.toHaveBeenCalled();
  });

  it("does not invoke onDuplicate/onInsertAbove/onInsertBelow when canAdd is false", async () => {
    const onDuplicate = vi.fn();
    renderCompact({ ...baseProps, canAdd: false, onDuplicate });
    const user = await openMenu();
    await user.click(screen.getByRole("menuitem", { name: "Duplicate" }));
    expect(onDuplicate).not.toHaveBeenCalled();
  });

  it("disables mutating actions, but not Copy, when readOnly", async () => {
    const onRemove = vi.fn();
    const onCopy = vi.fn();
    renderCompact({ ...baseProps, readOnly: true, onRemove, onCopy });
    const user = await openMenu();
    await user.click(screen.getByRole("menuitem", { name: "Remove" }));
    expect(onRemove).not.toHaveBeenCalled();

    await user.click(screen.getByRole("menuitem", { name: "Copy" }));
    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it("shows duplicate/move/remove as header icons when wide, and leaves them out of the menu", async () => {
    const onDuplicate = vi.fn();
    render(<BlockActionsMenu {...baseProps} onDuplicate={onDuplicate} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Duplicate block 2" }));
    expect(onDuplicate).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Move block 2 up" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove block 2" })).toBeInTheDocument();

    await openMenu();
    expect(screen.getByRole("menuitem", { name: "Copy" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Insert above" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Duplicate" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Remove" })).not.toBeInTheDocument();
  });

  it("shows no header icons when compact", () => {
    renderCompact(baseProps);
    expect(screen.queryByRole("button", { name: "Duplicate block 2" })).not.toBeInTheDocument();
  });
});
