import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import {
  collapsible,
  defineCollection,
  defineConfig,
  getDataFields,
  row,
  tabs,
  text,
  ui,
  type AdminField,
  type CollectionConfig,
} from "@vexcms/core";
import { VexConfigProvider } from "../config/VexConfigContext";
import { AppForm } from "../forms";
import { dataFieldNames, RenderFields } from "./RenderFields";

const testConfig = defineConfig();

const baseCollection = defineCollection({
  slug: "render_fields_test",
  fields: { title: text({ required: false }) },
});

/**
 * Mounts `RenderFields` behind a real `useForm` + `<AppForm>`, wrapped in a
 * `NuqsTestingAdapter` — `FormTabs` calls `useQueryState` unconditionally
 * (even when it keeps local state), so it throws without one.
 */
function Harness(props: {
  fields: Record<string, AdminField>;
  collection?: CollectionConfig;
  initialValues?: Record<string, unknown>;
  readOnly?: boolean;
  region?: "main" | "sidebar" | "all";
  fieldKeys?: readonly string[];
  isTopLevel?: boolean;
}) {
  const form = useForm({ defaultValues: props.initialValues ?? {} });
  return (
    <VexConfigProvider config={testConfig}>
      <NuqsTestingAdapter hasMemory>
        <AppForm form={form}>
          <RenderFields
            fields={props.fields}
            collection={props.collection ?? baseCollection}
            readOnly={props.readOnly}
            region={props.region}
            fieldKeys={props.fieldKeys}
            isTopLevel={props.isTopLevel}
          />
        </AppForm>
      </NuqsTestingAdapter>
    </VexConfigProvider>
  );
}

