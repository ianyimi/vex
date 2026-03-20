import { defineSchema } from "convex/server"
import {
  pages,
  headers,
  footers,
  themes,
  site_settings,
  user,
  session,
  account,
  verification,
  apikey,
  jwks,
  vex_versions,
  media,
} from "./vex.schema";

export default defineSchema({
  media,
  pages,
  headers,
  footers,
  themes,
  site_settings,
  user,
  session,
  account,
  verification,
  apikey,
  jwks,
  vex_versions,})
