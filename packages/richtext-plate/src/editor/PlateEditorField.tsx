"use client";

import { useEffect, useMemo, useState, useCallback, useRef, useImperativeHandle, forwardRef } from "react";
import type { Value } from "platejs";
import { Plate, PlateContent, createPlateEditor, useEditorRef } from "platejs/react";
import { valuesEqual, type VexEditorComponentProps, type RichTextDocument } from "@vexcms/core";
import type { VexEditorFeature } from "./features/types";
import { createPluginsFromFeatures } from "./plugins/createPlugins";
import { Toolbar } from "./components/Toolbar";
import { EditorContainer } from "./components/EditorContainer";
import { ImageUpload } from "./components/image/ImageUpload";
import { useImageUpload } from "./components/image/useImageUpload";
import { TableToolbar } from "./components/TableToolbar";

interface PlateEditorFieldProps extends VexEditorComponentProps {
  features: VexEditorFeature[];
}

const DEFAULT_VALUE: RichTextDocument = [
  { type: "p", children: [{ text: "" }] },
];

/**
 * Handle for inserting images from outside the Plate context.
 */
interface ImageInsertHandle {
  insertImage: (props: { url: string; alt?: string; mediaId?: string }) => void;
}

/**
 * Child component that lives INSIDE <Plate> and can use useEditorRef().
 * Exposes an insertImage method via ref.
 */
const ImageInsertBridge = forwardRef<ImageInsertHandle>(function ImageInsertBridge(_props, ref) {
  const editor = useEditorRef();

  useImperativeHandle(ref, () => ({
    insertImage: (props) => {
      // No `width`/`aspectRatio`: a fresh image renders at its own size
      // (capped to the editor) until the user resizes it.
      const imgNode = {
        type: "img",
        url: props.url,
        alt: props.alt || "",
        mediaId: props.mediaId,
        children: [{ text: "" }],
      } as any;
      const trailingP = { type: "p", children: [{ text: "" }] } as any;

      // Insert at current selection or end of document
      if (editor.selection) {
        editor.tf.insertNodes([imgNode, trailingP], { select: true });
      } else {
        editor.tf.insertNodes([imgNode, trailingP], {
          at: [editor.children.length],
        });
        // Move selection to the new paragraph
        const newPath = [editor.children.length - 1, 0];
        try { editor.tf.select({ path: newPath, offset: 0 }); } catch { /* selection may fail if path is invalid */ }
      }
    },
  }), [editor]);

  return null;
});

/**
 * Interactive Plate-based editor field for a single rich text form value.
 *
 * Builds a `platejs/react` editor from the enabled `features`, and renders
 * the formatting toolbar, table toolbar, and editable content area inside
 * `EditorContainer`. Wires up image insertion (toolbar button, paste, and
 * drag-and-drop upload via `useImageUpload`) and propagates content changes
 * through `onChange`. This is the `editorComponent` used by the adapter
 * returned from `plateEditor()`.
 *
 * The visible label and description are the host field input's job; `label`
 * is used here only as the editable area's accessible name.
 *
 * @returns The formatting and table toolbars and the editable content area,
 *   wrapped in `EditorContainer`.
 */
