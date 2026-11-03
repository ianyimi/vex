"use client";

import { useRef, type ComponentType, type ReactNode } from "react";
import {
  resolveEditSlot,
  type ComponentContributionInput,
  type EditSlotConfigInput,
  type EditSlotProps,
  type ResolvedComponentContribution,
  type ResolvedComponentOverride,
  type SlotAccessContext,
  type SlotId,
} from "@vexcms/core";
import type { ReactHKT } from "../adapter";
import { ComponentErrorBoundary } from "../slots/ComponentErrorBoundary";
import { useVexPermissions } from "../access/useVexPermissions";

/**
 * Resolves one flat `edit.*` slot id (merge + order + override composition, S11/S12) and filters
 * out contributions whose `access` predicate fails for the current user. Shared by
 * {@link DocumentEditSlotOutlet} and `DocumentEditActionsMenu` — the menu needs the resolved,
 * access-filtered list BEFORE rendering (to decide whether its ⋯ trigger mounts at all when the
 * list would otherwise be empty), which a outlet that renders straight to JSX cannot answer.
 *
 * @param props.slotId - One of `SLOT_IDS.edit.*`.
 * @param props.root - The root-level `admin.components.edit` config for this slot.
 * @param props.resource - The collection/global-level config for this slot.
 * @param props.builtins - This slot's built-in contributions (`[]` for slots with none).
 * @param props.contributedProps - `EditSlotProps` for this render — forwarded onto
 *   `SlotAccessContext.resource` so an `access` predicate can gate on resource kind, not just
 *   permission (`CopyDocumentIdMenuItem`'s "collections only" being the motivating case).
 * @returns The resolved, access-filtered contribution list, and its overrides keyed by id.
 */
export function useResolvedEditSlot(props: {
  slotId: SlotId;
  root: EditSlotConfigInput<ReactHKT> | undefined;
  resource: EditSlotConfigInput<ReactHKT> | undefined;
  builtins: ComponentContributionInput<ReactHKT, EditSlotProps>[];
  contributedProps: EditSlotProps;
}): {
  contributions: ResolvedComponentContribution<ReactHKT, EditSlotProps>[];
  overrides: Record<string, ResolvedComponentOverride<ReactHKT, EditSlotProps>[]>;
} {
  const { hasPermission } = useVexPermissions();
  const ctx: SlotAccessContext = { hasPermission, resource: props.contributedProps };

  const { contributions, overrides } = resolveEditSlot<ReactHKT>({
    slotId: props.slotId,
    root: props.root,
    resource: props.resource,
    builtins: props.builtins,
  });

  return {
    contributions: contributions.filter((c) => !c.access || c.access(ctx)),
    overrides,
  };
}

/**
 * Renders one resolved `edit.*` slot (S11/S12): `root` then `resource`-level contributions,
 * ordered, with `builtins` merged in before resolution (same two-array split as `SlotOutlet`,
 * for the same reason — `documentEditBuiltinContributions` closes over nothing per-render, but keeping
 * the split matches every other slot renderer and lets a project's `before`/`after` target a
 * built-in id). Contributions whose id has a `header.overrides` entry are additionally composed
 * through that override chain (S3), each layer in its own `ComponentErrorBoundary` keyed by the
 * override's own id (decision 17) — a throwing wrapper falls back to the stage beneath it
 * (ultimately the built-in or project contribution itself) plus an inline error naming the
 * wrapper, rather than losing the whole action.
 *
 * @param props.slotId - One of `SLOT_IDS.edit.*`.
 * @param props.root - The root-level `admin.components.edit` config for this slot.
 * @param props.resource - The collection/global-level config for this slot.
 * @param props.builtins - This slot's built-in contributions (`edit.header.actions` only; `[]` elsewhere).
 * @param props.contributedProps - `EditSlotProps` passed to every contribution.
 * @returns The resolved, override-composed contribution list, each wrapped in a `ComponentErrorBoundary`.
 */
