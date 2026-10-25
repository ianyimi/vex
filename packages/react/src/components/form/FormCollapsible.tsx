"use client";

import { useEffect, useId, useMemo, useState } from "react";
import type { CollapsibleField } from "@vexcms/core";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Badge } from "../ui/badge";
import { useFailedSubmitAttempt, useFieldErrorCount } from "../../hooks/useFieldErrorCount";
import { useFieldSetsVisible } from "../../hooks/useFieldCondition";
import {
  dataFieldNames,
  FieldLayoutItem,
  fieldWidth,
  renderField,
  visibleFieldEntries,
  type RenderFieldsContext,
} from "./RenderFields";

/**
 * Renders a `collapsible()` field as an accordion section — open by default
 * unless `field.admin.defaultCollapsed`. While collapsed, the trigger shows
 * an error-count badge for any field inside, via `useFieldErrorCount`
 * (Interview Decision 6); collapsed content stays mounted only while it holds
 * an error, and a failed submit opens the section.
 *
 * @param props.field - The `collapsible()` field to render.
 * @param props.fieldKey - This field's own key — scopes its own `admin.condition`.
 * @param props.context - The {@link RenderFieldsContext} from the enclosing `RenderFields` call.
 * @returns The accordion section rendering this field's nested fields.
 */
export function FormCollapsible(props: {
  field: CollapsibleField;
  fieldKey: string;
  context: RenderFieldsContext;
}) {
  const { field, context } = props;
  const id = useId();
  const [openIds, setOpenIds] = useState<string[]>(
    field.admin.defaultCollapsed ? [] : [id],
  );
  const isOpen = openIds.includes(id);
  const errorCount = useFieldErrorCount({
    names: dataFieldNames({ fields: field.fields, namePrefix: context.namePrefix }),
  });
  const fieldSets = useMemo(() => [{ [props.fieldKey]: field }], [props.fieldKey, field]);
  const [visible] = useFieldSetsVisible({ fieldSets, namePrefix: context.namePrefix });
  const failedSubmitAttempt = useFailedSubmitAttempt();
  useEffect(() => {
    if (failedSubmitAttempt > 0 && errorCount > 0) setOpenIds([id]);
  }, [failedSubmitAttempt]);

  if (!visible) return null;

  return (
    <Accordion
      value={openIds}
      onValueChange={setOpenIds}
      className="rounded-sm border-2 border-border"
    >
      <AccordionItem value={id}>
        <AccordionTrigger className="gap-2 px-3 text-sm font-medium hover:no-underline">
          {field.label}
          {!isOpen && errorCount > 0 && (
            <Badge variant="destructive">{errorCount}</Badge>
          )}
        </AccordionTrigger>
        <AccordionContent className="px-3" keepMounted={errorCount > 0}>
          <div className="flex flex-wrap gap-4">
            {visibleFieldEntries({ fields: field.fields, fieldKeys: context.fieldKeys }).map(
              ([key, childField]) => (
                <FieldLayoutItem key={key} width={fieldWidth(childField)}>
                  {renderField({ field: childField, fieldKey: key, context })}
                </FieldLayoutItem>
              ),
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
