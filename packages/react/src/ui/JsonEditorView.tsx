"use client";

import { useEffect, useRef } from "react";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import {
  bracketMatching,
  foldGutter,
  foldKeymap,
  HighlightStyle,
  indentOnInput,
  syntaxHighlighting,
} from "@codemirror/language";
import { json, jsonParseLinter } from "@codemirror/lang-json";
import { linter, lintGutter } from "@codemirror/lint";
import { Compartment, EditorState } from "@codemirror/state";
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  keymap,
  lineNumbers,
  placeholder as placeholderExtension,
} from "@codemirror/view";
import { tags } from "@lezer/highlight";
import { cn } from "../utils/cn";
import type { JsonEditorProps } from "./JsonEditor";

const highlightStyle = HighlightStyle.define([
  { tag: tags.propertyName, color: "var(--chart-1)" },
  { tag: tags.string, color: "var(--chart-2)" },
  { tag: tags.number, color: "var(--chart-3)" },
  { tag: [tags.bool, tags.null], color: "var(--chart-4)" },
  { tag: [tags.brace, tags.squareBracket, tags.separator], color: "var(--muted-foreground)" },
]);

const theme = EditorView.theme({
  "&": {
    backgroundColor: "var(--card)",
    color: "var(--foreground)",
    fontSize: "13px",
  },
  ".cm-content": {
    fontFamily: "var(--font-mono), ui-monospace, monospace",
    caretColor: "var(--foreground)",
  },
  ".cm-content, .cm-gutter": {
    minHeight: "8rem",
  },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: "var(--foreground)",
  },
  ".cm-gutters": {
    backgroundColor: "var(--card)",
    color: "var(--muted-foreground)",
    border: "none",
  },
  ".cm-activeLine": {
    backgroundColor: "transparent",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent",
  },
  "&.cm-focused": {
    outline: "none",
  },
  ".cm-lintRange-error": {
    backgroundImage: "none",
    textDecoration: "underline wavy var(--destructive)",
  },
});

/**
 * CodeMirror 6 JSON editor view. Code-split behind `JsonEditor`'s
 * `React.lazy` boundary — never imported outside it.
 *
 * Creates the `EditorView` once on mount and owns it imperatively from
 * there: external `value` changes are synced in with a dispatched
 * transaction (only when they differ from the editor's own document, so
 * typing doesn't fight itself), `readOnly` is toggled via a `Compartment`
 * reconfiguration, and `onChange`/`onBlur` are read through refs inside a
 * single `EditorView.updateListener` so neither callback identity needs to
 * recreate the view.
 */
export function JsonEditorView({
  id,
  value,
  onChange,
  onBlur,
  readOnly = false,
  invalid = false,
  "aria-labelledby": ariaLabelledBy,
  "aria-required": ariaRequired,
  placeholder,
}: JsonEditorProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const readOnlyCompartmentRef = useRef(new Compartment());
  const onChangeRef = useRef(onChange);
  const onBlurRef = useRef(onBlur);

  onChangeRef.current = onChange;
  onBlurRef.current = onBlur;

  useEffect(() => {
    if (!hostRef.current) return;

    const readOnlyCompartment = readOnlyCompartmentRef.current;
    const view = new EditorView({
      doc: value,
      parent: hostRef.current,
      extensions: [
        lineNumbers(),
        foldGutter(),
        lintGutter(),
        drawSelection(),
        highlightActiveLine(),
        history(),
        indentOnInput(),
        bracketMatching(),
        json(),
        linter(jsonParseLinter()),
        syntaxHighlighting(highlightStyle),
        ...(placeholder ? [placeholderExtension(placeholder)] : []),
        keymap.of([...defaultKeymap, ...historyKeymap, ...foldKeymap]),
        theme,
        readOnlyCompartment.of([
          EditorState.readOnly.of(readOnly),
          EditorView.editable.of(!readOnly),
        ]),
        EditorView.contentAttributes.of({
          id,
          ...(ariaLabelledBy ? { "aria-labelledby": ariaLabelledBy } : {}),
          ...(ariaRequired !== undefined ? { "aria-required": String(ariaRequired) } : {}),
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
        EditorView.domEventHandlers({
          blur: () => onBlurRef.current?.(),
        }),
      ],
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentValue = view.state.doc.toString();
    if (currentValue === value) return;
    view.dispatch({
      changes: { from: 0, to: currentValue.length, insert: value },
    });
  }, [value]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: readOnlyCompartmentRef.current.reconfigure([
        EditorState.readOnly.of(readOnly),
        EditorView.editable.of(!readOnly),
      ]),
    });
  }, [readOnly]);

  return (
    <div
      ref={hostRef}
      className={cn(
        "overflow-hidden rounded-sm border border-input bg-card shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        invalid && "border-destructive ring-3 ring-destructive/20",
        readOnly && "opacity-80",
      )}
    />
  );
}
