"use client";

import { useStore } from "@tanstack/react-form";
import type { AnyFormApi } from "@tanstack/react-form";
import { useFormContext } from "./formContext";

/**
 * Whether a form field path falls under one of the given name prefixes — the
 * path equals the prefix itself, or continues it with `.` (a group/object
 * sub-field) or `[` (an array/blocks item).
 *
 * @param path - The form field path to test.
 * @param names - The name prefixes to test `path` against.
 * @returns `true` if `path` equals or nests under any of `names`.
 */
export function matchesFieldNamePrefix(path: string, names: readonly string[]): boolean {
  return names.some(
    (name) => path === name || path.startsWith(`${name}.`) || path.startsWith(`${name}[`),
  );
}

/**
 * Every field path currently holding a validation error: each registered
 * field's own `fieldMeta.errors`, plus every path in a form-level validator's
 * per-path error map. The second source is what covers a field that is not
 * mounted — a collapsed block's — since TanStack only distributes a
 * form-level error onto a field registered when validation ran.
 *
 * @param state - The TanStack form state to collect errored paths from.
 * @returns The set of every field path currently holding a validation error.
 */
export function collectErroredPaths(state: AnyFormApi["state"]): Set<string> {
  const paths = new Set<string>();
  for (const [path, meta] of Object.entries(state.fieldMeta)) {
    if (meta && meta.errors.length > 0) paths.add(path);
  }
  for (const formError of Object.values(state.errorMap)) {
    if (typeof formError !== "object" || formError === null || Array.isArray(formError)) continue;
    for (const [path, issues] of Object.entries(formError)) {
      if (Array.isArray(issues) ? issues.length > 0 : Boolean(issues)) paths.add(path);
    }
  }
  return paths;
}

function countUnder(paths: Set<string>, names: readonly string[]): number {
  let count = 0;
  for (const path of paths) {
    if (matchesFieldNamePrefix(path, names)) count += 1;
  }
  return count;
}

/**
 * Counts the fields with a validation error whose path is one of `names`, or
 * a nested path under one of them — the error badge one `BlocksField` block
 * shows for its own sub-fields.
 *
 * @param props.names - Field name prefixes to count errors under.
 * @returns The number of distinct erroring field paths under `names`.
 */
export function useFieldErrorCount(props: { names: readonly string[] }): number {
  const form = useFormContext();
  return useStore(form.store, (state) => countUnder(collectErroredPaths(state), props.names));
}

function sameCounts(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((count, index) => count === b[index]);
}

/**
 * {@link useFieldErrorCount} over several name sets in one store
 * subscription — `FormTabs` counts one set per tab.
 *
 * @param props.nameSets - One list of name prefixes per answer.
 * @returns One error count per entry of `nameSets`, in order.
 */
export function useFieldErrorCounts(props: {
  nameSets: readonly (readonly string[])[];
}): number[] {
  const form = useFormContext();
  return useStore(
    form.store,
    (state) => {
      const paths = collectErroredPaths(state);
      return props.nameSets.map((names) => countUnder(paths, names));
    },
    sameCounts,
  );
}

/**
 * The attempt number of the latest submit that ended without success, `0`
 * until the first one (or while a submit is in flight).
 *
 * @param state - The form store state to read submission status from.
 * @returns The failed attempt number, or `0` if no attempt has failed yet.
 */
export function failedSubmitAttemptOf(state: {
  submissionAttempts: number;
  isSubmitting: boolean;
  isSubmitSuccessful: boolean;
}): number {
  return state.submissionAttempts > 0 && !state.isSubmitting && !state.isSubmitSuccessful
    ? state.submissionAttempts
    : 0;
}

/**
 * Bumps once per failed submit — {@link failedSubmitAttemptOf}. `BlocksField`
 * reacts to it by opening any block that still holds an error.
 *
 * @returns The failed attempt number, or `0` if no attempt has failed yet.
 */
export function useFailedSubmitAttempt(): number {
  const form = useFormContext();
  return useStore(form.store, failedSubmitAttemptOf);
}
