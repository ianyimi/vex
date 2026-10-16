"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import type { VexMediaDocument } from "@vexcms/core";
import { Button } from "@vexcms/react";

interface ImageUploadProps {
  onClose: () => void;
  onInsertUrl: (props: { url: string; alt?: string }) => void;
  onInsertMedia?: (props: {
    url: string;
    mediaId: string;
    alt?: string;
  }) => void;
  onUploadNew?: () => void;
  /**
   * Uploads a file as a NEW media document (the same mutations the upload
   * field uses) and inserts it. Present → the popover shows an "Upload" tab.
   */
  onUploadFile?: (props: { file: File; alt?: string }) => Promise<void>;
  /** Whether the media collection requires alt text — the Upload tab blocks an empty alt. */
  altRequired?: boolean;
  mediaResults?: VexMediaDocument[];
  mediaSearchTerm?: string;
  onMediaSearchChange?: (term: string) => void;
  mediaCanLoadMore?: boolean;
  onMediaLoadMore?: () => void;
  mediaIsLoading?: boolean;
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 4,
  padding: "6px 8px",
  border: "1px solid var(--input)",
  borderRadius: "var(--radius)",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
  background: "var(--background)",
  color: "var(--foreground)",
};

const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: "4px 10px",
  border: "none",
  borderBottom: active ? "2px solid var(--primary)" : "2px solid transparent",
  background: "transparent",
  color: active ? "var(--foreground)" : "var(--muted-foreground)",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: active ? 600 : 400,
});

function UrlTab({
  onInsert,
  onClose,
}: {
  onInsert: (props: { url: string; alt?: string }) => void;
  onClose: () => void;
}) {
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");

  const handleInsert = useCallback(() => {
    if (!url.trim()) return;
    onInsert({ url: url.trim(), alt: alt.trim() || undefined });
  }, [url, alt, onInsert]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 500 }}>
        Image URL
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); handleInsert(); }
            if (e.key === "Escape") onClose();
          }}
          placeholder="https://example.com/image.jpg"
          autoFocus
          style={inputStyle}
        />
      </label>
      <label style={{ fontSize: 12, fontWeight: 500 }}>
        Alt text
        <input
          type="text"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); handleInsert(); }
            if (e.key === "Escape") onClose();
          }}
          placeholder="Describe the image"
          style={inputStyle}
        />
      </label>
      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
        <button type="button" onClick={onClose} style={{
          padding: "4px 10px", border: "1px solid var(--border)",
          borderRadius: "var(--radius)", background: "transparent",
          color: "var(--foreground)", cursor: "pointer", fontSize: 12,
        }}>Cancel</button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); handleInsert(); }} disabled={!url.trim()} style={{
          padding: "4px 10px", border: "none", borderRadius: "var(--radius)",
          background: url.trim() ? "var(--primary)" : "var(--muted)",
          color: url.trim() ? "var(--primary-foreground)" : "var(--muted-foreground)",
          cursor: url.trim() ? "pointer" : "not-allowed", fontSize: 12,
        }}>Insert</button>
      </div>
    </div>
  );
}

function UploadTab({
  onUploadFile,
  altRequired,
}: {
  onUploadFile: (props: { file: File; alt?: string }) => Promise<void>;
  altRequired?: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async () => {
    if (!file || uploading) return;
    if (altRequired && alt.trim().length === 0) {
      setError("Alt text is required.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      // Parent's onUploadFile inserts the image and closes the popover.
      await onUploadFile({ file, alt: alt.trim() || undefined });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
      setUploading(false);
    }
  }, [file, alt, altRequired, uploading, onUploadFile]);

  const acceptFiles = useCallback((files: FileList | File[]) => {
    const image = [...files].find((f) => f.type.startsWith("image/"));
    if (image) setFile(image);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
        }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          acceptFiles(e.dataTransfer.files);
        }}
        style={{
          border: `1px dashed ${dragOver ? "var(--primary)" : "var(--border)"}`,
          borderRadius: "var(--radius)",
          padding: 16,
          textAlign: "center",
          cursor: "pointer",
          fontSize: 12,
          color: file ? "var(--foreground)" : "var(--muted-foreground)",
          background: dragOver ? "var(--muted)" : "transparent",
        }}
      >
        {file ? file.name : "Drop an image here, or click to browse"}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files) acceptFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      <label style={{ fontSize: 12, fontWeight: 500 }}>
        Alt text
        {altRequired && <span style={{ color: "var(--destructive)" }}> *</span>}
        <input
          type="text"
          required={altRequired}
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); void handleUpload(); }
          }}
          placeholder="Describe the image"
          style={inputStyle}
        />
      </label>
      {error && (
        <p role="alert" style={{ margin: 0, fontSize: 12, color: "var(--destructive)" }}>
          {error}
        </p>
      )}
      <Button
        type="button"
        disabled={!file || uploading}
        isPending={uploading}
        onMouseDown={(e) => { e.preventDefault(); void handleUpload(); }}
      >
        Upload & insert
      </Button>
    </div>
  );
}

