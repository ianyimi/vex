import type { GenericActionCtx } from "convex/server"

import { createBetterAuthAdapter } from "@vexcms/better-auth"
import { betterAuth } from "better-auth"

import type { DataModel } from "../_generated/dataModel"

import { authOptions } from "./options"

export const createAuth = (ctx: GenericActionCtx<DataModel>, { optionsOnly } = { optionsOnly: false }) => {
  return betterAuth({
    database: createBetterAuthAdapter(ctx),
    logger: {
      disabled: optionsOnly,
    },
    ...authOptions,
  })
}
