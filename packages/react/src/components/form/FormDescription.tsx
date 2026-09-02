import { AdminField } from "@vexcms/core";
import { Activity, ComponentPropsWithRef } from "react";
import { cn } from "../../styles/utils";

/**
 * Renders a field's description text below the input in the admin form.
 *
 * Hidden when `field.description` is empty or absent — the parent `Activity`
 * component handles the conditional rendering with an animated transition.
 * Any remaining props (e.g. `id` for `aria-describedby`) are forwarded to the
 * `<p>` element.
 *
 * @param props - Component props.
 * @param props.field - The resolved field definition. Reads `field.description`.
 * @param props.className - Additional CSS classes on the `<p>` element.
 * @returns The description `<p>`, hidden via `Activity` when there is no description.
 */
export function FormDescription({
  field,
  className,
  ...pProps
}: {
  field: AdminField;
} & ComponentPropsWithRef<"p">) {
  return (
    <Activity mode={field.description ? "visible" : "hidden"}>
      <p
        className={cn("text-[0.8rem] text-muted-foreground", className)}
        {...pProps}
      >
        {field.description}
      </p>
    </Activity>
  );
}
