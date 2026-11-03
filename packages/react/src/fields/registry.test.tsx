import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ADMIN_FIELDS, number, type DataFieldType } from "@vexcms/core";
import { fieldToCellComponent, fieldToDisplayComponent } from "./registry";
import { withCellConfig } from "../testing/fieldCellContract";
import { testCollection } from "../testing/harness/accessFixtures";
import { JsonFieldDisplay } from "./json/Display";

describe("fieldToDisplayComponent", () => {
  it("returns the type's registered display component directly, when one is registered", () => {
    expect(fieldToDisplayComponent(ADMIN_FIELDS.json.type)).toBe(JsonFieldDisplay);
  });

  it("falls back to the type's registered Cell, rendered, when no display is registered", () => {
    // `number` registers no `display` (a "may delegate" scalar type) — the
    // fallback must render the SAME output `NumberFieldCell` itself would,
    // not merely resolve to SOME component.
    const Display = fieldToDisplayComponent(ADMIN_FIELDS.number.type);
    expect(Display).toBeDefined();
    expect(Display).not.toBe(fieldToCellComponent(ADMIN_FIELDS.number.type));
    if (!Display) throw new Error("unreachable");

    const document = { _id: "doc_1", _creationTime: 0, price: 42 };
    render(
      withCellConfig(
        <Display
          field={number({ label: "Price" })}
          value={42}
          document={document}
          collection={testCollection}
        />,
      ),
    );
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("never renders the Cell-fallback's title-link branch — isTitleField is always forced false", () => {
    // A `number` Cell wraps its content in a `VexLink` only when
    // `isTitleField` is true; the registry's Cell-fallback adapter must
    // never let that branch fire, since a Display has no "this is the
    // title column" concept of its own.
    const Display = fieldToDisplayComponent(ADMIN_FIELDS.number.type)!;
    const document = { _id: "doc_1", _creationTime: 0, price: 7 };
    const { container } = render(
      withCellConfig(
        <Display field={number({ label: "Price" })} value={7} document={document} collection={testCollection} />,
      ),
    );
    expect(container.querySelector("a")).not.toBeInTheDocument();
  });

  it("resolves SOMETHING for every registered data field type — display or Cell-derived fallback", () => {
    const dataTypes = Object.values(ADMIN_FIELDS)
      .filter((field) => field.kind === "data")
      .map((field) => field.type as DataFieldType);
    for (const type of dataTypes) {
      expect(fieldToDisplayComponent(type), `expected a display for "${type}"`).toBeDefined();
    }
  });
});
