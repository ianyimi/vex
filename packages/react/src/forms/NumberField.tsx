"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useStore } from "@tanstack/react-form";
import { useFieldContext, useFormContext } from "./formContext";
import { FormFieldLayout, fieldDescribedBy, isFieldShowingError } from "./FormFieldLayout";
import { Input } from "../ui/input";
import type { BaseFormFieldProps, FieldControlProps } from "./types";

const BIGINT_INPUT_PATTERN = /^-?\d+$/;
const BIGINT_PARSE_ERROR = "Must be a whole number.";

/** Shared `NumberField` props, regardless of `bigint` mode. */
interface NumberFieldPropsBase {
  placeholder?: string;
  step?: number;
}

/** `NumberField` bound to a plain `number` (the default). */
export interface Float64NumberFieldProps extends NumberFieldPropsBase, BaseFormFieldProps<number> {
  bigint?: false;
  min?: number;
  max?: number;
}

/** `NumberField` bound to a `bigint` (int64 storage) — an integer-only text entry. */
export interface Int64NumberFieldProps extends NumberFieldPropsBase, BaseFormFieldProps<bigint> {
  bigint: true;
  min?: bigint;
  max?: bigint;
}

/** Props for {@link NumberField}. */
export type NumberFieldProps = Float64NumberFieldProps | Int64NumberFieldProps;

/** Props for {@link BigintNumberControl} — {@link FieldControlProps} plus the attributes `NumberField`'s own layout normally supplies, needed here too since an `admin.components.Input` override's `renderDefault` renders this directly. */
export interface BigintNumberControlProps extends FieldControlProps<bigint> {
  placeholder?: string;
  required?: boolean;
}

/**
 * The `bigint` (int64 storage) number field's control: an integer-only text
 * entry, selecting its whole value on focus so a prefilled digit is
 * replaced by typing rather than appended to, empty-string-to-`undefined`
 * handling, and a "Must be a whole number." field error (via
 * `field.setMeta`, read from the nearest `<form.AppField>` through
 * `useFieldContext`) for a non-integer keystroke. A lone `-` is a tolerated
 * interim state (no error, nothing committed yet) on the way to typing a
 * negative number.
 *
 * Controlled by its own `text` state rather than `props.value` directly —
 * every valid or interim keystroke updates `text` without waiting on the
 * commit round-trip, so typing never stutters — but `props.value` is still
 * the source of truth for an externally-driven change (a version switch, a
 * post-save reset, a live merge, a null restore): `lastValueRef` tracks the
 * value this control itself last committed, and an effect re-syncs `text`
 * from `props.value` — clearing any pending "Must be a whole number." error
 * along with it, since the invalid text it was reporting on no longer
 * exists — only when the two diverge, i.e. only when something OTHER than
 * this control's own `onChange` changed it.
 *
 * The single implementation of this control — `NumberField`'s own
 * `bigint: true` mode (no `renderControl` override given) and
 * `fields/number/Field.tsx`'s `renderInt64Control` (the `renderDefault` an
 * `admin.components.Input` override chain falls back to) both render this
 * component, so an override gets identical behavior to the plain field.
 *
 * @param props - See {@link BigintNumberControlProps}.
 * @returns The integer-only text `<Input>`.
 */
