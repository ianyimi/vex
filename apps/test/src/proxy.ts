import { api } from "@convex/_generated/api";
import { LIVE_PREVIEW_COOKIE, LIVE_PREVIEW_QUERY_PARAM } from "@vexcms/core";
import { DRAFT_MODE_BYPASS_COOKIE } from "@vexcms/next/livePreview";
import { getSessionCookie } from "better-auth/cookies";
import { fetchQuery } from "convex/nextjs";
import { type NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_PREFIX } from "~/db/constants";
import vexConfig from "~/vex.config";

/**
 * Public-route pass for this app — the only thing left in `proxy.ts`:
 * the admin panel's session gate used to
 * live here too (`guardAdminRequest`), but it imported `~/vex.config` — a
 * module that drags client components and `@vexcms/react` along with it —
 * into the edge bundle for every request, including ones this proxy never
 * even reached. `/admin/*` is excluded from `config.matcher` below, so this
 * function never runs for it at all; the gate now lives entirely in
 * `src/app/(vexcms)/admin/[[...path]]/page.tsx`, which fails closed the same
 * way this one used to (see that file's doc comment). This proxy now imports
 * `~/vex.config` too, but only to read one plain field —
 * `admin.livePreview.expiredSessions` — not to drive route-by-route guard
 * logic, so it does not reintroduce the per-collection/field bundle this
 * comment used to warn about.
 *
 * **This is the marketing-site variant.** The base template guards every route
 * except a small allowlist, which is right for a private app and wrong here:
 * a marketing site's pages are public content served from the CMS, so a
 * fail-closed gate over `/(.*)` would send anonymous visitors from
 * `/features` and `/roadmap` straight to sign-in. There is no session gate
 * here at all anymore — the only thing this proxy does is hand a request
 * carrying `?vexLivePreview=1` off to `/api/vex/live-preview`
 * (`createVexDraftModeRoute`) once a verified admin session backs it, and
 * (in `"deny"` mode) clear a live-preview session whose auth has expired.
 * Fails **open** — an unauthenticated or unverifiable session here renders
 * the page normally rather than redirecting, except when it is carrying a
 * live-preview marker and `expiredSessions` is `"deny"` (see below).
 *
 * **Why a hand-off instead of setting a cookie directly, like before.** Live
 * preview of a document that has never been published needs Next.js Draft
 * Mode enabled (`[slug]/page.tsx`'s own doc comment) so its public route can
 * skip `notFound()` for the client-side preview layer to take over — and
 * `draftMode().enable()` can only be called from a Route Handler or Server
 * Action, never from middleware. The route handler re-verifies the session,
 * enables Draft Mode, sets `vex-live-preview` itself now (the marker
 * `LivePreviewProvider` gates on client-side), and redirects back to this
 * exact URL; the cookie check below then requires BOTH that marker AND
 * Next's own Draft Mode cookie (`DRAFT_MODE_BYPASS_COOKIE`,
 * `__prerender_bypass`) before letting the second pass through instead of
 * handing off again — the marker alone is not enough, because it outlives
 * Draft Mode: it is set for `LIVE_PREVIEW_COOKIE_MAX_AGE_SECONDS` (1h) while
 * `__prerender_bypass` is a browser-session cookie Next can clear well before
 * that (closed browser, a separate disable). Short-circuiting on the marker
 * alone would then skip the hand-off — and never re-enable Draft Mode — for
 * up to the rest of that hour.
 *
 * **Re-verifying the session on an expired-preview check — `admin.livePreview.expiredSessions`.**
 * A request carrying either live-preview cookie — the marker or Draft Mode's
 * own `__prerender_bypass` — could, in principle, have had its session
 * revoked since the hand-off: signed out in this tab (the pop-out preview
 * tab calling the app's sign-out route) or another one, or a natural session
 * expiry. Left alone (`"allow"`, the default), that means Draft Mode stays on
 * past sign-out until one of the two cookies expires on its own — not a
 * content-secrecy gap either way, since Draft Mode only changes which branch
 * a page takes and draft content stays gated behind each query's own
 * `readDrafts` check, but an anonymous visitor can be served the draft-only
 * base layer's published fallback (or nothing) instead of the live site in
 * the meantime. Setting `admin.livePreview.expiredSessions: "deny"` closes
 * that gap: any request carrying either cookie — with or without
 * `?vexLivePreview=1` — calls `resolveSessionStatus` once, and when the
 * session no longer verifies, redirects to
 * `/api/vex/live-preview?disable=1&redirect=<this path>` to clear both
 * cookies and reload the page published. `/api/vex/live-preview` itself is
 * excluded from `config.matcher` below, so that redirect can never loop.
 *
 * @param request - The incoming request.
 * @returns `NextResponse.next()`, or a redirect to the Draft Mode hand-off
 *   or the expired-session disable route.
 */
export async function proxy(request: NextRequest) {
  const hasLivePreviewCookie = request.cookies.get(LIVE_PREVIEW_COOKIE)?.value === "1";
  const hasDraftBypassCookie = request.cookies.has(DRAFT_MODE_BYPASS_COOKIE);
  const hasPreviewMarker = hasLivePreviewCookie || hasDraftBypassCookie;
  const wantsHandOff = request.nextUrl.searchParams.get(LIVE_PREVIEW_QUERY_PARAM) === "1";
  const expiredSessionsDeny = vexConfig.admin.livePreview.expiredSessions === "deny";

  if (!wantsHandOff && !(expiredSessionsDeny && hasPreviewMarker)) {
    return NextResponse.next();
  }

  const alreadyHandedOff = hasLivePreviewCookie && hasDraftBypassCookie;
  if (!expiredSessionsDeny && alreadyHandedOff) {
    return NextResponse.next();
  }

  const sessionStatus = await resolveSessionStatus(request);

  if (sessionStatus !== "authenticated") {
    if (expiredSessionsDeny && hasPreviewMarker) {
      const disableUrl = new URL("/api/vex/live-preview", request.url);
      disableUrl.searchParams.set("disable", "1");
      disableUrl.searchParams.set("redirect", request.nextUrl.pathname + request.nextUrl.search);
      return NextResponse.redirect(disableUrl);
    }
    return NextResponse.next();
  }

  if (!wantsHandOff || alreadyHandedOff) {
    return NextResponse.next();
  }

  const draftModeUrl = new URL("/api/vex/live-preview", request.url);
  draftModeUrl.searchParams.set("redirect", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(draftModeUrl);
}

/** Extract the raw token — better-auth stores "<raw_token>.<hmac_signature>" */
function extractToken(cookieValue: string) {
  return cookieValue.includes(".") ? cookieValue.split(".")[0] : cookieValue;
}

/** Reads and verifies the Better Auth session cookie — used by `proxy`. */
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
    // `proxy` treats this as "no preview" rather than an error.
    return "verification-failed";
  }
}

export const config = {
  // Allowlist, not denylist. The base template denies everything except a few
  // paths; here the public site IS the product, so the gate names the private
  // surfaces explicitly. Anything added under `(vexcms)` must be added here.
  // `admin` is excluded on purpose — its gate lives in the admin page itself,
  // not here (see the doc comment on `proxy` above). `api` (including
  // `/api/vex/live-preview`) is excluded too — the expired-session disable
  // redirect above targets that route, and intercepting it here would loop.
  matcher: ["/((?!admin|api|_next/static|_next/image|favicon.ico).*)"],
};
