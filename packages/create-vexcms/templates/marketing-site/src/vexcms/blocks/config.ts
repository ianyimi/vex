import { codeShowcaseBlock } from "./CodeShowcase/config"
import { ctaBlock } from "./CTA/config"
import { faqBlock } from "./FAQ/config"
import { featuresBlock } from "./Features/config"
import { footerBlock } from "./Footer/config"
import { headerBlock } from "./Header/config"
// Block configs only — no React/motion dependencies. Safe to import from
// collections, vex.config.ts, and convex/seed.ts.
import { heroBlock } from "./Hero/config"
import { howItWorksBlock } from "./HowItWorks/config"
import { roadmapBlock } from "./Roadmap/config"
import { splitBlock } from "./Split/config"
import { statsBlock } from "./Stats/config"

export const pageBlocks = [
  heroBlock,
  statsBlock,
  featuresBlock,
  codeShowcaseBlock,
  splitBlock,
  howItWorksBlock,
  roadmapBlock,
  faqBlock,
  ctaBlock,
]
export const headerBlocks = [headerBlock]
export const footerBlocks = [footerBlock]

export {
  codeShowcaseBlock,
  ctaBlock,
  faqBlock,
  featuresBlock,
  footerBlock,
  headerBlock,
  heroBlock,
  howItWorksBlock,
  roadmapBlock,
  splitBlock,
  statsBlock,
}
