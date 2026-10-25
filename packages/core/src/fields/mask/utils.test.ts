import { describe, expect, it } from "vitest";
import { resolveFieldMask } from "./utils";

describe("resolveFieldMask", () => {
  it("returns undefined when neither the field nor the project configures a mask", () => {
    expect(
      resolveFieldMask({
        fieldType: "text",
        fieldMask: undefined,
        inputMasks: {},
      }),
    ).toBeUndefined();
  });

  it("normalizes a bare string mask", () => {
    expect(
      resolveFieldMask({
        fieldType: "text",
        fieldMask: "(999) 999-9999",
        inputMasks: {},
      }),
    ).toEqual({ mask: "(999) 999-9999", storeMasked: false, options: {} });
  });

  it("normalizes an array mask", () => {
    expect(
      resolveFieldMask({
        fieldType: "text",
        fieldMask: ["999-999", "999-999-999"],
        inputMasks: {},
      }),
    ).toEqual({
      mask: ["999-999", "999-999-999"],
      storeMasked: false,
      options: {},
    });
  });

  it("normalizes the object form with storeMasked and options", () => {
    expect(
      resolveFieldMask({
        fieldType: "number",
        fieldMask: {
          mask: "decimal",
          storeMasked: true,
          options: { radixPoint: "." },
        },
        inputMasks: {},
      }),
    ).toEqual({
      mask: "decimal",
      storeMasked: true,
      options: { radixPoint: "." },
    });
  });

  it("falls back to the project default when the field sets no mask", () => {
    expect(
      resolveFieldMask({
        fieldType: "number",
        fieldMask: undefined,
        inputMasks: { number: "decimal" },
      }),
    ).toEqual({ mask: "decimal", storeMasked: false, options: {} });
  });

  it("the field's own mask overrides the project default", () => {
    expect(
      resolveFieldMask({
        fieldType: "number",
        fieldMask: "integer",
        inputMasks: { number: "decimal" },
      }),
    ).toEqual({ mask: "integer", storeMasked: false, options: {} });
  });

  it("admin.mask: false disables masking even with a project default", () => {
    expect(
      resolveFieldMask({
        fieldType: "number",
        fieldMask: false,
        inputMasks: { number: "decimal" },
      }),
    ).toBeUndefined();
  });
});
