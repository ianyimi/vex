import { describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import type { OnUrlUpdateFunction } from "nuqs/adapters/testing";
import { defineCollection, defineConfig, tabs, text } from "@vexcms/core";
import { VexConfigProvider } from "../../config/VexConfigContext";
import { AppForm, type AnyFormApi } from "../../forms";
import { FormTabs } from "./Field";

const testConfig = defineConfig();

const baseCollection = defineCollection({
  slug: "form_tabs_test",
  fields: { title: text({ required: false }) },
});

function renderHarness(props: {
  field: ReturnType<typeof tabs>;
  fieldKey: string;
  isTopLevel: boolean;
  defaultValues: Record<string, unknown>;
  onUrlUpdate?: OnUrlUpdateFunction;
  searchParams?: string;
}) {
  function Harness() {
    const form = useForm({ defaultValues: props.defaultValues });
    return (
      <VexConfigProvider config={testConfig}>
        <AppForm form={form}>
          <FormTabs
            field={props.field}
            fieldKey={props.fieldKey}
            context={{ collection: baseCollection, isTopLevel: props.isTopLevel }}
          />
        </AppForm>
      </VexConfigProvider>
    );
  }
  render(
    <NuqsTestingAdapter hasMemory onUrlUpdate={props.onUrlUpdate} searchParams={props.searchParams}>
      <Harness />
    </NuqsTestingAdapter>,
  );
}

describe("FormTabs", () => {
  it("renders every tab trigger and only the active tab's fields", () => {
    const field = tabs({
      tabs: [
        { label: "General", fields: { title: text({ label: "Title" }) } },
        { label: "Advanced", fields: { slug: text({ label: "Slug" }) } },
      ],
    });
    renderHarness({ field, fieldKey: "info", isTopLevel: false, defaultValues: { title: "", slug: "" } });
    expect(screen.getByRole("tab", { name: "General" })).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.queryByLabelText("Slug")).not.toBeInTheDocument();
  });

  it("selects the first tab with defaultOpen: true, even if it isn't first", () => {
    const field = tabs({
      tabs: [
        { label: "General", fields: { title: text({ label: "Title" }) } },
        { label: "Advanced", defaultOpen: true, fields: { slug: text({ label: "Slug" }) } },
      ],
    });
    renderHarness({ field, fieldKey: "info", isTopLevel: false, defaultValues: { title: "", slug: "" } });
    expect(screen.getByLabelText("Slug")).toBeInTheDocument();
  });

  it("writes the active tab to ?<fieldKey>= when isTopLevel is true", async () => {
    const user = userEvent.setup();
    const onUrlUpdate = vi.fn();
    const field = tabs({
      tabs: [
        { label: "General", fields: { title: text({ label: "Title" }) } },
        { label: "Advanced", fields: { slug: text({ label: "Slug" }) } },
      ],
    });
    renderHarness({
      field,
      fieldKey: "info",
      isTopLevel: true,
      defaultValues: { title: "", slug: "" },
      onUrlUpdate,
    });
    await user.click(screen.getByRole("tab", { name: "Advanced" }));
    expect(onUrlUpdate).toHaveBeenCalled();
    const lastCall = onUrlUpdate.mock.calls[onUrlUpdate.mock.calls.length - 1][0];
    expect(lastCall.searchParams.get("info")).toBe("advanced");
  });

  it("never touches the URL when isTopLevel is false", async () => {
    const user = userEvent.setup();
    const onUrlUpdate = vi.fn();
    const field = tabs({
      tabs: [
        { label: "General", fields: { title: text({ label: "Title" }) } },
        { label: "Advanced", fields: { slug: text({ label: "Slug" }) } },
      ],
    });
    renderHarness({
      field,
      fieldKey: "info",
      isTopLevel: false,
      defaultValues: { title: "", slug: "" },
      onUrlUpdate,
    });
    await user.click(screen.getByRole("tab", { name: "Advanced" }));
    expect(screen.getByLabelText("Slug")).toBeInTheDocument();
    expect(onUrlUpdate).not.toHaveBeenCalled();
  });

  it("renders nothing when every field across every tab is condition-hidden", () => {
    const field = tabs({
      tabs: [
        {
          label: "General",
          fields: { secret: text({ admin: { condition: ({ data }) => typeof data === "object" && data !== null && "enabled" in data && (data as Record<string, unknown>).enabled === true } }) },
        },
      ],
    });
    renderHarness({
      field,
      fieldKey: "info",
      isTopLevel: false,
      defaultValues: { enabled: false, secret: "" },
    });
    expect(screen.queryAllByRole("tab")).toHaveLength(0);
  });

  it("drops a tab while its own admin.condition is unmet and falls back to the first visible tab", () => {
    const field = tabs({
      tabs: [
        { label: "General", fields: { title: text({ label: "Title" }) } },
        {
          label: "Visibility",
          admin: {
            condition: ({ data }) =>
              typeof data === "object" && data !== null && "enabled" in data && data.enabled === true,
          },
          fields: { note: text({ label: "Note" }) },
        },
      ],
    });
    renderHarness({
      field,
      fieldKey: "layout",
      isTopLevel: true,
      searchParams: "?layout=visibility",
      defaultValues: { enabled: false, title: "", note: "" },
    });
    expect(screen.queryByRole("tab", { name: "Visibility" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
  });

  it("the ?<fieldKey>= URL param wins over defaultOpen on initial render, when isTopLevel is true", () => {
    const field = tabs({
      tabs: [
        { label: "General", fields: { title: text({ label: "Title" }) } },
        { label: "Advanced", defaultOpen: true, name: "advanced", fields: { slug: text({ label: "Slug" }) } },
      ],
    });
    renderHarness({
      field,
      fieldKey: "info",
      isTopLevel: true,
      defaultValues: { title: "", slug: "" },
      searchParams: "info=general",
    });
    // URL says "general" even though "advanced" declares defaultOpen: true.
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.queryByLabelText("Slug")).not.toBeInTheDocument();
  });

  it("keeps two nested (isTopLevel: false) tabs() fields' active tab independent via local state", async () => {
    const user = userEvent.setup();
    const fieldA = tabs({
      tabs: [
        { label: "A-General", fields: { aTitle: text({ label: "A Title" }) } },
        { label: "A-Advanced", fields: { aSlug: text({ label: "A Slug" }) } },
      ],
    });
    const fieldB = tabs({
      tabs: [
        { label: "B-General", fields: { bTitle: text({ label: "B Title" }) } },
        { label: "B-Advanced", fields: { bSlug: text({ label: "B Slug" }) } },
      ],
    });
    function Harness() {
      const form = useForm({ defaultValues: { aTitle: "", aSlug: "", bTitle: "", bSlug: "" } });
      return (
        <VexConfigProvider config={testConfig}>
          <AppForm form={form}>
            <FormTabs field={fieldA} fieldKey="a" context={{ collection: baseCollection, isTopLevel: false }} />
            <FormTabs field={fieldB} fieldKey="b" context={{ collection: baseCollection, isTopLevel: false }} />
          </AppForm>
        </VexConfigProvider>
      );
    }
    render(
      <NuqsTestingAdapter hasMemory>
        <Harness />
      </NuqsTestingAdapter>,
    );
    await user.click(screen.getByRole("tab", { name: "A-Advanced" }));
    expect(screen.getByLabelText("A Slug")).toBeInTheDocument();
    // B's own tab state is untouched by A's click.
    expect(screen.getByLabelText("B Title")).toBeInTheDocument();
    expect(screen.queryByLabelText("B Slug")).not.toBeInTheDocument();
  });

  it("shows an error-count badge on a tab trigger whose own (possibly inactive) fields have form errors", () => {
    const field = tabs({
      tabs: [
        { label: "General", fields: { title: text({ label: "Title" }) } },
        { label: "Advanced", fields: { slug: text({ label: "Slug", required: true }) } },
      ],
    });
    let formRef: AnyFormApi | undefined;
    function Harness() {
      const form = useForm({ defaultValues: { title: "", slug: "" } });
      formRef = form as AnyFormApi;
      return (
        <VexConfigProvider config={testConfig}>
          <AppForm form={form}>
            <FormTabs field={field} fieldKey="info" context={{ collection: baseCollection, isTopLevel: false }} />
          </AppForm>
        </VexConfigProvider>
      );
    }
    render(
      <NuqsTestingAdapter hasMemory>
        <Harness />
      </NuqsTestingAdapter>,
    );
    // "Advanced" (holding "slug") is not the active tab — its error badge must
    // still show, proving the count is computed over the tab's own fields,
    // not just the currently-rendered panel.
    act(() => {
      formRef!.setFieldMeta("slug", (prev) => ({
        ...prev,
        errorMap: { ...prev?.errorMap, onSubmit: "Required" },
      }));
    });
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("badges a named tab with the errors stored under its own name", () => {
    const field = tabs({
      tabs: [
        { label: "General", fields: { title: text({ label: "Title" }) } },
        { label: "SEO", name: "seo", fields: { metaTitle: text({ label: "Meta Title", required: true }) } },
      ],
    });
    let formRef: AnyFormApi | undefined;
    function Harness() {
      const form = useForm({ defaultValues: { title: "", seo: { metaTitle: "" } } });
      formRef = form as AnyFormApi;
      return (
        <VexConfigProvider config={testConfig}>
          <AppForm form={form}>
            <FormTabs field={field} fieldKey="info" context={{ collection: baseCollection, isTopLevel: false }} />
          </AppForm>
        </VexConfigProvider>
      );
    }
    render(
      <NuqsTestingAdapter hasMemory>
        <Harness />
      </NuqsTestingAdapter>,
    );
    act(() => {
      formRef!.setFieldMeta("seo.metaTitle", (prev) => ({
        ...prev,
        errorMap: { ...prev?.errorMap, onSubmit: "Required" },
      }));
    });
    expect(screen.getByRole("tab", { name: /SEO/ })).toHaveTextContent("SEO1");
  });
});
