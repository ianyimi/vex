"use client";

import { useStore } from "@tanstack/react-form";
import { getBy } from "@tanstack/react-form";
import { useVexForm } from "../forms/useVexForm";

/**
 * Resolves the value at `name`'s PARENT path — `layout[2].title` resolves siblings from
 * `layout[2]`, `seo.title` from `seo`, and a top-level name (no `.`) from the whole `data` object.
 * Matches `FieldConditionProps`'s `siblingData` convention (Step 6).
 *
 * A `name` ending in `]` (one block/array item's own path, e.g. `content[2]`, with no trailing
 * `.field` segment) is not a field leaf with a parent to strip to — it already names the
 * container whose own fields `blocks.item.actions`/`array.item.actions` gate against (Step 8's
 * `useSlotConditionData` JSDoc), so it resolves directly instead of one level up.
 *
 * @returns The sibling data object at `name`'s resolved parent path.
 */
export function resolveSiblingData(props: {
  data: Record<string, unknown>;
  name: string;
}): Record<string, unknown> {
  if (props.name.endsWith("]")) {
    return getBy(props.data, props.name) as Record<string, unknown>;
  }
  const lastDotIndex = props.name.lastIndexOf(".");
  const parentPath =
    lastDotIndex === -1 ? undefined : props.name.slice(0, lastDotIndex);
  return (
    parentPath === undefined ? props.data : getBy(props.data, parentPath)
  ) as Record<string, unknown>;
}

/** `{ data, siblingData }` for a slot contribution's `condition` gate (S11). */
export interface SlotConditionData {
  data: Record<string, unknown>;
  siblingData: Record<string, unknown>;
}

/**
 * Live `condition`-gating data for `SlotOutlet`, resolved from the enclosing `<AppForm>` —
 * `undefined` outside one. Every G slot is form-scoped (`field.*`, `blocks.*`, `array.*` all
 * render inside a document's edit form), so `SlotOutlet` treats `undefined` as "skip `condition`
 * evaluation entirely" (documented at its own call site) rather than fabricating `{}` data, which
 * would make a predicate that actually reads `data`/`siblingData` answer wrong instead of simply
 * not gating.
 *
 * @param name - The form path whose PARENT path supplies `siblingData` — a field's own name for
 *   `field.beforeInput`/`afterInput`, or one block/array item's own path (e.g. `content[2]`) for
 *   `blocks.item.actions`/`array.item.actions`. `undefined` resolves `siblingData` to the whole
 *   form's values.
 * @returns The condition-gating `{ data, siblingData }` pair, or `undefined` when there is no
 *   enclosing `<AppForm>`.
 */
export function useSlotConditionData(
  name: string | undefined,
): SlotConditionData | undefined {
  const form = useVexForm();
  const values = form
    ? useStore(form.store, (state) => state.values as Record<string, unknown>)
    : undefined;
  if (!form || !values) return undefined;
  return {
    data: values,
    siblingData:
      name === undefined ? values : resolveSiblingData({ data: values, name }),
  };
}
