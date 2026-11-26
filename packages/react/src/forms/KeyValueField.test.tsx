import { describe, expect, it, vi } from "vitest";
import { render, renderHook, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { KeyValueField, useKeyValueRows, type KeyValueRowsField } from "./KeyValueField";

const { fieldContext, formContext } = createFormHookContexts();
const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { KeyValueField },
  formComponents: {},
});

function KeyValueHarness(props: {
  defaultOpen?: boolean;
  isNull?: boolean;
  onIsNullChange?: (isNull: boolean) => void;
  initialValue?: Record<string, number>;
}) {
  const form = useAppForm({ defaultValues: { scores: props.initialValue ?? { alpha: 1 } } });
  return (
    <form.AppForm>
      <form.AppField name="scores">
        {(field) => (
          <field.KeyValueField
            label="Scores"
            keyLabel="Key"
            required={false}
            entryLabel="Entry"
            pluralLabel="Entries"
            createValue={() => 0}
            defaultOpen={props.defaultOpen}
            isNull={props.isNull}
            onIsNullChange={props.onIsNullChange}
            renderKey={({ row, onChange }) => (
              <input aria-label="Key" value={row.key} onChange={(e) => onChange(e.target.value)} />
            )}
            renderValue={({ row, onChange }) => (
              <input
                aria-label="Value"
                type="number"
                value={row.value}
                onChange={(e) => onChange(Number(e.target.value))}
              />
            )}
          />
        )}
      </form.AppField>
    </form.AppForm>
  );
}

/**
 * Mirrors TanStack Form's own `setBy` — `handleChange`'s leaf write keeps
 * the EXACT reference passed in, never a copy (verified against
 * `@tanstack/form-core`'s `setBy`) — so `state.value` round-trips the same
 * object `useKeyValueRows.commit` built, matching what `lastValueRef`
 * (`KeyValueField.tsx`) relies on to tell its own writes from an external
 * value change.
 */
function makeField(initial: Record<string, number>): KeyValueRowsField<number> & {
  value: Record<string, number>;
} {
  const state = { value: { ...initial } };
  return {
    state,
    get value() {
      return state.value;
    },
    handleChange: (next) => {
      state.value = next;
    },
  };
}

