import { describe, it, expect } from "vitest";
import { variantFieldToValidator } from "./validator";
import { keyValueFieldToValidator } from "../keyValue";
import { variant } from "./config";
import { text, number, keyValue } from "../../index";

describe("variantFieldToValidator — discriminated", () => {
  it("a single variant stays a bare v.object()", () => {
    const field = variant({
      discriminator: "kind",
      required: true,
      variants: { email: { fields: { address: text({ required: true }) } } },
    });
    expect(variantFieldToValidator({ field })).toBe(
      'v.object({ kind: v.literal("email"), address: v.string() })',
    );
  });

  it("two variants combine with v.union(), required by default wraps nothing", () => {
    const field = variant({
      discriminator: "kind",
      required: true,
      variants: {
        email: { fields: { address: text({ required: true }) } },
        sms: { fields: { phoneNumber: text({ required: false }) } },
      },
    });
    expect(variantFieldToValidator({ field })).toBe(
      'v.union(\n' +
        '  v.object({ kind: v.literal("email"), address: v.string() }),\n' +
        '  v.object({ kind: v.literal("sms"), phoneNumber: v.optional(v.string()) })\n' +
        ')',
    );
  });

  it("optional (default) wraps the whole union in v.optional()", () => {
    const field = variant({
      discriminator: "kind",
      variants: {
        email: { fields: { address: text({ required: true }) } },
        sms: { fields: { phoneNumber: text({ required: true }) } },
      },
    });
    expect(variantFieldToValidator({ field })).toMatch(/^v\.optional\(v\.union\(/);
  });
});

describe("variantFieldToValidator — primitive", () => {
  it("a single member stays bare", () => {
    const field = variant({ required: true, variants: { fixed: text({ required: true }) } });
    expect(variantFieldToValidator({ field })).toBe("v.string()");
  });

  it("two members combine with v.union(), never wrapped in v.optional() individually", () => {
    const field = variant({ required: true, variants: { fixed: text(), metered: number() } });
    expect(variantFieldToValidator({ field })).toBe("v.union(v.string(), v.number())");
  });
});

describe("variantFieldToValidator — nested with keyValue()", () => {
  it("a variant() nested inside a keyValue()'s value generates a v.record of the variant's validator", () => {
    const field = keyValue({
      required: true,
      value: variant({
        required: true,
        discriminator: "kind",
        variants: { email: { fields: { address: text({ required: true }) } } },
      }),
    });
    expect(keyValueFieldToValidator({ field })).toBe(
      'v.record(v.string(), v.object({ kind: v.literal("email"), address: v.string() }))',
    );
  });

  it("a keyValue() nested inside a discriminated variant() member generates a v.record field on that member", () => {
    const field = variant({
      required: true,
      discriminator: "kind",
      variants: {
        tags: { fields: { labels: keyValue({ required: true, value: text({ required: true }) }) } },
      },
    });
    expect(variantFieldToValidator({ field })).toBe(
      'v.object({ kind: v.literal("tags"), labels: v.record(v.string(), v.string()) })',
    );
  });
});
