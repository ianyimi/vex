import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { useState, type ReactElement } from "react";
import {
  blocks,
  defineBlock,
  defineConfig,
  text,
  type BlocksField,
  type CollectionConfig,
  type GenericBlock,
} from "@vexcms/core";
import { AppForm } from "./AppForm";
import { FormBlocks } from "./FormBlocks";
import { VexConfigProvider } from "../../context/VexConfigContext";
import { BLOCK_CLIPBOARD_STORAGE_KEY } from "../../hooks";
import { testCollection, testAccess, testUsers, renderWithVexProviders } from "../../testing/harness/accessFixtures";

// `BlockAccordionItem`'s open sub-fields render through `RenderFields`, whose
// `FieldSlotOutlet` reads `useVexConfig()` unconditionally — every plain
// `renderHarness(<FormBlocksHarness .../>)` below wraps in this provider so
// that doesn't throw. The one test using `renderWithVexProviders` supplies
// its own provider pair instead (carrying real RBAC `access`), so it is NOT
// also wrapped here.
const testConfig = defineConfig();

const paragraphBlock = defineBlock({
  slug: "paragraph",
  label: "Paragraph",
  fields: { text: text() },
});
const headingBlock = defineBlock({
  slug: "heading",
  label: "Heading",
  fields: { text: text({ required: true }) },
});

