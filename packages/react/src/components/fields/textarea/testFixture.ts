import { textarea, type TextareaField } from "@vexcms/core";
import type { FieldFixture } from "../../../testing/fixtures/types";

/**
 * `textarea` field fixture — drives `runFieldInputContractSuite` in
 * `components/fields/textarea/Input.test.tsx` and `runFieldCellContractSuite`
 * in `Cell.test.tsx`. `valid` is deliberately multi-line — it exercises the
 * Cell's single-line collapsing behavior.
 */
export const textareaFieldFixture: FieldFixture<TextareaField, string> = {
  fieldType: "textarea",
  fieldDef: textarea({ label: "Bio", required: true }),
  valid: "First line\nSecond line",
  invalid: undefined,
  empty: undefined,
};
