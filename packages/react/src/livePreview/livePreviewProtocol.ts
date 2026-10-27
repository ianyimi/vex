/**
 * Wire protocol for the live-preview transport — carried over both
 * `postMessage` (to a captured window reference) and `BroadcastChannel`
 * (`LIVE_PREVIEW_BROADCAST_CHANNEL`, needing no reference at all). Two message
 * types:
 *
 * - `vex-live-preview-handshake` — sent by the preview surface on mount, so state
 *   is recovered without waiting for the next keystroke.
 * - `vex-live-preview-update` — sent by the admin panel on every debounced form
 *   change, carrying the form's **complete** current values.
 */
export const LIVE_PREVIEW_MESSAGE_SOURCE = "vexcms-live-preview" as const;

/** Shared `BroadcastChannel` name — one channel for every document a page renders. */
export const LIVE_PREVIEW_BROADCAST_CHANNEL = "vexcms-live-preview";

/** Sent by the preview surface on mount to request current unsaved state. */
export interface LivePreviewHandshakeMessage {
  source: typeof LIVE_PREVIEW_MESSAGE_SOURCE;
  type: "vex-live-preview-handshake";
  /** The collection or global slug the preview surface expects to render. */
  collectionSlug: string;
  /** The saved document id, when the previewed document already exists. */
  documentId?: string;
  /** The client-generated temp id, when previewing a document being created. */
  tempId?: string;
}

/** Sent by the admin panel whenever the form's values change. */
export interface LivePreviewUpdateMessage {
  source: typeof LIVE_PREVIEW_MESSAGE_SOURCE;
  type: "vex-live-preview-update";
  collectionSlug: string;
  documentId?: string;
  tempId?: string;
  /** The form's complete current top-level values for this document. */
  values: Record<string, unknown>;
}

/** Either message the live-preview transport carries. */
export type LivePreviewMessage = LivePreviewHandshakeMessage | LivePreviewUpdateMessage;

/**
 * Narrows an arbitrary message payload to a `LivePreviewMessage`, so a listener
 * on either transport never trusts an unrelated message.
 *
 * @param data - The raw `MessageEvent.data` from either transport.
 * @returns `true` when the payload carries this protocol's source marker.
 */
export function isLivePreviewMessage(data: unknown): data is LivePreviewMessage {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as { source?: unknown }).source === LIVE_PREVIEW_MESSAGE_SOURCE
  );
}

/**
 * Returns the key `useLivePreview`'s `id → values` map stores one message's
 * values under — the saved document id when present, else the temp id.
 *
 * @param message - Any message carrying document identity.
 * @returns The map key, or `undefined` when the message identifies no document.
 */
export function livePreviewKeyFor(message: {
  documentId?: string;
  tempId?: string;
}): string | undefined {
  return message.documentId ?? message.tempId;
}

/**
 * Opens a `BroadcastChannel` on the shared name, or `null` in an environment
 * without `BroadcastChannel` (older Safari, some test/SSR contexts) — every
 * caller treats `null` as "this transport is unavailable, rely on
 * `postMessage` alone" rather than throwing.
 *
 * @returns The open channel, or `null` where `BroadcastChannel` is undefined.
 */
export function openLivePreviewBroadcastChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  return new BroadcastChannel(LIVE_PREVIEW_BROADCAST_CHANNEL);
}
