"use client";

import React, { useCallback, useState, useRef, useEffect } from "react";
import { useEditorRef, useEditorSelector } from "platejs/react";
import { toggleList, ListStyleType } from "@platejs/list";
import { upsertLink } from "@platejs/link";
import { insertTable } from "@platejs/table";
import { toggleCodeBlock } from "@platejs/code-block";
import type { VexEditorFeature } from "../features/types";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const btnBase: React.CSSProperties = {
  borderRadius: "var(--radius)",
  padding: "4px 8px",
  cursor: "pointer",
  minWidth: 32,
  fontSize: 14,
  lineHeight: 1,
  transition: "all 0.1s ease",
  fontFamily: "inherit",
};

function activeStyle(active: boolean): React.CSSProperties {
  return {
    ...btnBase,
    background: active ? "var(--primary)" : "transparent",
    color: active ? "var(--primary-foreground)" : "var(--foreground)",
    border: active ? "1px solid var(--primary)" : "1px solid var(--border)",
  };
}

const separatorStyle: React.CSSProperties = {
  width: 1,
  height: 24,
  background: "var(--border)",
  margin: "0 4px",
  flexShrink: 0,
};

/** Returns true when the selection is inside a block of the given type. */
function useIsBlockActive(type: string) {
  return useEditorSelector(
    (ed) => !!ed.api.block({ match: { type } }),
    [type]
  );
}

// ---------------------------------------------------------------------------
// Instant tooltip (CSS-only, no hover delay)
// ---------------------------------------------------------------------------

const tooltipStyles = `
.vex-tb-wrap { position: relative; }
.vex-tb-wrap > .vex-tb-tip {
  display: none;
  position: absolute;
  top: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  line-height: 1.3;
  white-space: nowrap;
  pointer-events: none;
  z-index: 50;
  background: var(--popover);
  color: var(--popover-foreground);
  border: 1px solid var(--border);
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
}
.vex-tb-wrap:hover > .vex-tb-tip { display: block; }
`;

function Tip({ text }: { text: string }) {
  return <span className="vex-tb-tip">{text}</span>;
}

// ---------------------------------------------------------------------------
// Mark buttons
// ---------------------------------------------------------------------------

const MARK_KEYS = ["bold", "italic", "underline", "strikethrough", "code"];

const MARK_META: Record<
  string,
  { label: string; shortcut: string; fw?: number; fs?: string; td?: string }
> = {
  bold: { label: "B", shortcut: "Ctrl+B", fw: 700 },
  italic: { label: "I", shortcut: "Ctrl+I", fs: "italic" },
  underline: { label: "U", shortcut: "Ctrl+U", td: "underline" },
  strikethrough: { label: "S", shortcut: "Ctrl+Shift+S" },
  code: { label: "mono", shortcut: "Ctrl+E" },
};

function MarkButton({ markType }: { markType: string }) {
  const editor = useEditorRef();
  const meta = MARK_META[markType]!;
  const isActive = useEditorSelector(
    (ed) => ed.api.hasMark(markType),
    [markType]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      editor.tf.toggleMark(markType);
    },
    [editor, markType]
  );

  return (
    <span className="vex-tb-wrap">
      <button
        type="button"
        onMouseDown={handleMouseDown}
        style={{
          ...activeStyle(isActive),
          fontWeight: meta.fw,
          fontStyle: meta.fs,
          textDecoration: meta.td,
        }}
        aria-pressed={isActive}
      >
        {meta.label}
      </button>
      <Tip text={`${meta.label} (${meta.shortcut})`} />
    </span>
  );
}

// ---------------------------------------------------------------------------
// Heading dropdown (H1–H6)
// ---------------------------------------------------------------------------

const HEADING_LEVELS = ["h1", "h2", "h3", "h4", "h5", "h6"] as const;
const HEADING_LABELS: Record<string, string> = {
  h1: "Heading 1",
  h2: "Heading 2",
  h3: "Heading 3",
  h4: "Heading 4",
  h5: "Heading 5",
  h6: "Heading 6",
};

