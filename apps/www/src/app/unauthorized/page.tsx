import { UnauthorizedView } from "@vexcms/react";
import Link from "next/link";

import { ThemeStyle } from "~/components/ThemeStyle";

export const metadata = {
  title: "Access denied",
};

/**
 * Landing page for callers who are signed in but fail the `adminPanel.access`
 * check in the access matrix.
 *
 * Deliberately lives OUTSIDE the `(vexcms)/admin` segment: that segment's layout
 * mounts the admin shell and redirects unauthorized callers here, so rendering
 * this inside it would loop.
 *
 * That also puts it outside `(frontend)`, so it emits `<ThemeStyle />` itself.
 * Without it the server painted `globals.css`'s palette and `<ThemeLive />`
 * repainted the real theme after hydration — a visible colour flash. The root
 * layout cannot carry the emit: it stays free of Convex reads.
 */
export default function UnauthorizedPage() {
  return (
    <>
      <ThemeStyle />
      <UnauthorizedView>
        <Link className="text-primary underline" href="/">
          Return to site
        </Link>
      </UnauthorizedView>
    </>
  );
}
