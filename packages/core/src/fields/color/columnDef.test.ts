import { describe, it, expect } from "vitest";
import { colorColumnDef } from "./columnDef";
import { color } from "./config";

describe("colorColumnDef", () => {
  it("creates column with field label as header", () => {
    const col = colorColumnDef({
      fieldKey: "primaryColor",
      field: color({ label: "Primary Color" }),
    });
    expect(col.header).toBe("Primary Color");
    expect((col as any).accessorKey).toBe("primaryColor");
  });

  it("falls back to field key when no label", () => {
    const col = colorColumnDef({
      fieldKey: "color",
      field: color(),
    });
    expect(col.header).toBe("color");
  });

  it("sets meta type to color", () => {
    const col = colorColumnDef({
      fieldKey: "c",
      field: color({ label: "C" }),
    });
    expect((col.meta as any).type).toBe("color");
  });
});
