import { blocks, defineBlock, text, type BlocksField, type GenericBlock } from "@vexcms/core";
import type { FieldFixture } from "../../../testing/fixtures/types";

const paragraphBlock = defineBlock({
  slug: "paragraph",
  label: "Paragraph",
  fields: { text: text({ label: "Text", required: true }) },
});

/**
 * `blocks` field fixture — the container's OWN contract. A single
 * `paragraph` block type keeps this fixture's own add/remove/round-trip
 * generic; nested-child coverage across every field type lives in
 * `runNestedFieldContainerSuite`, not here.
 *
 * `required: true` makes an empty array fail validation (`blocksFieldToInputSchema`'s
 * `.min(1, "This field is required.")`) — `min`/`max` count constraints are only
 * enforced when the field is required (an optional field's own default is `[]`,
 * which would otherwise always fail its own `min`), so `min: 1` alone no longer
 * makes `[]` invalid on an optional field.
 */
export const blocksFieldFixture: FieldFixture<BlocksField, GenericBlock[]> = {
  fieldType: "blocks",
  fieldDef: blocks({
    label: "Body",
    blocks: [paragraphBlock],
    required: true,
    min: 1,
  }),
  valid: [{ id: "block-1", blockType: "paragraph", blockName: "Paragraph", text: "Hello world" }],
  invalid: [],
  empty: [],
};
