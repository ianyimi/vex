import type { DataFieldType } from "@vexcms/core";
import type { FieldFixture } from "./types";
import { textFieldFixture } from "../../fields/text/testFixture";
import { emailFieldFixture } from "../../fields/email/testFixture";
import { textareaFieldFixture } from "../../fields/textarea/testFixture";
import { jsonFieldFixture } from "../../fields/json/testFixture";
import { bytesFieldFixture } from "../../fields/bytes/testFixture";
import { numberFieldFixture, int64NumberFieldFixture } from "../../fields/number/testFixture";
import { checkboxFieldFixture } from "../../fields/checkbox/testFixture";
import { urlFieldFixture } from "../../fields/url/testFixture";
import { colorFieldFixture } from "../../fields/color/testFixture";
import { selectFieldFixture, scalarSelectFieldFixture } from "../../fields/select/testFixture";
import { dateFieldFixture } from "../../fields/date/testFixture";
import { commitTsFieldFixture } from "../../fields/commitTs/testFixture";
import { uploadFieldFixture } from "../../fields/upload/testFixture";
import { relationshipFieldFixture, scalarRelationshipFieldFixture } from "../../fields/relationship/testFixture";
import { arrayFieldFixture } from "../../fields/array/testFixture";
import { groupFieldFixture } from "../../fields/group/testFixture";
import { keyValueFieldFixture } from "../../fields/keyValue/testFixture";
import { blocksFieldFixture } from "../../fields/blocks/testFixture";
import { richTextFieldFixture } from "../../fields/richtext/testFixture";
import { variantFieldFixture, primitiveVariantFieldFixture } from "../../fields/variant/testFixture";
// Each remaining per-type fixture is imported from that field type's OWN folder
// as later steps add it.

/**
 * Registry of one representative `FieldFixture` per admin field type. Empty until steps
 * 5–12 each add one import (from that field type's own
 * `components/fields/<type>/testFixture.ts`) plus one entry (`text: textFieldFixture`,
 * etc.) — this file stays a pure aggregation point, never gains fixture logic or data of
 * its own.
 *
 * `runVexReactSuite` iterates this registry to run the shared field-input contract
 * against every registered type, and `testing/fixtures/index.test.tsx` (step 12) asserts
 * its keys match `ADMIN_FIELDS`'s, so a forgotten entry fails loudly instead of silently
 * skipping coverage.
 */
export const fieldFixtures: Record<DataFieldType, FieldFixture> = {
  text: textFieldFixture,
  email: emailFieldFixture,
  textarea: textareaFieldFixture,
  json: jsonFieldFixture,
  bytes: bytesFieldFixture,
  number: numberFieldFixture,
  checkbox: checkboxFieldFixture,
  url: urlFieldFixture,
  color: colorFieldFixture,
  select: selectFieldFixture,
  date: dateFieldFixture,
  commitTs: commitTsFieldFixture,
  upload: uploadFieldFixture,
  relationship: relationshipFieldFixture,
  array: arrayFieldFixture,
  group: groupFieldFixture,
  keyValue: keyValueFieldFixture,
  blocks: blocksFieldFixture,
  richtext: richTextFieldFixture,
  variant: variantFieldFixture,
};

/**
 * Additional `FieldFixture`s per type, beyond `fieldFixtures`' one
 * representative — for a field type with more than one materially distinct
 * shape (`variant()`'s discriminated vs. primitive mode render, label, and
 * id/control wiring differently enough that one fixture can't exercise
 * both). Every `runVexReactSuite` loop that iterates `fieldFixtures` (the
 * `fields`/`cells`/`columnDefs` sections) also runs each type's own
 * entries here through the same contract suite, so a type stays covered
 * end to end without `fieldFixtures` itself needing to become an array —
 * every OTHER consumer that expects exactly one fixture per type
 * (`fieldToInputComponent`-keyed lookups, docs, `apps/test`'s `custom`
 * usage) is unaffected.
 */
export const extraFieldFixtures: Partial<Record<DataFieldType, FieldFixture[]>> = {
  number: [int64NumberFieldFixture],
  select: [scalarSelectFieldFixture],
  relationship: [scalarRelationshipFieldFixture],
  variant: [primitiveVariantFieldFixture],
};
