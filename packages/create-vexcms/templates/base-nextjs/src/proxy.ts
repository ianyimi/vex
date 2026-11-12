import { api } from "@convex/_generated/api";
import { LIVE_PREVIEW_COOKIE, LIVE_PREVIEW_QUERY_PARAM } from "@vexcms/core";
import { DRAFT_MODE_BYPASS_COOKIE } from "@vexcms/next/livePreview";
import { getSessionCookie } from "better-auth/cookies";
import { fetchQuery } from "convex/nextjs";
import { type NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_PREFIX } from "~/db/constants";
import vexConfig from "~/vex.config";

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
 * Paths the proxy must never guard, because they are where it sends people.
 * Guarding them turns a Convex outage into an infinite redirect loop.
 */
const ALWAYS_ALLOWED: Record<string, true> = { "/": true, "/unauthorized": true };

/**
 * Session gate for every route except the public ones in `config.matcher`,
 * plus the live-preview hand-off.
 *
 * `/admin/*` is one of those exclusions: its own page component
 * (`src/app/(vexcms)/admin/[[...path]]/page.tsx`) is its only gate, and fails
 * closed the same way this one does (see that file's doc comment).
 *
 * **Live preview.** A `?vexLivePreview=1` request from a verified session that
 * has not yet been through `/api/vex/live-preview` is redirected there: Draft
 * Mode can only be enabled from a Route Handler, never from middleware. "Been
 * through" means BOTH the `vex-live-preview` marker and Next's
 * `__prerender_bypass` cookie are present — the marker outlives Draft Mode
 * (1h vs. browser session), so the marker alone would skip re-enabling it. The
 * hand-off fails open: without a verified session the request continues as if
 * it carried no param, because the route's signed-out branch redirects back to
 * this same URL and would otherwise loop.
 *
 * Fails **closed** on guarded routes: if the session cannot be verified — no
 * cookie, no matching session, or the Convex lookup throwing — the request is
 * redirected rather than served. A verification error is not evidence of a
 * valid session, and serving the page anyway would drop authentication for
 * every guarded route the moment Convex became unreachable.
 *
 * Two distinct outcomes, deliberately:
 * - **No/invalid session** → `/auth/sign-in`, clearing the stale cookie so the
 *   presence check cannot lie on the next request.
 * - **Verification failed** (Convex unreachable, timeout) → `/unauthorized`,
 *   leaving cookies intact: the session may well be fine, so signing the user
 *   out and discarding it would be wrong.
 *
 * **`admin.livePreview.expiredSessions: "deny"`.** Every guarded route here
 * already fails closed on "unauthenticated" — but that only clears the
 * session cookie, never the two live-preview ones (`vex-live-preview` /
 * `__prerender_bypass`), and `ALWAYS_ALLOWED` routes (`/`, `/unauthorized`)
 * skip the session check entirely by default. Left alone (`"allow"`, the
 * default), a request carrying a live-preview cookie whose session has since
 * gone can keep Draft Mode on past sign-out until the cookies expire on their
 * own — not a content-secrecy gap, since draft content stays gated behind
 * each query's own `readDrafts` check, but it can serve the draft-only base
 * layer's published fallback (or nothing) instead of the live site. Setting
 * `expiredSessions: "deny"` closes that gap: ANY request carrying either
 * cookie — even an `ALWAYS_ALLOWED` one, even without `?vexLivePreview=1` —
 * is checked, and an unauthenticated one is redirected to
 * `/api/vex/live-preview?disable=1&redirect=<this path>` first, to clear both
 * cookies before (for a guarded route) the normal sign-in redirect would take
 * over on the next pass. A "verification-failed" session is left alone here
 * too, for the same reason `redirectToUnauthorized` leaves cookies intact.
 * `/api/vex/live-preview` itself is excluded from `config.matcher` below, so
 * this redirect can never loop.
 *
 * @param request - The incoming request.
 * @returns A redirect to the Draft Mode hand-off, the expired-session disable
 *   route, sign-in, or the unauthorized page; otherwise `NextResponse.next()`.
 */
