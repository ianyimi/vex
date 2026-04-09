import { defineConfig } from "@vexcms/core"

import { posts } from "~/vexcms/collections"

const vexConfig = defineConfig({
  admin: {
    sidebar: {
      side: "right",
    },
  },
  collections: [posts],
})

export default vexConfig
