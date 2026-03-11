import type {
  VexField,
  VexCollection,
  InferFieldsType,
  MediaCollectionConfig,
} from "../types";
import { LOCKED_MEDIA_FIELDS } from "../types/media";
import { text } from "../fields/text";
import { number } from "../fields/number";

/**
 * Default fields auto-injected into every media collection.
 *
 * NOTE: The `storageId` field uses text() as a placeholder here.
 * At schema generation time, `generateVexSchema()` reads
 * `config.media.storageAdapter.storageIdValueType` and replaces the
 * storageId value type string accordingly (e.g., `v.id("_storage")` for Convex).
 */
function getDefaultMediaFields(): Record<string, VexField> {
  return {
    storageId: text({
      required: true,
      defaultValue: "",
      label: "Storage ID",
      admin: { hidden: true },
    }),
    filename: text({
      required: true,
      defaultValue: "",
      label: "Filename",
      admin: { readOnly: true },
    }),
    mimeType: text({
      required: true,
      defaultValue: "",
      label: "MIME Type",
      index: "by_mimeType",
      admin: { readOnly: true },
    }),
    size: number({
      required: true,
      defaultValue: 0,
      label: "File Size (bytes)",
      admin: { readOnly: true },
    }),
    url: text({
      required: true,
      defaultValue: "",
      label: "URL",
      admin: { readOnly: true },
    }),
    alt: text({ label: "Alt Text" }),
    width: number({ label: "Width (px)" }),
    height: number({ label: "Height (px)" }),
  };
}

/**
 * Define a media collection with auto-injected file metadata fields.
 *
 * Creates a VexCollection with default media fields merged in. Locked fields
 * (storageId, filename, mimeType, size) cannot be overridden. Overridable fields
 * (url, alt, width, height) can be customized. Additional user fields are appended.
 *
 * Auto-adds `admin.useAsTitle: "filename"` if not explicitly set, so a search
 * index is auto-generated on filename for the media picker's search feature.
 *
 * @param slug - The collection slug
 * @param config - Optional media collection configuration
 * @returns A VexCollection with all default media fields and user fields merged
 *
 * @example
 * ```ts
 * const images = defineMediaCollection("images", {
 *   fields: {
 *     alt: text({ label: "Alt Text", required: true, defaultValue: "", maxLength: 200 }),
 *     caption: text({ label: "Caption" }),
 *   },
 * });
 * ```
 */
export function defineMediaCollection<
  TSlug extends string,
  TFields extends Record<string, VexField> = Record<never, VexField>,
>(
  slug: TSlug,
  config?: MediaCollectionConfig<TFields>,
): VexCollection<Record<string, VexField>, never> {
  const defaults = getDefaultMediaFields();

  // Merge user fields, skipping locked fields
  if (config?.fields) {
    for (const [fieldName, field] of Object.entries(config.fields)) {
      if ((LOCKED_MEDIA_FIELDS as readonly string[]).includes(fieldName)) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            `[vex] Media collection "${slug}": field "${fieldName}" is a system field and cannot be overridden`,
          );
        }
        continue;
      }
      defaults[fieldName] = field;
    }
  }

  // Validate slug format
  if (process.env.NODE_ENV !== "production") {
    if (!/^[a-z][a-z0-9_]*$/.test(slug)) {
      console.warn(
        `[vex] Collection slug "${slug}" should be lowercase alphanumeric with underscores, starting with a letter`,
      );
    }
    if (slug.startsWith("vex_")) {
      console.warn(
        `[vex] Collection slug "${slug}" uses reserved prefix "vex_"`,
      );
    }
  }

  // Build admin config with useAsTitle default
  const adminConfig: Record<string, unknown> = {
    ...config?.admin,
    useAsTitle: config?.admin?.useAsTitle ?? "filename",
  };

  return {
    slug,
    config: {
      fields: defaults,
      tableName: config?.tableName,
      labels: config?.labels,
      admin: adminConfig as any,
    },
    _docType: {} as InferFieldsType<Record<string, VexField>>,
  };
}