function HeadingDropdown() {
  const editor = useEditorRef();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeHeading = useEditorSelector((ed) => {
    for (const h of HEADING_LEVELS) {
      if (ed.api.block({ match: { type: h } })) return h;
    }
    return null;
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSelect = useCallback(
    (level: string) => {
      editor.tf.toggleBlock(level);
      setOpen(false);
    },
    [editor]
  );

  const displayLabel = activeHeading ? activeHeading.toUpperCase() : "H";

  return (
    <div ref={ref} style={{ position: "relative" }} className="vex-tb-wrap">
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          setOpen((v) => !v);
        }}
        style={{
          ...activeStyle(!!activeHeading),
          display: "flex",
          alignItems: "center",
          gap: 2,
          minWidth: 42,
        }}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {displayLabel}
        <span style={{ fontSize: 10, lineHeight: 1 }}>▾</span>
      </button>
      {!open && <Tip text="Heading level" />}
      {open && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 50,
            background: "var(--popover)",
            color: "var(--popover-foreground)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            overflow: "hidden",
            minWidth: 140,
          }}
        >
          {/* Paragraph (clear heading) */}
          <button
            type="button"
            role="option"
            aria-selected={!activeHeading}
            onMouseDown={(e) => {
              e.preventDefault();
              if (activeHeading) editor.tf.toggleBlock(activeHeading);
              setOpen(false);
            }}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "6px 12px",
              border: "none",
              background: !activeHeading ? "var(--accent)" : "transparent",
              color: !activeHeading
                ? "var(--accent-foreground)"
                : "var(--popover-foreground)",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Paragraph
          </button>
          {HEADING_LEVELS.map((h) => (
            <button
              key={h}
              type="button"
              role="option"
              aria-selected={activeHeading === h}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(h);
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "6px 12px",
                border: "none",
                background:
                  activeHeading === h ? "var(--primary)" : "transparent",
                color:
                  activeHeading === h
                    ? "var(--primary-foreground)"
                    : "var(--popover-foreground)",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: activeHeading === h ? 600 : 400,
              }}
            >
              {HEADING_LABELS[h]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Block toggle button (blockquote, code block)
// ---------------------------------------------------------------------------

function BlockButton({
  blockType,
  label,
  tooltip,
}: {
  blockType: string;
  label: string;
  tooltip: string;
}) {
  const editor = useEditorRef();
  const isActive = useIsBlockActive(blockType);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      editor.tf.toggleBlock(blockType);
    },
    [editor, blockType]
  );

  return (
    <span className="vex-tb-wrap">
      <button
        type="button"
        onMouseDown={handleMouseDown}
        style={activeStyle(isActive)}
        aria-pressed={isActive}
      >
        {label}
      </button>
      <Tip text={tooltip} />
    </span>
  );
}

// ---------------------------------------------------------------------------
// Code block button (uses Plate's toggleCodeBlock for multiline support)
// ---------------------------------------------------------------------------

function CodeBlockButton() {
  const editor = useEditorRef();
  const isActive = useIsBlockActive("code_block");

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      toggleCodeBlock(editor);
    },
    [editor]
  );

  return (
    <span className="vex-tb-wrap">
      <button
        type="button"
        onMouseDown={handleMouseDown}
        style={activeStyle(isActive)}
        aria-pressed={isActive}
      >
        {"{ }"}
      </button>
      <Tip text="Code block" />
    </span>
  );
}

// ---------------------------------------------------------------------------
// List buttons
// ---------------------------------------------------------------------------

function ListButton({
  ordered,
  label,
  tooltip,
}: {
  ordered: boolean;
  label: string;
  tooltip: string;
}) {
  const editor = useEditorRef();
  const styleType = ordered ? ListStyleType.Decimal : ListStyleType.Disc;

  const isActive = useEditorSelector(
    (ed) => {
      const entry = ed.api.node({ match: { listStyleType: styleType } });
      return !!entry;
    },
    [styleType]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      toggleList(editor, { listStyleType: styleType });
    },
    [editor, styleType]
  );

  return (
    <span className="vex-tb-wrap">
      <button
        type="button"
        onMouseDown={handleMouseDown}
        style={activeStyle(isActive)}
        aria-pressed={isActive}
      >
        {label}
      </button>
      <Tip text={tooltip} />
    </span>
  );
}

// ---------------------------------------------------------------------------
// Link button
// ---------------------------------------------------------------------------

function LinkButton() {
  const editor = useEditorRef();
  const [showInput, setShowInput] = useState(false);
  const [url, setUrl] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const isActive = useEditorSelector(
    (ed) => !!ed.api.node({ match: { type: "a" } }),
    []
  );

  useEffect(() => {
    if (!showInput) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowInput(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showInput]);

  const handleInsert = useCallback(() => {
    if (!url.trim()) return;
    upsertLink(editor, { url: url.trim() });
    setUrl("");
    setShowInput(false);
  }, [editor, url]);

  return (
    <div ref={ref} style={{ position: "relative" }} className="vex-tb-wrap">
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          setShowInput((v) => !v);
        }}
        style={activeStyle(isActive)}
      >
        🔗
      </button>
      {!showInput && <Tip text="Insert link" />}
      {showInput && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 50,
            background: "var(--popover)",
            color: "var(--popover-foreground)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            padding: 8,
            display: "flex",
            gap: 4,
            minWidth: 280,
          }}
        >
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleInsert();
              }
              if (e.key === "Escape") setShowInput(false);
            }}
            placeholder="https://..."
            autoFocus
            style={{
              flex: 1,
              padding: "4px 8px",
              border: "1px solid var(--input)",
              borderRadius: "var(--radius)",
              fontSize: 13,
              outline: "none",
              background: "var(--background)",
              color: "var(--foreground)",
            }}
          />
          <button
            type="button"
            onClick={handleInsert}
            disabled={!url.trim()}
            style={{
              ...btnBase,
              background: url.trim() ? "var(--primary)" : "var(--muted)",
              color: url.trim()
                ? "var(--primary-foreground)"
                : "var(--muted-foreground)",
              border: "none",
              fontSize: 13,
            }}
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Insert buttons (table, horizontal rule)
// ---------------------------------------------------------------------------

const MAX_TABLE_SIZE = 6;

