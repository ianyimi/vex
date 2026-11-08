import { api } from "@convex/_generated/api";
import {
  LIVE_PREVIEW_COOKIE,
  LIVE_PREVIEW_COOKIE_MAX_AGE_SECONDS,
  LIVE_PREVIEW_QUERY_PARAM,
} from "@vexcms/core";
import { getSessionCookie } from "better-auth/cookies";
import { fetchQuery } from "convex/nextjs";
import { type NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_PREFIX } from "~/db/constants";

/**
 * Public-route pass for this app — the only gate left in `proxy.ts`:
 * the admin panel's session gate used to
 * live here too (`guardAdminRequest`), but it imported `~/vex.config` — a
 * module that drags client components and `@vexcms/react` along with it —
 * into the edge bundle for every request, including ones this proxy never
 * even reached. `/admin/*` is excluded from `config.matcher` below, so this
 * function never runs for it at all; the gate now lives entirely in
 * `src/app/(vexcms)/admin/[[...path]]/page.tsx`, which fails closed the same
 * way this one used to (see that file's doc comment).
 *
 * **This is the marketing-site variant.** The base template guards every route
 * except a small allowlist, which is right for a private app and wrong here:
 * a marketing site's pages are public content served from the CMS, so a
 * fail-closed gate over `/(.*)` would send anonymous visitors from
 * `/features` and `/roadmap` straight to sign-in. There is no session gate
 * here at all anymore — the only thing this proxy does is grant live-preview
 * mode to a request carrying `?vexLivePreview=1` and a verified admin
 * session, by setting the `vex-live-preview` marker cookie that
 * `LivePreviewProvider` gates on client-side. Fails **open** — an
 * unauthenticated or unverifiable session here renders the page normally
 * rather than redirecting.
 *
 * A cookie rather than a forwarded request header: a header would have to be
 * read with `next/headers` in the site layout, which opts every public route
 * out of static prerendering.
 *
 * @param request - The incoming request.
 * @returns `NextResponse.next()`, optionally carrying the live-preview cookie.
 */
export async function proxy(request: NextRequest) {
  if (request.nextUrl.searchParams.get(LIVE_PREVIEW_QUERY_PARAM) !== "1") {
    return NextResponse.next();
  }

  const sessionStatus = await resolveSessionStatus(request);
  if (sessionStatus !== "authenticated") {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  response.cookies.set(LIVE_PREVIEW_COOKIE, "1", {
    path: "/",
    maxAge: LIVE_PREVIEW_COOKIE_MAX_AGE_SECONDS,
    sameSite: "lax",
    // Read by `LivePreviewProvider` in the browser — the whole point of the
    // cookie. It carries no secret, only the fact that a session verified.
    httpOnly: false,
  });
  return response;
}

/** Reads and verifies the Better Auth session cookie — used by `proxy`. */
async function resolveSessionStatus(request: NextRequest): Promise<
  "authenticated" | "unauthenticated" | "verification-failed"
> {
  // Better Auth's own reader (AP-022): checks the `__Secure-` name, then the bare one.
  const sessionToken = getSessionCookie(request, { cookiePrefix: AUTH_COOKIE_PREFIX });
  if (!sessionToken) return "unauthenticated";

  try {
    const session = await fetchQuery(api.auth.sessions.getSessionWithUser, {
      sessionToken: extractToken(sessionToken),
    });
    return session?.user ? "authenticated" : "unauthenticated";
  } catch {
    // `proxy` treats this as "no preview" rather than an error.
    return "verification-failed";
  }
}

/** Extract the raw token — better-auth stores "<raw_token>.<hmac_signature>" */
function extractToken(cookieValue: string) {
  return cookieValue.includes(".") ? cookieValue.split(".")[0] : cookieValue;
}

export const config = {
  // Allowlist, not denylist. The base template denies everything except a few
  // paths; here the public site IS the product, so the gate names the private
  // surfaces explicitly. Anything added under `(vexcms)` must be added here.
  // `admin` is excluded on purpose — its gate lives in the admin page itself,
  // not here (see the doc comment on `proxy` above).
  matcher: ["/((?!admin|_next/static|_next/image|favicon.ico).*)"],
};
