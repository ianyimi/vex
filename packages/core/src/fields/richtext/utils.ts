import type { RichTextDocument, RichTextElement, RichTextText } from "./types";

/**
 * Flattens one richtext node (element or leaf) to its plain-text content.
 *
 * Inline children (an element's own `children`) concatenate with no
 * separator — adjacent text runs and inline marks (bold, a link's leaf text)
 * belong to the same visual line and must not gain a space neither side
 * wrote. The space between distinct top-level nodes is added one level up,
 * by {@link richTextToPlainText}.
 *
 * @param node - A `RichTextElement` or `RichTextText` node.
 * @returns The leaf's own text, or an element's children concatenated.
 */
function nodeToPlainText(node: RichTextElement | RichTextText): string {
  if ("text" in node && typeof node.text === "string") return node.text;
  return (node as RichTextElement).children.map(nodeToPlainText).join("");
}

/**
 * Flattens a richtext document to a plain-text excerpt.
 *
 * Joins every top-level node's own text (via {@link nodeToPlainText}, which
 * concatenates inline children with no separator) with a single space
 * between nodes — the document's blocks — then trims the result and
 * truncates to `maxLength` with a trailing `"…"` when the text is longer.
 * Used by the admin data table cell (never renders markup) and by
 * {@link richTextFieldToInputSchema}'s `required` check (a document whose
 * only content is empty paragraphs has an empty plain-text excerpt).
 *
 * @param props - Input props.
 * @param props.document - The richtext document to flatten.
 * @param props.maxLength - When set, the excerpt is truncated to this many
 *   characters (trailing whitespace trimmed first) with a `"…"` appended.
 *   Omitted → the full excerpt is returned.
 * @returns The plain-text excerpt, or `""` for an empty document.
 *
 * @example
 * ```ts
 * richTextToPlainText({
 *   document: [{ type: "p", children: [{ text: "Hello world" }] }],
 * }) // "Hello world"
 *
 * richTextToPlainText({
 *   document: [{ type: "p", children: [{ text: "Hello world" }] }],
 *   maxLength: 8,
 * }) // "Hello wo…"
 * ```
 */
export function richTextToPlainText(props: {
  document: RichTextDocument;
  maxLength?: number;
}): string {
  const text = props.document.map(nodeToPlainText).join(" ").trim();
  if (props.maxLength === undefined || text.length <= props.maxLength) return text;
  return `${text.slice(0, props.maxLength).trimEnd()}…`;
}
