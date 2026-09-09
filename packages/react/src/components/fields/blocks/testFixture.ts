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
 * `min: 1` makes an empty array fail validation via `blocksFieldToInputSchema`'s
 * outer `z.array(itemSchema).min(...)`.
 */
export const blocksFieldFixture: FieldFixture<BlocksField, GenericBlock[]> = {
  fieldType: "blocks",
  fieldDef: blocks({
    label: "Body",
    blocks: [paragraphBlock],
    min: 1,
  }),
  valid: [{ id: "block-1", blockType: "paragraph", blockName: "Paragraph", text: "Hello world" }],
  invalid: [],
  empty: [],
};
