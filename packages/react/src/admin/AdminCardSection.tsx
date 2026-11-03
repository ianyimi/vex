"use client";

import { Activity, type ReactNode } from "react";
import { Card, CardDescription, CardHeader, CardTitle, Icon } from "../ui";
import type { IconName } from "../ui/Icon";

/** One card's own resolved content — built per item by the caller's own getters. */
interface AdminCardSectionItem {
  key: string;
  href: string;
  title: string;
  description: string;
  icon: IconName | undefined;
}

/**
 * Props for {@link AdminCardSection}.
 *
 * @typeParam T - The item type this section lists (a collection/media-collection/global
 *   config, or any other shape the caller resolves per-card).
 */
export interface AdminCardSectionProps<T> {
  /** Section heading, e.g. `"Collections"`, `"Media"`, `"Globals"`. */
  title: string;
  /**
   * The heading's own className — callers vary this (`DashboardView`'s first section
   * uses `px-4 pb-2`, its own `<h1>` above already supplies top spacing; every other
   * section, here and elsewhere, uses `p-4 pb-2` for its own top spacing too) to
   * preserve each page's exact prior spacing, pixel for pixel.
   */
  headingClassName: string;
  /** The items to render, already permission-filtered by the caller — this component applies no RBAC of its own. */
  items: readonly T[];
  /** Resolves one item's card content. */
  resolveItem: (item: T) => AdminCardSectionItem;
}

/**
 * One heading + card grid, for a registered resource list (collections, media
 * collections, globals) — the section shape `DashboardView` originally hand-rolled three
 * times verbatim; extracted here so `DashboardView`, `GlobalsListView`, and the
 * collections-only index page (`CollectionsIndexView`) all render the IDENTICAL markup
 * instead of three near-copies silently drifting apart.
 *
 * Hidden via `<Activity mode="hidden">`, not removed from the DOM, when `items` is empty
 * — `display:none` on the whole section (heading + grid together), same technique
 * `DashboardView` already used, so a later permission grant doesn't shift anything above
 * or below it (zero layout shift — the empty section still occupies no visible space,
 * but its DOM node, and therefore the page's own structure, doesn't change shape).
 *
 * @param props - Section title, the (already-filtered) item list, and a per-item resolver.
 * @returns The section's heading + card grid, or nothing visible when `items` is empty.
 */
export function AdminCardSection<T>(props: AdminCardSectionProps<T>): ReactNode {
  return (
    <Activity mode={props.items.length > 0 ? "visible" : "hidden"}>
      <h2 className={props.headingClassName}>{props.title}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {props.items.map((item) => {
          const resolved = props.resolveItem(item);
          return (
            <a key={resolved.key} href={resolved.href} className="group block">
              <Card className="cursor-pointer transition-shadow group-hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-1">
                    {resolved.icon && (
                      <span>
                        <Icon name={resolved.icon} size={20} />
                      </span>
                    )}
                    {resolved.title}
                  </CardTitle>
                  <CardDescription>{resolved.description}</CardDescription>
                </CardHeader>
              </Card>
            </a>
          );
        })}
      </div>
    </Activity>
  );
}
