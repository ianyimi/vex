import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import type { TDocument } from "@vexcms/core";
import { makeCellRow, runFieldCellContractSuite } from "../../../testing/fieldCellContract";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { DateFieldCell } from "./Cell";
import { dateFieldFixture } from "./testFixture";

runFieldCellContractSuite({
  fixture: dateFieldFixture,
  Component: DateFieldCell,
  // A fixed-format date string has no meaningful "longer than N characters" state.
  truncates: false,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    it("renders a Unix-ms timestamp as Date.prototype.toDateString()", () => {
      // The fixture's own `valid` is an ISO string (form-input shape); the Cell's
      // real contract is a Unix-ms timestamp per its own docstring — this is what a
      // seeded document actually stores.
      const timestamp = Date.UTC(2025, 5, 15, 10, 30);
      const row = makeCellRow<TDocument>({ fieldKey: "field", value: timestamp });
      render(
        <DateFieldCell
          value={timestamp}
          row={row}
          fieldDef={options.fixture.fieldDef}
          fieldKey="field"
          isTitleField={false}
          collection={collection}
        />,
      );
      expect(screen.getByText(new Date(timestamp).toDateString())).toBeInTheDocument();
    });

    // `!props.value` treated epoch 0 (1970-01-01, a legitimate date) the same as an
    // absent value. Filed as CELL-4 — a distinct boundary defect from CELL-3's own
    // null/undefined scope, fixed by the same strict guard: `0` is neither `undefined`
    // nor `null`, so it now renders the real date instead of the em-dash placeholder.
    it("renders a date for a timestamp of 0, since it is a valid date, not an absent value", () => {
      const row = makeCellRow<TDocument>({ fieldKey: "field", value: 0 });
      render(
        <DateFieldCell
          value={0}
          row={row}
          fieldDef={options.fixture.fieldDef}
          fieldKey="field"
          isTitleField={false}
          collection={collection}
        />,
      );
      expect(screen.getByText(new Date(0).toDateString())).toBeInTheDocument();
    });
  },
});
