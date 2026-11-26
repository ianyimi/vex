import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TDocument } from "@vexcms/core";
import { makeCellRow, runFieldCellContractSuite, withCellConfig } from "../../testing/fieldCellContract";
import { testCollection } from "../../testing/harness/accessFixtures";
import { KeyValueFieldCell } from "./Cell";
import { keyValueFieldFixture } from "./testFixture";

runFieldCellContractSuite({
  fixture: keyValueFieldFixture,
  Component: KeyValueFieldCell,
  truncates: false,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("keyValue: own rendering", () => {
      it("shows the singular 'entry' for exactly one key", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: { alpha: 1 } });
        render(
          withCellConfig(
            <KeyValueFieldCell
              value={{ alpha: 1 }}
              row={row}
              collection={collection}
              fieldDef={options.fixture.fieldDef}
              fieldKey="field"
              isTitleField={false}
            />,
          ),
        );
        expect(screen.getByText("1 entry")).toBeInTheDocument();
      });

      it("shows the plural 'entries' for two or more keys", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: { alpha: 1, beta: 2 } });
        render(
          withCellConfig(
            <KeyValueFieldCell
              value={{ alpha: 1, beta: 2 }}
              row={row}
              collection={collection}
              fieldDef={options.fixture.fieldDef}
              fieldKey="field"
              isTitleField={false}
            />,
          ),
        );
        expect(screen.getByText("2 entries")).toBeInTheDocument();
      });
    });
  },
});
