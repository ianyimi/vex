import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TDocument } from "@vexcms/core";
import { makeCellRow, runFieldCellContractSuite, withCellConfig } from "../../testing/fieldCellContract";
import { testCollection } from "../../testing/harness/accessFixtures";
import { TextFieldCell } from "./Cell";
import { textFieldFixture } from "./testFixture";

runFieldCellContractSuite({
  fixture: textFieldFixture,
  Component: TextFieldCell,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("text: empty value", () => {
      it("renders the em-dash placeholder for an empty string (not undefined/null)", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: "" });
        const { container } = render(
          withCellConfig(
            <TextFieldCell
              value=""
              row={row}
              fieldDef={options.fixture.fieldDef}
              fieldKey="field"
              isTitleField={false}
              collection={collection}
            />,
          ),
        );
        expect(container).toHaveTextContent("—");
      });
    });

    describe("text: title link touch target", () => {
      it("gives the title link a 44px-tall tap area without changing row height", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: options.fixture.valid });
        const { container } = render(
          withCellConfig(
            <TextFieldCell
              value={options.fixture.valid}
              row={row}
              fieldDef={options.fixture.fieldDef}
              fieldKey="field"
              isTitleField={true}
              collection={collection}
            />,
          ),
        );
        expect(container.innerHTML).toContain("min-h-11");
        const target = container.querySelector("a .min-h-11");
        expect(target).not.toBeNull();
        expect(target?.className).toContain("-my-3.5");
        expect(target?.className).toContain("inline-flex");
        expect(target?.textContent).toContain(options.fixture.valid.slice(0, 20));
      });
    });

    describe("text: non-title rendering", () => {
      it("renders the plain value with no link when isTitleField is false", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: options.fixture.valid });
        const { container } = render(
          withCellConfig(
            <TextFieldCell
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
        expect(container).toHaveTextContent(options.fixture.valid);
      });
    });
  },
});
