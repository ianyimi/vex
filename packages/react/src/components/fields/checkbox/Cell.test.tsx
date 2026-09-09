import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TDocument } from "@vexcms/core";
import { makeCellRow, runFieldCellContractSuite } from "../../../testing/fieldCellContract";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { CheckboxFieldCell } from "./Cell";
import { checkboxFieldFixture } from "./testFixture";

runFieldCellContractSuite({
  fixture: checkboxFieldFixture,
  Component: CheckboxFieldCell,
  // A boolean has no meaningful "longer than N characters" state.
  truncates: false,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("checkbox: own rendering", () => {
      it.each([
        [true, "Yes"],
        [false, "No"],
      ])("renders %s as %s", (value, expected) => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value });
        render(
          <CheckboxFieldCell
            value={value}
            row={row}
            fieldDef={options.fixture.fieldDef}
            fieldKey="field"
            isTitleField={false}
            collection={collection}
          />,
        );
        expect(screen.getByText(expected)).toBeInTheDocument();
      });
    });
  },
});
