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
