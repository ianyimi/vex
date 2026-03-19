"use client";

import { useSyncExternalStore, useCallback, useRef } from "react";
import { useVexFormContext } from "../components/form/VexFormProvider";

/**
 * Hook for watching specific field values with a selector function.
 * Only re-renders when the selected values change (shallow comparison).
 *
 * Use this when a custom component needs to react to changes in OTHER fields
 * (not its own field — use useVexField for that).
 *
 * @param props.selector - Function that receives all form values and returns the subset you need
 *
 * @example
 * ```tsx
 * function SEOPreview() {
 *   const { title, slug } = useVexFormFields({
 *     selector: (values) => ({
 *       title: values.title as string,
 *       slug: values.slug as string,
 *     }),
 *   });
 *   return <div>{title} — /{slug}</div>;
 * }
 * ```
 */
export function useVexFormFields<TResult>(props: {
  selector: (values: Record<string, unknown>) => TResult;
}): TResult {
  const { form } = useVexFormContext();
  const cachedRef = useRef<TResult | undefined>(undefined);

  const subscribe = useCallback(
    (callback: () => void) => form.store.subscribe(callback),
    [form],
  );

  const getSnapshot = useCallback(() => {
    const values = form.state.values as Record<string, unknown>;
    const next = props.selector(values);

    // Shallow comparison to avoid unnecessary re-renders
    if (cachedRef.current !== undefined && shallowEqual(cachedRef.current, next)) {
      return cachedRef.current;
    }

    cachedRef.current = next;
    return next;
  }, [form, props.selector]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Shallow equality check for selector results.
 * If both values are objects, compares top-level keys.
 * Otherwise uses strict equality.
 */
function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || typeof b !== "object") return false;
  if (a === null || b === null) return false;

  const keysA = Object.keys(a as Record<string, unknown>);
  const keysB = Object.keys(b as Record<string, unknown>);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (
      !Object.prototype.hasOwnProperty.call(b, key) ||
      !Object.is(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key],
      )
    ) {
      return false;
    }
  }

  return true;
}
