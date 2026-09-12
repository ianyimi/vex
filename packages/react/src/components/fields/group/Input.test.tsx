import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import {
  adminFieldToInputSchema,
  group,
  text,
  type CollectionConfig,
  type GroupField,
} from "@vexcms/core";
import { AppForm } from "../../form/AppForm";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { runFieldInputContractSuite } from "../../../testing/fieldInputContract";
import { runNestedFieldContainerSuite } from "../../../testing/nestedFieldContainer";
import { groupFieldFixture } from "./testFixture";
import { GroupFieldInput } from "./Input";

/**
 * Mounts `GroupFieldInput` behind a real `useForm` + `<AppForm>`, exposing
 * the nested form value through a probe. The `onSubmit` validator maps every
 * Zod issue to its own dot-path field (`testField.title`, not just
 * `testField`) — mirroring how the real per-collection form-level validator
 * routes nested errors — so each sub-field's own `FormError` receives only
 * its own message.
 */
function GroupHarness(props: {
  fieldDef: GroupField;
  collection?: CollectionConfig;
  initialValue: Record<string, unknown>;
  readOnly?: boolean;
}) {
  const form = useForm({
    defaultValues: { testField: props.initialValue },
    validators: {
      onSubmit: ({ value }) => {
        const schema = adminFieldToInputSchema({ field: props.fieldDef });
        const result = schema.safeParse((value as Record<string, unknown>).testField);
        if (result.success) return undefined;
        const fields: Record<string, string> = {};
        for (const issue of result.error.issues) {
          fields[["testField", ...issue.path].join(".")] = issue.message;
        }
        return { fields };
      },
    },
  });
  return (
    <AppForm form={form}>
      <GroupFieldInput
        name="testField"
        fieldDef={props.fieldDef}
        collection={props.collection ?? testCollection}
        readOnly={props.readOnly ?? false}
      />
      <button type="submit">Submit</button>
      <form.Subscribe selector={(state) => state.values.testField}>
        {(value) => <output data-testid="value-probe">{JSON.stringify(value)}</output>}
      </form.Subscribe>
    </AppForm>
  );
}

