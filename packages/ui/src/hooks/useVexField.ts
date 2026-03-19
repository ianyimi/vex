"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";
import { useVexFormContext } from "../components/form/VexFormProvider";
import type { VexField } from "@vexcms/core";

/**
 * Return type for the useVexField hook.
 */
export interface UseVexFieldReturn<TValue = unknown> {
  /** Current field value */
  value: TValue;
  /** Set the field value */
  setValue: (value: TValue) => void;
  /** Mark the field as touched (blurred) */
  handleBlur: () => void;
  /** Validation errors for this field */
  errors: string[];
  /** Whether the field has errors and has been touched or submitted */
  showError: boolean;
  /** Whether the field is read-only (from config or permissions) */
  readOnly: boolean;
  /** The VexField definition */
  fieldDef: VexField;
  /** The field name */
  name: string;
}

interface Snapshot<TValue> {
  value: TValue;
  errors: string[];
  showError: boolean;
}

const EMPTY_ERRORS: string[] = [];

/**
 * Hook for accessing and modifying a form field's value and state.
 * Must be used within a VexFormProvider (or inside AppForm).
 *
 * This is the primary hook for custom field components. It provides
 * the field value, setter, errors, and readOnly status.
 *
 * @param props.name - The field name (key in the collection's fields)
 *
 * @example
 * ```tsx
 * function ColorField({ name, fieldDef, readOnly }: FieldComponentProps) {
 *   const { value, setValue, errors, showError } = useVexField<string>({ name });
 *   return <input value={value ?? ""} onChange={e => setValue(e.target.value)} />;
 * }
 * ```
 */
export function useVexField<TValue = unknown>(props: {
  name: string;
}): UseVexFieldReturn<TValue> {
  const { form, fieldDefs, readOnlyMap } = useVexFormContext();
  const cachedRef = useRef<Snapshot<TValue> | null>(null);

  const subscribe = useCallback(
    (callback: () => void) => form.store.subscribe(callback),
    [form],
  );

  const getSnapshot = useCallback((): Snapshot<TValue> => {
    const value = form.state.values[props.name] as TValue;
    const fieldMeta = form.state.fieldMeta[props.name];
    const rawErrors = fieldMeta?.errors;
    const isTouched = fieldMeta?.isTouched ?? false;
    const isSubmitted = form.state.submissionAttempts > 0;
    const hasErrors = rawErrors && rawErrors.length > 0;
    const showError = (isTouched || isSubmitted) && !!hasErrors;

    const prev = cachedRef.current;
    if (prev) {
      // Return cached snapshot if nothing changed
      if (
        Object.is(prev.value, value) &&
        prev.showError === showError &&
        errorsEqual(prev.errors, rawErrors)
      ) {
        return prev;
      }
    }

    const errors = hasErrors ? normalizeErrors(rawErrors) : EMPTY_ERRORS;
    const next: Snapshot<TValue> = { value, errors, showError };
    cachedRef.current = next;
    return next;
  }, [form, props.name]);

  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const setValue = useCallback(
    (value: TValue) => {
      form.setFieldValue(props.name, value);
    },
    [form, props.name],
  );

  const handleBlur = useCallback(() => {
    form.setFieldMeta(props.name, (prev) => ({ ...prev, isTouched: true }));
    form.validateField(props.name, "blur");
  }, [form, props.name]);

  const fieldDef = fieldDefs[props.name] ?? ({ type: "text" } as VexField);
  const readOnly =
    readOnlyMap[props.name] ?? fieldDef.admin?.readOnly ?? false;

  return {
    value: snapshot.value,
    setValue,
    handleBlur,
    errors: snapshot.errors,
    showError: snapshot.showError,
    readOnly,
    fieldDef,
    name: props.name,
  };
}

/**
 * Check if errors array is equivalent to the previous one.
 */
function errorsEqual(
  prev: string[],
  next: unknown[] | undefined,
): boolean {
  if (!next || next.length === 0) return prev.length === 0;
  if (prev.length !== next.length) return false;
  for (let i = 0; i < prev.length; i++) {
    const n = next[i];
    const normalized =
      typeof n === "string"
        ? n
        : n && typeof n === "object" && "message" in n
          ? String((n as any).message)
          : String(n);
    if (prev[i] !== normalized) return false;
  }
  return true;
}

/**
 * Normalize TanStack Form errors to string[].
 * Errors may be strings, objects with .message, or undefined.
 */
function normalizeErrors(errors: unknown[]): string[] {
  return errors
    .map((e) => {
      if (typeof e === "string") return e;
      if (e && typeof e === "object" && "message" in e)
        return String((e as any).message);
      if (e !== undefined && e !== null) return String(e);
      return null;
    })
    .filter((e): e is string => e !== null);
}
