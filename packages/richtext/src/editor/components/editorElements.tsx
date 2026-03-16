"use client";

import { useCallback, useRef, useState } from "react";
import type React from "react";
import { PlateElement, type PlateElementProps, useEditorRef } from "platejs/react";
import { ImagePlaceholder } from "./image/ImagePlaceholder";

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

/** Table — renders PlateElement as <table>. */
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

/** Table row — renders PlateElement as <tr>. */
export function TableRowElement({ children, ...rest }: PlateElementProps) {
  return (
    <PlateElement {...rest} as="tr">
      {children}
    </PlateElement>
  );
}

/** Table cell — renders PlateElement as <td> or <th>. */
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

// =============================================================================
// Image element
// =============================================================================

/**
 * Alignment modes:
 * - "left"   — float left, text wraps on right
 * - "right"  — float right, text wraps on left
 * - "center" — centered block, no text wrap
 * - undefined — left-aligned block, no text wrap (default)
 */
type ImageAlign = "left" | "center" | "right";

/** PlateElement wrapper style — float for wrap modes, clear for block modes. */
function getPlateElementStyle(align?: ImageAlign): React.CSSProperties {
  if (align === "left") {
    return { float: "left", width: "auto", marginRight: 16, marginBottom: 8, clear: "left" };
  }
  if (align === "right") {
    return { float: "right", width: "auto", marginLeft: 16, marginBottom: 8, clear: "right" };
  }
  if (align === "center") {
    return { clear: "both", textAlign: "center" };
  }
  return { clear: "both" };
}

/** Inner container style. */
function getImageContainerStyle(width?: number, align?: ImageAlign): React.CSSProperties {
  const base: React.CSSProperties = {
    position: "relative",
    maxWidth: "100%",
    margin: "8px 0",
    width: width ? `${width}px` : undefined,
    display: "inline-block",
  };
  if (align === "center") {
    return { ...base, marginLeft: "auto", marginRight: "auto", display: "block" };
  }
  return base;
}

const controlBarStyle: React.CSSProperties = {
  display: "flex",
  gap: 2,
  padding: "3px 4px",
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
  position: "absolute",
  top: 6,
  left: 6,
  zIndex: 5,
};

function ControlBtn({
  active,
  label,
  title,
  onAction,
}: {
  active: boolean;
  label: string;
  title: string;
  onAction: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onAction();
      }}
      style={{
        padding: "2px 6px",
        border: active ? "1px solid var(--primary)" : "1px solid var(--border)",
        borderRadius: 3,
        background: active ? "var(--primary)" : "transparent",
        color: active ? "var(--primary-foreground)" : "var(--foreground)",
        cursor: "pointer",
        fontSize: 10,
        lineHeight: 1.3,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

/** Image — void element with click-to-select controls, resize, and alignment. */
export function ImageElement(props: PlateElementProps) {
  const editor = useEditorRef();
  const element = props.element as {
    url?: string;
    alt?: string;
    width?: number;
    align?: ImageAlign;
  };
  const containerRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(false);
  const [resizing, setResizing] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Click outside to deselect
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
      setSelected(false);
      document.removeEventListener("mousedown", handleClickOutside);
    }
  }, []);

  const handleSelect = useCallback(() => {
    setSelected(true);
    // Listen for clicks outside to deselect
    setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);
  }, [handleClickOutside]);

  const setAlign = useCallback(
    (align: ImageAlign | undefined) => {
      const path = editor.api.findPath(props.element);
      if (path) {
        editor.tf.setNodes({ align } as any, { at: path });
      }
    },
    [editor, props.element]
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setResizing(true);

      const startX = e.clientX;
      const startWidth = containerRef.current?.offsetWidth ?? 300;

      const onMouseMove = (ev: MouseEvent) => {
        const delta = ev.clientX - startX;
        const newWidth = Math.max(50, startWidth + delta);
        if (containerRef.current) {
          containerRef.current.style.width = `${newWidth}px`;
        }
      };

      const onMouseUp = (ev: MouseEvent) => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        setResizing(false);

        const delta = ev.clientX - startX;
        const newWidth = Math.max(50, startWidth + delta);
        const path = editor.api.findPath(props.element);
        if (path) {
          editor.tf.setNodes({ width: newWidth } as any, { at: path });
        }
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [editor, props.element]
  );

  return (
    <PlateElement {...props} style={getPlateElementStyle(element.align)}>
      <div
        contentEditable={false}
        ref={(el) => {
          (containerRef as any).current = el;
          (wrapperRef as any).current = el;
        }}
        style={{
          ...getImageContainerStyle(element.width, element.align),
          outline: selected ? "2px solid var(--primary)" : undefined,
          outlineOffset: 2,
          cursor: "pointer",
        }}
        onClick={handleSelect}
      >
        {element.url ? (
          <img
            src={element.url}
            alt={element.alt || ""}
            draggable={false}
            style={{
              width: "100%",
              borderRadius: "var(--radius)",
              display: "block",
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

        {/* Controls — visible when image is selected */}
        {selected && (
          <div style={controlBarStyle}>
            <ControlBtn
              active={element.align === "left"}
              label="⇤ Wrap left"
              title="Float left — text wraps on the right"
              onAction={() => setAlign("left")}
            />
            <ControlBtn
              active={element.align === "right"}
              label="Wrap right ⇥"
              title="Float right — text wraps on the left"
              onAction={() => setAlign("right")}
            />
            <ControlBtn
              active={element.align === "center"}
              label="⊡ Center"
              title="Center — no text wrap"
              onAction={() => setAlign("center")}
            />
            <ControlBtn
              active={!element.align}
              label="▭ Block"
              title="Block — left aligned, no text wrap"
              onAction={() => setAlign(undefined)}
            />
          </div>
        )}

        {/* Resize handle — visible when selected */}
        {selected && (
          <div
            onMouseDown={handleResizeStart}
            style={{
              position: "absolute",
              top: 0,
              right: -4,
              width: 8,
              height: "100%",
              cursor: "col-resize",
              background: "var(--primary)",
              borderRadius: 4,
              opacity: resizing ? 1 : 0.6,
            }}
          />
        )}
      </div>
      {props.children}
    </PlateElement>
  );
}

/** Upload placeholder — void element shown while an image is uploading. */
export function ImagePlaceholderElement(props: PlateElementProps) {
  return (
    <PlateElement {...props}>
      <ImagePlaceholder />
      {props.children}
    </PlateElement>
  );
}
