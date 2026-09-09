import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TDocument } from "@vexcms/core";
import { makeCellRow, runFieldCellContractSuite } from "../../../testing/fieldCellContract";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { UrlFieldCell } from "./Cell";
import { urlFieldFixture } from "./testFixture";

runFieldCellContractSuite({
  fixture: urlFieldFixture,
  Component: UrlFieldCell,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("url: own rendering", () => {
      it("links to the raw URL value itself when isTitleField is false", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: options.fixture.valid });
        const { container } = render(
          <UrlFieldCell
            value={options.fixture.valid}
            row={row}
            fieldDef={options.fixture.fieldDef}
            fieldKey="field"
            isTitleField={false}
            collection={collection}
          />,
        );
        expect(container.querySelector("a")?.getAttribute("href")).toBe(options.fixture.valid);
      });

      // An empty string is not a URL, the same practical state as an absent value —
      // strengthened past the base contract's null/undefined case to render the SAME
      // em-dash placeholder rather than silently rendering nothing, so a user sees a
      // consistent signal instead of a blank cell for one falsy variant and a dash for
      // another.
      it("renders the em-dash placeholder for an empty string, same as for null/undefined", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: "" });
        const { container } = render(
          <UrlFieldCell
            value=""
            row={row}
            fieldDef={options.fixture.fieldDef}
            fieldKey="field"
            isTitleField={false}
            collection={collection}
          />,
        );
        expect(container).toHaveTextContent("—");
      });
    });
  },
});
