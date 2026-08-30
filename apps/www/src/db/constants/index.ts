import { type Doc, type Id } from "@convex/_generated/dataModel";

export * from "./auth";

// Better Auth
export const TABLE_SLUG_USERS = "user" as const;
export type UserDoc = Doc<typeof TABLE_SLUG_USERS>;
export type UserID = Id<typeof TABLE_SLUG_USERS>;

export const TABLE_SLUG_ORGANIZATIONS = "organization" as const;
export type OrganizationDoc = Doc<typeof TABLE_SLUG_ORGANIZATIONS>;
export type OrganizationID = Id<typeof TABLE_SLUG_ORGANIZATIONS>;

export const TABLE_SLUG_ACCOUNTS = "account" as const;

export const TABLE_SLUG_SESSIONS = "session" as const;
export type Session = Doc<typeof TABLE_SLUG_SESSIONS>;
export type SessionID = Id<typeof TABLE_SLUG_SESSIONS>;

export const TABLE_SLUG_VERIFICATIONS = "verification" as const;
export const TABLE_SLUG_JWKS = "jwks" as const;
export const TABLE_SLUG_API_KEYS = "apikey" as const;

export const COLLECTION_SLUG_MEDIA = "media" as const;

export const TABLE_SLUG_PAGES = "pages" as const;
export type PageDoc = Doc<typeof TABLE_SLUG_PAGES>;
export type PageID = Id<typeof TABLE_SLUG_PAGES>;

export const TABLE_SLUG_HEADERS = "headers" as const;
export const TABLE_SLUG_FOOTERS = "footers" as const;
export const TABLE_SLUG_THEMES = "themes" as const;
export const TABLE_SLUG_SITE_SETTINGS = "site_settings" as const;
export const TABLE_SLUG_IMAGES = "images" as const;

// ── Editorial content ───────────────────────────────────────────────────────
// These four share an access-relevant field shape on purpose: the same
// `authorId`/`status` field names and indexes, so the composable checks in
// `~/auth/permissions.ts` read uniformly across them. See `~/auth/access.ts`.
export const TABLE_SLUG_ARTICLES = "articles" as const;
export type ArticleDoc = Doc<typeof TABLE_SLUG_ARTICLES>;
export type ArticleID = Id<typeof TABLE_SLUG_ARTICLES>;

export const TABLE_SLUG_CASE_STUDIES = "case_studies" as const;
export type CaseStudyDoc = Doc<typeof TABLE_SLUG_CASE_STUDIES>;

export const TABLE_SLUG_CHANGELOG = "changelog" as const;
export type ChangelogDoc = Doc<typeof TABLE_SLUG_CHANGELOG>;

/** Has `authorId` but NO `status` — proves partial overlap across shared rules. */
export const TABLE_SLUG_COMMENTS = "comments" as const;
export type CommentDoc = Doc<typeof TABLE_SLUG_COMMENTS>;

/**
 * Editorial workflow states, shared verbatim by every editorial collection.
 *
 * Declared once here rather than per collection so the `select` options and the
 * access rules that compare against them cannot drift apart.
 */
export const CONTENT_STATUS = {
  draft: "draft",
  review: "review",
  published: "published",
} as const;
export type ContentStatus = (typeof CONTENT_STATUS)[keyof typeof CONTENT_STATUS];

export const GLOBAL_SLUG_NAV = "nav" as const;

export const AUTH_PROVIDERS = {
  apple: "apple",
  atlassian: "atlassian",
  cognito: "cognito",
  discord: "discord",
  dropbox: "dropbox",
  facebook: "facebook",
  figma: "figma",
  github: "github",
  gitlab: "gitlab",
  google: "google",
  huggingface: "huggingface",
  kakao: "kakao",
  kick: "kick",
  line: "line",
  linear: "linear",
  linkedin: "linkedin",
  microsoft: "microsoft",
  naver: "naver",
  notion: "notion",
  paypal: "paypal",
  reddit: "reddit",
  roblox: "roblox",
  salesforce: "salesforce",
  slack: "slack",
  spotify: "spotify",
  tiktok: "tiktok",
  twitch: "twitch",
  twitter: "twitter",
  vk: "vk",
  zoom: "zoom",
} as const;
export type AuthProvider = (typeof AUTH_PROVIDERS)[keyof typeof AUTH_PROVIDERS];
