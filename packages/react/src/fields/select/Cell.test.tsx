import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { select, type TDocument, type SelectField } from "@vexcms/core";
import { makeCellRow, runFieldCellContractSuite, withCellConfig } from "../../testing/fieldCellContract";
import { testCollection } from "../../testing/harness/accessFixtures";
import { SelectFieldCell } from "./Cell";
import { selectFieldFixture, scalarSelectFieldFixture } from "./testFixture";

runFieldCellContractSuite({
  fixture: selectFieldFixture,
  Component: SelectFieldCell,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("select: empty value", () => {
      it("renders the em-dash placeholder for an empty selection array (not undefined/null)", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: [] });
        render(
          withCellConfig(
            <SelectFieldCell
              value={[]}
              row={row}
              fieldDef={options.fixture.fieldDef}
              fieldKey="field"
              isTitleField={false}
              collection={collection}
            />,
          ),
        );
        expect(screen.getByText("—")).toBeInTheDocument();
      });
    });
    describe("select: own rendering", () => {
      it("renders a Badge per selected option, using each option's label", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: options.fixture.valid });
        render(
          withCellConfig(
            <SelectFieldCell
              value={options.fixture.valid}
              row={row}
              fieldDef={options.fixture.fieldDef}
              fieldKey="field"
              isTitleField={false}
              collection={collection}
            />,
          ),
        );
        expect(screen.getByText("Draft")).toBeInTheDocument();
        expect(screen.getByText("Published")).toBeInTheDocument();
      });

      it("omits a stored value that is no longer one of fieldDef.options", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: ["retired"] });
        const { container } = render(
          withCellConfig(
            <SelectFieldCell
              value={["retired"]}
              row={row}
              fieldDef={options.fixture.fieldDef}
              fieldKey="field"
              isTitleField={false}
              collection={collection}
            />,
          ),
        );
        expect(container.textContent).toBe("");
      });
    });

    describe("select: scalar schema.validator storage", () => {
      const scalarFieldDef: SelectField = select({
        required: true,
        hasMany: false,
        schema: { validator: "literal" },
        options: options.fixture.fieldDef.options,
      });

      it("renders a single Badge for a scalar stored value", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: "draft" });
        render(
          withCellConfig(
            <SelectFieldCell
              value="draft"
              row={row}
              fieldDef={scalarFieldDef}
              fieldKey="field"
              isTitleField={false}
              collection={collection}
            />,
          ),
        );
        expect(screen.getByText("Draft")).toBeInTheDocument();
      });

      it("renders the em-dash placeholder for an empty scalar value", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: "" });
        render(
          withCellConfig(
            <SelectFieldCell
              value=""
              row={row}
              fieldDef={scalarFieldDef}
              fieldKey="field"
              isTitleField={false}
              collection={collection}
            />,
          ),
        );
        expect(screen.getByText("—")).toBeInTheDocument();
      });
    });
  },
});

runFieldCellContractSuite({
  fixture: scalarSelectFieldFixture,
  Component: SelectFieldCell,
});

