import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ClientVexConfig, TDocument } from "@vexcms/core";
import { makeCellRow, runFieldCellContractSuite } from "../../../testing/fieldCellContract";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { VexConfigContext } from "../../../context/VexConfigContext";
import { RelationshipFieldCell } from "./Cell";
import { relationshipFieldFixture, relationshipTargetCollection } from "./testFixture";

/**
 * Minimal client config carrying the relationship's target collection — only
 * `collections` is read on this path (`config.collections.find(...)` inside
 * `RelationshipFieldCell`). Mirrors the stub-config pattern `fieldInputContract.ts`
 * and `upload/Input.test.tsx` both use at this same library boundary.
 */
const stubClientConfig = {
  collections: [relationshipTargetCollection],
  basePath: "/admin",
} as unknown as ClientVexConfig;

/**
 * Wraps a node in the stub `VexConfigContext` this cell resolves its target
 * collection from.
 *
 * @param node - The node to wrap.
 * @returns `node` inside a `VexConfigContext.Provider`.
 */
function withConfig(node: ReactNode) {
  return <VexConfigContext.Provider value={stubClientConfig}>{node}</VexConfigContext.Provider>;
}

runFieldCellContractSuite({
  fixture: relationshipFieldFixture,
  Component: RelationshipFieldCell,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("relationship: own rendering", () => {
      it("renders '1 item' for a single unpopulated raw id", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: options.fixture.valid });
        render(
          withConfig(
            <RelationshipFieldCell
              value={options.fixture.valid}
              row={row}
              fieldDef={options.fixture.fieldDef}
              fieldKey="field"
              isTitleField={false}
              collection={collection}
            />,
          ),
        );
        expect(screen.getByText("1 item")).toBeInTheDocument();
      });

      it("renders the resolved preview's title for a single populated document", () => {
        const populated = [{ _id: "doc_a", title: "Hello Relation" }];
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: populated });
        render(
          withConfig(
            <RelationshipFieldCell
              value={populated}
              row={row}
              fieldDef={options.fixture.fieldDef}
              fieldKey="field"
              isTitleField={false}
              collection={collection}
            />,
          ),
        );
        expect(screen.getByText("Hello Relation")).toBeInTheDocument();
      });

      it("renders '{count} {plural}' for more than one populated document, using the target collection's plural label", () => {
        const populated = [
          { _id: "doc_a", title: "First" },
          { _id: "doc_b", title: "Second" },
        ];
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: populated });
        render(
          withConfig(
            <RelationshipFieldCell
              value={populated}
              row={row}
              fieldDef={options.fixture.fieldDef}
              fieldKey="field"
              isTitleField={false}
              collection={collection}
            />,
          ),
        );
        expect(
          screen.getByText(`2 ${relationshipTargetCollection.labels.plural}`),
        ).toBeInTheDocument();
      });
    });
  },
});
