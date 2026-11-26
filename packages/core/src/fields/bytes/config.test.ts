import { describe, it, expect } from "vitest";
import { bytes } from "./config";
import { ADMIN_FIELDS } from "../constants";

describe("bytes()", () => {
  it("defaults type, interfaceType, required, maxSize, and accept", () => {
    const field = bytes();
    expect(field.type).toBe("bytes");
    expect(field.interfaceType).toBe("ArrayBuffer");
    expect(field.required).toBe(false);
    expect(field.maxSize).toBe(524_288);
    expect(field.accept).toBe("");
    expect(field.defaultValue).toBeUndefined();
  });

  it("applies admin defaults", () => {
    const field = bytes();
    expect(field.admin).toMatchObject({
      hidden: false,
      readOnly: false,
      position: "main",
      width: "100%",
      cellAlignment: "left",
    });
  });

  it("carries a custom maxSize and accept through to the resolved field", () => {
    const field = bytes({ maxSize: 1024, accept: "application/octet-stream" });
    expect(field.maxSize).toBe(1024);
    expect(field.accept).toBe("application/octet-stream");
  });

  it("matches ADMIN_FIELDS.bytes's declared type/interfaceType/validator", () => {
    expect(ADMIN_FIELDS.bytes.type).toBe("bytes");
    expect(ADMIN_FIELDS.bytes.interfaceType).toBe("ArrayBuffer");
    expect(ADMIN_FIELDS.bytes.validator).toBe("v.bytes()");
  });
});
