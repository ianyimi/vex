"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { useLocalStorage } from "@ts-hooks-kit/core";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "../utils/cn";
import { Badge } from "./badge";
import { ScrollArea } from "./scroll-area";

/**
 * Props for {@link ScrollSection}.
 */
export interface ScrollSectionProps extends Omit<ComponentProps<"div">, "title"> {
  /** Section header text, shown above the scroll area when provided. */
  title?: string;
  /** A trailing count badge next to `title` (e.g. the number of matching views). */
  count?: number;
  /** When `true`, the header becomes a toggle collapsing the body. */
  collapsible?: boolean;
  /** Initial collapsed state when `collapsible` and no `persistKey` (or no stored value yet) applies. @default false */
  defaultCollapsed?: boolean;
  /** `useLocalStorage` key remembering the collapsed state per browser (Decision 31's "Which groups are collapsed is remembered per browser"). Omit for session-only collapse state. */
  persistKey?: string;
  /** Fixed height — the section always takes this much space. Mutually exclusive with `maxHeight`. */
  height?: string | number;
  /** Maximum height before the internal `ScrollArea` kicks in — the section shrinks to fit shorter content. Mutually exclusive with `height`. */
  maxHeight?: string | number;
  children: ReactNode;
}

/**
 * A thin, prop-driven wrapper around `ScrollArea` for every fixed/max-height
 * scroll container in the admin panel (Decision 31): the views menu, the
 * columns menu, the filter builder, the Inspect peek, and relationship/
 * media pickers. Composes `ScrollArea` with an optional collapsible header
 * instead of introducing a new primitive.
 *
 * @param props - Component props. See {@link ScrollSectionProps}.
 * @returns The section, or just its (possibly collapsed) body when `title` is omitted.
 */
export function ScrollSection(props: ScrollSectionProps) {
  const {
    title,
    count,
    collapsible,
    defaultCollapsed = false,
    persistKey,
    height,
    maxHeight,
    children,
    className,
    ...divProps
  } = props;

  // `useLocalStorage`/`useState` are both called unconditionally (Rules of
  // Hooks) — only the branch matching `persistKey`'s presence is ever read.
  const [persistedCollapsed, setPersistedCollapsed] = useLocalStorage<boolean>(
    persistKey ?? "__scroll-section-unused__",
    defaultCollapsed,
  );
  const [sessionCollapsed, setSessionCollapsed] = useState(defaultCollapsed);
  const collapsed = persistKey !== undefined ? persistedCollapsed : sessionCollapsed;
  const setCollapsed = persistKey !== undefined ? setPersistedCollapsed : setSessionCollapsed;

  const body =
    collapsible && collapsed ? null : (
      <ScrollArea style={{ height, maxHeight }} className={cn("min-h-0", className)} {...divProps}>
        {children}
      </ScrollArea>
    );

  if (title === undefined) return body;

  return (
    <div className="flex min-h-0 flex-col gap-1">
      {collapsible ? (
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex shrink-0 items-center gap-1.5 px-1 py-1 text-sm font-medium"
        >
          <ChevronDownIcon
            className={cn("size-3.5 shrink-0 transition-transform", collapsed && "-rotate-90")}
          />
          <span>{title}</span>
          {typeof count === "number" && <Badge variant="secondary">{count}</Badge>}
        </button>
      ) : (
        <div className="flex shrink-0 items-center gap-1.5 px-1 py-1 text-sm font-medium">
          <span>{title}</span>
          {typeof count === "number" && <Badge variant="secondary">{count}</Badge>}
        </div>
      )}
      {body}
    </div>
  );
}
