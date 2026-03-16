"use client";

import { PlateElement, type PlateElementProps } from "platejs/react";

/** Horizontal rule — void element. */
export function HrElement(props: PlateElementProps) {
  return (
    <PlateElement {...props}>
      <div contentEditable={false}>
        <hr
          style={{
            border: "none",
            borderTop: "2px solid var(--border)",
            margin: "16px 0",
          }}
        />
      </div>
      {props.children}
    </PlateElement>
  );
}

/**
 * Table elements render as raw HTML tags with Slate attributes spread.
 * We use PlateElement with `as` to replace the default <div> wrapper
 * with the correct table HTML tag.
 */
export function TableElement({ children, ...rest }: PlateElementProps) {
  return (
    <PlateElement
      {...rest}
      as="table"
      style={{
        borderCollapse: "collapse" as const,
        width: "100%",
        margin: "8px 0",
        tableLayout: "fixed" as const,
      }}
    >
      <tbody>{children}</tbody>
    </PlateElement>
  );
}

export function TableRowElement({ children, ...rest }: PlateElementProps) {
  return (
    <PlateElement {...rest} as="tr">
      {children}
    </PlateElement>
  );
}

export function TableCellElement({ children, ...rest }: PlateElementProps) {
  const element = rest.element as {
    type?: string;
    colSpan?: number;
    rowSpan?: number;
  };
  const isHeader = element.type === "th";

  return (
    <PlateElement
      {...rest}
      as={isHeader ? "th" : "td"}
      style={{
        border: "1px solid var(--border)",
        padding: "8px 12px",
        minWidth: 60,
        verticalAlign: "top" as const,
        background: isHeader ? "var(--muted)" : undefined,
        fontWeight: isHeader ? 600 : undefined,
      }}
    >
      {children}
    </PlateElement>
  );
}

/** Image — void element. */
export function ImageElement(props: PlateElementProps) {
  const element = props.element as { url?: string; alt?: string };

  return (
    <PlateElement {...props}>
      <div contentEditable={false}>
        {element.url ? (
          <img
            src={element.url}
            alt={element.alt || ""}
            style={{
              maxWidth: "100%",
              borderRadius: "var(--radius)",
              margin: "8px 0",
            }}
          />
        ) : (
          <div
            style={{
              background: "var(--muted)",
              borderRadius: "var(--radius)",
              padding: 24,
              textAlign: "center",
              color: "var(--muted-foreground)",
              fontSize: 14,
            }}
          >
            No image URL
          </div>
        )}
      </div>
      {props.children}
    </PlateElement>
  );
}
