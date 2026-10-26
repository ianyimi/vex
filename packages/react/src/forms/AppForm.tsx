"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { type AnyFormApi, useStore } from "@tanstack/react-form";
import { formContext } from "./formContext";
import { DndProvider } from "../ui/dnd";
import { ACCORDION_TRANSITION_MS } from "../ui/accordion";
import { cn } from "../utils/cn";
import { FormCompactContext, useMeasuredCompact } from "./FormCompactContext";

/**
 * The attempt number of the latest submit that ended without success, `0`
 * until the first one (or while a submit is in flight). A local copy of the
 * one pure helper `AppForm` needs — defined here rather than imported from
 * `forms/useFieldErrorCount.ts` (step 10) to avoid a forward reference to a
 * file this step does not yet create; step 10's `useFieldErrorCount.ts`
 * exports the identical function for its own callers, not re-exported from
 * here.
 *
 * @param state - The form store state to read submission status from.
 * @returns The failed attempt number, or `0` if no attempt has failed yet.
 */
function failedSubmitAttemptOf(state: {
  submissionAttempts: number;
  isSubmitting: boolean;
  isSubmitSuccessful: boolean;
}): number {
  return state.submissionAttempts > 0 && !state.isSubmitting && !state.isSubmitSuccessful
    ? state.submissionAttempts
    : 0;
}

/**
 * Provides a TanStack Form instance to all descendant app form field
 * components via `formContext`.
 *
 * Wrap any set of `forms/*Field.tsx` components (rendered through
 * `form.AppField`) in `<AppForm>` and they read the form from context — no
 * prop threading needed.
 *
 * The `<form>` is `noValidate`: this app's own Zod schemas are the single
 * source of truth for validation messages, rendered through
 * `FormFieldLayout`. Any field that also sets a native HTML constraint
 * attribute (e.g. `checkbox`'s `required`, kept for its ARIA/semantic value)
 * would otherwise trigger the browser's own constraint-validation UI on
 * submit — which blocks the submit event entirely before this app's
 * `onSubmit` validator ever runs, so the custom message never renders.
 *
 * @param props - Component props.
 * @param props.form - The TanStack Form instance created by `useForm` (or
 *   `useAppForm`). Provided to all descendant field components via
 *   `formContext`.
 * @param props.children - Field components and any other form content
 *   (submit button, etc.).
 * @param props.className - Optional CSS class applied to the `<form>` element.
 * @returns A `<form>` element wrapped in `formContext.Provider`, distributing
 *   the form instance to all descendant field components.
 * @example
 * ```tsx
 * const form = useAppForm({ defaultValues: { title: "", slug: "" } })
 *
 * <AppForm form={form}>
 *   <form.AppField name="title">{(field) => <field.TextField label="Title" />}</form.AppField>
 *   <form.AppField name="slug">{(field) => <field.TextField label="Slug" />}</form.AppField>
 * </AppForm>
 * ```
 */
export function AppForm(props: {
  form: AnyFormApi;
  children: ReactNode;
  className?: string;
}): ReactNode {
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
    <formContext.Provider value={props.form}>
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
    </formContext.Provider>
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
    const centerOffset =
      targetRect.top - scrollerRect.top - (scroller.clientHeight - targetRect.height) / 2;
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
