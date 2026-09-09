import { url, type UrlField } from "@vexcms/core";
import type { FieldFixture } from "../../../testing/fixtures/types";

/**
 * Fixture for the `url` field type.
 *
 * `UrlFieldInput` renders `type="text"`, not the browser's native
 * `type="url"` — format validation is deferred entirely to
 * `urlFieldToInputSchema` at submit time (`packages/react/src/components/fields/url/Input.tsx`).
 */
export const urlFieldFixture: FieldFixture<UrlField, string> = {
  fieldType: "url",
  fieldDef: url({ label: "Website", required: true }),
  valid: "https://example.com",
  invalid: undefined,
  empty: "",
};
