import type { SlateLeafProps } from "platejs/static";
import { SlateLeaf } from "platejs/static";

export function BoldLeafStatic(props: SlateLeafProps) {
  return (
    <SlateLeaf {...props}>
      <strong>{props.children}</strong>
    </SlateLeaf>
  );
}

export function ItalicLeafStatic(props: SlateLeafProps) {
  return (
    <SlateLeaf {...props}>
      <em>{props.children}</em>
    </SlateLeaf>
  );
}

export function UnderlineLeafStatic(props: SlateLeafProps) {
  return (
    <SlateLeaf {...props}>
      <u>{props.children}</u>
    </SlateLeaf>
  );
}

export function StrikethroughLeafStatic(props: SlateLeafProps) {
  return (
    <SlateLeaf {...props}>
      <s>{props.children}</s>
    </SlateLeaf>
  );
}

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
