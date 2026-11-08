import React from "react";
import type { RenderStaticNodeWrapper, TListElement } from "platejs";
import type { SlateElementProps, SlateRenderElementProps } from "platejs/static";
import { SlateElement } from "platejs/static";
import { isOrderedList } from "@platejs/list";

/**
 * Server-safe static renderer for a paragraph node.
 *
 * @param props - The Slate element props for the paragraph node.
 * @returns The paragraph content wrapped in a `<p>` `SlateElement` — or a
 *   `<div>` with the same styling for an indent-list item, whose children are
 *   the `<ul>`/`<ol>` wrapper from `renderIndentListStatic` (a `<p>` cannot
 *   contain a list; the browser would split it and break hydration).
 */
export function ParagraphElementStatic(props: SlateElementProps) {
  const Tag = props.element.listStyleType ? "div" : "p";
  return (
    <SlateElement {...props}>
      <Tag style={{ margin: "4px 0", lineHeight: 1.7 }}>{props.children}</Tag>
    </SlateElement>
  );
}

/**
 * Server-safe static renderer for a heading node (H1–H6).
 *
 * @param props - The Slate element props for the heading node; `element.type`
 *   selects the rendered tag and its font size/weight.
 * @returns The heading content wrapped in the matching heading tag inside a
 *   `SlateElement`.
 */
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

/**
 * Server-safe static renderer for a blockquote node.
 *
 * @param props - The Slate element props for the blockquote node.
 * @returns The quoted content wrapped in a styled `<blockquote>` `SlateElement`.
 */
export function BlockquoteElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props}>
      <blockquote
        style={{
          borderLeft: "3px solid var(--border)",
          paddingLeft: 16,
          margin: "12px 0",
          color: "var(--muted-foreground)",
          fontStyle: "italic",
        }}
      >
        {props.children}
      </blockquote>
    </SlateElement>
  );
}

/**
 * Server-safe static renderer for a code block node.
 *
 * @param props - The Slate element props for the code block node.
 * @returns The code lines wrapped in a `<pre><code>` `SlateElement`.
 */
export function CodeBlockElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props}>
      <pre
        style={{
          background: "var(--muted)",
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

/**
 * Server-safe static renderer for a single line within a code block.
 *
 * @param props - The Slate element props for the code line node.
 * @returns The line content wrapped in a `<div>` `SlateElement`.
 */
export function CodeLineElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props}>
      <div>{props.children}</div>
    </SlateElement>
  );
}

/**
 * Server-safe static renderer for a list node.
 *
 * @param props - The Slate element props for the list node; `element.type`
 *   of `"ol"` renders an ordered list, otherwise an unordered list.
 * @returns The list items wrapped in an `<ol>` or `<ul>` `SlateElement`.
 */
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

/**
 * Server-safe static renderer for a list item node.
 *
 * @param props - The Slate element props for the list item node.
 * @returns The item content wrapped in an `<li>` `SlateElement`.
 */
export function ListItemElementStatic(props: SlateElementProps) {
  return (
    <SlateElement {...props}>
      <li style={{ margin: "2px 0" }}>{props.children}</li>
    </SlateElement>
  );
}

/**
 * Renders one item of an indent list (a block carrying `listStyleType`, which
 * is how the editor stores bulleted and numbered lists) inside its own
 * `<ul>`/`<ol>` + `<li>`.
 *
 * @param props - The wrapped list block's render props; `element.listStyleType`
 *   picks `<ol>` vs `<ul>` and `element.listStart` the ordered start number.
 * @returns The block's content inside a one-item `<ul>`/`<ol>`.
 */
function IndentListStatic(props: SlateRenderElementProps) {
  const { listStart, listStyleType } = props.element as TListElement;
  const Tag = isOrderedList(props.element) ? "ol" : "ul";
  return (
    <Tag
      style={{ listStyleType, margin: 0, padding: 0, position: "relative" }}
      start={listStart}
    >
      <li>{props.children}</li>
    </Tag>
  );
}

/**
 * `render.belowNodes` for `BaseListPlugin` in the static renderer: wraps
 * every list block in {@link IndentListStatic}. Plate 53.3.13 moved this
 * wrapper from `BaseListPlugin` to the React-only `ListPlugin`, so without it
 * the static renderer prints list items as bare paragraphs. Markup matches
 * the wrapper Plate 52's `BaseListPlugin` rendered.
 *
 * @param props - The wrapped block's render props.
 * @returns The wrapper for a block with a `listStyleType`, else `undefined`.
 */
