"use client";

import { useMemo } from "react";
import { resolveRowWidths, type RowField } from "@vexcms/core";
import { useFieldSetsVisible } from "../../hooks/useFieldCondition";
import {
  FieldLayoutItem,
  fieldWidth,
  renderField,
  visibleFieldEntries,
  type RenderFieldsContext,
} from "./RenderFields";

/**
 * Renders a `row()` field as a flex-wrap sub-row. Children's widths are
 * resolved by `resolveRowWidths` — their own `%` widths when they sum to
 * ~100%, an equal share otherwise (Interview Decision 6).
 *
 * @param props.field - The `row()` field to render.
 * @param props.fieldKey - This field's own key — scopes its own `admin.condition`.
 * @param props.context - The {@link RenderFieldsContext} from the enclosing `RenderFields` call.
 * @returns The flex-wrap sub-row rendering this field's nested fields.
 */
export function FormRow(props: {
  field: RowField;
  fieldKey: string;
  context: RenderFieldsContext;
}) {
  const { field, context } = props;
  const entries = visibleFieldEntries({ fields: field.fields, fieldKeys: context.fieldKeys });
  const widths = resolveRowWidths({ widths: entries.map(([, childField]) => fieldWidth(childField)) });
  const fieldSets = useMemo(() => [{ [props.fieldKey]: field }], [props.fieldKey, field]);
  const [visible] = useFieldSetsVisible({ fieldSets, namePrefix: context.namePrefix });

  if (!visible) return null;

  return (
    <div className="flex flex-wrap gap-4">
      {entries.map(([key, childField], index) => (
        <FieldLayoutItem key={key} width={widths[index] ?? "100%"}>
          {renderField({ field: childField, fieldKey: key, context })}
        </FieldLayoutItem>
      ))}
    </div>
  );
}
