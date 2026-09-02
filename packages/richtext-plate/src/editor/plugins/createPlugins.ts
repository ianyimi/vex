import type { VexEditorFeature } from "../features/types";
import { BaseParagraphPlugin, createSlatePlugin } from "platejs";
import {
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  StrikethroughPlugin,
  CodePlugin,
  HeadingPlugin,
  BlockquotePlugin,
  HorizontalRulePlugin,
} from "@platejs/basic-nodes/react";
import { CodeBlockPlugin, CodeLinePlugin } from "@platejs/code-block/react";
import { LinkPlugin } from "@platejs/link/react";
import { ListPlugin } from "@platejs/list/react";
import { ImagePlugin } from "@platejs/media/react";
import {
  TablePlugin,
  TableRowPlugin,
  TableCellPlugin,
  TableCellHeaderPlugin,
} from "@platejs/table/react";
import {
  HrElement,
  ImageElement,
  ImagePlaceholderElement,
  TableElement,
  TableRowElement,
  TableCellElement,
} from "../components/editorElements";

/** Custom plugin for the image upload placeholder (void element). */
const ImagePlaceholderPlugin = createSlatePlugin({
  key: "img_placeholder",
  node: { type: "img_placeholder", isElement: true, isVoid: true },
});

/**
 * Maps a VexEditorFeature key to Plate React plugins.
 */
const featurePluginMap: Record<string, any[]> = {
  bold: [BoldPlugin],
  italic: [ItalicPlugin],
  underline: [UnderlinePlugin],
  strikethrough: [StrikethroughPlugin],
  code: [CodePlugin],
  heading: [HeadingPlugin],
  blockquote: [BlockquotePlugin],
  codeBlock: [CodeBlockPlugin, CodeLinePlugin],
  list: [ListPlugin],
  link: [LinkPlugin],
  image: [ImagePlugin],
  horizontalRule: [HorizontalRulePlugin],
  table: [TablePlugin, TableRowPlugin, TableCellPlugin, TableCellHeaderPlugin],
};

/**
 * Maps plugin keys to custom React components.
 * Returned separately so they can be passed to createPlateEditor({ override: { components } }).
 */
const componentMap: Record<string, any> = {
  img: ImageElement,
  hr: HrElement,
  img_placeholder: ImagePlaceholderElement,
  table: TableElement,
  tr: TableRowElement,
  td: TableCellElement,
  th: TableCellElement,
};

/**
 * Given an array of VexEditorFeature objects, returns the plugins
 * and component overrides for createPlateEditor.
 *
 * @param features - The enabled editor features; each feature key maps to
 *   zero or more Plate plugins via `featurePluginMap`.
 * @returns The Plate plugins to register (always including the base
 *   paragraph and image-placeholder plugins) and the `components` override
 *   map pairing element types with their React renderers.
 */
export function createPluginsFromFeatures(features: VexEditorFeature[]): {
  plugins: any[];
  components: Record<string, any>;
} {
  const plugins: any[] = [BaseParagraphPlugin, ImagePlaceholderPlugin];

  for (const feature of features) {
    const mapped = featurePluginMap[feature.key];
    if (mapped) {
      plugins.push(...mapped);
    }
  }

  return { plugins, components: componentMap };
}
