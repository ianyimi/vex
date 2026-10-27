import { describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import {
  adminFieldToInputSchema,
  blocks,
  defineBlock,
  defineConfig,
  text,
  type BaseFieldMeta,
  type BlocksField,
  type CollectionConfig,
  type GenericBlock,
  type FieldComponentProps,
  type VexAccessConfig,
  type VexApiAuth,
} from "@vexcms/core";
import { AppForm, FormCompactContext } from "../../forms";
import { VexConfigProvider } from "../../config/VexConfigContext";
import { VexAuthProvider } from "../../auth/VexAuthContext";
import { testAccess, testCollection, testUsers } from "../../testing/harness/accessFixtures";
import { runFieldInputContractSuite } from "../../testing/fieldInputContract";
import { runNestedFieldContainerSuite } from "../../testing/nestedFieldContainer";
import { BlocksFieldAdmin } from "./Field";
import { BLOCK_CLIPBOARD_STORAGE_KEY } from "./useBlockClipboard";
import { blocksFieldFixture } from "./testFixture";

const testConfig = defineConfig();

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
}: FieldComponentProps<BaseFieldMeta, BlocksField> & { field?: unknown }) {
  return (
    <NuqsTestingAdapter>
      <BlocksFieldAdmin name={name} fieldDef={fieldDef} readOnly={readOnly} collection={collection} index={index} />
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
  /** Forces header actions into the ⋯ menu placement, as a narrow form column would. */
  compact?: boolean;
  /** RBAC matrix to provide; omit to leave access unconfigured (every action allowed). */
  access?: VexAccessConfig;
  /** Caller to seed `VexAuthContext` with; defaults to `{ user: null }`. */
  auth?: VexApiAuth;
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
  const field = (
    <TestBlocksFieldInput
      name="testField"
      fieldDef={props.fieldDef}
      collection={props.collection ?? testCollection}
      readOnly={props.readOnly ?? false}
    />
  );
  return (
    <VexConfigProvider
      config={
        props.access
          ? defineConfig({ collections: [testCollection], access: props.access })
          : testConfig
      }
    >
      <VexAuthProvider value={props.auth ?? { user: null }}>
        <AppForm form={form}>
          {props.compact ? (
            <FormCompactContext.Provider value>{field}</FormCompactContext.Provider>
          ) : (
            field
          )}
          <button type="submit">Submit</button>
          <form.Subscribe selector={(state) => state.values.testField}>
            {(value) => <output data-testid="value-probe">{JSON.stringify(value)}</output>}
          </form.Subscribe>
        </AppForm>
      </VexAuthProvider>
    </VexConfigProvider>
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
      required: true,
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

        // Base UI's Dialog.Popup unmounts only after its CSS exit animation
        // completes (`data-closed:animate-out`), so a synchronous assertion
        // right after the click races the animation-driven unmount — a
        // harness timing gap, not a component defect (same class as the
        // Popover case documented in relationship/Input.test.tsx).
        await waitFor(() => {
          expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        });
        const values = JSON.parse(screen.getByTestId("value-probe").textContent ?? "[]") as { blockType: string }[];
        // BlockPickerDialog's handleAddBlocks filters `props.blockDefs` (the
        // field's own registration order) by the selected set — it does not
        // preserve click order.
        expect(values.map((b) => b.blockType)).toEqual(["heading", "paragraph"]);
      });

      it("seeds a new block with a fresh, unique id and no blockName, so the block definition's label shows as a placeholder", async () => {
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
        expect(values[0]?.blockName).toBeUndefined();
        expect(values[1]?.blockName).toBeUndefined();
        expect(values[0]?.id).toEqual(expect.any(String));
        expect(values[0]?.id).not.toBe(values[1]?.id);
        expect(screen.getAllByPlaceholderText("Paragraph")).toHaveLength(2);
      });

      it("edits a block's blockName in place without toggling the accordion, and leaves that block's own field values untouched", async () => {
        const user = userEvent.setup();
        const seeded: GenericBlock[] = [
          { id: "block-1", blockType: "paragraph", blockName: "Paragraph", text: "Original body" },
        ];
        const { container } = render(
          <BlocksHarness fieldDef={blocksFieldFixture.fieldDef} initialValue={seeded} />,
        );

        await waitFor(() =>
          expect(container.querySelector("[data-rfd-draggable-id]")).not.toBeNull(),
        );
        const trigger = container.querySelector('[data-slot="accordion-trigger"]') as HTMLElement;
        // Starts open (`admin.defaultCollapsed` defaults to `false`) — collapse it first.
        await user.click(trigger);
        await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"));
        expect(screen.queryByLabelText("Text")).not.toBeInTheDocument();

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

      it("removes one block via its inline Remove action, leaving a differently-typed sibling block's field values untouched", async () => {
        const user = userEvent.setup();
        const seeded: GenericBlock[] = [
          { id: "h1", blockType: "heading", blockName: "Heading", text: "Welcome" },
          { id: "p1", blockType: "paragraph", blockName: "Paragraph", text: "Body copy" },
        ];
        render(<BlocksHarness fieldDef={twoBlockFieldDef} initialValue={seeded} />);

        await user.click(screen.getByRole("button", { name: "Remove block 1" }));

        const values = JSON.parse(screen.getByTestId("value-probe").textContent ?? "[]") as {
          blockType: string;
          text?: string;
        }[];
        expect(values).toHaveLength(1);
        expect(values[0]?.blockType).toBe("paragraph");
        expect(values[0]?.text).toBe("Body copy");
      });

      it("lists one block's ⋯ actions menu in insert above/insert below/copy/paste above/paste below order at full width, with duplicate/move/remove inline instead", async () => {
        const user = userEvent.setup();
        const seeded: GenericBlock[] = [
          { id: "h1", blockType: "heading", blockName: "Heading", text: "Welcome" },
          { id: "p1", blockType: "paragraph", blockName: "Paragraph", text: "Body copy" },
        ];
        render(<BlocksHarness fieldDef={twoBlockFieldDef} initialValue={seeded} />);

        expect(screen.getByRole("button", { name: "Duplicate block 1" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Move block 1 up" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Move block 1 down" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Remove block 1" })).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Heading actions" }));
        const menu = await screen.findByRole("menu");
        expect(within(menu).getAllByRole("menuitem").map((item) => item.textContent)).toEqual([
          "Insert above",
          "Insert below",
          "Copy",
          "Paste above",
          "Paste below",
        ]);
      });

      it("lists one block's ⋯ actions menu in duplicate/move up/move down/insert above/insert below/copy/paste above/paste below/remove order when compact", async () => {
        const user = userEvent.setup();
        const seeded: GenericBlock[] = [
          { id: "h1", blockType: "heading", blockName: "Heading", text: "Welcome" },
          { id: "p1", blockType: "paragraph", blockName: "Paragraph", text: "Body copy" },
        ];
        render(<BlocksHarness fieldDef={twoBlockFieldDef} initialValue={seeded} compact />);

        await user.click(screen.getByRole("button", { name: "Heading actions" }));
        const menu = await screen.findByRole("menu");
        expect(within(menu).getAllByRole("menuitem").map((item) => item.textContent)).toEqual([
          "Duplicate",
          "Move up",
          "Move down",
          "Insert above",
          "Insert below",
          "Copy",
          "Paste above",
          "Paste below",
          "Remove",
        ]);
      });

      it("lists the field's ⋯ actions menu in collapse all/expand all/copy all/paste/replace all order in a compact (narrow) form column", async () => {
        const user = userEvent.setup();
        const seeded: GenericBlock[] = [
          { id: "h1", blockType: "heading", blockName: "Heading", text: "Welcome" },
        ];
        render(<BlocksHarness fieldDef={twoBlockFieldDef} initialValue={seeded} compact />);

        await user.click(screen.getByRole("button", { name: `${twoBlockFieldDef.label} actions` }));
        const menu = await screen.findByRole("menu");
        expect(within(menu).getAllByRole("menuitem").map((item) => item.textContent)).toEqual([
          "Collapse all",
          "Expand all",
          "Copy all",
          "Paste",
          "Replace all",
        ]);
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
        expect(message).toBe("Must be at least 2 Sections.");

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

      it("disables Paste and Replace all when pasting the clipboard's contents would exceed the field's max (Finding 8 regression)", async () => {
        const user = userEvent.setup();
        const twoBlocks: GenericBlock[] = [
          { id: "h1", blockType: "heading", blockName: "Heading", text: "Hi" },
          { id: "p1", blockType: "paragraph", blockName: "Paragraph", text: "Body" },
        ];
        // Seed the real localStorage-backed clipboard (two blocks) ahead of
        // render — pasting them onto `twoBlocks` (max 3) would land at 4.
        window.localStorage.setItem(
          BLOCK_CLIPBOARD_STORAGE_KEY,
          JSON.stringify({
            version: 1,
            copiedAt: Date.now(),
            blocks: [
              { id: "clip-1", blockType: "heading", blockName: "Clip 1", text: "Clip 1" },
              { id: "clip-2", blockType: "paragraph", blockName: "Clip 2", text: "Clip 2" },
            ],
          }),
        );
        try {
          render(<BlocksHarness fieldDef={boundaryFieldDef} initialValue={twoBlocks} />);
          await user.click(screen.getByRole("button", { name: "Sections actions" }));
          expect(await screen.findByRole("menuitem", { name: "Paste" })).toHaveAttribute("aria-disabled", "true");
          expect(screen.getByRole("menuitem", { name: "Replace all" })).not.toHaveAttribute("aria-disabled", "true");

          await user.click(screen.getByRole("menuitem", { name: "Paste" }));
          const values = JSON.parse(screen.getByTestId("value-probe").textContent ?? "[]") as unknown[];
          expect(values).toHaveLength(2);
        } finally {
          window.localStorage.removeItem(BLOCK_CLIPBOARD_STORAGE_KEY);
        }
      });

      it("disables Replace all when the clipboard alone would exceed the field's max, even though pasting fewer blocks would not", async () => {
        const user = userEvent.setup();
        const oneBlock: GenericBlock[] = [{ id: "h1", blockType: "heading", blockName: "Heading", text: "Hi" }];
        window.localStorage.setItem(
          BLOCK_CLIPBOARD_STORAGE_KEY,
          JSON.stringify({
            version: 1,
            copiedAt: Date.now(),
            blocks: [
              { id: "clip-1", blockType: "heading", blockName: "Clip 1", text: "Clip 1" },
              { id: "clip-2", blockType: "paragraph", blockName: "Clip 2", text: "Clip 2" },
              { id: "clip-3", blockType: "heading", blockName: "Clip 3", text: "Clip 3" },
              { id: "clip-4", blockType: "paragraph", blockName: "Clip 4", text: "Clip 4" },
            ],
          }),
        );
        try {
          // 1 existing + 4 clipboard blocks = 5 (> max 3): Paste disabled.
          // Replace-all alone seeds 4 blocks (> max 3): also disabled.
          render(<BlocksHarness fieldDef={boundaryFieldDef} initialValue={oneBlock} />);
          await user.click(screen.getByRole("button", { name: "Sections actions" }));
          expect(await screen.findByRole("menuitem", { name: "Paste" })).toHaveAttribute("aria-disabled", "true");
          expect(screen.getByRole("menuitem", { name: "Replace all" })).toHaveAttribute("aria-disabled", "true");
        } finally {
          window.localStorage.removeItem(BLOCK_CLIPBOARD_STORAGE_KEY);
        }
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
        expect(
          await screen.findByText("Must be no more than 3 Sections."),
        ).toBeInTheDocument();
      });

      it("closes the picker dialog on Escape without adding any block", async () => {
        const user = userEvent.setup();
        render(<BlocksHarness fieldDef={twoBlockFieldDef} initialValue={[]} />);
        await user.click(screen.getByRole("button", { name: `Add ${twoBlockFieldDef.labels.singular}` }));
        await screen.findByRole("dialog");

        await user.keyboard("{Escape}");

        await waitFor(() => {
          expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        });
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

      it("treats blocks as read-only for a user denied update access to the collection, even when the readOnly prop itself is false (Finding 11 regression)", () => {
        const seeded: GenericBlock[] = [
          { id: "h1", blockType: "heading", blockName: "Heading", text: "Hi" },
          { id: "p1", blockType: "paragraph", blockName: "Paragraph", text: "Body" },
        ];
        const { container } = render(
          <BlocksHarness
            fieldDef={twoBlockFieldDef}
            initialValue={seeded}
            readOnly={false}
            access={testAccess.denied}
            auth={{ user: testUsers.denied }}
          />,
        );
        // Mirrors the readOnly-prop assertion above: no caller readOnly was
        // threaded in, so this is purely the field's own `usePermission`
        // defense-in-depth check (`fields/blocks/Field.tsx`) disabling drag
        // reordering because the signed-in user lacks collection update access.
        expect(container.querySelectorAll("[data-rfd-drag-handle-draggable-id]")).toHaveLength(0);
        expect(screen.getByRole("button", { name: `Add ${twoBlockFieldDef.labels.singular}` })).toBeDisabled();
      });
    });
  },
});

runNestedFieldContainerSuite({
  container: "blocks",
  Component: BlocksFieldAdmin,
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
