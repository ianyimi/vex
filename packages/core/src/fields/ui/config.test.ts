import { describe, it, expect } from "vitest";
import { ui } from "./config";

describe("ui()", () => {
  it("defaults position to main and leaves Cell unset", () => {
    const Field = () => null;
    const field = ui({ admin: { components: { Field } } });
    expect(field.type).toBe("ui");
    expect(field.admin.position).toBe("main");
    expect(field.admin.components.Field).toBe(Field);
    expect(field.admin.components.Cell).toBeUndefined();
  });

  it("keeps an explicit Cell and position", () => {
    const Field = () => null;
    const Cell = () => null;
    const field = ui({
      admin: { components: { Field, Cell }, position: "sidebar" },
    });
    expect(field.admin.components.Cell).toBe(Cell);
    expect(field.admin.position).toBe("sidebar");
  });
});
