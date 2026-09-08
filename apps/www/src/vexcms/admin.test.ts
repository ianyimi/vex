import { text, TextFieldInput, type TextField } from "@vexcms/react"
import { runVexReactSuite, type FieldFixture } from "@vexcms/next/testing"

import { access } from "~/auth/access"

/**
 * Smoke test proving the shared test kit is wired up and runnable from this
 * app via `@vexcms/next/testing` (the Next-flavored re-export of
 * `@vexcms/react/testing`) — not a full contract run. `includeCore: false`
 * skips the ~600 core-field-type tests: those already run against the real
 * built `@vexcms/react` output from `apps/test` (see
 * `apps/test/src/vexcms/admin.test.ts`), and re-running them here would only
 * duplicate that coverage on every `www` test run.
 *
 * `metaTitleFixture` is this app's own `text` field configuration — not one
 * of the fixtures core registers in `fieldFixtures` — paired with the real,
 * publicly exported `TextFieldInput` to prove `custom` drives a
 * project-authored fixture through the same `runFieldInputContractSuite`
 * machinery every core field type runs through.
 */
const metaTitleFixture: FieldFixture<TextField, string> = {
  fieldType: "text",
  fieldDef: text({ label: "Meta Title", required: true }),
  valid: "About VexCMS",
  invalid: undefined,
  empty: undefined,
}

runVexReactSuite({
  includeCore: false,
  // Real VexAccessConfig this app ships — resolves through the real
  // VexAccessProvider, not a hand-typed stand-in.
  access,
  custom: [{ ...metaTitleFixture, Component: TextFieldInput }],
})
