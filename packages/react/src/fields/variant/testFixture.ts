import { number, variant, text, type VariantField } from "@vexcms/core";
import type { FieldFixture } from "../../testing/fixtures/types";

/**
 * Shared field-input/cell contract-suite fixture for a discriminated
 * `variant()` field — a `"kind"`-discriminated `email`/`sms` channel with a
 * required `text()` member field. The registered `fieldFixtures.variant`
 * entry — `vitest run src/testing src/fields` and apps/test's
 * `runVexReactSuite()` both exercise it automatically.
 */
export const variantFieldFixture: FieldFixture<VariantField, Record<string, unknown>> = {
  fieldType: "variant",
  fieldDef: variant({
    label: "Channel",
    discriminator: "kind",
    variants: {
      email: { label: "Email", fields: { address: text({ label: "Address", required: true }) } },
      sms: { label: "SMS", fields: { phoneNumber: text({ label: "Phone number", required: true }) } },
    },
  }),
  valid: { kind: "email", address: "a@b.com" },
  invalid: { kind: "email" },
  empty: { kind: "email", address: "" },
};

/**
 * Shared field-input contract-suite fixture for a PRIMITIVE `variant()`
 * field — a `fixed`/`metered` amount whose active member is a labelled
 * `text()`/`number()` control bound to the field's own path. Not a
 * `DataFieldType`-keyed registry entry (the registry holds one fixture per
 * type; `variantFieldFixture` above is primitive mode's discriminated
 * sibling) — run directly via `runFieldInputContractSuite` from
 * `contractSuite.test.tsx`, which exercises the id-collision case the
 * discriminated fixture can't: the active member's own control and label
 * share `id`/`for` with the variant field itself.
 */
export const primitiveVariantFieldFixture: FieldFixture<VariantField, unknown> = {
  fieldType: "variant",
  fieldDef: variant({
    label: "Amount",
    variants: {
      fixed: text({ label: "Fixed", required: true }),
      metered: number({ label: "Metered", required: true }),
    },
  }),
  valid: "flat rate",
  invalid: true,
  empty: "",
};
