"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { GenericBlock } from "@vexcms/core";

/**
 * `localStorage` key for the admin block clipboard. Same origin means the
 * same deployment, so relationship/upload ids referenced by copied blocks
 * stay valid — the clipboard works across fields, documents and collections
 * within one deployment, and across browser tabs via the `storage` event.
 */
export const BLOCK_CLIPBOARD_STORAGE_KEY = "vex:block-clipboard";

/**
 * The envelope persisted at {@link BLOCK_CLIPBOARD_STORAGE_KEY}.
 */
export interface BlockClipboard {
  version: 1;
  copiedAt: number;
  blocks: GenericBlock[];
}

const BLOCK_CLIPBOARD_EVENT = "vex:block-clipboard-change";

let cachedRaw: string | null | undefined;
let cachedClipboard: BlockClipboard | null = null;

function isBlockClipboard(value: unknown): value is BlockClipboard {
  return (
    !!value &&
    typeof value === "object" &&
    (value as BlockClipboard).version === 1 &&
    typeof (value as BlockClipboard).copiedAt === "number" &&
    Array.isArray((value as BlockClipboard).blocks)
  );
}

function readClipboard(): BlockClipboard | null {
  if (typeof window === "undefined") return null;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(BLOCK_CLIPBOARD_STORAGE_KEY);
  } catch {
    return null;
  }
  if (raw === cachedRaw) return cachedClipboard;
  cachedRaw = raw;
  if (raw === null) {
    cachedClipboard = null;
    return cachedClipboard;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    cachedClipboard = isBlockClipboard(parsed) ? parsed : null;
  } catch {
    cachedClipboard = null;
  }
  return cachedClipboard;
}

const getServerSnapshot = (): BlockClipboard | null => null;

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(BLOCK_CLIPBOARD_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(BLOCK_CLIPBOARD_EVENT, onStoreChange);
  };
}

/**
 * Reads and writes the admin block clipboard. SSR-safe (`getServerSnapshot`
 * returns `null`; every `localStorage` access is guarded and a blocked/
 * unavailable store resolves to a no-op rather than throwing).
 *
 * `clipboard` updates on `storage` events (another tab writing the same key)
 * and on a same-tab custom event dispatched by {@link useBlockClipboard}'s
 * own writers — `storage` alone never fires in the tab that performed the
 * write. Malformed JSON, or JSON that does not match {@link BlockClipboard}'s
 * shape, reads back as `null` rather than throwing.
 *
 * @returns The current clipboard (or `null`), plus `copyBlocks` and
 *   `clearClipboard` writers.
 */
export function useBlockClipboard(): {
  clipboard: BlockClipboard | null;
  copyBlocks: (props: { blocks: GenericBlock[] }) => void;
  clearClipboard: () => void;
} {
  const clipboard = useSyncExternalStore(
    subscribe,
    readClipboard,
    getServerSnapshot,
  );

  const copyBlocks = useCallback((props: { blocks: GenericBlock[] }) => {
    if (typeof window === "undefined") return;
    const envelope: BlockClipboard = {
      version: 1,
      copiedAt: Date.now(),
      blocks: props.blocks,
    };
    try {
      window.localStorage.setItem(
        BLOCK_CLIPBOARD_STORAGE_KEY,
        JSON.stringify(envelope),
      );
    } catch {
      return;
    }
    window.dispatchEvent(new Event(BLOCK_CLIPBOARD_EVENT));
  }, []);

  const clearClipboard = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(BLOCK_CLIPBOARD_STORAGE_KEY);
    } catch {
      return;
    }
    window.dispatchEvent(new Event(BLOCK_CLIPBOARD_EVENT));
  }, []);

  return { clipboard, copyBlocks, clearClipboard };
}
