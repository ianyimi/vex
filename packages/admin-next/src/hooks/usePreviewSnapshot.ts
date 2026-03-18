"use client";

import { useEffect, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { anyApi } from "convex/server";
import { PREVIEW_SNAPSHOT_DEBOUNCE_MS } from "@vexcms/core";

/**
 * Returns a debounced callback that writes preview snapshots to vex_versions.
 * Pass the returned callback as `onValuesChange` to AppForm.
 *
 * The snapshot is a transient entry in vex_versions (status: "previewSnapshot")
 * that getDocument merges when the frontend passes `preview: true`.
 *
 * @param props.collectionSlug - Collection slug
 * @param props.documentId - Document ID being edited
 * @param props.enabled - Whether snapshot writing is active (true when preview panel is open)
 * @returns Callback to pass as AppForm's onValuesChange, or undefined when disabled
 */
export function usePreviewSnapshot(props: {
  collectionSlug: string;
  documentId: string;
  enabled: boolean;
}): ((values: Record<string, unknown>) => void) | undefined {
  const upsertMutation = useMutation(anyApi.vex.previewSnapshot.upsert);
  const removeMutation = useMutation(anyApi.vex.previewSnapshot.remove);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const lastSnapshotRef = useRef<string | null>(null);

  // Clean up snapshot when preview is closed
  useEffect(() => {
    if (!props.enabled) {
      if (lastSnapshotRef.current !== null) {
        lastSnapshotRef.current = null;
        removeMutation({
          collectionSlug: props.collectionSlug,
          documentId: props.documentId,
        }).catch(() => {});
      }
    }
  }, [props.enabled, removeMutation, props.collectionSlug, props.documentId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (lastSnapshotRef.current !== null) {
        removeMutation({
          collectionSlug: props.collectionSlug,
          documentId: props.documentId,
        }).catch(() => {});
      }
    };
  }, [removeMutation, props.collectionSlug, props.documentId]);

  const writeSnapshot = useCallback(
    (values: Record<string, unknown>) => {
      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(async () => {
        if (inFlightRef.current) return;

        const serialized = JSON.stringify(values);
        if (serialized === lastSnapshotRef.current) return;

        inFlightRef.current = true;
        try {
          await upsertMutation({
            collectionSlug: props.collectionSlug,
            documentId: props.documentId,
            snapshot: values,
          });
          lastSnapshotRef.current = serialized;
        } catch {
          // best-effort
        } finally {
          inFlightRef.current = false;
        }
      }, PREVIEW_SNAPSHOT_DEBOUNCE_MS);
    },
    [upsertMutation, props.collectionSlug, props.documentId],
  );

  if (!props.enabled) return undefined;
  return writeSnapshot;
}
