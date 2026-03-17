import type { LivePreviewConfig } from "../types/livePreview";

/**
 * Resolves the preview URL from a collection's live preview config.
 *
 * @param props.config - The collection's livePreview config
 * @param props.doc - The current document data (must include `_id`)
 * @param props.fallbackURL - URL to return if the function throws
 * @returns The resolved preview URL
 * @throws If the resolved URL is empty and no fallbackURL is provided
 */
export function resolvePreviewURL(props: {
  config: LivePreviewConfig;
  doc: { _id: string; [key: string]: any };
  fallbackURL?: string;
}): string {
  if (typeof props.config.url === "string") {
    return props.config.url;
  }

  try {
    const result = props.config.url(props.doc);
    if (!result) {
      throw new Error(
        `Live preview URL resolved to empty string for document ${props.doc._id}`,
      );
    }
    return result;
  } catch (error) {
    if (props.fallbackURL !== undefined) {
      return props.fallbackURL;
    }
    throw error;
  }
}