export function DocumentEditSlotOutlet<TProps extends EditSlotProps = EditSlotProps>(props: {
  slotId: SlotId;
  root: EditSlotConfigInput<ReactHKT> | undefined;
  resource: EditSlotConfigInput<ReactHKT> | undefined;
  builtins: ComponentContributionInput<ReactHKT, EditSlotProps>[];
  contributedProps: TProps;
}): ReactNode {
  const { contributions, overrides } = useResolvedEditSlot(props);

  return (
    <>
      {contributions.map((contribution) => (
        <EditSlotContribution<TProps>
          key={contribution.id}
          contribution={contribution}
          chain={overrides[contribution.id] ?? []}
          contributedProps={props.contributedProps}
        />
      ))}
    </>
  );
}

/**
 * Renders one contribution through its override chain. The composed component is rebuilt only
 * when the contribution or a chain layer changes (id or component identity) — `resolveEditSlot`
 * returns fresh objects every render, and a fresh component type per render would remount the
 * built-in and drop its local state (an open confirm/fallback dialog, a pending mutation).
 * Exported so `DocumentEditActionsMenu` can render a resolved `edit.actionsMenu` contribution
 * list with the same composition/error-boundary behavior as every other `edit.*` slot.
 *
 * @param props - Input props.
 * @param props.contribution - The resolved contribution to render.
 * @param props.chain - Its resolved override chain, outermost last.
 * @param props.contributedProps - Props forwarded to the composed component.
 * @returns The composed, error-bounded contribution element.
 */
export function EditSlotContribution<TProps extends EditSlotProps>(props: {
  contribution: ResolvedComponentContribution<ReactHKT, EditSlotProps>;
  chain: ResolvedComponentOverride<ReactHKT, EditSlotProps>[];
  contributedProps: TProps;
}): ReactNode {
  const identity: unknown[] = [
    props.contribution.id,
    props.contribution.component,
    ...props.chain.flatMap((override) => [override.id, override.component]),
  ];
  const composed = useRef<{ identity: unknown[]; Component: ComponentType<TProps> } | null>(null);
  if (
    !composed.current ||
    composed.current.identity.length !== identity.length ||
    composed.current.identity.some((part, index) => part !== identity[index])
  ) {
    composed.current = {
      identity,
      Component: composeEditSlotChain<TProps>(props.contribution, props.chain),
    };
  }
  const Composed = composed.current.Component;
  return <Composed {...props.contributedProps} />;
}

/**
 * Builds the error-bounded component for one contribution plus its override chain (S3): each
 * layer sits in its own `ComponentErrorBoundary` keyed by the override's id (decision 21), so a
 * throwing wrapper falls back to the stage beneath it plus an inline error naming the wrapper.
 *
 * @param contribution - The resolved contribution at the base of the chain.
 * @param chain - The override layers wrapping it, applied in order.
 * @returns The composed component type.
 */
function composeEditSlotChain<TProps extends EditSlotProps>(
  contribution: ResolvedComponentContribution<ReactHKT, EditSlotProps>,
  chain: ResolvedComponentOverride<ReactHKT, EditSlotProps>[],
): ComponentType<TProps> {
  const Contribution = contribution.component as ComponentType<TProps>;
  function Base(p: TProps) {
    return (
      <ComponentErrorBoundary id={contribution.id}>
        <Contribution {...p} />
      </ComponentErrorBoundary>
    );
  }
  Base.displayName = `EditSlotContribution(${contribution.id})`;
  return chain.reduce<ComponentType<TProps>>((RenderDefault, override) => {
    const Override = override.component as unknown as ComponentType<
      TProps & { renderDefault: ComponentType<TProps> }
    >;
    function ComposedOverride(p: TProps) {
      return (
        <ComponentErrorBoundary id={override.id} fallback={<RenderDefault {...p} />}>
          <Override {...p} renderDefault={RenderDefault} />
        </ComponentErrorBoundary>
      );
    }
    ComposedOverride.displayName = `EditSlotOverride(${override.id})`;
    return ComposedOverride;
  }, Base);
}
