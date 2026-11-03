import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { defineConfig, type TDocument } from "@vexcms/core";
import { RelationshipFieldDisplay } from "./Display";
import { relationshipFieldFixture, relationshipTargetCollection } from "./testFixture";
import { testCollection } from "../../testing/harness/accessFixtures";
import { VexConfigProvider } from "../../config/VexConfigContext";

const document: TDocument = { _id: "doc_1", _creationTime: 0 };
const config = defineConfig({ collections: [testCollection, relationshipTargetCollection] });

describe("RelationshipFieldDisplay", () => {
  it("renders one chip per populated related doc, titled by the target's useAsTitle field", () => {
    render(
      <VexConfigProvider config={config}>
        <RelationshipFieldDisplay
          field={relationshipFieldFixture.fieldDef}
          value={[{ _id: "doc_related_1", _creationTime: 0, title: "Related Doc" }]}
          document={document}
          collection={testCollection}
        />
      </VexConfigProvider>,
    );
    const chip = screen.getByText("Related Doc");
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveAttribute("title", "doc_related_1");
  });

  it("renders the raw id as both title and id for an unpopulated value", () => {
    render(
      <VexConfigProvider config={config}>
        <RelationshipFieldDisplay
          field={relationshipFieldFixture.fieldDef}
          value={["doc_related_2"]}
          document={document}
          collection={testCollection}
        />
      </VexConfigProvider>,
    );
    const chip = screen.getByText("doc_related_2");
    expect(chip).toHaveAttribute("title", "doc_related_2");
  });

  it("shows an em-dash for an empty relationship", () => {
    render(
      <VexConfigProvider config={config}>
        <RelationshipFieldDisplay
          field={relationshipFieldFixture.fieldDef}
          value={[]}
          document={document}
          collection={testCollection}
        />
      </VexConfigProvider>,
    );
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
