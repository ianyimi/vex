import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { adminFieldToInputSchema, json, type CollectionConfig, type JsonField } from "@vexcms/core";
import { AppForm } from "../../forms";
import { testCollection } from "../../testing/harness/accessFixtures";
import { runFieldInputContractSuite } from "../../testing/fieldInputContract";
import type { JsonEditorProps } from "../../ui/JsonEditor";
import { jsonFieldFixture } from "./testFixture";
import { JsonFieldAdmin } from "./Field";

/**
 * Stubs the CodeMirror-backed `JsonEditorView` with a plain controlled
 * textarea mirroring `JsonEditorProps`, so the shared field-input contract
 * suite (and this file's own tests) can drive it with `@testing-library/user-event`
 * the same way every other text-entry field is driven, without mounting
 * real CodeMirror in jsdom.
 */
vi.mock("../../ui/JsonEditorView", () => ({
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

/**
 * Mounts `JsonFieldAdmin` behind a real `useForm` + `<AppForm>`, wired with
 * the same real `adminFieldToInputSchema`-driven `onSubmit` validator the
 * generic factory uses internally.
 */
function JsonValidationHarness(props: {
  fieldDef: JsonField;
  collection: CollectionConfig;
  initialValue: unknown;
  readOnly?: boolean;
}) {
  const form = useForm({
    defaultValues: { testField: props.initialValue },
    validators: {
      onSubmit: ({ value }) => {
        const schema = adminFieldToInputSchema({ field: props.fieldDef });
        const result = schema.safeParse(value.testField);
        if (result.success) return undefined;
        return { fields: { testField: result.error.issues[0]?.message ?? "Invalid value" } };
      },
    },
  });
  return (
    <AppForm form={form}>
      <JsonFieldAdmin
        name="testField"
        fieldDef={props.fieldDef}
        collection={props.collection}
        readOnly={props.readOnly ?? false}
      />
      <button type="submit">Submit</button>
    </AppForm>
  );
}

runFieldInputContractSuite({
  fixture: jsonFieldFixture,
  Component: JsonFieldAdmin,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("json: parse-on-change, Format button, and read-only preview", () => {
      it("commits the parsed value with no local parse-error shown for valid typed JSON", async () => {
        const user = userEvent.setup();
        const fieldDef = json({ label: "Settings" });
        const { container } = render(
          <JsonValidationHarness fieldDef={fieldDef} collection={collection} initialValue={undefined} />,
        );

        const textarea = await screen.findByLabelText("Settings", { exact: false });
        await user.clear(textarea);
        await user.type(textarea, "true");

        expect(container.querySelectorAll(".text-destructive")).toHaveLength(0);
      });

      it("shows a local parse-error message while the typed text fails to parse", async () => {
        const user = userEvent.setup();
        const fieldDef = json({ label: "Settings" });
        const { container } = render(
          <JsonValidationHarness fieldDef={fieldDef} collection={collection} initialValue={undefined} />,
        );

        const textarea = await screen.findByLabelText("Settings", { exact: false });
        await user.clear(textarea);
        await user.type(textarea, "not valid json");

        expect(container.querySelectorAll(".text-destructive")).toHaveLength(1);
        expect(textarea).toHaveValue("not valid json");
      });

      it("leaves the committed form value unchanged while the typed text fails to parse", async () => {
        const user = userEvent.setup();
        const fieldDef = json({ label: "Settings", required: true });
        render(<JsonValidationHarness fieldDef={fieldDef} collection={collection} initialValue={42} />);

        const textarea = await screen.findByLabelText("Settings", { exact: false });
        await user.type(textarea, "not valid json");
        await user.click(screen.getByRole("button", { name: /submit/i }));

        expect(screen.queryByText("This field is required.")).not.toBeInTheDocument();
      });

      it("the Format button normalizes the current valid JSON text and commits the parsed value", async () => {
        const user = userEvent.setup();
        const fieldDef = json({ label: "Settings" });
        render(
          <JsonValidationHarness fieldDef={fieldDef} collection={collection} initialValue={undefined} />,
        );

        const textarea = (await screen.findByLabelText("Settings", {
          exact: false,
        })) as HTMLTextAreaElement;
        await user.type(textarea, "1.500");
        await user.click(screen.getByRole("button", { name: "Format" }));

        expect(textarea.value).toBe("1.5");
      });

      it("disables the Format button while the current text doesn't parse", async () => {
        const user = userEvent.setup();
        const fieldDef = json({ label: "Settings" });
        render(
          <JsonValidationHarness fieldDef={fieldDef} collection={collection} initialValue={undefined} />,
        );

        const textarea = await screen.findByLabelText("Settings", { exact: false });
        await user.type(textarea, "not valid json");

        expect(screen.getByRole("button", { name: "Format" })).toBeDisabled();
      });

      it("renders a read-only JsonEditor with the pretty-printed value instead of an editable one", async () => {
        const fieldDef = json({ label: "Settings", admin: { readOnly: true } });
        const { container } = render(
          <JsonValidationHarness
            fieldDef={fieldDef}
            collection={collection}
            initialValue={{ a: 1 }}
            readOnly
          />,
        );

        const group = (await screen.findByText("Settings")).closest('[role="group"]') as HTMLElement;
        const textarea = (await within(group).findByRole("textbox")) as HTMLTextAreaElement;
        expect(textarea).toHaveAttribute("readonly");
        expect(textarea.value).toBe(JSON.stringify({ a: 1 }, null, 2));
        expect(container.querySelector("pre")).toBeNull();
      });

      it("keeps the local draft/Format/parse-error control and shows the placeholder on an empty document when admin.placeholder is set", async () => {
        const user = userEvent.setup();
        const fieldDef = json({ label: "Settings", admin: { placeholder: "e.g. { }" } });
        const { container } = render(
          <JsonValidationHarness fieldDef={fieldDef} collection={collection} initialValue={undefined} />,
        );

        const textarea = (await screen.findByLabelText("Settings", {
          exact: false,
        })) as HTMLTextAreaElement;
        expect(textarea.value).toBe("");
        expect(textarea).toHaveAttribute("placeholder", "e.g. { }");
        expect(screen.getByRole("button", { name: "Format" })).toBeInTheDocument();

        await user.type(textarea, "not valid json");
        expect(container.querySelector(".text-destructive")).toHaveTextContent(/JSON/i);
      });
    });
  },
});
