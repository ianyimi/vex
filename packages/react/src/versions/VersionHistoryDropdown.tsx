"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import {
  DRAFT_ACTIONS,
  vexConvexApi,
  type CollectionSlug,
  type GlobalSlug,
  type VersionSummary,
} from "@vexcms/core";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { StatusBadge } from "./StatusBadge";
import { usePermission } from "../access";
import { getVexErrorMessage } from "../utils/errors";
import { toast } from "sonner";

/**
 * Which versioned resource a {@link VersionHistoryDropdown} points at — the
 * same `{ collection, id }`-or-`{ global }` shape every `versions.*`
 * operation accepts (Option A: one shared implementation per operation,
 * dispatched on resource kind, never two parallel endpoints per operation).
 * The collection branch's prop is named `documentId` (it is the document's
 * currently-loaded `_id`); it is sent on the wire as `id`, which is what the
 * `versions.*` validators accept.
 */
export type VersionHistoryTarget =
  | {
      /** The versioned collection slug. */
      collection: CollectionSlug;
      /** The document's currently-loaded Convex `_id` — the published row, or an active draft's own row. */
      documentId: string;
    }
  | {
      /** The versioned global slug. */
      global: GlobalSlug;
    };

/** A history version shown in the edit form. */
export interface ViewedVersion {
  version: number;
  snapshot: Record<string, unknown>;
}

/** Props for {@link VersionHistoryDropdown}. */
export interface VersionHistoryDropdownProps {
  /** Which versioned resource this history belongs to. See {@link VersionHistoryTarget}. */
  target: VersionHistoryTarget;
  /**
   * Whether the live document is a draft. The live version is the newest row
   * while a draft exists, otherwise the most recently published row.
   */
  hasDraft: boolean;
  /** The version shown in the edit form, or `null` for the live document. */
  viewingVersion: number | null;
  /**
   * The live row's `vex_activeVersion` pointer — which history row the
   * document (or its draft) currently mirrors. `null`/`undefined` falls back
   * to the newest row, for documents written before the pointer existed.
   */
  activeVersion?: number | null;
  /** Shows a version in the edit form, or `null` to return to the live document. Never saves. */
  onViewVersion: (view: ViewedVersion | null) => void;
  /** Whether the edit form has unsaved changes; switching versions then asks to discard them first. */
  hasUnsavedChanges: boolean;
}

/**
 * Version-history menu for a versioned collection document OR a versioned
 * global's edit view: lists every `vex_versions` row for the resource
 * (newest first), with each row's version number, status, `publishedAt`
 * (when present), creator, and timestamp. The version shown in the edit form
 * is highlighted — the live version unless an older one is being viewed.
 *
 * Takes one `target` prop rather than separate `collection`/`documentId`
 * props precisely so a global target never has to invent a fake
 * `documentId` or route through the literal string `"vex_globals"` — every
 * permission check and `versions.*` call below resolves its resource/args
 * from `target` once.
 *
 * Viewing is read-only: it fetches the version's snapshot and hands it to the
 * edit view via `onViewVersion`. Nothing is saved; the edit view records the
 * viewed version as the parent only if the user edits and saves.
 *
 * Renders nothing at all without `readDrafts` (Step 17 gates both reads on
 * it) — there is no permission-denied state to show, since the trigger
 * button itself would have nothing to open. The delete action on each row
 * renders only with `deleteVersions`.
 *
 * @param props - See {@link VersionHistoryDropdownProps}.
 * @returns The history dropdown trigger + menu, plus a delete-confirmation
 *   dialog, or `null` without `readDrafts`.
 * @throws Never — view/delete failures are caught and toasted.
 *
 * @example
 * ```tsx
 * <VersionHistoryDropdown
 *   target={{ collection: collection.slug, documentId: activeDocumentId }}
 *   hasDraft={isDraftDoc}
 *   viewingVersion={viewedVersion?.version ?? null}
 *   onViewVersion={setViewedVersion}
 *   hasUnsavedChanges={!isDefaultValue}
 * />
 * ```
 */
