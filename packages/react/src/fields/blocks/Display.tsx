"use client";

import {
  isDisplayValueEmpty,
  type BlocksField,
  type DisplayComponentProps,
  type GenericBlock,
  type TDocument,
} from "@vexcms/core";
import { DisplayFieldList } from "../DisplayFieldList";

/**
 * Blocks field read-only display, registered as `reactAdapter.fields.blocks.display`.
 *
 * Shows every block item, numbered and labeled with its OWN block type
 * (the matching `BlockConfig.label`, falling back to the raw `blockType`
 * when the block type was since removed from `props.field.blocks`), then
 * its own data fields via `DisplayFieldList` — the same recursive body
 * `group/Display.tsx` uses. NOT `BlocksFieldCell`'s `"N blocks"` count —
 * a list-column concern, no room for every block's own fields there.
 *
 * @param props - Component props.
 * @returns One numbered, block-type-labeled item per block, or an em-dash for an empty value.
 */
export function BlocksFieldDisplay<TData extends TDocument = TDocument>(
  props: DisplayComponentProps<BlocksField, TData>,
) {
  const value = (props.value ?? []) as GenericBlock[];
  if (isDisplayValueEmpty(value)) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <ol className="space-y-2">
      {value.map((block, index) => {
        const blockConfig = props.field.blocks.find((b) => b.blockType === block.blockType);
        return (
          <li key={block.id ?? index} className="rounded-md border border-border/60 px-2 py-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              [{index + 1}] {blockConfig?.label ?? block.blockType}
            </p>
            <div className="mt-1">
              {blockConfig ? (
                <DisplayFieldList
                  fields={blockConfig.fields}
                  values={block as Record<string, unknown>}
                  document={props.document}
                  collection={props.collection}
                />
              ) : (
                <span className="text-sm text-muted-foreground">
                  Unknown block type — not configured on this field.
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
