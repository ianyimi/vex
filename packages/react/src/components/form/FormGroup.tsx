"use client";

import { ComponentPropsWithRef, useContext, useEffect, useRef } from "react";
import { getBy } from "@tanstack/react-form";
import type { BaseFieldMeta, GroupField, InputComponentProps } from "@vexcms/core";
import { AppFormContext } from "./AppFormContext";
import { RenderFields } from "./RenderFields";
import { cn } from "../../styles/utils";
import { TypedFieldApi } from "./createFieldInput";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { FormDescription } from "./FormDescription";
import { FormError } from "./FormError";
import { useAccordionDndState } from "../ui/dnd";
import { ArrayItemHeaderContext } from "./ArrayItemHeaderContext";
import { useFailedSubmitAttempt, useFieldErrorCount } from "../../hooks/useFieldErrorCount";
import type { VexResourceSlug } from "@vexcms/core";

/**
 * The open-state key for a group at `name`: inside an array item, the
 * innermost item's stored `id` plus the group's path below it, so the key
 * follows the item through reorders; otherwise (or for an item without an
 * `id`) the name itself.
 *
 * @returns The open-state storage key for this group.
 */
function accordionStoreKey(props: { name: string; values: unknown }): string {
  const itemPath = /^(.*\[\d+\])/.exec(props.name)?.[1];
  if (itemPath === undefined) return props.name;
  const item: unknown = getBy(props.values, itemPath);
  const id =
    typeof item === "object" && item !== null && "id" in item && typeof item.id === "string"
      ? item.id
      : undefined;
  return id === undefined ? props.name : `${id}${props.name.slice(itemPath.length)}`;
}

/**
 * Renders a group field as a collapsible fieldset in the admin edit form.
 *
 * Maps over `fieldDef.fields` via `RenderFields`, dot-prefixed with `name`
 * (e.g. `"seo.title"`) — TanStack Form v1 resolves dot-notation to nested
 * object values without any special mode. `fieldDef.fields` is a `group()`'s
 * OWN nested fields record, which may itself contain `tabs()`/`collapsible()`/
 * `row()`/`ui()` fields (Step 6 — legal at any nesting level); this
 * non-top-level `RenderFields` call renders them exactly as it would at the
 * top level, just without the `region`/`isTopLevel` URL-persistence behavior.
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
}: InputComponentProps<TFieldMeta, GroupField<VexResourceSlug, TFieldMeta>> & {
  field: TypedFieldApi<Record<string, any>>;
  submissionAttempts: number;
} & ComponentPropsWithRef<"div">) {
  const form = useContext(AppFormContext);
  const itemHeader = useContext(ArrayItemHeaderContext);

  if (!form) {
    throw new Error(
      `FormGroup "${name}" must be rendered inside <AppForm> or have a form context available.`,
    );
  }

  const subFields = Object.entries(fieldDef.fields);
  const subFieldCount = subFields.length;

  const { itemValue, openItems, handleValueChange } = useAccordionDndState({
    storeKey: accordionStoreKey({ name, values: form.state.values }),
    defaultOpen: fieldDef.admin.defaultCollapsed !== true,
  });

  const openSignalVersion = itemHeader?.openSignal.version ?? 0;
  const appliedOpenSignalVersion = useRef(openSignalVersion);
  useEffect(() => {
    if (!itemHeader || appliedOpenSignalVersion.current === openSignalVersion) return;
    appliedOpenSignalVersion.current = openSignalVersion;
    handleValueChange(itemHeader.openSignal.open ? [itemValue] : []);
  });

  const errorCount = useFieldErrorCount({ names: [name] });
  const failedSubmitAttempt = useFailedSubmitAttempt();
  useEffect(() => {
    if (failedSubmitAttempt > 0 && errorCount > 0) handleValueChange([itemValue]);
  }, [failedSubmitAttempt]);

  return (
    <Accordion
      className={cn("rounded-sm border-2 border-border", className)}
      value={openItems}
      onValueChange={handleValueChange}
      role="group"
      aria-labelledby={`${name}-label`}
      aria-disabled={readOnly}
    >
      {/* Never `disabled={readOnly}`: collapsing a group is NAVIGATION, not
          editing. A caller with read access but no write access must still be
          able to open the group to see its values — the sub-fields below carry
          the readOnly gate individually. */}
      <AccordionItem value={itemValue}>
        {/* Trigger — label + sub-field count */}
        <AccordionTrigger
          className="flex gap-4 px-3 text-sm font-medium hover:no-underline"
          leading={itemHeader?.dragHandle}
          actions={itemHeader?.actions}
        >
          <div className="flex min-w-0 flex-col self-center">
            <span className="flex min-w-0 items-center gap-2">
              <span
                id={`${name}-label`}
                className="relative block min-w-0 truncate text-sm leading-snug font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
              >
                {index !== undefined ? `[${index + 1}] - ` : ""}
                {fieldDef.label || name}
                {fieldDef.required && <span className="text-red-500">*</span>}
              </span>
              <span className="hidden shrink-0 text-xs font-normal text-muted-foreground @lg/form:inline">
                {subFieldCount} {subFieldCount === 1 ? "field" : "fields"}
              </span>
            </span>
            <FormDescription field={fieldDef} />
          </div>
        </AccordionTrigger>

        {/* Content — all sub-fields */}
        <AccordionContent className="px-3 pt-3" keepMounted={errorCount > 0}>
          <ArrayItemHeaderContext.Provider value={null}>
            <RenderFields
              fields={fieldDef.fields}
              collection={collection}
              namePrefix={name}
              readOnly={readOnly}
            />
          </ArrayItemHeaderContext.Provider>
        </AccordionContent>
        <FormError field={field} submissionAttempts={submissionAttempts} />
      </AccordionItem>
    </Accordion>
  );
}
