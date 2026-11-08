"use client";
// "use client" is injected by the tsup build banner for this entry (see
// tsup.config.ts) so the emitted module carries the client boundary.
import { useState, type ReactNode } from "react";
import type { VexApiAuth } from "@vexcms/core";

import { AdminLayout } from "@vexcms/react/admin";
import NextImage from "next/image";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { useNextNavigationBlocker } from "./navigation/useNextNavigationBlocker";
import { useNextNavigate } from "./navigation/useNextNavigate";
import { useNextIsRouteCovered } from "./navigation/useNextIsRouteCovered";
import { useNextSearchParams } from "./navigation/useNextSearchParams";
import { useVexAdminAuthAdapter } from "./auth/VexAdminAuthAdapterContext";

/**
 * Client leaf for the Next.js admin layout.
 *
 * Owns all client-only wiring that cannot run on the server:
 * - `usePathname()` to derive the active collection slug / document id for
 *   sidebar highlighting (Next.js layouts do not receive route params).
 * - `NuqsAdapter` (`nuqs/adapters/next/app`) so URL state works inside the
 *   admin routes.
 * - `NextLink` / `NextImage` passed as framework components so every
 *   `VexLink`/`VexImage` uses Next.js routing and image optimisation.
 * - `useVexAdminAuthAdapter()` (`./auth/VexAdminAuthAdapterContext`) read here and
 *   forwarded into `components.auth`, so `AdminTopNav`'s sign-in/out control picks up
 *   whatever adapter the app mounted via `VexAdminAuthAdapterProvider`
 *   (`@vexcms/next/auth`) — `undefined` when the app hasn't mounted one, same as the
 *   control simply not rendering.
 *
 * Config reaches `AdminLayout`'s children through the app's own
 * `VexConfigProvider` mount, not through a prop on this component — this
 * leaf never touches config at all.
 *
 * This component is internal to `@vexcms/next` — applications render
 * {@link NextAdminLayout} instead.
 *
 * @param props - Layout props.
 * @param props.children - The page content from `[[...slug]]/page.tsx`.
 * @param props.authPromise - The in-flight `{ user, organization }` fetch,
 *   forwarded to `AdminLayout` so the sidebar resolves it in its OWN `<Suspense>` boundary —
 *   a slow auth round trip streams in the sidebar nav without blocking `children`.
 * @returns The admin shell rendered from `children`, wrapped in `NuqsAdapter`
 * and the shared `AdminLayout`, wired with the active slug/document id derived
 * from `usePathname()` and Next.js `Link`/`Image` components.
 */
export function NextAdminLayoutClient(props: {
  children: ReactNode;
  authPromise?: Promise<VexApiAuth>;
  sidebarOpen?: boolean;
}) {
  const livePathname = usePathname();
  const isRouteCovered = useNextIsRouteCovered();
  // Under a covering route (the sign-in modal) `usePathname()` is the modal's — keep the
  // last admin pathname so the sidebar/top nav keep their active collection behind it.
  const [lastAdminPathname, setLastAdminPathname] = useState(livePathname);
  if (!isRouteCovered && livePathname !== lastAdminPathname) {
    setLastAdminPathname(livePathname);
  }
  const pathname = isRouteCovered ? lastAdminPathname : livePathname;
  const auth = useVexAdminAuthAdapter();
  // pathname: "/admin", "/admin/collections/posts[/<id>]", "/admin/globals[/<slug>]"
  // Split on "/" and read the segments after "admin". Collections report their
  // slug + document id; globals keep the "globals" section as the active slug
  // and the global's slug as the doc id (the sidebar/top nav contract).
  const [, section, slug, documentId] = pathname.split("/").filter(Boolean);
  const activeSlug = section === "collections" ? slug : section;
  const activeDocID = section === "collections" ? documentId : slug;

  return (
    <NuqsAdapter>
      <AdminLayout
        activeDocID={activeDocID}
        activeSlug={activeSlug}
        authPromise={props.authPromise}
        components={{
          Link: NextLink,
          Image: NextImage,
          navigationBlocker: { useBlocker: useNextNavigationBlocker },
          useNavigate: useNextNavigate,
          useIsRouteCovered: useNextIsRouteCovered,
          useSearchParams: useNextSearchParams,
          auth,
        }}
        sidebarOpen={props.sidebarOpen}
      >
        {props.children}
      </AdminLayout>
    </NuqsAdapter>
  );
}
