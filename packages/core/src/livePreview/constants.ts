import type { LivePreviewBreakpoint } from "../types/livePreview";

export const DEFAULT_BREAKPOINTS: LivePreviewBreakpoint[] = [
  { label: "Mobile", width: 375, height: 667, icon: "smartphone" },
  { label: "Tablet", width: 768, height: 1024, icon: "tablet" },
  { label: "Laptop", width: 1280, height: 800, icon: "laptop" },
  { label: "Desktop", width: 1920, height: 1080, icon: "monitor" },
];

/**
 * Debounce interval for writing preview snapshots on form changes.
 */
export const PREVIEW_SNAPSHOT_DEBOUNCE_MS = 500;
