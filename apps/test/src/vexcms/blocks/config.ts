import { codeShowcaseBlock } from "./CodeShowcase/config"
import { contentBlock } from "./Content/config"
import { ctaBlock } from "./CTA/config"
import { faqBlock } from "./FAQ/config"
import { featureBlock } from "./Feature/config"
import { featuresBlock } from "./Features/config"
import { footerBlock } from "./Footer/config"
import { headerBlock } from "./Header/config"
// Block configs only — no React/motion dependencies. Safe to import from
// collections, vex.config.ts, and convex/seed.ts.
import { heroBlock } from "./Hero/config"
import { howItWorksBlock } from "./HowItWorks/config"
import { logoCloudBlock } from "./LogoCloud/config"
import { pricingBlock } from "./Pricing/config"
import { roadmapBlock } from "./Roadmap/config"
import { splitBlock } from "./Split/config"
import { statsBlock } from "./Stats/config"
import { testimonialBlock } from "./Testimonial/config"

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
  // Test-only blocks — no www equivalent, kept for extra field-type coverage.
  featureBlock,
  testimonialBlock,
  logoCloudBlock,
  pricingBlock,
  contentBlock,
]
export const headerBlocks = [headerBlock]
export const footerBlocks = [footerBlock]

export {
  codeShowcaseBlock,
  contentBlock,
  ctaBlock,
  faqBlock,
  featureBlock,
  featuresBlock,
  footerBlock,
  headerBlock,
  heroBlock,
  howItWorksBlock,
  logoCloudBlock,
  pricingBlock,
  roadmapBlock,
  splitBlock,
  statsBlock,
  testimonialBlock,
}
