"use client";

import { VERSION_STATUSES, type VexVersionStatus } from "@vexcms/core";
import { Badge } from "../ui/badge";

/** Props for {@link StatusBadge}. */
export interface StatusBadgeProps {
  /** The document's current publish state — its `vex_status` field. */
  status: VexVersionStatus;
}

/**
 * Small pill indicating whether a versioned document (or global) is
 * currently a draft or published — used in the edit-view draft toolbar
 * (`CollectionEditView`, `GlobalEditView`), `VersionHistoryDropdown`'s
 * per-version rows, and the collapsed list-view row Step 16 introduces.
 *
 * A collection/global with `versions.drafts: false` never has a `vex_status`
 * field at all — every caller only renders this component when
 * `collection.versions.drafts` (or the equivalent global check) is `true`,
 * so it never has to handle a third/`undefined` state itself.
 *
 * @param props - See {@link StatusBadgeProps}.
 * @returns A `Badge` reading "Draft" (outline — muted, work in progress) or
 *   "Published" (default — the emphasized state, since this is what public
 *   readers see).
 * @throws Never.
 *
 * @example
 * ```tsx
 * <StatusBadge status={isDraftDoc ? "draft" : "published"} />
 * ```
 */
export function StatusBadge(props: StatusBadgeProps) {
  const variant = props.status === VERSION_STATUSES.draft.key ? "outline" : "default";
  const label =
    props.status === VERSION_STATUSES.draft.key
      ? VERSION_STATUSES.draft.labels.singular
      : VERSION_STATUSES.published.labels.singular;
  return <Badge variant={variant}>{label}</Badge>;
}
