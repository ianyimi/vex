import { describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import type { ReactElement } from "react";
import { keyValue, number, type KeyValueField as KeyValueFieldDef } from "@vexcms/core";
import { keyValueFieldFixture } from "./testFixture";
import { KeyValueFieldAdmin } from "./Field";
import { AppForm, type AnyFormApi } from "../../forms";
import { testCollection } from "../../testing/harness/accessFixtures";
import { runFieldInputContractSuite } from "../../testing/fieldInputContract";
import { runNestedFieldContainerSuite } from "../../testing/nestedFieldContainer";
import { assertHydratesWithoutMismatch } from "../../testing/ssrHydration";

function KeyValueHarness(props: {
  initialValue: Record<string, number>;
  fieldDef?: KeyValueFieldDef;
  formRef?: { current: AnyFormApi | undefined };
  onSubmit?: () => void;
}) {
  const form = useForm({
    defaultValues: { testField: props.initialValue },
    onSubmit: () => props.onSubmit?.(),
  });
  if (props.formRef) props.formRef.current = form as AnyFormApi;
  return (
    <AppForm form={form}>
      <KeyValueFieldAdmin
        name="testField"
        fieldDef={props.fieldDef ?? keyValueFieldFixture.fieldDef}
        collection={testCollection}
        readOnly={false}
      />
      <button type="button" onClick={() => form.handleSubmit()}>
        Submit
      </button>
    </AppForm>
  );
}

runFieldInputContractSuite({
  fixture: keyValueFieldFixture,
  Component: KeyValueFieldAdmin,
  extra: () => {
    describe("keyValue field: rows", () => {
      it("adds a row and lets the new key be typed", async () => {
        const user = userEvent.setup();
        render(<KeyValueHarness initialValue={{}} />);
        await user.click(screen.getByRole("button", { name: "Add Entry" }));
        const keyInput = screen.getByPlaceholderText("Key");
        await user.type(keyInput, "alpha");
        expect(keyInput).toHaveValue("alpha");
      });

      it("flags two rows sharing the same key as duplicates", async () => {
        const user = userEvent.setup();
        render(<KeyValueHarness initialValue={{ alpha: 1 }} />);
        await user.click(screen.getByRole("button", { name: "Add Entry" }));
        const keyInputs = screen.getAllByPlaceholderText("Key");
        await user.type(keyInputs[1]!, "alpha");
        expect(screen.getAllByText("Duplicate key")).toHaveLength(2);
      });

      it("removes a row", async () => {
        const user = userEvent.setup();
        render(<KeyValueHarness initialValue={{ alpha: 1 }} />);
        const removeButton = screen.getByRole("button", { name: 'Remove Entry "alpha"' });
        await user.click(removeButton);
        expect(screen.queryByPlaceholderText("Key")).not.toBeInTheDocument();
      });

      it("includes the row's key in the remove button's accessible name, falling back to a generic name for an unnamed row (S4 regression)", async () => {
        const user = userEvent.setup();
        render(<KeyValueHarness initialValue={{ alpha: 1, beta: 2 }} />);
        expect(screen.getByRole("button", { name: 'Remove Entry "alpha"' })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: 'Remove Entry "beta"' })).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Add Entry" }));
        expect(screen.getByRole("button", { name: "Remove Entry" })).toBeInTheDocument();
      });

      it("commits a typed row value under the real field path, not a stray top-level key (regression)", async () => {
        const user = userEvent.setup();
        const formRef: { current: AnyFormApi | undefined } = { current: undefined };
        render(<KeyValueHarness initialValue={{ alpha: 1 }} formRef={formRef} />);
        const valueInput = screen.getByRole("spinbutton");
        await user.clear(valueInput);
        await user.type(valueInput, "42");
        expect(formRef.current?.state.values).toEqual({ testField: { alpha: 42 } });
      });

      it("shows the 'Key' label on every row, aligned with the value label, with a required asterisk", () => {
        const { container } = render(<KeyValueHarness initialValue={{ alpha: 1, beta: 2 }} />);
        const keyLabels = within(container).getAllByText("Key", { exact: false });
        expect(keyLabels).toHaveLength(2);
        keyLabels.forEach((label) => {
          expect(label).not.toHaveClass("invisible");
          expect(label).toHaveTextContent("Key*");
        });
      });

      it("gives every row's key input an accessible name matching its visible label", () => {
        render(<KeyValueHarness initialValue={{ alpha: 1, beta: 2 }} />);
        const keyInputs = screen.getAllByRole("textbox", { name: "Key" });
        expect(keyInputs).toHaveLength(2);
      });

      it("submitting with an empty-key row shows the required error exactly once, under the key input, and does not save", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        const formRef: { current: AnyFormApi | undefined } = { current: undefined };
        const { container } = render(
          <KeyValueHarness initialValue={{}} onSubmit={onSubmit} formRef={formRef} />,
        );
        await user.click(screen.getByRole("button", { name: "Add Entry" }));
        await user.click(screen.getByRole("button", { name: "Submit" }));

        const row = screen.getByPlaceholderText("Key").closest("li")!;
        const messages = await screen.findAllByText("This field is required.");
        expect(messages).toHaveLength(1);
        expect(within(row).getByText("This field is required.")).toBe(messages[0]);
        expect(container.querySelector("#testField-error")).not.toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
        expect(formRef.current?.state.values).toEqual({ testField: {} });
      });

      it("filling in the empty key clears the required error", async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();
        render(<KeyValueHarness initialValue={{}} onSubmit={onSubmit} />);
        await user.click(screen.getByRole("button", { name: "Add Entry" }));
        await user.click(screen.getByRole("button", { name: "Submit" }));
        const row = screen.getByPlaceholderText("Key").closest("li")!;
        expect(await within(row).findByText("This field is required.")).toBeInTheDocument();

        await user.type(screen.getByPlaceholderText("Key"), "alpha");
        await waitFor(() => expect(within(row).queryByText("This field is required.")).not.toBeInTheDocument());

        await user.click(screen.getByRole("button", { name: "Submit" }));
        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
      });

      it("starts the accordion collapsed when admin.defaultCollapsed is true, and expands on clicking the trigger", async () => {
        const user = userEvent.setup();
        const collapsedFieldDef = keyValue({
          label: "Scores",
          value: number({ label: "Score", required: true }),
          admin: { defaultCollapsed: true },
        });
        render(<KeyValueHarness initialValue={{ alpha: 1 }} fieldDef={collapsedFieldDef} />);
        expect(screen.queryByRole("button", { name: "Add Entry" })).not.toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: /Scores/ }));
        expect(screen.getByRole("button", { name: "Add Entry" })).toBeVisible();
      });

      it("seeds a newly-added number row's value empty, not the value field's static default (regression)", async () => {
        const user = userEvent.setup();
        render(<KeyValueHarness initialValue={{}} />);
        await user.click(screen.getByRole("button", { name: "Add Entry" }));
        expect(screen.getByRole("spinbutton")).toHaveValue(null);
      });

      it("reflects an externally-changed row value in an already-mounted row's control, without a stale display the next edit would re-commit (B1 regression)", async () => {
        const formRef: { current: AnyFormApi | undefined } = { current: undefined };
        render(<KeyValueHarness initialValue={{ alpha: 1 }} formRef={formRef} />);
        expect(screen.getByRole("spinbutton")).toHaveValue(1);

        act(() => {
          formRef.current!.setFieldValue("testField", { alpha: 99 });
        });

        await waitFor(() => expect(screen.getByRole("spinbutton")).toHaveValue(99));
      });
    });

    describe("keyValue field: SSR parity (no hydration gate)", () => {
      it("existing rows hydrate cleanly, with no server/client row id mismatch warning (regression)", async () => {
        await assertHydratesWithoutMismatch(
          (<KeyValueHarness initialValue={{ alpha: 1, beta: 2 }} />) as ReactElement,
        );
      });
    });
  },
});

