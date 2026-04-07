import type { FC } from "react";

import {
  ParagraphElementStatic,
  HeadingElementStatic,
  BlockquoteElementStatic,
  CodeBlockElementStatic,
  CodeLineElementStatic,
  ListElementStatic,
  ListItemElementStatic,
  LinkElementStatic,
  ImageElementStatic,
  HorizontalRuleElementStatic,
  TableElementStatic,
  TableRowElementStatic,
  TableCellElementStatic,
} from "./components/elements";

import {
  BoldLeafStatic,
  ItalicLeafStatic,
  UnderlineLeafStatic,
  StrikethroughLeafStatic,
  CodeLeafStatic,
} from "./components/leaves";

let _components: Record<string, FC<any>> | null = null;

/**
 * Returns a map of Plate node type strings to static render components.
 * The map is created once and cached.
 */
export function getStaticComponents(): Record<string, FC<any>> {
  if (_components) return _components;

  _components = {
    // Block elements
    p: ParagraphElementStatic,
    h1: HeadingElementStatic,
    h2: HeadingElementStatic,
    h3: HeadingElementStatic,
    h4: HeadingElementStatic,
    h5: HeadingElementStatic,
    h6: HeadingElementStatic,
    blockquote: BlockquoteElementStatic,
    code_block: CodeBlockElementStatic,
    code_line: CodeLineElementStatic,
    ul: ListElementStatic,
    ol: ListElementStatic,
    li: ListItemElementStatic,
    a: LinkElementStatic,
    img: ImageElementStatic,
    hr: HorizontalRuleElementStatic,
    table: TableElementStatic,
    tr: TableRowElementStatic,
    td: TableCellElementStatic,
    th: TableCellElementStatic,

    // Leaf marks
    bold: BoldLeafStatic,
    italic: ItalicLeafStatic,
    underline: UnderlineLeafStatic,
    strikethrough: StrikethroughLeafStatic,
    code: CodeLeafStatic,
  };

  return _components;
}
