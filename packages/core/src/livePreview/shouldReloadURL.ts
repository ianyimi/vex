import type { LivePreviewConfig } from "../types/livePreview";

/**
 * Determines if the preview iframe URL should be recomputed.
 *
 * @param props.config - The collection's livePreview config
 * @param props.changedFields - Set of field names that changed in the save
 * @returns true if the URL should be recomputed
 */
export function shouldReloadURL(props: {
  config: LivePreviewConfig;
  changedFields: string[];
}): boolean {
  if (props.config.reloadOnFields === undefined) {
    return true;
  }

  if (props.config.reloadOnFields.length === 0) {
    return false;
  }

  return props.changedFields.some((field) =>
    props.config.reloadOnFields!.includes(field),
  );
}
