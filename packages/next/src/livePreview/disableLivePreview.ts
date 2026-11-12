/**
 * Default path of the host app's Draft Mode route — the one
 * {@link createVexDraftModeRoute} mounts as `app/api/vex/live-preview/route.ts`
 * in every scaffolded project.
 */
export const DEFAULT_LIVE_PREVIEW_ROUTE_PATH = "/api/vex/live-preview";

/**
 * Tells the host app's Draft Mode route (`createVexDraftModeRoute`) to disable
 * live preview — clearing both Next's own Draft Mode cookie
 * (`__prerender_bypass`) and the `vex-live-preview` marker cookie — without
 * navigating the current page there.
 *
 * **Why this exists.** Signing out does not, by itself, touch either of those
 * cookies: they are set by a Route Handler (`createVexDraftModeRoute`), not by
 * Better Auth, so Better Auth's own `signOut()` has no way to know about them.
 * Left alone, a visitor who signs out while the live-preview pop-out tab (or
 * any tab) is open keeps both cookies past sign-out, and a public page's
 * `getBySlugPreview` query — now running for an anonymous caller — can return
 * `[]` where the published query would have found a row.
 *
 * Call this from every sign-out entry point, before the hard navigation/
 * refresh that follows (alongside `beginTransition(null)`) — see
 * `VexAdminAuthAdapterProvider`'s `signOut` and each app's `SessionButton`.
 *
 * **Same-origin, credentialed, fire-and-forget.** Issues a plain `GET` with
 * `?disable=1` and `credentials: "same-origin"` so the route sees the
 * visitor's own cookies. `redirect: "manual"` stops `fetch` from following the
 * route's own redirect back into a page load — this call only needs the
 * cookies cleared, not the page the route would otherwise send the browser
 * to. Never throws: a sign-out must proceed whether or not this request
 * succeeds (network error, the route 404ing in an older deployment, etc.).
 *
 * @param path - The host app's Draft Mode route path.
 * @defaultValue {@link DEFAULT_LIVE_PREVIEW_ROUTE_PATH}
 * @returns A promise that always resolves, never rejects.
 */
export async function disableLivePreview(
  path: string = DEFAULT_LIVE_PREVIEW_ROUTE_PATH,
): Promise<void> {
  try {
    await fetch(`${path}?disable=1`, {
      method: "GET",
      credentials: "same-origin",
      redirect: "manual",
    });
  } catch {
    // Quiet by design — see the doc comment above.
  }
}
