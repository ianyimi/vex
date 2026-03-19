import React from "react";

/**
 * Props for a block component rendered by RenderBlocks.
 * Each block component receives its full block data plus the index.
 */
export interface BlockComponentProps<
  TBlock extends { blockType: string; _key: string } = {
    blockType: string;
    _key: string;
  },
> {
  /** The full block data object including blockType, _key, and all field values. */
  block: TBlock;
  /** The index of this block in the array (0-based). */
  index: number;
}

/**
 * A lightweight component that renders an ordered list of blocks using a component map.
 *
 * @param props.blocks - Array of block instances (each must have `blockType` and `_key`)
 * @param props.components - Map of blockType slug → React component
 * @param props.fallback - Optional component to render when a block's type has no matching component
 *
 * @example
 * ```tsx
 * import { RenderBlocks } from "@vexcms/ui"
 *
 * const components = {
 *   hero: HeroComponent,
 *   cta: CTAComponent,
 * }
 *
 * <RenderBlocks blocks={page.content} components={components} />
 * ```
 */
export function RenderBlocks<
  TBlock extends { blockType: string; blockName?: string; _key: string },
>(props: {
  blocks: TBlock[] | null | undefined;
  components: Record<string, React.ComponentType<BlockComponentProps<any>>>;
  fallback?: React.ComponentType<BlockComponentProps<any>>;
}): React.ReactElement | null {
  if (!props.blocks || props.blocks.length === 0) {
    return null;
  }

  const elements = props.blocks.map((block, index) => {
    const Component = props.components[block.blockType];
    if (Component) {
      return <Component block={block} index={index} key={block._key} />;
    }
    if (props.fallback) {
      const Fallback = props.fallback;
      return <Fallback block={block} index={index} key={block._key} />;
    }
    return null;
  });

  return <>{elements}</>;
}