runNestedFieldContainerSuite({
  container: "keyValue",
  Component: KeyValueFieldAdmin,
  // One child per representative category — simple (text), choice (select),
  // temporal (date), network-via-react-query (upload) — mirroring group's
  // own `runNestedFieldContainerSuite` call. `relationship` is deliberately
  // excluded for the same reason noted there.
  childFieldTypes: ["text", "select", "date", "upload"],
});

describe("keyValue: null-toggle restore rule", () => {
  function NullableKeyValueHarness(props: { initialValue: Record<string, number> | null }) {
    const fieldDef = keyValue({ label: "Scores", nullable: true, value: number({ label: "Score" }) });
    const form = useForm({ defaultValues: { testField: props.initialValue } });
    return (
      <AppForm form={form}>
        <KeyValueFieldAdmin name="testField" fieldDef={fieldDef} collection={testCollection} readOnly={false} />
        <form.Subscribe selector={(state) => state.values.testField}>
          {(value) => <output data-testid="value-probe">{JSON.stringify(value)}</output>}
        </form.Subscribe>
      </AppForm>
    );
  }

  it("unchecking after typing restores the value typed before Null was checked", async () => {
    const user = userEvent.setup();
    render(<NullableKeyValueHarness initialValue={{ alpha: 1 }} />);
    await user.click(screen.getByRole("checkbox", { name: /Set Scores to null/i }));
    expect(screen.getByTestId("value-probe")).toHaveTextContent("null");
    await user.click(screen.getByRole("checkbox", { name: /Set Scores to null/i }));
    expect(screen.getByTestId("value-probe")).toHaveTextContent(JSON.stringify({ alpha: 1 }));
  });

  it("a page loaded with the field already null falls back to the field's empty default when unchecked", async () => {
    const user = userEvent.setup();
    render(<NullableKeyValueHarness initialValue={null} />);
    expect(screen.getByTestId("value-probe")).toHaveTextContent("null");
    await user.click(screen.getByRole("checkbox", { name: /Set Scores to null/i }));
    expect(screen.getByTestId("value-probe")).toHaveTextContent(JSON.stringify({}));
  });
});
