import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { DndProvider } from "../ui/dnd";
import { BlocksField, type GenericBlockItem } from "./BlocksField";

interface HeroBlock extends GenericBlockItem {
  blockType: "hero";
  heading: string;
}

const { fieldContext, formContext } = createFormHookContexts();
const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { BlocksField },
  formComponents: {},
});

const blockTypes = [
  {
    type: "hero",
    label: "Hero",
    newBlock: (): HeroBlock => ({ id: crypto.randomUUID(), blockType: "hero", heading: "" }),
  },
];

function Harness(props: { initialValue: HeroBlock[]; max?: number; cloneBlock?: (block: HeroBlock) => HeroBlock; headerActions?: React.ReactNode }) {
  const form = useAppForm({ defaultValues: { body: props.initialValue } });
  return (
    <DndProvider>
      <form.AppForm>
      <form.AppField name="body" mode="array">
        {(field) => (
          <field.BlocksField
            label="Body"
            blockTypes={blockTypes}
            max={props.max}
            cloneBlock={props.cloneBlock}
            renderBlock={({ block }) => <span data-testid={`block-${block.id}`}>{block.blockType}</span>}
            headerActions={props.headerActions === undefined ? undefined : () => props.headerActions}
            itemActions={({ onDuplicate }) =>
              onDuplicate ? (
                <button type="button" onClick={onDuplicate}>
                  Duplicate
                </button>
              ) : null
            }
          />
        )}
      </form.AppField>
      <form.Subscribe selector={(state) => state.values.body}>
        {(value) => <output data-testid="value-probe">{JSON.stringify(value.map((b) => b.blockType))}</output>}
      </form.Subscribe>
      </form.AppForm>
    </DndProvider>
  );
}

describe("BlocksField", () => {
  it("shows the empty state with no blocks", () => {
    render(<Harness initialValue={[]} />);
    expect(screen.getByText("No blocks yet.")).toBeInTheDocument();
  });

  it("inserts the single block type immediately on Add, skipping the picker", async () => {
    const user = userEvent.setup();
    render(<Harness initialValue={[]} />);
    await user.click(screen.getByRole("button", { name: "Add block" }));
    expect(screen.getByTestId("value-probe")).toHaveTextContent('["hero"]');
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("focuses the picker's search field when it opens, via a ref effect, not the autoFocus attribute", async () => {
    const user = userEvent.setup();
    const twoBlockTypes = [
      ...blockTypes,
      {
        type: "cta",
        label: "CTA",
        newBlock: (): HeroBlock => ({ id: crypto.randomUUID(), blockType: "hero", heading: "" }),
      },
    ];
    function TwoTypeHarness() {
      const form = useAppForm({ defaultValues: { body: [] as HeroBlock[] } });
      return (
        <DndProvider>
          <form.AppForm>
            <form.AppField name="body" mode="array">
              {(field) => (
                <field.BlocksField
                  label="Body"
                  blockTypes={twoBlockTypes}
                  renderBlock={({ block }) => <span>{block.blockType}</span>}
                />
              )}
            </form.AppField>
          </form.AppForm>
        </DndProvider>
      );
    }
    render(<TwoTypeHarness />);
    await user.click(screen.getByRole("button", { name: "Add block" }));
    const search = await screen.findByPlaceholderText("Search blocks…");
    expect(search).not.toHaveAttribute("autofocus");
    expect(search).toHaveFocus();
  });

  it("disables Add once max is reached", () => {
    const existing: HeroBlock[] = [{ id: "a", blockType: "hero", heading: "" }];
    render(<Harness initialValue={existing} max={1} />);
    expect(screen.getByRole("button", { name: "Add block" })).toBeDisabled();
  });

  it("renders renderBlock for each existing item inside its accordion content", () => {
    const existing: HeroBlock[] = [{ id: "a", blockType: "hero", heading: "" }];
    render(<Harness initialValue={existing} />);
    expect(screen.getByTestId("block-a")).toBeInTheDocument();
  });

  it("omits Duplicate from item actions without a cloneBlock prop", () => {
    const existing: HeroBlock[] = [{ id: "a", blockType: "hero", heading: "" }];
    render(<Harness initialValue={existing} />);
    expect(screen.queryByRole("button", { name: "Duplicate" })).not.toBeInTheDocument();
  });

  it("inserts the cloned block at index + 1 when cloneBlock is given", async () => {
    const user = userEvent.setup();
    const existing: HeroBlock[] = [{ id: "a", blockType: "hero", heading: "Hi" }];
    const cloneBlock = (block: HeroBlock): HeroBlock => ({ ...block, id: "clone-of-a" });
    render(<Harness initialValue={existing} cloneBlock={cloneBlock} />);
    await user.click(screen.getByRole("button", { name: "Duplicate" }));
    await user.click(screen.getByRole("button", { name: "Expand all" }));
    expect(screen.getAllByTestId(/^block-/)).toHaveLength(2);
    expect(screen.getByTestId("block-clone-of-a")).toBeInTheDocument();
  });

  it("keeps Collapse all/Expand all inline at full width while header actions always sit in the ⋯ menu", async () => {
    const user = userEvent.setup();
    const existing: HeroBlock[] = [{ id: "a", blockType: "hero", heading: "" }];
    render(<Harness initialValue={existing} headerActions={<span>Copy all</span>} />);
    expect(screen.getByRole("button", { name: "Collapse all" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Expand all" })).toBeInTheDocument();
    expect(screen.queryByText("Copy all")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Body actions" }));
    expect(await screen.findByText("Copy all")).toBeInTheDocument();
  });

  it("never nests the block-rename Input inside the accordion trigger button (F-091: nested-interactive)", () => {
    const existing: HeroBlock[] = [{ id: "a", blockType: "hero", heading: "" }];
    const { container } = render(<Harness initialValue={existing} />);
    const trigger = container.querySelector('[data-slot="accordion-trigger"]');
    expect(trigger).not.toBeNull();
    expect(trigger?.querySelector("input")).toBeNull();
  });

  it("points aria-controls at the real panel id while open, and never leaves it dangling once collapsed", async () => {
    const user = userEvent.setup();
    const existing: HeroBlock[] = [{ id: "a", blockType: "hero", heading: "" }];
    const { container } = render(<Harness initialValue={existing} />);
    const trigger = container.querySelector('[data-slot="accordion-trigger"]') as HTMLElement;

    await user.click(screen.getByRole("button", { name: "Expand all" }));
    const controlsId = trigger.getAttribute("aria-controls");
    expect(controlsId).toBeTruthy();
    expect(document.getElementById(controlsId!)).not.toBeNull();

    await user.click(screen.getByRole("button", { name: "Collapse all" }));
    const collapsedControls = trigger.getAttribute("aria-controls");
    if (collapsedControls) {
      expect(document.getElementById(collapsedControls)).not.toBeNull();
    }
  });

  it("labels the block-rename input with its block type", () => {
    const existing: HeroBlock[] = [{ id: "a", blockType: "hero", heading: "" }];
    render(<Harness initialValue={existing} />);
    expect(screen.getByLabelText("Hero block name")).toBeInTheDocument();
  });
});
