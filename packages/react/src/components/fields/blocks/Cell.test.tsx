import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TDocument } from "@vexcms/core";
import { makeCellRow, runFieldCellContractSuite } from "../../../testing/fieldCellContract";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { BlocksFieldCell } from "./Cell";
import { blocksFieldFixture } from "./testFixture";

runFieldCellContractSuite({
  fixture: blocksFieldFixture,
  Component: BlocksFieldCell,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("blocks: own rendering", () => {
      it("renders the singular label for exactly one block", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: options.fixture.valid });
        render(
          <BlocksFieldCell
            value={options.fixture.valid}
            row={row}
            fieldDef={options.fixture.fieldDef}
            fieldKey="field"
            isTitleField={false}
            collection={collection}
          />,
        );
        expect(screen.getByText(`1 ${options.fixture.fieldDef.labels.singular}`)).toBeInTheDocument();
      });

      it("renders the plural label for more than one block", () => {
        const twoBlocks = [...options.fixture.valid, ...options.fixture.valid];
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: twoBlocks });
        render(
          <BlocksFieldCell
            value={twoBlocks}
            row={row}
            fieldDef={options.fixture.fieldDef}
            fieldKey="field"
            isTitleField={false}
            collection={collection}
          />,
        );
        expect(screen.getByText(`2 ${options.fixture.fieldDef.labels.plural}`)).toBeInTheDocument();
      });
    });
  },
});
