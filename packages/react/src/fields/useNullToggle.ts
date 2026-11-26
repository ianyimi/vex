"use client";

import { useRef } from "react";
import { getBy } from "@tanstack/react-form";

/**
 * The minimal field shape {@link useNullToggle} needs. `form` is read
 * directly off the field rather than taken as a separate prop: TanStack
 * React Form's `useForm()` return value spreads the real `FormApi`
 * instance into a new object once (memoized on the instance, never
 * re-spread), so its own `.options` is frozen at mount — `<form.Field>`
 * constructs each `FieldApi` with the UNDERLYING raw `FormApi` instead,
 * whose `.options` TanStack mutates in place on every `update()`/`reset()`,
 * so `field.form.options.defaultValues` is always current.
 */
export interface NullToggleFieldApi<TValue> {
  name: string;
  state: { value: TValue | null | undefined };
  handleChange: (value: TValue | null) => void;
  form: { options: { defaultValues?: unknown } };
}

/** Props for {@link useNullToggle}. */
export interface UseNullToggleProps<TValue> {
  /** The field's own TanStack field API. */
  field: NullToggleFieldApi<TValue>;
  /** The field definition's `nullable` flag. `false` makes this a no-op. */
  nullable: boolean;
  /** Lazily computes the field's empty/default value — tier 3, only called when there is nothing to restore from. */
  emptyValue: () => TValue;
  /**
   * Runs with the resolved restore value right before it is written —
   * for a field (`variant`) that must also update local state derived
   * from the restored value.
   */
  onRestore?: (value: TValue) => void;
}

/** Result of {@link useNullToggle}. */
export interface UseNullToggleResult {
  isNull: boolean;
  onIsNullChange: ((isNull: boolean) => void) | undefined;
}

/**
 * Shared null-toggle restore logic for every nullable container field
 * (group/array/blocks/keyValue/variant) and for checkbox/richtext, which
 * use the same restore rule though they are not collapsible.
 *
 * Checking the toggle remembers the field's current value and writes
 * `null`. Unchecking restores, in order:
 * 1. the value remembered just before this check, in THIS editing session
 *    (including unsaved edits);
 * 2. if there is none (e.g. the page loaded with the field already
 *    `null`), the currently viewed version's stored value —
 *    `field.form.options.defaultValues` at this field's own path, which a
 *    version switch or a post-save `form.reset()` repoints at the newly
 *    viewed document;
 * 3. if that is also `null`/`undefined`, `emptyValue()`.
 *
 * The remembered "before" value is cleared whenever the stored value at
 * this field's path changes identity — a version switch and a post-save
 * reset both go through `form.reset()`, so both clear it the same way, and
 * a stale value from another version never resurfaces.
 *
 * @param props - See {@link UseNullToggleProps}.
 * @returns `isNull`/`onIsNullChange`, ready to forward to the field's own
 *   form component. `onIsNullChange` is `undefined` when `nullable` is `false`.
 */
export function useNullToggle<TValue>(props: UseNullToggleProps<TValue>): UseNullToggleResult {
  const beforeNullRef = useRef<TValue | undefined>(undefined);
  const storedValue: TValue | null | undefined = getBy(
    props.field.form.options.defaultValues,
    props.field.name,
  );
  const lastStoredValueRef = useRef(storedValue);
  if (!Object.is(lastStoredValueRef.current, storedValue)) {
    lastStoredValueRef.current = storedValue;
    beforeNullRef.current = undefined;
  }

  if (!props.nullable) return { isNull: false, onIsNullChange: undefined };

  const isNull = props.field.state.value === null;

  function onIsNullChange(nextIsNull: boolean): void {
    if (nextIsNull) {
      if (props.field.state.value !== null && props.field.state.value !== undefined) {
        beforeNullRef.current = props.field.state.value;
      }
      props.field.handleChange(null);
      return;
    }
    const restored =
      beforeNullRef.current ??
      (storedValue !== null && storedValue !== undefined ? storedValue : props.emptyValue());
    beforeNullRef.current = undefined;
    props.onRestore?.(restored);
    props.field.handleChange(restored);
  }

  return { isNull, onIsNullChange };
}
