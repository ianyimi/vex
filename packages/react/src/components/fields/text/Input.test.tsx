import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { adminFieldToInputSchema, text, type CollectionConfig, type TextField } from "@vexcms/core";
import { AppForm } from "../../form/AppForm";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { textFieldFixture } from "./testFixture";
import { TextFieldInput } from "./Input";

/**
 * Mounts `TextFieldInput` behind a real `useForm` + `<AppForm>`, wired with the
 * same real `adminFieldToInputSchema`-driven `onSubmit` validator the generic
 * factory uses internally — needed here (rather than the shared fixture's fixed
 * schema) because every boundary test below constructs and submits its own
 * `min`/`max`/`required` combination.
 */
function TextValidationHarness(props: {
  fieldDef: TextField;
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
      <TextFieldInput
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
  fixture: textFieldFixture,
  Component: TextFieldInput,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    async function submit(fieldDef: TextField, value: string | undefined): Promise<string> {
      const user = userEvent.setup();
      const { container } = render(
        <TextValidationHarness fieldDef={fieldDef} collection={collection} initialValue={value} />,
      );
      await user.click(screen.getByRole("button", { name: /submit/i }));
      return container.querySelector(".text-destructive")?.textContent ?? "";
    }

    describe("text: length boundaries, the required-vs-min/max override trap, and no client-side truncation", () => {
      it("accepts a value at exactly the configured min length", async () => {
        const fieldDef = text({ label: "Bio", min: { value: 3 } });
        expect(await submit(fieldDef, "x".repeat(3))).toBe("");
      });

      it("rejects a value one character below the min length with the default min-length message", async () => {
        const fieldDef = text({ label: "Bio", min: { value: 3 } });
        expect(await submit(fieldDef, "x".repeat(2))).toBe("This field is too short.");
      });

      it("accepts a value at exactly the configured max length", async () => {
        const fieldDef = text({ label: "Bio", max: { value: 10 } });
        expect(await submit(fieldDef, "x".repeat(10))).toBe("");
      });

      it("rejects a value one character over the max length with the default max-length message", async () => {
        const fieldDef = text({ label: "Bio", max: { value: 10 } });
        expect(await submit(fieldDef, "x".repeat(11))).toBe("This field is too long.");
      });

      it("uses a custom min.error message instead of the default when configured", async () => {
        const fieldDef = text({
          label: "Bio",
          min: { value: 5, error: "Bio needs at least 5 characters." },
        });
        expect(await submit(fieldDef, "x".repeat(4))).toBe("Bio needs at least 5 characters.");
      });

      it("uses a custom max.error message instead of the default when configured", async () => {
        const fieldDef = text({
          label: "Bio",
          max: { value: 5, error: "Bio can be at most 5 characters." },
        });
        expect(await submit(fieldDef, "x".repeat(6))).toBe("Bio can be at most 5 characters.");
      });

      it("required + min (no max): a missing value fails with the required message — CORE-1 fixed: min/max compose onto the required branch instead of reassigning over it", async () => {
        const fieldDef = text({ label: "Bio", required: true, min: { value: 3 } });
        expect(await submit(fieldDef, undefined)).toBe("This field is required.");
      });

      it("required + max only (no min): a missing value fails with the required message, not silently passing", async () => {
        const fieldDef = text({ label: "Bio", required: true, max: { value: 10 } });
        expect(await submit(fieldDef, undefined)).toBe("This field is required.");
      });

      it("required + min AND max together: a missing value still fails with the required message", async () => {
        const fieldDef = text({
          label: "Bio",
          required: true,
          min: { value: 3 },
          max: { value: 10 },
        });
        expect(await submit(fieldDef, undefined)).toBe("This field is required.");
      });

      it('a plain required field with no min/max keeps "This field is required." for a missing value', async () => {
        const fieldDef = text({ label: "Bio", required: true });
        expect(await submit(fieldDef, undefined)).toBe("This field is required.");
      });

      it("an optional field with no min/max accepts a missing value", async () => {
        const fieldDef = text({ label: "Bio" });
        expect(await submit(fieldDef, undefined)).toBe("");
      });

      it("never client-side truncates or rejects a value past max — enforcement is deferred to the schema on submit", async () => {
        const user = userEvent.setup();
        const fieldDef = text({ label: "Bio", max: { value: 5 } });
        render(
          <TextValidationHarness
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
