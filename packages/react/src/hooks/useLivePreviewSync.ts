"use client";

import { useEffect } from "react";
import { useStore } from "@tanstack/react-form";
import { DEFAULT_LIVE_PREVIEW_DEBOUNCE_MS } from "@vexcms/core";
import type { AnyFormApi } from "../components/form/AppFormContext";
import {
  LIVE_PREVIEW_MESSAGE_SOURCE,
  isLivePreviewMessage,
  openLivePreviewBroadcastChannel,
  livePreviewKeyFor,
  type LivePreviewUpdateMessage,
} from "../context/livePreviewProtocol";

/**
 * Posts the form's complete current values to the active preview target, on
 * both `BroadcastChannel` and (when a window reference is held) `postMessage`,
 * on every change, debounced. Also listens for a matching
 * `vex-live-preview-handshake` over `BroadcastChannel` and replies immediately
 * with the current values — recovering state for a tab this admin session
 * never opened itself.
 *
 * @param props.form - The edit view's form instance.
 * @param props.collectionSlug - The collection or global slug being previewed.
 * @param props.documentId - The saved document id, once it exists.
 * @param props.tempId - The client-generated temp id, before the first save.
 * @param props.targetWindow - A preview surface this panel holds a reference
 *   to — in practice the embedded iframe's `contentWindow`, or `null`. A tab
 *   opened from the preview link leaves no reference, so it is reached over
 *   `BroadcastChannel`: `postMessage` no-ops without a window, the broadcast
 *   posts regardless.
 * @param props.debounceMs - Milliseconds to wait after the last form change
 *   before posting. Defaults to `DEFAULT_LIVE_PREVIEW_DEBOUNCE_MS`.
 */
export function useLivePreviewSync(props: {
  form: AnyFormApi;
  collectionSlug: string;
  documentId?: string;
  tempId?: string;
  targetWindow: Window | null;
  debounceMs?: number;
}): void {
  const values = useStore(props.form.store, (state) => state.values);
  const debounceMs = Math.max(
    props.debounceMs ?? DEFAULT_LIVE_PREVIEW_DEBOUNCE_MS,
    DEFAULT_LIVE_PREVIEW_DEBOUNCE_MS,
  );
  const previewKey = props.documentId ?? props.tempId;
  const { collectionSlug, documentId, tempId, targetWindow } = props;

  useEffect(() => {
    if (!previewKey) return;
    const channel = openLivePreviewBroadcastChannel();

    function postUpdate() {
      const updateMessage: LivePreviewUpdateMessage = {
        source: LIVE_PREVIEW_MESSAGE_SOURCE,
        type: "vex-live-preview-update",
        collectionSlug,
        documentId,
        tempId,
        values,
      };
      channel?.postMessage(updateMessage);
      targetWindow?.postMessage(updateMessage, "*");
    }

    function handleChannelMessage(event: MessageEvent) {
      if (!isLivePreviewMessage(event.data)) return;
      if (event.data.type !== "vex-live-preview-handshake") return;
      if (livePreviewKeyFor(event.data) !== previewKey) return;
      postUpdate();
    }

    channel?.addEventListener("message", handleChannelMessage);
    const syncTimeoutId = setTimeout(postUpdate, debounceMs);

    return () => {
      clearTimeout(syncTimeoutId);
      channel?.close();
    };
  }, [values, previewKey, debounceMs, targetWindow, collectionSlug, documentId, tempId]);
}
