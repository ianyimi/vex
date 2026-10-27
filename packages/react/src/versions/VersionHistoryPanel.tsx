"use client";

import { useEffect, useRef, useState } from "react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Separator } from "../ui/separator";
import { StatusBadge } from "./StatusBadge";
import { usePermission } from "../access";
import { getVexErrorMessage } from "../utils/errors";
import { toast } from "sonner";

/**
 * Which versioned resource a {@link VersionHistoryPanel} points at — the same
 * `{ collection, id }`-or-`{ global }` shape every `versions.*` operation
 * accepts (Option A: one shared implementation per operation, dispatched on
 * resource kind, never two parallel endpoints per operation). The collection
 * branch's prop is named `documentId` (it is the document's currently-loaded
 * `_id`); it is sent on the wire as `id`, which is what the `versions.*`
 * validators accept.
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

/** Props for {@link useVersionHistoryState} (and, re-exported, {@link VersionHistoryDropdown}). */
export interface VersionHistoryPanelProps {
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

/** Everything {@link VersionHistoryPanel} needs to render — computed once by {@link useVersionHistoryState}. */
export interface VersionHistoryState {
  rows: VersionSummary[];
  liveVersion: number | undefined;
  shownVersion: number | undefined;
  publishedVersion: number | undefined;
  activeDraftVersion: number | undefined;
  canDeleteVersions: boolean;
  versionPendingDelete: number | null;
  setVersionPendingDelete: (version: number | null) => void;
  isDeleting: boolean;
  viewPendingDiscard: { version: number; isLive: boolean } | null;
  setViewPendingDiscard: (view: { version: number; isLive: boolean } | null) => void;
  requestView: (version: number, isLive: boolean) => void;
  handleView: (version: number, isLive: boolean) => Promise<void>;
  handleConfirmDelete: () => Promise<void>;
}

/**
 * All of {@link VersionHistoryPanel}'s state, queries, and mutation handlers — called by the
 * component that OWNS the lifetime of this history session (never unmounted mid-interaction):
 * `VersionHistoryDropdown` (its own top-level render, persistent across the dropdown opening and
 * closing — only `DropdownMenuContent`'s lazy-mounted children may safely remount) and
 * `VersionHistoryDialogContent` (mounted once by `useEditActionsMenuDialog().open(...)`, which
 * lives OUTSIDE the ⋯ menu's own lazily-mounted dropdown). Splitting the stateful hook from the
 * presentational {@link VersionHistoryPanel} below is why a reopened dropdown or redisplayed
 * dialog never loses a pending delete/discard confirmation mid-flight — the earlier single-
 * component version lost exactly that when it lived inside the lazily-mounted popup, remounting
 * fresh (and silently dropping the pending confirmation) every time the popup reopened.
 *
 * @param props - {@link VersionHistoryPanelProps} plus `enabled` — the owning caller's own
 *   `readDrafts` gate, so a denied caller never issues the `listVersions` query at all.
 * @returns The data and handlers {@link VersionHistoryPanel} renders from.
 */
export function useVersionHistoryState(
  props: VersionHistoryPanelProps & { enabled: boolean },
): VersionHistoryState {
  const queryClient = useQueryClient();
  const target = props.target;

  const resource = "collection" in target ? target.collection : target.global;
  const canDeleteVersions = usePermission({
    resource,
    action: DRAFT_ACTIONS.deleteVersions,
  });
  const [versionPendingDelete, setVersionPendingDelete] = useState<number | null>(null);
  const [viewPendingDiscard, setViewPendingDiscard] = useState<{
    version: number;
    isLive: boolean;
  } | null>(null);

  const versionsTargetArgs: { collection: string; id: string } | { global: string } =
    "collection" in target
      ? { collection: target.collection, id: target.documentId }
      : { global: target.global };

  const { data: versions } = useQuery({
    ...convexQuery(vexConvexApi.versions.listVersions, versionsTargetArgs),
    enabled: props.enabled,
  });

  const { mutateAsync: deleteVersionMutation, isPending: isDeleting } = useMutation({
    mutationFn: useConvexMutation(vexConvexApi.versions.deleteVersion),
  });

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

  return {
    rows,
    liveVersion,
    shownVersion,
    publishedVersion,
    activeDraftVersion,
    canDeleteVersions,
    versionPendingDelete,
    setVersionPendingDelete,
    isDeleting,
    viewPendingDiscard,
    setViewPendingDiscard,
    requestView,
    handleView,
    handleConfirmDelete,
  };
}

/**
 * The version-history list — purely presentational, rendering from a {@link VersionHistoryState}
 * computed by {@link useVersionHistoryState} in a persistent ancestor. Safe to mount/unmount
 * freely (a lazily-mounted dropdown/dialog popup, reopened many times) because it owns no state
 * of its own beyond the scroll-into-view ref, which is meant to re-run on every (re)mount.
 *
 * @param props.state - See {@link useVersionHistoryState}.
 * @param props.showLabel - Renders the inline "Version history" label + separator above the list
 *   — on by default, for `VersionHistoryDropdown`'s `DropdownMenuContent` (which has no title
 *   chrome of its own). `VersionHistoryDialogContent` passes `false`: its `DialogTitle` already
 *   reads "Version history".
 * @returns The version list plus its delete-confirmation and discard-unsaved-changes dialogs.
 */
export function VersionHistoryPanel(props: { state: VersionHistoryState; showLabel?: boolean }) {
  const { state } = props;
  const shownRowRef = useRef<HTMLDivElement | null>(null);

  // Scrolls the shown row into view once this list mounts — both `VersionHistoryDropdown`'s
  // `DropdownMenuContent` and the menu item's `Dialog` lazy-mount their content only while open,
  // so "on mount" and "on open" are the same moment either way.
  useEffect(() => {
    shownRowRef.current?.scrollIntoView?.({ block: "nearest" });
  }, []);

  return (
    <>
      {(props.showLabel ?? true) && (
        <>
          <p className="px-2 py-1.5 text-sm font-medium">Version history</p>
          <Separator />
        </>
      )}
      {state.rows.length === 0 ? (
        <p className="px-2 py-1.5 text-sm text-muted-foreground">No history yet</p>
      ) : (
        state.rows.map((version: VersionSummary) => {
          const isLive = version.version === state.liveVersion;
          const isShown = version.version === state.shownVersion;
          return (
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
                  {(version.version === state.publishedVersion ||
                    version.version === state.activeDraftVersion) && (
                    <span className="text-xs font-medium text-accent-foreground">Active</span>
                  )}
                </div>
                {version.publishedAt !== null && (
                  <span className="text-xs text-muted-foreground">
                    Published {new Date(version.publishedAt).toLocaleString()}
                  </span>
                )}
                {version.createdBy !== null && (
                  <span className="truncate text-xs text-muted-foreground">{version.createdBy}</span>
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
                    onClick={() => state.requestView(version.version, isLive)}
                  />
                )}
                {state.canDeleteVersions &&
                  !isLive &&
                  !isShown &&
                  version.version !== state.publishedVersion && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      icon="Trash2"
                      className="hover:text-destructive"
                      aria-label={`Delete version ${version.version}`}
                      onClick={() => state.setVersionPendingDelete(version.version)}
                    />
                  )}
              </div>
            </div>
          );
        })
      )}
      <AlertDialog
        open={state.versionPendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) state.setVersionPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete version {state.versionPendingDelete}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes this version's history row. It cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={state.isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              isPending={state.isDeleting}
              onClick={state.handleConfirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={state.viewPendingDiscard !== null}
        onOpenChange={(open) => {
          if (!open) state.setViewPendingDiscard(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Switching to version {state.viewPendingDiscard?.version} discards your unsaved
              changes. Cancel to go back and save a draft first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (state.viewPendingDiscard) {
                  void state.handleView(state.viewPendingDiscard.version, state.viewPendingDiscard.isLive);
                }
                state.setViewPendingDiscard(null);
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

/**
 * `edit.actionsMenu`'s History dialog content — mounted once by
 * `useEditActionsMenuDialog().open(...)` (so it lives OUTSIDE the ⋯ menu's own lazily-mounted
 * dropdown and keeps its state across the dialog's own open lifetime), calling
 * {@link useVersionHistoryState} itself since a hook can only run in a component that renders at
 * least once per mount — `VersionHistoryMenuItem`'s `openHistory()` closure cannot call it
 * directly.
 *
 * @param props - {@link VersionHistoryPanelProps} plus `onClose`, wired to the dialog's own
 *   close affordance (backdrop click, Escape).
 * @returns The History `Dialog`, its title, and {@link VersionHistoryPanel}.
 */
export function VersionHistoryDialogContent(
  props: VersionHistoryPanelProps & { onClose: () => void },
) {
  const state = useVersionHistoryState({ ...props, enabled: true });
  return (
    <Dialog open onOpenChange={(open) => !open && props.onClose()}>
      <DialogContent className="flex max-h-[80svh] w-full flex-col overflow-hidden sm:w-96">
        <DialogHeader>
          <DialogTitle>Version history</DialogTitle>
        </DialogHeader>
        <div className="-mx-6 min-h-0 overflow-y-auto px-6">
          <VersionHistoryPanel state={state} showLabel={false} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
