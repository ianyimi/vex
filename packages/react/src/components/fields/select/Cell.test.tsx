import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TDocument } from "@vexcms/core";
import { makeCellRow, runFieldCellContractSuite } from "../../../testing/fieldCellContract";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { SelectFieldCell } from "./Cell";
import { selectFieldFixture } from "./testFixture";

runFieldCellContractSuite({
  fixture: selectFieldFixture,
  Component: SelectFieldCell,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("select: own rendering", () => {
      it("renders a Badge per selected option, using each option's label", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: options.fixture.valid });
        render(
          <SelectFieldCell
            value={options.fixture.valid}
            row={row}
            fieldDef={options.fixture.fieldDef}
            fieldKey="field"
            isTitleField={false}
            collection={collection}
          />,
        );
        expect(screen.getByText("Draft")).toBeInTheDocument();
        expect(screen.getByText("Published")).toBeInTheDocument();
      });

      it("omits a stored value that is no longer one of fieldDef.options", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: ["retired"] });
        const { container } = render(
          <SelectFieldCell
            value={["retired"]}
            row={row}
            fieldDef={options.fixture.fieldDef}
            fieldKey="field"
            isTitleField={false}
            collection={collection}
          />,
        );
        expect(container.textContent).toBe("");
      });
    });
  },
});
