import { defineSchema } from "convex/server"
import { pages, headers, footers, themes, user, media, session, account, verification, apikey, jwks, site_settings, vex_versions } from "./vex.schema";

export default defineSchema({
  pages,
  headers,
  footers,
  themes,
  user,
  media,
  session,
  account,
  verification,
  apikey,
  jwks,
  site_settings,
  vex_versions,})
