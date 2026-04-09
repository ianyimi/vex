import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    return NextResponse.next()
  }

  const cookieStore = await cookies()
  const sessionToken = cookieStore.get("better-auth.session_token")

  if (!sessionToken) {
    return NextResponse.redirect(new URL("/auth/sign-in", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|models/*|staging/*|auth/sign-in|auth/sign-up|$).*)",
  ],
}
