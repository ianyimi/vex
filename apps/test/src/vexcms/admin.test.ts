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
  // Dogfood host: `sections` is deliberately OMITTED so this app runs every
  // `VexSuiteSection` there is — and automatically picks up any section added to
  // the kit later, which an enumerated list here would silently skip. This is the
  // one place the whole contract runs against the real built `@vexcms/react`
  // output, so it is where ADR-009-class dual-context defects surface.
  // apps/www names a narrower, faster subset instead (see its own admin.test.ts).
  // Real VexAccessConfig this app ships — resolves through the real
  // VexAccessProvider, not a hand-typed stand-in.
  access,
  custom: [{ ...pageSlugFixture, Component: TextFieldInput }],
});
