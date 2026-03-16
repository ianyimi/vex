"use client";

import { useMemo, useState, useCallback, useRef, useImperativeHandle, forwardRef } from "react";
import { Plate, PlateContent, createPlateEditor, useEditorRef } from "platejs/react";
import type { VexEditorComponentProps, RichTextDocument } from "@vexcms/core";
import type { VexEditorFeature } from "./features/types";
import { createPluginsFromFeatures } from "./plugins/createPlugins";
import { Toolbar } from "./components/Toolbar";
import { EditorContainer } from "./components/EditorContainer";
import { ImageUpload } from "./components/image/ImageUpload";
import { useImageUpload } from "./components/image/useImageUpload";
import { TableToolbar } from "./components/TableToolbar";

interface MediaDoc {
  _id: string;
  filename: string;
  mimeType: string;
  url: string;
  alt?: string;
}

interface PlateEditorFieldProps extends VexEditorComponentProps {
  features: VexEditorFeature[];
  mediaResults?: MediaDoc[];
  mediaSearchTerm?: string;
  onMediaSearchChange?: (term: string) => void;
  mediaCanLoadMore?: boolean;
  onMediaLoadMore?: () => void;
  mediaIsLoading?: boolean;
  onUploadNew?: () => void;
  generateUploadUrl?: () => Promise<string>;
  createMediaDocument?: (props: {
    collectionSlug: string;
    fields: Record<string, unknown>;
  }) => Promise<string>;
}

const DEFAULT_VALUE: RichTextDocument = [
  { type: "p", children: [{ text: "" }] },
];

/**
 * Handle for inserting images from outside the Plate context.
 */
interface ImageInsertHandle {
  insertImage: (props: { url: string; alt?: string; mediaId?: string; width?: number; height?: number }) => void;
}

/**
 * Child component that lives INSIDE <Plate> and can use useEditorRef().
 * Exposes an insertImage method via ref.
 */
const ImageInsertBridge = forwardRef<ImageInsertHandle>(function ImageInsertBridge(_props, ref) {
  const editor = useEditorRef();

  useImperativeHandle(ref, () => ({
    insertImage: (props) => {
      const imgNode = {
        type: "img",
        url: props.url,
        alt: props.alt || "",
        mediaId: props.mediaId,
        width: props.width,
        height: props.height,
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

export function PlateEditorField({
  value,
  onChange,
  readOnly = false,
  placeholder,
  label,
  description,
  name,
  features,
  mediaCollection,
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

  const { plugins, components } = useMemo(
    () => createPluginsFromFeatures(features),
    [features]
  );

  const editor = useMemo(() => {
    return createPlateEditor({
      plugins,
      override: { components },
      value: value && value.length > 0 ? (value as any) : DEFAULT_VALUE,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plugins]);

  const handleChange = useCallback(
    ({ value: newValue }: { value: any }) => {
      onChange(newValue as RichTextDocument);
    },
    [onChange]
  );

  const { uploadFile } = useImageUpload({
    mediaCollection,
    generateUploadUrl,
    createMediaDocument,
  });

  const hasImageFeature = features.some((f) => f.key === "image");

  const handleInsertImage = useCallback(
    (props: { url: string; alt?: string; mediaId?: string; width?: number; height?: number }) => {
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
            width: result.width,
            height: result.height,
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
            width: result.width,
            height: result.height,
          });
        }).catch((err) => console.error("Image upload failed:", err));
      }
    },
    [uploadFile]
  );

  return (
    <EditorContainer label={label} description={description}>
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
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                position: "relative",
              }}
            >
              <Toolbar features={features} />
              {hasImageFeature && (
                <span className="vex-tb-wrap">
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
                      marginRight: 8,
                    }}
                  >
                    🖼
                  </button>
                  <span className="vex-tb-tip">Insert image</span>
                </span>
              )}
            </div>
            {showImageUpload && (
              <ImageUpload
                onClose={() => setShowImageUpload(false)}
                onInsertUrl={handleInsertImage}
                onInsertMedia={
                  mediaResults !== undefined
                    ? handleInsertImage
                    : undefined
                }
                onUploadNew={onUploadNew}
                mediaResults={mediaResults}
                mediaSearchTerm={mediaSearchTerm}
                onMediaSearchChange={onMediaSearchChange}
                mediaCanLoadMore={mediaCanLoadMore}
                onMediaLoadMore={onMediaLoadMore}
                mediaIsLoading={mediaIsLoading}
              />
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
