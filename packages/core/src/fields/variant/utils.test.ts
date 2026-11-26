import { describe, it, expect } from "vitest";
import {
  classifyVariantMemberKind,
  classifyVariantValueKind,
  resolveVariantMemberSeedDefault,
  buildDefaultVariantMember,
  VARIANT_MEMBER_KINDS,
} from "./utils";
import { text, number, checkbox } from "../../index";

describe("resolveVariantMemberSeedDefault", () => {
  it("falls back to null for a number() field with no explicit defaultValue (its own default, no special-casing)", () => {
    const field = number({ required: true });
    expect(field.defaultValue).toBeUndefined();
    expect(resolveVariantMemberSeedDefault(field)).toBeNull();
  });

  it("honors an explicit defaultValue on a number() field, including 0", () => {
    const field = number({ required: true, defaultValue: 0 });
    expect(resolveVariantMemberSeedDefault(field)).toBe(0);
  });

  it("seeds the field's own defaultValue for a non-number field", () => {
    const field = text({ required: true });
    expect(resolveVariantMemberSeedDefault(field)).toBe("");
  });

  it("falls back to null when a field has no defaultValue", () => {
    const field = checkbox();
    expect(resolveVariantMemberSeedDefault(field)).toBe(field.defaultValue ?? null);
  });
});

describe("buildDefaultVariantMember — number sub-fields seed empty unless an explicit defaultValue is set", () => {
  it("seeds a number() sub-field as null with no explicit defaultValue", () => {
    const member = {
      label: "Metered",
      fields: { price: number({ required: true }) },
      interfaceType: '{ kind: "metered"; price: number }',
    };
    const result = buildDefaultVariantMember({ discriminator: "kind", key: "metered", member });
    expect(result).toEqual({ kind: "metered", price: null });
  });

  it("seeds a number() sub-field from an explicit defaultValue, including 0", () => {
    const member = {
      label: "Metered",
      fields: { price: number({ required: true, defaultValue: 0 }) },
      interfaceType: '{ kind: "metered"; price: number }',
    };
    const result = buildDefaultVariantMember({ discriminator: "kind", key: "metered", member });
    expect(result).toEqual({ kind: "metered", price: 0 });
  });

  it("still seeds a non-number sub-field from its own defaultValue", () => {
    const member = {
      label: "Email",
      fields: { address: text({ required: true }) },
      interfaceType: '{ kind: "email"; address: string }',
    };
    const result = buildDefaultVariantMember({ discriminator: "kind", key: "email", member });
    expect(result).toEqual({ kind: "email", address: "" });
  });
});

describe("classifyVariantMemberKind / classifyVariantValueKind — sanity", () => {
  it("classifies a number() field as the number kind", () => {
    expect(classifyVariantMemberKind({ field: number({ required: true }) })).toBe(VARIANT_MEMBER_KINDS.number);
  });

  it("classifies an undefined value as null", () => {
    expect(classifyVariantValueKind(undefined)).toBe("null");
  });
});
