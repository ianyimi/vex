"use client";

import { useMemo } from "react";
import { resolveRowWidths, type RowField } from "@vexcms/core";
import { useFieldSetsVisible } from "../useFieldCondition";
import {
  FieldLayoutItem,
  fieldWidth,
  renderField,
  visibleFieldEntries,
  type RenderFieldsContext,
} from "../RenderFields";

/**
 * Renders a `row()` field as a flex-wrap sub-row. Children's widths are
 * resolved by `resolveRowWidths` — their own `%` widths when they sum to
 * ~100%, an equal share otherwise — computed ONLY over children that are
 * actually visible: each child's own `admin.condition` (AND-ed with this
 * row's own, the same effective condition `FieldConditionGate` applies) is
 * evaluated reactively against live form state via `useFieldSetsVisible`,
 * one set per child (mirroring `FormTabs`'s per-tab visibility), so a
 * condition-hidden child reserves no slot and its visible siblings share
 * the freed width. A row with no visible children renders nothing.
 *
 * @param props.field - The `row()` field to render.
 * @param props.fieldKey - This field's own key — scopes its own `admin.condition`.
 * @param props.context - The {@link RenderFieldsContext} from the enclosing `RenderFields` call.
 * @returns The flex-wrap sub-row rendering this field's visible nested fields.
 */
export function FormRow(props: {
  field: RowField;
  fieldKey: string;
  context: RenderFieldsContext;
}) {
  const { field, fieldKey, context } = props;
  const entries = useMemo(
    () => visibleFieldEntries({ fields: field.fields, fieldKeys: context.fieldKeys }),
    [field.fields, context.fieldKeys],
  );
  const fieldSets = useMemo(
    () =>
      entries.map(([key, childField]) => ({
        [fieldKey]: { ...field, fields: { [key]: childField } },
      })),
    [entries, field, fieldKey],
  );
  const childVisibility = useFieldSetsVisible({ fieldSets, namePrefix: context.namePrefix });
  const visibleEntries = entries.filter((_, index) => childVisibility[index] === true);
  const widths = resolveRowWidths({ widths: visibleEntries.map(([, childField]) => fieldWidth(childField)) });

  if (visibleEntries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-6">
      {visibleEntries.map(([key, childField], index) => (
        <FieldLayoutItem key={key} width={widths[index] ?? "100%"}>
          {renderField({ field: childField, fieldKey: key, context })}
        </FieldLayoutItem>
      ))}
    </div>
  );
}
