import { betterAuthAdapter } from "@vexcms/better-auth"
import { defineConfig } from "@vexcms/core"

import { authOptions } from "~/auth/options"
import { pages, posts } from "~/vexcms/collections"

const vexConfig = defineConfig({
  admin: {
    sidebar: {
      side: "right",
    },
  },
  auth: betterAuthAdapter({ config: authOptions }),
  collections: [pages, posts],
})

export default vexConfig
