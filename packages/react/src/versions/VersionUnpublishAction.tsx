"use client";

import { useState } from "react";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { DRAFT_ACTIONS, vexConvexApi, type EditSlotProps } from "@vexcms/core";
import { useVexDocument } from "../documents/VexDocumentContext";
import { useDocumentEditRuntime } from "../documents/DocumentEditRuntimeContext";
import { useVexConfig } from "../config/VexConfigContext";
import { usePermission } from "../access";
import { useVexMutation } from "../hooks";
import { Button } from "../ui";
import { showsUnpublish } from "./showsUnpublish";
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

/**
 * Built-in `vex.unpublish` contribution for `edit.header.actions`. Renders nothing for a
 * non-versioned resource, for a global never yet saved, or whenever `VersionPublishAction`
 * should render instead — Publish/Unpublish share one spot (decision: developer feedback) and
 * exactly one of the two ever renders. See `VersionPublishAction`'s matching
 * `showsUnpublishInstead` condition (kept identical by hand, inverted here).
 *
 * @param props - `{ kind, slug }`.
 * @returns The Unpublish button plus its confirmation dialog, or `null`.
 * @throws Never — a rejected mutation is toasted, never re-thrown.
 */
export function VersionUnpublishAction(props: EditSlotProps) {
  const config = useVexConfig();
  const document = useVexDocument();
  const runtime = useDocumentEditRuntime();

  const [confirming, setConfirming] = useState(false);

  const resolved =
    props.kind === "collection"
      ? config.collections.find((c) => c.slug === props.slug)
      : config.globals.find((g) => g.slug === props.slug);
  const isVersioned = Boolean(resolved?.versions.drafts);

  const canUnpublish = usePermission({
    resource: props.slug,
    action: DRAFT_ACTIONS.unpublish,
    data: document.saved,
  });

  // Loaded only while the dialog is open: enough of the version timeline to say which
  // version will be promoted (the server re-derives the same answer authoritatively).
  const { data: unpublishVersions } = useQuery({
    ...convexQuery(
      vexConvexApi.versions.listVersions,
      props.kind === "collection"
        ? { collection: props.slug, id: document.id ?? "" }
        : { global: props.slug },
    ),
    enabled: confirming,
  });
  const publishedTimeline = (unpublishVersions ?? [])
    .filter((row) => row.status === "published" && row.publishedAt !== null)
    .sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
  const unpublishCurrent = publishedTimeline[0];
  const unpublishTarget = publishedTimeline[1];

  // Purges the same paths an update/delete would — the published page goes offline or
  // reverts to an earlier version's content.
  const { mutateAsync: unpublishMutation, isPending: isUnpublishing } = useVexMutation({
    collection: props.slug,
    errorToast: { message: "Unpublish failed" },
    getChanges: () =>
      document.saved === undefined
        ? []
        : unpublishTarget !== undefined
          ? [{ before: document.saved, after: document.saved }]
          : [{ before: document.saved }],
    mutationFn: vexConvexApi.versions.unpublish,
    operation: "unpublish",
  });

  /**
   * Unpublishes the currently-open published document, flipping it back to draft.
   *
   * @returns Promise resolving once unpublish settles.
   * @throws Never — a rejected mutation is caught and toasted by `useVexMutation`'s own `onError`.
   */
  async function handleUnpublish(): Promise<void> {
    try {
      await unpublishMutation(
        props.kind === "collection"
          ? { collection: props.slug, id: document.id! }
          : { global: props.slug },
      );
    } finally {
      setConfirming(false);
    }
  }

  if (!isVersioned) return null;
  if (props.kind === "global" && document.saved === undefined) return null;

  // Shared with `VersionPublishAction`'s bail-out check — see `showsUnpublish`'s doc comment.
  if (!showsUnpublish({ document, runtime })) return null;

  const disabled = !canUnpublish;

  return (
    <>
      {/* `min-w-[100px]` matches `VersionPublishAction`'s button — see that file's note. */}
      <Button
        type="button"
        variant="outline"
        className="min-w-[100px] transition-all duration-300"
        isPending={isUnpublishing}
        disabled={disabled}
        onClick={() => setConfirming(true)}
      >
        Unpublish
      </Button>
      <AlertDialog
        open={confirming}
        onOpenChange={(open) => {
          if (!open) setConfirming(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Unpublish{unpublishCurrent ? ` version ${unpublishCurrent.version}` : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {unpublishVersions === undefined
                ? "Checking which version will take its place…"
                : unpublishTarget
                  ? `The document will revert to version ${unpublishTarget.version}` +
                    (unpublishTarget.publishedAt !== null
                      ? ` (published ${new Date(unpublishTarget.publishedAt).toLocaleString()})`
                      : "") +
                    `.${unpublishCurrent ? ` Version ${unpublishCurrent.version} becomes a draft and loses its published timestamp.` : ""}`
                  : "No earlier published version exists — the document will go offline and become a draft."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={unpublishVersions === undefined || isUnpublishing}
              onClick={() => {
                void handleUnpublish();
              }}
            >
              Unpublish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
