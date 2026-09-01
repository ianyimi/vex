import { UnauthorizedView } from "@vexcms/react";
import Link from "next/link";

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
 */
export default function UnauthorizedPage() {
  return (
    <UnauthorizedView>
      <Link className="text-primary underline" href="/">
        Return to site
      </Link>
    </UnauthorizedView>
  );
}
