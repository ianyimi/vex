import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { testCollection } from "../../testing/harness/accessFixtures";
import { withCellConfig } from "../../testing/fieldCellContract";
import { keyValueFieldFixture } from "./testFixture";
import { KeyValueFieldDisplay } from "./Display";

describe("KeyValueFieldDisplay", () => {
  it("renders an em-dash when the value is empty", () => {
    render(
      withCellConfig(
        <KeyValueFieldDisplay
          field={keyValueFieldFixture.fieldDef}
          value={{}}
          document={{} as never}
          collection={testCollection}
        />,
      ),
    );
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders every entry's key and its value field's own display", () => {
    render(
      withCellConfig(
        <KeyValueFieldDisplay
          field={keyValueFieldFixture.fieldDef}
          value={{ alpha: 1, beta: 2 }}
          document={{} as never}
          collection={testCollection}
        />,
      ),
    );
    expect(screen.getByText("alpha")).toBeInTheDocument();
    expect(screen.getByText("beta")).toBeInTheDocument();
  });
});
