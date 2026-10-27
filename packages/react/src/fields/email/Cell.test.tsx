import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TDocument } from "@vexcms/core";
import { makeCellRow, runFieldCellContractSuite, withCellConfig } from "../../testing/fieldCellContract";
import { testCollection } from "../../testing/harness/accessFixtures";
import { EmailFieldCell } from "./Cell";
import { emailFieldFixture } from "./testFixture";

runFieldCellContractSuite({
  fixture: emailFieldFixture,
  Component: EmailFieldCell,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("email: mailto link", () => {
      it("renders a mailto: link when isTitleField is false", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: options.fixture.valid });
        const { container } = render(
          withCellConfig(
            <EmailFieldCell
              value={options.fixture.valid}
              row={row}
              fieldDef={options.fixture.fieldDef}
              fieldKey="field"
              isTitleField={false}
              collection={collection}
            />,
          ),
        );
        const link = container.querySelector("a");
        expect(link).not.toBeNull();
        expect(link).toHaveAttribute("href", `mailto:${options.fixture.valid}`);
        expect(container).toHaveTextContent(options.fixture.valid);
      });

      it("renders a document edit link, not mailto:, when isTitleField is true", () => {
        const row = makeCellRow<TDocument>({
          fieldKey: "field",
          value: options.fixture.valid,
          id: "doc_1",
        });
        const { container } = render(
          withCellConfig(
            <EmailFieldCell
              value={options.fixture.valid}
              row={row}
              fieldDef={options.fixture.fieldDef}
              fieldKey="field"
              isTitleField={true}
              collection={collection}
            />,
          ),
        );
        const link = container.querySelector("a");
        expect(link).not.toBeNull();
        expect(link?.getAttribute("href")).not.toMatch(/^mailto:/);
        expect(link?.getAttribute("href")).toContain(collection.slug);
      });
    });
  },
});
