"use client";

import { useEffect } from "react";
import { useStore } from "@tanstack/react-form";
import { DEFAULT_LIVE_PREVIEW_DEBOUNCE_MS } from "@vexcms/core";
import type { AnyFormApi } from "../forms";
import {
  LIVE_PREVIEW_MESSAGE_SOURCE,
  isLivePreviewMessage,
  openLivePreviewBroadcastChannel,
  type LivePreviewUpdateMessage,
} from "./livePreviewProtocol";

/**
 * Posts the form's complete current values to the active preview target, on
 * both `BroadcastChannel` and (when a window reference is held) `postMessage`,
 * on every change, debounced. Also replies at once to a
 * `vex-live-preview-ready` — over `BroadcastChannel` from any same-origin
 * preview surface, or over `postMessage` from the exact frame this panel holds —
 * so a preview page that just loaded or reloaded shows the current unsaved
 * values without waiting for the next keystroke.
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

    function isReadyMessage(data: unknown): boolean {
      return isLivePreviewMessage(data) && data.type === "vex-live-preview-ready";
    }

    function handleChannelMessage(event: MessageEvent) {
      if (isReadyMessage(event.data)) postUpdate();
    }

    function handleWindowMessage(event: MessageEvent) {
      if (targetWindow && event.source === targetWindow && isReadyMessage(event.data)) {
        postUpdate();
      }
    }

    channel?.addEventListener("message", handleChannelMessage);
    window.addEventListener("message", handleWindowMessage);
    const syncTimeoutId = setTimeout(postUpdate, debounceMs);

    return () => {
      clearTimeout(syncTimeoutId);
      window.removeEventListener("message", handleWindowMessage);
      channel?.close();
    };
  }, [values, previewKey, debounceMs, targetWindow, collectionSlug, documentId, tempId]);
}
