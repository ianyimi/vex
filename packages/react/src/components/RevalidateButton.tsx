"use client";

import type { CollectionSlug, VexDocument } from "@vexcms/core";
import { CRUD_ACTIONS, PERMISSION_SCOPES } from "@vexcms/core";

import { usePermission } from "../hooks";
import { useVexRevalidate } from "../hooks/useVexRevalidate";
import { Button } from "./ui";

/** Props for {@link RevalidateButton}. */
export interface RevalidateButtonProps {
  /** Collection to check write permission against and to purge. */
  collection: CollectionSlug;
  /**
   * The single document to purge. Omit to purge every path configured for the
   * whole collection (e.g. from `CollectionListView`).
   */
  doc?: Partial<VexDocument>;
  /** Button label override. Defaults to "Revalidate" / "Revalidate all". */
  label?: string;
}

/**
 * Manual admin-panel purge control. Covers what a client-driven purge cannot
 * reach on its own: Convex dashboard edits, `npx convex import`, streaming
 * import, or a tab that closed before its automatic purge landed.
 *
 * Posts through {@link useVexRevalidate} to the same session-authorized route
 * `useVexMutation` posts to — no separate secret or API key. Gated on the
 * caller's write permission for `props.collection` (advisory only, per P-004 —
 * the route itself enforces via `hasPermission`), and renders the request's
 * pending/error state rather than failing silently, since this is a
 * user-initiated action.
 *
 * @param props - See {@link RevalidateButtonProps}.
 * @returns A button that purges one document (`props.doc` set) or an entire
 *   collection (`props.doc` omitted), plus an inline error message on failure.
 *
 * @example
 * ```tsx
 * // Purge the document currently open in CollectionEditView
 * <RevalidateButton collection={props.collection.slug} doc={currentDocument} />
 *
 * // Purge every path in the collection, from CollectionListView
 * <RevalidateButton collection={collection.slug} />
 * ```
 */
export function RevalidateButton(props: RevalidateButtonProps) {
  const canRevalidate = usePermission({
    action: CRUD_ACTIONS.update,
    resource: props.collection,
    scope: PERMISSION_SCOPES.any,
  });
  const { error, isPending, purgeCollection, purgeDocument } = useVexRevalidate();

  async function handleClick() {
    // The rejection already populated `error` for the render below; swallowing
    // it here keeps a failed purge from surfacing as an unhandled rejection.
    if (props.doc) {
      await purgeDocument({ collection: props.collection, doc: props.doc }).catch(() => {});
    } else {
      await purgeCollection({ collection: props.collection }).catch(() => {});
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        disabled={!canRevalidate || isPending}
        icon="RefreshCw"
        isPending={isPending}
        onClick={handleClick}
        type="button"
        variant="outline"
      >
        {props.label ?? (props.doc ? "Revalidate" : "Revalidate all")}
      </Button>
      {error && <p className="text-destructive text-xs">{error.message}</p>}
    </div>
  );
}
