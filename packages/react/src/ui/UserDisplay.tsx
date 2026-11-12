"use client";

import type { ReactNode } from "react";
import type { IconName } from "./Icon";
import { Icon } from "./Icon";
import { VexImage } from "./VexImage";
import { cn } from "../utils/cn";

/** Props for {@link UserDisplay}. */
export interface UserDisplayProps {
  /** Display name, rendered as the header line when present. */
  name?: string;
  /** Email address — the subheader line when `name` is also present, otherwise the sole line shown. */
  email?: string;
  /** Avatar image URL. Takes priority over `fallbackIcon`. */
  image?: string;
  /** Icon shown in the avatar circle when `image` is absent. Falls back to a generic single-user icon. */
  fallbackIcon?: IconName;
  /** Positioning/spacing class applied to the root element. */
  className?: string;
}

/**
 * A compact user identity chip: a small circular avatar on the left, name/email in a
 * two-line layout on the right — `name` as the header line, `email` underneath it in
 * muted/subheader text. When `name` is absent, `email` alone becomes the single visible
 * line (never two identical/empty lines). Renders `null` when neither is present.
 *
 * The avatar falls back through three tiers: `image` (the user's own avatar) first, then
 * `fallbackIcon` (callers pass the auth user collection's configured `admin.icon`, so the
 * avatar matches the rest of the admin's iconography), then a generic single-user icon
 * (`"User"`) when neither is available.
 *
 * Framework-agnostic and presentation-only — it takes already-resolved `name`/`email`/
 * `image`/`fallbackIcon` rather than reading `useVexAuth()`/`useVexConfig()` itself, so it
 * has no dependency on the admin's domain contexts and can be reused anywhere a caller has
 * already resolved a user's display fields (e.g. `AdminTopNav`'s sign-in/out control).
 *
 * @param props - See {@link UserDisplayProps}.
 * @returns The avatar + name/email chip, or `null` when there is nothing to label.
 *
 * @example
 * ```tsx
 * <UserDisplay name="Ada Lovelace" email="ada@example.com" image={user.image} />
 * ```
 */
export function UserDisplay(props: UserDisplayProps): ReactNode {
  const name = props.name && props.name.length > 0 ? props.name : undefined;
  const email = props.email && props.email.length > 0 ? props.email : undefined;
  const headline = name ?? email;
  if (!headline) return null;
  const subline = name ? email : undefined;
  return (
    <div className={cn("flex min-w-0 items-center gap-2", props.className)}>
      <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-muted-foreground">
        {props.image ? (
          <VexImage
            src={props.image}
            alt=""
            width={32}
            height={32}
            className="size-8 rounded-full object-cover"
          />
        ) : (
          <Icon name={props.fallbackIcon ?? "User"} size={16} />
        )}
      </span>
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="min-w-0 truncate text-foreground">{headline}</span>
        {subline && <span className="min-w-0 truncate text-xs text-muted-foreground">{subline}</span>}
      </div>
    </div>
  );
}