describe("RenderFields", () => {
  it("renders one input per field, bound to the field key", () => {
    render(
      <Harness
        fields={{
          title: text({ label: "Title" }),
          slug: text({ label: "Slug" }),
        }}
        initialValues={{ title: "Hello", slug: "hello" }}
      />,
    );
    expect(screen.getByLabelText("Title")).toHaveValue("Hello");
    expect(screen.getByLabelText("Slug")).toHaveValue("hello");
  });

  it("dot-joins a namePrefix onto every rendered field's form name", () => {
    function PrefixHarness() {
      const form = useForm({ defaultValues: { seo: { title: "Hi" } } });
      return (
        <VexConfigProvider config={testConfig}>
          <NuqsTestingAdapter>
            <AppForm form={form}>
              <RenderFields
                fields={{ title: text({ label: "Title" }) }}
                collection={baseCollection}
                namePrefix="seo"
              />
            </AppForm>
          </NuqsTestingAdapter>
        </VexConfigProvider>
      );
    }
    render(<PrefixHarness />);
    expect(screen.getByLabelText("Title")).toHaveValue("Hi");
  });

  it("excludes an admin.hidden field entirely", () => {
    render(
      <Harness
        fields={{
          title: text({ label: "Title" }),
          secret: text({ label: "Secret", admin: { hidden: true } }),
        }}
      />,
    );
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.queryByLabelText("Secret")).not.toBeInTheDocument();
  });

  it("restricts rendering to the given fieldKeys subset", () => {
    render(
      <Harness
        fields={{
          title: text({ label: "Title" }),
          slug: text({ label: "Slug" }),
        }}
        fieldKeys={["title"]}
      />,
    );
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.queryByLabelText("Slug")).not.toBeInTheDocument();
  });

  it("OR's the readOnly prop onto every field's own admin.readOnly", () => {
    render(<Harness fields={{ title: text({ label: "Title" }) }} readOnly />);
    expect(screen.getByLabelText("Title")).toBeDisabled();
  });

  it("renders nothing when every field is filtered out", () => {
    const { container } = render(
      <Harness
        fields={{ title: text({ label: "Title", admin: { hidden: true } }) }}
      />,
    );
    expect(container.querySelector("form")).toBeEmptyDOMElement();
  });

  it("renders admin.components.Label/Description overrides alongside the field", () => {
    render(
      <Harness
        fields={{
          title: text({
            label: "Title",
            admin: {
              components: {
                Label: [{ id: "test.label", component: () => <div data-testid="label-override" /> }],
                Description: [
                  { id: "test.description", component: () => <div data-testid="description-override" /> },
                ],
              },
            },
          }),
        }}
      />,
    );
    expect(screen.getByTestId("label-override")).toBeInTheDocument();
    expect(screen.getByTestId("description-override")).toBeInTheDocument();
  });

  it("partitions top-level fields into main/sidebar by admin.position, only when isTopLevel is set", () => {
    const fields = {
      title: text({ label: "Title" }),
      summary: text({ label: "Summary", admin: { position: "sidebar" } }),
    };
    const { rerender } = render(
      <Harness
        fields={fields}
        region="main"
        isTopLevel
        initialValues={{ title: "", summary: "" }}
      />,
    );
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.queryByLabelText("Summary")).not.toBeInTheDocument();

    rerender(
      <Harness
        fields={fields}
        region="sidebar"
        isTopLevel
        initialValues={{ title: "", summary: "" }}
      />,
    );
    expect(screen.queryByLabelText("Title")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Summary")).toBeInTheDocument();
  });

  it("defaults region to 'all' when omitted, rendering every field even with isTopLevel set", () => {
    const fields = {
      title: text({ label: "Title" }),
      summary: text({ label: "Summary", admin: { position: "sidebar" } }),
    };
    render(
      <Harness fields={fields} isTopLevel initialValues={{ title: "", summary: "" }} />,
    );
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.getByLabelText("Summary")).toBeInTheDocument();
  });

  it("ignores region when isTopLevel is not set (nested call)", () => {
    const fields = {
      title: text({ label: "Title" }),
      summary: text({ label: "Summary", admin: { position: "sidebar" } }),
    };
    render(
      <Harness
        fields={fields}
        region="main"
        initialValues={{ title: "", summary: "" }}
      />,
    );
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.getByLabelText("Summary")).toBeInTheDocument();
  });

  it("sets the --field-width CSS var from admin.width", () => {
    render(
      <Harness
        fields={{ title: text({ label: "Title", admin: { width: "30%" } }) }}
      />,
    );
    const input = screen.getByLabelText("Title");
    const wrapper = input.closest("div[style]");
    expect(wrapper).not.toBeNull();
    expect(
      (wrapper as HTMLElement).style.getPropertyValue("--field-width"),
    ).toBe("calc(30% - 1rem * 0.7)");
  });

  it("renders a tabs() field via FormTabs, switching tabs on click", async () => {
    const user = userEvent.setup();
    const fields = {
      info: tabs({
        tabs: [
          { label: "General", fields: { title: text({ label: "Title" }) } },
          { label: "Advanced", fields: { slug: text({ label: "Slug" }) } },
        ],
      }),
    };
    render(
      <Harness
        fields={fields}
        isTopLevel
        initialValues={{ title: "", slug: "" }}
      />,
    );
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.queryByLabelText("Slug")).not.toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Advanced" }));
    await waitFor(() => expect(screen.queryByLabelText("Title")).not.toBeInTheDocument());
    expect(screen.getByLabelText("Slug")).toBeInTheDocument();
  });

  it("renders a collapsible() field via FormCollapsible, open by default", () => {
    const fields = {
      details: collapsible({ label: "Details", fields: { title: text({ label: "Title" }) } }),
    };
    render(<Harness fields={fields} initialValues={{ title: "" }} />);
    expect(screen.getByText("Details")).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
  });

  it("starts a collapsible() with admin.defaultCollapsed closed, hiding its field", () => {
    const fields = {
      details: collapsible({
        label: "Details",
        admin: { defaultCollapsed: true },
        fields: { title: text({ label: "Title" }) },
      }),
    };
    render(<Harness fields={fields} initialValues={{ title: "" }} />);
    expect(screen.queryByLabelText("Title")).not.toBeInTheDocument();
  });

  it("renders a row() field via FormRow", () => {
    const fields = {
      name: row({
        fields: {
          title: text({ label: "Title" }),
          slug: text({ label: "Slug" }),
        },
      }),
    };
    render(<Harness fields={fields} initialValues={{ title: "", slug: "" }} />);
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.getByLabelText("Slug")).toBeInTheDocument();
  });

  it("hides and reactively shows a field whose admin.condition depends on a sibling", async () => {
    const user = userEvent.setup();
    function ConditionHarness() {
      const form = useForm({ defaultValues: { enabled: false, secret: "" } });
      return (
        <VexConfigProvider config={testConfig}>
          <NuqsTestingAdapter hasMemory>
            <AppForm form={form}>
              <RenderFields
                fields={{
                  secret: text({
                    label: "Secret",
                    admin: { condition: ({ data }) => typeof data === "object" && data !== null && "enabled" in data && (data as Record<string, unknown>).enabled === true },
                  }),
                }}
                collection={baseCollection}
              />
              <button
                type="button"
                onClick={() => form.setFieldValue("enabled", true)}
              >
                Enable
              </button>
            </AppForm>
          </NuqsTestingAdapter>
        </VexConfigProvider>
      );
    }
    render(<ConditionHarness />);
    expect(screen.queryByLabelText("Secret")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Enable" }));
    expect(screen.getByLabelText("Secret")).toBeInTheDocument();
  });

  it("prefixes a named tab's fields with the tab's own name, dot-joined onto the form field name, so typing updates data.seo.metaTitle", async () => {
    const user = userEvent.setup();
    function NamedTabHarness() {
      const form = useForm({ defaultValues: { seo: { metaTitle: "" } } });
      return (
        <VexConfigProvider config={testConfig}>
          <NuqsTestingAdapter hasMemory>
            <AppForm form={form}>
              <RenderFields
                fields={{
                  info: tabs({
                    tabs: [
                      { label: "SEO", name: "seo", fields: { metaTitle: text({ label: "Meta Title" }) } },
                    ],
                  }),
                }}
                collection={baseCollection}
                isTopLevel
              />
              <form.Subscribe selector={(state) => state.values}>
                {(values) => <output data-testid="probe">{JSON.stringify(values)}</output>}
              </form.Subscribe>
            </AppForm>
          </NuqsTestingAdapter>
        </VexConfigProvider>
      );
    }
    render(<NamedTabHarness />);
    await user.type(screen.getByLabelText("Meta Title"), "Hi");
    expect(screen.getByTestId("probe")).toHaveTextContent(
      JSON.stringify({ seo: { metaTitle: "Hi" } }),
    );
  });

  it("dot-joins an outer namePrefix (simulating an array item path) onto a named tab's own prefix", async () => {
    const user = userEvent.setup();
    function PrefixHarness() {
      const form = useForm({ defaultValues: { layout: [{ seo: { metaTitle: "" } }] } });
      return (
        <VexConfigProvider config={testConfig}>
          <NuqsTestingAdapter hasMemory>
            <AppForm form={form}>
              <RenderFields
                fields={{
                  info: tabs({
                    tabs: [
                      { label: "SEO", name: "seo", fields: { metaTitle: text({ label: "Meta Title" }) } },
                    ],
                  }),
                }}
                collection={baseCollection}
                namePrefix="layout[0]"
              />
              <form.Subscribe selector={(state) => state.values}>
                {(values) => <output data-testid="probe">{JSON.stringify(values)}</output>}
              </form.Subscribe>
            </AppForm>
          </NuqsTestingAdapter>
        </VexConfigProvider>
      );
    }
    render(<PrefixHarness />);
    await user.type(screen.getByLabelText("Meta Title"), "Hi");
    expect(screen.getByTestId("probe")).toHaveTextContent(
      JSON.stringify({ layout: [{ seo: { metaTitle: "Hi" } }] }),
    );
  });

  it("hides a row() container nested inside an array/block item based on that item's own siblingData", async () => {
    const user = userEvent.setup();
    function ItemConditionHarness() {
      const form = useForm({
        defaultValues: { layout: [{ enabled: false, secret: "" }] },
      });
      return (
        <VexConfigProvider config={testConfig}>
          <NuqsTestingAdapter hasMemory>
            <AppForm form={form}>
              <RenderFields
                fields={{
                  extra: row({
                    fields: {
                      secret: text({
                        label: "Secret",
                        admin: {
                          condition: ({ siblingData }) =>
                            typeof siblingData === "object" &&
                            siblingData !== null &&
                            "enabled" in siblingData &&
                            (siblingData as Record<string, unknown>).enabled === true,
                        },
                      }),
                    },
                  }),
                }}
                collection={baseCollection}
                namePrefix="layout[0]"
              />
              <button
                type="button"
                onClick={() => form.setFieldValue("layout[0].enabled", true)}
              >
                Enable
              </button>
            </AppForm>
          </NuqsTestingAdapter>
        </VexConfigProvider>
      );
    }
    render(<ItemConditionHarness />);
    expect(screen.queryByLabelText("Secret")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Enable" }));
    expect(screen.getByLabelText("Secret")).toBeInTheDocument();
  });

  it("renders an unnamed container's hoisted fields and a named tab's fields under getDataFields keys", async () => {
    const user = userEvent.setup();
    const fields = {
      layout: tabs({
        tabs: [
          { label: "General", fields: { displayName: text({ label: "Display Name" }) } },
          { label: "SEO", name: "seo", fields: { metaTitle: text({ label: "Meta Title" }) } },
        ],
      }),
      pricing: row({ fields: { priceLabel: text({ label: "Price Label" }) } }),
    };
    render(
      <Harness
        fields={fields}
        fieldKeys={Object.keys(getDataFields({ fields }))}
        initialValues={{ displayName: "", seo: { metaTitle: "" }, priceLabel: "" }}
      />,
    );
    expect(screen.getByLabelText("Display Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Price Label")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "SEO" }));
    expect(screen.getByLabelText("Meta Title")).toBeInTheDocument();
  });

  it("drops a container whose fields fall outside fieldKeys", () => {
    render(
      <Harness
        fields={{
          title: text({ label: "Title" }),
          pricing: collapsible({ label: "Pricing", fields: { price: text({ label: "Price" }) } }),
        }}
        fieldKeys={["title"]}
      />,
    );
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.queryByText("Pricing")).not.toBeInTheDocument();
  });

  it("hides an admin.hidden container together with its fields", () => {
    render(
      <Harness
        fields={{
          title: text({ label: "Title" }),
          legacy: row({ fields: { flag: text({ label: "Flag" }) }, admin: { hidden: true } }),
        }}
        initialValues={{ title: "", flag: "" }}
      />,
    );
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.queryByLabelText("Flag")).not.toBeInTheDocument();
  });

  it("renders a container's fields read-only under its own admin.readOnly", () => {
    render(
      <Harness
        fields={{
          archive: collapsible({
            label: "Archive",
            fields: { archiveId: text({ label: "Archive Id" }) },
            admin: { readOnly: true },
          }),
        }}
        initialValues={{ archiveId: "" }}
      />,
    );
    expect(screen.getByLabelText("Archive Id")).toBeDisabled();
  });

  it("places a ui() field with admin.position sidebar in the sidebar region", () => {
    const fields = {
      title: text({ label: "Title" }),
      wordCount: ui({
        admin: { position: "sidebar", components: { Field: () => <p>Word count widget</p> } },
      }),
    };
    const { rerender } = render(
      <Harness fields={fields} region="main" isTopLevel initialValues={{ title: "" }} />,
    );
    expect(screen.queryByText("Word count widget")).not.toBeInTheDocument();
    rerender(<Harness fields={fields} region="sidebar" isTopLevel initialValues={{ title: "" }} />);
    expect(screen.getByText("Word count widget")).toBeInTheDocument();
  });
});

describe("dataFieldNames", () => {
  it("dot-joins a namePrefix onto every collected name", () => {
    const fields = { name: row({ fields: { title: text(), slug: text() } }) };
    const names = dataFieldNames({ fields, namePrefix: "seo" });
    expect(names.sort()).toEqual(["seo.slug", "seo.title"]);
  });
});
