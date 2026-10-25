import { Radio as RadioPrimitive, RadioGroup as RadioGroupPrimitive } from "@base-ui/react";

import { cn } from "../../styles/utils";

/** Styled radio group built on Base UI `RadioGroup`, sharing selection state across its `RadioGroupItem` children. */
function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

/** Styled radio button built on Base UI `Radio.Root` with a filled-dot `Radio.Indicator`. */
function RadioGroupItem({ className, ...props }: RadioPrimitive.Root.Props) {
  return (
    <RadioPrimitive.Root
      data-slot="radio-group-item"
      className={cn(
        "relative flex size-4 shrink-0 items-center justify-center rounded-full border border-input shadow-xs transition-shadow outline-none group-has-disabled/field:opacity-50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:border-primary",
        className,
      )}
      {...props}
    >
      <RadioPrimitive.Indicator
        data-slot="radio-group-item-indicator"
        className="size-2 rounded-full bg-primary"
      />
    </RadioPrimitive.Root>
  );
}

export { RadioGroup, RadioGroupItem };
