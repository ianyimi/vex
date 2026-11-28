import { describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import "../../adapter";
import { useForm } from "@tanstack/react-form";
import { adminFieldToInputSchema, variant, group, text, number, defineConfig, type VariantField as VariantFieldDef } from "@vexcms/core";
import { AppForm } from "../../forms/AppForm";
import type { AnyFormApi } from "../../forms";
import { useAppForm } from "../../forms/useAppForm";
import { VariantFieldAdmin } from "./Field";
import { GroupFieldAdmin } from "../group/Field";
import { VexConfigProvider } from "../../config/VexConfigContext";
import { installDomPolyfills, testCollection } from "../../testing";

installDomPolyfills();

const collection = testCollection;
const testConfig = defineConfig();

function getMemberControl(container: HTMLElement): HTMLInputElement {
  return container.querySelector<HTMLInputElement>("#testField")!;
}

function Harness(props: { fieldDef: VariantFieldDef; defaultValue: unknown; formRef?: { current: AnyFormApi | undefined } }) {
  const form = useAppForm({ defaultValues: { testField: props.defaultValue } });
  if (props.formRef) props.formRef.current = form as unknown as AnyFormApi;
  return (
    <VexConfigProvider config={testConfig}>
      <AppForm form={form}>
        <VariantFieldAdmin name="testField" fieldDef={props.fieldDef} readOnly={false} collection={collection} />
        <button type="submit">Submit</button>
        <form.Subscribe selector={(state) => state.values.testField}>
          {(value) => <output data-testid="value-probe">{JSON.stringify(value)}</output>}
        </form.Subscribe>
      </AppForm>
    </VexConfigProvider>
  );
}

function SchemaValidatedHarness(props: { fieldDef: VariantFieldDef; defaultValue: unknown }) {
  const form = useForm({
    defaultValues: { testField: props.defaultValue },
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
    <VexConfigProvider config={testConfig}>
      <AppForm form={form}>
        <VariantFieldAdmin name="testField" fieldDef={props.fieldDef} readOnly={false} collection={collection} />
        <button type="submit">Submit</button>
      </AppForm>
    </VexConfigProvider>
  );
}

describe("VariantFieldAdmin — discriminated", () => {
  const channel = variant({
    label: "Channel",
    discriminator: "kind",
    variants: {
      email: { label: "Email", fields: { address: text({ label: "Address", required: true }) } },
      sms: { label: "SMS", fields: { phoneNumber: text({ label: "Phone number", required: true }) } },
    },
  });

  it("renders the active variant's own fields", () => {
    render(<Harness fieldDef={channel} defaultValue={{ kind: "email", address: "a@b.com" }} />);
    expect(screen.getByLabelText("Address", { exact: false })).toHaveValue("a@b.com");
  });

  it("switching the picker resets the value to the new variant's defaults", async () => {
    const user = userEvent.setup();
    render(<Harness fieldDef={channel} defaultValue={{ kind: "email", address: "a@b.com" }} />);
    await user.click(screen.getByRole("combobox"));
    // The popup renders after the open click resolves (Base UI portal + positioner);
    // a synchronous lookup raced it and failed on loaded CI runners (release run 46124542279).
    await user.click(await screen.findByRole("option", { name: "SMS" }));
    expect(screen.getByLabelText("Phone number", { exact: false })).toHaveValue("");
    expect(screen.queryByLabelText("Address", { exact: false })).not.toBeInTheDocument();
  });

  it("submitting with the selected variant's own required sub-field empty already fails via the real schema validator", async () => {
    const user = userEvent.setup();
    render(<SchemaValidatedHarness fieldDef={channel} defaultValue={{ kind: "email", address: "" }} />);
    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(await screen.findByText("This field is required.")).toBeInTheDocument();
  });

  it("re-derives the active variant when the form value changes externally — e.g. a version switch (B2 regression)", async () => {
    const formRef: { current: AnyFormApi | undefined } = { current: undefined };
    render(<Harness fieldDef={channel} defaultValue={{ kind: "email", address: "a@b.com" }} formRef={formRef} />);
    expect(screen.getByLabelText("Address", { exact: false })).toBeInTheDocument();

    act(() => {
      formRef.current!.setFieldValue("testField", { kind: "sms", phoneNumber: "+1" });
    });

    expect(await screen.findByLabelText("Phone number", { exact: false })).toHaveValue("+1");
    expect(screen.queryByLabelText("Address", { exact: false })).not.toBeInTheDocument();
  });
});

describe("VariantFieldAdmin — primitive", () => {
  const amount = variant({
    label: "Amount",
    variants: { fixed: text({ label: "Fixed", required: true }), metered: number({ label: "Metered", required: true }) },
  });

  it("resolves the active member from the stored value's runtime kind on load", () => {
    const { container } = render(<Harness fieldDef={amount} defaultValue={42} />);
    expect(getMemberControl(container)).toHaveValue(42);
    expect(screen.queryByLabelText("Fixed", { exact: false })).not.toBeInTheDocument();
  });

  it("gives the active member's own label a distinct id from the accordion's own label — no duplicate DOM ids (W5 regression)", () => {
    const { container } = render(<Harness fieldDef={amount} defaultValue={42} />);
    const matches = container.querySelectorAll('[id="testField-label"]');
    expect(matches).toHaveLength(1);
    expect(matches[0]!.textContent).toContain("Amount");
  });

  it("switching the type picker seeds the new number member empty, not its static 0 default", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness fieldDef={amount} defaultValue="flat rate" />);
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "metered" }));
    expect(getMemberControl(container)).toHaveValue(null);
  });

  it("clearing the active member's own input keeps it selected, with the stored value becoming undefined", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness fieldDef={amount} defaultValue={42} />);
    const input = getMemberControl(container);
    await user.clear(input);
    expect(getMemberControl(container)).toBeInTheDocument();
    expect(screen.getByRole("combobox")).not.toHaveTextContent("Select a type");
    expect(screen.getByTestId("value-probe").textContent).toBe("");
  });

  it("submitting with the selected member's own input empty shows that member's required error exactly once, on the member's own field", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness fieldDef={amount} defaultValue={42} />);
    const input = getMemberControl(container);
    await user.clear(input);
    await user.click(screen.getByRole("button", { name: "Submit" }));
    const messages = await screen.findAllByText("This field is required.");
    expect(messages).toHaveLength(1);
    expect(messages[0]!.closest('[id="testField-error"]')).toBeInTheDocument();
    expect(container.querySelector('[id="testField-type-error"]')).not.toBeInTheDocument();
    expect(screen.getByRole("combobox")).not.toHaveTextContent("Select a type");
    expect(screen.getByTestId("value-probe").textContent).toBe("");
  });

  it("submitting after explicitly clearing to None shows no error — None still means unset", async () => {
    const user = userEvent.setup();
    render(<Harness fieldDef={amount} defaultValue={42} />);
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "None" }));
    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(screen.queryByText("This field is required.")).not.toBeInTheDocument();
    expect(screen.getByTestId("value-probe").textContent).toBe("");
  });

  it("shows None, not the Select-a-type placeholder, once a non-required picker is explicitly cleared (S3 regression)", async () => {
    const user = userEvent.setup();
    render(<Harness fieldDef={amount} defaultValue={42} />);
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "None" }));
    expect(screen.getByRole("combobox")).toHaveTextContent("None");
    expect(screen.getByRole("combobox")).not.toHaveTextContent("Select a type");
  });

  it("re-derives the active member when the form value changes externally to a different member's kind — e.g. a version switch (B2 regression)", async () => {
    const formRef: { current: AnyFormApi | undefined } = { current: undefined };
    const { container } = render(<Harness fieldDef={amount} defaultValue={42} formRef={formRef} />);
    expect(getMemberControl(container)).toHaveValue(42);

    act(() => {
      formRef.current!.setFieldValue("testField", "flat rate");
    });

    await screen.findByDisplayValue("flat rate");
    expect(getMemberControl(container)).toHaveValue("flat rate");
    expect(screen.getByRole("combobox")).toHaveTextContent("fixed");
  });

  it("does not clear the selected member when the form value changes externally to undefined (B2 regression)", async () => {
    const formRef: { current: AnyFormApi | undefined } = { current: undefined };
    const { container } = render(<Harness fieldDef={amount} defaultValue={42} formRef={formRef} />);
    expect(getMemberControl(container)).toHaveValue(42);

    act(() => {
      formRef.current!.setFieldValue("testField", undefined);
    });

    expect(getMemberControl(container)).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveTextContent("metered");
  });
});

