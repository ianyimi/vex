"use client";

import type { ReactNode } from "react";
import {
  resolveComponentContributions,
  type ComponentContributionInput,
  type SlotAccessContext,
  type SlotId,
} from "@vexcms/core";
import type { ReactHKT } from "../../adapter";
import { ComponentErrorBoundary } from "./ComponentErrorBoundary";
import { useVexPermissions } from "../../hooks/useVexPermissions";
import { useSlotConditionData, type SlotConditionData } from "./formData";

/**
 * Renders an additive slot's resolved contribution list (S8/S10/S11) — `field.beforeInput`/
 * `afterInput`, `blocks.item.actions`, `blocks.header.actions`, `array.item.actions`.
 *
 * `builtins` and `contributions` are kept as two separate props (rather than one pre-merged
 * array) because built-in components close over per-render handlers (`onDuplicate`, `onRemove`,
 * …) that only exist at the call site — they cannot be constructed at `defineConfig()` time the
 * way a project's own `admin.components` list already is (step 7's `resolveComponentContributions`
 * already ordered that part). `SlotOutlet` merges the two arrays itself, THEN re-resolves order —
 * a project's `before`/`after` targeting a built-in id still works, because the built-in's real id
 * is present in the merged array before resolution runs.
 *
 * @param props.slotId - The slot being rendered — used for error messages and the error boundary id.
 * @param props.builtins - This call site's built-in contributions (already-ordered is fine; final order is re-resolved here).
 * @param props.contributions - The project/plugin-authored contributions for this slot (from `admin.components` at whichever level the call site owns).
 * @param props.contributedProps - Props passed to every contribution's component.
 * @param props.conditionName - The form path `condition` gating resolves `data`/`siblingData` from
 *   (`useSlotConditionData`) — a field's own name for `field.beforeInput`/`afterInput`, or one
 *   block/array item's own path for `blocks.item.actions`/`array.item.actions`. Every current G
 *   call site passes one. Omitted only for a slot genuinely outside any form (none exist in G
 *   today) — `condition` is then never evaluated and a `condition`-bearing contribution always
 *   mounts, rather than being gated against fabricated data.
 * @returns The resolved, order-merged contribution list, each wrapped in a `ComponentErrorBoundary`.
 */
export function SlotOutlet<TProps extends {}>(props: {
  slotId: SlotId;
  builtins: ComponentContributionInput<ReactHKT, TProps>[];
  contributions: ComponentContributionInput<ReactHKT, TProps>[] | undefined;
  contributedProps: TProps;
  conditionName?: string;
}): ReactNode {
  const { hasPermission } = useVexPermissions();
  const ctx: SlotAccessContext = { hasPermission };
  const conditionData = useSlotConditionData(props.conditionName);

  const resolved = resolveComponentContributions<ReactHKT, TProps>({
    slotId: props.slotId,
    contributions: [...props.builtins, ...(props.contributions ?? [])],
  });

  return (
    <>
      {resolved.map((contribution) => {
        if (contribution.access && !contribution.access(ctx)) return null;
        // `conditionData` is `undefined` with no enclosing <AppForm> (no current G call site) —
        // a `condition`-bearing contribution always mounts rather than being gated against
        // fabricated data; see this function's own JSDoc and `useSlotConditionData`'s.
        // `contribution.condition` is nominally typed against a specific document union
        // (`FieldConditionProps`'s `TCollectionSlug`), but this function operates on live
        // runtime `data`/`siblingData` (`SlotConditionData`, plain `Record<string, unknown>`) —
        // the same escape hatch core's own `isFieldConditionMet` uses for `field.admin.condition`.
        const condition = contribution.condition as unknown as
          | ((data: SlotConditionData) => boolean)
          | undefined;
        if (condition && conditionData && !condition(conditionData)) return null;
        const Contribution = contribution.component;
        return (
          <ComponentErrorBoundary key={contribution.id} id={contribution.id}>
            <Contribution {...props.contributedProps} />
          </ComponentErrorBoundary>
        );
      })}
    </>
  );
}
