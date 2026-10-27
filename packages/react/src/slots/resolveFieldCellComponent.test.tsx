import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import {
  defineCollection,
  text,
  type AdminDataField,
  type CellComponentProps,
  type ComponentOverrideInput,
  type DataFieldType,
} from "@vexcms/core";
import type { ReactHKT } from "../adapter";
import { resolveFieldCellComponent } from "./resolveFieldCellComponent";
import { renderWithVexProviders } from "../testing/harness/accessFixtures";

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

  it("falls back to the previous stage when a cell override throws, with an inline error naming it", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const Component = resolveFieldCellComponent({
      fieldType: "text",
      rootOverrides: undefined,
      fieldOverrides: [
        {
          id: "acme.cellThrows",
          component: (): never => {
            throw new Error("boom");
          },
        },
      ],
    });
    renderWithVexProviders(<Component {...baseProps} />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("acme.cellThrows");
    expect(alert).toHaveTextContent("boom");
    spy.mockRestore();
  });
});
