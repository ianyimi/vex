import type { VexConfig, VexConfigInput } from "../types";

export const BASE_VEX_CONFIG: VexConfig = {
  basePath: "/admin",
  globals: [],
  collections: [],
  admin: {
    meta: {
      titleSuffix: "| Admin",
      favicon: "/favicon.ico",
    },
    user: "users",
    sidebar: {
      hideGlobals: false,
    },
  },
};

export function defineConfig(vexConfig: VexConfigInput): VexConfig {
  const config: VexConfig = {
    ...BASE_VEX_CONFIG,
    ...vexConfig,
    admin: {
      ...BASE_VEX_CONFIG.admin,
      ...vexConfig.admin,
      meta: {
        ...BASE_VEX_CONFIG.admin.meta,
        ...vexConfig.admin?.meta,
      },
      sidebar: {
        ...BASE_VEX_CONFIG.admin.sidebar,
        ...vexConfig.admin?.sidebar,
      },
    },
  };

  if (process.env.NODE_ENV !== "production") {
    const slugs = config.collections.concat(config.globals).map((c) => c.slug);
    const duplicates = slugs.filter((slug, i) => slugs.indexOf(slug) !== i);
    if (duplicates.length > 0) {
      console.warn(
        `[vex] Duplicate collection slugs detected: ${duplicates.join(", ")}`,
      );
    }
  }

  return config;
}
