"use client";

import { ComponentPropsWithRef, useContext } from "react";
import type { GroupField, InputComponentProps } from "@vexcms/core";
import { AppFormContext } from "./AppFormContext";
import { fieldToInputComponent } from "../fields";
import { cn } from "../../styles/utils";
import { TypedFieldApi } from "./createFieldInput";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { FormLabel } from "./FormLabel";
import { FormDescription } from "./FormDescription";
import { FormError } from "./FormError";
import { useAccordionDndState } from "../ui/dnd";

/**
 * Props for the `FormGroup` component.
 *
 * @see {@link FormGroup}
 */
export interface FormGroupProps {
  /**
   * The field key name from the collection config, e.g. `"seo"`.
   *
   * Used to build sub-field paths: `"seo.title"`, `"seo.description"`, etc.
   * TanStack Form resolves dot-notation paths natively in v1.
   */
  name: string;
  /** The resolved group field definition. */
  fieldDef: GroupField;
  /** Whether all controls are read-only. Propagated to every sub-field. */
  readOnly: boolean;
  /**
   * Number of times the parent form has been submitted.
   *
   * Passed through to sub-field inputs so validation errors appear after
   * submit even if a sub-field was never touched.
   */
  submissionAttempts: number;
  /** Additional class names for the outer container. */
  className?: string;
}

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
export function FormGroup({
  name,
  field,
  fieldDef,
  index,
  readOnly,
  submissionAttempts,
  className,
}: InputComponentProps<GroupField> & {
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
        <AccordionTrigger className="text-sm flex gap-4 px-3 font-medium hover:no-underline">
          <div className="flex flex-col self-center">
            <span className="flex items-center gap-2">
              <FormLabel field={fieldDef} index={index} name={name} />
              <span className="text-xs font-normal text-muted-foreground">
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
                // Dot-notation: "seo.title" → form resolves to form.values.seo.title
                <SubInput
                  key={fieldKey}
                  name={`${name}.${fieldKey}`}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  fieldDef={subFieldDef as any}
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
