"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";
import { useVexFormContext } from "../components/form/VexFormProvider";

/**
 * Return type for the useVexForm hook.
 */
export interface UseVexFormReturn {
  /** Submit the form. Returns a promise that resolves when submission completes. */
  submit: () => void;
  /** Reset the form to its default values, or to provided values. */
  reset: (values?: Record<string, unknown>) => void;
  /** Get all current form values. */
  getValues: () => Record<string, unknown>;
  /** Get a single field's current value. */
  getValue: <T = unknown>(name: string) => T;
  /** Whether the form is currently submitting. */
  isSubmitting: boolean;
  /** Whether any field value differs from its default value. */
  isDirty: boolean;
  /** Whether form validation passes. */
  isValid: boolean;
}

interface FormSnapshot {
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
}

/**
 * Hook for accessing form-level state and actions.
 * Must be used within a VexFormProvider (or inside AppForm).
 *
 * @example
 * ```tsx
 * function SaveButton() {
 *   const { submit, isSubmitting, isDirty } = useVexForm();
 *   return (
 *     <button onClick={submit} disabled={isSubmitting || !isDirty}>
 *       {isSubmitting ? "Saving..." : "Save"}
 *     </button>
 *   );
 * }
 * ```
 */
export function useVexForm(): UseVexFormReturn {
  const { form } = useVexFormContext();
  const cachedRef = useRef<FormSnapshot | null>(null);

  const subscribe = useCallback(
    (callback: () => void) => form.store.subscribe(callback),
    [form],
  );

  const getSnapshot = useCallback((): FormSnapshot => {
    const isSubmitting = form.state.isSubmitting;
    const isDirty = form.state.isDirty;
    const isValid = form.state.isValid;

    const prev = cachedRef.current;
    if (
      prev &&
      prev.isSubmitting === isSubmitting &&
      prev.isDirty === isDirty &&
      prev.isValid === isValid
    ) {
      return prev;
    }

    const next: FormSnapshot = { isSubmitting, isDirty, isValid };
    cachedRef.current = next;
    return next;
  }, [form]);

  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const submit = useCallback(() => {
    form.handleSubmit();
  }, [form]);

  const reset = useCallback(
    (values?: Record<string, unknown>) => {
      form.reset(values as any);
    },
    [form],
  );

  const getValues = useCallback(
    () => form.state.values as Record<string, unknown>,
    [form],
  );

  const getValue = useCallback(
    <T = unknown>(name: string) => form.state.values[name] as T,
    [form],
  );

  return {
    submit,
    reset,
    getValues,
    getValue,
    isSubmitting: snapshot.isSubmitting,
    isDirty: snapshot.isDirty,
    isValid: snapshot.isValid,
  };
}
