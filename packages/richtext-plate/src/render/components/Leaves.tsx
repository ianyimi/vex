import type { SlateLeafProps } from "platejs/static";
import { SlateLeaf } from "platejs/static";

/**
 * Server-safe static renderer for bold text.
 *
 * @param props - The Slate leaf props for the bold mark.
 * @returns The leaf text wrapped in a `<strong>` `SlateLeaf`.
 */
export function BoldLeafStatic(props: SlateLeafProps) {
  return (
    <SlateLeaf {...props}>
      <strong>{props.children}</strong>
    </SlateLeaf>
  );
}

/**
 * Server-safe static renderer for italic text.
 *
 * @param props - The Slate leaf props for the italic mark.
 * @returns The leaf text wrapped in an `<em>` `SlateLeaf`.
 */
export function ItalicLeafStatic(props: SlateLeafProps) {
  return (
    <SlateLeaf {...props}>
      <em>{props.children}</em>
    </SlateLeaf>
  );
}

/**
 * Server-safe static renderer for underlined text.
 *
 * @param props - The Slate leaf props for the underline mark.
 * @returns The leaf text wrapped in a `<u>` `SlateLeaf`.
 */
export function UnderlineLeafStatic(props: SlateLeafProps) {
  return (
    <SlateLeaf {...props}>
      <u>{props.children}</u>
    </SlateLeaf>
  );
}

/**
 * Server-safe static renderer for strikethrough text.
 *
 * @param props - The Slate leaf props for the strikethrough mark.
 * @returns The leaf text wrapped in an `<s>` `SlateLeaf`.
 */
export function StrikethroughLeafStatic(props: SlateLeafProps) {
  return (
    <SlateLeaf {...props}>
      <s>{props.children}</s>
    </SlateLeaf>
  );
}

/**
 * Server-safe static renderer for inline code text.
 *
 * @param props - The Slate leaf props for the code mark.
 * @returns The leaf text wrapped in a styled `<code>` `SlateLeaf`.
 */
export function CodeLeafStatic(props: SlateLeafProps) {
  return (
    <SlateLeaf {...props}>
      <code
        style={{
          background: "#f3f4f6",
          borderRadius: 3,
          padding: "1px 4px",
          fontFamily: "monospace",
          fontSize: "0.9em",
        }}
      >
        {props.children}
      </code>
    </SlateLeaf>
  );
}
