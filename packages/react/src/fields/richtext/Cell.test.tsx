import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TDocument } from "@vexcms/core";
import {
  makeCellRow,
  runFieldCellContractSuite,
  withCellConfig,
} from "../../testing/fieldCellContract";
import { testCollection } from "../../testing/harness/accessFixtures";
import { RichTextFieldCell } from "./Cell";
import { richTextFieldFixture } from "./testFixture";

runFieldCellContractSuite({
  fixture: richTextFieldFixture,
  Component: RichTextFieldCell,
  // The generic over-length builder sizes arrays by JSON length, which a
  // richtext document already exceeds while its plain text stays short —
  // truncation is asserted below against an explicit long document instead.
  truncates: false,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("richtext: own rendering", () => {
      it("truncates a plain-text excerpt past 77 characters and keeps the full text on a title attribute", () => {
        const longText = "word ".repeat(30).trim();
        const value = [{ type: "p", children: [{ text: longText }] }];
        const row = makeCellRow<TDocument>({ fieldKey: "field", value });
        const { container } = render(
          withCellConfig(
            <RichTextFieldCell
              value={value}
              row={row}
              fieldDef={options.fixture.fieldDef}
              fieldKey="field"
              isTitleField={false}
              collection={collection}
            />,
          ),
        );
        const titled = container.querySelector("[title]");
        expect(titled?.getAttribute("title")).toBe(longText);
        expect(titled?.textContent?.endsWith("…")).toBe(true);
        expect(titled?.textContent?.length).toBeLessThanOrEqual(78);
      });

      it("renders a plain-text excerpt joining the document's text leaves, never markup", () => {
        const row = makeCellRow<TDocument>({
          fieldKey: "field",
          value: options.fixture.valid,
        });
        const { container } = render(
          withCellConfig(
            <RichTextFieldCell
              value={options.fixture.valid}
              row={row}
              fieldDef={options.fixture.fieldDef}
              fieldKey="field"
              isTitleField={false}
              collection={collection}
            />,
          ),
        );
        expect(container.querySelector("p, h1, strong, em")).toBeNull();
        expect(container).toHaveTextContent("Hello world");
        expect(container).toHaveTextContent("Second paragraph.");
      });

      it("renders the em-dash placeholder for an empty document", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: [] });
        const { container } = render(
          withCellConfig(
            <RichTextFieldCell
              value={[]}
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
  },
});
