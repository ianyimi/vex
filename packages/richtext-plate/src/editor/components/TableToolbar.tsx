"use client";

import { useCallback } from "react";
import { useEditorRef, useEditorSelector } from "platejs/react";
import {
  insertTableRow,
  insertTableColumn,
  deleteRow,
  deleteColumn,
  deleteTable,
} from "@platejs/table";

const btnStyle: React.CSSProperties = {
  padding: "3px 8px",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  background: "transparent",
  color: "var(--foreground)",
  cursor: "pointer",
  fontSize: 12,
  lineHeight: 1.3,
  whiteSpace: "nowrap",
};

const dangerBtnStyle: React.CSSProperties = {
  ...btnStyle,
  color: "var(--destructive)",
  borderColor: "var(--destructive)",
};

/**
 * Contextual toolbar that appears when the cursor is inside a table.
 */
export function TableToolbar() {
  const editor = useEditorRef();

  const isInTable = useEditorSelector(
    (ed) => !!ed.api.block({ match: { type: "table" } }),
    []
  );

  const handleAddRow = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      insertTableRow(editor);
    },
    [editor]
  );

  const handleAddColumn = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      insertTableColumn(editor);
    },
    [editor]
  );

  const handleDeleteRow = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      deleteRow(editor);
    },
    [editor]
  );

  const handleDeleteColumn = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      deleteColumn(editor);
    },
    [editor]
  );

  const handleDeleteTable = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      deleteTable(editor);
    },
    [editor]
  );

  const handleExitTable = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      // Find the table node and insert a paragraph after it
      const tableEntry = editor.api.block({ match: { type: "table" } });
      if (tableEntry) {
        const [, tablePath] = tableEntry;
        const insertPath = [...tablePath.slice(0, -1), tablePath[tablePath.length - 1]! + 1];
        editor.tf.insertNodes(
          { type: "p", children: [{ text: "" }] } as any,
          { at: insertPath, select: true }
        );
      }
    },
    [editor]
  );

  if (!isInTable) return null;

  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        padding: "6px 8px",
        borderTop: "1px solid var(--border)",
        background: "var(--muted)",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <span
        style={{
          fontSize: 11,
          color: "var(--muted-foreground)",
          marginRight: 4,
          fontWeight: 500,
        }}
      >
        Table:
      </span>
      <button type="button" onMouseDown={handleAddRow} style={btnStyle}>
        + Row
      </button>
      <button type="button" onMouseDown={handleAddColumn} style={btnStyle}>
        + Column
      </button>
      <button type="button" onMouseDown={handleDeleteRow} style={btnStyle}>
        − Row
      </button>
      <button type="button" onMouseDown={handleDeleteColumn} style={btnStyle}>
        − Column
      </button>
      <button type="button" onMouseDown={handleExitTable} style={btnStyle}>
        Exit table ↓
      </button>
      <button type="button" onMouseDown={handleDeleteTable} style={dangerBtnStyle}>
        Delete table
      </button>
    </div>
  );
}
