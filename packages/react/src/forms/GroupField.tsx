"use client";

import type { ReactNode } from "react";
import { useContext, useEffect, useRef, useState } from "react";
import { useStore } from "@tanstack/react-form";
import { useFieldContext, useFormContext } from "./formContext";
import { FormFieldLayout, NullFieldToggle } from "./FormFieldLayout";
import { ArrayItemHeaderContext } from "./ArrayItemHeaderContext";
import { useFailedSubmitAttempt, useFieldErrorCount } from "./useFieldErrorCount";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { FieldDescription } from "../ui/field";
import type { BaseFormFieldProps } from "./types";

/** Props for {@link GroupField}. */
export interface GroupFieldProps extends Omit<BaseFormFieldProps<never>, "renderControl"> {
  /** The group's own fields — rendered by the caller, same as every other `renderItem`-style slot in this entry. */
  children: ReactNode;
  /** Collapsible as an accordion item; `false` renders a plain fieldset with no trigger. */
  collapsible?: boolean;
  defaultOpen?: boolean;
  /** Sub-field count shown beside the label, even while collapsed. Caller-supplied since this component never walks a `fieldDef`. */
  fieldCount?: number;
  /** Whether this group's value is currently `null`. Ignored unless `onIsNullChange` is also given. */
  isNull?: boolean;
  /** Toggles `isNull`; forwarded to the inner `FormFieldLayout`. */
  onIsNullChange?: (isNull: boolean) => void;
}

/**
 * A fieldset layout for a nested set of fields — label, optional
 * collapse/expand, description and error, wrapping `children`. Vastly
 * smaller than the deleted admin `FormGroup.tsx`: no `RenderFields` call, no
 * `fieldDef` walk, no accordion-open-state-key derivation from the array
 * item's stored id — the caller renders its own children and owns their
 * identity.
 *
 * Inside an array item whose `ArrayField` passed `itemsHaveOwnHeader`, this
 * component reads {@link ArrayItemHeaderContext} and places the drag handle
 * and item actions on its own header row instead of `ArrayField`'s gutter.
 *
 * @param props - See {@link GroupFieldProps} and {@link BaseFormFieldProps}.
 * @returns The fieldset/accordion layout wrapping `children`.
 */
export function GroupField(props: GroupFieldProps): ReactNode {
  const field = useFieldContext();
  const form = useFormContext();
  const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts);
  const itemHeader = useContext(ArrayItemHeaderContext);

  // A stable per-instance identity for the single `AccordionItem` below —
  // NOT `field.name`, which is index-derived and changes when `FormArray`/
  // `ArrayField` reorders this item's siblings. React keeps the SAME
  // `GroupField` instance (keyed by the item's own id upstream), so this
  // open/closed state must travel with that instance, not with whatever
  // index it currently renders at.
  const itemValue = useRef(`${field.name}-accordion-item`).current;
  const [openValue, setOpenValue] = useState<string[]>(() => ((props.defaultOpen ?? true) ? [itemValue] : []));

  const openSignalVersion = itemHeader?.openSignal.version ?? 0;
  const appliedOpenSignalVersion = useRef(openSignalVersion);
  useEffect(() => {
    if (!itemHeader || appliedOpenSignalVersion.current === openSignalVersion) return;
    appliedOpenSignalVersion.current = openSignalVersion;
    setOpenValue(itemHeader.openSignal.open ? [itemValue] : []);
  });

  const errorCount = useFieldErrorCount({ names: [field.name] });
  const failedSubmitAttempt = useFailedSubmitAttempt();
  useEffect(() => {
    if (failedSubmitAttempt > 0 && errorCount > 0) setOpenValue([itemValue]);
  }, [failedSubmitAttempt]);

  if (props.collapsible === false) {
    return (
      <fieldset>
        <FormFieldLayout
          id={field.name}
          label={props.label}
          required={props.required}
          description={props.description}
          index={props.index}
          field={field}
          submissionAttempts={submissionAttempts}
          className={props.className}
          readOnly={props.readOnly}
          isNull={props.isNull}
          onIsNullChange={props.onIsNullChange}
        >
          <ArrayItemHeaderContext.Provider value={null}>{props.children}</ArrayItemHeaderContext.Provider>
        </FormFieldLayout>
      </fieldset>
    );
  }

  const nullToggle = props.onIsNullChange ? (
    <NullFieldToggle isNull={Boolean(props.isNull)} onIsNullChange={props.onIsNullChange} label={props.label} />
  ) : undefined;
  const triggerActions =
    itemHeader?.actions !== undefined || nullToggle !== undefined ? (
      <>
        {itemHeader?.actions}
        {nullToggle}
      </>
    ) : undefined;

  return (
    <Accordion
      value={props.isNull ? [] : openValue}
      onValueChange={(next) => {
        if (!props.isNull) setOpenValue(next);
      }}
      className="rounded-sm border-2 border-border"
    >
      <AccordionItem value={itemValue} disabled={props.isNull}>
        <AccordionTrigger
          className="flex gap-4 px-3 text-sm font-medium hover:no-underline"
          leading={itemHeader?.dragHandle}
          actions={triggerActions}
        >
          <div
            className="group/field flex min-w-0 flex-col gap-1 self-center"
            data-disabled={props.readOnly || undefined}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                id={`${field.name}-label`}
                className="relative block min-w-0 truncate text-sm leading-snug font-medium select-none group-data-[disabled=true]/field:pointer-events-none group-data-[disabled=true]/field:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
              >
                {props.index !== undefined ? `[${props.index + 1}] - ` : ""}
                {props.label}
                {props.required && <span className="text-red-500">*</span>}
              </span>
              {props.fieldCount !== undefined && (
                <span className="hidden shrink-0 text-xs font-normal text-muted-foreground @lg/form:inline">
                  {props.fieldCount} {props.fieldCount === 1 ? "field" : "fields"}
                </span>
              )}
            </span>
            {props.description && <FieldDescription>{props.description}</FieldDescription>}
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-3 pt-3" keepMounted={errorCount > 0}>
          <FormFieldLayout
            id={field.name}
            field={field}
            submissionAttempts={submissionAttempts}
            readOnly={props.readOnly}
            isNull={props.isNull}
          >
            <ArrayItemHeaderContext.Provider value={null}>{props.children}</ArrayItemHeaderContext.Provider>
          </FormFieldLayout>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
