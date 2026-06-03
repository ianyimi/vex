"use client";

import { Fragment, useEffect, useState, type RefAttributes } from "react";
import { AdminLayoutProps } from "./AdminLayout";
import { VexLink } from "./ui";
import { ChevronLeft, ChevronRight, LucideProps } from "lucide-react";
import { addLeadingSlash, vexConvexApi } from "@vexcms/core";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { cn } from "../styles/utils";

export function Divider(
  props: { left: boolean } & LucideProps & RefAttributes<SVGSVGElement>,
) {
  const { left, ...svgProps } = props;
  if (left) {
    return <ChevronRight {...svgProps} />;
  }
  return <ChevronLeft {...svgProps} />;
}

export default function AdminTopNav(props: AdminLayoutProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { data: currentDocument } = useQuery({
    // Pass "skip" when there is no activeDocID — this tells ConvexQueryClient
    // not to establish a watchQuery subscription at all (vs enabled:false which
    // still registers the key in the cache and can fire with an empty id).
    ...convexQuery(
      vexConvexApi.get,
      props.activeDocID ? { id: props.activeDocID } : "skip",
    ),
  });

  const isLeft = props.config.admin.sidebar.side === "left";
  const adminRoot = addLeadingSlash(props.config.basePath);
  const activeCollection = props.config.collections.find(
    (c) => c.slug === props.activeSlug,
  );
  // Only use currentDocument after client mount to avoid SSR/client mismatch.
  // The server may have this data in the React Query cache (from fetchQuery in
  // NextAdminPage) while the client starts with undefined until Convex fires.
  const doc = mounted ? currentDocument : undefined;

  const nav = [
    <VexLink
      href={adminRoot}
      key="home"
      className={cn(
        !activeCollection && !doc
          ? "text-primary"
          : "hover:text-primary-hover",
      )}
    >
      <span>Home</span>
    </VexLink>,
    <Fragment key="collection">
      {activeCollection && (
        <>
          {isLeft ? (
            <>
              <Divider left={isLeft} size={16} />
              <VexLink
                href={`${adminRoot}/${activeCollection.slug}`}
                className={cn(
                  !doc
                    ? "text-primary"
                    : "hover:text-primary-hover",
                )}
              >
                <span>{activeCollection.labels.plural}</span>
              </VexLink>
            </>
          ) : (
            <>
              <VexLink
                href={`${adminRoot}/${activeCollection.slug}`}
                className={cn(
                  !doc
                    ? "text-primary"
                    : "hover:text-primary-hover",
                )}
              >
                <span>{activeCollection.labels.plural}</span>
              </VexLink>
              <Divider left={isLeft} size={16} />
            </>
          )}
        </>
      )}
    </Fragment>,
    <Fragment key="document">
      {doc && activeCollection && (
        <>
          {isLeft ? (
            <>
              <Divider left={isLeft} size={16} />
              <VexLink
                href={`${adminRoot}/${activeCollection.slug}/${doc._id}`}
                className="text-primary"
              >
                <span>
                  {doc[activeCollection.admin.useAsTitle] as string}
                </span>
              </VexLink>
            </>
          ) : (
            <>
              <VexLink
                href={`${adminRoot}/${activeCollection.slug}/${doc._id}`}
                className="text-primary"
              >
                <span>
                  {doc[activeCollection.admin.useAsTitle] as string}
                </span>
              </VexLink>
              <Divider left={isLeft} size={16} />
            </>
          )}
        </>
      )}
    </Fragment>,
  ];

  return (
    <div className="flex items-center gap-2" suppressHydrationWarning>
      {isLeft ? nav : nav.reverse()}
    </div>
  );
}