export const renderIndentListStatic: RenderStaticNodeWrapper = (props) => {
  if (!props.element.listStyleType) return;
  return (wrapped) => <IndentListStatic {...wrapped} />;
};

/**
 * Server-safe static renderer for a link node.
 *
 * @param props - The Slate element props for the link node; `element.url`
 *   and `element.target` set the anchor's `href`/`target`, and `target`
 *   of `"_blank"` adds `rel="noopener noreferrer"`.
 * @returns A `SlateElement` rendered as the `<a>` itself. A wrapping
 *   `SlateElement` would be a `<div>` inside the paragraph's `<p>` — invalid
 *   HTML that breaks hydration and puts every link on its own line.
 */
export function LinkElementStatic(props: SlateElementProps) {
  const element = props.element as {
    url?: string;
    target?: string;
  };
  const rel =
    element.target === "_blank" ? "noopener noreferrer" : undefined;
  return (
    <SlateElement
      {...props}
      as="a"
      attributes={{ ...props.attributes, href: element.url, target: element.target, rel }}
      style={{
        color: "var(--primary)",
        textDecoration: "underline",
      }}
    >
      {props.children}
    </SlateElement>
  );
}

/**
 * Server-safe static renderer for an image node.
 *
 * @param props - The Slate element props for the image node; `element.url`,
 *   `element.alt`, `element.width`, `element.aspectRatio`, and
 *   `element.align` control the rendered image and its float/alignment.
 *   A set `aspectRatio` crops the image to that shape (`object-fit: cover`)
 *   and scales with the width, so it holds on narrow screens too.
 * @returns The image (sized and aligned per `element`) wrapped in a
 *   `SlateElement`.
 */
export function ImageElementStatic(props: SlateElementProps) {
  const element = props.element as {
    url?: string;
    alt?: string;
    width?: number;
    aspectRatio?: number;
    align?: "left" | "center" | "right";
  };

  // Float/align goes on the SlateElement wrapper so text wraps around it
  const wrapperStyle: React.CSSProperties = {
    ...(element.align === "left" && { float: "left" as const, width: "auto", marginRight: 16, marginBottom: 8, clear: "left" as const }),
    ...(element.align === "right" && { float: "right" as const, width: "auto", marginLeft: 16, marginBottom: 8, clear: "right" as const }),
    ...(element.align === "center" && { clear: "both" as const, textAlign: "center" as const }),
    ...(!element.align && { clear: "both" as const }),
  };

  const innerStyle: React.CSSProperties = {
    maxWidth: "100%",
    margin: "12px 0",
    width: element.width ? `${element.width}px` : undefined,
    display: "inline-block",
    ...(element.align === "center" && { marginLeft: "auto", marginRight: "auto", display: "block" }),
  };

  return (
    <SlateElement {...props} style={wrapperStyle}>
      <div style={innerStyle}>
        <img
          src={element.url}
          alt={element.alt || ""}
          loading="lazy"
          style={{
            width: "100%",
            borderRadius: 6,
            display: "block",
            ...(element.aspectRatio !== undefined && {
              aspectRatio: element.aspectRatio,
              objectFit: "cover" as const,
            }),
          }}
        />
      </div>
      {props.children}
    </SlateElement>
  );
}

/**
 * Server-safe static renderer for a horizontal rule node.
 *
 * @param props - The Slate element props for the `hr` node.
 * @returns The horizontal rule wrapped in a `SlateElement`.
 */
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

/**
 * Server-safe static renderer for a table node.
 *
 * @returns The table's rows wrapped in a `<table><tbody>` `SlateElement`.
 */
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

/**
 * Server-safe static renderer for a table row node.
 *
 * @returns The row's cells wrapped in a `<tr>` `SlateElement`.
 */
export function TableRowElementStatic({ children, ...rest }: SlateElementProps) {
  return (
    <SlateElement {...rest} as="tr">
      {children}
    </SlateElement>
  );
}

/**
 * Server-safe static renderer for a table cell node.
 *
 * @returns The cell content wrapped in a `<td>` or `<th>` `SlateElement`,
 *   using `<th>` (with header styling) when the element type is `"th"`.
 */
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
