import type { VexConfig, VexConfigInput, VexCollection } from "../types";
import type { VexMediaCollection } from "../types/media";
import { getDefaultMediaFields, LOCKED_MEDIA_FIELDS } from "../types/media";
import { VexMediaConfigError } from "../errors";

export const BASE_VEX_CONFIG: Omit<VexConfig, "auth"> = {
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
  schema: {
    outputPath: "/convex/vex.schema.ts",
    typesOutputPath: "/convex/vex.types.ts",
    autoMigrate: true,
    autoRemove: false,
  },
};

/**
 * Resolve a VexMediaCollection into a VexCollection by injecting
 * default media fields. Locked fields cannot be overridden by the user.
 * Overridable fields (url, alt, width, height) can be customized.
 */
function resolveMediaCollection(props: {
  mediaCollection: VexMediaCollection;
}): VexCollection {
  const defaults = getDefaultMediaFields();

  // Merge user fields, skipping locked fields
  if (props.mediaCollection.fields) {
    for (const [fieldName, field] of Object.entries(props.mediaCollection.fields) as [string, any][]) {
      if ((LOCKED_MEDIA_FIELDS as readonly string[]).includes(fieldName)) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            `[vex] Media collection "${props.mediaCollection.slug}": field "${fieldName}" is a system field and cannot be overridden`,
          );
        }
        continue;
      }
      defaults[fieldName] = field;
    }
  }

  // Build admin config with useAsTitle default
  const adminConfig: Record<string, unknown> = {
    ...props.mediaCollection.admin,
    useAsTitle: props.mediaCollection.admin?.useAsTitle ?? "filename",
  };

  return {
    slug: props.mediaCollection.slug,
    fields: defaults,
    tableName: props.mediaCollection.tableName,
    labels: props.mediaCollection.labels,
    admin: adminConfig as any,
  };
}

export function defineConfig(vexConfig: VexConfigInput): VexConfig {
  const { media: mediaInput, ...restInput } = vexConfig;
  const config: VexConfig = {
    ...BASE_VEX_CONFIG,
    ...restInput,
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
      livePreview: vexConfig.admin?.livePreview,
    },
    schema: {
      ...BASE_VEX_CONFIG.schema,
      ...vexConfig.schema,
    },
    access: vexConfig.access,
  };

  // Handle media config
  if (mediaInput) {
    if (mediaInput.collections.length === 0) {
      config.media = undefined;
    } else if (!mediaInput.storageAdapter) {
      throw new VexMediaConfigError(
        "media.storageAdapter is required when media.collections is non-empty",
      );
    } else {
      config.media = {
        collections: mediaInput.collections.map((mc) =>
          resolveMediaCollection({ mediaCollection: mc }),
        ),
        storageAdapter: mediaInput.storageAdapter,
      };
    }
  } else {
    config.media = undefined;
  }

  if (process.env.NODE_ENV !== "production") {
    // Validate collection slugs
    for (const collection of config.collections) {
      if (!/^[a-z][a-z0-9_]*$/.test(collection.slug)) {
        console.warn(
          `[vex] Collection slug "${collection.slug}" should be lowercase alphanumeric with underscores, starting with a letter`,
        );
      }
      if (collection.slug.startsWith("vex_")) {
        console.warn(
          `[vex] Collection slug "${collection.slug}" uses reserved prefix "vex_"`,
        );
      }
      if (Object.keys(collection.fields).length === 0) {
        console.warn(`[vex] Collection "${collection.slug}" has no fields defined`);
      }
    }

    // Validate global slugs
    for (const global of config.globals) {
      if (!/^[a-z][a-z0-9_]*$/.test(global.slug)) {
        console.warn(
          `[vex] Global slug "${global.slug}" should be lowercase alphanumeric with underscores, starting with a letter`,
        );
      }
      if (global.slug.startsWith("vex_")) {
        console.warn(`[vex] Global slug "${global.slug}" uses reserved prefix "vex_"`);
      }
      if (Object.keys(global.fields).length === 0) {
        console.warn(`[vex] Global "${global.slug}" has no fields defined`);
      }
    }

    // Check for duplicate slugs
    const slugs = config.collections.concat(config.globals as any[]).map((c) => c.slug);
    const duplicates = slugs.filter((slug, i) => slugs.indexOf(slug) !== i);
    if (duplicates.length > 0) {
      console.warn(
        `[vex] Duplicate collection slugs detected: ${duplicates.join(", ")}`,
      );
    }
  }

  return config;
}
