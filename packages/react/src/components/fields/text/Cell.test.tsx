import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TDocument } from "@vexcms/core";
import { makeCellRow, runFieldCellContractSuite } from "../../../testing/fieldCellContract";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { TextFieldCell } from "./Cell";
import { textFieldFixture } from "./testFixture";

runFieldCellContractSuite({
  fixture: textFieldFixture,
  Component: TextFieldCell,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("text: non-title rendering", () => {
      it("renders the plain value with no link when isTitleField is false", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: options.fixture.valid });
        const { container } = render(
          <TextFieldCell
            value={options.fixture.valid}
            row={row}
            fieldDef={options.fixture.fieldDef}
            fieldKey="field"
            isTitleField={false}
            collection={collection}
          />,
        );
        expect(container.querySelector("a")).toBeNull();
        expect(container).toHaveTextContent(options.fixture.valid);
      });
    });
  },
});
