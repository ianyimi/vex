import type { VexRenderComponentProps } from "@vexcms/core";
import type { VexEditorAdapter } from "@vexcms/react";
import type { PlateEditorOptions } from "./editor/plateEditor";

/**
 * Convex-runtime build of {@link import("./editor/plateEditor").plateEditor}.
 *
 * Resolved through the package's `"convex"` export condition, which only the
 * Convex bundler sets. `vex.config.ts` reaches every Convex function through
 * the server config, and the browser build's adapter lazy-imports Plate and
 * `@vexcms/react`; esbuild still bundles lazy chunks, so this entry returns the
 * same adapter shape with inert components and no editor code at all. Convex
 * never renders the admin form or rich text, so nothing calls them.
 *
 * @param _options - Accepted for signature parity with the browser build; unused.
 * @returns A `"plate"` adapter whose components render nothing.
 */
export function plateEditor(_options: PlateEditorOptions = {}): VexEditorAdapter {
  return {
    type: "plate",
    editorComponent: () => null,
    renderComponent: () => null,
  };
}

/**
 * Convex-runtime build of `RichText`. Renders nothing; exported only so the
 * `"convex"` entry exposes the same names as the browser entry.
 *
 * @param _props - Accepted for signature parity with the browser build; unused.
 * @returns `null`.
 */
export function RichText(_props: VexRenderComponentProps): null {
  return null;
}

export type {
  ImageElement,
  LinkElement,
  TableElement,
  TableRowElement,
  TableCellElement,
} from "./types";
export type { VexEditorFeature } from "./editor/features/types";
