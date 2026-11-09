/**
 * Measures the pixel width/height of an image `File` via `createImageBitmap`.
 *
 * `MediaUploadDropzone` and `MediaUploadForm` call this before creating the
 * media document so the `width`/`height` fields `defineMediaCollection`
 * injects (`@vexcms/file-storage-convex`'s `mediaCollection.ts`) get a real
 * value instead of staying `0` — nothing else in the upload pipeline reads
 * pixel dimensions.
 *
 * @param file - The file staged for upload.
 * @returns `{ width, height }` for a decodable image, `undefined` for a
 *   non-image MIME type or a file the browser can't decode (e.g. corrupt
 *   bytes) — callers then omit `width`/`height` entirely from the create
 *   call, matching the fields' existing default semantics for non-images.
 */
export async function measureImageDimensions(
  file: File,
): Promise<{ width: number; height: number } | undefined> {
  if (!file.type.startsWith("image/")) return undefined;
  try {
    const bitmap = await createImageBitmap(file);
    const dimensions = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dimensions;
  } catch {
    return undefined;
  }
}
