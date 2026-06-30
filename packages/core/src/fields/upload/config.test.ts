import { describe, it, expect } from "vitest";
import { upload } from "./config";

describe("upload()", () => {
  it("creates an upload field with defaults", () => {
    const field = upload({ to: "images" });
    expect(field.type).toBe("upload");
    expect(field.to).toBe("images");
    expect(field.label).toBe("");
    expect(field.required).toBe(false);
    expect(field.interfaceType).toBe("Id<MediaCollectionSlug>[]");
    expect(field.admin.hidden).toBe(false);
    expect(field.admin.readOnly).toBe(false);
    expect(field.admin.position).toBe("main");
    expect(field.admin.width).toBe("full");
  });

  it("applies custom options", () => {
    const field = upload({
      to: "images",
      label: "Featured Image",
      required: true,
      admin: { position: "sidebar" },
    });
    expect(field.label).toBe("Featured Image");
    expect(field.required).toBe(true);
    expect(field.admin.position).toBe("sidebar");
  });

  it("throws for empty to", () => {
    expect(() => upload({ to: "" })).toThrow('upload(): "to" must be a valid collection slug');
  });

  it("throws for invalid to slug", () => {
    expect(() => upload({ to: "123-invalid" })).toThrow(
      'upload(): "to" must be a valid collection slug',
    );
  });

  it("allows valid to slugs", () => {
    expect(() => upload({ to: "images" })).not.toThrow();
    expect(() => upload({ to: "media-files" })).not.toThrow();
    expect(() => upload({ to: "media_files" })).not.toThrow();
  });
});