function MediaTab({
  results,
  searchTerm,
  onSearchChange,
  canLoadMore,
  onLoadMore,
  isLoading,
  onSelect,
  onUploadNew,
}: {
  results: VexMediaDocument[];
  searchTerm?: string;
  onSearchChange?: (s: string) => void;
  canLoadMore?: boolean;
  onLoadMore?: () => void;
  isLoading?: boolean;
  onSelect: (doc: VexMediaDocument) => void;
  onUploadNew?: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const imageResults = results.filter((d) => d.mimeType.startsWith("image/"));

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !canLoadMore || !onLoadMore) return;
    const handler = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
        onLoadMore();
      }
    };
    el.addEventListener("scroll", handler);
    return () => el.removeEventListener("scroll", handler);
  }, [canLoadMore, onLoadMore]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {onSearchChange && (
        <input
          type="text"
          value={searchTerm ?? ""}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search images…"
          style={inputStyle}
          autoFocus
        />
      )}
      <div
        ref={scrollRef}
        style={{
          maxHeight: 200,
          overflowY: "auto",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 4,
        }}
      >
        {isLoading && imageResults.length === 0 && (
          <div style={{
            gridColumn: "1 / -1", padding: 16, textAlign: "center",
            color: "var(--muted-foreground)", fontSize: 12,
          }}>Loading…</div>
        )}
        {!isLoading && imageResults.length === 0 && (
          <div style={{
            gridColumn: "1 / -1", padding: 16, textAlign: "center",
            color: "var(--muted-foreground)", fontSize: 12,
          }}>No images found</div>
        )}
        {imageResults.map((doc) => (
          <button
            key={doc._id}
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onSelect(doc); }}
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              overflow: "hidden",
              cursor: "pointer",
              background: "transparent",
              padding: 0,
              aspectRatio: "1",
            }}
          >
            <img
              src={doc.src}
              alt={doc.alt || doc.filename}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </button>
        ))}
      </div>
      {onUploadNew && (
        <button type="button" onClick={onUploadNew} style={{
          padding: "4px 10px", border: "1px solid var(--border)",
          borderRadius: "var(--radius)", background: "transparent",
          color: "var(--foreground)", cursor: "pointer", fontSize: 12,
          width: "100%",
        }}>Upload new</button>
      )}
    </div>
  );
}

/**
 * Image insertion popover — matches the existing media picker size (w-80 / 320px).
 *
 * @param props - Insert/close callbacks, plus optional media-library results
 *   and search/pagination handlers. When `mediaResults` is provided, the
 *   popover shows a "Media Library" tab; when `onUploadFile` is provided, an
 *   "Upload" tab that creates a new media document; "URL" is always there.
 * @returns The image insertion popover with its tab(s).
 */
export function ImageUpload(props: ImageUploadProps) {
  const hasMedia = props.mediaResults !== undefined;
  const hasUpload = props.onUploadFile !== undefined;
  const [tab, setTab] = useState<"media" | "upload" | "url">(hasMedia ? "media" : "url");

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
        padding: 8,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        width: 320,
      }}
    >
      {(hasMedia || hasUpload) && (
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: 2 }}>
          {hasMedia && (
            <button type="button" style={tabStyle(tab === "media")} onClick={() => setTab("media")}>
              Media Library
            </button>
          )}
          {hasUpload && (
            <button type="button" style={tabStyle(tab === "upload")} onClick={() => setTab("upload")}>
              Upload
            </button>
          )}
          <button type="button" style={tabStyle(tab === "url")} onClick={() => setTab("url")}>
            URL
          </button>
        </div>
      )}
      {tab === "media" && hasMedia ? (
        <MediaTab
          results={props.mediaResults!}
          searchTerm={props.mediaSearchTerm}
          onSearchChange={props.onMediaSearchChange}
          canLoadMore={props.mediaCanLoadMore}
          onLoadMore={props.onMediaLoadMore}
          isLoading={props.mediaIsLoading}
          onSelect={(doc) => {
            // Parent's onInsertMedia handles closing — don't call onClose here
            props.onInsertMedia?.({ url: doc.src, mediaId: doc._id, alt: doc.alt });
          }}
          onUploadNew={
            hasUpload ? () => setTab("upload") : props.onUploadNew
          }
        />
      ) : tab === "upload" && props.onUploadFile ? (
        <UploadTab onUploadFile={props.onUploadFile} altRequired={props.altRequired} />
      ) : (
        <UrlTab onInsert={(p) => { props.onInsertUrl(p); }} onClose={props.onClose} />
      )}
    </div>
  );
}
