import {
  VexComponentConfigError,
  type ComponentContributionInput,
  type ComponentHKT,
  type ComponentOverrideInput,
  type EditSlotConfigInput,
  type EditSlotProps,
  type ResolvedComponentContribution,
  type ResolvedComponentOverride,
  type SlotId,
} from "./types";

export { VexComponentConfigError };

function toIdArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * Orders one slot's additive contribution list — hide directives applied, duplicate real ids
 * rejected, `order`/`before`/`after` resolved into a final sequence.
 *
 * Processing order: (1) partition hide directives from real contributions; (2) drop every real
 * contribution whose id a hide directive names (S4's "replace = hide + add" rule — a hide
 * directive matching nothing is a harmless no-op, not an error, since a project may hide a
 * built-in that a future core version removes outright); (3) among the SURVIVING real
 * contributions, a repeated id IS an error (two genuine contributions fighting for one id, S9);
 * (4) stable-sort by `order` (default `0`), tie-broken by original array position; (5) apply
 * `before`/`after` as a secondary topological pass over that stable order — a constraint
 * naming an id that was hidden or never existed is ignored (the constraint is about relative
 * position among what's actually rendered).
 *
 * @throws {VexComponentConfigError} When two real (non-hidden) contributions in `props.contributions`
 *   share one id.
 * @returns The final ordered list of resolved contributions.
 */
export function resolveComponentContributions<
  TComponent extends ComponentHKT,
  TProps,
>(props: {
  slotId: SlotId;
  contributions: ComponentContributionInput<TComponent, TProps>[];
}): ResolvedComponentContribution<TComponent, TProps>[] {
  const { slotId, contributions } = props;

  const hiddenIds = new Set<string>();
  const real: {
    entry: ResolvedComponentContribution<TComponent, TProps>;
    index: number;
  }[] = [];
  contributions.forEach((entry, index) => {
    if (entry.hidden === true && entry.component === undefined) {
      hiddenIds.add(entry.id);
      return;
    }
    if (entry.hidden === true) return; // a real contribution marked hidden: drop it, not an error
    real.push({
      entry: entry as ResolvedComponentContribution<TComponent, TProps>,
      index,
    });
  });

  const surviving = real.filter(({ entry }) => !hiddenIds.has(entry.id));

  const seen = new Map<string, number>();
  for (const { entry, index } of surviving) {
    const priorIndex = seen.get(entry.id);
    if (priorIndex !== undefined) {
      throw new VexComponentConfigError(
        `Slot "${slotId}": duplicate contribution id "${entry.id}" (entries at positions ${priorIndex} and ${index}). ` +
          `Replacing a built-in requires { id: "${entry.id}", hidden: true } plus a NEW contribution under a different id, ` +
          `or wrapping it via an override chain instead of a duplicate additive entry.`,
      );
    }
    seen.set(entry.id, index);
  }

  const stable = [...surviving].sort((a, b) => {
    const orderA = a.entry.order ?? 0;
    const orderB = b.entry.order ?? 0;
    if (orderA !== orderB) return orderA - orderB;
    return a.index - b.index;
  });

  const ids = stable.map(({ entry }) => entry.id);
  const idToPos = new Map(ids.map((id, i) => [id, i]));
  const result = [...stable];

  // Secondary topological pass: repeatedly move any entry that violates a before/after
  // constraint relative to its current neighbor, bounded by result.length passes so a cyclic
  // constraint set (e.g. A before B, B before A) terminates instead of looping forever — it
  // simply stops improving once no swap helps, leaving the stable order for the unsatisfiable pair.
  for (let pass = 0; pass < result.length; pass++) {
    let swapped = false;
    for (let i = 0; i < result.length; i++) {
      const entry = result[i]!.entry;
      const beforeIds = toIdArray(entry.before).filter((id) => idToPos.has(id));
      const afterIds = toIdArray(entry.after).filter((id) => idToPos.has(id));
      for (const targetId of beforeIds) {
        const j = result.findIndex((r) => r.entry.id === targetId);
        if (j !== -1 && j < i) {
          [result[i], result[j]] = [result[j]!, result[i]!];
          swapped = true;
        }
      }
      for (const targetId of afterIds) {
        const j = result.findIndex((r) => r.entry.id === targetId);
        if (j !== -1 && j > i) {
          [result[i], result[j]] = [result[j]!, result[i]!];
          swapped = true;
        }
      }
    }
    if (!swapped) break;
  }

  return result.map(({ entry }) => entry);
}

/**
 * Orders one override chain (`field.input`, `field.cell`, `field.label`, `field.description`, a
 * root per-type `fields.<type>.{Input,Cell}` list) — array order only, no `before`/`after` (S8).
 *
 * @throws {VexComponentConfigError} When two overrides in `props.overrides` share one id.
 * @returns The final ordered list of resolved overrides.
 */
export function resolveComponentOverrides<
  TComponent extends ComponentHKT,
  TProps,
>(props: {
  slotId: SlotId;
  overrides: ComponentOverrideInput<TComponent, TProps>[];
}): ResolvedComponentOverride<TComponent, TProps>[] {
  const { slotId, overrides } = props;
  const seen = new Map<string, number>();
  overrides.forEach((entry, index) => {
    const priorIndex = seen.get(entry.id);
    if (priorIndex !== undefined) {
      throw new VexComponentConfigError(
        `Slot "${slotId}": duplicate override id "${entry.id}" (entries at positions ${priorIndex} and ${index}).`,
      );
    }
    seen.set(entry.id, index);
  });
  return [...overrides];
}

/**
 * Resolves ONE flat `edit.*` slot id by merging built-ins, then the root-level config, then the
 * collection/global-level config (decision 14 — G's existing root→resource merge model, reused
 * for H's slots). Built-ins seed the additive list first so a project can hide one with
 * `{ id: "vex.save", hidden: true }` at either level, and `order`/`before`/`after` reorder
 * freely from there — only array position (among same-`order` entries) reflects the
 * builtins-then-root-then-resource merge order.
 *
 * Override chains merge per built-in id: root's chain composes first (outermost, decision 15),
 * the resource's chain's entries follow. Every resolved override key must name the id of a
 * contribution that survived into the resolved `contributions` list — the renderer cannot wrap
 * a built-in a hide directive already removed, or a plugin id that was never contributed here.
 *
 * @throws {VexComponentConfigError} From `resolveComponentContributions` on a genuine duplicate
 *   contribution id; from `resolveComponentOverrides` on a duplicate override id within one
 *   built-in's merged chain; or when an override key names an id absent from the resolved
 *   `contributions` list (decision 16).
 * @returns The slot's final ordered contributions, and its overrides keyed by built-in id.
 */
export function resolveEditSlot<TComponent extends ComponentHKT>(props: {
  slotId: SlotId;
  root?: EditSlotConfigInput<TComponent>;
  resource?: EditSlotConfigInput<TComponent>;
  builtins: ComponentContributionInput<TComponent, EditSlotProps>[];
}): {
  contributions: ResolvedComponentContribution<TComponent, EditSlotProps>[];
  overrides: Record<string, ResolvedComponentOverride<TComponent, EditSlotProps>[]>;
} {
  const { slotId, root, resource, builtins } = props;

  const mergedContributions = [
    ...builtins,
    ...(root?.contributions ?? []),
    ...(resource?.contributions ?? []),
  ];
  const contributions = resolveComponentContributions<TComponent, EditSlotProps>({
    slotId,
    contributions: mergedContributions,
  });
  const contributionIds = new Set(contributions.map((c) => c.id));

  const mergedOverrideKeys = new Set([
    ...Object.keys(root?.overrides ?? {}),
    ...Object.keys(resource?.overrides ?? {}),
  ]);

  const overrides: Record<string, ResolvedComponentOverride<TComponent, EditSlotProps>[]> = {};
  for (const key of mergedOverrideKeys) {
    const chain = [
      ...(root?.overrides?.[key] ?? []),
      ...(resource?.overrides?.[key] ?? []),
    ];
    const resolvedChain = resolveComponentOverrides<TComponent, EditSlotProps>({
      slotId,
      overrides: chain,
    });
    if (!contributionIds.has(key)) {
      throw new VexComponentConfigError(
        `Slot "${slotId}": override targets unknown contribution id "${key}" — it was hidden or never contributed.`,
      );
    }
    overrides[key] = resolvedChain;
  }

  return { contributions, overrides };
}
