import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import type { JsonEditorProps } from "../ui/JsonEditor";
import { JsonField } from "./JsonField";

/**
 * Stubs the CodeMirror-backed `JsonEditorView` with a plain controlled
 * textarea mirroring `JsonEditorProps`, so this file's tests can drive it
 * with `@testing-library/user-event` without mounting real CodeMirror in
 * jsdom — same stub `components/fields/json/Input.test.tsx` uses.
 */
vi.mock("../ui/JsonEditorView", () => ({
  JsonEditorView: ({
    id,
    value,
    onChange,
    onBlur,
    readOnly,
    invalid,
    "aria-labelledby": ariaLabelledBy,
    "aria-required": ariaRequired,
    placeholder,
  }: JsonEditorProps) => (
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      readOnly={readOnly}
      aria-invalid={invalid}
      aria-labelledby={ariaLabelledBy}
      aria-required={ariaRequired}
      placeholder={placeholder}
    />
  ),
}));

const { fieldContext, formContext } = createFormHookContexts();
const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { JsonField },
  formComponents: {},
});

function Harness(props: { initialValue: unknown; readOnly?: boolean }) {
  const form = useAppForm({ defaultValues: { meta: props.initialValue } });
  return (
    <form.AppForm>
      <form.AppField name="meta">
        {(field) => <field.JsonField label="Meta" readOnly={props.readOnly} />}
      </form.AppField>
      <form.Subscribe selector={(state) => state.values.meta}>
        {(value) => <output data-testid="value-probe">{JSON.stringify(value)}</output>}
      </form.Subscribe>
    </form.AppForm>
  );
}

describe("JsonField", () => {
  it("pretty-prints the initial value", async () => {
    render(<Harness initialValue={{ a: 1 }} />);
    // `collapseWhitespace: false` — the default normalizer only collapses
    // the DOM value, not the matcher string, so a multi-line matcher like
    // this one never matches a collapsed-whitespace comparison.
    expect(
      await screen.findByDisplayValue('{\n  "a": 1\n}', { collapseWhitespace: false }),
    ).toBeInTheDocument();
  });

  it("commits a valid edit and shows no parse error", async () => {
    const user = userEvent.setup();
    render(<Harness initialValue={{}} />);
    const editor = await screen.findByLabelText(/Meta/);
    await user.clear(editor);
    // `{{` escapes a literal `{` for userEvent's keyboard parser; a lone
    // `}` needs no escape.
    await user.type(editor, '{{"a":2}');
    expect(screen.getByTestId("value-probe")).toHaveTextContent('{"a":2}');
  });

  it("shows a parse error and leaves the committed value untouched on invalid text", async () => {
    const user = userEvent.setup();
    render(<Harness initialValue={{ a: 1 }} />);
    const editor = await screen.findByLabelText(/Meta/);
    // No `clear()` first — blank text parses to `undefined` (clearing the
    // field), which would itself commit and defeat "untouched". Typing onto
    // the pretty-printed initial text keeps it malformed throughout.
    // `{{` escapes a literal `{` for userEvent's keyboard parser — an
    // unescaped `{not json}` is read as a (invalid) special key sequence.
    await user.type(editor, "{{not json}");
    expect(
      screen.getByText(/Unexpected token|Expected property name|Unexpected non-whitespace character/),
    ).toBeInTheDocument();
    expect(screen.getByTestId("value-probe")).toHaveTextContent('{"a":1}');
  });

  it("renders a read-only editor with no Format button when readOnly", async () => {
    render(<Harness initialValue={{ a: 1 }} readOnly />);
    await screen.findByDisplayValue('{\n  "a": 1\n}', { collapseWhitespace: false });
    expect(screen.queryByRole("button", { name: "Format" })).not.toBeInTheDocument();
  });
});
