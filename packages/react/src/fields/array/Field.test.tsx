import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import {
  adminFieldToInputSchema,
  array,
  arrayItemLabel,
  defineConfig,
  group,
  text,
  type ArrayField,
  type ArrayType,
  type CollectionConfig,
} from "@vexcms/core";
import { AppForm, FormCompactContext } from "../../forms";
import { VexConfigProvider } from "../../config/VexConfigContext";
import { testCollection } from "../../testing/harness/accessFixtures";
import { runFieldInputContractSuite } from "../../testing/fieldInputContract";
import { runNestedFieldContainerSuite } from "../../testing/nestedFieldContainer";
import { arrayFieldFixture } from "./testFixture";
import { ArrayFieldAdmin } from "./Field";
import type { VexResourceSlug } from "@vexcms/core";

/**
 * Mounts `ArrayFieldInput` behind a real `useForm` + `<AppForm>`, exposing the
 * array's live value through a probe so shape/order assertions don't need a
 * hand-mocked `FieldApi`. The `onSubmit` validator maps every Zod issue to its
 * own dot/bracket-path form field (`testField`, or `testField[0]` for an item
 * failure) — a flat single-path validator would only ever populate the
 * array's OWN top-level error, never surface a specific item's.
 */
function ArrayHarness(props: {
  fieldDef: ArrayField<VexResourceSlug, ArrayType>;
  collection?: CollectionConfig;
  initialValue: unknown[];
  readOnly?: boolean;
  /** Forces item actions into the ⋯ menu placement, as a narrow form column would. */
  compact?: boolean;
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
    <ArrayFieldAdmin
      name="testField"
      fieldDef={props.fieldDef}
      collection={props.collection ?? testCollection}
      readOnly={props.readOnly ?? false}
    />
  );
  return (
    <VexConfigProvider config={testConfig}>
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
    </VexConfigProvider>
  );
}

const testConfig = defineConfig();

