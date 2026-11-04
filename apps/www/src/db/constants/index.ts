import { type Doc, type Id } from "@convex/_generated/dataModel"

export * from "./auth"

// Better Auth
export const TABLE_SLUG_USERS = "user" as const
export type UserDoc = Doc<typeof TABLE_SLUG_USERS>
export type UserID = Id<typeof TABLE_SLUG_USERS>

export const TABLE_SLUG_ACCOUNTS = "account" as const

export const TABLE_SLUG_SESSIONS = "session" as const
export type Session = Doc<typeof TABLE_SLUG_SESSIONS>
export type SessionID = Id<typeof TABLE_SLUG_SESSIONS>

export const TABLE_SLUG_VERIFICATIONS = "verification" as const
export const TABLE_SLUG_JWKS = "jwks" as const
export const TABLE_SLUG_API_KEYS = "apikey" as const

export const TABLE_SLUG_IMAGES = "images" as const

// Site content (marketing-site overlay)
export const TABLE_SLUG_PAGES = "pages" as const
export const TABLE_SLUG_HEADERS = "headers" as const
export const TABLE_SLUG_FOOTERS = "footers" as const
export const TABLE_SLUG_THEMES = "themes" as const
export const GLOBAL_SLUG_SITE_SETTINGS = "siteSettings" as const

// Live-demo admin content
export const TABLE_SLUG_TESTIMONIALS = "testimonials" as const
export const TABLE_SLUG_PRODUCTS = "products" as const
export const TABLE_SLUG_LEADS = "leads" as const

/** Where a testimonial was collected from — indexed (`by_source`) for sorted/filtered list queries. */
export const TESTIMONIAL_SOURCES = {
  website: "website",
  import: "import",
  survey: "survey",
  referral: "referral",
} as const
export type TestimonialSource = (typeof TESTIMONIAL_SOURCES)[keyof typeof TESTIMONIAL_SOURCES]

export const PRODUCT_STATUSES = {
  draft: "draft",
  active: "active",
  archived: "archived",
} as const
export type ProductStatus = (typeof PRODUCT_STATUSES)[keyof typeof PRODUCT_STATUSES]

export const LEAD_SOURCES = {
  website: "website",
  referral: "referral",
  event: "event",
  outbound: "outbound",
} as const
export type LeadSource = (typeof LEAD_SOURCES)[keyof typeof LEAD_SOURCES]

export const LEAD_STATUSES = {
  new: "new",
  contacted: "contacted",
  qualified: "qualified",
  won: "won",
  lost: "lost",
} as const
export type LeadStatus = (typeof LEAD_STATUSES)[keyof typeof LEAD_STATUSES]