describe("useKeyValueRows", () => {
  it("seeds one row per entry of the field's initial value", () => {
    const field = makeField({ alpha: 1, beta: 2 });
    const { result } = renderHook(() => useKeyValueRows({ field, createValue: () => 0 }));
    expect(result.current.rows).toHaveLength(2);
    expect(result.current.rows.map((row) => row.key).sort()).toEqual(["alpha", "beta"]);
  });

  it("adds a new empty-keyed row without touching the committed record yet", () => {
    const field = makeField({ alpha: 1 });
    const { result, rerender } = renderHook(() => useKeyValueRows({ field, createValue: () => 0 }));
    act(() => result.current.add());
    rerender();
    expect(result.current.rows).toHaveLength(2);
    expect(field.value).toEqual({ alpha: 1 });
  });

  it("commits a renamed row's key into the record", () => {
    const field = makeField({ alpha: 1 });
    const { result, rerender } = renderHook(() => useKeyValueRows({ field, createValue: () => 0 }));
    const rowId = result.current.rows[0]!.rowId;
    act(() => result.current.setKey(rowId, "renamed"));
    rerender();
    expect(field.value).toEqual({ renamed: 1 });
  });

  it("commits a changed value into the record", () => {
    const field = makeField({ alpha: 1 });
    const { result, rerender } = renderHook(() => useKeyValueRows({ field, createValue: () => 0 }));
    const rowId = result.current.rows[0]!.rowId;
    act(() => result.current.setValue(rowId, 99));
    rerender();
    expect(field.value).toEqual({ alpha: 99 });
  });

  it("removes a row from the committed record", () => {
    const field = makeField({ alpha: 1, beta: 2 });
    const { result, rerender } = renderHook(() => useKeyValueRows({ field, createValue: () => 0 }));
    const rowId = result.current.rows.find((row) => row.key === "alpha")!.rowId;
    act(() => result.current.remove(rowId));
    rerender();
    expect(field.value).toEqual({ beta: 2 });
  });

  it("flags two rows sharing a non-empty key as duplicates", () => {
    const field = makeField({ alpha: 1 });
    const { result, rerender } = renderHook(() => useKeyValueRows({ field, createValue: () => 0 }));
    act(() => result.current.add());
    rerender();
    const newRowId = result.current.rows[1]!.rowId;
    act(() => result.current.setKey(newRowId, "alpha"));
    rerender();
    expect(result.current.duplicateKeys.has("alpha")).toBe(true);
  });

  it("reports atMax once rows reach the configured max", () => {
    const field = makeField({ alpha: 1 });
    const { result, rerender } = renderHook(() =>
      useKeyValueRows({ field, createValue: () => 0, max: 1 }),
    );
    expect(result.current.atMax).toBe(true);
    rerender();
  });

  it("re-seeds rows when the field's value changes externally, reconciling rowIds by key (B1 regression)", () => {
    const field = makeField({ alpha: 1, beta: 2 });
    const { result, rerender } = renderHook(() => useKeyValueRows({ field, createValue: () => 0 }));
    const alphaRowId = result.current.rows.find((row) => row.key === "alpha")!.rowId;

    field.handleChange({ alpha: 99, gamma: 3 });
    rerender();

    expect(result.current.rows.map((row) => row.key).sort()).toEqual(["alpha", "gamma"]);
    const alphaRow = result.current.rows.find((row) => row.key === "alpha")!;
    expect(alphaRow.rowId).toBe(alphaRowId);
    expect(alphaRow.value).toBe(99);
    expect(result.current.rows.find((row) => row.key === "beta")).toBeUndefined();
    expect(result.current.rows.find((row) => row.key === "gamma")).toBeDefined();
  });

  it("re-seeds to an empty row list when the field's value is externally restored to null then back", () => {
    const field = makeField({ alpha: 1 });
    const { result, rerender } = renderHook(() => useKeyValueRows({ field, createValue: () => 0 }));

    field.handleChange(null as unknown as Record<string, number>);
    rerender();
    expect(result.current.rows).toHaveLength(0);

    field.handleChange({ beta: 2 });
    rerender();
    expect(result.current.rows.map((row) => row.key)).toEqual(["beta"]);
  });
});

describe("KeyValueField", () => {
  it("renders an accordion trigger labelled with the field label and entry count", () => {
    render(<KeyValueHarness defaultOpen initialValue={{ alpha: 1, beta: 2 }} />);
    expect(screen.getByRole("button", { name: /Scores/ })).toBeInTheDocument();
    expect(screen.getByText("2 entries")).toBeInTheDocument();
  });

  it("starts collapsed when defaultOpen is false, and expands on clicking the trigger", async () => {
    const user = userEvent.setup();
    render(<KeyValueHarness defaultOpen={false} />);
    expect(screen.queryByLabelText("Key")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Scores/ }));
    expect(screen.getByLabelText("Key")).toBeVisible();
  });

  it("renders the null toggle inside the trigger row, clickable even while collapsed", async () => {
    const user = userEvent.setup();
    const onIsNullChange = vi.fn();
    render(<KeyValueHarness defaultOpen={false} isNull={false} onIsNullChange={onIsNullChange} />);
    const nullToggle = screen.getByRole("checkbox", { name: /set scores to null/i });
    expect(nullToggle).toBeInTheDocument();
    await user.click(nullToggle);
    expect(onIsNullChange).toHaveBeenCalledWith(true);
  });

  it("collapses the accordion and disables the trigger while isNull, re-enabling it on uncheck", async () => {
    const user = userEvent.setup();
    const onIsNullChange = vi.fn();
    const { rerender } = render(
      <KeyValueHarness defaultOpen isNull onIsNullChange={onIsNullChange} />,
    );
    const trigger = screen.getByRole("button", { name: /Scores/ });
    expect(trigger).toBeDisabled();
    await user.click(trigger);
    expect(screen.queryByLabelText("Key")).not.toBeInTheDocument();

    rerender(<KeyValueHarness defaultOpen isNull={false} onIsNullChange={onIsNullChange} />);
    expect(screen.getByRole("button", { name: /Scores/ })).not.toBeDisabled();
    expect(screen.getByLabelText("Key")).toBeVisible();
  });
});
