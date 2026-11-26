"use client";

import { formatBytes, type DisplayComponentProps, type BytesField, type TDocument } from "@vexcms/core";

/** Hex preview truncation threshold, in bytes, for {@link BytesFieldDisplay}. */
const BYTES_DISPLAY_PREVIEW_LENGTH = 16;

/**
 * Formats the first {@link BYTES_DISPLAY_PREVIEW_LENGTH} bytes of a buffer as
 * space-separated hex, with a trailing ellipsis when the buffer is longer.
 *
 * @param value - The stored payload.
 * @returns The (possibly truncated) hex preview.
 */
function formatHexPreview(value: ArrayBuffer): string {
  const preview = new Uint8Array(value).subarray(0, BYTES_DISPLAY_PREVIEW_LENGTH);
  const hex = Array.from(preview)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join(" ");
  return value.byteLength > BYTES_DISPLAY_PREVIEW_LENGTH ? `${hex}…` : hex;
}

/**
 * Bytes field read-only display, registered as `reactAdapter.fields.bytes.display`.
 *
 * Shows the byte size plus a hex preview of the first
 * {@link BYTES_DISPLAY_PREVIEW_LENGTH} bytes — more than `BytesFieldCell`'s
 * size-only column can show.
 *
 * @param props - Component props.
 * @returns The size + hex preview, or an em-dash for an absent value.
 */
export function BytesFieldDisplay<TData extends TDocument = TDocument>(
  props: DisplayComponentProps<BytesField, TData>,
) {
  if (props.value === undefined || props.value === null) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <div className="flex flex-col gap-1 font-mono text-sm">
      <span>{formatBytes(props.value.byteLength)}</span>
      <span className="text-muted-foreground">{formatHexPreview(props.value)}</span>
    </div>
  );
}
