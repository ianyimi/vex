import { describe, it, expect } from "vitest";
import { variant } from "./config";
import { text, number, json } from "../../index";
import { VexConfigError } from "../../errors";

describe("variant() — discriminated mode", () => {
  it("resolves the discriminated interfaceType; a non-required field's defaultValue stays undefined — no variant is preselected", () => {
    const field = variant({
      discriminator: "kind",
      variants: {
        email: { label: "Email", fields: { address: text({ required: true }) } },
        sms: { label: "SMS", fields: { phoneNumber: text({ required: true }) } },
      },
    });
    expect(field.type).toBe("variant");
    expect(field.required).toBe(false);
    expect(field.nullable).toBe(false);
    expect(field.discriminator).toBe("kind");
    expect(field.interfaceType).toBe(
      '{ kind: "email"; address: string } | { kind: "sms"; phoneNumber: string }',
    );
    expect(field.defaultValue).toBeUndefined();
  });

  it("a required field's defaultValue materializes the first variant", () => {
    const field = variant({
      required: true,
      discriminator: "kind",
      variants: {
        email: { label: "Email", fields: { address: text({ required: true }) } },
        sms: { label: "SMS", fields: { phoneNumber: text({ required: true }) } },
      },
    });
    expect(field.defaultValue).toEqual({ kind: "email", address: "" });
  });

  it("an explicit defaultValue is honored even when not required", () => {
    const field = variant({
      discriminator: "kind",
      defaultValue: { kind: "sms", phoneNumber: "+1" },
      variants: {
        email: { label: "Email", fields: { address: text({ required: true }) } },
        sms: { label: "SMS", fields: { phoneNumber: text({ required: true }) } },
      },
    });
    expect(field.defaultValue).toEqual({ kind: "sms", phoneNumber: "+1" });
  });

  it("throws VexConfigError when a variant's fields declares the discriminator key", () => {
    expect(() =>
      variant({
        discriminator: "kind",
        variants: {
          email: { fields: { kind: text({ required: true }) } },
        },
      }),
    ).toThrow(
      new VexConfigError(
        'variant(): variant "email" declares a field named "kind", which is this field\'s own discriminator key. ' +
          "Rename the field, or the discriminator.",
      ),
    );
  });

  it("admin.defaultCollapsed defaults to false and is honored when set", () => {
    const field = variant({
      discriminator: "kind",
      variants: { email: { fields: { address: text({ required: true }) } } },
    });
    expect(field.admin.defaultCollapsed).toBe(false);

    const collapsed = variant({
      discriminator: "kind",
      admin: { defaultCollapsed: true },
      variants: { email: { fields: { address: text({ required: true }) } } },
    });
    expect(collapsed.admin.defaultCollapsed).toBe(true);
  });
});

describe("variant() — primitive mode", () => {
  it("forces member required:true and resolves the primitive interfaceType; a non-required field's defaultValue stays undefined — no member is preselected", () => {
    const field = variant({
      variants: { fixed: text({ required: false }), metered: number({ required: true }) },
    });
    expect(field.discriminator).toBeUndefined();
    expect(field.variants.fixed!.required).toBe(true);
    expect(field.interfaceType).toBe("string | number");
    expect(field.defaultValue).toBeUndefined();
  });

  it("a required field's defaultValue materializes the first member's own default", () => {
    const field = variant({
      required: true,
      variants: { fixed: text({ required: false }), metered: number({ required: true }) },
    });
    expect(field.defaultValue).toBe("");
  });

  it("throws VexConfigError when a member has no distinguishable runtime kind", () => {
    expect(() => variant({ variants: { fixed: text(), payload: json() } })).toThrow(
      new VexConfigError(
        'variant(): member "payload" (type "json") has no distinguishable runtime storage kind and cannot be ' +
          'used in a primitive variant() — give the field a "discriminator" to build an object union instead.',
      ),
    );
  });

  it("throws VexConfigError when two members share a runtime kind", () => {
    expect(() => variant({ variants: { fixed: text(), label: text() } })).toThrow(
      new VexConfigError(
        'variant(): members "fixed", "label" all store a "string" value at runtime — primitive variant() ' +
          "members must have distinct runtime kinds so the active member can be recovered from the stored value alone.",
      ),
    );
  });

  it("admin.defaultCollapsed defaults to false and is honored when set", () => {
    const field = variant({ variants: { fixed: text({ required: true }) } });
    expect(field.admin.defaultCollapsed).toBe(false);

    const collapsed = variant({
      admin: { defaultCollapsed: true },
      variants: { fixed: text({ required: true }) },
    });
    expect(collapsed.admin.defaultCollapsed).toBe(true);
  });
});

describe("variant() — empty variants", () => {
  it("throws VexConfigError for an empty variants record with a discriminator set", () => {
    expect(() => variant({ discriminator: "kind", variants: {} })).toThrow(
      new VexConfigError('variant(): "variants" requires at least one entry — an empty variant set has nothing to store.'),
    );
  });

  it("throws VexConfigError for an empty variants record with no discriminator", () => {
    expect(() => variant({ variants: {} })).toThrow(
      new VexConfigError('variant(): "variants" requires at least one entry — an empty variant set has nothing to store.'),
    );
  });
});
