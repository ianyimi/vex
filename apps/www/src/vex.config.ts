import { defineConfig } from "@vexcms/core"

import { posts } from "~/vexcms/collections"

const vexConfig = defineConfig({
  collections: [posts],
})

export default vexConfig
