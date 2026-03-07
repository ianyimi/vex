import { describe, it, expect } from "vitest";
import { imageUrlColumnDef } from "./columnDef";
import type { ImageUrlFieldMeta } from "../../types";

describe("imageUrlColumnDef", () => {
  it("uses fieldKey as accessorKey", () => {
    const meta: ImageUrlFieldMeta = { type: "imageUrl" };
    const col = imageUrlColumnDef({ fieldKey: "avatar", meta });
    expect(col).toHaveProperty("accessorKey", "avatar");
  });

  it("uses meta.label as header when provided", () => {
    const meta: ImageUrlFieldMeta = { type: "imageUrl", label: "Profile Image" };
    const col = imageUrlColumnDef({ fieldKey: "avatar", meta });
    expect(col).toHaveProperty("header", "Profile Image");
  });

  it("capitalizes fieldKey as header fallback", () => {
    const meta: ImageUrlFieldMeta = { type: "imageUrl" };
    const col = imageUrlColumnDef({ fieldKey: "avatar", meta });
    expect(col).toHaveProperty("header", "Avatar");
  });
});
