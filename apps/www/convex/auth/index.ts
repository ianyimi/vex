import type { GenericActionCtx } from "convex/server"

import { betterAuth } from "better-auth"

import { authOptions } from "~/auth/options"

import type { DataModel } from "../_generated/dataModel"

import schema from "../schema"
import { convexAdapter } from "./adapter"

export const createAuth = (
  ctx: GenericActionCtx<DataModel>,
  { optionsOnly } = { optionsOnly: false }
) => {
  return betterAuth({
    database: convexAdapter(ctx, schema),
    logger: {
      disabled: optionsOnly,
    },
    ...authOptions,
  })
}
