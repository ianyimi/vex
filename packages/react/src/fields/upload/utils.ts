/** Props for {@link matchesAcceptPattern}. */
export interface MatchesAcceptPatternProps {
  /** The candidate's filename, e.g. `"photo.png"`. */
  filename: string;
  /** The candidate's MIME type, e.g. `"image/png"`. */
  mimeType: string;
  /** Comma-separated `accept` pattern list — file extensions, MIME types, or `type/*` wildcards. */
  accept: string;
}

/**
 * Checks whether a filename/MIME-type pair matches an HTML `accept`
 * attribute pattern list — mirrors the native `<input type="file"
 * accept="...">` matching semantics (comma-separated file extensions, MIME
 * types, or `type/*` wildcards).
 *
 * Shared by `EmptyInput`'s dropzone filter and `usePaginatedSearch`'s
 * client-side MIME filtering for the media library grid.
 *
 * @param props - The candidate filename/MIME type and the `accept` pattern list.
 * @returns `true` when `accept` is empty or the candidate matches one of its patterns.
 */
export function matchesAcceptPattern(
  props: MatchesAcceptPatternProps,
): boolean {
  const patterns = props.accept
    .split(",")
    .map((pattern) => pattern.trim().toLowerCase())
    .filter(Boolean);
  if (patterns.length === 0) return true;

  const fileName = props.filename.toLowerCase();
  const mimeType = props.mimeType.toLowerCase();
  const mimeCategory = mimeType.split("/")[0];

  return patterns.some((pattern) => {
    if (pattern.startsWith(".")) return fileName.endsWith(pattern);
    if (pattern.endsWith("/*")) return mimeCategory === pattern.slice(0, -2);
    return mimeType === pattern;
  });
}

/**
 * Checks whether a dropped/selected `File` matches an HTML `accept`
 * attribute pattern list.
 *
 * @param file - The candidate file.
 * @param accept - The `accept` attribute value, e.g. `"image/*, .pdf"`.
 * @returns `true` when `accept` is empty or the file matches one of its patterns.
 */
export function fileMatchesAccept(file: File, accept: string): boolean {
  return matchesAcceptPattern({
    filename: file.name,
    mimeType: file.type,
    accept,
  });
}
