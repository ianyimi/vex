import { describe, it, expect } from "vitest";
import { richtext } from "./config";

describe("richtext", () => {
  it("defaults to an empty document", () => {
    const field = richtext();

    expect(field.type).toBe("richtext");
    expect(field.interfaceType).toBe("RichTextDocument");
    expect(field.required).toBe(false);
    expect(field.defaultValue).toEqual([]);
  });

  it("keeps an explicit defaultValue", () => {
    const document = [{ type: "p", children: [{ text: "Hello" }] }];
    const field = richtext({ defaultValue: document });

    expect(field.defaultValue).toEqual(document);
  });

  it("applies the same admin defaults as every other field", () => {
    const field = richtext();

    expect(field.admin).toEqual({
      hidden: false,
      readOnly: false,
      position: "main",
      width: "full",
      cellAlignment: "left",
      placeholder: "",
    });
  });

  it("keeps required: true when set", () => {
    const field = richtext({ required: true });

    expect(field.required).toBe(true);
  });

  it("passes mediaCollectionSlug through when provided", () => {
    const field = richtext({ label: "Body", mediaCollectionSlug: "images" });
    expect(field.mediaCollectionSlug).toBe("images");
  });

  it("leaves mediaCollectionSlug undefined when omitted", () => {
    const field = richtext({ label: "Body" });
    expect(field.mediaCollectionSlug).toBeUndefined();
  });
});
