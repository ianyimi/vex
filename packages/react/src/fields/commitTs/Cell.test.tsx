import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { type TDocument } from "@vexcms/core";
import { makeCellRow, runFieldCellContractSuite, withCellConfig } from "../../testing/fieldCellContract";
import { testCollection } from "../../testing/harness/accessFixtures";
import { CommitTsFieldCell } from "./Cell";
import { commitTsFieldFixture } from "./testFixture";

// `TZ=UTC` is set on the `test`/`coverage`/`test:watch` npm scripts
// (`packages/react/package.json`), not here — see `fields/date/utils.test.ts`.

runFieldCellContractSuite({
  fixture: commitTsFieldFixture,
  Component: CommitTsFieldCell,
  // A fixed-format datetime string has no meaningful "longer than N characters" state.
  truncates: false,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    it("renders the formatted datetime for a VALID ms value, via formatCommitTsFieldValue's default (datetime) format", () => {
      const timestamp = Date.UTC(2025, 5, 15, 14, 30);
      const row = makeCellRow<TDocument>({ fieldKey: "field", value: timestamp });
      render(
        withCellConfig(
          <CommitTsFieldCell
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
  },
});
