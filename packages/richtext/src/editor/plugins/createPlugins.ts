import type { VexEditorFeature } from "../features/types";
import { BaseParagraphPlugin } from "platejs";
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
  TableElement,
  TableRowElement,
  TableCellElement,
} from "../components/editorElements";

/**
 * Maps a VexEditorFeature key to the corresponding Plate React plugin(s).
 * Table/HR/Image plugins use .withComponent() to register custom elements.
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
  image: [ImagePlugin.withComponent(ImageElement)],
  horizontalRule: [HorizontalRulePlugin.withComponent(HrElement)],
  table: [
    TablePlugin.withComponent(TableElement),
    TableRowPlugin.withComponent(TableRowElement),
    TableCellPlugin.withComponent(TableCellElement),
    TableCellHeaderPlugin.withComponent(TableCellElement),
  ],
};

/**
 * Given an array of VexEditorFeature objects, returns the corresponding
 * Plate React plugins (always including BaseParagraphPlugin).
 */
export function createPluginsFromFeatures(features: VexEditorFeature[]): any[] {
  const plugins: any[] = [BaseParagraphPlugin];

  for (const feature of features) {
    const mapped = featurePluginMap[feature.key];
    if (mapped) {
      plugins.push(...mapped);
    }
  }

  return plugins;
}
