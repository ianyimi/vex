import { describe, it, expect } from "vitest";
import { json } from "./config";
import { ADMIN_FIELDS } from "../constants";

describe("json()", () => {
  it("defaults type, interfaceType, and required", () => {
    const field = json();
    expect(field.type).toBe("json");
    expect(field.interfaceType).toBe("unknown");
    expect(field.required).toBe(false);
    expect(field.defaultValue).toBeUndefined();
  });

  it("applies admin defaults", () => {
    const field = json();
    expect(field.admin).toMatchObject({
      hidden: false,
      readOnly: false,
      position: "main",
      width: "full",
      cellAlignment: "left",
    });
  });

  it("carries required and label through to the resolved field", () => {
    const field = json({ label: "Settings", required: true });
    expect(field.label).toBe("Settings");
    expect(field.required).toBe(true);
  });

  it("matches ADMIN_FIELDS.json's declared type/interfaceType/validator", () => {
    expect(ADMIN_FIELDS.json.type).toBe("json");
    expect(ADMIN_FIELDS.json.interfaceType).toBe("unknown");
    expect(ADMIN_FIELDS.json.validator).toBe("v.any()");
  });
});
