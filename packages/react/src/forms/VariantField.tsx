"use client";

import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { useStore } from "@tanstack/react-form";
import { useFieldContext, useFormContext } from "./formContext";
import { FormFieldLayout, NullFieldToggle } from "./FormFieldLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { FieldDescription } from "../ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import type { BaseFormFieldProps } from "./types";

/** One variant/type option the picker offers. */
export interface VariantFieldOption {
  key: string;
  label: string;
}

/** Props for {@link VariantField}. */
export interface VariantFieldProps extends Omit<BaseFormFieldProps<never>, "renderControl"> {
  options: VariantFieldOption[];
  activeKey: string | undefined;
  onActiveKeyChange: (key: string) => void;
  /** `"select"` (default, a dropdown) or `"segmented"` (inline tabs). */
  display?: "select" | "segmented";
  /** The active variant's/member's rendered body — a container's own fields, or a scalar input. */
  children: ReactNode;
  /** Renders a "Null" switch in the accordion trigger and hides `children` while `true`. */
  isNull?: boolean;
  onIsNullChange?: (isNull: boolean) => void;
  /**
   * Whether `variants` are discriminated (a `"kind"`-style key picks a
   * member whose own fields render under a namePrefix) vs. primitive (the
   * active member is a single top-level field control bound to the SAME
   * path as this variant field). A primitive member's own control already
   * claims `id={field.name}`, so the picker suffixes its own id
   * (`${field.name}-type`) to avoid a duplicate DOM id; a discriminated
   * variant's member fields live under a namePrefix instead, so the picker
   * can safely claim `id={field.name}` directly — satisfying the generic
   * field contract's single-control `label[for]`/`id` association, since a
   * discriminated variant has no other element that could claim it.
   */
  discriminated: boolean;
  /** Whether the accordion starts expanded. Default `true`. */
  defaultOpen?: boolean;
}

/**
 * A variant/type-picker field bound to the nearest `<form.AppField
 * name="...">`, rendered as the same collapsible accordion `GroupField`
 * uses: the trigger shows the label, required asterisk, the active
 * variant's/member's own label as a summary, and the description; a "Null"
 * toggle (when `onIsNullChange` is given) sits in the trigger's own actions
 * row. `AccordionContent` holds the `Select`/`Tabs` picker and `children`
 * (the caller's own body for the active selection) below it. This
 * component never reads `fieldDef.variants` itself — same "caller renders
 * its own children" composition as `GroupField`.
 *
 * @param props - See {@link VariantFieldProps} and {@link BaseFormFieldProps}.
 * @returns The accordion wrapping the picker and the active selection's body.
 */
export function VariantField(props: VariantFieldProps): ReactNode {
  const field = useFieldContext();
  const form = useFormContext();
  const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts);
  const pickerId = props.discriminated ? field.name : `${field.name}-type`;
  const labelId = `${field.name}-label`;

  const itemValue = useRef(`${field.name}-accordion-item`).current;
  const [openValue, setOpenValue] = useState<string[]>(() => ((props.defaultOpen ?? true) ? [itemValue] : []));

  const activeLabel = props.options.find((option) => option.key === props.activeKey)?.label;
  const memberOwnsControl = !props.discriminated && props.activeKey !== undefined;

  const picker =
    props.display === "segmented" ? (
      <Tabs value={props.activeKey} onValueChange={props.onActiveKeyChange}>
        <TabsList>
          {props.options.map((option) => (
            <TabsTrigger key={option.key} value={option.key} disabled={props.readOnly}>
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    ) : (
      <Select
        value={props.activeKey ?? null}
        onValueChange={(value) => {
          if (value !== null) props.onActiveKeyChange(value);
        }}
        disabled={props.readOnly}
      >
        <SelectTrigger id={pickerId} onBlur={field.handleBlur} aria-required={props.required} aria-labelledby={labelId}>
          <SelectValue>{() => activeLabel ?? (props.required ? "Select a type" : "None")}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {props.options.map((option) => (
            <SelectItem key={option.key} value={option.key}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );

  const nullToggle = props.onIsNullChange ? (
    <NullFieldToggle isNull={Boolean(props.isNull)} onIsNullChange={props.onIsNullChange} label={props.label} />
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
          actions={nullToggle}
        >
          <div className="group/field flex min-w-0 flex-col gap-1 self-center" data-disabled={props.readOnly || undefined}>
            <span className="flex min-w-0 items-center gap-2">
              <span
                id={labelId}
                className="relative block min-w-0 truncate text-sm leading-snug font-medium select-none group-data-[disabled=true]/field:pointer-events-none group-data-[disabled=true]/field:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
              >
                {props.index !== undefined ? `[${props.index + 1}] - ` : ""}
                {props.label}
                {props.required && <span className="text-red-500">*</span>}
              </span>
              {activeLabel !== undefined && (
                <span className="hidden shrink-0 text-xs font-normal text-muted-foreground @lg/form:inline">
                  {activeLabel}
                </span>
              )}
            </span>
            {props.description && <FieldDescription>{props.description}</FieldDescription>}
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-3 pt-3">
          <FormFieldLayout
            id={pickerId}
            field={field}
            submissionAttempts={submissionAttempts}
            className={props.className}
            readOnly={props.readOnly}
            isNull={props.isNull}
            showError={!memberOwnsControl}
          >
            <div className="flex flex-col gap-3">
              {picker}
              {!props.isNull && <div className="flex flex-col gap-3">{props.children}</div>}
            </div>
          </FormFieldLayout>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
