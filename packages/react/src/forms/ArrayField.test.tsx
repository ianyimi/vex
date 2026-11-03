import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { DndProvider } from "../ui/dnd";
import { ArrayField } from "./ArrayField";
import { TextField } from "./TextField";

const { fieldContext, formContext } = createFormHookContexts();
const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { ArrayField, TextField },
  formComponents: {},
});

function Harness(props: { initialValue: string[]; max?: number; description?: string }) {
  const form = useAppForm({ defaultValues: { tags: props.initialValue } });
  return (
    <DndProvider>
      <form.AppForm>
      <form.AppField name="tags" mode="array">
        {(field) => (
          <field.ArrayField
            label="Tags"
            description={props.description}
            itemLabel="Tag"
            pluralLabel="tags"
            max={props.max}
            createItem={() => ""}
            renderItem={({ name }) => (
              <form.AppField name={name as "tags[0]"}>
                {(itemField) => <itemField.TextField label="Tag value" />}
              </form.AppField>
            )}
          />
        )}
      </form.AppField>
      <form.Subscribe selector={(state) => state.values.tags}>
        {(value) => <output data-testid="value-probe">{JSON.stringify(value)}</output>}
      </form.Subscribe>
      </form.AppForm>
    </DndProvider>
  );
}

describe("ArrayField", () => {
  it("renders one renderItem per array entry", () => {
    render(<Harness initialValue={["a", "b"]} />);
    expect(screen.getAllByLabelText(/Tag value/)).toHaveLength(2);
  });

  it("visually hides a primitive item's own label (sr-only) so the gutter's drag handle/index/item-actions row aligns with the input's height, while keeping the label in the accessibility tree", () => {
    render(<Harness initialValue={["a"]} />);
    const input = screen.getByLabelText(/Tag value/);
    const label = document.getElementById(`${input.id}-label`);
    expect(label).not.toBeNull();
    expect(label).toHaveClass("sr-only");
  });

  it("shows the empty state with no items", () => {
    render(<Harness initialValue={[]} />);
    expect(screen.getByText("No tags yet.")).toBeInTheDocument();
  });

  it("adds a new item on click", async () => {
    const user = userEvent.setup();
    render(<Harness initialValue={[]} />);
    await user.click(screen.getByRole("button", { name: "Add Tag" }));
    expect(screen.getByTestId("value-probe")).toHaveTextContent('[""]');
  });

  it("disables add once max is reached", () => {
    render(<Harness initialValue={["a", "b"]} max={2} />);
    expect(screen.getByRole("button", { name: "Add Tag" })).toBeDisabled();
    expect(screen.getByText("Maximum 2 tags reached")).toBeInTheDocument();
  });

  it("renders the header, then the description, then the items — the label-block order, not under the items", () => {
    render(<Harness initialValue={["a"]} description="Helper text" />);
    const label = screen.getByText("Tags").closest("span")!;
    const description = screen.getByText("Helper text");
    const firstItem = screen.getByLabelText(/Tag value/);
    expect(label.compareDocumentPosition(description) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(description.compareDocumentPosition(firstItem) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
