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
 *    material. A missing token no longer redirects on its own: `getUserOrg()` is itself `cache()`-wrapped and already
 *    documented safe to call with no session (`{ user: null, organization: undefined }`,
 *    never throws), so authorization is checked regardless, and an app whose `anonRole`
 *    grants `adminPanel.access` lets an anonymous caller straight through — no sign-in
 *    detour. An app that hasn't configured that (the default) gets the EXACT same
 *    redirect as before, just one step later (see below).
 * 2. **Authorization** — the caller must satisfy `adminPanel.access` in the access
 *    matrix (revised after a live review of the
 *    first fix: that version rendered a generic page-level `AdminContentSkeleton`
 *    fallback while this check was still in flight — even though `NextAdminPage` was
 *    correctly nested behind the gate by then, the skeleton itself made posts' loading
 *    state visibly WORSE than the original, unguarded design: layout shifted against the
 *    settled page, row-selection checkboxes showed loading spinners instead of their
 *    real shape, some skeleton elements had no matching settled counterpart, and other
 *    real content just popped in unannounced. `AdminContentSkeleton` is deleted.
 *    `canAccessAdminPanel` is awaited sequentially — nothing streams until it resolves.
 *    `getUserOrg()` is `cache()`-wrapped (React's per-request dedupe), so this costs no
 *    extra round trip when something upstream — a layout, `AuthServerProvider` — already
 *    resolved the same caller this request.
 *
 * Denied redirects to `/auth/sign-in` when there was genuinely no token (today's UX for
 * an app that hasn't opted into anonymous access, or a signed-out caller on one that
 * has), else `/unauthorized` (a signed-in caller whose role doesn't pass).
 *
 * This is now the ONLY gate for `/admin/*`:
 * `src/proxy.ts` used to run its own `guardAdminRequest` first and no longer
 * does — `/admin/*` is excluded from its matcher entirely, so the admin panel
 * never imports `~/vex.config` (and the client components it drags in) on the
 * edge. Two things here now reproduce exactly what that dropped proxy gate did:
 * - `redirectTo` carries the FULL requested path + query (rebuilt from `params`
 *   and `searchParams`, URL-encoded below), not a hard-coded `/admin` — so
 *   sign-in lands the caller back where they were headed.
 * - `getToken()`/`getUserOrg()` are awaited inside a `try`/`catch`: a session
 *   **verification** failure (Convex unreachable, a lookup timeout) redirects to
 *   `/unauthorized` — fail closed, mirroring the old proxy's
 *   `verification-failed` branch — instead of surfacing as a 500. `redirect()`
 *   throws its own control-flow error to unwind to the nearest segment, so it is
 *   only ever called from the `catch` block, never awaited inside the `try`.
 *
 * `NextAdminPage` streams its own real chrome immediately once rendered (title, tabs,
 * toolbar, controls, row-selection checkboxes — the exact page as it was before this gate
 * existed) and wraps only its own data-dependent regions (e.g. the table's row data) in
 * their own `<Suspense>` boundaries — see its own doc comment.
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
 * the error surface as a 500 — the caller redirects to `/unauthorized`,
 * mirroring the old proxy's `verification-failed` branch.
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
