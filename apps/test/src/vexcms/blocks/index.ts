import type { BlockComponentProps } from "@vexcms/react"
import type { ComponentType } from "react"

import CodeShowcaseBlock from "./CodeShowcase"
import {
  BLOCK_SLUG_CODE_SHOWCASE,
  BLOCK_SLUG_CTA,
  BLOCK_SLUG_FAQ,
  BLOCK_SLUG_FEATURES,
  BLOCK_SLUG_FOOTER,
  BLOCK_SLUG_HEADER,
  BLOCK_SLUG_HERO,
  BLOCK_SLUG_HOW_IT_WORKS,
  BLOCK_SLUG_ROADMAP,
  BLOCK_SLUG_SPLIT,
  BLOCK_SLUG_STATS,
} from "./constants"
import ContentBlock from "./Content"
import CTABlock from "./CTA"
import FAQBlock from "./FAQ"
import FeatureBlock from "./Feature"
import FeaturesBlock from "./Features"
import FooterBlock from "./Footer"
import HeaderBlock from "./Header"
import HeroBlock from "./Hero"
import HowItWorksBlock from "./HowItWorks"
import LogoCloudBlock from "./LogoCloud"
import PricingBlock from "./Pricing"
import RoadmapBlock from "./Roadmap"
import SplitBlock from "./Split"
import StatsBlock from "./Stats"
import TestimonialBlock from "./Testimonial"

/**
 * Block component map for `RenderBlocks` (Contract 1). Loosely typed as
 * `Record<string, …>` rather than a `TBlock`-keyed `BlockComponents<…>` —
 * the real per-slug `PageBlock` union only exists after `vex generate` runs
 * against this config, so this file can't reference it.
 *
 * Includes www's real-site blocks (constant-keyed) plus test-only blocks
 * (literal-keyed, no www equivalent — "feature", "testimonial", "logo-cloud",
 * "pricing", "content").
 */
export const blockComponents: Record<string, ComponentType<BlockComponentProps>> = {
  [BLOCK_SLUG_CODE_SHOWCASE]: CodeShowcaseBlock,
  [BLOCK_SLUG_CTA]: CTABlock,
  [BLOCK_SLUG_FAQ]: FAQBlock,
  [BLOCK_SLUG_FEATURES]: FeaturesBlock,
  [BLOCK_SLUG_FOOTER]: FooterBlock,
  [BLOCK_SLUG_HEADER]: HeaderBlock,
  [BLOCK_SLUG_HERO]: HeroBlock,
  [BLOCK_SLUG_HOW_IT_WORKS]: HowItWorksBlock,
  [BLOCK_SLUG_ROADMAP]: RoadmapBlock,
  [BLOCK_SLUG_SPLIT]: SplitBlock,
  [BLOCK_SLUG_STATS]: StatsBlock,
  // Test-only blocks
  content: ContentBlock,
  feature: FeatureBlock,
  "logo-cloud": LogoCloudBlock,
  pricing: PricingBlock,
  testimonial: TestimonialBlock,
}

export { footerBlocks, headerBlocks, pageBlocks } from "./config"