describe("VariantFieldAdmin — nullable", () => {
  it("shows a Null toggle and hides the active selection's body while null", () => {
    const nullableChannel = variant({
      label: "Channel",
      nullable: true,
      discriminator: "kind",
      variants: { email: { label: "Email", fields: { address: text({ required: true }) } } },
    });
    render(<Harness fieldDef={nullableChannel} defaultValue={null} />);
    expect(screen.getByRole("checkbox", { name: "Set Channel to null" })).toBeChecked();
    expect(screen.queryByLabelText("Address", { exact: false })).not.toBeInTheDocument();
  });
});

describe("VariantFieldAdmin — nested inside group()", () => {
  it("renders through the registry when nested as a group()'s own sub-field", () => {
    const withNestedVariant = group({
      label: "Settings",
      fields: {
        channel: variant({
          label: "Channel",
          discriminator: "kind",
          variants: { email: { label: "Email", fields: { address: text({ required: true }) } } },
        }),
      },
    });
    function NestedHarness() {
      const form = useAppForm({ defaultValues: { settings: { channel: { kind: "email", address: "x@y.com" } } } });
      return (
        <VexConfigProvider config={testConfig}>
          <AppForm form={form}>
            <GroupFieldAdmin name="settings" fieldDef={withNestedVariant} readOnly={false} collection={collection} />
          </AppForm>
        </VexConfigProvider>
      );
    }
    render(<NestedHarness />);
    expect(screen.getByLabelText("Address", { exact: false })).toHaveValue("x@y.com");
  });
});

