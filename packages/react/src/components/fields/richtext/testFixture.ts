import {
  ADMIN_FIELDS,
  richtext,
  type RichTextDocument,
  type RichTextField,
} from "@vexcms/core";
import type { FieldFixture } from "../../../testing/fixtures/types";

/** A representative two-paragraph document — enough to exercise the cell's plain-text excerpt. */
const VALID_DOCUMENT: RichTextDocument = [
  { type: "p", children: [{ text: "Hello world" }] },
  { type: "p", children: [{ text: "Second paragraph." }] },
];

/** Fixture for the `richtext` field type — `required: true` makes `invalid` (`undefined`) a real validation failure. */
export const richTextFieldFixture: FieldFixture<
  RichTextField,
  RichTextDocument
> = {
  fieldType: ADMIN_FIELDS.richtext.type,
  fieldDef: richtext({ label: "Body", required: true }),
  valid: VALID_DOCUMENT,
  invalid: undefined,
  empty: [],
};
