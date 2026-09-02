import { query } from "../_generated/server"

export const identifyCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return ctx.auth.getUserIdentity()
  },
})
