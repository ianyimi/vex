import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";

import { cn } from "../../styles/utils";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { ReactNode } from "react";

function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn("flex w-full flex-col", className)}
      {...props}
    />
  );
}

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("not-last:border-b", className)}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  postIconChildren,
  ...props
}: { postIconChildren?: ReactNode } & AccordionPrimitive.Trigger.Props) {
  return (
    <AccordionPrimitive.Header className="flex items-center">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group/accordion-trigger relative flex flex-1 items-center justify-between rounded-md border border-transparent py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:after:border-ring aria-disabled:pointer-events-none aria-disabled:opacity-50 **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-4 **:data-[slot=accordion-trigger-icon]:text-muted-foreground",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon
          data-slot="accordion-trigger-icon"
          className="pointer-events-none self-center shrink-0 group-aria-expanded/accordion-trigger:hidden"
        />
        <ChevronUpIcon
          data-slot="accordion-trigger-icon"
          className="pointer-events-none self-center hidden shrink-0 group-aria-expanded/accordion-trigger:inline"
        />
      </AccordionPrimitive.Trigger>
      {/* Rendered as a Header sibling, NOT inside AccordionPrimitive.Trigger —
          Trigger renders a native <button>, so nesting another interactive
          element (e.g. a <Button>) inside it produces invalid
          `<button> cannot be a descendant of <button>` HTML and hydration
          errors. It also keeps the action clickable without needing
          `e.stopPropagation()` to avoid toggling the accordion. */}
      {postIconChildren}
    </AccordionPrimitive.Header>
  );
}

/**
 * The collapsible panel.
 *
 * Animates with a CSS TRANSITION on the inner wrapper's height, driven by Base
 * UI's own `data-starting-style`/`data-ending-style` attributes and its
 * `--accordion-panel-height` var — not with the `animate-accordion-*`
 * keyframes.
 *
 * The keyframes were the cause of the open-by-default flash and could not be
 * salvaged. `tw-animate-css` animates `height: 0` toward
 * `--radix/bits/reka/kb-accordion-content-height`, none of which Base UI sets
 * (it publishes `--accordion-panel-height`), so the animation ran from zero to
 * a bogus end value on mount: measured ~70ms at `height: 0` while the content
 * was already full height. Withholding the class until after mount only moved
 * the problem — applying an `animation-*` class to an element that already
 * matches `data-open` starts the animation at that moment instead.
 *
 * A transition has no such failure mode: it interpolates only when the height
 * actually changes, so a panel that mounts open is simply open, and a panel
 * that mounts closed is simply closed.
 */
function AccordionContent({ className, children, ...props }: AccordionPrimitive.Panel.Props) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      className="overflow-hidden text-sm"
      {...props}
    >
      <div
        className={cn(
          "h-(--accordion-panel-height) pt-0 pb-4 transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
          className,
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Panel>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
