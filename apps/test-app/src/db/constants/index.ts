export * from "./auth"

// Better Auth
export const TABLE_SLUG_USERS = "user" as const
export const TABLE_SLUG_ACCOUNTS = "account" as const
export const TABLE_SLUG_SESSIONS = "session" as const
export const TABLE_SLUG_VERIFICATIONS = "verification" as const
export const TABLE_SLUG_JWKS = "jwks" as const

export const COLLECTION_SLUG_MEDIA = "media" as const

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
} as const
export type AuthProvider = (typeof AUTH_PROVIDERS)[keyof typeof AUTH_PROVIDERS]