export function PlateEditorField({
  value,
  onChange,
  readOnly = false,
  placeholder,
  label,
  name,
  features,
  mediaCollectionSlug,
  mediaAltRequired,
  mediaResults,
  mediaSearchTerm,
  onMediaSearchChange,
  mediaCanLoadMore,
  onMediaLoadMore,
  mediaIsLoading,
  onUploadNew,
  generateUploadUrl,
  createMediaDocument,
}: PlateEditorFieldProps) {
  const [showImageUpload, setShowImageUpload] = useState(false);
  const imageInsertRef = useRef<ImageInsertHandle>(null);
  const imageButtonRef = useRef<HTMLSpanElement>(null);
  const imagePopoverRef = useRef<HTMLDivElement>(null);

  // Close the image popover on a click outside it, like the link/table
  // controls. The toggle button is excluded so its own mousedown still toggles.
  // Uses the dispatch path, not `contains(target)`: popover contents re-render
  // as you use it, and a target removed mid-event would read as "outside".
  useEffect(() => {
    if (!showImageUpload) return;
    const handler = (e: MouseEvent) => {
      const path = e.composedPath();
      if (imagePopoverRef.current && path.includes(imagePopoverRef.current)) return;
      if (imageButtonRef.current && path.includes(imageButtonRef.current)) return;
      setShowImageUpload(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showImageUpload]);

  // No media collection → the image feature is dropped entirely (toolbar
  // button, paste, and drop handlers all key off this list).
  const effectiveFeatures = useMemo(
    () =>
      mediaCollectionSlug
        ? features
        : features.filter((feature) => feature.key !== "image"),
    [features, mediaCollectionSlug],
  );

  const { plugins, components } = useMemo(
    () => createPluginsFromFeatures(effectiveFeatures),
    [effectiveFeatures]
  );

  const editor = useMemo(() => {
    return createPlateEditor({
      plugins,
      override: { components },
      value: value && value.length > 0 ? (value as any) : DEFAULT_VALUE,
    });
    // Intentionally keyed on `plugins` only: the editor is rebuilt when the
    // feature set changes, not when `components` or the current `value` change —
    // rebuilding on value would discard editor state on every keystroke.
    // (Was an `eslint-disable` for react-hooks/exhaustive-deps, but that plugin
    // is not installed, so the directive itself errored as an unknown rule.)
  }, [plugins]);

  // The last document this editor emitted. A `value` prop that isn't it came
  // from outside (version swap in the history tab, restore, form reset), so
  // the editor — built once from the initial value — must be overwritten.
  // Echoes of our own edits match by reference and are skipped, which keeps
  // the selection intact while typing.
  const lastEmittedRef = useRef<RichTextDocument | undefined>(value);

  useEffect(() => {
    if (value === lastEmittedRef.current) return;
    lastEmittedRef.current = value;
    const next = value && value.length > 0 ? value : DEFAULT_VALUE;
    // A same-content copy (e.g. the form re-seeded from the saved doc after an
    // autosave) must not reset the editor — that would move the cursor mid-typing.
    // Key-order-insensitive: Convex returns object keys sorted, Plate keeps
    // insertion order.
    if (valuesEqual(next, editor.children)) return;
    // RichTextDocument's index-signature nodes are structurally Plate's
    // `Value`, but the index signatures keep TS from unifying the two.
    editor.tf.setValue(next as unknown as Value);
    // Plate normalizes synchronously on setValue — it assigns a random `id` to
    // every node lacking one, merges adjacent leaves, fills empty `children` —
    // so the echo that follows is the NORMALIZED document, not `next`. Record
    // that as ours, or the echo reads as a user edit and dirties the form
    // (the "discard changes?" prompt on a plain version switch).
    lastEmittedRef.current = editor.children as unknown as RichTextDocument;
  }, [editor, value]);

  const handleChange = useCallback(
    ({ value: newValue }: { value: Value }) => {
      const next = newValue as unknown as RichTextDocument;
      // A value applied by the sync effect above comes back through
      // onValueChange (Slate flushes changes asynchronously, so a "currently
      // applying" flag would already be cleared). Re-emitting it would mark
      // the field dirty and autosave it, ping-ponging with the form.
      if (valuesEqual(next, lastEmittedRef.current)) return;
      lastEmittedRef.current = next;
      onChange(next);
    },
    [onChange]
  );

  const { uploadFile } = useImageUpload({
    mediaCollectionSlug,
    generateUploadUrl,
    createMediaDocument,
  });

  const hasImageFeature = effectiveFeatures.some((f) => f.key === "image");

  const handleInsertImage = useCallback(
    (props: { url: string; alt?: string; mediaId?: string }) => {
      // Close popover first, then insert on next tick so editor can regain focus
      setShowImageUpload(false);
      setTimeout(() => {
        const editorEl = document.querySelector(
          '[data-slate-editor="true"]'
        ) as HTMLElement | null;
        if (editorEl) editorEl.focus({ preventScroll: true });

        // Use the bridge ref which has access to useEditorRef()
        imageInsertRef.current?.insertImage(props);
      }, 50);
    },
    []
  );

  // Upload tab: create the media document (same mutations as the upload
  // field), then insert the stored image. Errors propagate to the tab's
  // own error display.
  const handleUploadFile = useCallback(
    async (props: { file: File; alt?: string }) => {
      if (!uploadFile) throw new Error("Media collection not configured");
      const result = await uploadFile(props.file, { alt: props.alt });
      handleInsertImage({ url: result.url, mediaId: result.mediaId, alt: props.alt });
    },
    [uploadFile, handleInsertImage]
  );

  // Paste handler
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      if (!uploadFile) return;
      const files = Array.from(e.clipboardData.files).filter((f) =>
        f.type.startsWith("image/")
      );
      if (files.length === 0) return;
      e.preventDefault();
      for (const file of files) {
        uploadFile(file).then((result) => {
          imageInsertRef.current?.insertImage({
            url: result.url,
            mediaId: result.mediaId,
          });
        }).catch((err) => console.error("Image upload failed:", err));
      }
    },
    [uploadFile]
  );

  // Drop handler
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      if (!uploadFile) return;
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/")
      );
      if (files.length === 0) return;
      e.preventDefault();
      for (const file of files) {
        uploadFile(file).then((result) => {
          imageInsertRef.current?.insertImage({
            url: result.url,
            mediaId: result.mediaId,
          });
        }).catch((err) => console.error("Image upload failed:", err));
      }
    },
    [uploadFile]
  );

  return (
    <EditorContainer>
      <Plate
        editor={editor}
        onValueChange={handleChange}
        readOnly={readOnly}
      >
        {/* Bridge component — lives inside Plate, exposes insert via ref */}
        <ImageInsertBridge ref={imageInsertRef} />

        {/* Toolbar */}
        {!readOnly && (
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 10,
              background: "var(--background)",
              // Match the editor root's rounded top corners: this bar's square
              // background otherwise paints over the border arcs, leaving the
              // top corners looking like gaps in the border.
              borderTopLeftRadius: "var(--radius)",
              borderTopRightRadius: "var(--radius)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div style={{ position: "relative" }}>
              <Toolbar
                features={effectiveFeatures}
                trailing={
                  hasImageFeature ? (
                    <span ref={imageButtonRef} className="vex-tb-wrap">
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setShowImageUpload((v) => !v);
                        }}
                        style={{
                          background: "transparent",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius)",
                          padding: "4px 8px",
                          cursor: "pointer",
                          fontSize: 14,
                          lineHeight: 1,
                        }}
                      >
                        🖼
                      </button>
                      <span className="vex-tb-tip">Insert image</span>
                    </span>
                  ) : undefined
                }
              />
            </div>
            {showImageUpload && (
              <div ref={imagePopoverRef}>
                <ImageUpload
                  onClose={() => setShowImageUpload(false)}
                  onInsertUrl={handleInsertImage}
                  onInsertMedia={
                    mediaResults !== undefined
                      ? handleInsertImage
                      : undefined
                  }
                  onUploadNew={onUploadNew}
                  onUploadFile={uploadFile ? handleUploadFile : undefined}
                  altRequired={mediaAltRequired}
                  mediaResults={mediaResults}
                  mediaSearchTerm={mediaSearchTerm}
                  onMediaSearchChange={onMediaSearchChange}
                  mediaCanLoadMore={mediaCanLoadMore}
                  onMediaLoadMore={onMediaLoadMore}
                  mediaIsLoading={mediaIsLoading}
                />
              </div>
            )}
          </div>
        )}

        {/* Table toolbar */}
        {!readOnly && <TableToolbar />}

        {/* Scrollable content area */}
        <div style={{ maxHeight: 500, overflowY: "auto" }}>
          <PlateContent
            aria-label={label || name}
            placeholder={placeholder || "Start writing..."}
            readOnly={readOnly}
            onPaste={handlePaste}
            onDrop={handleDrop}
            style={{
              padding: "12px 16px",
              minHeight: 160,
              outline: "none",
              fontSize: 15,
              lineHeight: 1.6,
              color: "var(--foreground)",
            }}
          />
        </div>
      </Plate>
    </EditorContainer>
  );
}
