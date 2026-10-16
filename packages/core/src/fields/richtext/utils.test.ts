import { describe, it, expect } from "vitest";
import { richTextToPlainText } from "./utils";
import type { RichTextDocument } from "./types";

const PARAGRAPH_WITH_LINK: RichTextDocument[number] = {
  type: "p",
  children: [
    { text: "Visit " },
    { type: "a", url: "https://vexcms.dev", children: [{ text: "our site" }] },
    { text: "." },
  ],
};

const DOCUMENT: RichTextDocument = [
  PARAGRAPH_WITH_LINK,
  { type: "p", children: [{ text: "Second paragraph." }] },
];

describe("richTextToPlainText", () => {
  it("joins text leaves within a block with no separator, including nested inline elements", () => {
    expect(richTextToPlainText({ document: [PARAGRAPH_WITH_LINK] })).toBe(
      "Visit our site.",
    );
  });

  it("joins top-level blocks with a single space", () => {
    expect(richTextToPlainText({ document: DOCUMENT })).toBe(
      "Visit our site. Second paragraph.",
    );
  });

  it("returns an empty string for an empty document", () => {
    expect(richTextToPlainText({ document: [] })).toBe("");
  });

  it("returns an empty string for a document whose only content is empty paragraphs", () => {
    expect(
      richTextToPlainText({
        document: [{ type: "p", children: [{ text: "" }] }],
      }),
    ).toBe("");
  });

  it("truncates with a trailing ellipsis, trimming trailing whitespace before it", () => {
    expect(
      richTextToPlainText({ document: [PARAGRAPH_WITH_LINK], maxLength: 8 }),
    ).toBe("Visit ou…");
  });

  it("does not truncate when the excerpt is within maxLength", () => {
    expect(
      richTextToPlainText({ document: [PARAGRAPH_WITH_LINK], maxLength: 100 }),
    ).toBe("Visit our site.");
  });
});
