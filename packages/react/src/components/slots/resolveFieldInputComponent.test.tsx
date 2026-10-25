import { render } from "@testing-library/react";
import { useForm } from "@tanstack/react-form";
import { describe, expect, it } from "vitest";
import {
  defineCollection,
  text,
  type ComponentOverrideInput,
  type DataFieldType,
  type InputComponentProps,
} from "@vexcms/core";
import type { ReactHKT } from "../../adapter";
import { resolveFieldInputComponent } from "./resolveFieldInputComponent";
import { AppForm } from "../form/AppForm";

const collection = defineCollection({ slug: "posts", fields: { title: text() } });
const baseProps: InputComponentProps = {
  name: "title",
  fieldDef: collection.fields.title,
  readOnly: false,
  collection,
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
): ComponentOverrideInput<ReactHKT, InputComponentProps> {
  return {
    id: name,
    component: (props) => {
      order.push(name);
      const RenderDefault = props.renderDefault;
      return <RenderDefault {...props} />;
    },
  };
}

describe("resolveFieldInputComponent", () => {
  it("returns the built-in when no overrides are configured", () => {
    const Component = resolveFieldInputComponent({
      fieldType: "text",
      rootOverrides: undefined,
      fieldOverrides: undefined,
    });
    renderInForm(<Component {...baseProps} />);
    // TextFieldInput renders a real <input>; this just proves it mounted without throwing.
  });

  it("composes root then field overrides, each wrapping the previous via renderDefault", () => {
    const order: string[] = [];
    const Component = resolveFieldInputComponent({
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
      resolveFieldInputComponent({
        fieldType: unregistered,
        rootOverrides: undefined,
        fieldOverrides: undefined,
      }),
    ).toThrow(/Missing component/);
  });
});
