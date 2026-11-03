"use client";

import type { ComponentType } from "react";
import { getBy, useStore } from "@tanstack/react-form";
import type { UIField } from "@vexcms/core";
import { useFormContext } from "../../forms";
import { fieldName, type RenderFieldsContext } from "../RenderFields";

function parentPath(name: string): string | undefined {
  const lastDotIndex = name.lastIndexOf(".");
  return lastDotIndex === -1 ? undefined : name.slice(0, lastDotIndex);
}

/**
 * Renders a `ui()` field's custom `Field` component, subscribing to the form
 * store for live `data`/`siblingData` (matching `FieldConditionProps`).
 *
 * Reads the form via `useFormContext()` — this component always renders
 * inside `RenderFields`, which only mounts under the app form's provider.
 *
 * @param props.field - The `ui()` field to render.
 * @param props.fieldKey - This field's own key, passed through as `name`.
 * @param props.context - The {@link RenderFieldsContext} from the enclosing `RenderFields` call.
 * @returns The rendered custom `Field` component for this field.
 */
export function FormUI(props: {
  field: UIField;
  fieldKey: string;
  context: RenderFieldsContext;
}) {
  const { field, fieldKey, context } = props;
  const name = fieldName(context, fieldKey);
  const form = useFormContext();
  const { data, siblingData } = useStore(form.store, (state) => {
    const values = state.values as Record<string, unknown>;
    const parent = parentPath(name);
    return {
      data: values,
      siblingData: (parent === undefined ? values : getBy(values, parent)) as Record<
        string,
        unknown
      >,
    };
  });
  // `field.admin.components.Field` is typed against the framework-erased
  // `ComponentHKT` on the plain core `UIField` type this component receives,
  // nominally typed against whatever `TCollectionSlug` the field was
  // authored with. This component operates on live run-time `data`/
  // `siblingData` (`Record<string, unknown>`, not a nominal document type),
  // so it casts to that plain shape before rendering — the exact same
  // escape hatch `isFieldConditionMet` already uses for `field.admin.condition`.
  const Field = field.admin.components.Field as ComponentType<{
    name: string;
    data: Record<string, unknown>;
    siblingData: Record<string, unknown>;
    readOnly: boolean;
  }>;
  return <Field name={name} data={data} siblingData={siblingData} readOnly={Boolean(context.readOnly)} />;
}
