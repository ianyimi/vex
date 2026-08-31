"use client";

import { useEffect, useState, type RefAttributes } from "react";
import { AdminLayoutProps } from "./AdminLayout";
import { VexLink } from "./ui";
import { ChevronLeft, ChevronRight, LucideProps } from "lucide-react";
import { addLeadingSlash, vexConvexApi } from "@vexcms/core";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { cn } from "../styles/utils";

/**
 * Breadcrumb separator icon between crumb links. Points toward the sidebar
 * (`ChevronRight` when the sidebar sits on the left, `ChevronLeft` otherwise)
 * so the chevron visually leads back to the collapsed nav.
 *
 * @param props - Whether the sidebar is on the left, plus the remaining
 *   `lucide-react` SVG props forwarded to the rendered chevron icon.
 * @returns The chevron icon (`ChevronRight` or `ChevronLeft`) for this position.
 */
export function Divider(props: { left: boolean } & LucideProps & RefAttributes<SVGSVGElement>) {
  const { left, ...svgProps } = props;
  if (left) {
    return <ChevronRight {...svgProps} />;
  }
  return <ChevronLeft {...svgProps} />;
}

/**
 * Top admin nav bar rendering the breadcrumb trail for the current
 * collection/global/document, from `Home` down to the active document
 * (using its `currentDocument.title`/`name` once fetched, or its id as a
 * fallback while loading).
 *
 * @param props - The active admin layout config, plus the active collection
 *   slug and document id used to resolve the breadcrumb trail.
 * @returns The breadcrumb nav, ordered per the configured sidebar side.
 */
export default function AdminTopNav(props: AdminLayoutProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const isGlobals = props.activeSlug === "globals";

  const { data: currentDocument } = useQuery({
    // Pass "skip" when there is no activeDocID OR on a globals route — this
    // tells ConvexQueryClient not to establish a watchQuery subscription at
    // all (vs enabled:false which still registers the key in the cache and
    // can fire with an empty id). On /admin/globals/[slug] the third path
    // segment is a global slug, not a Convex document ID, so vexConvexApi.get
    // must never run there.
    ...convexQuery(
      vexConvexApi.get,
      props.activeDocID && props.activeSlug && !isGlobals
        ? { id: props.activeDocID, collection: props.activeSlug }
        : "skip",
    ),
  });

  const isLeft = props.config.admin.sidebar.side === "left";
  const adminRoot = addLeadingSlash(props.config.basePath);
  const allCollections = props.config.collections.concat(props.config.mediaCollections);
  const activeCollection = allCollections.find((c) => c.slug === props.activeSlug);
  const activeGlobal =
    isGlobals && props.activeDocID
      ? props.config.globals.find((g) => g.slug === props.activeDocID)
      : undefined;
  // Only use currentDocument after client mount to avoid SSR/client mismatch.
  // The server may have this data in the React Query cache (from fetchQuery in
  // NextAdminPage) while the client starts with undefined until Convex fires.
  const doc = mounted ? currentDocument : undefined;

  type Crumb = { key: string; href: string; label: string };
  const crumbs: Crumb[] = [{ key: "home", href: adminRoot, label: "Home" }];
  if (activeCollection) {
    crumbs.push({
      key: "collection",
      href: `${adminRoot}/${activeCollection.slug}`,
      label: activeCollection.labels.plural,
    });
    if (doc) {
      crumbs.push({
        key: "document",
        href: `${adminRoot}/${activeCollection.slug}/${doc._id}`,
        label: doc[activeCollection.admin.useAsTitle] as string,
      });
    }
  } else if (isGlobals) {
    // Globals crumbs are fully config-driven: a global's `label` IS its page
    // title (spec 35, D16 — no useAsTitle), so no doc fetch and no `mounted`
    // guard are needed here.
    crumbs.push({ key: "globals", href: `${adminRoot}/globals`, label: "Globals" });
    if (activeGlobal) {
      crumbs.push({
        key: "global",
        href: `${adminRoot}/globals/${activeGlobal.slug}`,
        label: activeGlobal.label,
      });
    }
  }

  const nav = crumbs.flatMap((crumb, i) => {
    const isLast = i === crumbs.length - 1;
    const link = (
      <VexLink
        key={crumb.key}
        href={crumb.href}
        className={cn(isLast ? "text-primary" : "hover:text-primary/90")}
      >
        <span>{crumb.label}</span>
      </VexLink>
    );
    return i === 0 ? [link] : [<Divider key={`div-${crumb.key}`} left={isLeft} size={16} />, link];
  });

  return (
    <div className="flex items-center gap-2" suppressHydrationWarning>
      {isLeft ? nav : nav.reverse()}
    </div>
  );
}
