"use client";

/**
 * Sidebar note on `siteSettings`'s edit view, after the built-in sidebar
 * fields — exists to dogfood a global-level
 * `admin.components.edit.sidebar.after` contribution.
 */
export function CachePurgeNote() {
  return (
    <p className="text-xs text-muted-foreground">
      Saving re-resolves `livePreview.url` for every page on next load; no manual cache purge
      needed.
    </p>
  );
}
