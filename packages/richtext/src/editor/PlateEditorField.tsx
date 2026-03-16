"use client";

import { useMemo, useState, useCallback } from "react";
import { Plate, PlateContent, createPlateEditor } from "platejs/react";
import type { VexEditorComponentProps, RichTextDocument } from "@vexcms/core";
import type { VexEditorFeature } from "./features/types";
import { createPluginsFromFeatures } from "./plugins/createPlugins";
import { Toolbar } from "./components/Toolbar";
import { EditorContainer } from "./components/EditorContainer";
import { ImageUpload } from "./components/image/ImageUpload";
import { TableToolbar } from "./components/TableToolbar";

interface PlateEditorFieldProps extends VexEditorComponentProps {
  features: VexEditorFeature[];
}

const DEFAULT_VALUE: RichTextDocument = [
  { type: "p", children: [{ text: "" }] },
];

export function PlateEditorField({
  value,
  onChange,
  readOnly = false,
  placeholder,
  label,
  description,
  name,
  features,
}: PlateEditorFieldProps) {
  const [showImageUpload, setShowImageUpload] = useState(false);

  const plugins = useMemo(
    () => createPluginsFromFeatures(features),
    [features]
  );

  const editor = useMemo(
    () =>
      createPlateEditor({
        plugins,
        value: value && value.length > 0 ? (value as any) : DEFAULT_VALUE,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plugins]
  );

  const handleChange = useCallback(
    ({ value: newValue }: { value: any }) => {
      onChange(newValue as RichTextDocument);
    },
    [onChange]
  );

  const hasImageFeature = features.some((f) => f.key === "image");

  return (
    <EditorContainer label={label} description={description}>
      <Plate
        editor={editor}
        onValueChange={handleChange}
        readOnly={readOnly}
      >
        {/* Toolbar — stays fixed at top, outside scrollable area */}
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
                    onClick={() => setShowImageUpload((v) => !v)}
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
              <ImageUpload onClose={() => setShowImageUpload(false)} />
            )}
          </div>
        )}

        {/* Table toolbar — shows when cursor is in a table */}
        {!readOnly && <TableToolbar />}

        {/* Scrollable content area */}
        <div
          style={{
            maxHeight: 500,
            overflowY: "auto",
          }}
        >
          <PlateContent
            aria-label={label || name}
            placeholder={placeholder || "Start writing..."}
            readOnly={readOnly}
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
