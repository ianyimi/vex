"use client";

import type { ReactNode } from "react";
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
  /** `"dropdown"` (default, a searchable popover) or `"radio"` (inline, no popover). */
  display?: "dropdown" | "radio";
  /** Applies only to `"dropdown"`. */
  searchable?: boolean;
  placeholder?: string;
}

/**
 * A single- or multi-select field bound to the nearest `<form.AppField
 * name="...">`. Always stores `string[]`; `hasMany` caps it at one entry.
 *
 * @param props - See {@link SelectFieldProps} and {@link BaseFormFieldProps}.
 * @returns The labelled control (popover or inline radio/checkbox list), description and error.
 */
export function SelectField(props: SelectFieldProps): ReactNode {
  const field = useFieldContext<string[]>();
  const form = useFormContext();
  const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts);
  const isOnModalSurface = useModalSurface();
  const invalid = isFieldShowingError({ field, submissionAttempts });
  const describedBy = fieldDescribedBy({ id: field.name, hasDescription: Boolean(props.description), showError: invalid });

  function handleToggle(value: string) {
    const current = field.state.value ?? [];
    if (props.hasMany) {
      field.handleChange(
        current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
      );
    } else {
      field.handleChange(current.includes(value) ? [] : [value]);
    }
  }

  if (props.renderControl) {
    const control = props.renderControl({
      id: field.name,
      value: field.state.value,
      onChange: field.handleChange,
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
      >
        {control}
      </FormFieldLayout>
    );
  }

  if (props.display === "radio") {
    const inlineLabel = (
      <span
        id={`${field.name}-label`}
        className="relative flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
      >
        {props.index !== undefined ? `[${props.index + 1}] - ` : ""}
        {props.label}
        {props.required && <span className="text-red-500">*</span>}
      </span>
    );
    const control = props.hasMany ? (
      <div
        role="group"
        aria-labelledby={`${field.name}-label`}
        aria-disabled={props.readOnly}
        className="flex flex-col gap-2"
      >
        {props.options.map((option, optionIndex) => (
          <label key={`${field.name}-option-${optionIndex}`} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={(field.state.value ?? []).includes(option.value)}
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
        aria-labelledby={`${field.name}-label`}
        disabled={props.readOnly}
        value={(field.state.value ?? [])[0]}
        onValueChange={(value) => field.handleChange([value as string])}
        onBlur={field.handleBlur}
        className="gap-2"
      >
        {props.options.map((option, optionIndex) => (
          <label key={`${field.name}-option-${optionIndex}`} className="flex items-center gap-2 text-sm">
            <RadioGroupItem
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
      onValuesChange={field.handleChange}
      single={!props.hasMany}
      values={field.state.value}
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
    >
      {control}
    </FormFieldLayout>
  );
}
