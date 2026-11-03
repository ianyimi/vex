import type { ComponentContributionInput, EditSlotProps } from "@vexcms/core";
import { BUILTIN_CONTRIBUTION_IDS } from "@vexcms/core";
import type { ReactHKT } from "../adapter";
import { DocumentSaveAction } from "./DocumentSaveAction";
import { DocumentCancelAction } from "./DocumentCancelAction";
import { VersionPublishAction, VersionUnpublishAction } from "../versions";
import { LivePreviewToggleAction } from "../livePreview";

/**
 * `edit.header.actions`' shared built-in contributions (decision 13) — every entry is
 * self-contained, reading `useVexDocument`/`useVexForm`/`useDocumentEditRuntime`/`useVexConfig`
 * itself, since `DocumentEditSlotOutlet` merges `documentEditBuiltinContributions()` with project
 * contributions before resolving `order`/`before`/`after`/`hidden`/`overrides` (S8/S9), and a
 * built-in that closed over per-render parent state could not be constructed here.
 *
 * Returns only the built-ins every edit view shares, in header order: live preview, save,
 * publish, unpublish, cancel. `vex.delete` is collection-only and appended directly by
 * `CollectionEditView.tsx` to the builtins it passes into its `edit.header.actions` outlet —
 * `documents/` must not import from `collections/`, so this function never references it.
 * `vex.duplicate` (Step 6) and `vex.versionHistory` (developer feedback, Step 4
 * post-implementation note) both moved out of `edit.header.actions` entirely — they live in
 * `DocumentEditActionsMenu`'s ⋯ menu instead (`vex.versionHistory` as `VersionHistoryMenuItem`,
 * right after Preview).
 *
 * @returns The ordered shared built-in contribution list for `edit.header.actions`.
 */
export function documentEditBuiltinContributions(): ComponentContributionInput<
  ReactHKT,
  EditSlotProps
>[] {
  return [
    { id: BUILTIN_CONTRIBUTION_IDS.edit.livePreview, component: LivePreviewToggleAction },
    { id: BUILTIN_CONTRIBUTION_IDS.edit.save, component: DocumentSaveAction },
    { id: BUILTIN_CONTRIBUTION_IDS.edit.publish, component: VersionPublishAction },
    { id: BUILTIN_CONTRIBUTION_IDS.edit.unpublish, component: VersionUnpublishAction },
    { id: BUILTIN_CONTRIBUTION_IDS.edit.cancel, component: DocumentCancelAction },
  ];
}
