"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Activity, useMemo } from "react";
import type { ComponentProps, ReactNode } from "react";
import { Label } from "./label";
import { Separator } from "./separator";
import { cn } from "../utils/cn";

/** Groups a set of {@link Field}s with consistent vertical rhythm. */
export function FieldGroup({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "gap-7 data-[slot=checkbox-group]:gap-3 [&>[data-slot=field-group]]:gap-4 group/field-group @container/field-group flex w-full flex-col",
        className,
      )}
      data-slot="field-group"
      {...props}
    />
  );
}

/** A `<legend>` for a {@link FieldSet}, in `"label"` or `"legend"` type size. */
export function FieldLegend({
  className,
  variant = "legend",
  ...props
}: ComponentProps<"legend"> & { variant?: "label" | "legend" }) {
  return (
    <legend
      className={cn(
        "mb-3 font-medium data-[variant=label]:text-sm data-[variant=legend]:text-base",
        className,
      )}
      data-slot="field-legend"
      data-variant={variant}
      {...props}
    />
  );
}

/** A `<fieldset>` grouping related {@link Field}s. */
export function FieldSet({ className, ...props }: ComponentProps<"fieldset">) {
  return (
    <fieldset
      className={cn(
        "gap-6 has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3 flex flex-col",
        className,
      )}
      data-slot="field-set"
      {...props}
    />
  );
}

const fieldVariants = cva("data-[invalid=true]:text-destructive gap-0 group/field flex w-full", {
  defaultVariants: {
    orientation: "vertical",
  },
  variants: {
    orientation: {
      horizontal:
        "flex-row items-center [&>[data-slot=field-label]]:flex-auto has-[>[data-slot=field-content]]:items-start has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      responsive:
        "flex-col [&>*]:w-full [&>.sr-only]:w-auto @md/field-group:flex-row @md/field-group:items-center @md/field-group:[&>*]:w-auto @md/field-group:[&>[data-slot=field-label]]:flex-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      vertical: "flex-col [&>*]:w-full [&>.sr-only]:w-auto",
    },
  },
});

/**
 * One label/control/description/error group — label and description stack
 * tight above the control (4px/8px, managed by {@link FormFieldLayout} via
 * per-child margins, not a container `gap`); `role="group"` so screen
 * readers announce it as a unit.
 */
export function Field({
  className,
  orientation = "vertical",
  ...props
}: ComponentProps<"div"> & VariantProps<typeof fieldVariants>) {
  return (
    <div
      className={cn(fieldVariants({ orientation }), className)}
      data-orientation={orientation}
      data-slot="field"
      role="group"
      {...props}
    />
  );
}

/** Wraps a {@link Field}'s control plus its description/error, beside its {@link FieldLabel}. */
export function FieldContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("gap-1 group/field-content flex flex-1 flex-col leading-snug", className)}
      data-slot="field-content"
      {...props}
    />
  );
}

/** A {@link Field}'s helper text — shown directly under its label, above its control. */
export function FieldDescription({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "text-muted-foreground text-left text-[0.8rem] [[data-variant=legend]+&]:-mt-1.5 leading-normal font-normal group-has-[[data-orientation=horizontal]]/field:text-balance",
        "[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4",
        className,
      )}
      data-slot="field-description"
      {...props}
    />
  );
}

/**
 * A {@link Field}'s validation error — `children` when given, otherwise the
 * single message from `errors`, or a bulleted list when `errors` holds more
 * than one distinct message. Renders nothing when there is no content.
 */
export function FieldError({
  children,
  className,
  errors,
  ...props
}: ComponentProps<"div"> & {
  errors?: Array<undefined | { message?: string }>;
}) {
  const content = useMemo<ReactNode>(() => {
    if (children) return children;
    if (!errors?.length) return null;
    const uniqueErrors = [...new Map(errors.map((error) => [error?.message, error])).values()];
    if (uniqueErrors.length === 1) return uniqueErrors[0]?.message;
    return (
      <ul className="ml-4 flex list-disc flex-col gap-1">
        {uniqueErrors.map((error, index) => error?.message && <li key={index}>{error.message}</li>)}
      </ul>
    );
  }, [children, errors]);

  if (!content) return null;

  return (
    <div
      className={cn("text-destructive text-[0.8rem] font-normal", className)}
      data-slot="field-error"
      role="alert"
      {...props}
    >
      {content}
    </div>
  );
}

/** A {@link Field}'s label. */
export function FieldLabel({ className, ...props }: ComponentProps<typeof Label>) {
  return (
    <Label
      className={cn(
        "has-data-checked:bg-primary/5 has-data-checked:border-primary dark:has-data-checked:bg-primary/10 gap-2 group-data-[disabled=true]/field:opacity-50 has-[>[data-slot=field]]:rounded-md has-[>[data-slot=field]]:border [&>*]:data-[slot=field]:p-3 group/field-label peer/field-label flex w-fit leading-snug",
        "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col",
        className,
      )}
      data-slot="field-label"
      {...props}
    />
  );
}

/**
 * The `role="group"` wrapper fields with no single focusable control to
 * `<label htmlFor>` (relationship/upload/richtext) use instead of
 * {@link FormFieldLayout} — same label → description → control → error
 * order and spacing tokens (4px label-description, 8px description-control),
 * built from per-child margins rather than a container `gap` so the hidden
 * `<Activity>` description never adds space when absent.
 *
 * @param props.labelId - The id `aria-labelledby` points at; the caller's `label` must carry it.
 * @param props.label - The field's own label markup (not a `<label>` — no single control to associate).
 * @param props.description - Helper text rendered between the label and `children`.
 * @param props.disabled - Forwarded to `aria-disabled`.
 * @param props.error - The field's validation error, rendered after `children`.
 * @param props.children - The control(s).
 * @returns The labelled, grouped field body.
 */
export function FieldGroupBox(props: {
  labelId: string;
  label: ReactNode;
  description?: string;
  disabled?: boolean;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
}): ReactNode {
  return (
    <div
      className={cn("flex flex-col", props.className)}
      role="group"
      aria-labelledby={props.labelId}
      aria-disabled={props.disabled}
    >
      {props.label}
      <Activity mode={props.description ? "visible" : "hidden"}>
        <FieldDescription className="mt-1" data-slot="form-description">
          {props.description}
        </FieldDescription>
      </Activity>
      <div className="flex flex-col gap-1 mt-2">
        {props.children}
        {props.error}
      </div>
    </div>
  );
}

/** A horizontal rule between {@link Field}s, optionally with centered `children`. */
export function FieldSeparator({
  children,
  className,
  ...props
}: ComponentProps<"div"> & { children?: ReactNode }) {
  return (
    <div
      className={cn(
        "-my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2 relative",
        className,
      )}
      data-content={!!children}
      data-slot="field-separator"
      {...props}
    >
      <Separator className="absolute inset-0 top-1/2" />
      {children && (
        <span
          className="text-muted-foreground px-2 bg-background relative mx-auto block w-fit"
          data-slot="field-separator-content"
        >
          {children}
        </span>
      )}
    </div>
  );
}

/** A {@link Field}'s title, for a `Field` whose control is itself a labelled group. */
export function FieldTitle({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "gap-2 text-sm font-medium group-data-[disabled=true]/field:opacity-50 flex w-fit items-center leading-snug",
        className,
      )}
      data-slot="field-label"
      {...props}
    />
  );
}
