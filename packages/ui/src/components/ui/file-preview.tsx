"use client";

import {
  File,
  FileVideo2,
  FileAudio,
  FileText,
  FileSpreadsheet,
  FileArchive,
} from "lucide-react";
import { cn } from "../../styles/utils";

interface FilePreviewProps {
  /** The URL of the file (used for image src) */
  url?: string | null;
  /** The MIME type of the file */
  mimeType: string;
  /** Alt text for images */
  alt?: string;
  /** Size in pixels (width and height). Default: 40 */
  size?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Returns the appropriate Lucide icon component for a given MIME type.
 */
function getIconForMimeType(mimeType: string) {
  if (mimeType.startsWith("video/")) return FileVideo2;
  if (mimeType.startsWith("audio/")) return FileAudio;
  if (mimeType === "application/pdf" || mimeType.startsWith("text/"))
    return FileText;
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("csv") ||
    mimeType.includes("excel")
  )
    return FileSpreadsheet;
  if (
    mimeType.includes("zip") ||
    mimeType.includes("tar") ||
    mimeType.includes("gzip") ||
    mimeType.includes("rar") ||
    mimeType.includes("7z")
  )
    return FileArchive;
  return File;
}

function FilePreview(props: FilePreviewProps) {
  const size = props.size ?? 40;
  const isImage = props.mimeType.startsWith("image/");

  if (isImage && props.url) {
    return (
      <img
        src={props.url}
        alt={props.alt || ""}
        className={cn("rounded object-cover", props.className)}
        style={{ width: size, height: size }}
      />
    );
  }

  const IconComponent = getIconForMimeType(props.mimeType);
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded bg-muted",
        props.className,
      )}
      style={{ width: size, height: size }}
    >
      <IconComponent
        className="text-muted-foreground"
        style={{ width: size * 0.5, height: size * 0.5 }}
      />
    </div>
  );
}

export { FilePreview, type FilePreviewProps };
