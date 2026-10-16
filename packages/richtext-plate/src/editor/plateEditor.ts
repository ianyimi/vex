import type { VexEditorComponentProps, VexRenderComponentProps } from "@vexcms/core";
import type { VexEditorAdapter } from "@vexcms/react";
import type { VexEditorFeature } from "./features/types";
import { defaultFeatures } from "./features/defaultFeatures";
import React from "react";

type FeatureInput =
  | VexEditorFeature[]
  | ((defaults: VexEditorFeature[]) => VexEditorFeature[]);

interface PlateEditorOptions {
  /**
   * Features to enable in the editor.
   *
   * Pass an array of feature objects, or a callback that receives
   * the default features and returns a modified list.
   *
   * @default defaultFeatures
   *
   * @example
   * ```ts
   * // Use only bold and italic
   * plateEditor({ features: [BoldFeature, ItalicFeature] })
   *
   * // Remove table from defaults
   * plateEditor({ features: (defaults) => defaults.filter(f => f.key !== "table") })
   * ```
   */
  features?: FeatureInput;
}

function resolveFeatures(input?: FeatureInput): VexEditorFeature[] {
  if (!input) return defaultFeatures;
  if (typeof input === "function") return input(defaultFeatures);
  return input;
}

/**
 * Creates a VexEditorAdapter backed by Plate (platejs).
 *
 * @example
 * ```ts
 * import { plateEditor } from "@vexcms/richtext-plate";
 * import { defineConfig } from "@vexcms/core";
 *
 * export default defineConfig({
 *   editor: plateEditor(),
 * });
 * ```
 *
 * @param options - Editor configuration; currently just which features to enable.
 * @returns A `VexEditorAdapter` whose `editorComponent` lazy-loads
 *   `PlateEditorField` (pre-bound to the resolved `features`) and whose
 *   `renderComponent` lazy-loads the static `RichText` renderer.
 */
export function plateEditor(options: PlateEditorOptions = {}): VexEditorAdapter {
  const features = resolveFeatures(options.features);

  // Both components are lazy so `vex.config.ts` (bundled into every Convex
  // function via the server config) never evaluates platejs at module load —
  // platejs's jotai dependency reads `import.meta`, which the Convex runtime
  // rejects. The chunks load only when the admin UI mounts a component.
  const LazyEditorField = React.lazy(() =>
    import("./PlateEditorField").then((mod) => ({
      default: mod.PlateEditorField,
    }))
  );
  const LazyRichText = React.lazy(() =>
    import("../render/RichText").then((mod) => ({ default: mod.RichText }))
  );

  // Wrapper that injects resolved features into PlateEditorField.
  function EditorComponent(props: VexEditorComponentProps) {
    return React.createElement(LazyEditorField, { ...props, features });
  }

  function RenderComponent(props: VexRenderComponentProps) {
    return React.createElement(LazyRichText, props);
  }

  return {
    type: "plate",
    editorComponent: EditorComponent,
    renderComponent: RenderComponent,
  };
}