describe("VariantFieldAdmin — optional, no default preselection", () => {
  const channel = variant({
    label: "Channel",
    discriminator: "kind",
    variants: {
      email: { label: "Email", fields: { address: text({ label: "Address", required: true }) } },
      sms: { label: "SMS", fields: { phoneNumber: text({ label: "Phone number", required: true }) } },
    },
  });
  const amount = variant({
    label: "Amount",
    variants: { fixed: text({ label: "Fixed", required: true }), metered: number({ label: "Metered", required: true }) },
  });

  it("discriminated: an undefined value starts with no variant selected and renders no member fields", () => {
    render(<Harness fieldDef={channel} defaultValue={undefined} />);
    expect(screen.getByRole("combobox")).toHaveTextContent("None");
    expect(screen.queryByLabelText("Address", { exact: false })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Phone number", { exact: false })).not.toBeInTheDocument();
  });

  it("primitive: an undefined value starts with no member selected and renders no member field", () => {
    render(<Harness fieldDef={amount} defaultValue={undefined} />);
    expect(screen.getByRole("combobox")).toHaveTextContent("None");
    expect(screen.queryByLabelText("Fixed", { exact: false })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Metered", { exact: false })).not.toBeInTheDocument();
  });

  it("discriminated: picking a variant then clearing via the None option returns to no selection", async () => {
    const user = userEvent.setup();
    render(<Harness fieldDef={channel} defaultValue={undefined} />);
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "Email" }));
    expect(screen.getByLabelText("Address", { exact: false })).toHaveValue("");

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "None" }));
    expect(screen.queryByLabelText("Address", { exact: false })).not.toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveTextContent("None");
  });

  it("primitive: picking a member then clearing via the None option returns to no selection", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness fieldDef={amount} defaultValue={undefined} />);
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "metered" }));
    expect(getMemberControl(container)).toHaveValue(null);

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "None" }));
    expect(screen.queryByLabelText("Metered", { exact: false })).not.toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveTextContent("None");
  });
});

