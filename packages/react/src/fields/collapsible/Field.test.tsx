import { describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { collapsible, defineCollection, defineConfig, text } from "@vexcms/core";
import { VexConfigProvider } from "../../config/VexConfigContext";
import { AppForm, type AnyFormApi } from "../../forms";
import { FormCollapsible } from "./Field";

const testConfig = defineConfig();

const baseCollection = defineCollection({
  slug: "form_collapsible_test",
  fields: { title: text({ required: false }) },
});

function renderHarness(props: {
  field: ReturnType<typeof collapsible>;
  defaultValues: Record<string, unknown>;
}) {
  const formRef: { current: AnyFormApi | undefined } = { current: undefined };
  function Harness() {
    const form = useForm({ defaultValues: props.defaultValues });
    formRef.current = form as AnyFormApi;
    return (
      <VexConfigProvider config={testConfig}>
        <AppForm form={form}>
          <FormCollapsible field={props.field} fieldKey="section" context={{ collection: baseCollection }} />
        </AppForm>
      </VexConfigProvider>
    );
  }
  render(<Harness />);
  return { form: () => formRef.current! };
}

describe("FormCollapsible", () => {
  it("starts open and shows the label and every sub-field, by default", () => {
    const field = collapsible({ label: "Details", fields: { title: text({ label: "Title" }) } });
    renderHarness({ field, defaultValues: { title: "" } });
    expect(screen.getByText("Details")).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
  });

  it("starts closed when admin.defaultCollapsed is true", () => {
    const field = collapsible({
      label: "Details",
      admin: { defaultCollapsed: true },
      fields: { title: text({ label: "Title" }) },
    });
    renderHarness({ field, defaultValues: { title: "" } });
    expect(screen.queryByLabelText("Title")).not.toBeInTheDocument();
  });

  it("opens on trigger click, revealing its sub-field", async () => {
    const user = userEvent.setup();
    const field = collapsible({
      label: "Details",
      admin: { defaultCollapsed: true },
      fields: { title: text({ label: "Title" }) },
    });
    renderHarness({ field, defaultValues: { title: "" } });
    await user.click(screen.getByText("Details"));
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
  });

  it("shows an error-count badge while collapsed", () => {
    const field = collapsible({
      label: "Details",
      admin: { defaultCollapsed: true },
      fields: { title: text({ label: "Title" }) },
    });
    const { form } = renderHarness({ field, defaultValues: { title: "" } });
    act(() => {
      form().setFieldMeta("title", (prev) => ({
        ...prev,
        errorMap: { ...prev?.errorMap, onSubmit: "Required" },
      }));
    });
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("keeps a collapsed section's fields mounted, hidden, while one has an error", () => {
    const field = collapsible({
      label: "Details",
      admin: { defaultCollapsed: true },
      fields: { title: text({ label: "Title" }) },
    });
    const { form } = renderHarness({ field, defaultValues: { title: "" } });
    expect(screen.queryByLabelText("Title")).not.toBeInTheDocument();
    act(() => {
      form().setFieldMeta("title", (prev) => ({
        ...prev,
        errorMap: { ...prev?.errorMap, onSubmit: "Required" },
      }));
    });
    expect(screen.getByLabelText("Title")).not.toBeVisible();
  });

  it("hides the error-count badge once opened", async () => {
    const user = userEvent.setup();
    const field = collapsible({
      label: "Details",
      admin: { defaultCollapsed: true },
      fields: { title: text({ label: "Title" }) },
    });
    const { form } = renderHarness({ field, defaultValues: { title: "" } });
    act(() => {
      form().setFieldMeta("title", (prev) => ({
        ...prev,
        errorMap: { ...prev?.errorMap, onSubmit: "Required" },
      }));
    });
    expect(screen.getByText("1")).toBeInTheDocument();
    await user.click(screen.getByText("Details"));
    expect(screen.queryByText("1")).not.toBeInTheDocument();
  });

  it("renders nothing (not even its label) when every sub-field is condition-hidden", () => {
    const field = collapsible({
      label: "Details",
      fields: { secret: text({ admin: { condition: ({ data }) => typeof data === "object" && data !== null && "enabled" in data && (data as Record<string, unknown>).enabled === true } }) },
    });
    renderHarness({ field, defaultValues: { enabled: false, secret: "" } });
    expect(screen.queryByText("Details")).not.toBeInTheDocument();
  });
});
