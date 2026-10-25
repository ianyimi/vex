import {
  VexComponentConfigError,
  type ComponentContributionInput,
  type ComponentHKT,
  type ComponentOverrideInput,
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
