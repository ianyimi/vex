import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { adminFieldToInputSchema, email, type CollectionConfig, type EmailField } from "@vexcms/core";
import { AppForm } from "../../form/AppForm";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { emailFieldFixture } from "./testFixture";
import { EmailFieldInput } from "./Input";

/**
 * Mounts `EmailFieldInput` behind a real `useForm` + `<AppForm>`, wired with
 * the same real `adminFieldToInputSchema`-driven `onSubmit` validator the
 * generic factory uses internally — needed here (rather than the shared
 * fixture's fixed schema) because every boundary test below constructs and
 * submits its own `min`/`max`/`required` combination.
 */
function EmailValidationHarness(props: {
  fieldDef: EmailField;
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
      <EmailFieldInput
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
  fixture: emailFieldFixture,
  Component: EmailFieldInput,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    async function submit(fieldDef: EmailField, value: string | undefined): Promise<string> {
      const user = userEvent.setup();
      const { container } = render(
        <EmailValidationHarness fieldDef={fieldDef} collection={collection} initialValue={value} />,
      );
      await user.click(screen.getByRole("button", { name: /submit/i }));
      return container.querySelector(".text-destructive")?.textContent ?? "";
    }

    describe("email: native input type, format validation, and length boundaries", () => {
      it('renders a native type="email" input', () => {
        render(
          <EmailValidationHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={undefined}
          />,
        );
        const input = screen.getByLabelText("Contact Email", { exact: false });
        expect(input).toHaveAttribute("type", "email");
        expect(input).toHaveAttribute("autocomplete", "email");
      });

      it("accepts a well-formed email address", async () => {
        const fieldDef = email({ label: "Contact Email", required: true });
        expect(await submit(fieldDef, "jane@example.com")).toBe("");
      });

      it("rejects a malformed email address with a clear format message", async () => {
        const fieldDef = email({ label: "Contact Email", required: true });
        expect(await submit(fieldDef, "not-an-email")).toBe("Enter a valid email address.");
      });

      it("accepts a value at exactly the configured min length", async () => {
        const fieldDef = email({ label: "Contact Email", min: 12 });
        expect(await submit(fieldDef, "abcde@fg.com")).toBe("");
      });

      it("rejects a value below the min length with the default min-length message", async () => {
        const fieldDef = email({ label: "Contact Email", min: 10 });
        expect(await submit(fieldDef, "a@b.co")).toBe("Must be at least 10 characters.");
      });

      it("rejects a value over the max length with the default max-length message", async () => {
        const fieldDef = email({ label: "Contact Email", max: 12 });
        expect(await submit(fieldDef, "abcdefgh@ij.com")).toBe("Must be no more than 12 characters.");
      });

      it("required: a missing value fails with the required message, not the format message", async () => {
        const fieldDef = email({ label: "Contact Email", required: true });
        expect(await submit(fieldDef, undefined)).toBe("This field is required.");
      });

      it("optional: a missing value is accepted", async () => {
        const fieldDef = email({ label: "Contact Email" });
        expect(await submit(fieldDef, undefined)).toBe("");
      });
    });
  },
});
