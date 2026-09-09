import { color, type ColorField } from "@vexcms/core";
import type { FieldFixture } from "../../../testing/fixtures/types";

/** Fixture for the `color` field type — hex notation, no theme-token tab. */
export const colorFieldFixture: FieldFixture<ColorField, string> = {
  fieldType: "color",
  fieldDef: color({ label: "Brand Color", required: true, format: "hex" }),
  valid: "#e8622a",
  invalid: undefined,
  empty: "",
};
