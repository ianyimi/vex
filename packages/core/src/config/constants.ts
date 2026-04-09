import { VexConfig } from "./types";

/**
 * Default resolved VexCMS configuration applied by `defineConfig()` when properties are omitted.
 *
 * @see {@link VexConfig} for the resolved config type
 * @see {@link defineConfig} for the function that merges this with user input
 */
export const DEFAULT_VEX_CONFIG: VexConfig = {
  admin: {
    sidebar: {
      side: "left",
    },
  },
  collections: [],
} as const;
