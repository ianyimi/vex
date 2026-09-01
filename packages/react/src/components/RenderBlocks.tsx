import type { ComponentType, ReactNode } from "react";

/** Minimal structural shape `RenderBlocks` needs from a block value. */
export interface RenderableBlock {
  /** Unique per-block id assigned by the blocks field — used as the React key. */
  id: string;
  /** Discriminant naming which block config produced this value. */
  blockType: string;
}

/**
 * Props every block renderer receives: the block value, narrowed to the
 * renderer's own variant when the components map is keyed by a generated
 * union.
 */
export interface BlockComponentProps<TBlock extends RenderableBlock = RenderableBlock> {
  block: TBlock;
}

/**
 * Map from a block union's `blockType` discriminants to their renderers.
 *
 * Keyed by `TBlock["blockType"]` with each entry receiving the
 * `Extract`-narrowed variant — a map typed against a generated union
 * (e.g. `PageBlock`) gets per-renderer field autocomplete, and object
 * literals get excess-property errors on typo'd keys.
 */
export type BlockComponents<TBlock extends RenderableBlock> = {
  [K in TBlock["blockType"]]?: ComponentType<
    BlockComponentProps<Extract<TBlock, { blockType: K }>>
  >;
};

/** Props for {@link RenderBlocks}. */
export interface RenderBlocksProps<TBlock extends RenderableBlock> {
  /** The value of a `blocks()` field; `null`/`undefined` renders nothing. */
  blocks: readonly TBlock[] | null | undefined;
  /** Renderer per block type. A missing entry falls through to `fallback`. */
  components: BlockComponents<TBlock>;
  /**
   * Rendered for a `blockType` with no `components` entry — a document can
   * carry blocks a site no longer registers. Omitted → the block is skipped.
   */
  fallback?: ComponentType<BlockComponentProps<TBlock>>;
}

/**
 * Dispatches a blocks-field value to per-type renderers in document order.
 *
 * Replaces the hand-written `switch (block.blockType)` pattern. Keys are
 * `block.id` — unique per entry, stable across reorders in the admin panel.
 *
 * @param props - Blocks value, per-type renderer map, and optional fallback.
 * @param props.blocks - Blocks array from a document's blocks field.
 * @param props.components - `blockType` → renderer map.
 * @param props.fallback - Optional renderer for unregistered block types.
 * @returns The rendered sequence, or `null` for an empty/absent array.
 */
export function RenderBlocks<TBlock extends RenderableBlock>(
  props: RenderBlocksProps<TBlock>,
): ReactNode {
  const { blocks, components, fallback: Fallback } = props;
  if (!blocks || blocks.length === 0) return null;

  return (
    <>
      {blocks.map((block) => {
        // The per-variant map cannot be indexed soundly with the erased
        // union type — safe here because entry K only ever receives blocks
        // whose blockType === K.
        const Component = components[block.blockType as TBlock["blockType"]] as
          | ComponentType<BlockComponentProps<TBlock>>
          | undefined;
        if (Component) return <Component block={block} key={block.id} />;
        if (Fallback) return <Fallback block={block} key={block.id} />;
        return null;
      })}
    </>
  );
}
