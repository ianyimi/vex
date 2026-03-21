import { defineSchema } from "convex/server"
import { pages, headers, footers, themes, site_settings, user, media, session, account, verification, apikey, jwks, vex_versions } from "./vex.schema";

export default defineSchema({
  pages,
  headers,
  footers,
  themes,
  site_settings,
  user,
  media,
  session,
  account,
  verification,
  apikey,
  jwks,
  vex_versions,})
