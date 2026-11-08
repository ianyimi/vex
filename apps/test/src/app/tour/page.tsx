import type { Metadata } from "next";

import { ThemeStyle } from "~/components/ThemeStyle";

import { TourContent } from "./TourContent";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Tour",
  robots: { index: false },
};

/**
 * Static stand-in for the live demo. Rendered once at build time with no
 * Convex read at request time, so it still serves while the backend the demo
 * depends on is down or over its limits.
 *
 * Mirrors `app/unauthorized/page.tsx`: outside every route group, so it emits
 * `<ThemeStyle />` itself; `force-static` bakes that theme CSS in at build.
 */
export default function TourPage() {
  return (
    <>
      <ThemeStyle />
      <TourContent />
    </>
  );
}
