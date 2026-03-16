"use client";

import React, { useState, useCallback } from "react";
import { useEditorRef } from "platejs/react";

interface ImageUploadProps {
  onClose: () => void;
}

/**
 * Simple image insertion popover.
 * Uses CSS variables to match the host application's theme.
 */
export function ImageUpload({ onClose }: ImageUploadProps) {
  const editor = useEditorRef();
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");

  const handleInsert = useCallback(() => {
    if (!url.trim()) return;

    editor.tf.insertNodes({
      type: "img",
      url: url.trim(),
      alt: alt.trim() || undefined,
      children: [{ text: "" }],
    } as any);
    onClose();
  }, [editor, url, alt, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleInsert();
      }
      if (e.key === "Escape") {
        onClose();
      }
    },
    [handleInsert, onClose]
  );

  const inputStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    marginTop: 4,
    padding: "6px 8px",
    border: "1px solid var(--input)",
    borderRadius: "var(--radius)",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    background: "var(--background)",
    color: "var(--foreground)",
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "100%",
        left: 0,
        zIndex: 50,
        background: "var(--popover)",
        color: "var(--popover-foreground)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: 16,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minWidth: 320,
      }}
    >
      <label style={{ fontSize: 13, fontWeight: 500 }}>
        Image URL
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="https://example.com/image.jpg"
          autoFocus
          style={inputStyle}
        />
      </label>
      <label style={{ fontSize: 13, fontWeight: 500 }}>
        Alt text (optional)
        <input
          type="text"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe the image"
          style={inputStyle}
        />
      </label>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: "6px 12px",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            background: "transparent",
            color: "var(--foreground)",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleInsert}
          disabled={!url.trim()}
          style={{
            padding: "6px 12px",
            border: "none",
            borderRadius: "var(--radius)",
            background: url.trim()
              ? "var(--primary)"
              : "var(--muted)",
            color: url.trim()
              ? "var(--primary-foreground)"
              : "var(--muted-foreground)",
            cursor: url.trim() ? "pointer" : "not-allowed",
            fontSize: 13,
          }}
        >
          Insert
        </button>
      </div>
    </div>
  );
}
