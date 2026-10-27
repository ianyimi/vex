import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TDocument } from "@vexcms/core";
import { makeCellRow, runFieldCellContractSuite, withCellConfig } from "../../testing/fieldCellContract";
import { testCollection } from "../../testing/harness/accessFixtures";
import { TextareaFieldCell } from "./Cell";
import { textareaFieldFixture } from "./testFixture";

runFieldCellContractSuite({
  fixture: textareaFieldFixture,
  Component: TextareaFieldCell,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("textarea: collapses multi-line content to one line", () => {
      it("renders no raw newlines when the stored value is multi-line", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: options.fixture.valid });
        const { container } = render(
          withCellConfig(
            <TextareaFieldCell
              value={options.fixture.valid}
              row={row}
              fieldDef={options.fixture.fieldDef}
              fieldKey="field"
              isTitleField={false}
              collection={collection}
            />,
          ),
        );
        expect(container.querySelector("a")).toBeNull();
        expect(container.textContent).not.toContain("\n");
        expect(container.textContent).toContain("First line Second line");
      });
    });
  },
});
