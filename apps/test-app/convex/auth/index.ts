import type { GenericActionCtx } from "convex/server"

import { betterAuth } from "better-auth"

import type { DataModel } from "../_generated/dataModel"

import { buildBetterAuthOptions } from "./options"

export const createAuth = (
  ctx: GenericActionCtx<DataModel>,
  { optionsOnly } = { optionsOnly: false }
) => {
  return betterAuth(buildBetterAuthOptions({ ctx, optionsOnly }))
}
