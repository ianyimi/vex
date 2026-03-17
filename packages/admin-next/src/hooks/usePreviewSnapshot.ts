"use client";

import { useEffect, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { anyApi } from "convex/server";
import { PREVIEW_SNAPSHOT_DEBOUNCE_MS } from "@vexcms/core";

/**
 * Writes a debounced preview snapshot on form changes.
 * The snapshot is a transient entry in vex_versions (status: "previewSnapshot")
 * that the preview iframe fetches via vexQuery.
 *
 * @param props.collectionSlug - Collection slug
 * @param props.documentId - Document ID being edited
 * @param props.enabled - Whether snapshot writing is active (true when preview panel is open)
 * @param props.getFormValues - Function that returns current form field values
 */
export function usePreviewSnapshot(props: {
  collectionSlug: string;
  documentId: string;
  enabled: boolean;
  getFormValues: () => Record<string, unknown> | null;
}) {
  const upsertMutation = useMutation(anyApi.vex.previewSnapshot.upsert);
  const removeMutation = useMutation(anyApi.vex.previewSnapshot.remove);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enabledRef = useRef(props.enabled);
  const getFormValuesRef = useRef(props.getFormValues);

  // Keep refs in sync
  enabledRef.current = props.enabled;
  getFormValuesRef.current = props.getFormValues;

  const writeSnapshot = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      if (!enabledRef.current) return;

      const values = getFormValuesRef.current();
      if (!values) return;

      try {
        await upsertMutation({
          collectionSlug: props.collectionSlug,
          documentId: props.documentId,
          snapshot: values,
        });
      } catch {
        // Snapshot writes are best-effort — don't disrupt editing
      }
    }, PREVIEW_SNAPSHOT_DEBOUNCE_MS);
  }, [upsertMutation, props.collectionSlug, props.documentId]);

  // Write snapshot when enabled and form values change
  useEffect(() => {
    if (!props.enabled) return;

    // Write initial snapshot when preview opens
    writeSnapshot();

    // Set up an interval to check for form changes
    const intervalId = setInterval(() => {
      if (enabledRef.current) {
        writeSnapshot();
      }
    }, PREVIEW_SNAPSHOT_DEBOUNCE_MS * 2);

    return () => {
      clearInterval(intervalId);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [props.enabled, writeSnapshot]);

  // Clean up snapshot when preview is closed or component unmounts
  useEffect(() => {
    return () => {
      if (enabledRef.current) {
        removeMutation({
          collectionSlug: props.collectionSlug,
          documentId: props.documentId,
        }).catch(() => {});
      }
    };
  }, [removeMutation, props.collectionSlug, props.documentId]);
}
