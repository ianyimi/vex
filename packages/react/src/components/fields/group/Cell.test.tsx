import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TDocument } from "@vexcms/core";
import { makeCellRow, runFieldCellContractSuite } from "../../../testing/fieldCellContract";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { GroupFieldCell } from "./Cell";
import { groupFieldFixture } from "./testFixture";

runFieldCellContractSuite({
  fixture: groupFieldFixture,
  Component: GroupFieldCell,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("group: own rendering", () => {
      it.each([
        [{ title: "Hello" }, `{"title":"Hello"}`],
        [{ title: "Hello", body: "World" }, `{"title":"Hello","body":"World"}`],
      ])("renders a serialized key/value preview for %j", (value, expected) => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value });
        render(
          <GroupFieldCell
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
