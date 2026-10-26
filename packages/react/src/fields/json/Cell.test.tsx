import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TDocument } from "@vexcms/core";
import { makeCellRow, runFieldCellContractSuite, withCellConfig } from "../../testing/fieldCellContract";
import { testCollection } from "../../testing/harness/accessFixtures";
import { JsonFieldCell } from "./Cell";
import { jsonFieldFixture } from "./testFixture";

runFieldCellContractSuite({
  fixture: jsonFieldFixture,
  Component: JsonFieldCell,
  truncates: false,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("json: truncated preview", () => {
      it("truncates a long JSON.stringify preview at 80 characters and keeps the full value on title", () => {
        const longValue = { items: Array.from({ length: 20 }, (_, i) => `item-${i}`) };
        const serialized = JSON.stringify(longValue);
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: longValue });
        const { container } = render(
          withCellConfig(
            <JsonFieldCell
              value={longValue}
              row={row}
              fieldDef={options.fixture.fieldDef}
              fieldKey="field"
              isTitleField={false}
              collection={collection}
            />,
          ),
        );
        const titled = container.querySelector("[title]");
        expect(titled?.getAttribute("title")).toBe(serialized);
        expect(titled?.textContent).toBe(`${serialized.slice(0, 80)}...`);
      });

      it("shows the full JSON.stringify value untruncated when under 80 characters", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: { a: 1 } });
        const { container } = render(
          withCellConfig(
            <JsonFieldCell
              value={{ a: 1 }}
              row={row}
              fieldDef={options.fixture.fieldDef}
              fieldKey="field"
              isTitleField={false}
              collection={collection}
            />,
          ),
        );
        expect(container).toHaveTextContent('{"a":1}');
      });
    });
  },
});
