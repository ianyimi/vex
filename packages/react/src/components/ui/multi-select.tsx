"use client";

import { CheckIcon, ChevronsUpDownIcon, XIcon } from "lucide-react";
import { cn } from "../../styles/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { Badge } from "./badge";

type MultiSelectContextType = {
  open: boolean;
  // eslint-disable-next-line no-unused-vars
  setOpen: (open: boolean) => void;
  selectedValues: Set<string>;
  // eslint-disable-next-line no-unused-vars
  toggleValue: (value: string) => void;
  items: Map<string, ReactNode>;
  single: boolean;
  // eslint-disable-next-line no-unused-vars
  onItemAdded: (value: string, label: ReactNode) => void;
};
const MultiSelectContext = createContext<MultiSelectContextType | null>(null);

export function MultiSelect({
  children,
  values,
  defaultValues,
  onValuesChange,
  single = false,
  modal = false,
}: {
  children: ReactNode;
  values?: string[];
  defaultValues?: string[];
  // eslint-disable-next-line no-unused-vars
  onValuesChange?: (values: string[]) => void;
  single?: boolean;
  /**
   * Opt into modal popover behaviour — focus trap **and page scroll lock**.
   *
   * Defaults to `false`, and a form field must leave it that way. Base UI
   * engages `useScrollLock` on `modal === true`, which sets
   * `body { position: relative }` and then compensates by writing
   * `body.scrollTop`. When the page scrolls on `<html>` rather than `<body>` —
   * the normal case — that compensation misses, `html.scrollTop` collapses to
   * 0, and the page snaps to the top. The trigger goes offscreen and the
   * popover immediately closes, which makes any select below the fold
   * impossible to use.
   *
   * Set it only when the select is rendered inside an already-modal surface
   * (a dialog), matching `SimpleTimePicker`'s `modal` prop.
   */
  modal?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [internalValues, setInternalValues] = useState(
    new Set<string>(values ?? defaultValues),
  );
  const selectedValues = values ? new Set(values) : internalValues;
  const [items, setItems] = useState<Map<string, ReactNode>>(new Map());

  function toggleValue(value: string) {
    const getNewSet = (prev: Set<string>) => {
      if (single) {
        return prev.has(value) ? new Set<string>() : new Set<string>([value]);
      }
      const newSet = new Set(prev);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      return newSet;
    };
    setInternalValues(getNewSet);
    onValuesChange?.([...getNewSet(selectedValues)]);
    if (single) setOpen(false);
  }

  const onItemAdded = useCallback((value: string, label: ReactNode) => {
    setItems((prev) => {
      if (prev.get(value) === label) return prev;
      return new Map(prev).set(value, label);
    });
  }, []);

  return (
    <MultiSelectContext
      value={{
        open,
        setOpen,
        selectedValues,
        single,
        toggleValue,
        items,
        onItemAdded,
      }}
    >
      <Popover open={open} onOpenChange={setOpen} modal={modal}>
        {children}
      </Popover>
    </MultiSelectContext>
  );
}

export function MultiSelectTrigger({
  className,
  children,
  ...props
}: {
  className?: string;
  children?: ReactNode;
} & ComponentPropsWithoutRef<typeof PopoverTrigger>) {
  const { open } = useMultiSelectContext();

  return (
    <PopoverTrigger
      role="combobox"
      aria-expanded={open}
      {...props}
      className={cn(
        "flex h-auto min-h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
    >
      {children}
      <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
    </PopoverTrigger>
  );
}

export function MultiSelectValue({
  placeholder,
  clickToRemove = true,
  className,
  overflowBehavior = "wrap-when-open",
  ...props
}: {
  placeholder?: string;
  clickToRemove?: boolean;
  overflowBehavior?: "wrap" | "wrap-when-open" | "cutoff";
} & Omit<ComponentPropsWithoutRef<"div">, "children">) {
  const { selectedValues, toggleValue, items, open, single } =
    useMultiSelectContext();
  const [overflowAmount, setOverflowAmount] = useState(0);
  const valueRef = useRef<HTMLDivElement>(null);
  const overflowRef = useRef<HTMLDivElement>(null);

  const shouldWrap =
    overflowBehavior === "wrap" ||
    (overflowBehavior === "wrap-when-open" && open);

  const checkOverflow = useCallback(() => {
    if (valueRef.current == null) return;

    const containerElement = valueRef.current;
    const overflowElement = overflowRef.current;
    const items = containerElement.querySelectorAll<HTMLElement>(
      "[data-selected-item]",
    );

    if (overflowElement != null) overflowElement.style.display = "none";
    items.forEach((child) => child.style.removeProperty("display"));
    let amount = 0;
    for (let i = items.length - 1; i >= 0; i--) {
      const child = items[i]!;
      if (containerElement.scrollWidth <= containerElement.clientWidth) {
        break;
      }
      amount = items.length - i;
      child.style.display = "none";
      overflowElement?.style.removeProperty("display");
    }
    setOverflowAmount(amount);
  }, []);

  const handleResize = useCallback(
    (node: HTMLDivElement) => {
      valueRef.current = node;

      const mutationObserver = new MutationObserver(checkOverflow);
      const observer = new ResizeObserver(debounce(checkOverflow, 100));

      mutationObserver.observe(node, {
        childList: true,
        attributes: true,
        attributeFilter: ["class", "style"],
      });
      observer.observe(node);

      return () => {
        observer.disconnect();
        mutationObserver.disconnect();
        valueRef.current = null;
      };
    },
    [checkOverflow],
  );

  if (selectedValues.size === 0 && placeholder) {
    return (
      <span className="min-w-0 overflow-hidden font-normal text-muted-foreground">
        {placeholder}
      </span>
    );
  }

  if (single && selectedValues.size > 0) {
    const val = [...selectedValues][0]!;
    return (
      <span className="min-w-0 overflow-hidden">{items.get(val) ?? val}</span>
    );
  }

  return (
    <div
      {...props}
      ref={handleResize}
      className={cn(
        "flex flex-1 min-w-0 gap-1.5 overflow-hidden",
        shouldWrap && "h-full flex-wrap",
        className,
      )}
    >
      {[...selectedValues].map((value) => (
        <Badge
          variant="outline"
          data-selected-item
          className="group flex items-center gap-1"
          key={value}
          onClick={
            clickToRemove
              ? (e) => {
                  e.stopPropagation();
                  toggleValue(value);
                }
              : undefined
          }
        >
          {items.get(value) ?? value}
          {clickToRemove && (
            <XIcon className="size-2 text-muted-foreground group-hover:text-destructive" />
          )}
        </Badge>
      ))}
      <Badge
        style={{
          display: overflowAmount > 0 && !shouldWrap ? "block" : "none",
        }}
        variant="outline"
        ref={overflowRef}
      >
        +{overflowAmount}
      </Badge>
    </div>
  );
}

export function MultiSelectContent({
  search = true,
  children,
  ...props
}: {
  search?: boolean | { placeholder?: string; emptyMessage?: string };
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<typeof Command>, "children">) {
  const canSearch = typeof search === "object" ? true : search;
  const { open } = useMultiSelectContext();
  const commandRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // The popup's content is kept at `display: none` until floating-ui has
  // positioned the popup, then revealed, focused, and scrolled — all from
  // here, because timing cannot be trusted.
  //
  // A floating popup is positioned a frame or two AFTER it mounts; until
  // then it sits wherever the portal put it — the end of <body>, often
  // thousands of pixels from the trigger. Two things try to reach into it
  // during that window, and each natively scrolls the PAGE to the popup's
  // pre-position location (measured: a 1341px jump that threw the trigger
  // off the bottom of the viewport):
  //
  // 1. cmdk scrollIntoView()s its highlighted item in a layout effect at
  //    mount. scrollIntoView walks every scrollable ancestor and has no
  //    preventScroll option — it cannot be made safe, only made a no-op:
  //    an element with no boxes (display: none) is skipped per spec.
  // 2. Initial focus of an inner tabbable. Base UI preventScrolls only the
  //    popup element itself; the search input would get a plain focus().
  //    Focus is applied here instead, with `preventScroll: true`, after
  //    reveal (a display: none element is not focusable).
  //
  // Once positioned, the popup is fully inside the viewport (flip/shift),
  // so the post-reveal inner-list scroll satisfies every ancestor without
  // moving the page.
  useEffect(() => {
    if (!open) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        // Resolved inside the frame: the popup subtree may mount a tick
        // after `open` flips, so the ref is not trustworthy at effect time.
        const content = contentRef.current;
        if (!content) return;
        content.style.removeProperty("display");
        content
          .querySelector<HTMLElement>("[data-slot=command-input], [data-multiselect-focus]")
          ?.focus({ preventScroll: true });
        content
          .querySelector<HTMLElement>("[cmdk-item][aria-selected='true']")
          ?.scrollIntoView({ block: "nearest" });
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      contentRef.current?.style.setProperty("display", "none");
    };
  }, [open]);

  return (
    <>
      <div style={{ display: "none" }}>
        <Command>
          <CommandList>{children}</CommandList>
        </Command>
      </div>
      <PopoverContent className="w-(--anchor-width) p-0" initialFocus={false}>
        {/* Hidden until positioned; revealed by the effect above. */}
        <div ref={contentRef} style={{ display: "none" }}>
          <Command {...props} ref={commandRef}>
            {canSearch ? (
              <CommandInput
                placeholder={
                  typeof search === "object" ? search.placeholder : undefined
                }
              />
            ) : (
              // Focus target for keyboard navigation when there is no search
              // input. Focused by the effect above — never via `autoFocus`,
              // which fires on mount, strictly before positioning.
              <button data-multiselect-focus className="sr-only" type="button" />
            )}
            <CommandList>
              {canSearch && (
                <CommandEmpty>
                  {typeof search === "object" ? search.emptyMessage : undefined}
                </CommandEmpty>
              )}
              {children}
            </CommandList>
          </Command>
        </div>
      </PopoverContent>
    </>
  );
}

export function MultiSelectItem({
  value,
  children,
  badgeLabel,
  onSelect,
  ...props
}: {
  badgeLabel?: ReactNode;
  value: string;
} & Omit<ComponentPropsWithoutRef<typeof CommandItem>, "value">) {
  const { toggleValue, selectedValues, onItemAdded } = useMultiSelectContext();
  const isSelected = selectedValues.has(value);

  useEffect(() => {
    onItemAdded(value, badgeLabel ?? children);
  }, [value, children, onItemAdded, badgeLabel]);

  return (
    <CommandItem
      {...props}
      onSelect={() => {
        toggleValue(value);
        onSelect?.(value);
      }}
    >
      {children}
      {isSelected && <CheckIcon className="ml-auto size-4" />}
    </CommandItem>
  );
}

export function MultiSelectGroup(
  props: ComponentPropsWithoutRef<typeof CommandGroup>,
) {
  return <CommandGroup {...props} />;
}

export function MultiSelectSeparator(
  props: ComponentPropsWithoutRef<typeof CommandSeparator>,
) {
  return <CommandSeparator {...props} />;
}

function useMultiSelectContext() {
  const context = useContext(MultiSelectContext);
  if (context == null) {
    throw new Error(
      "useMultiSelectContext must be used within a MultiSelectContext",
    );
  }
  return context;
}

// eslint-disable-next-line no-unused-vars
function debounce<T extends (...args: never[]) => void>(
  func: T,
  wait: number,
  // eslint-disable-next-line no-unused-vars
): (...args: Parameters<T>) => void {
  // eslint-disable-next-line no-undef
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function (this: unknown, ...args: Parameters<T>) {
    // eslint-disable-next-line no-undef
    if (timeout) clearTimeout(timeout);
    // eslint-disable-next-line no-undef
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
