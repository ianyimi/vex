"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useMutation } from "convex/react";
import { anyApi } from "convex/server";
import { PREVIEW_SNAPSHOT_DEBOUNCE_MS } from "@vexcms/core";

interface UsePreviewSnapshotReturn {
  /** Callback to pass as AppForm's onValuesChange, or undefined when disabled */
  onValuesChange: ((values: Record<string, unknown>) => void) | undefined;
  /** True when a snapshot write is pending (debounce timer active or mutation in-flight) */
  isSyncing: boolean;
}

/**
 * Returns a debounced callback that writes preview snapshots to vex_versions,
 * plus a `isSyncing` flag for showing a loading indicator.
 *
 * @param props.collectionSlug - Collection slug
 * @param props.documentId - Document ID being edited
 * @param props.enabled - Whether snapshot writing is active (true when preview panel is open)
 */
export function usePreviewSnapshot(props: {
  collectionSlug: string;
  documentId: string;
  enabled: boolean;
}): UsePreviewSnapshotReturn {
  const upsertMutation = useMutation(anyApi.vex.previewSnapshot.upsert);
  const removeMutation = useMutation(anyApi.vex.previewSnapshot.remove);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const lastSnapshotRef = useRef<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

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
      setIsSyncing(false);
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
      const serialized = JSON.stringify(values);

      // Only mark as syncing if values actually differ from last written snapshot
      if (serialized === lastSnapshotRef.current) return;

      if (timerRef.current) clearTimeout(timerRef.current);
      setIsSyncing(true);

      timerRef.current = setTimeout(async () => {
        if (inFlightRef.current) return;

        // Re-check in case another write completed while debouncing
        if (serialized === lastSnapshotRef.current) {
          setIsSyncing(false);
          return;
        }

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
          setIsSyncing(false);
        }
      }, PREVIEW_SNAPSHOT_DEBOUNCE_MS);
    },
    [upsertMutation, props.collectionSlug, props.documentId],
  );

  return {
    onValuesChange: props.enabled ? writeSnapshot : undefined,
    isSyncing: props.enabled && isSyncing,
  };
}