function FormBlocksHarness(props: {
  fieldDef: BlocksField;
  collection?: CollectionConfig;
  initialValue: GenericBlock[];
  readOnly?: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const form = useForm({ defaultValues: { testField: props.initialValue } });
  return (
    <AppForm form={form}>
      <form.Field name="testField" mode="array">
        {(field) => (
          <FormBlocks
            name="testField"
            field={field}
            fieldDef={props.fieldDef}
            collection={props.collection ?? testCollection}
            readOnly={props.readOnly ?? false}
            submissionAttempts={0}
            modalOpen={modalOpen}
            openEditor={() => setModalOpen(true)}
            closeEditor={() => setModalOpen(false)}
            label={<span>Test Field</span>}
          />
        )}
      </form.Field>
      <form.Subscribe selector={(state) => state.values.testField}>
        {(value) => <output data-testid="value-probe">{JSON.stringify(value)}</output>}
      </form.Subscribe>
    </AppForm>
  );
}

/** Renders `ui` wrapped in `VexConfigProvider` — see the comment on `testConfig` above. */
function renderHarness(ui: ReactElement) {
  return render(<VexConfigProvider config={testConfig}>{ui}</VexConfigProvider>);
}

describe("FormBlocks", () => {
  it("duplicates a block via its actions menu, inserting a copy right after it with a fresh id", async () => {
    const user = userEvent.setup();
    const fieldDef = blocks({ label: "Body", blocks: [paragraphBlock] });
    renderHarness(
      <FormBlocksHarness
        fieldDef={fieldDef}
        initialValue={[{ id: "b1", blockType: "paragraph", text: "Hello" }]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Duplicate block 1" }));

    const values = JSON.parse(screen.getByTestId("value-probe").textContent ?? "[]") as GenericBlock[];
    expect(values).toHaveLength(2);
    expect(values[0]?.id).toBe("b1");
    expect(values[1]?.id).not.toBe("b1");
    expect(values[1]?.text).toBe("Hello");
  });

  it("inserts a block above via the actions menu, for a single-type field (skipping the picker)", async () => {
    const user = userEvent.setup();
    const fieldDef = blocks({ label: "Body", blocks: [paragraphBlock] });
    renderHarness(
      <FormBlocksHarness
        fieldDef={fieldDef}
        initialValue={[{ id: "b1", blockType: "paragraph", text: "Existing" }]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Paragraph actions" }));
    await user.click(await screen.findByRole("menuitem", { name: "Insert above" }));

    const values = JSON.parse(screen.getByTestId("value-probe").textContent ?? "[]") as GenericBlock[];
    expect(values).toHaveLength(2);
    expect(values[1]?.id).toBe("b1");
    expect(values[0]?.id).not.toBe("b1");
  });

  it("moves a block up and down via the actions menu", async () => {
    const user = userEvent.setup();
    const fieldDef = blocks({ label: "Body", blocks: [paragraphBlock] });
    renderHarness(
      <FormBlocksHarness
        fieldDef={fieldDef}
        initialValue={[
          { id: "b1", blockType: "paragraph", text: "First" },
          { id: "b2", blockType: "paragraph", text: "Second" },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Move block 2 up" }));

    const values = JSON.parse(screen.getByTestId("value-probe").textContent ?? "[]") as GenericBlock[];
    expect(values.map((b) => b.id)).toEqual(["b2", "b1"]);
  });

  it("removes a block via the actions menu", async () => {
    const user = userEvent.setup();
    const fieldDef = blocks({ label: "Body", blocks: [headingBlock, paragraphBlock] });
    renderHarness(
      <FormBlocksHarness
        fieldDef={fieldDef}
        initialValue={[
          { id: "h1", blockType: "heading", blockName: "Heading", text: "Welcome" },
          { id: "p1", blockType: "paragraph", blockName: "Paragraph", text: "Body copy" },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Remove block 1" }));

    const values = JSON.parse(screen.getByTestId("value-probe").textContent ?? "[]") as GenericBlock[];
    expect(values).toHaveLength(1);
    expect(values[0]?.blockType).toBe("paragraph");
  });

  it("collapses and expands every block via the header controls", async () => {
    const user = userEvent.setup();
    const fieldDef = blocks({ label: "Body", blocks: [paragraphBlock] });
    renderHarness(
      <FormBlocksHarness
        fieldDef={fieldDef}
        initialValue={[
          { id: "b1", blockType: "paragraph", text: "First" },
          { id: "b2", blockType: "paragraph", text: "Second" },
        ]}
      />,
    );

    const triggers = () =>
      screen.getAllByText(/^paragraph$/).map((el) => el.closest("[aria-expanded]")!);
    expect(triggers().every((t) => t.getAttribute("aria-expanded") === "true")).toBe(true);

    await user.click(screen.getByRole("button", { name: "Collapse all" }));
    expect(triggers().every((t) => t.getAttribute("aria-expanded") === "false")).toBe(true);

    await user.click(screen.getByRole("button", { name: "Expand all" }));
    expect(triggers().every((t) => t.getAttribute("aria-expanded") === "true")).toBe(true);
  });

  it("moves the header actions into a ⋯ menu when the header row is too narrow for them", async () => {
    const widthSpy = vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(500);
    const user = userEvent.setup();
    const fieldDef = blocks({ label: "Body", blocks: [paragraphBlock] });
    renderHarness(
      <FormBlocksHarness
        fieldDef={fieldDef}
        initialValue={[{ id: "b1", blockType: "paragraph", text: "Hello" }]}
      />,
    );
    expect(screen.queryByRole("button", { name: "Collapse all" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Body actions" }));
    expect(await screen.findByRole("menuitem", { name: "Collapse all" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Copy all" })).toBeInTheDocument();
    widthSpy.mockRestore();
  });

  it("starts a block collapsed when its own admin.defaultCollapsed is true, even though the field's is false", () => {
    const collapsedParagraph = defineBlock({
      slug: "paragraph",
      label: "Paragraph",
      admin: { defaultCollapsed: true },
      fields: { text: text() },
    });
    const fieldDef = blocks({ label: "Body", blocks: [headingBlock, collapsedParagraph] });
    renderHarness(
      <FormBlocksHarness
        fieldDef={fieldDef}
        initialValue={[
          { id: "h1", blockType: "heading", text: "Welcome" },
          { id: "p1", blockType: "paragraph", text: "Body copy" },
        ]}
      />,
    );

    const headingTrigger = screen.getByText("heading").closest("[aria-expanded]")!;
    const paragraphTrigger = screen.getByText("paragraph").closest("[aria-expanded]")!;
    expect(headingTrigger).toHaveAttribute("aria-expanded", "true");
    expect(paragraphTrigger).toHaveAttribute("aria-expanded", "false");
  });

  it("disables every mutating menu action and the header controls when the caller lacks update permission", async () => {
    const fieldDef = blocks({ label: "Body", blocks: [paragraphBlock] });
    renderWithVexProviders(
      <FormBlocksHarness
        fieldDef={fieldDef}
        collection={testCollection}
        initialValue={[{ id: "b1", blockType: "paragraph", text: "Hello" }]}
      />,
      { access: testAccess.denied, auth: { user: testUsers.denied } },
    );

    expect(screen.getByRole("button", { name: "Collapse all" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Expand all" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Add Block" })).not.toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Duplicate block 1" })).toBeDisabled();
  });
});

describe("FormBlocks: block clipboard paste", () => {
  const heroBlock = defineBlock({
    slug: "hero",
    label: "Hero",
    fields: { heading: text({ label: "Heading", required: true }) },
  });

  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("pastes an accepted clipboard block appended to the field", async () => {
    const user = userEvent.setup();
    const fieldDef = blocks({ label: "Body", blocks: [heroBlock] });
    window.localStorage.setItem(
      BLOCK_CLIPBOARD_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        copiedAt: 1,
        blocks: [
          {
            id: "clip-1",
            blockType: "hero",
            blockName: "Hero",
            heading: "From clipboard",
          },
        ],
      }),
    );

    renderHarness(
      <FormBlocksHarness
        fieldDef={fieldDef}
        initialValue={[
          {
            id: "b1",
            blockType: "hero",
            blockName: "Hero",
            heading: "Existing",
          },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Paste" }));

    const value = JSON.parse(
      screen.getByTestId("value-probe").textContent as string,
    ) as GenericBlock[];
    expect(value).toHaveLength(2);
    expect(value[0]).toMatchObject({ id: "b1", heading: "Existing" });
    expect(value[1]).toMatchObject({
      blockType: "hero",
      heading: "From clipboard",
    });
    expect(value[1]!.id).not.toBe("clip-1");
  });

  it("skips clipboard blocks whose blockType the target field does not accept and drops unknown keys", async () => {
    const user = userEvent.setup();
    const fieldDef = blocks({ label: "Body", blocks: [heroBlock] });
    window.localStorage.setItem(
      BLOCK_CLIPBOARD_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        copiedAt: 1,
        blocks: [
          {
            id: "clip-1",
            blockType: "quote",
            blockName: "Quote",
            text: "Unsupported here",
          },
          {
            id: "clip-2",
            blockType: "hero",
            blockName: "Hero",
            heading: "Accepted",
            notAFieldOnThisBlock: "dropped",
          },
        ],
      }),
    );

    renderHarness(<FormBlocksHarness fieldDef={fieldDef} initialValue={[]} />);

    await user.click(screen.getByRole("button", { name: /^Paste/ }));

    const value = JSON.parse(
      screen.getByTestId("value-probe").textContent as string,
    ) as GenericBlock[];
    expect(value).toHaveLength(1);
    expect(value[0]).toMatchObject({ blockType: "hero", heading: "Accepted" });
    expect(value[0]).not.toHaveProperty("notAFieldOnThisBlock");
  });

  it("disables Paste and Replace all when pasting would exceed the field's max", async () => {
    const fieldDef = blocks({ label: "Body", blocks: [heroBlock], max: 1 });
    window.localStorage.setItem(
      BLOCK_CLIPBOARD_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        copiedAt: 1,
        blocks: [
          {
            id: "clip-1",
            blockType: "hero",
            blockName: "Hero",
            heading: "From clipboard",
          },
        ],
      }),
    );

    renderHarness(
      <FormBlocksHarness
        fieldDef={fieldDef}
        initialValue={[
          {
            id: "b1",
            blockType: "hero",
            blockName: "Hero",
            heading: "Existing",
          },
        ]}
      />,
    );

    expect(screen.getByRole("button", { name: "Paste" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Replace all" })).toBeEnabled();
  });

  it("disables Paste and Replace all when the current user lacks update permission", async () => {
    const fieldDef = blocks({ label: "Body", blocks: [heroBlock] });
    window.localStorage.setItem(
      BLOCK_CLIPBOARD_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        copiedAt: 1,
        blocks: [
          {
            id: "clip-1",
            blockType: "hero",
            blockName: "Hero",
            heading: "From clipboard",
          },
        ],
      }),
    );

    renderWithVexProviders(
      <FormBlocksHarness
        fieldDef={fieldDef}
        collection={testCollection}
        initialValue={[
          {
            id: "b1",
            blockType: "hero",
            blockName: "Hero",
            heading: "Existing",
          },
        ]}
      />,
      { access: testAccess.denied, auth: { user: testUsers.denied } },
    );

    expect(screen.getByRole("button", { name: "Paste" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Replace all" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Copy all" })).toBeEnabled();
  });
});
