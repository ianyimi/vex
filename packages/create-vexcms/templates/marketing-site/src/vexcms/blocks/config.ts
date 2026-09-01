// Block configs only — no React/motion dependencies. Safe to import from
// collections, vex.config.ts, and convex/seed.ts.
import { heroBlock } from "./Hero/config"
import { featuresBlock } from "./Features/config"
import { howItWorksBlock } from "./HowItWorks/config"
import { roadmapBlock } from "./Roadmap/config"
import { ctaBlock } from "./CTA/config"
import { faqBlock } from "./FAQ/config"
import { headerBlock } from "./Header/config"
import { footerBlock } from "./Footer/config"

export const pageBlocks = [heroBlock, featuresBlock, howItWorksBlock, roadmapBlock, ctaBlock, faqBlock]
export const headerBlocks = [headerBlock]
export const footerBlocks = [footerBlock]

export {
  heroBlock,
  featuresBlock,
  howItWorksBlock,
  roadmapBlock,
  ctaBlock,
  faqBlock,
  headerBlock,
  footerBlock,
}
