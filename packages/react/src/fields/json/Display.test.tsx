import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { json, type TDocument } from "@vexcms/core";
import { JsonFieldDisplay } from "./Display";
import { testCollection } from "../../testing/harness/accessFixtures";

const field = json({ label: "Settings" });
const document: TDocument = { _id: "doc_1", _creationTime: 0 };

describe("JsonFieldDisplay", () => {
  it("shows the real read-only JsonEditor once its code-split chunk loads", async () => {
    render(<JsonFieldDisplay field={field} value={{ a: 1, b: [2, 3] }} document={document} collection={testCollection} />);
    const textbox = await waitFor(() => screen.getByRole("textbox") as HTMLTextAreaElement);
    expect(textbox.value).toBe(JSON.stringify({ a: 1, b: [2, 3] }, null, 2));
    expect(textbox).toHaveAttribute("readonly");
  });

  it("shows formatted null for an absent value, never crashing on undefined", async () => {
    render(<JsonFieldDisplay field={field} value={undefined} document={document} collection={testCollection} />);
    const textbox = await waitFor(() => screen.getByRole("textbox") as HTMLTextAreaElement);
    expect(textbox.value).toBe("null");
  });
});
