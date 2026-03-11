"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./dialog";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { UploadDropzone } from "./upload-dropzone";
import { AlertCircle } from "lucide-react";

interface CreateMediaModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Close the modal */
  onClose: () => void;
  /** The media collection slug being uploaded to */
  collectionSlug: string;
  /** Display label for the collection (e.g., "Images") */
  collectionLabel?: string;
  /** Accepted MIME types from the upload field config */
  accept?: string[];
  /** Max file size from the upload field config */
  maxSize?: number;
  /**
   * Called when upload is complete with the new media document ID.
   * The parent component links this ID into the upload field.
   */
  onUploadComplete: (documentId: string) => void;
  /** Function to generate an upload URL from the storage adapter */
  generateUploadUrl: () => Promise<string>;
  /** Function to create the media document with metadata */
  createMediaDocument: (props: {
    collectionSlug: string;
    fields: Record<string, unknown>;
  }) => Promise<string>;
}

async function extractImageDimensions(
  file: File,
): Promise<{ width: number; height: number } | null> {
  if (!file.type.startsWith("image/")) return null;
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

function CreateMediaModal(props: CreateMediaModalProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [altText, setAltText] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function handleFileSelect(file: File) {
    setSelectedFile(file);
    // Auto-populate display name from filename (without extension)
    const nameWithoutExt = file.name.replace(/\.[^.]+$/, "");
    setDisplayName(nameWithoutExt);
  }

  function handleClear() {
    setSelectedFile(null);
    setDisplayName("");
    setError(null);
  }

  function handleClose() {
    setSelectedFile(null);
    setAltText("");
    setDisplayName("");
    setError(null);
    setIsUploading(false);
    props.onClose();
  }

  async function handleUpload() {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      // 1. Get upload URL
      const uploadUrl = await props.generateUploadUrl();

      // 2. Upload file
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const { storageId } = await response.json();

      // 3. Extract image dimensions if applicable
      const dimensions = await extractImageDimensions(selectedFile);

      // 4. Create media document
      const docId = await props.createMediaDocument({
        collectionSlug: props.collectionSlug,
        fields: {
          storageId,
          filename: displayName || selectedFile.name,
          mimeType: selectedFile.type,
          size: selectedFile.size,
          url: "", // Resolved from storageId at query time
          alt: altText,
          ...(dimensions
            ? { width: dimensions.width, height: dimensions.height }
            : {}),
        },
      });

      props.onUploadComplete(docId);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setIsUploading(false);
    }
  }

  return (
    <Dialog open={props.open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Upload to {props.collectionLabel || props.collectionSlug}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 p-6">
          <UploadDropzone
            accept={props.accept}
            maxSize={props.maxSize}
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            onClear={handleClear}
            disabled={isUploading}
          />

          <div className="space-y-2">
            <Label htmlFor="media-name">Name</Label>
            <Input
              id="media-name"
              value={displayName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setDisplayName(e.target.value)
              }
              disabled={isUploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="media-alt">Alt Text</Label>
            <Input
              id="media-alt"
              value={altText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setAltText(e.target.value)
              }
              placeholder="Describe this file for accessibility"
              disabled={isUploading}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle size={14} /> {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { CreateMediaModal, type CreateMediaModalProps };
