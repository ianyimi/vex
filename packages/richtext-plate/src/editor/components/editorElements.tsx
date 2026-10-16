"use client";

import { useCallback, useRef, useState } from "react";
import type React from "react";
import { PlateElement, type PlateElementProps, useEditorRef } from "platejs/react";
import { ImagePlaceholder } from "./image/ImagePlaceholder";

/**
 * Horizontal rule — void element.
 *
 * @param props - The Plate element props for the `hr` node.
 * @returns The rendered horizontal rule wrapped in `PlateElement`.
 */
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
 * Table — renders PlateElement as `<table>`.
 *
 * @returns The table's rows wrapped in a `<table><tbody>` `PlateElement`.
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

/**
 * Table row — renders PlateElement as `<tr>`.
 *
 * @returns The row's cells wrapped in a `<tr>` `PlateElement`.
 */
export function TableRowElement({ children, ...rest }: PlateElementProps) {
  return (
    <PlateElement {...rest} as="tr">
      {children}
    </PlateElement>
  );
}

/**
 * Table cell — renders PlateElement as `<td>` or `<th>`.
 *
 * @returns The cell content wrapped in a `<td>` or `<th>` `PlateElement`,
 *   using `<th>` (with header styling) when the element type is `"th"`.
 */
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

/**
 * PlateElement wrapper style — float for wrap modes, clear for block modes.
 *
 * @param align - The image's alignment mode.
 * @returns The CSS for the wrapping element matching that alignment.
 */
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

/**
 * Inner container style.
 *
 * @param width - The image's stored width in pixels, if resized.
 * @param align - The image's alignment mode.
 * @returns The CSS for the image's inner container, sized and centered
 *   according to `width` and `align`.
 */
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

/** Which image handle started a resize drag. */
type ResizeEdge = "right" | "bottom" | "corner";

/** Cursor per handle: edges stretch one axis, the corner scales both. */
const RESIZE_CURSORS: Record<ResizeEdge, React.CSSProperties["cursor"]> = {
  right: "ew-resize",
  bottom: "ns-resize",
  corner: "nwse-resize",
};

/**
 * Shared look for the image resize handles.
 *
 * @param edge - Which handle, for its cursor.
 * @param resizing - Whether a drag is in progress (handles go fully opaque).
 * @returns The CSS shared by every handle; callers add position and size.
 */
function resizeHandleStyle(edge: ResizeEdge, resizing: boolean): React.CSSProperties {
  return {
    position: "absolute",
    cursor: RESIZE_CURSORS[edge],
    background: "var(--primary)",
    borderRadius: 4,
    opacity: resizing ? 1 : 0.6,
    boxSizing: "border-box",
  };
}

/** A custom ratio within 1% of the image's own is snapped back to it (stored as absent). */
const NATURAL_RATIO_TOLERANCE = 0.01;

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

/**
 * Image — void element with click-to-select controls, resize, and alignment.
 *
 * Sizing is stored as `width` (display px) and an optional `aspectRatio`
 * (width / height). Absent `aspectRatio` means the image's own shape; when set,
 * the image is cropped to it (`object-fit: cover`), never stretched.
 *
 * Handles: the corner scales both axes keeping the current shape (Shift
 * frees it); the right edge changes only width and the bottom edge only
 * height, both reshaping the crop. The control bar offers "Reset ratio"
 * (drop `aspectRatio`, keep width) and "Original size" (drop both).
 *
 * @param props - The Plate element props for the image node; `props.element`
 *   carries `url`, `alt`, `width`, `aspectRatio`, and `align`.
 * @returns The image (or a placeholder when no URL is set) with, while
 *   selected, an alignment/reset control bar and the resize handles.
 */
