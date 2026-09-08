import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import {
  adminFieldToInputSchema,
  blocks,
  defineBlock,
  text,
  type BaseFieldMeta,
  type BlocksField,
  type CollectionConfig,
  type GenericBlock,
  type InputComponentProps,
} from "@vexcms/core";
import { AppForm } from "../../form/AppForm";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { runNestedFieldContainerSuite } from "../../../testing/nestedFieldContainer";
import { BlocksFieldInput } from "./Input";
import { blocksFieldFixture } from "./testFixture";

/**
 * Wraps `BlocksFieldInput` with a nuqs testing adapter — the block editor's
 * open/closed state (`useQueryState`) throws without one. Passed as
 * `runFieldInputContractSuite`'s `Component` in place of the bare component.
 */
function TestBlocksFieldInput({
  name,
  fieldDef,
  readOnly,
  collection,
  index,
}: InputComponentProps<BaseFieldMeta, BlocksField> & { field?: unknown }) {
  return (
    <NuqsTestingAdapter>
      <BlocksFieldInput name={name} fieldDef={fieldDef} readOnly={readOnly} collection={collection} index={index} />
    </NuqsTestingAdapter>
  );
}

/**
 * Mounts `TestBlocksFieldInput` behind a real `useForm` + `<AppForm>`,
 * exposing the block array through a probe. The `onSubmit` validator maps
 * every Zod issue to its own dot/bracket-path field, matching `ArrayHarness`/
 * `GroupHarness`'s convention.
 */
function BlocksHarness(props: {
  fieldDef: BlocksField;
  collection?: CollectionConfig;
  initialValue: GenericBlock[];
  readOnly?: boolean;
}) {
  const form = useForm({
    defaultValues: { testField: props.initialValue },
    validators: {
      onSubmit: ({ value }) => {
        const schema = adminFieldToInputSchema({ field: props.fieldDef });
        const result = schema.safeParse((value as Record<string, unknown>).testField);
        if (result.success) return undefined;
        const fields: Record<string, string> = {};
        for (const issue of result.error.issues) {
          fields[["testField", ...issue.path].join(".")] = issue.message;
        }
        return { fields };
      },
    },
  });
  return (
    <AppForm form={form}>
      <TestBlocksFieldInput
        name="testField"
        fieldDef={props.fieldDef}
        collection={props.collection ?? testCollection}
        readOnly={props.readOnly ?? false}
      />
      <button type="submit">Submit</button>
      <form.Subscribe selector={(state) => state.values.testField}>
        {(value) => <output data-testid="value-probe">{JSON.stringify(value)}</output>}
      </form.Subscribe>
    </AppForm>
  );
}

