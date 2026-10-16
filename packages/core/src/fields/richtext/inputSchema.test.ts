import { describe, it, expect } from "vitest";
import { richtext } from "./config";
import { richTextFieldToInputSchema } from "./inputSchema";
import type { RichTextDocument } from "./types";

const DOCUMENT: RichTextDocument = [
  { type: "p", children: [{ text: "Hello world" }] },
];

const EMPTY_DOCUMENT: RichTextDocument = [
  { type: "p", children: [{ text: "" }] },
];

describe("richTextFieldToInputSchema", () => {
  it("accepts a well-formed document", () => {
    const schema = richTextFieldToInputSchema({
      field: richtext({ required: true }),
    });

    expect(schema.safeParse(DOCUMENT).success).toBe(true);
  });

  it("passes through extra keys Plate attaches to elements and leaves", () => {
    const schema = richTextFieldToInputSchema({
      field: richtext({ required: false }),
    });
    const document = [
      {
        type: "img",
        url: "https://example.com/a.png",
        mediaId: "abc123",
        children: [{ text: "", bold: true }],
      },
    ];

    expect(schema.safeParse(document).success).toBe(true);
  });

  it("rejects a node missing children", () => {
    const schema = richTextFieldToInputSchema({
      field: richtext({ required: true }),
    });

    expect(schema.safeParse([{ type: "p" }]).success).toBe(false);
  });

  it("rejects a non-array value", () => {
    const schema = richTextFieldToInputSchema({
      field: richtext({ required: true }),
    });

    expect(schema.safeParse({ type: "p", children: [] }).success).toBe(false);
  });

  it("rejects an empty document when required", () => {
    const schema = richTextFieldToInputSchema({
      field: richtext({ required: true }),
    });

    expect(schema.safeParse([]).success).toBe(false);
  });

  it("rejects a required document whose only content is empty paragraphs (CORE-1)", () => {
    const schema = richTextFieldToInputSchema({
      field: richtext({ required: true }),
    });

    expect(schema.safeParse(EMPTY_DOCUMENT).success).toBe(false);
  });

  it("accepts an empty document when not required", () => {
    const schema = richTextFieldToInputSchema({
      field: richtext({ required: false }),
    });
    const parsed = schema.safeParse([]);

    expect(parsed.success).toBe(true);
    expect(parsed.data).toEqual([]);
  });

  it("honors a draft-lenient required override the same way Step 3's dispatcher ignoreRequired will", () => {
    const schema = richTextFieldToInputSchema({
      field: richtext({ required: false }),
    });

    expect(schema.safeParse(EMPTY_DOCUMENT).success).toBe(true);
  });
});
