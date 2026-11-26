import { describe, it, expect } from "vitest";
import { variantFieldToInputSchema } from "./inputSchema";
import { keyValueFieldToInputSchema } from "../keyValue";
import { variant } from "./config";
import { text, number, keyValue } from "../../index";

const channel = variant({
  required: true,
  discriminator: "kind",
  variants: {
    email: { fields: { address: text({ required: true }) } },
    sms: { fields: { phoneNumber: text({ required: true }) } },
  },
});

describe("variantFieldToInputSchema — discriminated", () => {
  it("parses a valid value for each variant", () => {
    const schema = variantFieldToInputSchema({ field: channel });
    expect(schema.parse({ kind: "email", address: "a@b.com" })).toEqual({
      kind: "email",
      address: "a@b.com",
    });
    expect(schema.parse({ kind: "sms", phoneNumber: "+15551234567" })).toEqual({
      kind: "sms",
      phoneNumber: "+15551234567",
    });
  });

  it("rejects a variant missing its own required field", () => {
    const schema = variantFieldToInputSchema({ field: channel });
    expect(schema.safeParse({ kind: "email" }).success).toBe(false);
  });

  it("rejects an unknown discriminant value", () => {
    const schema = variantFieldToInputSchema({ field: channel });
    expect(schema.safeParse({ kind: "fax", address: "x" }).success).toBe(false);
  });

  it("rejects an unknown discriminant value even on the condition-aware superRefine path (S7 regression)", () => {
    const conditional = variant({
      required: true,
      discriminator: "kind",
      variants: {
        email: { fields: { address: text({ required: true, admin: { condition: () => true } }) } },
        sms: { fields: { phoneNumber: text({ required: true }) } },
      },
    });
    const schema = variantFieldToInputSchema({ field: conditional, data: {} });
    const result = schema.safeParse({ kind: "fax", address: "x" });
    expect(result.success).toBe(false);
  });

  it("a non-required field accepts an absent/undefined value — no variant is preselected or forced", () => {
    const optional = variant({
      discriminator: "kind",
      variants: {
        email: { fields: { address: text({ required: true }) } },
        sms: { fields: { phoneNumber: text({ required: true }) } },
      },
    });
    const schema = variantFieldToInputSchema({ field: optional });
    expect(schema.parse(undefined)).toBeUndefined();
    expect(schema.safeParse(undefined).success).toBe(true);
  });
});

describe("variantFieldToInputSchema — primitive", () => {
  const amount = variant({ required: true, variants: { fixed: text({ required: true }), metered: number({ required: true }) } });

  it("parses a valid value for each member", () => {
    const schema = variantFieldToInputSchema({ field: amount });
    expect(schema.parse("flat rate")).toBe("flat rate");
    expect(schema.parse(42)).toBe(42);
  });

  it("rejects a value matching neither member's schema", () => {
    const schema = variantFieldToInputSchema({ field: amount });
    expect(schema.safeParse(true).success).toBe(false);
  });

  it("a non-required field accepts an absent/undefined value — no member is preselected or forced", () => {
    const optionalAmount = variant({
      variants: { fixed: text({ required: true }), metered: number({ required: true }) },
    });
    const schema = variantFieldToInputSchema({ field: optionalAmount });
    expect(schema.parse(undefined)).toBeUndefined();
    expect(schema.safeParse(undefined).success).toBe(true);
  });
});

describe("variantFieldToInputSchema — nested with keyValue()", () => {
  it("a variant() nested inside a keyValue()'s value validates each record entry against the variant", () => {
    const field = keyValue({
      required: true,
      value: variant({
        required: true,
        discriminator: "kind",
        variants: { email: { fields: { address: text({ required: true }) } } },
      }),
    });
    const schema = keyValueFieldToInputSchema({ field });
    expect(schema.parse({ primary: { kind: "email", address: "a@b.com" } })).toEqual({
      primary: { kind: "email", address: "a@b.com" },
    });
    expect(schema.safeParse({ primary: { kind: "email" } }).success).toBe(false);
  });

  it("a keyValue() nested inside a discriminated variant() member validates that member's own record entries", () => {
    const withKeyValueMember = variant({
      required: true,
      discriminator: "kind",
      variants: {
        tags: { fields: { labels: keyValue({ required: true, value: text({ required: true }) }) } },
      },
    });
    const schema = variantFieldToInputSchema({ field: withKeyValueMember });
    expect(schema.parse({ kind: "tags", labels: { a: "x" } })).toEqual({ kind: "tags", labels: { a: "x" } });
    expect(schema.safeParse({ kind: "tags", labels: { a: 5 } }).success).toBe(false);
  });
});
