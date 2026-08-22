import { api } from "@convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

const SESSION_COOKIES = {
  https: "__Secure-better-auth.session_token",
  http: "better-auth.session_token",
} as const;

/**
 * Paths the proxy must never guard, because they are where it sends people.
 * Guarding them turns a Convex outage into an infinite redirect loop.
 */
const ALWAYS_ALLOWED: Record<string, true> = { "/": true, "/unauthorized": true };

/**
 * Session gate for every route except the public ones in `config.matcher`.
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
  if (ALWAYS_ALLOWED[request.nextUrl.pathname]) {
    return NextResponse.next();
  }

  const cookieStore = await cookies();
  const sessionToken =
    cookieStore.get(SESSION_COOKIES.https)?.value ?? cookieStore.get(SESSION_COOKIES.http)?.value;
  if (!sessionToken) {
    return redirectToSignIn(request);
  }

  try {
    const session = await fetchQuery(api.auth.sessions.getSessionWithUser, {
      sessionToken: extractToken(sessionToken),
    });
    if (!session?.user) {
      return redirectToSignIn(request);
    }
  } catch {
    // Fail closed. Previously this returned `NextResponse.next()`, which served
    // every guarded route unauthenticated whenever this lookup threw.
    return redirectToUnauthorized(request);
  }

  return NextResponse.next();
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
  for (const cookie of Object.values(SESSION_COOKIES)) {
    // Clear the stale cookie so the presence-check never lies again
    response.cookies.delete(cookie);
  }
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
    "/((?!api|_next/static|_next/image|favicon.ico|favicons|models/*|staging/*|auth/sign-in|auth/sign-up|$).*)",
  ],
};
