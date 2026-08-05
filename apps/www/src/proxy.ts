import { api } from "@convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

const SESSION_COOKIES = {
  https: "__Secure-better-auth.session_token",
  http: "better-auth.session_token",
} as const;

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    return NextResponse.next();
  }

  const cookieStore = await cookies();
  try {
    const sessionToken =
      cookieStore.get(SESSION_COOKIES.https)?.value ?? cookieStore.get(SESSION_COOKIES.http)?.value;
    if (!sessionToken) {
      return redirectToSignIn(request);
    }
    const session = await fetchQuery(api.auth.sessions.getSessionWithUser, {
      sessionToken: extractToken(sessionToken),
    });
    if (!session?.user) {
      return redirectToSignIn(request);
    }
  } catch {
    // TODO: consider redirecting here instead of failing forward on convex connection error
    return NextResponse.next();
  }

  return NextResponse.next();
}

/** Extract the raw token — better-auth stores "<raw_token>.<hmac_signature>" */
function extractToken(cookieValue: string) {
  return cookieValue.includes(".") ? cookieValue.split(".")[0] : cookieValue;
}

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

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|favicons|models/*|staging/*|auth/sign-in|auth/sign-up|$).*)",
  ],
};
