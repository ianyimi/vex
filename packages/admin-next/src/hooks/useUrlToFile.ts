"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAction } from "convex/react";
import { anyApi } from "convex/server";

interface UrlToFileResult {
  storageId: string;
  filename: string;
  mimeType: string;
  size: number;
}

interface UseUrlToFileReturn {
  url: string;
  setUrl: (url: string) => void;
  isFetching: boolean;
  error: string | null;
  result: UrlToFileResult | null;
  clear: () => void;
}

const DEFAULT_MAX_SIZE = 25 * 1024 * 1024; // 25MB
const DEBOUNCE_MS = 500;

function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Hook that auto-fetches a URL via the Convex downloadAndStoreUrl action
 * after a debounce. Returns the storageId + file metadata on success.
 */
export function useUrlToFile(props?: {
  maxSize?: number;
}): UseUrlToFileReturn {
  const [url, setUrl] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UrlToFileResult | null>(null);
  const latestUrlRef = useRef(url);
  const downloadAndStore = useAction(anyApi.vex.media.downloadAndStoreUrl);

  latestUrlRef.current = url;

  useEffect(() => {
    if (!url || !isValidUrl(url)) {
      setResult(null);
      setError(null);
      return;
    }

    const timer = setTimeout(async () => {
      // Check ref to avoid stale fetch
      if (latestUrlRef.current !== url) return;

      setIsFetching(true);
      setError(null);

      try {
        const response = await downloadAndStore({
          url,
          maxSize: props?.maxSize ?? DEFAULT_MAX_SIZE,
        });
        // Check if URL changed while we were fetching
        if (latestUrlRef.current === url) {
          setResult(response as UrlToFileResult);
        }
      } catch (err: any) {
        if (latestUrlRef.current === url) {
          const message =
            err?.data?.message ?? err?.message ?? "Failed to fetch URL";
          setError(typeof message === "string" ? message : String(message));
        }
      } finally {
        if (latestUrlRef.current === url) {
          setIsFetching(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [url, downloadAndStore, props?.maxSize]);

  const clear = useCallback(() => {
    setUrl("");
    setResult(null);
    setError(null);
  }, []);

  return { url, setUrl, isFetching, error, result, clear };
}

export type { UrlToFileResult, UseUrlToFileReturn };
