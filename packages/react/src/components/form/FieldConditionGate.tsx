"use client";

import type { ReactNode } from "react";
import type { AdminField } from "@vexcms/core";
import { useFieldCondition } from "../../hooks/useFieldCondition";

/**
 * Renders `children` only while `field`'s `admin.condition` is met.
 *
 * This is the one-hook-call-per-field boundary `renderField` wraps
 * each data field's rendered input in: `useFieldCondition` must
 * run the same number of times on every render, which a bare loop over a
 * field map cannot guarantee once the field count itself can change
 * (array/blocks items added or removed). One `FieldConditionGate` instance
 * per field keeps the call count pinned to "one per mounted field" — the
 * same shape TanStack's own `<form.Field>` uses.
 *
 * A hidden field's value is left untouched in form state; only its rendered
 * input unmounts.
 *
 * @param props.field - The field whose `admin.condition` gates `children`.
 * @param props.name - The field's full TanStack Form path.
 * @param props.children - The field's rendered input (label, control, error).
 * @returns `children`, or `null` while the condition is unmet.
 */
export function FieldConditionGate(props: {
  field: AdminField;
  name: string;
  children: ReactNode;
}): ReactNode {
  const visible = useFieldCondition({ field: props.field, name: props.name });
  return visible ? props.children : null;
}
