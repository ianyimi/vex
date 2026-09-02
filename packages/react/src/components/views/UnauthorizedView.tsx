import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";

/**
 * Props for {@link UnauthorizedView}.
 */
export interface UnauthorizedViewProps {
  /**
   * Heading shown to the caller.
   *
   * @defaultValue "Access denied"
   */
  title?: string;
  /**
   * Explanation shown under the heading. Keep it non-specific — do not reveal
   * which roles or resources exist, since this page is reachable by callers who
   * failed authorization.
   *
   * @defaultValue "You do not have permission to access the admin panel."
   */
  description?: string;
  /**
   * Optional action rendered under the message, e.g. a sign-out control or a
   * link back to the public site. Omit for a message-only page.
   */
  children?: React.ReactNode;
}

/**
 * Standalone "you do not have access" page for callers who fail an access
 * check — typically the `adminPanel.access` gate.
 *
 * Renders on its own, without the admin shell: a caller who cannot open the
 * panel should not see its sidebar or navigation, both because those leak the
 * collection and global names they are not entitled to and because the shell's
 * queries would be denied anyway.
 *
 * The host app decides how this is reached. Redirecting to a dedicated route
 * outside the guarded segment is the simplest approach; rendering it directly in
 * place of the panel also works and avoids a navigation.
 *
 * @param props - Optional copy overrides and an optional action.
 * @returns A centered card stating that access was denied.
 * @example
 * ```tsx
 * // app/unauthorized/page.tsx
 * import { UnauthorizedView } from "@vexcms/react";
 *
 * export default function Unauthorized() {
 *   return (
 *     <UnauthorizedView>
 *       <a href="/">Return to site</a>
 *     </UnauthorizedView>
 *   );
 * }
 * ```
 */
export function UnauthorizedView({
  title = "Access denied",
  description = "You do not have permission to access the admin panel.",
  children,
}: UnauthorizedViewProps) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6 text-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {children ? <div className="px-6 py-6 text-sm">{children}</div> : null}
      </Card>
    </main>
  );
}
