"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { anyApi } from "convex/server";
import { DEFAULT_AUTOSAVE_INTERVAL } from "@vexcms/core";

/**
 * Autosave hook for versioned collections.
 * Calls the autosave mutation at a configurable interval
 * when there are unsaved changes.
 */
export function useAutosave(props: {
  collectionSlug: string;
  documentId: string;
  enabled: boolean;
  interval?: number;
  getChangedFields: () => Record<string, unknown> | null;
}) {
  const autosaveMutation = useMutation(anyApi.vex.versions.autosave);
  const inFlight = useRef(false);
  const getChangedFieldsRef = useRef(props.getChangedFields);
  getChangedFieldsRef.current = props.getChangedFields;

  useEffect(() => {
    if (!props.enabled) return;

    const intervalMs = props.interval ?? DEFAULT_AUTOSAVE_INTERVAL;

    const id = setInterval(async () => {
      if (inFlight.current) return;

      const changes = getChangedFieldsRef.current();
      if (!changes) return;

      inFlight.current = true;
      try {
        await autosaveMutation({
          collectionSlug: props.collectionSlug,
          documentId: props.documentId,
          fields: changes,
        });
      } finally {
        inFlight.current = false;
      }
    }, intervalMs);

    return () => clearInterval(id);
  }, [props.enabled, props.interval, props.collectionSlug, props.documentId, autosaveMutation]);
}
