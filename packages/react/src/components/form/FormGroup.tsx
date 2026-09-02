"use client";

import { ComponentPropsWithRef, useContext } from "react";
import type { BaseFieldMeta, GroupField, InputComponentProps } from "@vexcms/core";
import { AppFormContext } from "./AppFormContext";
import { fieldToInputComponent } from "../fields";
import { cn } from "../../styles/utils";
import { TypedFieldApi } from "./createFieldInput";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { FormLabel } from "./FormLabel";
import { FormDescription } from "./FormDescription";
import { FormError } from "./FormError";
import { useAccordionDndState } from "../ui/dnd";

/**
 * Renders a group field as a collapsible fieldset in the admin edit form.
 *
 * Maps over `fieldDef.fields` and renders each sub-field using the registered
 * input component from `fieldToInputComponent`. Sub-field names use TanStack
 * Form dot-notation — `"${name}.${fieldKey}"` (e.g. `"seo.title"`) — which
 * Form v1 resolves to nested object values without any special mode.
 *
 * The fieldset starts open. Clicking the header toggles it. `readOnly` is
 * propagated to all sub-fields.
 *
 * @throws {Error} When rendered outside `<AppForm>` and no form context is
 *   available (same constraint as `FormArray`).
 *
 * @param props - Component props.
 * @returns The collapsible fieldset accordion with one input per sub-field.
 *
 * @example
 * ```tsx
 * <FormGroup
 *   name="seo"
 *   fieldDef={seoFieldDef}
 *   readOnly={false}
 *   submissionAttempts={0}
 * />
 * ```
 */
export function FormGroup<TFieldMeta extends BaseFieldMeta = BaseFieldMeta>({
  collection,
  name,
  field,
  fieldDef,
  index,
  readOnly,
  submissionAttempts,
  className,
}: InputComponentProps<TFieldMeta, GroupField<TFieldMeta>> & {
  field: TypedFieldApi<Record<string, any>>;
  submissionAttempts: number;
} & ComponentPropsWithRef<"div">) {
  const form = useContext(AppFormContext);

  if (!form) {
    throw new Error(
      `FormGroup "${name}" must be rendered inside <AppForm> or have a form context available.`,
    );
  }

  const subFields = Object.entries(fieldDef.fields);
  const subFieldCount = subFields.length;

  const { itemValue, openItems, handleValueChange } = useAccordionDndState({
    name,
    index,
    defaultOpen: fieldDef.defaultOpen !== false,
  });

  return (
    <Accordion
      className={cn("rounded-sm border-2 border-border", className)}
      value={openItems}
      onValueChange={handleValueChange}
    >
      <AccordionItem value={itemValue}>
        {/* Trigger — label + sub-field count */}
        <AccordionTrigger className="flex gap-4 px-3 text-sm font-medium hover:no-underline">
          <div className="flex flex-col self-center">
            <span className="flex items-center gap-2">
              <FormLabel field={fieldDef} index={index} name={name} />
              <span className="text-muted-foreground text-xs font-normal">
                {subFieldCount} {subFieldCount === 1 ? "field" : "fields"}
              </span>
            </span>
            <FormDescription field={fieldDef} />
          </div>
        </AccordionTrigger>

        {/* Content — all sub-fields */}
        <AccordionContent className="px-3 pt-3">
          <div className="flex flex-col gap-4">
            {subFields.map(([fieldKey, subFieldDef]) => {
              const SubInput = fieldToInputComponent(subFieldDef.type);
              if (!SubInput) return null;
              return (
                <SubInput
                  key={fieldKey}
                  name={`${name}.${fieldKey}`}
                  collection={collection}
                  fieldDef={subFieldDef}
                  readOnly={readOnly || subFieldDef.admin.readOnly}
                />
              );
            })}
          </div>
        </AccordionContent>
        <FormError field={field} submissionAttempts={submissionAttempts} />
      </AccordionItem>
    </Accordion>
  );
}
