import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { CollectionConfig } from "@vexcms/core";
import {
  relationshipFieldFixture,
  relationshipTargetCollection,
} from "./testFixture";
import { RelationshipEmpty } from "./EmptyInput";

const targetCollection = relationshipTargetCollection as CollectionConfig;

describe("RelationshipEmpty", () => {
  it("renders Select/Create buttons labeled with the target collection's labels", () => {
    render(
      <RelationshipEmpty
        fieldDef={relationshipFieldFixture.fieldDef}
        targetCollection={targetCollection}
        readOnly={false}
        onPickerOpen={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Select Documents" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create Document" }),
    ).toBeInTheDocument();
  });

  it("calls onPickerOpen with the matching tab for each button", async () => {
    const user = userEvent.setup();
    const onPickerOpen = vi.fn();
    render(
      <RelationshipEmpty
        fieldDef={relationshipFieldFixture.fieldDef}
        targetCollection={targetCollection}
        readOnly={false}
        onPickerOpen={onPickerOpen}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Select Documents" }));
    expect(onPickerOpen).toHaveBeenLastCalledWith("select");

    await user.click(screen.getByRole("button", { name: "Create Document" }));
    expect(onPickerOpen).toHaveBeenLastCalledWith("create");
  });

  it("disables both buttons when readOnly", () => {
    render(
      <RelationshipEmpty
        fieldDef={relationshipFieldFixture.fieldDef}
        targetCollection={targetCollection}
        readOnly
        onPickerOpen={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Select Documents" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Create Document" }),
    ).toBeDisabled();
  });
});
