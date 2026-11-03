"use client";

import { useMemo } from "react";
import { getBy, useStore } from "@tanstack/react-form";
import {
  getDataFields,
  isFieldConditionMet,
  type AdminDataField,
  type AdminField,
} from "@vexcms/core";
import { useFormContext } from "../forms";

function getParentPath(name: string): string | undefined {
  const lastDotIndex = name.lastIndexOf(".");
  return lastDotIndex === -1 ? undefined : name.slice(0, lastDotIndex);
}

function siblingDataAt(props: {
  data: Record<string, unknown>;
  name: string;
}): Record<string, unknown> {
  const parentPath = getParentPath(props.name);
  return (
    parentPath === undefined ? props.data : getBy(props.data, parentPath)
  ) as Record<string, unknown>;
}

/**
 * Whether a field should render, given its `admin.condition`.
 *
 * Reads the form store only when `field.admin.condition` is set — the
 * selector is a cheap `() => true` constant otherwise, so an unconditioned
 * field never re-renders on form changes it has no stake in. `useStore`
 * itself is still called on every render regardless (Rules of Hooks forbid a
 * conditional hook call); only the selector's work is conditional.
 *
 * `siblingData` is the value at `name`'s parent path: `layout[2].title`
 * resolves siblings from `layout[2]`, `seo.title` from `seo`, and a
 * top-level name (no `.`) from the form's whole values — matching
 * `FieldConditionProps`.
 *
 * @param props.field - The field whose `admin.condition` is evaluated.
 * @param props.name - The field's full TanStack Form path.
 * @returns `true` when there is no condition, the condition throws, or it
 *   evaluates truthy; `false` only on a clean falsy result
 *   (`isFieldConditionMet`).
 */
export function useFieldCondition(props: {
  field: AdminField;
  name: string;
}): boolean {
  const form = useFormContext();
  if (!form) {
    throw new Error(
      `Field "${props.name}" must be rendered inside <AppForm> or have a form context available.`,
    );
  }
  const condition =
    "condition" in props.field.admin ? props.field.admin.condition : undefined;

  return useStore(form.store, (state) =>
    condition === undefined
      ? true
      : isFieldConditionMet({
          field: props.field,
          data: state.values as Record<string, unknown>,
          siblingData: siblingDataAt({
            data: state.values as Record<string, unknown>,
            name: props.name,
          }),
        }),
  );
}

/**
 * Whether ANY data field reachable under `fields` is currently visible — the
 * pure, non-hook half of `useFieldSetsVisible`, kept separate so a
 * container's whole subtree is checked in one pass instead of one
 * `useFieldCondition` call per leaf (which would vary the hook call count
 * across renders as array/blocks items are added or removed).
 *
 * Walks `getDataFields({ fields })`, so a container's own `admin.condition`
 * and every tab's `admin.condition` are AND-ed into each field it contributes,
 * and a container's `admin.hidden` hides each of them — pass a container as
 * `{ [fieldKey]: field }` to have its own `admin` count. A data field is
 * visible while it is not hidden and its effective condition is met; `tabs`
 * counts every tab, not just the active one, so switching tabs never changes
 * a hidden group's visibility. A `ui()` field contributes no data field, so
 * it can never make its container visible on its own.
 *
 * @param props.fields - The fields record to check — typically one
 *   container keyed by its own field key.
 * @param props.namePrefix - The dotted/bracketed path `fields` was reached
 *   through, matching `RenderFields`'s own `namePrefix` convention.
 * @param props.data - The form's current values.
 * @returns `false` when no contributed data field is visible.
 */
export function isFieldVisible(props: {
  fields: Record<string, AdminField>;
  namePrefix: string | undefined;
  data: Record<string, unknown>;
}): boolean {
  return isAnyDataFieldVisible({
    dataFields: getDataFields({ fields: props.fields }),
    namePrefix: props.namePrefix,
    data: props.data,
  });
}

function isAnyDataFieldVisible(props: {
  dataFields: Record<string, AdminDataField>;
  namePrefix: string | undefined;
  data: Record<string, unknown>;
}): boolean {
  const { dataFields, namePrefix, data } = props;
  return Object.entries(dataFields).some(([key, field]) => {
    if (field.admin.hidden) return false;
    const name = namePrefix ? `${namePrefix}.${key}` : key;
    return isFieldConditionMet({ field, data, siblingData: siblingDataAt({ data, name }) });
  });
}

function sameVisibility(a: boolean[], b: boolean[]): boolean {
  return a.length === b.length && a.every((visible, index) => visible === b[index]);
}

/**
 * Hook form of `isFieldVisible` over several field sets at once — one
 * `useStore` call per container component (`FormTabs` checks one set per
 * tab, `FormCollapsible`/`FormRow` one set), called unconditionally once per
 * mounted container so the variable-descendant-count problem
 * `isFieldVisible` exists to solve never reaches a hook call site.
 *
 * @param props.fieldSets - One fields record per answer, each passed through
 *   `isFieldVisible`. Memoize it — each set is flattened once per identity.
 * @param props.namePrefix - See `isFieldVisible`.
 * @returns One visibility flag per entry of `fieldSets`, in order.
 */
export function useFieldSetsVisible(props: {
  fieldSets: Record<string, AdminField>[];
  namePrefix?: string;
}): boolean[] {
  const form = useFormContext();
  if (!form) {
    throw new Error("useFieldSetsVisible must be rendered inside <AppForm> or have a form context available.");
  }
  const dataFieldSets = useMemo(
    () => props.fieldSets.map((fields) => getDataFields({ fields })),
    [props.fieldSets],
  );
  return useStore(
    form.store,
    (state) =>
      dataFieldSets.map((dataFields) =>
        isAnyDataFieldVisible({
          dataFields,
          namePrefix: props.namePrefix,
          data: state.values as Record<string, unknown>,
        }),
      ),
    sameVisibility,
  );
}
