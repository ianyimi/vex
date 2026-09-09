import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TDocument } from "@vexcms/core";
import { makeCellRow, runFieldCellContractSuite } from "../../../testing/fieldCellContract";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { NumberFieldCell } from "./Cell";
import { numberFieldFixture } from "./testFixture";

runFieldCellContractSuite({
  fixture: numberFieldFixture,
  Component: NumberFieldCell,
  // A number has no meaningful "longer than N characters" state.
  truncates: false,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("number: own rendering", () => {
      it("renders the raw numeric value", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: options.fixture.valid });
        render(
          <NumberFieldCell
            value={options.fixture.valid}
            row={row}
            fieldDef={options.fixture.fieldDef}
            fieldKey="field"
            isTitleField={false}
            collection={collection}
          />,
        );
        expect(screen.getByText(String(options.fixture.valid))).toBeInTheDocument();
      });

      // `0` is falsy but NOT null/undefined — the base contract's placeholder
      // assertion only exercises null/undefined, and `NumberFieldCell` has no `!value`
      // guard at all, so this is a distinct, real boundary: a genuine zero quantity
      // renders as "0", not as the em-dash placeholder.
      it("renders 0 as the text \"0\", not the em-dash placeholder", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: 0 });
        const { container } = render(
          <NumberFieldCell
            value={0}
            row={row}
            fieldDef={options.fixture.fieldDef}
            fieldKey="field"
            isTitleField={false}
            collection={collection}
          />,
        );
        expect(container).toHaveTextContent("0");
        expect(container).not.toHaveTextContent("—");
      });
    });
  },
});
