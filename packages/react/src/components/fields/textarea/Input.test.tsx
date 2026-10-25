import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { adminFieldToInputSchema, textarea, type CollectionConfig, type TextareaField } from "@vexcms/core";
import { AppForm } from "../../form/AppForm";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { textareaFieldFixture } from "./testFixture";
import { TextareaFieldInput } from "./Input";

/**
 * Mounts `TextareaFieldInput` behind a real `useForm` + `<AppForm>`, wired with
 * the same real `adminFieldToInputSchema`-driven `onSubmit` validator the
 * generic factory uses internally — needed here (rather than the shared
 * fixture's fixed schema) because every boundary test below constructs and
 * submits its own `min`/`max`/`required`/`rows` combination.
 */
function TextareaValidationHarness(props: {
  fieldDef: TextareaField;
  collection: CollectionConfig;
  initialValue: string | undefined;
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
      <TextareaFieldInput
        name="testField"
        fieldDef={props.fieldDef}
        collection={props.collection}
        readOnly={false}
      />
      <button type="submit">Submit</button>
    </AppForm>
  );
}

runFieldInputContractSuite({
  fixture: textareaFieldFixture,
  Component: TextareaFieldInput,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    async function submit(fieldDef: TextareaField, value: string | undefined): Promise<string> {
      const user = userEvent.setup();
      const { container } = render(
        <TextareaValidationHarness fieldDef={fieldDef} collection={collection} initialValue={value} />,
      );
      await user.click(screen.getByRole("button", { name: /submit/i }));
      return container.querySelector(".text-destructive")?.textContent ?? "";
    }

    describe("textarea: length boundaries, rows, and the character counter", () => {
      it("accepts a value at exactly the configured min length", async () => {
        const fieldDef = textarea({ label: "Bio", min: 3 });
        expect(await submit(fieldDef, "x".repeat(3))).toBe("");
      });

      it("rejects a value one character below the min length with the default min-length message", async () => {
        const fieldDef = textarea({ label: "Bio", min: 3 });
        expect(await submit(fieldDef, "x".repeat(2))).toBe("Must be at least 3 characters.");
      });

      it("accepts a value at exactly the configured max length", async () => {
        const fieldDef = textarea({ label: "Bio", max: 10 });
        expect(await submit(fieldDef, "x".repeat(10))).toBe("");
      });

      it("rejects a value one character over the max length with the default max-length message", async () => {
        const fieldDef = textarea({ label: "Bio", max: 10 });
        expect(await submit(fieldDef, "x".repeat(11))).toBe("Must be no more than 10 characters.");
      });

      it("uses a custom min error message instead of the default when configured", async () => {
        const fieldDef = textarea({ label: "Bio", min: [5, "Bio needs at least 5 characters."] });
        expect(await submit(fieldDef, "x".repeat(4))).toBe("Bio needs at least 5 characters.");
      });

      it("uses a custom max error message instead of the default when configured", async () => {
        const fieldDef = textarea({ label: "Bio", max: [5, "Bio can be at most 5 characters."] });
        expect(await submit(fieldDef, "x".repeat(6))).toBe("Bio can be at most 5 characters.");
      });

      it("required + min (no max): a missing value fails with the required message", async () => {
        const fieldDef = textarea({ label: "Bio", required: true, min: 3 });
        expect(await submit(fieldDef, undefined)).toBe("This field is required.");
      });

      it('a plain required field with no min/max keeps "This field is required." for a missing value', async () => {
        const fieldDef = textarea({ label: "Bio", required: true });
        expect(await submit(fieldDef, undefined)).toBe("This field is required.");
      });

      it("an optional field with no min/max accepts a missing value", async () => {
        const fieldDef = textarea({ label: "Bio" });
        expect(await submit(fieldDef, undefined)).toBe("");
      });

      it("defaults rows to 4 and renders it as the textarea's rows attribute", () => {
        const fieldDef = textarea({ label: "Bio" });
        render(
          <TextareaValidationHarness
            fieldDef={fieldDef}
            collection={collection}
            initialValue={undefined}
          />,
        );
        expect(screen.getByLabelText("Bio", { exact: false })).toHaveAttribute("rows", "4");
      });

      it("honors a configured rows value", () => {
        const fieldDef = textarea({ label: "Bio", rows: 10 });
        render(
          <TextareaValidationHarness
            fieldDef={fieldDef}
            collection={collection}
            initialValue={undefined}
          />,
        );
        expect(screen.getByLabelText("Bio", { exact: false })).toHaveAttribute("rows", "10");
      });

      it("shows the bare character count, with no limit, when max is not configured", () => {
        const fieldDef = textarea({ label: "Bio" });
        render(
          <TextareaValidationHarness
            fieldDef={fieldDef}
            collection={collection}
            initialValue="hello"
          />,
        );
        expect(screen.getByText("5")).toBeInTheDocument();
        expect(screen.queryByText(/^\d+\/\d+$/)).toBeNull();
      });

      it("shows an n/max character counter that updates as the user types, when max is configured", async () => {
        const user = userEvent.setup();
        const fieldDef = textarea({ label: "Bio", max: 20 });
        render(
          <TextareaValidationHarness
            fieldDef={fieldDef}
            collection={collection}
            initialValue={undefined}
          />,
        );
        expect(screen.getByText("0/20")).toBeInTheDocument();
        await user.type(screen.getByLabelText("Bio", { exact: false }), "hello");
        expect(screen.getByText("5/20")).toBeInTheDocument();
      });

      it("never client-side truncates or rejects a value past max — enforcement is deferred to the schema on submit", async () => {
        const user = userEvent.setup();
        const fieldDef = textarea({ label: "Bio", max: 5 });
        render(
          <TextareaValidationHarness
            fieldDef={fieldDef}
            collection={collection}
            initialValue={undefined}
          />,
        );

        const input = screen.getByLabelText("Bio", { exact: false });
        await user.type(input, "way too long for max");
        expect(input).toHaveValue("way too long for max");
      });
    });
  },
});