function TableButton() {
  const editor = useEditorRef();
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState<{ row: number; col: number }>({
    row: 0,
    col: 0,
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleInsert = useCallback(
    (rowCount: number, colCount: number) => {
      insertTable(editor, { rowCount, colCount });
      setOpen(false);
    },
    [editor]
  );

  return (
    <div ref={ref} style={{ position: "relative" }} className="vex-tb-wrap">
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          setOpen((v) => !v);
        }}
        style={activeStyle(false)}
        aria-expanded={open}
      >
        ▦
      </button>
      {!open && <Tip text="Insert table" />}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 50,
            background: "var(--popover)",
            color: "var(--popover-foreground)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            padding: 8,
          }}
        >
          <div
            style={{
              fontSize: 12,
              marginBottom: 6,
              textAlign: "center",
              color: "var(--muted-foreground)",
            }}
          >
            {hover.row > 0
              ? `${hover.row} × ${hover.col}`
              : "Select table size"}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${MAX_TABLE_SIZE}, 20px)`,
              gap: 2,
            }}
          >
            {Array.from({ length: MAX_TABLE_SIZE * MAX_TABLE_SIZE }).map(
              (_, i) => {
                const row = Math.floor(i / MAX_TABLE_SIZE) + 1;
                const col = (i % MAX_TABLE_SIZE) + 1;
                const highlighted =
                  row <= hover.row && col <= hover.col;
                return (
                  <div
                    key={i}
                    onMouseEnter={() => setHover({ row, col })}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleInsert(row, col);
                    }}
                    style={{
                      width: 20,
                      height: 20,
                      border: "1px solid var(--border)",
                      borderRadius: 2,
                      background: highlighted
                        ? "var(--primary)"
                        : "transparent",
                      cursor: "pointer",
                      transition: "background 0.05s",
                    }}
                  />
                );
              }
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function HorizontalRuleButton() {
  const editor = useEditorRef();

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      editor.tf.insertNodes(
        [
          { type: "hr", children: [{ text: "" }] } as any,
          { type: "p", children: [{ text: "" }] } as any,
        ],
        { select: true }
      );
    },
    [editor]
  );

  return (
    <span className="vex-tb-wrap">
      <button
        type="button"
        onMouseDown={handleMouseDown}
        style={activeStyle(false)}
      >
        ―
      </button>
      <Tip text="Horizontal rule" />
    </span>
  );
}

// ---------------------------------------------------------------------------
// Separator
// ---------------------------------------------------------------------------

function Separator() {
  return <div style={separatorStyle} />;
}

// ---------------------------------------------------------------------------
// Main Toolbar
// ---------------------------------------------------------------------------

interface ToolbarProps {
  features: VexEditorFeature[];
}

const featureSet = (features: VexEditorFeature[]) =>
  new Set(features.map((f) => f.key));

export function Toolbar({ features }: ToolbarProps) {
  const enabled = featureSet(features);

  const hasMarks =
    enabled.has("bold") ||
    enabled.has("italic") ||
    enabled.has("underline") ||
    enabled.has("strikethrough") ||
    enabled.has("code");

  const hasBlocks =
    enabled.has("heading") ||
    enabled.has("blockquote") ||
    enabled.has("codeBlock");

  const hasLists = enabled.has("list");
  const hasInserts =
    enabled.has("link") ||
    enabled.has("image") ||
    enabled.has("table") ||
    enabled.has("horizontalRule");

  if (!hasMarks && !hasBlocks && !hasLists && !hasInserts) {
    return null;
  }

  let needsSep = false;

  return (
    <>
    <style dangerouslySetInnerHTML={{ __html: tooltipStyles }} />
    <div
      role="toolbar"
      aria-label="Formatting options"
      style={{
        display: "flex",
        gap: 4,
        padding: "8px",
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      {/* ── Marks ── */}
      {hasMarks && (
        <>
          {MARK_KEYS.filter((k) => enabled.has(k)).map((k) => (
            <MarkButton key={k} markType={k} />
          ))}
          {(needsSep = true) && null}
        </>
      )}

      {/* ── Blocks ── */}
      {hasBlocks && (
        <>
          {needsSep && <Separator />}
          {enabled.has("heading") && <HeadingDropdown />}
          {enabled.has("blockquote") && (
            <BlockButton
              blockType="blockquote"
              label={"\u201C"}
              tooltip="Blockquote"
            />
          )}
          {enabled.has("codeBlock") && <CodeBlockButton />}
          {(needsSep = true) && null}
        </>
      )}

      {/* ── Lists ── */}
      {hasLists && (
        <>
          {needsSep && <Separator />}
          <ListButton ordered={false} label="•" tooltip="Bullet list" />
          <ListButton ordered label="1." tooltip="Numbered list" />
          {(needsSep = true) && null}
        </>
      )}

      {/* ── Insert ── */}
      {hasInserts && (
        <>
          {needsSep && <Separator />}
          {enabled.has("link") && <LinkButton />}
          {enabled.has("horizontalRule") && <HorizontalRuleButton />}
          {enabled.has("table") && <TableButton />}
        </>
      )}
    </div>
    </>
  );
}
