import type { BlockComponentProps } from "@vexcms/ui"
import type { ComponentType } from "react"

import {
  BLOCK_SLUG_CTA,
  BLOCK_SLUG_FAQ,
  BLOCK_SLUG_FEATURES,
  BLOCK_SLUG_FOOTER,
  BLOCK_SLUG_HEADER,
  BLOCK_SLUG_HERO,
  BLOCK_SLUG_HOW_IT_WORKS,
  BLOCK_SLUG_ROADMAP,
} from "./constants"
import CTABlock from "./CTA"
import FAQBlock from "./FAQ"
import FeaturesBlock from "./Features"
import FooterBlock from "./Footer"
import HeaderBlock from "./Header"
import HeroBlock from "./Hero"
import HowItWorksBlock from "./HowItWorks"
import RoadmapBlock from "./Roadmap"

/** Block component map for use with RenderBlocks */
export const blockComponents: Record<
  string,
  ComponentType<BlockComponentProps>
> = {
  [BLOCK_SLUG_CTA]: CTABlock,
  [BLOCK_SLUG_FAQ]: FAQBlock,
  [BLOCK_SLUG_FEATURES]: FeaturesBlock,
  [BLOCK_SLUG_FOOTER]: FooterBlock,
  [BLOCK_SLUG_HEADER]: HeaderBlock,
  [BLOCK_SLUG_HERO]: HeroBlock,
  [BLOCK_SLUG_HOW_IT_WORKS]: HowItWorksBlock,
  [BLOCK_SLUG_ROADMAP]: RoadmapBlock,
}

// Re-export configs for convenience in client code
export { allBlocks, footerBlocks, headerBlocks, pageBlocks } from "./config"
