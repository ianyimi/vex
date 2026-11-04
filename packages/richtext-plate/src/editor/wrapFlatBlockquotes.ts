import type { RichTextDocument, RichTextElement, RichTextText } from "@vexcms/core";

function isText(node: RichTextElement | RichTextText): node is RichTextText {
  return typeof node.text === "string";
}

function wrapElement(element: RichTextElement): RichTextElement {
  if (element.type === "blockquote" && element.children.some(isText)) {
    return { ...element, children: [{ type: "p", children: element.children }] };
  }
  if (element.children.every(isText)) return element;
  return {
    ...element,
    children: element.children.map((child) => (isText(child) ? child : wrapElement(child))),
  };
}

/**
 * Rewrites blockquotes stored before Plate 53 into Plate 53's shape.
 *
 * Plate 52 stored a blockquote as a text block
 * (`{ type: "blockquote", children: [{ text }] }`); 53 stores it as a
 * container of blocks (`children: [{ type: "p", children: [{ text }] }]`).
 * A 52 quote only ever held text and inline nodes, and a 53 quote never holds
 * a direct text child, so "has a text child" identifies the old shape exactly;
 * its children move into one paragraph. Every other node is returned as-is.
 *
 * Plate's own normalizer makes the same rewrite, but only once the node is
 * edited — and toggling an un-normalized quote off deletes its text. Running
 * Plate's normalizer on load instead emits the normalized document as a change,
 * which dirties the form (and autosaves) the moment a document is opened.
 *
 * @param document - A stored rich text value, of either Plate version.
 * @returns The same document with every flat blockquote wrapped; unchanged
 *   subtrees keep their identity.
 */
export function wrapFlatBlockquotes(document: RichTextDocument): RichTextDocument {
  return document.map(wrapElement);
}
