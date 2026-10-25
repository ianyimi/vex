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
 * Both names Better Auth may give this app's session cookie: `__Secure-` over
 * https, bare over http. Derived from `AUTH_COOKIE_PREFIX` so a different
 * Better Auth app's cookie on the same host (e.g. another `localhost` port) is
 * never read — or deleted — as ours.
 */
const SESSION_COOKIES = {
  https: `__Secure-${AUTH_COOKIE_PREFIX}.session_token`,
  http: `${AUTH_COOKIE_PREFIX}.session_token`,
} as const;

/**
 * Session gate for the private surfaces named in `config.matcher`.
 *
 * **This is the marketing-site variant.** The base template guards every route
 * except a small allowlist, which is right for a private app and wrong here:
 * a marketing site's pages are public content served from the CMS, so a
 * fail-closed gate over `/(.*)` sends anonymous visitors from `/features` and
 * `/roadmap` straight to sign-in. The matcher below inverts that — only the
 * admin panel is gated, and the public site is public.
 *
 * The admin panel is not defended by this gate alone: every collection query
 * runs the RBAC rules from `vex.config.ts`, and unauthenticated callers
 * resolve through `anonRole`. The proxy is defence in depth and a redirect
 * convenience, not the access control.
 *
 * Fails **closed**: if the session cannot be verified — no cookie, no matching
 * session, or the Convex lookup throwing — the request is redirected rather than
 * served. A verification error is not evidence of a valid session, and serving
 * the page anyway would drop authentication for every guarded route the moment
 * Convex became unreachable.
 *
 * Two distinct outcomes, deliberately:
 * - **No/invalid session** → `/auth/sign-in`, clearing the stale cookie so the
 *   presence check cannot lie on the next request.
 * - **Verification failed** (Convex unreachable, timeout) → `/unauthorized`,
 *   leaving cookies intact: the session may well be fine, so signing the user
 *   out and discarding it would be wrong.
 *
 * @param request - The incoming request.
 * @returns `NextResponse.next()` when the session is verified, otherwise a
 *   redirect to sign-in or to the unauthorized page.
 */
export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin")) {
    return guardAdminRequest(request);
  }

  return grantPreviewIfRequested(request);
}

/** Extract the raw token — better-auth stores "<raw_token>.<hmac_signature>" */
function extractToken(cookieValue: string) {
  return cookieValue.includes(".") ? cookieValue.split(".")[0] : cookieValue;
}

/**
 * Grants live-preview mode to a public-route request carrying `?vexLivePreview=1`
 * and a verified admin session, by setting the `vex-live-preview` marker
 * cookie that `LivePreviewProvider` gates on client-side. Fails **open** — an
 * unauthenticated or unverifiable session here renders the page normally
 * rather than redirecting.
 *
 * A cookie rather than a forwarded request header: a header would have to be
 * read with `next/headers` in the site layout, which opts every public route
 * out of static prerendering.
 */
async function grantPreviewIfRequested(request: NextRequest) {
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

/** Session gate for the admin panel — fails closed, per the docstring above. */
async function guardAdminRequest(request: NextRequest) {
  const sessionStatus = await resolveSessionStatus(request);

  if (sessionStatus === "verification-failed") {
    return redirectToUnauthorized(request);
  }
  if (sessionStatus === "unauthenticated") {
    return redirectToSignIn(request);
  }
  return NextResponse.next();
}

/**
 * Redirect for a caller with no usable session. Clears the session cookies so
 * the presence check cannot lie on the next request.
 *
 * @param request - The request being rejected.
 * @returns A redirect to sign-in preserving the intended destination.
 */
function redirectToSignIn(request: NextRequest) {
  const signInUrl = new URL("/auth/sign-in", request.url);
  // Preserve where the user was headed (path + query)
  signInUrl.searchParams.set("redirectTo", request.nextUrl.pathname + request.nextUrl.search);

  const response = NextResponse.redirect(signInUrl);
  // Clear the stale cookie so the presence-check never lies again. The
  // `__Secure-` name must be expired with `secure: true` — browsers reject any
  // `Set-Cookie` for a `__Secure-` name that lacks it, so a bare delete is a
  // silent no-op.
  response.cookies.delete({ name: SESSION_COOKIES.https, path: "/", secure: true });
  response.cookies.delete({ name: SESSION_COOKIES.http, path: "/" });
  return response;
}

/**
 * Redirect for a caller whose session could not be *verified* — as opposed to
 * one who has none.
 *
 * Cookies are deliberately left intact: the session is probably valid and the
 * verification path (Convex) is simply unavailable, so discarding it would sign
 * out every user during an outage. `/unauthorized` is exempt from this proxy, so
 * this cannot loop.
 *
 * @param request - The request that could not be verified.
 * @returns A redirect to the unauthorized page.
 */
function redirectToUnauthorized(request: NextRequest) {
  return NextResponse.redirect(new URL("/unauthorized", request.url));
}

/** Reads and verifies the Better Auth session cookie — shared by both branches above. */
async function resolveSessionStatus(
  request: NextRequest,
): Promise<"authenticated" | "unauthenticated" | "verification-failed"> {
  // Better Auth's own reader (AP-022): checks the `__Secure-` name, then the bare one.
  const sessionToken = getSessionCookie(request, { cookiePrefix: AUTH_COOKIE_PREFIX });
  if (!sessionToken) {return "unauthenticated";}

  try {
    const session = await fetchQuery(api.auth.sessions.getSessionWithUser, {
      sessionToken: extractToken(sessionToken),
    });
    return session?.user ? "authenticated" : "unauthenticated";
  } catch {
    // Fail closed for the admin branch; grantPreviewIfRequested treats this as
    // "no preview" rather than an error.
    return "verification-failed";
  }
}

export const config = {
  // Allowlist, not denylist. The base template denies everything except a few
  // paths; here the public site IS the product, so the gate names the private
  // surfaces explicitly. Anything added under `(vexcms)` must be added here.
  matcher: ["/admin/:path*", "/((?!_next/static|_next/image|favicon.ico).*)"],
};
