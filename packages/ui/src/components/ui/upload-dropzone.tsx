"use client";

import * as React from "react";
import { Upload, X, FileIcon, AlertCircle } from "lucide-react";
import { Button } from "./button";
import { cn } from "../../styles/utils";

interface UploadDropzoneProps {
  /** Accepted MIME types (e.g., ["image/*", "application/pdf"]) */
  accept?: string[];
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Called when a valid file is selected */
  onFileSelect: (file: File) => void;
  /** Currently selected file (for display) */
  selectedFile?: File | null;
  /** Clear the selected file */
  onClear: () => void;
  /** Whether the dropzone is disabled */
  disabled?: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function matchesMimeType(fileType: string, acceptPattern: string): boolean {
  if (acceptPattern === fileType) return true;
  if (acceptPattern.endsWith("/*")) {
    const prefix = acceptPattern.slice(0, -2);
    return fileType.startsWith(prefix + "/");
  }
  return false;
}

function UploadDropzone(props: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (props.selectedFile && props.selectedFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(props.selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
    return undefined;
  }, [props.selectedFile]);

  function validateFile(file: File): string | null {
    if (props.accept && props.accept.length > 0) {
      const matches = props.accept.some((pattern) =>
        matchesMimeType(file.type, pattern),
      );
      if (!matches) {
        return `File type ${file.type || "unknown"} is not accepted`;
      }
    }
    if (props.maxSize && file.size > props.maxSize) {
      return `File size (${formatBytes(file.size)}) exceeds maximum (${formatBytes(props.maxSize)})`;
    }
    return null;
  }

  function handleFile(file: File) {
    const err = validateFile(file);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    props.onFileSelect(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  if (props.selectedFile) {
    return (
      <div className="flex items-center gap-3 rounded-lg border p-3">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt=""
            className="h-12 w-12 rounded object-cover"
          />
        ) : (
          <FileIcon className="h-12 w-12 text-muted-foreground" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {props.selectedFile.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatBytes(props.selectedFile.size)}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            props.onClear();
            setError(null);
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={props.accept?.join(",")}
        onChange={handleFileInput}
      />
      <div
        onClick={() => !props.disabled && fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!props.disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (props.disabled) return;
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          props.disabled
            ? "opacity-50 cursor-not-allowed"
            : isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50",
        )}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Drag and drop or click to browse
        </p>
        {(props.accept || props.maxSize) && (
          <p className="text-xs text-muted-foreground mt-1">
            {props.accept && `Accepts: ${props.accept.join(", ")}`}
            {props.accept && props.maxSize && " · "}
            {props.maxSize && `Max size: ${formatBytes(props.maxSize)}`}
          </p>
        )}
      </div>
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1 mt-2">
          <AlertCircle size={14} /> {error}
        </p>
      )}
    </div>
  );
}

export { UploadDropzone, type UploadDropzoneProps };
