// Block configs only — no React/motion dependencies
// Safe to import from collections and server-side code
import { heroBlock } from "./Hero/config"
import { featuresBlock } from "./Features/config"
import { ctaBlock } from "./CTA/config"
import { faqBlock } from "./FAQ/config"
import { headerBlock } from "./Header/config"
import { footerBlock } from "./Footer/config"
import { howItWorksBlock } from "./HowItWorks/config"
import { roadmapBlock } from "./Roadmap/config"

/** Page content block definitions */
export const pageBlocks = [
  heroBlock,
  featuresBlock,
  howItWorksBlock,
  roadmapBlock,
  ctaBlock,
  faqBlock,
]

/** Header block definitions */
export const headerBlocks = [headerBlock]

/** Footer block definitions */
export const footerBlocks = [footerBlock]

/** All block definitions combined */
export const allBlocks = [...pageBlocks, ...headerBlocks, ...footerBlocks]

export {
  heroBlock,
  featuresBlock,
  ctaBlock,
  faqBlock,
  headerBlock,
  footerBlock,
  howItWorksBlock,
  roadmapBlock,
}