runFieldInputContractSuite({
  fixture: blocksFieldFixture,
  Component: TestBlocksFieldInput,
  extra: () => {
    // Two block types — the single-block "skip the picker" shortcut in
    // FormBlocks (`fieldDef.blocks.length === 1`) only applies to
    // `blocksFieldFixture`'s own one-block fixture; the picker dialog itself
    // needs a field with more than one registered type to exercise.
    const headingBlock = defineBlock({
      slug: "heading",
      label: "Heading",
      fields: { text: text({ label: "Heading text", required: true }) },
    });
    const paragraphBlock = defineBlock({
      slug: "paragraph",
      label: "Paragraph",
      fields: { text: text({ label: "Body", required: true }) },
    });
    const twoBlockFieldDef = blocks({ label: "Body", blocks: [headingBlock, paragraphBlock] });
    const boundaryFieldDef = blocks({
      label: "Sections",
      labels: { singular: "Section", plural: "Sections" },
      blocks: [headingBlock, paragraphBlock],
      min: 2,
      max: 3,
    });

    describe("blocks: the block-type picker, blockName/id generation, removal, the unknown-blockType fallback, min/max counts, and the nuqs-driven editor modal", () => {
      it("opens the block-type picker dialog when more than one block type is registered, listing every block's label", async () => {
        const user = userEvent.setup();
        render(<BlocksHarness fieldDef={twoBlockFieldDef} initialValue={[]} />);

        await user.click(screen.getByRole("button", { name: `Add ${twoBlockFieldDef.labels.singular}` }));

        const dialog = await screen.findByRole("dialog");
        expect(within(dialog).getByText("Add block")).toBeInTheDocument();
        expect(within(dialog).getByText("Heading")).toBeInTheDocument();
        expect(within(dialog).getByText("Paragraph")).toBeInTheDocument();
        // Each row shows its own field count — both blocks here declare one field.
        expect(dialog.textContent).toContain("heading · 1 field");
        expect(dialog.textContent).toContain("paragraph · 1 field");
      });

      it("filters the picker's block list by label or slug, case-insensitively, and shows 'No blocks found' for no match", async () => {
        const user = userEvent.setup();
        render(<BlocksHarness fieldDef={twoBlockFieldDef} initialValue={[]} />);
        await user.click(screen.getByRole("button", { name: `Add ${twoBlockFieldDef.labels.singular}` }));
        const dialog = await screen.findByRole("dialog");

        await user.type(within(dialog).getByPlaceholderText("Search blocks…"), "HEAD");
        expect(within(dialog).getByText("Heading")).toBeInTheDocument();
        expect(within(dialog).queryByText("Paragraph")).not.toBeInTheDocument();

        await user.clear(within(dialog).getByPlaceholderText("Search blocks…"));
        await user.type(within(dialog).getByPlaceholderText("Search blocks…"), "zzz-no-match");
        expect(within(dialog).getByText("No blocks found")).toBeInTheDocument();
      });

      it("toggles a row's selection instead of adding immediately, and only reveals the confirm button once at least one block is selected", async () => {
        const user = userEvent.setup();
        render(<BlocksHarness fieldDef={twoBlockFieldDef} initialValue={[]} />);
        await user.click(screen.getByRole("button", { name: `Add ${twoBlockFieldDef.labels.singular}` }));
        const dialog = await screen.findByRole("dialog");

        expect(within(dialog).queryByRole("button", { name: /^Add \d+ blocks?$/ })).not.toBeInTheDocument();
        await user.click(within(dialog).getByText("Heading"));
        expect(await within(dialog).findByRole("button", { name: "Add 1 block" })).toBeInTheDocument();
        // A row click only toggles selection — nothing was added yet, and the dialog stays open.
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByTestId("value-probe")).toHaveTextContent("[]");
      });

      it("adds every selected block type in the field's OWN registration order, not click order, and closes the picker", async () => {
        const user = userEvent.setup();
        render(<BlocksHarness fieldDef={twoBlockFieldDef} initialValue={[]} />);
        await user.click(screen.getByRole("button", { name: `Add ${twoBlockFieldDef.labels.singular}` }));
        const dialog = await screen.findByRole("dialog");

        // Click Paragraph (registered second) before Heading (registered first).
        await user.click(within(dialog).getByText("Paragraph"));
        await user.click(within(dialog).getByText("Heading"));
        await user.click(within(dialog).getByRole("button", { name: "Add 2 blocks" }));

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        const values = JSON.parse(screen.getByTestId("value-probe").textContent ?? "[]") as { blockType: string }[];
        // BlockPickerDialog's handleAddBlocks filters `props.blockDefs` (the
        // field's own registration order) by the selected set — it does not
        // preserve click order.
        expect(values.map((b) => b.blockType)).toEqual(["heading", "paragraph"]);
      });

      it("seeds a new block's blockName from the block definition's label and gives it a fresh, unique id", async () => {
        const user = userEvent.setup();
        // Single registered block type — Add bypasses the picker dialog entirely.
        render(<BlocksHarness fieldDef={blocksFieldFixture.fieldDef} initialValue={[]} />);
        const addButton = screen.getByRole("button", { name: `Add ${blocksFieldFixture.fieldDef.labels.singular}` });
        await user.click(addButton);
        await user.click(addButton);

        const values = JSON.parse(screen.getByTestId("value-probe").textContent ?? "[]") as {
          id: string;
          blockName?: string;
        }[];
        expect(values).toHaveLength(2);
        expect(values[0]?.blockName).toBe("Paragraph");
        expect(values[1]?.blockName).toBe("Paragraph");
        expect(values[0]?.id).toEqual(expect.any(String));
        expect(values[0]?.id).not.toBe(values[1]?.id);
      });

      it("edits a block's blockName in place without toggling the accordion, and leaves that block's own field values untouched", async () => {
        const user = userEvent.setup();
        const seeded: GenericBlock[] = [
          { id: "block-1", blockType: "paragraph", blockName: "Paragraph", text: "Original body" },
        ];
        const { container } = render(
          <BlocksHarness fieldDef={blocksFieldFixture.fieldDef} initialValue={seeded} />,
        );

        const trigger = container.querySelector("[aria-expanded]") as HTMLElement;
        // Starts open (`admin.defaultCollapsed` defaults to `false`) — collapse it first.
        await user.click(trigger);
        expect(trigger).toHaveAttribute("aria-expanded", "false");
        expect(screen.getByLabelText("Text")).not.toBeVisible();

        const blockNameInput = screen.getByDisplayValue("Paragraph");
        await user.clear(blockNameInput);
        await user.type(blockNameInput, "Intro");

        // Typing into the blockName input must not have re-expanded the
        // accordion — FormBlocks stops click propagation for exactly this.
        expect(trigger).toHaveAttribute("aria-expanded", "false");

        const values = JSON.parse(screen.getByTestId("value-probe").textContent ?? "[]") as {
          blockName?: string;
          text?: string;
        }[];
        expect(values[0]?.blockName).toBe("Intro");
        expect(values[0]?.text).toBe("Original body");
      });

      it("removes one block by its own labeled button, leaving a differently-typed sibling block's field values untouched", async () => {
        const user = userEvent.setup();
        const seeded: GenericBlock[] = [
          { id: "h1", blockType: "heading", blockName: "Heading", text: "Welcome" },
          { id: "p1", blockType: "paragraph", blockName: "Paragraph", text: "Body copy" },
        ];
        render(<BlocksHarness fieldDef={twoBlockFieldDef} initialValue={seeded} />);

        await user.click(screen.getByRole("button", { name: "Remove Heading block" }));

        const values = JSON.parse(screen.getByTestId("value-probe").textContent ?? "[]") as {
          blockType: string;
          text?: string;
        }[];
        expect(values).toHaveLength(1);
        expect(values[0]?.blockType).toBe("paragraph");
        expect(values[0]?.text).toBe("Body copy");
      });

      it("renders the unknown-block-type fallback for a seeded item whose blockType isn't registered, and removes it via its own inline button", async () => {
        // The fallback's own remove button carries no `aria-label` (unlike
        // the normal block header's `Remove ${label} block`) — a real,
        // separate accessibility gap this test's own selector has to route
        // around rather than paper over.
        const user = userEvent.setup();
        const seeded = [{ id: "legacy-1", blockType: "legacy-grid" }] as unknown as GenericBlock[];
        const { container } = render(
          <BlocksHarness fieldDef={blocksFieldFixture.fieldDef} initialValue={seeded} />,
        );

        expect(screen.getByText(/unknown block type/i)).toBeInTheDocument();
        expect(screen.getByText("legacy-grid")).toBeInTheDocument();

        const fallbackRemoveButton = container.querySelector(".text-destructive button") as HTMLElement;
        await user.click(fallbackRemoveButton);

        expect(
          await screen.findByText(`No ${blocksFieldFixture.fieldDef.labels.plural} yet.`),
        ).toBeInTheDocument();
      });

      it("fails validation below min, with the real schema message, and passes at exactly min", async () => {
        const oneBlock: GenericBlock[] = [{ id: "h1", blockType: "heading", blockName: "Heading", text: "Hi" }];
        const schema = adminFieldToInputSchema({ field: boundaryFieldDef });
        const belowMin = schema.safeParse(oneBlock);
        expect(belowMin.success).toBe(false);
        const message = !belowMin.success ? belowMin.error.issues[0]?.message : undefined;
        expect(message).toBe("At least 2 Sections required.");

        const user = userEvent.setup();
        render(<BlocksHarness fieldDef={boundaryFieldDef} initialValue={oneBlock} />);
        await user.click(screen.getByRole("button", { name: /submit/i }));
        expect(await screen.findByText(message!)).toBeInTheDocument();
      });

      it("passes validation at exactly min", async () => {
        const twoBlocks: GenericBlock[] = [
          { id: "h1", blockType: "heading", blockName: "Heading", text: "Hi" },
          { id: "p1", blockType: "paragraph", blockName: "Paragraph", text: "Body" },
        ];
        const user = userEvent.setup();
        const { container } = render(<BlocksHarness fieldDef={boundaryFieldDef} initialValue={twoBlocks} />);
        await user.click(screen.getByRole("button", { name: /submit/i }));
        expect(container.querySelector(".text-destructive")?.textContent).toBeFalsy();
      });

      it("disables the Add button and shows the 'Maximum reached' text at exactly max, but not one below it", () => {
        const twoBlocks: GenericBlock[] = [
          { id: "h1", blockType: "heading", blockName: "Heading", text: "Hi" },
          { id: "p1", blockType: "paragraph", blockName: "Paragraph", text: "Body" },
        ];
        const threeBlocks: GenericBlock[] = [
          ...twoBlocks,
          { id: "h2", blockType: "heading", blockName: "Heading", text: "More" },
        ];

        const belowMax = render(<BlocksHarness fieldDef={boundaryFieldDef} initialValue={twoBlocks} />);
        expect(belowMax.getByRole("button", { name: "Add Section" })).toBeEnabled();
        expect(belowMax.queryByText(/maximum/i)).not.toBeInTheDocument();
        belowMax.unmount();

        const atMax = render(<BlocksHarness fieldDef={boundaryFieldDef} initialValue={threeBlocks} />);
        expect(atMax.getByRole("button", { name: "Add Section" })).toBeDisabled();
        expect(atMax.getByText("Maximum 3 Sections reached")).toBeInTheDocument();
      });

      it("fails validation above max, with the real schema message, when items were seeded past the limit directly", async () => {
        const fourBlocks: GenericBlock[] = [
          { id: "h1", blockType: "heading", blockName: "Heading", text: "1" },
          { id: "p1", blockType: "paragraph", blockName: "Paragraph", text: "2" },
          { id: "h2", blockType: "heading", blockName: "Heading", text: "3" },
          { id: "p2", blockType: "paragraph", blockName: "Paragraph", text: "4" },
        ];
        const user = userEvent.setup();
        render(<BlocksHarness fieldDef={boundaryFieldDef} initialValue={fourBlocks} />);
        await user.click(screen.getByRole("button", { name: /submit/i }));
        expect(await screen.findByText("No more than 3 Sections allowed.")).toBeInTheDocument();
      });

      it("closes the picker dialog on Escape without adding any block", async () => {
        const user = userEvent.setup();
        render(<BlocksHarness fieldDef={twoBlockFieldDef} initialValue={[]} />);
        await user.click(screen.getByRole("button", { name: `Add ${twoBlockFieldDef.labels.singular}` }));
        await screen.findByRole("dialog");

        await user.keyboard("{Escape}");

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(screen.getByTestId("value-probe")).toHaveTextContent("[]");
      });

      it("exposes an active drag handle per block when there is more than one, and degrades every handle to inert when readOnly", () => {
        const seeded: GenericBlock[] = [
          { id: "h1", blockType: "heading", blockName: "Heading", text: "Hi" },
          { id: "p1", blockType: "paragraph", blockName: "Paragraph", text: "Body" },
        ];
        const editable = render(<BlocksHarness fieldDef={twoBlockFieldDef} initialValue={seeded} />);
        expect(editable.container.querySelectorAll("[data-rfd-drag-handle-draggable-id]")).toHaveLength(2);
        editable.unmount();

        const readOnly = render(<BlocksHarness fieldDef={twoBlockFieldDef} initialValue={seeded} readOnly />);
        expect(readOnly.container.querySelectorAll("[data-rfd-drag-handle-draggable-id]")).toHaveLength(0);
      });
    });
  },
});

runNestedFieldContainerSuite({
  container: "blocks",
  Component: BlocksFieldInput,
  // One child per representative category — simple (text), choice (select),
  // temporal (date), network-via-react-query (upload) — plus "array", since a
  // block field may itself be an array (`BlockConfigInput.fields` accepts any
  // `AdminField`).
  //
  // `relationship` is deliberately excluded — see the rationale comment in
  // `array/Input.test.tsx`: its Convex live-query bridge needs
  // infrastructure this shared harness's `stubClientConfig` doesn't provide.
  childFieldTypes: ["text", "select", "date", "upload", "array"],
});
