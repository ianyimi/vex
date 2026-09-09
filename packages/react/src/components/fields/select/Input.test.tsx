import "@testing-library/jest-dom/vitest";
import { useForm } from "@tanstack/react-form";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it } from "vitest";
import { select, type SelectField } from "@vexcms/core";
import { AppForm } from "../../form/AppForm";
import { ModalSurfaceProvider } from "../../../hooks/useModalSurface";
import { installDomPolyfills } from "../../../testing/setup";
import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { selectFieldFixture } from "./testFixture";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { SelectFieldInput } from "./Input";

// cmdk (the popover's option list) observes its list for virtual sizing and
// scrolls the highlighted item into view on mount — jsdom has neither
// ResizeObserver nor layout. Every test in this file opens the popover, so
// install once for the whole file, mirroring `ui/multi-select.test.tsx`.
beforeAll(() => {
  installDomPolyfills();
});

/**
 * Mounts `SelectFieldInput` behind a real `useForm` + `<AppForm>`, exposing
 * the committed form value through a probe element so the exact stored
 * array — values not labels, one item vs. two — is assertable without
 * hand-mocking TanStack's `FieldApi`.
 */
function SelectHarness(props: { fieldDef: SelectField; initialValue: string[] }) {
  const form = useForm({ defaultValues: { choice: props.initialValue } });
  return (
    <AppForm form={form}>
      <SelectFieldInput
        name="choice"
        fieldDef={props.fieldDef}
        collection={testCollection}
        readOnly={false}
      />
      <form.Subscribe selector={(state) => state.values.choice}>
        {(value) => <output data-testid="value-probe">{JSON.stringify(value)}</output>}
      </form.Subscribe>
    </AppForm>
  );
}