runFieldInputContractSuite({
  fixture: arrayFieldFixture,
  Component: ArrayFieldAdmin,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("array: item-count boundaries, index-based naming, drag-reorder wiring, and independent readOnly sources", () => {
      const boundaryFieldDef = array({
        label: "Scores",
        items: text({ label: "Score", required: true }),
        required: true,
        min: 2,
        max: 3,
      });

      it("passes validation at exactly the min item count", async () => {
        const user = userEvent.setup();
        const { container } = render(
          <ArrayHarness fieldDef={boundaryFieldDef} collection={collection} initialValue={["a", "b"]} />,
        );
        await user.click(screen.getByRole("button", { name: /submit/i }));
        expect(container.querySelector(".text-destructive")?.textContent).toBeFalsy();
      });

      it("fails validation one item below min, with the real schema message", async () => {
        const schema = adminFieldToInputSchema({ field: boundaryFieldDef });
        const result = schema.safeParse(["a"]);
        expect(result.success).toBe(false);
        const message = !result.success ? result.error.issues[0]?.message : undefined;
        expect(message).toBe("Must be at least 2 items.");

        const user = userEvent.setup();
        render(<ArrayHarness fieldDef={boundaryFieldDef} collection={collection} initialValue={["a"]} />);
        await user.click(screen.getByRole("button", { name: /submit/i }));
        expect(await screen.findByText(message!)).toBeInTheDocument();
      });

      it("passes validation at exactly the max item count", async () => {
        const user = userEvent.setup();
        const { container } = render(
          <ArrayHarness fieldDef={boundaryFieldDef} collection={collection} initialValue={["a", "b", "c"]} />,
        );
        await user.click(screen.getByRole("button", { name: /submit/i }));
        expect(container.querySelector(".text-destructive")?.textContent).toBeFalsy();
      });

      it("fails validation one item above max, with the real schema message, when seeded directly past the limit", async () => {
        const schema = adminFieldToInputSchema({ field: boundaryFieldDef });
        const result = schema.safeParse(["a", "b", "c", "d"]);
        expect(result.success).toBe(false);
        const message = !result.success ? result.error.issues[0]?.message : undefined;
        expect(message).toBe("Must be no more than 3 items.");

        const user = userEvent.setup();
        render(<ArrayHarness fieldDef={boundaryFieldDef} collection={collection} initialValue={["a", "b", "c", "d"]} />);
        await user.click(screen.getByRole("button", { name: /submit/i }));
        expect(await screen.findByText(message!)).toBeInTheDocument();
      });

      it("disables the Add button once the max item count is reached, for parity with FormBlocks' equivalent `atMax` guard", () => {
        // `FormArray` computes no `atMax` guard at all today — unlike
        // `FormBlocks`, which disables its own Add button and shows a
        // "Maximum reached" message once `items.length >= fieldDef.max`. A
        // reasonable user expects the two sibling containers to behave the
        // same way here; JSDoc is silent on this specifically for `array`.
        // Asserted to that reasonable, consistent expectation — a failure
        // here documents a real, currently-uncaught inconsistency between
        // the two containers, not a test bug (Change B).
        render(<ArrayHarness fieldDef={boundaryFieldDef} collection={collection} initialValue={["a", "b", "c"]} />);
        expect(screen.getByRole("button", { name: `Add ${arrayItemLabel(boundaryFieldDef)}` })).toBeDisabled();
      });

      it("uses configured custom min/max error messages verbatim", async () => {
        const customFieldDef = array({
          label: "Scores",
          items: text({ label: "Score", required: true }),
          required: true,
          min: [1, "Add at least one score."],
          max: [2, "No more than two scores."],
        });
        const user = userEvent.setup();

        const belowMin = render(
          <ArrayHarness fieldDef={customFieldDef} collection={collection} initialValue={[]} />,
        );
        await user.click(within(belowMin.container).getByRole("button", { name: /submit/i }));
        expect(await within(belowMin.container).findByText("Add at least one score.")).toBeInTheDocument();
        belowMin.unmount();

        const aboveMax = render(
          <ArrayHarness fieldDef={customFieldDef} collection={collection} initialValue={["a", "b", "c"]} />,
        );
        await user.click(within(aboveMax.container).getByRole("button", { name: /submit/i }));
        expect(await within(aboveMax.container).findByText("No more than two scores.")).toBeInTheDocument();
      });

      it("names each item's control by array index (`testField[0]`, `testField[1]`)", () => {
        render(
          <ArrayHarness
            fieldDef={arrayFieldFixture.fieldDef}
            collection={collection}
            initialValue={arrayFieldFixture.valid}
          />,
        );
        // `exact: false`: each item's label text is "Tag*" (required
        // asterisk appended by `FormLabel`), never a bare exact "Tag". Also
        // matches the array's OWN group label ("Tags" contains "Tag"), so
        // filter to real `<input>` elements — the array's group wrapper is a
        // `<div>`.
        const inputs = screen
          .getAllByLabelText("Tag", { exact: false })
          .filter((el): el is HTMLInputElement => el.tagName === "INPUT");
        expect(inputs.map((el) => el.id)).toEqual(["testField[0]", "testField[1]"]);
        expect(inputs.map((el) => el.value)).toEqual(arrayFieldFixture.valid);
      });

      it("honors the item field's own admin.readOnly independently of the array's readOnly prop — FormArray forwards readOnly straight through without OR-ing the item's own admin flag (unlike FormGroup/FormBlocks)", async () => {
        const readOnlyItemFieldDef = array({
          label: "Scores",
          items: text({ label: "Score", required: true, admin: { readOnly: true } }),
        });
        const user = userEvent.setup();
        render(
          <ArrayHarness
            fieldDef={readOnlyItemFieldDef}
            collection={collection}
            initialValue={["x"]}
            readOnly={false}
          />,
        );
        // `exact: false` (asterisk in label) + filter to `<input>` (the
        // array's own "Scores" group label substring-matches "Score" too).
        const input = screen
          .getAllByLabelText("Score", { exact: false })
          .find((el): el is HTMLInputElement => el.tagName === "INPUT")!;
        // TextFieldInput now ORs both readOnly sources into `disabled` (Step
        // 15 fix #4) — the PROP is `false` here (FormArray forwarded
        // `readOnly={false}` unmodified), but the item's own
        // `fieldDef.admin.readOnly` alone is enough to disable the control,
        // and still sets the native `readonly` HTML attribute too.
        expect(input).toBeDisabled();
        expect(input).toHaveAttribute("readonly");
        await user.type(input, "!");
        expect(input.value).toBe("x");

        // The array's own Add control is unaffected — only the array's OWN
        // readOnly source gates it, not an item's admin.readOnly.
        expect(
          screen.getByRole("button", {
            name: `Add ${arrayItemLabel(readOnlyItemFieldDef)}`,
          }),
        ).not.toBeDisabled();
      });

      it("renumbers each remaining item's remove button after removing an earlier item", async () => {
        const user = userEvent.setup();
        render(
          <ArrayHarness
            fieldDef={arrayFieldFixture.fieldDef}
            collection={collection}
            initialValue={["First tag", "Second tag"]}
          />,
        );
        await user.click(screen.getByRole("button", { name: "Remove item 1 from Tags" }));
        expect(screen.getByRole("button", { name: "Remove item 1 from Tags" })).toBeInTheDocument();
        expect(
          screen
            .getAllByLabelText("Tag", { exact: false })
            .find((el) => el.tagName === "INPUT"),
        ).toHaveValue("Second tag");
      });

      it("exposes an active drag handle per item when there is more than one, and degrades every handle to the inert affordance when the array is readOnly", () => {
        // The generic readOnly-cascade check in runNestedFieldContainerSuite
        // only queries "button, input, select, textarea" — DragHandle renders
        // a plain <div>, so it's invisible to that check. This fills the gap.
        const editable = render(
          <ArrayHarness
            fieldDef={arrayFieldFixture.fieldDef}
            collection={collection}
            initialValue={arrayFieldFixture.valid}
          />,
        );
        expect(editable.container.querySelectorAll("[data-rfd-drag-handle-draggable-id]")).toHaveLength(2);
        editable.unmount();

        const readOnly = render(
          <ArrayHarness
            fieldDef={arrayFieldFixture.fieldDef}
            collection={collection}
            initialValue={arrayFieldFixture.valid}
            readOnly
          />,
        );
        expect(readOnly.container.querySelectorAll("[data-rfd-drag-handle-draggable-id]")).toHaveLength(0);
      });

      it("renders a primitive item's ⋯ actions menu in a compact (narrow) form column without throwing, in duplicate/move up/move down/remove order", async () => {
        // Regression: a narrow form column places each built-in item action
        // inside this field's own `<ActionsMenu>` (a Base UI `Menu.Root`) —
        // `SlotOutlet`'s `SurfacedAction`s render as `DropdownMenuItem`s
        // under `placement="menu"`, which throw "Base UI: MenuRootContext is
        // missing" if rendered outside one.
        const user = userEvent.setup();
        render(
          <ArrayHarness
            fieldDef={arrayFieldFixture.fieldDef}
            collection={collection}
            initialValue={arrayFieldFixture.valid}
            compact
          />,
        );
        await user.click(screen.getByRole("button", { name: "Item 1 actions" }));
        const menu = await screen.findByRole("menu", { name: "Item 1 actions" });
        expect(within(menu).getAllByRole("menuitem").map((item) => item.textContent)).toEqual([
          "Duplicate",
          "Move up",
          "Move down",
          "Remove",
        ]);
      });

      it("keeps a group item's own open/closed accordion state following its stored id after a keyboard Move, not its position (Finding 20 regression)", async () => {
        const user = userEvent.setup();
        const groupArrayFieldDef = array({
          label: "Entries",
          items: group({
            label: "Entry",
            admin: { defaultCollapsed: true },
            fields: { title: text({ label: "Title" }) },
          }),
        });
        const seeded = [
          { id: "g1", title: "First" },
          { id: "g2", title: "Second" },
        ];
        render(
          <ArrayHarness fieldDef={groupArrayFieldDef} collection={collection} initialValue={seeded} />,
        );

        // Both items start collapsed; open only the first ("First").
        await user.click(screen.getByRole("button", { name: "[1] - Entry 1 field" }));
        expect(screen.getByDisplayValue("First")).toBeInTheDocument();
        expect(screen.queryByDisplayValue("Second")).not.toBeInTheDocument();

        // Move item 1 down via the keyboard-accessible action (not drag) —
        // the admin layer's `handleMoveDown` calls straight into `field.moveValue`,
        // but `ArrayField`'s key for an object-shaped item is always its own
        // stored `id` (via `getStoredId`), so React keeps "First"'s own
        // `GroupField` instance — and therefore its open state — attached to
        // "First" regardless of which position it now renders at.
        await user.click(screen.getByRole("button", { name: "Move item 1 down" }));

        expect(screen.getByDisplayValue("First")).toBeInTheDocument();
        expect(screen.queryByDisplayValue("Second")).not.toBeInTheDocument();
      });
    });
  },
});

runNestedFieldContainerSuite({
  container: "array",
  Component: ArrayFieldAdmin,
  // One child per representative category — simple (text), choice (select),
  // temporal (date), network-via-react-query (upload: its filled state
  // resolves each id through `@tanstack/react-query` + `get()`, per
  // `FilledInput.tsx`) — plus "array" for the array-of-array nested-of-nested
  // case (array items may themselves be arrays — see `array/config.ts`'s
  // "matrix" example).
  //
  // `relationship` is deliberately NOT included, even though it is the most
  // architecturally distinct field type (a live Convex query subscription
  // via `useRelationshipPickerOptions`, not a react-query fetch). Its
  // `RelationshipFieldInput` reads `config.collections.find(...)` from
  // `VexConfigContext` — this shared harness's `stubClientConfig` only sets
  // `mediaCollections`, so mounting it here throws synchronously
  // (`config.collections` is `undefined`). Wiring relationship into this
  // shared nested-container harness (extending `stubClientConfig` and
  // wiring `testing/convex/bridge.ts`'s `createFakeConvexClient`) is real,
  // separate scope, not a per-field-step task — a documented gap, not a
  // silently-dropped category.
  childFieldTypes: ["text", "select", "date", "upload", "array"],
});
