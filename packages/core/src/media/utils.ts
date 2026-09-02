/**
 * Formats byte count into human-readable file size.
 *
 * Converts raw byte count into appropriate units (B, KB, MB, GB, TB)
 * with sensible precision for each scale.
 *
 * @param bytes - File size in bytes
 * @returns Formatted string with unit (e.g. "248 KB", "1.4 MB")
 *
 * @example
 * ```ts
 * formatBytes(1024) // "1 KB"
 * formatBytes(1536) // "1.5 KB"
 * formatBytes(1048576) // "1 MB"
 * formatBytes(248000) // "242.2 KB"
 * ```
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes < 1024 * 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  return `${(bytes / (1024 * 1024 * 1024 * 1024)).toFixed(1)} TB`;
}

/**
 * Formats MIME type into short display name.
 *
 * Extracts the subtype from a MIME type and normalizes common variants.
 *
 * @param mimeType - Full MIME type (e.g. "image/jpeg")
 * @returns Uppercase short name (e.g. "JPG")
 *
 * @example
 * ```ts
 * formatMimeType("image/jpeg") // "JPG"
 * formatMimeType("image/svg+xml") // "SVG"
 * formatMimeType("application/pdf") // "PDF"
 * ```
 */
export function formatMimeType(mimeType: string): string {
  return (mimeType.split("/")[1] || mimeType)
    .toUpperCase()
    .replace("SVG+XML", "SVG")
    .replace("JPEG", "JPG");
}
