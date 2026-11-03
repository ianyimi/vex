import { render, screen } from "@testing-library/react";
import { useForm } from "@tanstack/react-form";
import { describe, expect, it, vi } from "vitest";
import type { ComponentType } from "react";
import {
  defineCollection,
  text,
  type ComponentOverrideInput,
  type DataFieldType,
  type FieldComponentProps,
} from "@vexcms/core";
import type { ReactHKT } from "../adapter";
import { resolveFieldComponent } from "./resolveFieldComponent";
import { AppForm } from "../forms";

const collection = defineCollection({ slug: "posts", fields: { title: text() } });
const noopRenderDefault: ComponentType<FieldComponentProps> = () => null;
const baseProps: FieldComponentProps = {
  name: "title",
  fieldDef: collection.fields.title,
  readOnly: false,
  collection,
  renderDefault: noopRenderDefault,
};

function renderInForm(ui: React.ReactElement) {
  function Wrapper() {
    const form = useForm({ defaultValues: { title: "" } });
    return <AppForm form={form}>{ui}</AppForm>;
  }
  return render(<Wrapper />);
}

function makeOverride(
  name: string,
  order: string[],
): ComponentOverrideInput<ReactHKT, FieldComponentProps> {
  return {
    id: name,
    component: (props) => {
      order.push(name);
      const RenderDefault = props.renderDefault;
      return <RenderDefault {...props} />;
    },
  };
}

describe("resolveFieldComponent", () => {
  it("returns the built-in when no overrides are configured", () => {
    const Component = resolveFieldComponent({
      fieldType: "text",
      rootOverrides: undefined,
      fieldOverrides: undefined,
    });
    renderInForm(<Component {...baseProps} />);
    // TextFieldAdmin renders a real <input>; this just proves it mounted without throwing.
  });

  it("composes root then field overrides, each wrapping the previous via renderDefault", () => {
    const order: string[] = [];
    const Component = resolveFieldComponent({
      fieldType: "text",
      rootOverrides: [makeOverride("root", order)],
      fieldOverrides: [makeOverride("field", order)],
    });
    renderInForm(<Component {...baseProps} />);
    expect(order).toEqual(["field", "root"]);
  });

  it("throws for an unregistered field type", () => {
    const unregistered = "nonexistent" as DataFieldType;
    expect(() =>
      resolveFieldComponent({
        fieldType: unregistered,
        rootOverrides: undefined,
        fieldOverrides: undefined,
      }),
    ).toThrow(/Missing component/);
  });

  it("falls back to the previous stage when a field override throws, with an inline error naming it", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const Component = resolveFieldComponent({
      fieldType: "text",
      rootOverrides: undefined,
      fieldOverrides: [
        {
          id: "acme.fieldThrows",
          component: (): never => {
            throw new Error("boom");
          },
        },
      ],
    });
    const { container } = renderInForm(<Component {...baseProps} />);
    expect(container.querySelector("input")).toBeInTheDocument();
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("acme.fieldThrows");
    expect(alert).toHaveTextContent("boom");
    spy.mockRestore();
  });
});
