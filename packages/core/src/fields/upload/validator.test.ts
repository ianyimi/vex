import { describe, it, expect } from "vitest";
import { upload } from "./config";
import { uploadFieldToValidator } from "./validator";

describe("uploadFieldToValidator", () => {
  it("returns v.id for the target collection when required", () => {
    const field = upload({ to: "images", required: true });
    expect(uploadFieldToValidator({ field })).toBe('v.array(v.id("images"))');
  });

  it("wraps in v.optional when not required", () => {
    const field = upload({ to: "images", required: false });
    expect(uploadFieldToValidator({ field })).toBe('v.optional(v.array(v.id("images")))');
  });

  it("does not wrap when required", () => {
    const field = upload({ to: "images", required: true });
    expect(uploadFieldToValidator({ field })).toBe('v.array(v.id("images"))');
  });
});

describe("uploadFieldToValidator — schema override", () => {
  it("emits v.id() for schema.validator 'id'", () => {
    const field = upload({ to: "images", schema: { validator: "id" }, required: true });
    expect(uploadFieldToValidator({ field })).toBe('v.id("images")');
  });

  it("wraps v.id() in v.optional() when not required", () => {
    const field = upload({ to: "images", schema: { validator: "id" }, required: false });
    expect(uploadFieldToValidator({ field })).toBe('v.optional(v.id("images"))');
  });

  it("emits v.string() for schema.validator 'string'", () => {
    const field = upload({ to: "images", schema: { validator: "string" }, required: true });
    expect(uploadFieldToValidator({ field })).toBe("v.string()");
  });

  it("wraps v.string() in v.optional() when not required", () => {
    const field = upload({ to: "images", schema: { validator: "string" }, required: false });
    expect(uploadFieldToValidator({ field })).toBe("v.optional(v.string())");
  });
});