runFieldInputContractSuite({
  fixture: groupFieldFixture,
  Component: GroupFieldInput,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("group: accordion collapse, sub-field count, dot-notation naming, and per-sub-field error isolation", () => {
      it("renders its sub-field expanded when admin.defaultCollapsed is unset", () => {
        render(
          <GroupHarness
            fieldDef={groupFieldFixture.fieldDef}
            collection={collection}
            initialValue={groupFieldFixture.valid}
          />,
        );
        expect(screen.getByLabelText("Title", { exact: false })).toBeVisible();
      });

      it("starts collapsed when admin.defaultCollapsed: true, and expands on clicking the trigger", async () => {
        const collapsedFieldDef = group({
          label: "Details",
          fields: { title: text({ label: "Title", required: true }) },
          admin: {
            defaultCollapsed: true,
          },
        });
        const user = userEvent.setup();
        render(
          <GroupHarness
            fieldDef={collapsedFieldDef}
            collection={collection}
            initialValue={{ title: "Hi" }}
          />,
        );

        // Base UI's `AccordionContent` unmounts collapsed content entirely
        // (no `keepMounted`), not just hides it — `queryByLabelText` (never
        // throws on zero matches) is the correct query here.
        expect(screen.queryByLabelText("Title", { exact: false })).not.toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: /details/i }));
        expect(screen.getByLabelText("Title", { exact: false })).toBeVisible();
      });

      it("shows the singular/plural sub-field count — '1 field' for one sub-field, 'N fields' for several", () => {
        const oneFieldDef = group({ label: "Solo", fields: { title: text({ label: "Title" }) } });
        const twoFieldDef = group({
          label: "Pair",
          fields: { title: text({ label: "Title" }), subtitle: text({ label: "Subtitle" }) },
        });
        const one = render(
          <GroupHarness fieldDef={oneFieldDef} collection={collection} initialValue={{}} />,
        );
        expect(one.getByRole("button", { name: /solo/i })).toHaveTextContent("1 field");
        one.unmount();

        const two = render(
          <GroupHarness fieldDef={twoFieldDef} collection={collection} initialValue={{}} />,
        );
        expect(two.getByRole("button", { name: /pair/i })).toHaveTextContent("2 fields");
      });

      it("uses dot-notation names for each sub-field, matching the group's nested value shape", async () => {
        const pairFieldDef = group({
          label: "Contact",
          fields: { title: text({ label: "Title" }), subtitle: text({ label: "Subtitle" }) },
        });
        const user = userEvent.setup();
        render(<GroupHarness fieldDef={pairFieldDef} collection={collection} initialValue={{}} />);

        expect(screen.getByLabelText("Title")).toHaveAttribute("id", "testField.title");
        expect(screen.getByLabelText("Subtitle")).toHaveAttribute("id", "testField.subtitle");

        await user.type(screen.getByLabelText("Title"), "Hi");
        await user.type(screen.getByLabelText("Subtitle"), "There");

        expect(JSON.parse(screen.getByTestId("value-probe").textContent ?? "{}")).toEqual({
          title: "Hi",
          subtitle: "There",
        });
      });

      it("isolates validation errors per sub-field — an invalid sub-field's error appears only on its own control, never on a valid sibling's", async () => {
        const contactFieldDef = group({
          label: "Contact",
          fields: {
            email: text({ label: "Email", required: true }),
            phone: text({ label: "Phone", required: false }),
          },
        });
        const emailSchema = adminFieldToInputSchema({ field: contactFieldDef.fields.email! });
        const emailError = emailSchema.safeParse(undefined);
        expect(emailError.success).toBe(false);
        const emailMessage = !emailError.success ? emailError.error.issues[0]?.message : undefined;

        const user = userEvent.setup();
        const { container } = render(
          <GroupHarness
            fieldDef={contactFieldDef}
            collection={collection}
            initialValue={{ email: undefined, phone: "555-0100" }}
          />,
        );

        await user.click(screen.getByRole("button", { name: /submit/i }));

        expect(await screen.findByText(emailMessage!)).toBeInTheDocument();
        // Only email's own leaf FormError received a message — phone's
        // stays empty, regardless of DOM nesting.
        const errorTexts = Array.from(container.querySelectorAll(".text-destructive"))
          .map((el) => el.textContent)
          .filter(Boolean);
        expect(errorTexts).toEqual([emailMessage]);
      });

      it("preserves a sub-field's value across a collapse→expand cycle", async () => {
        const user = userEvent.setup();
        render(
          <GroupHarness
            fieldDef={groupFieldFixture.fieldDef}
            collection={collection}
            initialValue={{}}
          />,
        );
        await user.type(screen.getByLabelText("Title", { exact: false }), "Persisted");
        await user.click(screen.getByRole("button", { name: /details/i }));
        expect(screen.queryByLabelText("Title", { exact: false })).not.toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: /details/i }));
        expect(screen.getByLabelText("Title", { exact: false })).toHaveValue("Persisted");
      });

      it("cascades readOnly to a sub-field via its own admin.readOnly, even when the group itself is editable — FormGroup ORs the two sources, unlike FormArray's item pass-through", () => {
        const readOnlySubFieldDef = group({
          label: "Details",
          fields: { title: text({ label: "Title", required: true, admin: { readOnly: true } }) },
        });
        render(
          <GroupHarness
            fieldDef={readOnlySubFieldDef}
            collection={collection}
            initialValue={{ title: "Locked" }}
            readOnly={false}
          />,
        );
        expect(screen.getByLabelText("Title", { exact: false })).toBeDisabled();
      });
    });
  },
});

runNestedFieldContainerSuite({
  container: "group",
  Component: GroupFieldInput,
  // One child per representative category — simple (text), choice (select),
  // temporal (date), network-via-react-query (upload) — plus "array" for the
  // group-of-array nested-of-nested case.
  //
  // `relationship` is deliberately excluded — see the rationale comment in
  // `array/Input.test.tsx`: its Convex live-query bridge needs
  // infrastructure (`config.collections`, `testing/convex/bridge.ts`) this
  // shared harness's `stubClientConfig` doesn't provide, and adding it would
  // throw during mount rather than silently under-cover a category.
  childFieldTypes: ["text", "select", "date", "upload", "array"],
});
