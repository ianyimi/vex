import { describe, expect, it } from "vitest";

import { isHiddenDocument } from "./isHiddenDocument";
import type { HiddenDocument } from "./types";

describe("isHiddenDocument", () => {
  it("returns true for an ACCESS_DENIED placeholder", () => {
    const placeholder: HiddenDocument<"images"> = {
      _id: "img_1" as HiddenDocument<"images">["_id"],
      code: "ACCESS_DENIED",
      resource: "images",
      action: "read",
    };
    expect(isHiddenDocument(placeholder)).toBe(true);
  });

  it("returns false for a real resolved document", () => {
    expect(isHiddenDocument({ _id: "img_1", title: "Sunset" })).toBe(false);
  });

  it("returns false for null and non-objects", () => {
    expect(isHiddenDocument(null)).toBe(false);
    expect(isHiddenDocument(undefined)).toBe(false);
    expect(isHiddenDocument("string")).toBe(false);
    expect(isHiddenDocument(42)).toBe(false);
  });

  it("returns false for an object missing the ACCESS_DENIED code", () => {
    expect(isHiddenDocument({ _id: "img_1", code: "SOMETHING_ELSE" })).toBe(false);
  });
});
