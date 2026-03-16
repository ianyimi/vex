// Re-export canonical types from core
export type {
  RichTextDocument,
  RichTextElement,
  RichTextText,
} from "@vexcms/core";

import type { RichTextElement } from "@vexcms/core";

/** Image element node — narrowed type for image-specific properties. */
export interface ImageElement extends RichTextElement {
  type: "img";
  url: string;
  mediaId?: string;
  alt?: string;
  width?: number;
  height?: number;
}

/** Link element node — narrowed type for link-specific properties. */
export interface LinkElement extends RichTextElement {
  type: "a";
  url: string;
  target?: string;
}

/** Table element node. */
export interface TableElement extends RichTextElement {
  type: "table";
}

/** Table row element node. */
export interface TableRowElement extends RichTextElement {
  type: "tr";
}

/** Table cell element node (regular or header). */
export interface TableCellElement extends RichTextElement {
  type: "td" | "th";
  colSpan?: number;
  rowSpan?: number;
}
