"use client";

import { useId, type ReactNode } from "react";
import { useStore } from "@tanstack/react-form";
import { useFieldContext, useFormContext } from "./formContext";
import { FormFieldLayout, fieldDescribedBy, isFieldShowingError } from "./FormFieldLayout";
import { Checkbox } from "../ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "../ui/multi-select";
import { useModalSurface } from "../modals/useModalSurface";
import type { BaseFormFieldProps } from "./types";

/** One selectable option in a {@link SelectField}. */
export interface SelectFieldOption {
  label: string;
  value: string;
}

/** Props for {@link SelectField}. */
export interface SelectFieldProps extends BaseFormFieldProps<string[]> {
  options: SelectFieldOption[];
  /** `false` (default) caps the selection at one value. */
  hasMany?: boolean;
  /**
   * `true` when the stored value is a single `string` instead of
   * `string[]` (a `schema.validator` override — `select`'s only caller
   * today). Converts to/from the one-element array the control itself
   * still renders. Default `false`.
   */
  scalar?: boolean;
  /** `"dropdown"` (default, a searchable popover) or `"radio"` (inline, no popover). */
  display?: "dropdown" | "radio";
  /** Applies only to `"dropdown"`. */
  searchable?: boolean;
  placeholder?: string;
}

/**
 * A single- or multi-select field bound to the nearest `<form.AppField
 * name="...">`. Stores `string[]` by default; `hasMany` caps it at one
 * entry. `scalar` rebinds to a single stored `string` instead, converting
 * to/from the one-element array the control itself still renders.
 *
 * @param props - See {@link SelectFieldProps} and {@link BaseFormFieldProps}.
 * @returns The labelled control (popover or inline radio/checkbox list), description and error.
 */
export function SelectField(props: SelectFieldProps): ReactNode {
  const field = useFieldContext<string[] | string | undefined>();
  const form = useFormContext();
  const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts);
  const isOnModalSurface = useModalSurface();
  const invalid = isFieldShowingError({ field, submissionAttempts });
  const describedBy = fieldDescribedBy({ id: field.name, hasDescription: Boolean(props.description), showError: invalid });
  const idPrefix = useId();

  const arrayValue: string[] = props.scalar
    ? typeof field.state.value === "string" && field.state.value !== ""
      ? [field.state.value]
      : []
    : ((field.state.value as string[] | undefined) ?? []);

  function commitValue(next: string[]) {
    field.handleChange(props.scalar ? next[0] : next);
  }

  function handleToggle(value: string) {
    if (props.hasMany) {
      commitValue(
        arrayValue.includes(value) ? arrayValue.filter((v) => v !== value) : [...arrayValue, value],
      );
    } else {
      commitValue(arrayValue.includes(value) ? [] : [value]);
    }
  }

  if (props.renderControl) {
    const control = props.renderControl({
      id: field.name,
      value: arrayValue,
      onChange: commitValue,
      onBlur: field.handleBlur,
      readOnly: Boolean(props.readOnly),
      invalid,
      describedBy,
    });
    return (
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
      >
        {control}
      </FormFieldLayout>
    );
  }

  if (props.display === "radio") {
    const inlineLabel = (
      <span
        id={`${idPrefix}-label`}
        className="relative flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]/field:pointer-events-none group-data-[disabled=true]/field:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
      >
        {props.index !== undefined ? `[${props.index + 1}] - ` : ""}
        {props.label}
        {props.required && <span className="text-red-500">*</span>}
      </span>
    );
    const control = props.hasMany ? (
      <div
        role="group"
        aria-labelledby={`${idPrefix}-label`}
        aria-disabled={props.readOnly}
        className="flex flex-col gap-2"
      >
        {props.options.map((option, optionIndex) => (
          <label key={`${idPrefix}-option-${optionIndex}`} htmlFor={`${idPrefix}-option-${optionIndex}`} className="flex items-center gap-2 text-sm">
            <Checkbox
              id={`${idPrefix}-option-${optionIndex}`}
              checked={arrayValue.includes(option.value)}
              disabled={props.readOnly}
              onCheckedChange={() => handleToggle(option.value)}
              onBlur={field.handleBlur}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              aria-label={option.label}
            />
            {option.label}
          </label>
        ))}
      </div>
    ) : (
      <RadioGroup
        aria-labelledby={`${idPrefix}-label`}
        disabled={props.readOnly}
        value={arrayValue[0]}
        onValueChange={(value) => commitValue([value as string])}
        onBlur={field.handleBlur}
        className="gap-2"
      >
        {props.options.map((option, optionIndex) => (
          <label key={`${idPrefix}-option-${optionIndex}`} htmlFor={`${idPrefix}-option-${optionIndex}`} className="flex items-center gap-2 text-sm">
            <RadioGroupItem
              id={`${idPrefix}-option-${optionIndex}`}
              value={option.value}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              aria-label={option.label}
            />
            {option.label}
          </label>
        ))}
      </RadioGroup>
    );
    return (
      <FormFieldLayout
        id={field.name}
        field={field}
        submissionAttempts={submissionAttempts}
        description={props.description}
        className={props.className}
        readOnly={props.readOnly}
        before={
          <div className="flex flex-col gap-1.5">
            {inlineLabel}
            {control}
          </div>
        }
      >
        {null}
      </FormFieldLayout>
    );
  }

  const control = (
    <MultiSelect
      modal={isOnModalSurface}
      onValuesChange={commitValue}
      single={!props.hasMany}
      values={arrayValue}
    >
      <MultiSelectTrigger
        id={field.name}
        className="w-full"
        onBlur={field.handleBlur}
        name={field.name}
        aria-required={props.required}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        disabled={props.readOnly}
      >
        <MultiSelectValue placeholder={props.placeholder} />
      </MultiSelectTrigger>
      <MultiSelectContent onBlur={field.handleBlur} className="w-full" search={props.searchable}>
        <MultiSelectGroup>
          {props.options.map((option, optionIndex) => (
            <MultiSelectItem value={option.value} key={`multi-select-item-${field.name}-${optionIndex}`}>
              {option.label}
            </MultiSelectItem>
          ))}
        </MultiSelectGroup>
      </MultiSelectContent>
    </MultiSelect>
  );
  return (
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
    >
      {control}
    </FormFieldLayout>
  );
}