export function ImageElement(props: PlateElementProps) {
  const editor = useEditorRef();
  const element = props.element as {
    url?: string;
    alt?: string;
    width?: number;
    aspectRatio?: number;
    align?: ImageAlign;
  };
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [selected, setSelected] = useState(false);
  const [hovered, setHovered] = useState(false);
  // Live size while dragging; rendered instead of the node until mouseup.
  const [draft, setDraft] = useState<{ width: number; aspectRatio?: number } | null>(null);
  const resizing = draft !== null;

  // Click outside to deselect. Tested against the event's dispatch path, not
  // `contains(target)`: a control-bar button can unmount mid-event (e.g.
  // "Reset ratio" hides itself once the ratio is gone), and a detached target
  // would otherwise read as an outside click and close the bar.
  const handleClickOutside = useCallback((e: MouseEvent) => {
    const container = containerRef.current;
    if (container && !e.composedPath().includes(container)) {
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

  const resetSize = useCallback(
    (keys: ("width" | "aspectRatio")[]) => {
      const path = editor.api.findPath(props.element);
      if (path) editor.tf.unsetNodes(keys, { at: path });
    },
    [editor, props.element]
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, edge: ResizeEdge) => {
      e.preventDefault();
      e.stopPropagation();

      // Lock the cursor to this handle's for the whole drag: without this,
      // passing over the other handles (or any element with its own cursor)
      // flips it mid-drag. `user-select: none` also stops the drag from
      // selecting editor text as it sweeps across it.
      const dragStyle = document.createElement("style");
      dragStyle.textContent = `* { cursor: ${RESIZE_CURSORS[edge]} !important; user-select: none !important; }`;
      document.head.appendChild(dragStyle);

      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = containerRef.current?.offsetWidth ?? 300;
      const startHeight = imgRef.current?.offsetHeight || startWidth;
      const startRatio = startWidth / startHeight;
      const img = imgRef.current;
      const naturalRatio =
        img && img.naturalWidth > 0 && img.naturalHeight > 0
          ? img.naturalWidth / img.naturalHeight
          : undefined;
      // The container renders at `maxWidth: 100%`, so a width past the
      // editable area would be stored but never shown (and enlarging an
      // already full-width image would look like a dead handle). Clamp to the
      // editable area's content width so the stored width is the rendered one.
      const editable = containerRef.current?.closest<HTMLElement>("[data-slate-editor]");
      const editableStyle = editable ? getComputedStyle(editable) : undefined;
      const maxWidth = editable && editableStyle
        ? editable.clientWidth -
          parseFloat(editableStyle.paddingLeft) -
          parseFloat(editableStyle.paddingRight)
        : Number.POSITIVE_INFINITY;
      const clampWidth = (width: number) =>
        Math.round(Math.min(maxWidth, Math.max(50, width)));
      const clampHeight = (height: number) => Math.max(50, height);

      // `aspectRatio: undefined` in the result means "shape unchanged".
      const sizeAt = (ev: MouseEvent): { width: number; aspectRatio?: number } => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        if (edge === "right") {
          const width = clampWidth(startWidth + dx);
          return { width, aspectRatio: width / startHeight };
        }
        if (edge === "bottom") {
          return { width: startWidth, aspectRatio: startWidth / clampHeight(startHeight + dy) };
        }
        if (ev.shiftKey) {
          const width = clampWidth(startWidth + dx);
          return { width, aspectRatio: width / clampHeight(startHeight + dy) };
        }
        // Corner, shape locked: follow whichever axis the pointer moved further.
        const fromY = dy * startRatio;
        return { width: clampWidth(startWidth + (Math.abs(dx) >= Math.abs(fromY) ? dx : fromY)) };
      };

      const onMouseMove = (ev: MouseEvent) => {
        const size = sizeAt(ev);
        setDraft({ width: size.width, aspectRatio: size.aspectRatio ?? element.aspectRatio });
      };

      const onMouseUp = (ev: MouseEvent) => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        dragStyle.remove();
        setDraft(null);

        const path = editor.api.findPath(props.element);
        if (!path) return;
        const size = sizeAt(ev);
        editor.tf.setNodes({ width: size.width } as any, { at: path });
        if (size.aspectRatio === undefined) return;
        const isNatural =
          naturalRatio !== undefined &&
          Math.abs(size.aspectRatio - naturalRatio) / naturalRatio < NATURAL_RATIO_TOLERANCE;
        if (isNatural) {
          editor.tf.unsetNodes("aspectRatio", { at: path });
        } else {
          editor.tf.setNodes(
            { aspectRatio: Math.round(size.aspectRatio * 10000) / 10000 } as any,
            { at: path }
          );
        }
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [editor, props.element, element.aspectRatio]
  );

  const width = draft?.width ?? element.width;
  const aspectRatio = draft ? draft.aspectRatio : element.aspectRatio;

  return (
    <PlateElement {...props} style={getPlateElementStyle(element.align)}>
      <div
        contentEditable={false}
        ref={containerRef}
        style={{
          ...getImageContainerStyle(width, element.align),
          outline: selected ? "2px solid var(--primary)" : undefined,
          outlineOffset: 2,
          cursor: "pointer",
        }}
        onClick={handleSelect}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {element.url ? (
          <img
            ref={imgRef}
            src={element.url}
            alt={element.alt || ""}
            draggable={false}
            style={{
              width: "100%",
              borderRadius: "var(--radius)",
              display: "block",
              // A custom shape crops, never stretches.
              ...(aspectRatio !== undefined && { aspectRatio, objectFit: "cover" }),
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
            {element.aspectRatio !== undefined && (
              <ControlBtn
                active={false}
                label="Reset ratio"
                title="Restore the image's original shape, keeping its width"
                onAction={() => resetSize(["aspectRatio"])}
              />
            )}
            {(element.width !== undefined || element.aspectRatio !== undefined) && (
              <ControlBtn
                active={false}
                label="Original size"
                title="Restore the image's original size and shape"
                onAction={() => resetSize(["width", "aspectRatio"])}
              />
            )}
          </div>
        )}

        {/* Resize handles — shown on hover too, so they're discoverable without
            a click. Edges reshape (crop) one axis; the corner keeps the shape
            unless Shift is held. */}
        {(selected || hovered || resizing) && (
          <>
            <div
              title="Drag to change width"
              onMouseDown={(e) => handleResizeStart(e, "right")}
              style={{ ...resizeHandleStyle("right", resizing), top: 0, right: -4, width: 8, height: "100%" }}
            />
            <div
              title="Drag to change height"
              onMouseDown={(e) => handleResizeStart(e, "bottom")}
              style={{ ...resizeHandleStyle("bottom", resizing), left: 0, bottom: -4, width: "100%", height: 8 }}
            />
            <div
              title="Drag to resize — hold Shift to change the shape"
              onMouseDown={(e) => handleResizeStart(e, "corner")}
              style={{
                ...resizeHandleStyle("corner", resizing),
                right: -7,
                bottom: -7,
                width: 14,
                height: 14,
                opacity: 1,
                border: "2px solid var(--background)",
              }}
            />
          </>
        )}
      </div>
      {props.children}
    </PlateElement>
  );
}

/**
 * Upload placeholder — void element shown while an image is uploading.
 *
 * @param props - The Plate element props for the placeholder node.
 * @returns The rendered `ImagePlaceholder` wrapped in `PlateElement`.
 */
export function ImagePlaceholderElement(props: PlateElementProps) {
  return (
    <PlateElement {...props}>
      <ImagePlaceholder />
      {props.children}
    </PlateElement>
  );
}
