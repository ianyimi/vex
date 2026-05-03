"use client";

import { Fragment, RefAttributes, useEffect, useState } from "react";
import { AdminLayoutProps } from "./AdminLayout";
import { VexLink } from "./ui";
import { ChevronLeft, ChevronRight, LucideProps } from "lucide-react";
import { addLeadingSlash, vexConvexApi } from "@vexcms/core";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";

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
  useEffect(() => setMounted(true), []);

  const { data: currentDocument } = useQuery({
    ...convexQuery(vexConvexApi.get, {
      id: props.activeDocID ?? "",
    }),
    enabled: mounted && Boolean(props.activeDocID),
  });

  const isLeft = props.config.admin.sidebar.side === "left";
  const adminRoot = addLeadingSlash(props.config.basePath);
  const activeCollection = props.config.collections.find(
    (c) => c.slug === props.activeSlug,
  );

  const nav = [
    <VexLink href={adminRoot} key="home">
      <span>Home</span>
    </VexLink>,
    <Fragment key="collection">
      {activeCollection && (
        <>
          {isLeft ? (
            <>
              <Divider left={isLeft} size={16} />
              <VexLink href={`${adminRoot}/${activeCollection.slug}`}>
                <span>{activeCollection.labels.plural}</span>
              </VexLink>
            </>
          ) : (
            <>
              <VexLink href={`${adminRoot}/${activeCollection.slug}`}>
                <span>{activeCollection.labels.plural}</span>
              </VexLink>
              <Divider left={isLeft} size={16} />
            </>
          )}
        </>
      )}
    </Fragment>,
    <Fragment key="document">
      {currentDocument && activeCollection && (
        <>
          {isLeft ? (
            <>
              <Divider left={isLeft} size={16} />
              <VexLink
                href={`${adminRoot}/${activeCollection.slug}/${currentDocument._id}`}
              >
                <span>
                  {currentDocument[activeCollection.admin.useAsTitle] as string}
                </span>
              </VexLink>
            </>
          ) : (
            <>
              <VexLink
                href={`${adminRoot}/${activeCollection.slug}/${currentDocument._id}`}
              >
                <span>
                  {currentDocument[activeCollection.admin.useAsTitle] as string}
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
    <div className="flex items-center gap-2">
      {isLeft ? nav : nav.reverse()}
    </div>
  );
}
