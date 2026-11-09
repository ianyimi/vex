import { api } from "@convex/_generated/api";
import { LIVE_PREVIEW_COOKIE, LIVE_PREVIEW_QUERY_PARAM } from "@vexcms/core";
import { DRAFT_MODE_BYPASS_COOKIE } from "@vexcms/next/livePreview";
import { getSessionCookie } from "better-auth/cookies";
import { fetchQuery } from "convex/nextjs";
import { type NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_PREFIX } from "~/db/constants";

/**
 * Public-route pass for this app — the only thing left in `proxy.ts`:
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
 * here at all anymore — the only thing this proxy does is hand a request
 * carrying `?vexLivePreview=1` off to `/api/vex/live-preview`
 * (`createVexDraftModeRoute`) once a verified admin session backs it. Fails
 * **open** — an unauthenticated or unverifiable session here renders the
 * page normally rather than redirecting.
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
 * **Not re-verifying the session on every short-circuited reload.** A request
 * carrying both cookies could, in principle, have had its session revoked
 * since the hand-off (signed out elsewhere) — strictly that means Draft Mode
 * stays on past sign-out until one of the two cookies above expires. Closing
 * that gap would mean calling `resolveSessionStatus` (a Convex round trip) on
 * every single live-preview-iframe reload instead of only the first one per
 * cookie lifetime, which is the exact cost this cookie pair exists to avoid —
 * not cheap, so left open rather than added here. It is not a content-secrecy
 * gap either way: Draft Mode only changes which branch a page takes, and the
 * actual draft content stays gated behind each query's own `readDrafts`
 * permission check, same as `createVexDraftModeRoute`'s own posture.
 *
 * @param request - The incoming request.
 * @returns `NextResponse.next()`, or a redirect to the Draft Mode hand-off.
 */
export async function proxy(request: NextRequest) {
  if (request.nextUrl.searchParams.get(LIVE_PREVIEW_QUERY_PARAM) !== "1") {
    return NextResponse.next();
  }

  const alreadyHandedOff =
    request.cookies.get(LIVE_PREVIEW_COOKIE)?.value === "1" &&
    request.cookies.has(DRAFT_MODE_BYPASS_COOKIE);
  if (alreadyHandedOff) {
    return NextResponse.next();
  }

  const sessionStatus = await resolveSessionStatus(request);
  if (sessionStatus !== "authenticated") {
    return NextResponse.next();
  }

  const draftModeUrl = new URL("/api/vex/live-preview", request.url);
  draftModeUrl.searchParams.set("redirect", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(draftModeUrl);
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
