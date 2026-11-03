import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { blocks, defineBlock, text, type GenericBlock, type TDocument } from "@vexcms/core";
import { BlocksFieldDisplay } from "./Display";
import { testCollection } from "../../testing/harness/accessFixtures";
import { withCellConfig } from "../../testing/fieldCellContract";

const paragraphBlock = defineBlock({
  slug: "paragraph",
  label: "Paragraph",
  fields: { text: text({ label: "Text" }) },
});
const field = blocks({ label: "Body", blocks: [paragraphBlock] });
const document: TDocument = { _id: "doc_1", _creationTime: 0 };

describe("BlocksFieldDisplay", () => {
  it("labels each block with its own block type and renders its sub-fields", () => {
    const value: GenericBlock[] = [
      { id: "block-1", blockType: "paragraph", blockName: "Paragraph", text: "Hello world" },
    ];
    render(
      withCellConfig(
        <BlocksFieldDisplay field={field} value={value} document={document} collection={testCollection} />,
      ),
    );
    expect(screen.getByText("[1] Paragraph")).toBeInTheDocument();
    expect(screen.getByText("Text")).toBeInTheDocument();
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("shows a fallback note for a block type no longer configured on the field", () => {
    const value: GenericBlock[] = [{ id: "block-2", blockType: "removed", blockName: "Removed" }];
    render(
      withCellConfig(
        <BlocksFieldDisplay field={field} value={value} document={document} collection={testCollection} />,
      ),
    );
    expect(screen.getByText("[1] removed")).toBeInTheDocument();
    expect(screen.getByText(/not configured on this field/)).toBeInTheDocument();
  });

  it("shows an em-dash for an empty blocks array", () => {
    render(
      withCellConfig(<BlocksFieldDisplay field={field} value={[]} document={document} collection={testCollection} />),
    );
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