export function VersionHistoryDropdown(props: VersionHistoryDropdownProps) {
  const queryClient = useQueryClient();
  const target = props.target;

  // The ONE place per permission check that decides which slug is "this
  // resource" — a collection target's own slug, or a global's own slug.
  // Never the literal `"vex_globals"`: RBAC is defined per-resource in
  // `defineAccess`, and a global's permissions live under its own slug
  // exactly like a collection's do.
  const resource = "collection" in target ? target.collection : target.global;

  const canReadDrafts = usePermission({
    resource,
    action: DRAFT_ACTIONS.readDrafts,
  });
  const canDeleteVersions = usePermission({
    resource,
    action: DRAFT_ACTIONS.deleteVersions,
  });
  const [versionPendingDelete, setVersionPendingDelete] = useState<number | null>(null);
  const [viewPendingDiscard, setViewPendingDiscard] = useState<{
    version: number;
    isLive: boolean;
  } | null>(null);
  const shownRowRef = useRef<HTMLDivElement | null>(null);

  // The `{ collection, id } | { global }` shape every `versions.*` read/delete
  // validator accepts — no id is ever invented for the global branch. Annotated
  // so TypeScript doesn't widen the two literals into `{ global?: undefined }`,
  // which the API's discriminated arg union rejects.
  const versionsTargetArgs: { collection: string; id: string } | { global: string } =
    "collection" in target
      ? { collection: target.collection, id: target.documentId }
      : { global: target.global };

  const { data: versions } = useQuery({
    ...convexQuery(vexConvexApi.versions.listVersions, versionsTargetArgs),
    enabled: canReadDrafts,
  });

  const { mutateAsync: deleteVersionMutation, isPending: isDeleting } = useMutation({
    mutationFn: useConvexMutation(vexConvexApi.versions.deleteVersion),
  });

  /**
   * Shows a version in the edit form without saving: another one with its
   * fetched snapshot, the live one by returning to the live document.
   *
   * @param version - The `vex_versions` row's `version` number to view.
   * @param isLive - Whether it is the live version.
   * @returns Promise resolving once the view is handed to the edit view.
   */
  async function handleView(version: number, isLive: boolean): Promise<void> {
    if (isLive) {
      props.onViewVersion(null);
      return;
    }
    try {
      // One-shot fetch, not a subscription: a snapshot is immutable history.
      const { snapshot } = await queryClient.fetchQuery(
        convexQuery(vexConvexApi.versions.getVersionSnapshot, { ...versionsTargetArgs, version }),
      );
      props.onViewVersion({ version, snapshot });
    } catch (error) {
      toast.error("Could not load version", { description: getVexErrorMessage(error) });
    }
  }

  function requestView(version: number, isLive: boolean): void {
    if (props.hasUnsavedChanges) {
      setViewPendingDiscard({ version, isLive });
      return;
    }
    void handleView(version, isLive);
  }

  /**
   * Permanently deletes the version row pending confirmation
   * (`versionPendingDelete`).
   *
   * @returns Promise resolving once the row is deleted (or the attempt fails).
   */
  async function handleConfirmDelete(): Promise<void> {
    if (versionPendingDelete === null) return;
    try {
      // No manual refetch: `listVersions` is a live subscription.
      await deleteVersionMutation({ ...versionsTargetArgs, version: versionPendingDelete });
    } catch (error) {
      toast.error("Delete failed", { description: getVexErrorMessage(error) });
    } finally {
      // Closes the dialog either way; a failure was already toasted.
      setVersionPendingDelete(null);
    }
  }

  if (!canReadDrafts) return null;

  const rows = versions ?? [];
  const publishedVersion = rows
    .filter((row) => row.status === "published")
    .reduce<VersionSummary | undefined>(
      (latest, row) => (latest && (latest.publishedAt ?? 0) >= (row.publishedAt ?? 0) ? latest : row),
      undefined,
    )?.version;
  const pointer = props.activeVersion ?? undefined;
  const liveVersion = props.hasDraft
    ? (pointer ?? rows[0]?.version)
    : (pointer ?? publishedVersion ?? rows[0]?.version);
  const activeDraftVersion = props.hasDraft ? (pointer ?? rows[0]?.version) : undefined;
  const shownVersion = props.viewingVersion ?? liveVersion;

  return (
    <>
      <DropdownMenu
        onOpenChangeComplete={(open) => {
          if (open) shownRowRef.current?.scrollIntoView?.({ block: "nearest" });
        }}
      >
        <DropdownMenuTrigger
          render={
            <Button type="button" variant="outline" icon="History">
              History
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-80">
          {/* Base UI's GroupLabel throws outside a Menu.Group. */}
          <DropdownMenuGroup>
            <DropdownMenuLabel>Version history</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          {rows.length === 0 ? (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">No history yet</p>
          ) : (
            rows.map((version: VersionSummary) => {
              const isLive = version.version === liveVersion;
              const isShown = version.version === shownVersion;
              return (
                // A plain row, not `DropdownMenuItem`: compound content with
                // its own inline actions, not one selectable item.
                <div
                  key={version.version}
                  ref={isShown ? shownRowRef : undefined}
                  className="flex items-start justify-between gap-2 px-2 py-1.5 text-sm"
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          isShown ? "font-medium text-green-600 dark:text-green-500" : "font-medium"
                        }
                      >
                        Version {version.version}
                      </span>
                      <StatusBadge status={version.status} />
                      {(version.version === publishedVersion ||
                        version.version === activeDraftVersion) && (
                        <span className="text-xs font-medium text-accent-foreground">Active</span>
                      )}
                    </div>
                    {version.publishedAt !== null && (
                      <span className="text-xs text-muted-foreground">
                        Published {new Date(version.publishedAt).toLocaleString()}
                      </span>
                    )}
                    {version.createdBy !== null && (
                      <span className="truncate text-xs text-muted-foreground">
                        {version.createdBy}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(version.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {!isShown && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        icon="RotateCcw"
                        className="hover:text-primary"
                        aria-label={`View version ${version.version}`}
                        onClick={() => requestView(version.version, isLive)}
                      />
                    )}
                    {canDeleteVersions && !isLive && !isShown && version.version !== publishedVersion && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        icon="Trash2"
                        className="hover:text-destructive"
                        aria-label={`Delete version ${version.version}`}
                        onClick={() => setVersionPendingDelete(version.version)}
                      />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog
        open={versionPendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setVersionPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete version {versionPendingDelete}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes this version's history row. It cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              isPending={isDeleting}
              onClick={handleConfirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={viewPendingDiscard !== null}
        onOpenChange={(open) => {
          if (!open) setViewPendingDiscard(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Switching to version {viewPendingDiscard?.version} discards your unsaved changes.
              Cancel to go back and save a draft first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (viewPendingDiscard) {
                  void handleView(viewPendingDiscard.version, viewPendingDiscard.isLive);
                }
                setViewPendingDiscard(null);
              }}
            >
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
