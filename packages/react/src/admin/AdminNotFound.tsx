import { Button } from "../ui/button";
import { VexLink } from "../ui/VexLink";
import { Icon } from "../ui/Icon";

/** Which not-found copy to show (Polish Decision 10). */
export type AdminNotFoundVariant = "collection" | "global" | "document";

/** Props for {@link AdminNotFound}. */
export interface AdminNotFoundProps {
  variant: AdminNotFoundVariant;
  /**
   * The detail line, shown verbatim below the title. Safe to include a caller-supplied slug/id
   * (never config-derived label/metadata) — same convention `NextAdminPage`'s pre-existing
   * not-found branches already followed (PolishNextShell review: "Not-found branches render
   * only the caller-supplied slug").
   */
  detail: string;
  /** Where the back button navigates — the dashboard for a collection/global, the collection's own list for a document. */
  backHref: string;
  /** Back button label, e.g. `"Back to dashboard"` or `"Back to Posts"`. */
  backLabel: string;
}

const TITLES: Record<AdminNotFoundVariant, string> = {
  collection: "Collection not found",
  global: "Global not found",
  document: "Document not found",
};

/**
 * Shared not-found state (Polish Decision 10), in {@link ListViewEmptyState}'s own visual style
 * (icon, title, detail line, one action button — `flex flex-col items-center gap-2 py-12
 * text-center`) — replaces every "TODO: add not found view" text block.
 *
 * Exported from `@vexcms/react`'s main entry, NOT `@vexcms/react/server` (developer-binding,
 * production-build-reported — moved back here after a round trip through the server entry):
 * the back button uses `VexLink` for genuine in-app navigation (no full page reload), and
 * `VexLink` depends on `useFrameworkComponents` — a `createContext`-backed hook. `VexLink`
 * itself correctly carries its own `"use client"`, but tsup bundles `@vexcms/react/server`'s
 * entire reachable graph into ONE output file; a single file can carry only one top-level
 * `"use client"` directive, so bundling `VexLink`'s code into that server-only entry's own
 * output flattened the boundary away — Next's PRODUCTION build (`next build`'s static RSC
 * analysis, never exercised by `next dev`) then saw `createContext` reachable from a module
 * with no `"use client"` of its own and failed (`pnpm check:vercel`'s pristine-clone check
 * is what caught it). Rendering this from `NextAdminPage` (a Server Component) costs nothing:
 * every other view (`AdminTopNav`/`CollectionListView`/etc.) is ALSO a client component
 * rendered the same way — React still renders a client component's own output into the
 * initial server-rendered HTML, zero layout shift, only ITS interactivity hydrates after.
 *
 * @param props - Component props. See {@link AdminNotFoundProps}.
 * @returns A centered icon/title/detail/button block, same frame as `ListViewEmptyState`.
 *
 * @example
 * ```tsx
 * <AdminNotFound
 *   variant="collection"
 *   detail={`Collection "${collectionSlug}" doesn't exist.`}
 *   backHref="/admin"
 *   backLabel="Back to dashboard"
 * />
 * ```
 */
export function AdminNotFound(props: AdminNotFoundProps) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <Icon name="FileQuestionMark" className="mb-2 size-10 text-muted-foreground" />
      <h3 className="font-medium">{TITLES[props.variant]}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{props.detail}</p>
      <Button
        variant="outline"
        nativeButton={false}
        render={<VexLink href={props.backHref} />}
        className="mt-2"
      >
        {props.backLabel}
      </Button>
    </div>
  );
}
