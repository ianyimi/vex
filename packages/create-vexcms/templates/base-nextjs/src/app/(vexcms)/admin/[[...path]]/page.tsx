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
 * This is now the ONLY gate for `/admin/*`:
 * `src/proxy.ts`'s general session gate used to also run on `/admin/*`, and no
 * longer does — `/admin/*` is excluded from its matcher entirely, so the admin
 * panel never imports `~/vex.config` (and the client components it drags in) on
 * the edge. Two things here now reproduce what that proxy pass used to do for
 * this route:
 * - `redirectTo` carries the FULL requested path + query (rebuilt from `params`
 *   and `searchParams`, URL-encoded below), not a hard-coded `/admin` — so
 *   sign-in lands the caller back where they were headed.
 * - `getToken()`/`getUserOrg()` are awaited inside a `try`/`catch`: a session
 *   **verification** failure (Convex unreachable, a lookup timeout) redirects to
 *   `/unauthorized` — fail closed, mirroring the proxy's own fail-closed
 *   behavior — instead of surfacing as a 500. `redirect()` throws its own
 *   control-flow error to unwind to the nearest segment, so it is only ever
 *   called from the `catch` block, never awaited inside the `try`.
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
  const [resolvedParams, resolvedSearchParams] = await Promise.all([params, searchParams]);

  const session = await loadAdminSession();
  if (!session) {
    redirect("/unauthorized");
  }
  const { token, auth } = session;

  if (
    !canAccessAdminPanel({
      access: config.access,
      user: auth.user,
      organization: auth.organization,
    })
  ) {
    redirect(
      token
        ? "/unauthorized"
        : `/auth/sign-in?redirectTo=${encodeURIComponent(
            buildAdminRequestPath(resolvedParams.path, resolvedSearchParams),
          )}`,
    );
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

/**
 * Resolves the session, failing closed: a `getToken()`/`getUserOrg()` throw
 * (Convex unreachable, a lookup timeout) returns `null` rather than letting
 * the error surface as a 500 — the caller redirects to `/unauthorized`.
 */
async function loadAdminSession() {
  try {
    const token = await getToken();
    const auth = await getUserOrg();
    return { token, auth };
  } catch {
    return null;
  }
}

/**
 * Rebuilds the full requested admin path (segments + query) from the route's
 * own `params`/`searchParams`, for the sign-in `redirectTo`. The result is
 * passed through `encodeURIComponent` by the caller as a single opaque blob,
 * so values here are joined raw rather than individually encoded.
 */
function buildAdminRequestPath(
  path: string[] | undefined,
  searchParams: Record<string, string | string[] | undefined>,
): string {
  const segments = path?.length ? `/${path.join("/")}` : "";
  const query = Object.entries(searchParams).flatMap(([key, value]) =>
    value === undefined ? [] : (Array.isArray(value) ? value : [value]).map((v) => `${key}=${v}`),
  );
  return `/admin${segments}${query.length ? `?${query.join("&")}` : ""}`;
}
