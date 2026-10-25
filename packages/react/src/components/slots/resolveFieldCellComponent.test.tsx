import { describe, expect, it } from "vitest";
import {
  defineCollection,
  text,
  type AdminDataField,
  type CellComponentProps,
  type ComponentOverrideInput,
  type DataFieldType,
} from "@vexcms/core";
import type { ReactHKT } from "../../adapter";
import { resolveFieldCellComponent } from "./resolveFieldCellComponent";
import { renderWithVexProviders } from "../../testing/harness/accessFixtures";

const collection = defineCollection({ slug: "posts", fields: { title: text() } });
const baseProps: CellComponentProps<AdminDataField> = {
  value: "hello",
  row: { original: { _id: "1", _creationTime: 0 } },
  fieldDef: collection.fields.title,
  fieldKey: "title",
  isTitleField: false,
  collection,
};

function makeOverride(
  name: string,
  order: string[],
): ComponentOverrideInput<ReactHKT, CellComponentProps<AdminDataField>> {
  return {
    id: name,
    component: (props) => {
      order.push(name);
      const RenderDefault = props.renderDefault;
      return <RenderDefault {...props} />;
    },
  };
}

describe("resolveFieldCellComponent", () => {
  it("returns the built-in when no overrides are configured", () => {
    const Component = resolveFieldCellComponent({
      fieldType: "text",
      rootOverrides: undefined,
      fieldOverrides: undefined,
    });
    renderWithVexProviders(<Component {...baseProps} />);
    // TextFieldCell renders the raw value; this just proves it mounted without throwing.
  });

  it("composes root then field overrides, each wrapping the previous via renderDefault", () => {
    const order: string[] = [];
    const Component = resolveFieldCellComponent({
      fieldType: "text",
      rootOverrides: [makeOverride("root", order)],
      fieldOverrides: [makeOverride("field", order)],
    });
    renderWithVexProviders(<Component {...baseProps} />);
    expect(order).toEqual(["field", "root"]);
  });

  it("throws for an unregistered field type", () => {
    const unregistered = "nonexistent" as DataFieldType;
    expect(() =>
      resolveFieldCellComponent({
        fieldType: unregistered,
        rootOverrides: undefined,
        fieldOverrides: undefined,
      }),
    ).toThrow(/Missing component/);
  });
});
