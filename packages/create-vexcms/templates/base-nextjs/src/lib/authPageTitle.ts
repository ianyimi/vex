const AUTH_PAGE_TITLES: Record<string, string> = {
  "forgot-password": "Forgot password",
  "reset-password": "Reset password",
  "sign-in": "Sign in",
  "sign-up": "Sign up",
}

/**
 * Resolves the human-readable title for a better-auth-ui route segment.
 *
 * @param pathname - The `[pathname]` route param (e.g. `"sign-in"`).
 * @returns The matching label, or `"Account"` for any unmapped segment.
 */
export function resolveAuthPageTitle(pathname: string): string {
  return AUTH_PAGE_TITLES[pathname] ?? "Account"
}
