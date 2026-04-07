import type { VexEditorFeature } from "./types";

/** Bold text formatting */
export const BoldFeature: VexEditorFeature = {
  key: "bold",
  label: "Bold",
  plugins: ["bold"],
};

/** Italic text formatting */
export const ItalicFeature: VexEditorFeature = {
  key: "italic",
  label: "Italic",
  plugins: ["italic"],
};

/** Underline text formatting */
export const UnderlineFeature: VexEditorFeature = {
  key: "underline",
  label: "Underline",
  plugins: ["underline"],
};

/** Strikethrough text formatting */
export const StrikethroughFeature: VexEditorFeature = {
  key: "strikethrough",
  label: "Strikethrough",
  plugins: ["strikethrough"],
};

/** Inline code formatting */
export const CodeFeature: VexEditorFeature = {
  key: "code",
  label: "Code",
  plugins: ["code"],
};

/** Headings (H1-H6) */
export const HeadingFeature: VexEditorFeature = {
  key: "heading",
  label: "Headings",
  plugins: ["heading"],
};

/** Blockquotes */
export const BlockquoteFeature: VexEditorFeature = {
  key: "blockquote",
  label: "Blockquote",
  plugins: ["blockquote"],
};

/** Code blocks with syntax highlighting */
export const CodeBlockFeature: VexEditorFeature = {
  key: "codeBlock",
  label: "Code Block",
  plugins: ["code_block"],
};

/** Ordered and unordered lists */
export const ListFeature: VexEditorFeature = {
  key: "list",
  label: "Lists",
  plugins: ["list"],
};

/** Hyperlinks */
export const LinkFeature: VexEditorFeature = {
  key: "link",
  label: "Link",
  plugins: ["link"],
};

/** Images (with optional media collection integration) */
export const ImageFeature: VexEditorFeature = {
  key: "image",
  label: "Image",
  plugins: ["image"],
};

/** Horizontal rules / dividers */
export const HorizontalRuleFeature: VexEditorFeature = {
  key: "horizontalRule",
  label: "Horizontal Rule",
  plugins: ["horizontal_rule"],
};

/** Tables with cell selection and merging */
export const TableFeature: VexEditorFeature = {
  key: "table",
  label: "Table",
  plugins: ["table"],
};

/**
 * Default features included when no custom features are specified.
 */
export const defaultFeatures: VexEditorFeature[] = [
  BoldFeature,
  ItalicFeature,
  UnderlineFeature,
  StrikethroughFeature,
  CodeFeature,
  HeadingFeature,
  BlockquoteFeature,
  CodeBlockFeature,
  ListFeature,
  LinkFeature,
  ImageFeature,
  HorizontalRuleFeature,
  TableFeature,
];
