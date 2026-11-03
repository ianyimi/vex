"use client";

import { toast } from "sonner";
import {
  CRUD_ACTIONS,
  PERMISSION_SCOPES,
  type CollectionSlug,
  type EditSlotProps,
  type VexDocument,
} from "@vexcms/core";
import { usePermission } from "../access";
import { useVexDocument } from "../documents/VexDocumentContext";
import { EditActionsMenuItem } from "../documents/EditActionsMenuItem";
import { getVexErrorMessage } from "../utils/errors";
import { Icon } from "../ui";
import { useVexRevalidate } from "./useVexRevalidate";

/**
 * Built-in `vex.revalidate` contribution for `edit.actionsMenu` (decision: Step 4
 * post-implementation note moved the former standalone `RevalidateButton` usage here).
 * Collection documents only — gated by `access: (ctx) => ctx.resource?.kind === "collection"`
 * on the builtin contribution entry (`CollectionEditView.tsx`), so a global never lists this
 * item at all rather than mounting it and rendering `null` (a `null`-rendering item still counts
 * as present for `DocumentEditActionsMenu`'s "resolved list is empty → no ⋯ trigger" check — see
 * that file's doc comment).
 *
 * Reproduces `RevalidateButton.tsx`'s single-document purge — same permission gate and pending
 * state — but reports a failure differently: `RevalidateButton` renders its own inline error
 * paragraph because it stays mounted; this item unmounts the instant the dropdown closes
 * (base-ui tears down `DropdownMenuContent` and every item in it on select), so a failed purge
 * surfaces as a toast instead, the one UI surface that survives the unmount.
 *
 * @param props - `EditSlotProps` — `{ kind: "collection", slug }` (guaranteed by `access`).
 * @returns The Revalidate menu item.
 * @throws Never — a rejected purge is toasted, never re-thrown.
 */
export function RevalidateMenuItem(props: EditSlotProps) {
  const { saved } = useVexDocument();
  const canRevalidate = usePermission({
    action: CRUD_ACTIONS.update,
    resource: props.slug,
    scope: PERMISSION_SCOPES.any,
  });
  const { isPending, purgeDocument } = useVexRevalidate();

  async function handleRevalidate(): Promise<void> {
    if (!saved || props.kind !== "collection") return;
    try {
      await purgeDocument({ collection: props.slug as CollectionSlug, doc: saved as VexDocument });
    } catch (error) {
      toast.error(getVexErrorMessage(error));
    }
  }

  return (
    <EditActionsMenuItem
      disabled={!saved || !canRevalidate || isPending}
      icon={<Icon name="RefreshCw" />}
      onSelect={() => {
        void handleRevalidate();
      }}
    >
      Revalidate
    </EditActionsMenuItem>
  );
}
