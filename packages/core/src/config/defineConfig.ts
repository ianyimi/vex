import type { VexConfig } from "../types";

export function defineConfig(config: VexConfig): VexConfig {
  const admin = {
    basePath: "/admin",
    ...config.admin,
  };

  if (process.env.NODE_ENV !== "production") {
    const slugs = config.collections.map((c) => c.slug);
    const duplicates = slugs.filter((slug, i) => slugs.indexOf(slug) !== i);
    if (duplicates.length > 0) {
      console.warn(
        `[vex] Duplicate collection slugs detected: ${duplicates.join(", ")}`,
      );
    }
  }

  return {
    ...config,
    admin,
  };
}
