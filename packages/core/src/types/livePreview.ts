import type { VexField, InferFieldsType } from "./fields";

/**
 * Responsive breakpoint for the live preview iframe.
 */
export interface LivePreviewBreakpoint {
  /** Display label (e.g., "Mobile", "Desktop") */
  label: string;

  /** Viewport width in pixels */
  width: number;

  /** Viewport height in pixels */
  height: number;

  /** Lucide icon name for the breakpoint button */
  icon?: "smartphone" | "tablet" | "laptop" | "monitor";
}

/**
 * Live preview configuration for a collection.
 * Works with or without `versions.drafts` — the admin panel writes
 * a transient preview snapshot on form changes regardless.
 *
 * @typeParam TFields - The collection's field definitions, used to type the `doc`
 *   parameter in the `url` function. Defaults to `Record<string, VexField>`.
 */
export interface LivePreviewConfig<
  TFields extends Record<string, VexField> = Record<string, VexField>,
> {
  /**
   * URL for the preview iframe.
   * - String: static URL (e.g., "/preview/pages")
   * - Function: receives the document data (typed from the collection's fields), returns URL
   *
   * @param doc - The current document data including `_id` and all collection fields
   */
  url: string | ((doc: { _id: string } & InferFieldsType<TFields>) => string);

  /**
   * Breakpoints for responsive preview.
   * Overrides `admin.livePreview.breakpoints` if set.
   */
  breakpoints?: LivePreviewBreakpoint[];

  /**
   * Fields that trigger URL recomputation when changed.
   * - Not set: URL recomputes on every save
   * - Set: URL only recomputes when these fields change
   * - Empty array: URL never recomputes (only content refreshes)
   */
  reloadOnFields?: string[];
}

/**
 * Client-safe version of LivePreviewConfig for RSC serialization.
 * Function URLs are replaced with `null` — the admin panel resolves
 * them at runtime using the original config passed via `livePreviewConfigs`.
 */
export interface ClientLivePreviewConfig {
  /**
   * URL for the preview iframe.
   * - String: static URL (serializable)
   * - null: the original config has a function URL — resolve at runtime
   */
  url: string | null;

  breakpoints?: LivePreviewBreakpoint[];
  reloadOnFields?: string[];
}

/**
 * Global live preview configuration on the admin config.
 * Provides defaults that individual collections can override.
 */
export interface AdminLivePreviewConfig {
  /** Default breakpoints for all collections with live preview */
  breakpoints?: LivePreviewBreakpoint[];
}
