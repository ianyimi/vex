import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { arrayItemLabel, arrayPluralLabel, type TDocument } from "@vexcms/core";
import { makeCellRow, runFieldCellContractSuite, withCellConfig } from "../../../testing/fieldCellContract";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { ArrayFieldCell } from "./Cell";
import { arrayFieldFixture } from "./testFixture";

runFieldCellContractSuite({
  fixture: arrayFieldFixture,
  Component: ArrayFieldCell,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("array: own rendering", () => {
      it("renders the item count with the items field's singular label and a descriptive title", () => {
        const single = [options.fixture.valid[0]!];
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: single });
        const { container } = render(
          withCellConfig(
            <ArrayFieldCell
              value={single}
              row={row}
              fieldDef={options.fixture.fieldDef}
              fieldKey="field"
              isTitleField={false}
              collection={collection}
            />,
          ),
        );
        expect(container).toHaveTextContent(`1 ${arrayItemLabel(options.fixture.fieldDef)}`);
        expect(container.firstElementChild?.getAttribute("title")).toBe(single.join(", "));
      });

      it("uses the array's own label as the plural for more than one entry", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: options.fixture.valid });
        const { container } = render(
          withCellConfig(
            <ArrayFieldCell
              value={options.fixture.valid}
              row={row}
              fieldDef={options.fixture.fieldDef}
              fieldKey="field"
              isTitleField={false}
              collection={collection}
            />,
          ),
        );
        expect(container).toHaveTextContent(
          `${options.fixture.valid.length} ${arrayPluralLabel(options.fixture.fieldDef)}`,
        );
      });
    });
  },
});