export function BigintNumberControl(props: BigintNumberControlProps): ReactNode {
  const field = useFieldContext<bigint>();
  const [text, setText] = useState(() =>
    props.value !== undefined && props.value !== null ? String(props.value) : "",
  );
  const lastValueRef = useRef<bigint | undefined>(props.value);

  useEffect(() => {
    if (props.value !== lastValueRef.current) {
      lastValueRef.current = props.value;
      setText(props.value !== undefined && props.value !== null ? String(props.value) : "");
      field.setMeta((prev) => ({ ...prev, errorMap: { ...prev.errorMap, onChange: undefined } }));
    }
  }, [props.value]);

  return (
    <Input
      id={props.id}
      type="text"
      inputMode="numeric"
      disabled={props.readOnly}
      value={text}
      onFocus={(e) => e.currentTarget.select()}
      onInput={(e) => {
        const raw = e.currentTarget.value;
        setText(raw);
        if (raw === "" || raw === "-") {
          field.setMeta((prev) => ({ ...prev, errorMap: { ...prev.errorMap, onChange: undefined } }));
          if (raw === "") {
            lastValueRef.current = undefined;
            props.onChange(undefined as unknown as bigint);
          }
          return;
        }
        if (!BIGINT_INPUT_PATTERN.test(raw)) {
          field.setMeta((prev) => ({
            ...prev,
            isTouched: true,
            errorMap: { ...prev.errorMap, onChange: BIGINT_PARSE_ERROR },
          }));
          return;
        }
        field.setMeta((prev) => ({ ...prev, errorMap: { ...prev.errorMap, onChange: undefined } }));
        const next = BigInt(raw);
        lastValueRef.current = next;
        props.onChange(next);
      }}
      onBlur={props.onBlur}
      placeholder={props.placeholder}
      aria-required={props.required}
      aria-invalid={props.invalid}
      aria-describedby={props.describedBy}
    />
  );
}

/**
 * A number field bound to the nearest `<form.AppField name="...">`.
 * `step`/`min`/`max` are forwarded as native HTML attributes only — UI
 * affordances, never client-side clamping. `bigint: true` renders an
 * integer-only text entry bound to a `bigint` value (int64 storage) instead
 * of the native `number` input, whose `value`/`onChange` lose precision
 * above `Number.MAX_SAFE_INTEGER`.
 *
 * @param props - See {@link NumberFieldProps} and {@link BaseFormFieldProps}.
 * @returns The labelled control, description and error.
 */
export function NumberField(props: NumberFieldProps): ReactNode {
  const field = useFieldContext<number | bigint>();
  const form = useFormContext();
  const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts);
  const invalid = isFieldShowingError({ field, submissionAttempts });
  const describedBy = fieldDescribedBy({ id: field.name, hasDescription: Boolean(props.description), showError: invalid });

  let control: ReactNode;
  if (props.bigint) {
    const value = field.state.value as bigint;
    const onChange = field.handleChange as (value: bigint) => void;
    control = props.renderControl ? (
      props.renderControl({
        id: field.name,
        value,
        onChange,
        onBlur: field.handleBlur,
        readOnly: Boolean(props.readOnly),
        invalid,
        describedBy,
      })
    ) : (
      <BigintNumberControl
        id={field.name}
        value={value}
        onChange={onChange}
        onBlur={field.handleBlur}
        readOnly={Boolean(props.readOnly)}
        invalid={invalid}
        describedBy={describedBy}
        placeholder={props.placeholder}
        required={props.required}
      />
    );
  } else {
    const value = field.state.value as number;
    const onChange = field.handleChange as (value: number) => void;
    control = props.renderControl ? (
      props.renderControl({
        id: field.name,
        value,
        onChange,
        onBlur: field.handleBlur,
        readOnly: Boolean(props.readOnly),
        invalid,
        describedBy,
      })
    ) : (
      <Input
        id={field.name}
        type="number"
        disabled={props.readOnly}
        step={props.step}
        min={props.min}
        max={props.max}
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value === "" ? (undefined as unknown as number) : Number(e.target.value))
        }
        onBlur={field.handleBlur}
        placeholder={props.placeholder}
        aria-required={props.required}
        aria-invalid={invalid}
        aria-describedby={describedBy}
      />
    );
  }

  return (
    <FormFieldLayout
      id={field.name}
      label={props.label}
      required={props.required}
      description={props.description}
      index={props.index}
      field={field}
      submissionAttempts={submissionAttempts}
      before={props.before}
      after={props.after}
      className={props.className}
      readOnly={props.readOnly}
    >
      {control}
    </FormFieldLayout>
  );
}