export async function proxy(request: NextRequest) {
  const isAlwaysAllowed = ALWAYS_ALLOWED[request.nextUrl.pathname] === true;
  const hasPreviewMarker = hasAnyPreviewCookie(request);
  const isPreviewHandOff =
    request.nextUrl.searchParams.get(LIVE_PREVIEW_QUERY_PARAM) === "1" &&
    !hasPreviewHandOffCookies(request);
  const expiredSessionsDeny = vexConfig.admin.livePreview.expiredSessions === "deny";

  if (isAlwaysAllowed && !isPreviewHandOff && !(expiredSessionsDeny && hasPreviewMarker)) {
    return NextResponse.next();
  }

  const sessionStatus = await resolveSessionStatus(request);
  if (expiredSessionsDeny && hasPreviewMarker && sessionStatus === "unauthenticated") {
    return redirectToDisableLivePreview(request);
  }
  if (isPreviewHandOff && sessionStatus === "authenticated") {
    return redirectToDraftModeRoute(request);
  }
  if (isAlwaysAllowed) {
    return NextResponse.next();
  }
  if (sessionStatus === "unauthenticated") {
    return redirectToSignIn(request);
  }
  if (sessionStatus === "verification-failed") {
    return redirectToUnauthorized(request);
  }
  return NextResponse.next();
}

/**
 * Reads and verifies the Better Auth session cookie, through Better Auth's own
 * reader (it checks the `__Secure-` name, then the bare one).
 *
 * @param request - The incoming request.
 * @returns `"authenticated"` for a session with a user, `"unauthenticated"`
 *   for no cookie or no matching session, `"verification-failed"` when the
 *   Convex lookup throws.
 */
async function resolveSessionStatus(
  request: NextRequest,
): Promise<"authenticated" | "unauthenticated" | "verification-failed"> {
  const sessionToken = getSessionCookie(request, { cookiePrefix: AUTH_COOKIE_PREFIX });
  if (!sessionToken) return "unauthenticated";

  try {
    const session = await fetchQuery(api.auth.sessions.getSessionWithUser, {
      sessionToken: extractToken(sessionToken),
    });
    return session?.user ? "authenticated" : "unauthenticated";
  } catch {
    return "verification-failed";
  }
}

/**
 * Whether this request already round-tripped through `/api/vex/live-preview`
 * with Draft Mode still on.
 *
 * @param request - The incoming request.
 * @returns `true` when both the marker and Next's Draft Mode cookie are present.
 */
function hasPreviewHandOffCookies(request: NextRequest): boolean {
  return (
    request.cookies.get(LIVE_PREVIEW_COOKIE)?.value === "1" &&
    request.cookies.has(DRAFT_MODE_BYPASS_COOKIE)
  );
}

/**
 * Whether this request carries EITHER live-preview cookie — the marker or
 * Next's own Draft Mode cookie — as opposed to {@link hasPreviewHandOffCookies},
 * which requires both. Used by the `expiredSessions: "deny"` check: a stale
 * cookie on its own is still a sign that Draft Mode may be on for this
 * visitor.
 *
 * @param request - The incoming request.
 * @returns `true` when at least one of the two cookies is present.
 */
function hasAnyPreviewCookie(request: NextRequest): boolean {
  return (
    request.cookies.get(LIVE_PREVIEW_COOKIE)?.value === "1" ||
    request.cookies.has(DRAFT_MODE_BYPASS_COOKIE)
  );
}

/**
 * Redirect to the Draft Mode Route Handler, which re-verifies the session,
 * enables Draft Mode, sets the marker cookie, and sends the editor back here.
 *
 * @param request - The `?vexLivePreview=1` request to return to.
 * @returns A redirect to `/api/vex/live-preview?redirect=<this path + query>`.
 */
function redirectToDraftModeRoute(request: NextRequest) {
  const draftModeUrl = new URL("/api/vex/live-preview", request.url);
  draftModeUrl.searchParams.set("redirect", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(draftModeUrl);
}

/**
 * Redirect to the Draft Mode Route Handler's explicit disable branch — clears
 * both the `vex-live-preview` marker and `__prerender_bypass`, then sends the
 * visitor back here, published — used by the `expiredSessions: "deny"` check.
 *
 * @param request - The request carrying a stale live-preview cookie.
 * @returns A redirect to `/api/vex/live-preview?disable=1&redirect=<this path + query>`.
 */
function redirectToDisableLivePreview(request: NextRequest) {
  const disableUrl = new URL("/api/vex/live-preview", request.url);
  disableUrl.searchParams.set("disable", "1");
  disableUrl.searchParams.set("redirect", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(disableUrl);
}

/** Extract the raw token — better-auth stores "<raw_token>.<hmac_signature>" */
function extractToken(cookieValue: string) {
  return cookieValue.includes(".") ? cookieValue.split(".")[0] : cookieValue;
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

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|favicons|models/*|staging/*|auth/sign-in|auth/sign-up|admin).*)",
  ],
};
