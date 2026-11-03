import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { array, text, type TDocument } from "@vexcms/core";
import { ArrayFieldDisplay } from "./Display";
import { testCollection } from "../../testing/harness/accessFixtures";
import { withCellConfig } from "../../testing/fieldCellContract";

const field = array({ label: "Tags", items: text() });
const document: TDocument = { _id: "doc_1", _creationTime: 0 };

describe("ArrayFieldDisplay", () => {
  it("renders one numbered row per item, each through the item type's own display", () => {
    render(
      withCellConfig(
        <ArrayFieldDisplay field={field} value={["alpha", "beta"]} document={document} collection={testCollection} />,
      ),
    );
    expect(screen.getByText("[1]")).toBeInTheDocument();
    expect(screen.getByText("alpha")).toBeInTheDocument();
    expect(screen.getByText("[2]")).toBeInTheDocument();
    expect(screen.getByText("beta")).toBeInTheDocument();
  });

  it("shows an em-dash for an empty array", () => {
    render(
      withCellConfig(<ArrayFieldDisplay field={field} value={[]} document={document} collection={testCollection} />),
    );
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
