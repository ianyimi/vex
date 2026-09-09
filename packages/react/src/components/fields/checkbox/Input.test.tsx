import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import {
  checkboxFieldToInputSchema,
  type CheckboxField,
  type CollectionConfig,
} from "@vexcms/core";
import { AppForm } from "../../form/AppForm";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { checkboxFieldFixture } from "./testFixture";
import { CheckboxFieldInput } from "./Input";

/** Mounts `CheckboxFieldInput` behind a real `useForm` + `<AppForm>`. */
function CheckboxHarness(props: {
  fieldDef: CheckboxField;
  collection: CollectionConfig;
  initialValue: boolean;
  readOnly?: boolean;
}) {
  const form = useForm({ defaultValues: { testField: props.initialValue } });
  return (
    <AppForm form={form}>
      <CheckboxFieldInput
        name="testField"
        fieldDef={props.fieldDef}
        collection={props.collection}
        readOnly={props.readOnly ?? false}
      />
    </AppForm>
  );
}

/**
 * Mounts `CheckboxFieldInput` with the field's REAL `checkboxFieldToInputSchema`
 * wired as an explicit `form.Field` `onSubmit` validator, plus a submit
 * button, to check the field's actual submitted-value semantics through the
 * real submit path.
 */
function CheckboxBoundaryHarness(props: {
  fieldDef: CheckboxField;
  collection: CollectionConfig;
  initialValue: boolean;
}) {
  const form = useForm({ defaultValues: { testField: props.initialValue } });
  const schema = checkboxFieldToInputSchema({ field: props.fieldDef });
  return (
    <AppForm form={form}>
      <form.Field
        name="testField"
        validators={{
          onSubmit: ({ value }) => {
            const result = schema.safeParse(value);
            return result.success ? undefined : result.error.issues[0]?.message;
          },
        }}
      >
        {(field) => (
          <CheckboxFieldInput
            name="testField"
            fieldDef={props.fieldDef}
            collection={props.collection}
            readOnly={false}
            field={field}
          />
        )}
      </form.Field>
      <button type="submit">Save</button>
    </AppForm>
  );
}

runFieldInputContractSuite({
  fixture: checkboxFieldFixture,
  Component: CheckboxFieldInput,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("checkbox: checked/unchecked toggle and label-click delegation", () => {
      it("starts unchecked and toggles to checked on click, then back on a second click", async () => {
        const user = userEvent.setup();
        const { container } = render(
          <CheckboxHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.empty ?? false}
          />,
        );
        const box = screen.getByRole("checkbox", { name: new RegExp(options.fixture.fieldDef.label) });
        // Base UI's visible `role="checkbox"` span delegates a real click to
        // its hidden native `<input>` via a dispatched `PointerEvent` — jsdom
        // (verified) doesn't run the browser's default checkbox-toggle action
        // for a programmatically dispatched event the way a real browser
        // does, so this drives the interaction through the hidden input
        // directly: the same element the span's own click handler targets,
        // and the one native `<label for>` click-delegation also lands on
        // (proven working by the very next test in this block).
        const hiddenInput = container.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
        expect(box).not.toBeChecked();
        await user.click(hiddenInput);
        expect(box).toBeChecked();
        await user.click(hiddenInput);
        expect(box).not.toBeChecked();
      });

      // `FormLabel` renders `htmlFor={name}`, and Base UI's `Checkbox.Root`
      // places that same id on its visually-hidden native
      // `<input type="checkbox">` (not the visible span) specifically so the
      // browser's native label-click delegation works — exercised end to end.
      // The label's accessible name carries the required asterisk (UI-3), so
      // `getByRole`'s `name` match is a regex here, not the bare field label.
      it("clicking the field's label toggles the checkbox, the same as clicking the control", async () => {
        const user = userEvent.setup();
        render(
          <CheckboxHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={false}
          />,
        );
        const box = screen.getByRole("checkbox", { name: new RegExp(options.fixture.fieldDef.label) });
        expect(box).not.toBeChecked();
        await user.click(screen.getByText(options.fixture.fieldDef.label));
        expect(box).toBeChecked();
      });

      it("clicking the field's label is a no-op when the field is disabled via the readOnly prop", async () => {
        const user = userEvent.setup();
        render(
          <CheckboxHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={false}
            readOnly
          />,
        );
        const box = screen.getByRole("checkbox", { name: new RegExp(options.fixture.fieldDef.label) });
        await user.click(screen.getByText(options.fixture.fieldDef.label));
        expect(box).not.toBeChecked();
      });

      // CheckboxFieldInput ORs BOTH sources into the same disabled/readOnly
      // pair, unlike text/number/url's split — exercising fieldDef.admin.readOnly
      // through the label-click path specifically, since that path is not
      // covered by the shared factory's generic readOnly checks.
      it("clicking the field's label is a no-op when the field is disabled via fieldDef.admin.readOnly instead", async () => {
        const user = userEvent.setup();
        const readOnlyFieldDef: CheckboxField = {
          ...options.fixture.fieldDef,
          admin: { ...options.fixture.fieldDef.admin, readOnly: true },
        };
        render(
          <CheckboxHarness
            fieldDef={readOnlyFieldDef}
            collection={collection}
            initialValue={false}
          />,
        );
        const box = screen.getByRole("checkbox", { name: new RegExp(options.fixture.fieldDef.label) });
        await user.click(screen.getByText(options.fixture.fieldDef.label));
        expect(box).not.toBeChecked();
      });
    });

    describe("checkbox: indeterminate is architecturally unreachable", () => {
      // Negative/boundary check: Base UI's Checkbox.Root supports an
      // `indeterminate` prop, but CheckboxField/CheckboxFieldInput expose no
      // config surface for it, so the state can never be reached through this
      // field type.
      it("never renders an indeterminate ARIA state", () => {
        render(
          <CheckboxHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={true}
          />,
        );
        const box = screen.getByRole("checkbox", { name: new RegExp(options.fixture.fieldDef.label) });
        expect(box).not.toHaveAttribute("data-indeterminate");
        expect(box.getAttribute("aria-checked")).not.toBe("mixed");
      });
    });

    describe("checkbox: required means present, not checked", () => {
      // Reading checkboxFieldToInputSchema (CORE-1 fix): required fields
      // attach `{ error: "This field is required." }` to the base
      // `z.boolean()` call and never receive `.default()`, so a genuinely
      // missing value is rejected — but `true`/`false` are both legitimate
      // present values and neither is rejected. "Required" means "present",
      // not "checked".
      it("accepts true and false, rejects a missing value, for a required checkbox", () => {
        const schema = checkboxFieldToInputSchema({ field: options.fixture.fieldDef });
        expect(schema.safeParse(true)).toMatchObject({ success: true, data: true });
        expect(schema.safeParse(false)).toMatchObject({ success: true, data: false });
        const missing = schema.safeParse(undefined);
        expect(missing.success).toBe(false);
        if (!missing.success) {
          expect(missing.error.issues[0].message).toMatch(/required/i);
        }
      });

      it("submitting the form with the checkbox left unchecked produces no validation error, even though the field is required", async () => {
        const user = userEvent.setup();
        render(
          <CheckboxBoundaryHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={false}
          />,
        );
        await user.click(screen.getByRole("button", { name: "Save" }));
        expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
      });
    });
  },
});
