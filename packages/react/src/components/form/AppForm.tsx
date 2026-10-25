"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { useStore, FormAsyncValidateOrFn, FormValidateOrFn } from "@tanstack/react-form";
import { AppFormContext, type AnyFormApi } from "./AppFormContext";
import { DndProvider } from "../ui/dnd";
import { ACCORDION_TRANSITION_MS } from "../ui/accordion";
import { failedSubmitAttemptOf } from "../../hooks/useFieldErrorCount";
import { cn } from "../../styles/utils";
import { FormCompactContext, useMeasuredCompact } from "./FormCompactContext";

/**
 * Provides a TanStack Form instance to all descendant field input components.
 *
 * Wrap any set of `TextFieldInput` (or other field input) components in `<AppForm>`
 * and they will read the form from context — no prop threading needed.
 *
 * The `name` prop on each input must match the corresponding key in `form.defaultValues`.
 *
 * The `<form>` is `noValidate`: this app's own Zod schemas (via `adminFieldToInputSchema`)
 * are the single source of truth for validation messages, rendered through `FormError`.
 * Any field that also sets a native HTML constraint attribute (e.g. `checkbox`'s
 * `required`, kept for its ARIA/semantic value) would otherwise trigger the browser's
 * own constraint-validation UI on submit — which blocks the submit event entirely
 * before this app's `onSubmit` validator ever runs, so the custom message never renders.
 *
 * @param props - Component props.
 * @param props.form - The TanStack Form instance created by `useForm`. Provided to all
 *   descendant field input components via `AppFormContext`.
 * @param props.children - Field input components and any other form content (submit button, etc.).
 * @param props.className - Optional CSS class applied to the `<form>` element.
 * @returns A `<form>` element wrapped in `AppFormContext.Provider`, distributing the form
 *   instance to all descendant field input components.
 * @example
 * ```tsx
 * const form = useForm({ defaultValues: { title: "", slug: "" } })
 *
 * <AppForm form={form}>
 *   <TextFieldInput name="title" fieldDef={titleField} readOnly={false} />
 *   <TextFieldInput name="slug"  fieldDef={slugField}  readOnly={false} />
 * </AppForm>
 * ```
 */
export function AppForm<
  TFormData extends any = any,
  TOnMount extends undefined | FormValidateOrFn<TFormData> = undefined,
  TOnChange extends undefined | FormValidateOrFn<TFormData> = undefined,
  TOnChangeAsync extends undefined | FormAsyncValidateOrFn<TFormData> = undefined,
  TOnBlur extends undefined | FormValidateOrFn<TFormData> = undefined,
  TOnBlurAsync extends undefined | FormAsyncValidateOrFn<TFormData> = undefined,
  TOnSubmit extends undefined | FormValidateOrFn<TFormData> = undefined,
  TOnSubmitAsync extends undefined | FormAsyncValidateOrFn<TFormData> = undefined,
  TOnDynamic extends undefined | FormValidateOrFn<TFormData> = undefined,
  TOnDynamicAsync extends undefined | FormAsyncValidateOrFn<TFormData> = undefined,
  TOnServer extends undefined | FormAsyncValidateOrFn<TFormData> = undefined,
  TSubmitMeta extends any = any,
>(props: {
  form: AnyFormApi<
    TFormData,
    TOnMount,
    TOnChange,
    TOnChangeAsync,
    TOnBlur,
    TOnBlurAsync,
    TOnSubmit,
    TOnSubmitAsync,
    TOnDynamic,
    TOnDynamicAsync,
    TOnServer,
    TSubmitMeta
  >;
  children: ReactNode;
  className?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const failedSubmitAttempt = useStore(props.form.store, failedSubmitAttemptOf);
  const compact = useMeasuredCompact(formRef);
  useEffect(() => {
    if (failedSubmitAttempt === 0) return;
    let cancelled = false;
    let scrollTimer: number | undefined;
    const validateTimer = window.setTimeout(async () => {
      await props.form.validate("submit");
      if (cancelled) return;
      scrollTimer = window.setTimeout(() => {
        if (!cancelled && formRef.current) focusFirstFieldError(formRef.current);
      }, ACCORDION_TRANSITION_MS);
    });
    return () => {
      cancelled = true;
      window.clearTimeout(validateTimer);
      window.clearTimeout(scrollTimer);
    };
  }, [failedSubmitAttempt]);

  return (
    <AppFormContext.Provider value={props.form}>
      <FormCompactContext.Provider value={compact}>
        <DndProvider>
          <form
            ref={formRef}
            className={cn("@container/form", props.className)}
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              props.form.handleSubmit();
            }}
          >
            {props.children}
          </form>
        </DndProvider>
      </FormCompactContext.Provider>
    </AppFormContext.Provider>
  );
}

const FOCUSABLE_SELECTOR =
  'input:not([type="hidden"]), textarea, select, [contenteditable="true"], button, [tabindex]:not([tabindex="-1"])';

/**
 * Scrolls the first visible errored field to the center of its nearest
 * scrolling ancestor and focuses its control. "First" is DOM order among
 * `[data-field-invalid]` wrappers that are not inside a hidden panel; a
 * wrapper is marked when it or anything under it has an error, so the
 * innermost one (no marked descendant) is the field itself rather than its
 * group or array.
 *
 * Not `scrollIntoView`: that scrolls every scrollable ancestor, and the admin
 * shell's `main` sits around the form's own scroller with a few pixels of
 * overflow — it would scroll `main` too and leave the page shifted past its
 * bottom.
 *
 * @param root - The form's root element to search within.
 */
function focusFirstFieldError(root: HTMLElement): void {
  const visible = [...root.querySelectorAll<HTMLElement>("[data-field-invalid]")].filter(
    (element) => element.closest("[hidden]") === null,
  );
  const target = visible.find(
    (element) => !visible.some((other) => other !== element && element.contains(other)),
  );
  if (!target) return;
  const scroller = nearestScroller(target);
  if (scroller) {
    const scrollerRect = scroller.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const centerOffset = targetRect.top - scrollerRect.top - (scroller.clientHeight - targetRect.height) / 2;
    scroller.scrollTo({ top: scroller.scrollTop + centerOffset, behavior: "smooth" });
  }
  target.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus({ preventScroll: true });
}

function nearestScroller(element: HTMLElement): HTMLElement | null {
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    const { overflowY } = getComputedStyle(parent);
    if ((overflowY === "auto" || overflowY === "scroll") && parent.scrollHeight > parent.clientHeight) {
      return parent;
    }
  }
  return null;
}
