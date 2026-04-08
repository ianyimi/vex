import { betterAuth } from "better-auth"
import { admin, apiKey } from "better-auth/plugins"
import { createClient } from "@convex-dev/better-auth"
import { convex } from "@convex-dev/better-auth/plugins"

import { components } from "./_generated/api"
import type { DataModel } from "./_generated/dataModel"
import authConfig from "./auth.config"

export const betterAuthClient = createClient<DataModel>(components.betterAuth)

export const createAuth = (ctx: Parameters<typeof betterAuthClient.adapter>[0]) =>
  betterAuth({
    database: betterAuthClient.adapter(ctx),
    baseURL: process.env.SITE_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    emailAndPassword: {
      enabled: true,
    },
    plugins: [
      convex({ authConfig }),
      admin(),
      apiKey(),
    ],
  })