describe("VariantFieldAdmin — accordion (mirrors group())", () => {
  const channel = variant({
    label: "Channel",
    discriminator: "kind",
    variants: {
      email: { label: "Email", fields: { address: text({ label: "Address", required: true }) } },
      sms: { label: "SMS", fields: { phoneNumber: text({ label: "Phone number", required: true }) } },
    },
  });

  it("renders expanded by default and shows the active variant's own label as the trigger summary", () => {
    render(<Harness fieldDef={channel} defaultValue={{ kind: "email", address: "a@b.com" }} />);
    const trigger = screen.getByRole("button", { name: /channel/i });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAccessibleName(/email/i);
    expect(screen.getByLabelText("Address", { exact: false })).toBeVisible();
  });

  it("starts collapsed when admin.defaultCollapsed is true, and expands on clicking the trigger", async () => {
    const collapsed = variant({
      label: "Channel",
      discriminator: "kind",
      admin: { defaultCollapsed: true },
      variants: { email: { label: "Email", fields: { address: text({ label: "Address", required: true }) } } },
    });
    const user = userEvent.setup();
    render(<Harness fieldDef={collapsed} defaultValue={{ kind: "email", address: "a@b.com" }} />);
    expect(screen.queryByLabelText("Address", { exact: false })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /channel/i }));
    expect(screen.getByLabelText("Address", { exact: false })).toBeVisible();
  });

  it("renders the Null toggle in the trigger row, accessible even while the accordion is collapsed", () => {
    const nullableChannel = variant({
      label: "Channel",
      nullable: true,
      discriminator: "kind",
      admin: { defaultCollapsed: true },
      variants: { email: { label: "Email", fields: { address: text({ required: true }) } } },
    });
    render(<Harness fieldDef={nullableChannel} defaultValue={null} />);
    expect(screen.getByRole("checkbox", { name: "Set Channel to null" })).toBeInTheDocument();
  });

  it("discriminated: switching to a variant whose sub-field is number() seeds it empty, not its static 0 default", async () => {
    const withNumberMember = variant({
      label: "Pricing",
      discriminator: "kind",
      variants: {
        flat: { label: "Flat", fields: { amount: text({ label: "Flat amount", required: true }) } },
        metered: { label: "Metered", fields: { rate: number({ label: "Rate", required: true }) } },
      },
    });
    const user = userEvent.setup();
    render(<Harness fieldDef={withNumberMember} defaultValue={{ kind: "flat", amount: "10" }} />);
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "Metered" }));
    expect(screen.getByLabelText("Rate", { exact: false })).toHaveValue(null);
  });
});

describe("variant: null-toggle restore rule", () => {
  function NullableVariantHarness(props: { initialValue: unknown }) {
    const channel = variant({
      label: "Channel",
      nullable: true,
      required: true,
      discriminator: "kind",
      variants: { email: { label: "Email", fields: { address: text({ label: "Address", required: true }) } } },
    });
    const form = useForm({ defaultValues: { testField: props.initialValue } });
    return (
      <VexConfigProvider config={testConfig}>
        <AppForm form={form}>
          <VariantFieldAdmin name="testField" fieldDef={channel} readOnly={false} collection={collection} />
          <form.Subscribe selector={(state) => state.values.testField}>
            {(value) => <output data-testid="value-probe">{JSON.stringify(value)}</output>}
          </form.Subscribe>
        </AppForm>
      </VexConfigProvider>
    );
  }

  it("unchecking after switching/editing the active member restores that typed value", async () => {
    const user = userEvent.setup();
    render(<NullableVariantHarness initialValue={{ kind: "email", address: "a@b.com" }} />);
    await user.click(screen.getByRole("checkbox", { name: /Set Channel to null/i }));
    expect(screen.getByTestId("value-probe")).toHaveTextContent("null");
    expect(screen.queryByLabelText("Address", { exact: false })).not.toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: /Set Channel to null/i }));
    expect(screen.getByTestId("value-probe")).toHaveTextContent(JSON.stringify({ kind: "email", address: "a@b.com" }));
    expect(screen.getByLabelText("Address", { exact: false })).toHaveValue("a@b.com");
  });

  it("a page loaded with the field already null and no in-session memory materializes the required member's default on uncheck", async () => {
    const user = userEvent.setup();
    render(<NullableVariantHarness initialValue={null} />);
    expect(screen.getByTestId("value-probe")).toHaveTextContent("null");

    await user.click(screen.getByRole("checkbox", { name: /Set Channel to null/i }));
    expect(screen.getByTestId("value-probe")).toHaveTextContent(JSON.stringify({ kind: "email", address: "" }));
    expect(screen.getByLabelText("Address", { exact: false })).toHaveValue("");
  });
});
