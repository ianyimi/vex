/**
 * Page builder block definitions for VexCMS marketing pages.
 *
 * Each block follows the shadcnblocks.com convention — reusable, composable
 * sections that make up a typical marketing site (hero, features, pricing, etc.).
 */

import { contentBlock } from "./content"
import { ctaBlock } from "./cta"
import { faqBlock } from "./faq"
import { featureBlock } from "./feature"
import { heroBlock } from "./hero"
import { logoCloudBlock } from "./logo-cloud"
import { pricingBlock } from "./pricing"
import { statsBlock } from "./stats"
import { testimonialBlock } from "./testimonial"

export const pageBlocks = [
  heroBlock,
  featureBlock,
  ctaBlock,
  testimonialBlock,
  statsBlock,
  logoCloudBlock,
  faqBlock,
  pricingBlock,
  contentBlock,
]
