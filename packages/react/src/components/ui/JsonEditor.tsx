"use client";

import { Suspense, lazy } from "react";
import { Textarea } from "./textarea";

const JsonEditorView = lazy(() =>
  import("./JsonEditorView").then((mod) => ({ default: mod.JsonEditorView })),
);

/**
 * Props for {@link JsonEditor}, a CodeMirror 6-backed JSON text editor.
 */
export interface JsonEditorProps {
  /** The DOM `id` applied to the editor's editable surface. */
  id: string;
  /** The current JSON text. */
  value: string;
  /** Called with the editor's full document text on every change. */
  onChange: (value: string) => void;
  /** Called when the editor loses focus. */
  onBlur?: () => void;
  /** Disables editing and dims the editor. */
  readOnly?: boolean;
  /** Applies destructive border/ring styling for an invalid value. */
  invalid?: boolean;
  /** `id` of the element that labels this editor. */
  "aria-labelledby"?: string;
  /** Mirrors `aria-required` onto the editor's editable surface. */
  "aria-required"?: boolean;
  /** Placeholder text shown in an empty document. */
  placeholder?: string;
}

/**
 * CodeMirror 6-backed JSON editor with syntax highlighting, line numbers,
 * and inline lint diagnostics.
 *
 * The actual CodeMirror view (`JsonEditorView`) is code-split behind
 * `React.lazy` so `@codemirror/*` never lands in the main bundle; while that
 * chunk loads, a plain `<Textarea>` renders in its place so the field is
 * never unusable.
 */
export function JsonEditor(props: JsonEditorProps) {
  return (
    <Suspense
      fallback={
        <Textarea
          id={props.id}
          value={props.value}
          readOnly
          aria-labelledby={props["aria-labelledby"]}
          placeholder={props.placeholder}
          className="min-h-32 font-mono"
        />
      }
    >
      <JsonEditorView {...props} />
    </Suspense>
  );
}
