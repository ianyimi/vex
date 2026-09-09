import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TDocument } from "@vexcms/core";
import { makeCellRow, runFieldCellContractSuite } from "../../../testing/fieldCellContract";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { ArrayFieldCell } from "./Cell";
import { arrayFieldFixture } from "./testFixture";

runFieldCellContractSuite({
  fixture: arrayFieldFixture,
  Component: ArrayFieldCell,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("array: own rendering", () => {
      it("renders the item count with fieldDef.labels.singular and a descriptive title", () => {
        // `array()` defaults `labels` to `{ singular: "Item", plural: "Items" }`
        // (`packages/core/src/fields/array/config.ts`) whenever the caller doesn't
        // override it, as `arrayFieldFixture` doesn't — so the bare "item"/"items"
        // fallback in `ArrayFieldCell` (reached only when `fieldDef.labels` is
        // falsy) is unreachable through the public `array()` builder.
        const single = [options.fixture.valid[0]!];
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: single });
        const { container } = render(
          <ArrayFieldCell
            value={single}
            row={row}
            fieldDef={options.fixture.fieldDef}
            fieldKey="field"
            isTitleField={false}
            collection={collection}
          />,
        );
        expect(container).toHaveTextContent(`1 ${options.fixture.fieldDef.labels!.singular}`);
        expect(container.firstElementChild?.getAttribute("title")).toBe(single.join(", "));
      });

      it("uses fieldDef.labels.plural for more than one entry", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: options.fixture.valid });
        const { container } = render(
          <ArrayFieldCell
            value={options.fixture.valid}
            row={row}
            fieldDef={options.fixture.fieldDef}
            fieldKey="field"
            isTitleField={false}
            collection={collection}
          />,
        );
        expect(container).toHaveTextContent(
          `${options.fixture.valid.length} ${options.fixture.fieldDef.labels!.plural}`,
        );
      });
    });
  },
});
