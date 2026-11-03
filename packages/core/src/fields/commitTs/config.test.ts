import { describe, it, expect } from "vitest";
import { commitTs } from "./config";

describe("commitTs()", () => {
  it("applies the documented defaults", () => {
    const field = commitTs();
    expect(field.type).toBe("commitTs");
    expect(field.label).toBe("");
    expect(field.required).toBe(false);
    expect(field.defaultValue).toBeUndefined();
    expect(field.on).toBe("save");
    expect(field.admin).toMatchObject({
      hidden: false,
      readOnly: true,
      position: "main",
      width: "100%",
      cellAlignment: "left",
      enableSorting: true,
      format: "datetime",
    });
  });

  it("defaults admin.enableSorting to true, since every commitTs field always has an auto-index", () => {
    expect(commitTs().admin.enableSorting).toBe(true);
    expect(commitTs({ on: "publish" }).admin.enableSorting).toBe(true);
    expect(commitTs({ admin: { format: "relative" } }).admin.enableSorting).toBe(true);
  });

  it("lets a caller override admin.enableSorting explicitly", () => {
    expect(commitTs({ admin: { enableSorting: false } }).admin.enableSorting).toBe(false);
  });

  it("respects the on option", () => {
    expect(commitTs({ on: "publish" }).on).toBe("publish");
    expect(commitTs({ on: "all" }).on).toBe("all");
  });

  it("is always read-only, regardless of what admin.readOnly the caller passes", () => {
    expect(commitTs({ admin: { readOnly: false } }).admin.readOnly).toBe(true);
  });
});
