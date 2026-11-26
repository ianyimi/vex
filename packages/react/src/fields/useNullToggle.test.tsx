import { describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import type { AnyFormApi } from "../forms";
import { useNullToggle } from "./useNullToggle";

type Doc = { note: Record<string, unknown> | null };

function Harness(props: { defaultValues: Doc; emptyValue: Record<string, unknown> }) {
  const form = useForm({ defaultValues: props.defaultValues });
  return (
    <form.Field name="note">
      {(field) => {
        const { isNull, onIsNullChange } = useNullToggle({
          field,
          nullable: true,
          emptyValue: () => props.emptyValue,
        });
        return (
          <div>
            <output data-testid="value">{JSON.stringify(field.state.value)}</output>
            <output data-testid="is-null">{String(isNull)}</output>
            <button type="button" onClick={() => onIsNullChange?.(!isNull)}>
              Toggle
            </button>
          </div>
        );
      }}
    </form.Field>
  );
}

describe("useNullToggle", () => {
  it("checking Null writes null, and the typed value survives in memory for restore", async () => {
    const user = userEvent.setup();
    render(<Harness defaultValues={{ note: { text: "hello" } }} emptyValue={{}} />);
    await user.click(screen.getByRole("button", { name: "Toggle" }));
    expect(screen.getByTestId("is-null")).toHaveTextContent("true");
    expect(screen.getByTestId("value")).toHaveTextContent("null");
  });

  it("unchecking after typing restores the in-session value typed before Null was checked", async () => {
    const user = userEvent.setup();
    render(<Harness defaultValues={{ note: { text: "typed" } }} emptyValue={{}} />);
    await user.click(screen.getByRole("button", { name: "Toggle" }));
    expect(screen.getByTestId("value")).toHaveTextContent("null");
    await user.click(screen.getByRole("button", { name: "Toggle" }));
    expect(screen.getByTestId("value")).toHaveTextContent(JSON.stringify({ text: "typed" }));
  });

  it("unchecking with no in-session memory restores the viewed version's stored value (form defaults)", async () => {
    const user = userEvent.setup();
    const formRef: { current: AnyFormApi | undefined } = { current: undefined };
    function LoadedNullHarness() {
      const form = useForm({ defaultValues: { note: { text: "from stored version" } } as Doc });
      formRef.current = form as AnyFormApi;
      return (
        <form.Field name="note">
          {(field) => {
            const { isNull, onIsNullChange } = useNullToggle({
              field,
              nullable: true,
              emptyValue: () => ({}),
            });
            return (
              <div>
                <output data-testid="value">{JSON.stringify(field.state.value)}</output>
                <button type="button" onClick={() => onIsNullChange?.(!isNull)}>
                  Toggle
                </button>
              </div>
            );
          }}
        </form.Field>
      );
    }
    render(<LoadedNullHarness />);
    act(() => {
      formRef.current!.setFieldValue("note", null);
    });
    await user.click(screen.getByRole("button", { name: "Toggle" }));
    expect(screen.getByTestId("value")).toHaveTextContent(JSON.stringify({ text: "from stored version" }));
  });

  it("falls back to the empty default when there is nothing to restore (stored value also null)", async () => {
    const user = userEvent.setup();
    render(<Harness defaultValues={{ note: null }} emptyValue={{ empty: true }} />);
    await user.click(screen.getByRole("button", { name: "Toggle" }));
    expect(screen.getByTestId("value")).toHaveTextContent(JSON.stringify({ empty: true }));
  });

  it("clears the remembered in-session value when the viewed document's stored value changes identity", async () => {
    const user = userEvent.setup();
    const formRef: { current: AnyFormApi | undefined } = { current: undefined };
    function SwitchableHarness(props: { defaultValues: Doc }) {
      const form = useForm({ defaultValues: props.defaultValues });
      formRef.current = form as AnyFormApi;
      return (
        <form.Field name="note">
          {(field) => {
            const { isNull, onIsNullChange } = useNullToggle({
              field,
              nullable: true,
              emptyValue: () => ({ empty: true }),
            });
            return (
              <div>
                <output data-testid="value">{JSON.stringify(field.state.value)}</output>
                <button type="button" onClick={() => onIsNullChange?.(!isNull)}>
                  Toggle
                </button>
              </div>
            );
          }}
        </form.Field>
      );
    }
    const view = render(<SwitchableHarness defaultValues={{ note: { text: "session A" } }} />);
    await user.click(screen.getByRole("button", { name: "Toggle" }));
    expect(screen.getByTestId("value")).toHaveTextContent("null");

    act(() => {
      view.rerender(<SwitchableHarness defaultValues={{ note: null }} />);
      formRef.current!.reset({ note: null });
    });
    expect(screen.getByTestId("value")).toHaveTextContent("null");

    await user.click(screen.getByRole("button", { name: "Toggle" }));
    expect(screen.getByTestId("value")).toHaveTextContent(JSON.stringify({ empty: true }));
  });

  it("is a no-op when the field is not nullable", () => {
    function NotNullableHarness() {
      const form = useForm({ defaultValues: { note: { text: "x" } } as Doc });
      return (
        <form.Field name="note">
          {(field) => {
            const { isNull, onIsNullChange } = useNullToggle({
              field,
              nullable: false,
              emptyValue: () => ({}),
            });
            return (
              <output data-testid="result">{JSON.stringify({ isNull, hasToggle: onIsNullChange !== undefined })}</output>
            );
          }}
        </form.Field>
      );
    }
    render(<NotNullableHarness />);
    expect(screen.getByTestId("result")).toHaveTextContent(
      JSON.stringify({ isNull: false, hasToggle: false }),
    );
  });

  it("calls onRestore with the resolved value before writing it", async () => {
    const user = userEvent.setup();
    const restored: unknown[] = [];
    function OnRestoreHarness() {
      const form = useForm({ defaultValues: { note: { text: "restorable" } } as Doc });
      return (
        <form.Field name="note">
          {(field) => {
            const { isNull, onIsNullChange } = useNullToggle({
              field,
              nullable: true,
              emptyValue: () => ({}),
              onRestore: (value) => restored.push(value),
            });
            return (
              <button type="button" onClick={() => onIsNullChange?.(!isNull)}>
                Toggle
              </button>
            );
          }}
        </form.Field>
      );
    }
    render(<OnRestoreHarness />);
    await user.click(screen.getByRole("button", { name: "Toggle" }));
    await user.click(screen.getByRole("button", { name: "Toggle" }));
    expect(restored).toEqual([{ text: "restorable" }]);
  });
});
