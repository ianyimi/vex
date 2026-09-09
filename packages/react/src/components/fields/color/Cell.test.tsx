import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TDocument } from "@vexcms/core";
import { makeCellRow, runFieldCellContractSuite } from "../../../testing/fieldCellContract";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { ColorFieldCell } from "./Cell";
import { colorFieldFixture } from "./testFixture";

runFieldCellContractSuite({
  fixture: colorFieldFixture,
  Component: ColorFieldCell,
  // A colour swatch has no meaningful "longer than N characters" state.
  truncates: false,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("color: own rendering", () => {
      it("renders a swatch with the value as its background color, plus the raw value as text", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: options.fixture.valid });
        const { container } = render(
          <ColorFieldCell
            value={options.fixture.valid}
            row={row}
            fieldDef={options.fixture.fieldDef}
            fieldKey="field"
            isTitleField={false}
            collection={collection}
          />,
        );
        const swatch = container.querySelector<HTMLElement>('[aria-hidden="true"]');
        expect(swatch?.style.backgroundColor).toBe("rgb(232, 98, 42)"); // #e8622a
        expect(container).toHaveTextContent(options.fixture.valid);
      });

      // An empty string is not a colour, the same practical state as an absent value —
      // strengthened past the base contract's null/undefined case to render the SAME
      // em-dash placeholder rather than silently rendering nothing, so a user sees a
      // consistent signal instead of a blank cell for one falsy variant and a dash for
      // another.
      it("renders the em-dash placeholder for an empty string, same as for null/undefined", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: "" });
        const { container } = render(
          <ColorFieldCell
            value=""
            row={row}
            fieldDef={options.fixture.fieldDef}
            fieldKey="field"
            isTitleField={false}
            collection={collection}
          />,
        );
        expect(container).toHaveTextContent("—");
      });
    });
  },
});
