import { canAccessAdminPanel } from "@vexcms/core";
import { NextAdminPage } from "@vexcms/next/server";
import { redirect } from "next/navigation";

import { getToken, getUserOrg } from "~/auth/server";
import config from "~/vex.config.server";

export const dynamic = "force-dynamic";

/**
 * Admin panel route. Gates on two separate things, both resolved BEFORE anything streams:
 *
 * 1. **Authentication** — `getToken()` is a local jwtCache decode (the `cookiePrefix`
 *    fix — ~0-1ms, not a network round trip), so awaiting it here costs nothing
 *    material. A missing token no longer redirects on its own: `getUserOrg()` is itself
 *    `cache()`-wrapped and safe to call with no session (`{ user: null, organization:
 *    undefined }`, never throws), so authorization is checked regardless — an app whose
 *    `anonRole` grants `adminPanel.access` lets an anonymous caller straight through, no
 *    sign-in detour. An app that hasn't configured that (the default) gets the exact
 *    same redirect as before, just one step later.
 * 2. **Authorization** — the caller must satisfy `adminPanel.access` in the access
 *    matrix. `canAccessAdminPanel` is awaited sequentially — nothing streams until it
 *    resolves. `getUserOrg()` is `cache()`-wrapped (React's per-request dedupe), so this
 *    costs no extra round trip when something upstream already resolved the same caller
 *    this request.
 *
 * Denied redirects to `/auth/sign-in` when there was genuinely no token, else
 * `/unauthorized` (a signed-in caller whose role doesn't pass).
 *
 * `NextAdminPage` streams its own real chrome immediately once rendered and wraps only
 * its own data-dependent regions in their own `<Suspense>` boundaries — see its own doc
 * comment.
 */
export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const token = await getToken();
  const auth = await getUserOrg();
  if (
    !canAccessAdminPanel({
      access: config.access,
      user: auth.user,
      organization: auth.organization,
    })
  ) {
    redirect(token ? "/unauthorized" : "/auth/sign-in?redirectTo=/admin");
  }

  return (
    <NextAdminPage
      config={config}
      params={params}
      searchParams={searchParams}
      tokenPromise={Promise.resolve(token)}
      authPromise={Promise.resolve(auth)}
    />
  );
}
