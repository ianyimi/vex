import { describe, it, expect } from "vitest";
import { row } from "./config";
import { text } from "../text/config";

describe("row()", () => {
  it("keeps the given fields verbatim", () => {
    const field = row({ fields: { a: text(), b: text() } });
    expect(field.type).toBe("row");
    expect(field.fields.a).toBeDefined();
    expect(field.fields.b).toBeDefined();
  });

  it("throws on an empty field map", () => {
    expect(() => row({ fields: {} })).toThrow("row(): requires at least one field");
  });
});
