/**
 * Props for {@link AdminIndexEmptyState}.
 */
export interface AdminIndexEmptyStateProps {
  /** e.g. `"No collections available"`, `"No globals available"`. */
  title: string;
  /** One sentence of detail shown below the title. */
  detail: string;
}

/**
 * Shown by `CollectionsIndexView`/`GlobalsListView` when every section they'd otherwise
 * render is empty — the caller can read nothing here at all (developer-reported: with
 * zero readable collections/globals, e.g. an anonymous `guest` role with no grants on
 * either, the page rendered nothing at all under its own title; a caller with genuinely
 * nothing to see deserves a real state, not a page that just trails off).
 *
 * Same visual shape as `ListViewEmptyState`'s own `"empty"` variant (`flex flex-col
 * items-center gap-2 py-12 text-center`, a `<h3>` title, a `<p>` detail line) — the
 * established "nothing here (yet)" pattern this package already uses, not an error state
 * (`AdminNotFound`'s own icon+title+detail+back-button shape fits a caller trying to
 * reach something that doesn't exist; this is a caller correctly viewing a page that
 * simply has nothing to show them, same frame size either way).
 *
 * @param props - Component props. See {@link AdminIndexEmptyStateProps}.
 * @returns A centered title/detail block.
 */
export function AdminIndexEmptyState(props: AdminIndexEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <h3 className="font-medium">{props.title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{props.detail}</p>
    </div>
  );
}
