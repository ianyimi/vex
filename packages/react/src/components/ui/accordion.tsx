import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";

import { cn } from "../../styles/utils";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { type ReactNode, type RefObject, useRef } from "react";

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

/**
 * The expand/collapse chevron for a header whose controls sit between the
 * trigger and the chevron. Rendered as siblings AFTER an
 * `AccordionPrimitive.Trigger` carrying `peer/accordion-trigger`, it reads the
 * trigger's `aria-expanded` through the peer and forwards clicks to it — a
 * `<button>` cannot contain the controls, so the chevron lives outside it.
 *
 * @param props.triggerRef - The trigger this chevron opens and closes.
 * @param props.className - Extra classes for both icons (spacing).
 */
function AccordionTriggerChevron(props: {
  triggerRef: RefObject<HTMLButtonElement | null>;
  className?: string;
}) {
  const iconClassName = cn(
    "size-4 shrink-0 cursor-pointer self-center text-muted-foreground",
    props.className,
  );
  return (
    <>
      <ChevronDownIcon
        aria-hidden
        className={cn(iconClassName, "peer-aria-expanded/accordion-trigger:hidden")}
        onClick={() => props.triggerRef.current?.click()}
      />
      <ChevronUpIcon
        aria-hidden
        className={cn(iconClassName, "hidden peer-aria-expanded/accordion-trigger:inline")}
        onClick={() => props.triggerRef.current?.click()}
      />
    </>
  );
}

/**
 * Accordion header with its trigger. `leading` renders before the trigger
 * (a drag handle); `actions` render between the trigger and the chevron (via
 * `AccordionTriggerChevron`); `postIconChildren` render after the chevron.
 * All sit outside the trigger's native `<button>`, so nesting a `<Button>`
 * never produces `<button> cannot be a descendant of <button>` hydration
 * errors and clicking one never toggles the item.
 */
function AccordionTrigger({
  className,
  children,
  leading,
  actions,
  postIconChildren,
  ...props
}: {
  leading?: ReactNode;
  actions?: ReactNode;
  postIconChildren?: ReactNode;
} & AccordionPrimitive.Trigger.Props) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <AccordionPrimitive.Header className="flex items-center">
      {leading !== undefined && <div className="flex shrink-0 items-center pl-3">{leading}</div>}
      <AccordionPrimitive.Trigger
        ref={triggerRef}
        data-slot="accordion-trigger"
        className={cn(
          "peer/accordion-trigger group/accordion-trigger relative flex min-w-0 flex-1 items-center justify-between rounded-md border border-transparent py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:after:border-ring aria-disabled:pointer-events-none aria-disabled:opacity-50 **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-4 **:data-[slot=accordion-trigger-icon]:text-muted-foreground",
          className,
        )}
        {...props}
      >
        {children}
        {actions === undefined && (
          <>
            <ChevronDownIcon
              data-slot="accordion-trigger-icon"
              className="pointer-events-none self-center shrink-0 group-aria-expanded/accordion-trigger:hidden"
            />
            <ChevronUpIcon
              data-slot="accordion-trigger-icon"
              className="pointer-events-none self-center hidden shrink-0 group-aria-expanded/accordion-trigger:inline"
            />
          </>
        )}
      </AccordionPrimitive.Trigger>
      {actions !== undefined && (
        <>
          <div className="flex shrink-0 items-center gap-1">{actions}</div>
          <AccordionTriggerChevron triggerRef={triggerRef} className="mx-3" />
        </>
      )}
      {postIconChildren}
    </AccordionPrimitive.Header>
  );
}

/** Duration of `AccordionContent`'s height transition — its `duration-200` class. */
export const ACCORDION_TRANSITION_MS = 200;

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

export { Accordion, AccordionItem, AccordionTrigger, AccordionTriggerChevron, AccordionContent };
