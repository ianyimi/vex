import type { AdminFieldType } from "@vexcms/core";
import type { FieldFixture } from "./types";
import { textFieldFixture } from "../../components/fields/text/testFixture";
import { numberFieldFixture } from "../../components/fields/number/testFixture";
import { checkboxFieldFixture } from "../../components/fields/checkbox/testFixture";
import { urlFieldFixture } from "../../components/fields/url/testFixture";
import { colorFieldFixture } from "../../components/fields/color/testFixture";
import { selectFieldFixture } from "../../components/fields/select/testFixture";
import { dateFieldFixture } from "../../components/fields/date/testFixture";
import { uploadFieldFixture } from "../../components/fields/upload/testFixture";
import { relationshipFieldFixture } from "../../components/fields/relationship/testFixture";
import { arrayFieldFixture } from "../../components/fields/array/testFixture";
import { groupFieldFixture } from "../../components/fields/group/testFixture";
import { blocksFieldFixture } from "../../components/fields/blocks/testFixture";
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
export const fieldFixtures: Record<AdminFieldType, FieldFixture> = {
  text: textFieldFixture,
  number: numberFieldFixture,
  checkbox: checkboxFieldFixture,
  url: urlFieldFixture,
  color: colorFieldFixture,
  select: selectFieldFixture,
  date: dateFieldFixture,
  upload: uploadFieldFixture,
  relationship: relationshipFieldFixture,
  array: arrayFieldFixture,
  group: groupFieldFixture,
  blocks: blocksFieldFixture,
};
