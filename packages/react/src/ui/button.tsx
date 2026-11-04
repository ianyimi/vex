"use client";

import { Button as ButtonPrimitive } from "@base-ui/react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../utils/cn";
import { Loader2Icon } from "lucide-react";
import { Icon, type IconName } from "./Icon";

const buttonVariants = cva(
  // `disabled:*` only matches form elements. When `nativeButton={false}` and
  // `render` supplies an anchor, Base UI emits `aria-disabled` instead, so the
  // `aria-disabled:*` variants below are what actually grey the control out and
  // stop it from being clicked/navigated.
  "group/button font-mono relative inline-flex shrink-0 items-center justify-center rounded-sm border border-transparent bg-clip-padding text-[13px] font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-background shadow-xs hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // Heights match Claude Design admin.css: default=32, sm=28, lg=36, xs=24
        default:
          "h-8 gap-1.5 px-3 in-data-[slot=button-group]:rounded-sm has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 px-2 text-xs in-data-[slot=button-group]:rounded-sm has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 px-2.5 text-xs in-data-[slot=button-group]:rounded-sm has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5",
        lg: "h-9 gap-1.5 px-3.5 text-sm has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 in-data-[slot=button-group]:rounded-sm [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 in-data-[slot=button-group]:rounded-sm",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  isPending = false,
  variant = "default",
  size = "default",
  children,
  icon,
  iconSize = 4,
  iconPosition = "left",
  contentJustify = "center",
  ...props
}: {
  isPending?: boolean;
  icon?: IconName;
  iconSize?: number;
  iconPosition?: "left" | "right" | "center";
  /**
   * Default: `"center"` — icon and label stay GROUPED as one unit,
   * centered within the button's own available width (matters only for a
   * `w-full`/stretched button; a content-sized button looks identical
   * either way, nothing to center around). Developer-reported regression:
   * `justify-between` used to be the default for any labeled icon button,
   * which sprays the icon to one edge and the label to the other the
   * moment a caller makes the button full width — wrong for the vast
   * majority of full-width buttons (e.g. `ListViewFilterBuilder`'s "AND
   * condition"/"OR conditions"), which want the icon+label pair centered
   * together like any other button, just stretched (they're stretched by
   * their OWN flex-column parent's default `align-items: stretch`, not an
   * explicit `w-full` className — this fix applies identically either
   * way, since it's the SPAN's own `w-full`, relative to the BUTTON's
   * resolved width, that matters). Pass `"between"` ONLY for the one
   * caller that genuinely wants a label-left/icon-right split across the
   * full width (`SavedListViewTabs.tsx`'s mobile view switcher) — an explicit
   * opt-in, not a default. Pass `"start"` for a full-width MENU-ROW-style
   * button (`ListViewCopyLinkButton`'s `placement="menu"` variant — a
   * left-aligned "icon, then label" row, same convention a real menu item
   * uses) — audit-caught, same underlying cause: a caller's OWN
   * `className="justify-start"` on the OUTER element used to work (the
   * inner span was content-sized, so the outer's single child sat at the
   * content's own natural width, and `justify-start` positioned THAT at
   * the left edge) but silently stopped doing anything the moment the
   * inner span itself became `w-full` (this file's own mobile-switcher
   * fix, several rounds ago) — the outer's single child already fills
   * 100% width, so its own `justify-*` has nothing left to position.
   */
  contentJustify?: "center" | "between" | "start";
} & ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants>) {
  const iconLeft = iconPosition === "left";
  const iconRight = iconPosition === "right";
  // Whether `icon` and `children` are TWO DISTINCT, genuinely visible
  // items that need a margin between them (NOT a justify-content
  // decision anymore — that's `contentJustify`, above) — false in any of
  // three cases:
  // 1. `icon` itself is unset — a caller passing a raw icon element AS
  //    `children` instead (`SurfacedAction`'s inline row-action buttons,
  //    `ui/ActionsMenu.tsx` — array/block duplicate/move/remove) has only
  //    ONE real item either way, nothing to margin away from.
  // 2. `iconPosition="center"` IS the caller's own explicit "icon-only"
  //    declaration — honored unconditionally, regardless of `children`. A
  //    caller using this still often passes a visually-hidden `children`
  //    (`<span className="sr-only">Label</span>`) instead of `aria-label`
  //    for its OWN reasons (`AdminTopNav.tsx`'s "View site",
  //    `ThemeToggle.tsx`) — treating ANY non-empty `children` as "has a
  //    label" ignored this explicit signal.
  // 3. `children` itself is empty — `iconPosition`'s own default ("left")
  //    is meaningless without a real label (`ListViewCopyLinkButton`, no
  //    `children`).
  const hasLabel =
    icon !== undefined &&
    iconPosition !== "center" &&
    children !== undefined &&
    children !== null &&
    children !== false;
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={isPending}
      {...props}
    >
      <span
        className={cn(
          // `inline-flex items-baseline` — NOT a plain (non-flex) `<span>` — so
          // `icon` and `children` are true flex items laid out on one row
          // regardless of what `children` itself renders as:
          // a caller passing a `display: flex`/block-level nested element as
          // `children` — e.g. a growing, truncating label — forced that element
          // onto its own line in NORMAL inline flow, pushing a trailing
          // `iconPosition="right"` icon onto a second line below it).
          // `items-baseline`, NOT `items-center`:
          // a flex container's OWN first baseline — as seen by an ANCESTOR's
          // `items-baseline` row (`SavedListViewTabs.tsx`'s tab strip, hard-won over
          // 3 rounds) — is only the label's real text baseline when this span's
          // OWN children participate in baseline alignment too; `items-center`
          // instead synthesizes a baseline from this span's own box edge, which
          // doesn't match the surrounding text's baseline and silently shifted
          // every text button a few px off from its row's other text. Confirmed
          // live this changes nothing about an icon-only button's centering
          // (`justify-center` below still centers the lone child; verified
          // `diffX`/`diffY` 0 either way) — but a LABEL-adjacent icon needs its
          // own explicit `self-center` (below) to stay centered against the
          // row's own cross-axis size: under `items-baseline`, an icon (no real
          // CSS baseline of its own) synthesizes one from its bottom margin
          // edge, same as a COMPLEX (non-text) `children` node does — two
          // independently-synthesized edges don't line up with each other the
          // way two real text baselines do, so without `self-center` the icon
          // drifted a few px off-center against a `children` like the mobile
          // view-switcher's own flex-laid-out label+count group (developer-
          // reported regression, round 2: fixing the OUTER baseline broke this
          // INNER alignment — confirmed live, `self-center` restores it exactly
          // without reintroducing the outer regression, since only the icon
          // opts out of baseline — the label, the thing that actually needs to
          // report a real text baseline upward, still does).
          "inline-flex w-full items-baseline",
          // `contentJustify` (default `"center"`, see its own doc comment
          // above) — NOT `hasLabel`-driven anymore (round 3 developer
          // correction: `justify-between` as the DEFAULT for every labeled
          // button broke every OTHER full-width icon+label button, not just
          // the one that actually wants a split). A content-sized button
          // renders identically regardless of which value this is (nothing
          // to justify around — the span never grows past its own content).
          contentJustify === "between"
            ? "justify-between"
            : contentJustify === "start"
              ? "justify-start"
              : "justify-center",
          isPending && "invisible",
        )}
      >
        {icon && iconLeft && (
          <Icon name={icon} size={iconSize} className={cn(hasLabel && "mr-1", "self-center")} />
        )}
        {icon && !iconLeft && !iconRight && <Icon name={icon} size={iconSize} className="self-center" />}
        {children}
        {icon && iconRight && (
          <Icon name={icon} size={iconSize} className={cn(hasLabel && "ml-1", "self-center")} />
        )}
      </span>
      {isPending && <Loader2Icon className="animate-spin absolute" />}
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants };
