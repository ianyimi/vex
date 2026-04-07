"use client";

import type { ReactNode } from "react";

interface EditorContainerProps {
  children: ReactNode;
  label?: string;
  description?: string;
}

/**
 * Styles for elements inside the Plate editor content area.
 * Uses CSS variables for theming.
 */
const editorStyles = `
.vex-editor-root table {
  border-collapse: collapse;
  width: 100%;
  margin: 8px 0;
}
.vex-editor-root table td,
.vex-editor-root table th {
  border: 1px solid var(--border);
  padding: 8px 12px;
  min-width: 60px;
  vertical-align: top;
}
.vex-editor-root table th {
  background: var(--muted);
  font-weight: 600;
}
.vex-editor-root blockquote {
  border-left: 3px solid var(--border);
  padding-left: 16px;
  margin: 8px 0;
  color: var(--muted-foreground);
  font-style: italic;
}
.vex-editor-root pre {
  background: var(--muted);
  border-radius: var(--radius);
  padding: 12px 16px;
  margin: 8px 0;
  overflow-x: auto;
  font-family: monospace;
  font-size: 13px;
  line-height: 1.5;
}
.vex-editor-root hr {
  border: none;
  border-top: 2px solid var(--border);
  margin: 16px 0;
}
.vex-editor-root h1 { font-size: 2em; font-weight: 700; margin: 16px 0 8px; }
.vex-editor-root h2 { font-size: 1.5em; font-weight: 700; margin: 14px 0 6px; }
.vex-editor-root h3 { font-size: 1.25em; font-weight: 600; margin: 12px 0 4px; }
.vex-editor-root h4 { font-size: 1.1em; font-weight: 600; margin: 10px 0 4px; }
.vex-editor-root h5 { font-size: 1em; font-weight: 600; margin: 8px 0 4px; }
.vex-editor-root h6 { font-size: 0.9em; font-weight: 600; margin: 8px 0 4px; }
.vex-editor-root a {
  color: var(--primary);
  text-decoration: underline;
}
.vex-editor-root code {
  background: var(--muted);
  border-radius: 3px;
  padding: 1px 4px;
  font-family: monospace;
  font-size: 0.9em;
}
.vex-editor-root pre code {
  background: none;
  padding: 0;
  border-radius: 0;
}
.vex-editor-root img {
  max-width: 100%;
  border-radius: var(--radius);
  margin: 8px 0;
}
`;

/**
 * Wrapper container for the rich text editor.
 * Uses CSS variables to match the host application's theme.
 */
export function EditorContainer({
  children,
  label,
  description,
}: EditorContainerProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <style dangerouslySetInnerHTML={{ __html: editorStyles }} />
      {label && (
        <label
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "var(--foreground)",
          }}
        >
          {label}
        </label>
      )}
      <div
        className="vex-editor-root"
        style={{
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          background: "var(--background)",
        }}
      >
        {children}
      </div>
      {description && (
        <p
          style={{
            fontSize: 12,
            color: "var(--muted-foreground)",
            margin: 0,
          }}
        >
          {description}
        </p>
      )}
    </div>
  );
}
