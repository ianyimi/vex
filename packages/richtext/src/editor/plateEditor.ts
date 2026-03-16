import type { VexEditorAdapter, VexEditorComponentProps } from "@vexcms/core";
import type { VexEditorFeature } from "./features/types";
import { defaultFeatures } from "./features/defaultFeatures";
import { RichText } from "../render/RichText";
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
 * import { plateEditor } from "@vexcms/richtext/editor";
 * import { defineConfig } from "@vexcms/core";
 *
 * export default defineConfig({
 *   editor: plateEditor(),
 * });
 * ```
 */
export function plateEditor(options: PlateEditorOptions = {}): VexEditorAdapter {
  const features = resolveFeatures(options.features);

  // Lazy-load the editor component to keep the render-only path lightweight.
  // We use React.lazy so the PlateEditorField chunk is only loaded when
  // the admin UI actually mounts the editor.
  const LazyEditorField = React.lazy(() =>
    import("./PlateEditorField").then((mod) => ({
      default: mod.PlateEditorField,
    }))
  );

  // Wrapper that injects resolved features into PlateEditorField.
  function EditorComponent(props: VexEditorComponentProps) {
    return React.createElement(LazyEditorField, { ...props, features });
  }

  return {
    type: "plate",
    editorComponent: EditorComponent,
    renderComponent: RichText,
  };
}
