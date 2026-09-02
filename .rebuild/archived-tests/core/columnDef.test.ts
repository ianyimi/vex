import { describe, it, expect } from "vitest";
import { imageUrlColumnDef } from "./columnDef";
import { imageUrl } from ".";

describe("imageUrlColumnDef", () => {
  it("uses fieldKey as accessorKey", () => {
    const col = imageUrlColumnDef({ fieldKey: "avatar", field: imageUrl() });
    expect(col).toHaveProperty("accessorKey", "avatar");
  });

  it("uses field.label as header when provided", () => {
    const col = imageUrlColumnDef({ fieldKey: "avatar", field: imageUrl({ label: "Profile Image" }) });
    expect(col).toHaveProperty("header", "Profile Image");
  });

  it("capitalizes fieldKey as header fallback", () => {
    const col = imageUrlColumnDef({ fieldKey: "avatar", field: imageUrl() });
    expect(col).toHaveProperty("header", "Avatar");
  });
});
