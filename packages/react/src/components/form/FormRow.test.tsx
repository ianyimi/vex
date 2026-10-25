import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { useForm } from "@tanstack/react-form";
import { defineCollection, defineConfig, row, text } from "@vexcms/core";
import { VexConfigProvider } from "../../context/VexConfigContext";
import { AppForm } from "./AppForm";
import { FormRow } from "./FormRow";

const testConfig = defineConfig();

const baseCollection = defineCollection({
  slug: "form_row_test",
  fields: { title: text({ required: false }) },
});

function renderHarness(props: { field: ReturnType<typeof row>; defaultValues: Record<string, unknown> }) {
  function Harness() {
    const form = useForm({ defaultValues: props.defaultValues });
    return (
      <VexConfigProvider config={testConfig}>
        <AppForm form={form}>
          <FormRow field={props.field} fieldKey="layout" context={{ collection: baseCollection }} />
        </AppForm>
      </VexConfigProvider>
    );
  }
  render(<Harness />);
}

describe("FormRow", () => {
  it("renders every child field", () => {
    const field = row({ fields: { title: text({ label: "Title" }), slug: text({ label: "Slug" }) } });
    renderHarness({ field, defaultValues: { title: "", slug: "" } });
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.getByLabelText("Slug")).toBeInTheDocument();
  });

  it("keeps each child's own % width when they sum to 100", () => {
    const field = row({
      fields: {
        title: text({ label: "Title", admin: { width: "30%" } }),
        slug: text({ label: "Slug", admin: { width: "70%" } }),
      },
    });
    renderHarness({ field, defaultValues: { title: "", slug: "" } });
    const titleWrapper = screen.getByLabelText("Title").closest("div[style]") as HTMLElement;
    const slugWrapper = screen.getByLabelText("Slug").closest("div[style]") as HTMLElement;
    expect(titleWrapper.style.getPropertyValue("--field-width")).toBe("calc(30% - 1rem * 0.7)");
    expect(slugWrapper.style.getPropertyValue("--field-width")).toBe("calc(70% - 1rem * 0.3)");
  });

  it("falls back to an equal share when the children's widths do not sum to 100", () => {
    const field = row({
      fields: {
        title: text({ label: "Title", admin: { width: "30%" } }),
        slug: text({ label: "Slug", admin: { width: "30%" } }),
      },
    });
    renderHarness({ field, defaultValues: { title: "", slug: "" } });
    const titleWrapper = screen.getByLabelText("Title").closest("div[style]") as HTMLElement;
    const slugWrapper = screen.getByLabelText("Slug").closest("div[style]") as HTMLElement;
    expect(titleWrapper.style.getPropertyValue("--field-width")).toBe("calc(50% - 1rem * 0.5)");
    expect(slugWrapper.style.getPropertyValue("--field-width")).toBe("calc(50% - 1rem * 0.5)");
  });

  it("renders nothing (not even its own wrapper) when every child field is condition-hidden", () => {
    const field = row({
      fields: {
        secret: text({
          label: "Secret",
          admin: { condition: ({ data }) => typeof data === "object" && data !== null && "enabled" in data && (data as Record<string, unknown>).enabled === true },
        }),
      },
    });
    function Harness() {
      const form = useForm({ defaultValues: { enabled: false, secret: "" } });
      return (
        <AppForm form={form}>
          <FormRow field={field} fieldKey="layout" context={{ collection: baseCollection }} />
        </AppForm>
      );
    }
    const { container } = render(<Harness />);
    expect(container.querySelector("form")).toBeEmptyDOMElement();
  });

  it("renders nothing while its own admin.condition is unmet, even with visible children", () => {
    const field = row({
      fields: { note: text({ label: "Note" }) },
      admin: {
        condition: ({ data }) =>
          typeof data === "object" && data !== null && "enabled" in data && data.enabled === true,
      },
    });
    function Harness() {
      const form = useForm({ defaultValues: { enabled: false, note: "" } });
      return (
        <VexConfigProvider config={testConfig}>
          <AppForm form={form}>
            <FormRow field={field} fieldKey="layout" context={{ collection: baseCollection }} />
          </AppForm>
        </VexConfigProvider>
      );
    }
    render(<Harness />);
    expect(screen.queryByLabelText("Note")).not.toBeInTheDocument();
  });
});
