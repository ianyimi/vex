import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { date, type TDocument } from "@vexcms/core";
import { makeCellRow, runFieldCellContractSuite, withCellConfig } from "../../testing/fieldCellContract";
import { testCollection } from "../../testing/harness/accessFixtures";
import { DateFieldCell } from "./Cell";
import { dateFieldFixture } from "./testFixture";

// `TZ=UTC` is set on the `test`/`coverage`/`test:watch` npm scripts
// (`packages/react/package.json`), not here — see `utils.test.ts`.

runFieldCellContractSuite({
  fixture: dateFieldFixture,
  Component: DateFieldCell,
  // A fixed-format date string has no meaningful "longer than N characters" state.
  truncates: false,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    it("renders date+time via formatDateFieldValue, matching the field's default time config", () => {
      const timestamp = Date.UTC(2025, 5, 15, 14, 30, 45);
      const row = makeCellRow<TDocument>({ fieldKey: "field", value: timestamp });
      render(
        withCellConfig(
          <DateFieldCell
            value={timestamp}
            row={row}
            fieldDef={options.fixture.fieldDef}
            fieldKey="field"
            isTitleField={false}
            collection={collection}
          />,
        ),
      );
      expect(screen.getByText("Jun 15, 2025 2:30 PM")).toBeInTheDocument();
    });

    it("renders date-only when the field's time.hidden is set", () => {
      const timestamp = Date.UTC(2025, 5, 15, 14, 30, 45);
      const hiddenTimeField = date({
        label: "Published At",
        required: true,
        time: { hidden: true },
      });
      const row = makeCellRow<TDocument>({ fieldKey: "field", value: timestamp });
      render(
        withCellConfig(
          <DateFieldCell
            value={timestamp}
            row={row}
            fieldDef={hiddenTimeField}
            fieldKey="field"
            isTitleField={false}
            collection={collection}
          />,
        ),
      );
      expect(screen.getByText("Jun 15, 2025")).toBeInTheDocument();
    });

    // `!props.value` treated epoch 0 (1970-01-01, a legitimate date) the same as an
    // absent value. Filed as CELL-4 — a distinct boundary defect from CELL-3's own
    // null/undefined scope, fixed by the same strict guard: `0` is neither `undefined`
    // nor `null`, so it now renders the real date instead of the em-dash placeholder.
    it("renders a date for a timestamp of 0, since it is a valid date, not an absent value", () => {
      const row = makeCellRow<TDocument>({ fieldKey: "field", value: 0 });
      render(
        withCellConfig(
          <DateFieldCell
            value={0}
            row={row}
            fieldDef={options.fixture.fieldDef}
            fieldKey="field"
            isTitleField={false}
            collection={collection}
          />,
        ),
      );
      expect(screen.getByText("Jan 1, 1970 12:00 AM")).toBeInTheDocument();
    });
  },
});
