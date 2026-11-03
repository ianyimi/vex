import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { group, text, type TDocument } from "@vexcms/core";
import { GroupFieldDisplay } from "./Display";
import { testCollection } from "../../testing/harness/accessFixtures";
import { withCellConfig } from "../../testing/fieldCellContract";

const field = group({
  label: "SEO",
  fields: {
    title: text({ label: "Meta Title" }),
    description: text({ label: "Meta Description" }),
  },
});
const document: TDocument = { _id: "doc_1", _creationTime: 0 };

describe("GroupFieldDisplay", () => {
  it("renders every sub-field's own label and value, recursively through fieldToDisplayComponent", () => {
    render(
      withCellConfig(
        <GroupFieldDisplay
          field={field}
          value={{ title: "Hello", description: "World" }}
          document={document}
          collection={testCollection}
        />,
      ),
    );
    expect(screen.getByText("Meta Title")).toBeInTheDocument();
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("Meta Description")).toBeInTheDocument();
    expect(screen.getByText("World")).toBeInTheDocument();
  });

  it("shows an em-dash for an absent group value", () => {
    render(
      withCellConfig(
        <GroupFieldDisplay field={field} value={undefined as never} document={document} collection={testCollection} />,
      ),
    );
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
