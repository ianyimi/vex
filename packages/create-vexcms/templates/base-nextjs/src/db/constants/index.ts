import { type Doc, type Id } from "@convex/_generated/dataModel"

export * from "./auth"

// Better Auth
export const TABLE_SLUG_USERS = "user" as const
export type UserDoc = Doc<typeof TABLE_SLUG_USERS>
export type UserID = Id<typeof TABLE_SLUG_USERS>

export const TABLE_SLUG_ORGANIZATIONS = "organization" as const
export type OrganizationDoc = Doc<typeof TABLE_SLUG_ORGANIZATIONS>
export type OrganizationID = Id<typeof TABLE_SLUG_ORGANIZATIONS>

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
