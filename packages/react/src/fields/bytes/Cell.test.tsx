import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import type { TDocument } from "@vexcms/core";
import { makeCellRow, runFieldCellContractSuite, withCellConfig } from "../../testing/fieldCellContract";
import { testCollection } from "../../testing/harness/accessFixtures";
import { BytesFieldCell } from "./Cell";
import { bytesFieldFixture } from "./testFixture";

runFieldCellContractSuite({
  fixture: bytesFieldFixture,
  Component: BytesFieldCell,
  truncates: false,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("bytes: size formatting", () => {
      it("shows the byte size of the stored payload", () => {
        const value = new Uint8Array(12).buffer;
        const row = makeCellRow<TDocument>({ fieldKey: "field", value });
        const { container } = render(
          withCellConfig(
            <BytesFieldCell
              value={value}
              row={row}
              collection={collection}
              fieldDef={options.fixture.fieldDef}
              fieldKey="field"
              isTitleField={false}
            />,
          ),
        );
        expect(container).toHaveTextContent("12 B");
      });

      it("shows an em-dash placeholder for an absent value", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: undefined });
        const { container } = render(
          withCellConfig(
            <BytesFieldCell
              value={undefined}
              row={row}
              collection={collection}
              fieldDef={options.fixture.fieldDef}
              fieldKey="field"
              isTitleField={false}
            />,
          ),
        );
        expect(container).toHaveTextContent("—");
      });
    });
  },
});
