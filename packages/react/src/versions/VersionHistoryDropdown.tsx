"use client";

import { DRAFT_ACTIONS } from "@vexcms/core";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { usePermission } from "../access";
import {
  useVersionHistoryState,
  VersionHistoryPanel,
  type VersionHistoryPanelProps,
} from "./VersionHistoryPanel";

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
 * Calls {@link useVersionHistoryState} itself — this component is the persistent owner of a
 * pending delete/discard confirmation, NOT the lazily-mounted `DropdownMenuContent` it renders
 * `VersionHistoryPanel` inside of: `DropdownMenuContent`'s children remount every time the
 * dropdown reopens, which would silently drop a pending confirmation if the stateful hook lived
 * there instead. The presentational `VersionHistoryPanel` below is free to remount on every open.
 *
 * Renders nothing at all without `readDrafts` — there is no permission-denied
 * state to show, since the trigger button itself would have nothing to open.
 *
 * @param props - See {@link VersionHistoryPanelProps}.
 * @returns The history dropdown trigger + menu, or `null` without `readDrafts`.
 * @throws Never — view/delete failures are caught and toasted by {@link useVersionHistoryState}.
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
 *
 * // or, for a global:
 * <VersionHistoryDropdown target={{ global: "announcement" }} {...sameProps} />
 * ```
 */
export function VersionHistoryDropdown(props: VersionHistoryPanelProps) {
  const resource = "collection" in props.target ? props.target.collection : props.target.global;
  const canReadDrafts = usePermission({ resource, action: DRAFT_ACTIONS.readDrafts });
  const state = useVersionHistoryState({ ...props, enabled: canReadDrafts });

  if (!canReadDrafts) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button type="button" variant="outline" icon="History">
            History
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-80">
        <VersionHistoryPanel state={state} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
