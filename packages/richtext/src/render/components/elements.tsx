import React from "react";
import type { SlateElementProps } from "platejs/static";
import { SlateElement } from "platejs/static";

export function ParagraphElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props}>
      <p style={{ margin: "4px 0", lineHeight: 1.7 }}>{props.children}</p>
    </SlateElement>
  );
}

export function HeadingElementStatic(props: SlateElementProps) {
  const element = props.element as { type: string };
  const tag = element.type as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

  const styles: Record<string, React.CSSProperties> = {
    h1: { fontSize: "2em", fontWeight: 700, margin: "24px 0 12px", lineHeight: 1.2 },
    h2: { fontSize: "1.5em", fontWeight: 700, margin: "20px 0 10px", lineHeight: 1.25 },
    h3: { fontSize: "1.25em", fontWeight: 600, margin: "16px 0 8px", lineHeight: 1.3 },
    h4: { fontSize: "1.1em", fontWeight: 600, margin: "14px 0 6px", lineHeight: 1.35 },
    h5: { fontSize: "1em", fontWeight: 600, margin: "12px 0 4px", lineHeight: 1.4 },
    h6: { fontSize: "0.9em", fontWeight: 600, margin: "12px 0 4px", lineHeight: 1.4 },
  };

  return (
    <SlateElement {...props}>
      {React.createElement(tag, { style: styles[tag] }, props.children)}
    </SlateElement>
  );
}

export function BlockquoteElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props}>
      <blockquote
        style={{
          borderLeft: "3px solid #d1d5db",
          paddingLeft: 16,
          margin: "12px 0",
          color: "#6b7280",
          fontStyle: "italic",
        }}
      >
        {props.children}
      </blockquote>
    </SlateElement>
  );
}

export function CodeBlockElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props}>
      <pre
        style={{
          background: "#f3f4f6",
          borderRadius: 6,
          padding: "12px 16px",
          margin: "12px 0",
          overflowX: "auto",
          fontFamily: "monospace",
          fontSize: 13,
          lineHeight: 1.5,
        }}
      >
        <code>{props.children}</code>
      </pre>
    </SlateElement>
  );
}

export function CodeLineElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props}>
      <div>{props.children}</div>
    </SlateElement>
  );
}

export function ListElementStatic(props: SlateElementProps) {
  const element = props.element as { type: string };
  const Tag = element.type === "ol" ? "ol" : "ul";
  return (
    <SlateElement {...props}>
      <Tag
        style={{
          margin: "8px 0",
          paddingLeft: 24,
          listStyleType: Tag === "ol" ? "decimal" : "disc",
        }}
      >
        {props.children}
      </Tag>
    </SlateElement>
  );
}

export function ListItemElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props}>
      <li style={{ margin: "2px 0" }}>{props.children}</li>
    </SlateElement>
  );
}

export function LinkElementStatic(props: SlateElementProps) {
  const element = props.element as {
    url?: string;
    target?: string;
  };
  const rel =
    element.target === "_blank" ? "noopener noreferrer" : undefined;
  return (
    <SlateElement {...props}>
      <a
        href={element.url}
        target={element.target}
        rel={rel}
        style={{
          color: "#2563eb",
          textDecoration: "underline",
        }}
      >
        {props.children}
      </a>
    </SlateElement>
  );
}

export function ImageElementStatic(props: SlateElementProps) {
  const element = props.element as {
    url?: string;
    alt?: string;
  };
  return (
    <SlateElement {...props}>
      <img
        src={element.url}
        alt={element.alt || ""}
        loading="lazy"
        style={{
          maxWidth: "100%",
          borderRadius: 6,
          margin: "12px 0",
        }}
      />
      {props.children}
    </SlateElement>
  );
}

export function HorizontalRuleElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props}>
      <hr
        style={{
          border: "none",
          borderTop: "2px solid #d1d5db",
          margin: "24px 0",
        }}
      />
      {props.children}
    </SlateElement>
  );
}

export function TableElementStatic({ children, ...rest }: SlateElementProps) {
  return (
    <SlateElement
      {...rest}
      as="table"
      style={{
        borderCollapse: "collapse" as const,
        width: "100%",
        margin: "12px 0",
      }}
    >
      <tbody>{children}</tbody>
    </SlateElement>
  );
}

export function TableRowElementStatic({ children, ...rest }: SlateElementProps) {
  return (
    <SlateElement {...rest} as="tr">
      {children}
    </SlateElement>
  );
}

export function TableCellElementStatic({ children, ...rest }: SlateElementProps) {
  const element = rest.element as {
    type: string;
    colSpan?: number;
    rowSpan?: number;
  };
  const isHeader = element.type === "th";

  return (
    <SlateElement
      {...rest}
      as={isHeader ? "th" : "td"}
      style={{
        border: "1px solid #d1d5db",
        padding: "8px 12px",
        minWidth: 60,
        verticalAlign: "top" as const,
        background: isHeader ? "#f3f4f6" : undefined,
        fontWeight: isHeader ? 600 : undefined,
      }}
    >
      {children}
    </SlateElement>
  );
}