runFieldInputContractSuite({
  fixture: selectFieldFixture,
  Component: SelectFieldInput,
  extra: ({ fixture }) => {
    describe("select field", () => {
      it("renders every configured option in the popover", async () => {
        const user = userEvent.setup();
        render(<SelectHarness fieldDef={fixture.fieldDef} initialValue={[]} />);

        await user.click(screen.getByRole("combobox"));

        for (const option of fixture.fieldDef.options) {
          expect(
            await screen.findByRole("option", { name: option.label }),
          ).toBeInTheDocument();
        }
      });

      it("stores the option's value, not its label, when a selection is made", async () => {
        const user = userEvent.setup();
        render(<SelectHarness fieldDef={fixture.fieldDef} initialValue={[]} />);

        await user.click(screen.getByRole("combobox"));
        await user.click(await screen.findByRole("option", { name: "Draft" }));

        expect(screen.getByTestId("value-probe").textContent).toBe(JSON.stringify(["draft"]));
      });

      it("renders the configured label, not the raw stored value, for an already-selected option", () => {
        render(<SelectHarness fieldDef={fixture.fieldDef} initialValue={["published"]} />);

        expect(
          within(screen.getByRole("combobox")).getByText("Published"),
        ).toBeInTheDocument();
      });

      it("opens without crashing and lists no options when fieldDef.options is empty", async () => {
        const user = userEvent.setup();
        const emptyOptionsFieldDef = select({ label: "Status", hasMany: true, options: [] });
        render(<SelectHarness fieldDef={emptyOptionsFieldDef} initialValue={[]} />);

        await user.click(screen.getByRole("combobox"));
        // No option ever appears to `findByRole` on, so wait on the reveal
        // effect's own side effect instead — the search input taking focus,
        // same assertion `ui/multi-select.test.tsx` uses to pin that effect.
        await waitFor(() =>
          expect(document.activeElement?.getAttribute("data-slot")).toBe("command-input"),
        );

        expect(screen.queryAllByRole("option")).toHaveLength(0);
      });

      it("collapses duplicate option values to one stored entry, keyed by value not by row", async () => {
        const user = userEvent.setup();
        const duplicateValueFieldDef = select({
          label: "Status",
          hasMany: true,
          options: [
            { label: "Draft A", value: "dup" },
            { label: "Draft B", value: "dup" },
          ],
        });
        render(<SelectHarness fieldDef={duplicateValueFieldDef} initialValue={[]} />);

        await user.click(screen.getByRole("combobox"));
        // Both rows render — `MultiSelectItem` keys on the option's array
        // index, not its `value`, so a duplicate value never collides as a
        // React key.
        expect(await screen.findByRole("option", { name: "Draft A" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Draft B" })).toBeInTheDocument();

        await user.click(screen.getByRole("option", { name: "Draft A" }));

        // Selection is a `Set<string>` keyed by value — clicking either row
        // selects the same "dup" entry.
        expect(screen.getByTestId("value-probe").textContent).toBe(JSON.stringify(["dup"]));
      });

      it("accumulates selections into the array when hasMany is true", async () => {
        const user = userEvent.setup();
        render(<SelectHarness fieldDef={fixture.fieldDef} initialValue={[]} />);

        await user.click(screen.getByRole("combobox"));
        await user.click(await screen.findByRole("option", { name: "Draft" }));
        // hasMany keeps the popover open after a selection — no need to
        // reopen it before picking the second option.
        await user.click(await screen.findByRole("option", { name: "Published" }));

        expect(screen.getByTestId("value-probe").textContent).toBe(
          JSON.stringify(["draft", "published"]),
        );
      });

      it("replaces rather than appends when hasMany is false, and the stored value stays an array", async () => {
        const user = userEvent.setup();
        const singleFieldDef = select({
          label: "Status",
          hasMany: false,
          options: fixture.fieldDef.options,
        });
        render(<SelectHarness fieldDef={singleFieldDef} initialValue={[]} />);

        await user.click(screen.getByRole("combobox"));
        await user.click(await screen.findByRole("option", { name: "Draft" }));
        expect(screen.getByTestId("value-probe").textContent).toBe(JSON.stringify(["draft"]));

        // Single-select closes the popover on selection; reopen it.
        await user.click(screen.getByRole("combobox"));
        await user.click(await screen.findByRole("option", { name: "Published" }));

        // Still an array — `toggleValue` always calls
        // `onValuesChange([...set])` — just capped at one entry instead of
        // appending a second.
        expect(screen.getByTestId("value-probe").textContent).toBe(
          JSON.stringify(["published"]),
        );
      });

      it("clears the selection when hasMany is false and the already-selected option is picked again", async () => {
        const user = userEvent.setup();
        const singleFieldDef = select({
          label: "Status",
          hasMany: false,
          options: fixture.fieldDef.options,
        });
        render(<SelectHarness fieldDef={singleFieldDef} initialValue={["draft"]} />);

        await user.click(screen.getByRole("combobox"));
        await user.click(await screen.findByRole("option", { name: "Draft" }));

        // `toggleValue`'s single branch is `prev.has(value) ? new Set() :
        // new Set([value])` — picking the already-selected option toggles it
        // off, not a no-op.
        expect(screen.getByTestId("value-probe").textContent).toBe(JSON.stringify([]));
      });

      it("deselects an option by picking it again while hasMany is true", async () => {
        const user = userEvent.setup();
        render(
          <SelectHarness fieldDef={fixture.fieldDef} initialValue={["draft", "published"]} />,
        );

        await user.click(screen.getByRole("combobox"));
        await user.click(await screen.findByRole("option", { name: "Draft" }));

        expect(screen.getByTestId("value-probe").textContent).toBe(
          JSON.stringify(["published"]),
        );
      });

      it("removes a selection by clicking its badge in the trigger", async () => {
        const user = userEvent.setup();
        render(
          <SelectHarness fieldDef={fixture.fieldDef} initialValue={["draft", "published"]} />,
        );

        // `MultiSelectValue` renders a `clickToRemove` badge per selected
        // value even while closed — a second removal path independent of
        // reopening the popover. Scoped to the trigger: the always-mounted
        // hidden item list (kept for `onItemAdded` registration) renders the
        // same label text but is excluded from role/text queries only when
        // scoped — `within` avoids the ambiguity outright.
        const combobox = screen.getByRole("combobox");
        await user.click(within(combobox).getByText("Draft"));

        expect(screen.getByTestId("value-probe").textContent).toBe(
          JSON.stringify(["published"]),
        );
      });

      it("closes when clicking outside the popover", async () => {
        const user = userEvent.setup();
        render(<SelectHarness fieldDef={fixture.fieldDef} initialValue={[]} />);

        await user.click(screen.getByRole("combobox"));
        expect(await screen.findByRole("option", { name: "Draft" })).toBeInTheDocument();

        await user.click(document.body);

        await waitFor(() =>
          expect(screen.queryByRole("option", { name: "Draft" })).not.toBeInTheDocument(),
        );
      });

      it("closes on Escape", async () => {
        const user = userEvent.setup();
        render(<SelectHarness fieldDef={fixture.fieldDef} initialValue={[]} />);

        await user.click(screen.getByRole("combobox"));
        expect(await screen.findByRole("option", { name: "Draft" })).toBeInTheDocument();

        await user.keyboard("{Escape}");

        await waitFor(() =>
          expect(screen.queryByRole("option", { name: "Draft" })).not.toBeInTheDocument(),
        );
      });

      it("selects the highlighted option via ArrowDown + Enter, not only via a mouse click", async () => {
        const user = userEvent.setup();
        render(<SelectHarness fieldDef={fixture.fieldDef} initialValue={[]} />);

        await user.click(screen.getByRole("combobox"));
        // cmdk focuses the search input and highlights the first item on open.
        await screen.findByRole("option", { name: "Draft" });

        await user.keyboard("{ArrowDown}{Enter}");

        // Delegated entirely to cmdk's own keyboard handling — `Input.tsx`
        // forwards the option list and implements no navigation itself.
        expect(screen.getByTestId("value-probe").textContent).toBe(
          JSON.stringify(["published"]),
        );
      });

      it("does not lock page scroll when rendered on a plain page (outside a modal surface)", async () => {
        const user = userEvent.setup();
        render(<SelectHarness fieldDef={fixture.fieldDef} initialValue={[]} />);

        await user.click(screen.getByRole("combobox"));

        // `SelectFieldInput` reads `useModalSurface()` and only passes
        // `modal: true` to `MultiSelect` inside a dialog. Rendered on a
        // plain page (no `Modal` ancestor) it must stay non-modal, or Base
        // UI's `useScrollLock` snaps the page to the top and the popover
        // closes itself — see `ui/multi-select.tsx`'s `modal` JSDoc and AP-018.
        expect(document.body.style.position).not.toBe("relative");
        expect(document.body.style.overflow).not.toBe("hidden");
      });

      it("still opens and functions when rendered inside a modal surface (the useModalSurface branch)", async () => {
        const user = userEvent.setup();
        render(
          <ModalSurfaceProvider>
            <SelectHarness fieldDef={fixture.fieldDef} initialValue={[]} />
          </ModalSurfaceProvider>,
        );

        await user.click(screen.getByRole("combobox"));
        await user.click(await screen.findByRole("option", { name: "Draft" }));

        expect(screen.getByTestId("value-probe").textContent).toBe(JSON.stringify(["draft"]));
        // `modal: true` engages Base UI's `useScrollLock`, which only writes
        // `body.style` when the document is actually scrollable — jsdom has
        // no layout, so that half is not observable here. The context value
        // itself (`useModalSurface` returning `true` inside a
        // `ModalSurfaceProvider`) is already pinned by
        // `hooks/useModalSurface.test.tsx`; this test instead proves
        // `SelectFieldInput` actually reads it and wires it through without
        // breaking the popover.
      });

      it("shows the placeholder only while nothing is selected", async () => {
        const user = userEvent.setup();
        render(<SelectHarness fieldDef={fixture.fieldDef} initialValue={[]} />);

        expect(screen.getByText("Choose a status")).toBeInTheDocument();

        await user.click(screen.getByRole("combobox"));
        await user.click(await screen.findByRole("option", { name: "Draft" }));

        // `MultiSelectValue` only renders the placeholder when
        // `selectedValues.size === 0` — it must disappear the moment a
        // value lands, not just avoid erroring while one is present.
        expect(screen.queryByText("Choose a status")).not.toBeInTheDocument();
      });
    });
  },
});
