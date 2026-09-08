import { text, TextFieldInput, type TextField } from "@vexcms/react";
import { runVexReactSuite, type FieldFixture } from "@vexcms/next/testing";
import { access } from "~/auth/access";

/**
 * This app's own `text` field configuration — not one of the fixtures core
 * registers in `fieldFixtures`. Paired with the real, publicly exported
 * `TextFieldInput` (the exact component every core `text` field renders
 * through) to prove `runVexReactSuite`'s `custom` array drives a
 * project-authored fixture through the identical `runFieldInputContractSuite`
 * machinery every core field type runs through — no separate code path for
 * app-supplied fields.
 */
const pageSlugFixture: FieldFixture<TextField, string> = {
  fieldType: "text",
  fieldDef: text({ label: "Page Slug", required: true }),
  valid: "about-us",
  invalid: undefined,
  empty: undefined,
};

runVexReactSuite({
  // Real VexAccessConfig this app ships — resolves through the real
  // VexAccessProvider, not a hand-typed stand-in.
  access,
  custom: [{ ...pageSlugFixture, Component: TextFieldInput }],
});
