import { api } from "@convex/_generated/api";
import { canAccessAdminPanel } from "@vexcms/core";
import { NextAdminPage } from "@vexcms/next/server";
import { redirect } from "next/navigation";

import { fetchAuthQuery, getToken } from "~/auth/server";
import config from "~/vex.config";

export const dynamic = "force-dynamic";

/**
 * Admin panel route. Gates on two separate things, in order:
 *
 * 1. **Authentication** — no session token means sign in first.
 * 2. **Authorization** — a valid session is not enough; the caller must also
 *    satisfy `adminPanel.access` in the access matrix. Without this second check
 *    any authenticated user reaches the full panel regardless of their roles.
 *
 * Both run server-side, before the panel renders, so an unauthorized caller
 * never receives the admin shell (which would leak collection and global names).
 */
export default async function AdminPage({ params }: { params: Promise<{ path?: string[] }> }) {
  const token = await getToken();
  if (!token) {
    redirect("/auth/sign-in?redirectTo=/admin");
  }

  const auth = await fetchAuthQuery(api.auth.api.getUserOrg, {});
  if (
    !canAccessAdminPanel({
      access: config.access,
      user: auth.user,
      organization: auth.organization,
    })
  ) {
    redirect("/unauthorized");
  }

  return <NextAdminPage config={config} params={params} token={token} />;
}
