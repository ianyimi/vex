import { LIVE_PREVIEW_COOKIE, LIVE_PREVIEW_COOKIE_MAX_AGE_SECONDS } from "@vexcms/core";
import { draftMode } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Name of Next.js' own Draft Mode cookie — set when `(await draftMode()).enable()`
 * runs, cleared by `.disable()`. Next.js does not export this name; it is the
 * literal `COOKIE_NAME_PRERENDER_BYPASS` baked into its Route Handler/Server Action
 * runtime (see the {@link https://nextjs.org/docs/app/guides/draft-mode | Draft Mode guide}
 * and Next's own `api-utils/try-get-preview-data` source). Exported here so a
 * project's `proxy.ts` can tell "Draft Mode is actually still on" (this cookie)
 * apart from "the hand-off round-tripped once" ({@link LIVE_PREVIEW_COOKIE}, which
 * outlives this one — see that constant's own doc comment).
 */
export const DRAFT_MODE_BYPASS_COOKIE = "__prerender_bypass";

/** Props for {@link createVexDraftModeRoute}. */
export interface CreateVexDraftModeRouteProps {
  /**
   * Reads the caller's session token for the current request. Wire to the host
   * app's `getToken` export (`convexBetterAuthNextJs`'s output, re-exported
   * from e.g. `~/auth/server`) — the same accessor `createVexRevalidateRoute`
   * takes, and the same bar: a present, non-expired token is "authorized",
   * exactly as it is for every other session-gated admin action in a VexCMS
   * project. A falsy return means "no session".
   */
  getToken: () => Promise<null | string | undefined>;
}

/**
 * Creates the Next.js Route Handler that enables or disables
 * {@link https://nextjs.org/docs/app/guides/draft-mode | Draft Mode} for a
 * live-preview session, then redirects back to the previewed page.
 *
 * **Why a Route Handler, not middleware.** `draftMode().enable()`/`.disable()` are
 * only callable from a Route Handler or Server Action — Next.js explicitly rejects
 * calling them from middleware (it needs the full Node `cookies()` write path
 * middleware's Edge runtime doesn't give it). The project's own proxy/middleware
 * (`proxy` in the generated `proxy.ts`) still owns the first touch of a
 * `?vexLivePreview=1` request; once it sees that request has NOT already
 * round-tripped through here (both {@link LIVE_PREVIEW_COOKIE} and the real
 * {@link DRAFT_MODE_BYPASS_COOKIE} present is the signal — see that proxy's own
 * doc comment), it redirects here instead of passing the request straight through.
 *
 * **Why this matters for a never-published document.** A public page route calls its
 * published-only query (`access.bypass: true`) on the server and 404s when nothing
 * comes back, so the page stays statically prerenderable. A document with only a draft
 * row — never published — has nothing for that query to find, so the 404 fired before
 * the client-side live-preview layer (which DOES know how to read the draft, via a
 * second, `readDrafts`-gated query) ever got to mount. Enabling Draft Mode here lets
 * that page check `(await draftMode()).isEnabled` and skip the 404 instead, handing
 * the document to the client layer — without losing static prerendering for every
 * visitor outside draft mode, which is exactly what Draft Mode is for.
 *
 * **Session-authorized, not secret-authorized.** Same posture as
 * `createVexRevalidateRoute`: enabling is gated on a signed-in admin, checked with
 * the host app's own `getToken`, not a shared secret or env var. Reaching this route
 * grants nothing by itself either way — Draft Mode only changes which branch a page
 * takes; the actual draft content is still gated behind each query's own
 * `readDrafts` permission check.
 *
 * **Three ways to land here, two outcomes:**
 *
 * 1. **Enable** — a session is present, no `?disable=1`, and `redirect` is a valid
 *    same-origin path. Calls `.enable()`, sets {@link LIVE_PREVIEW_COOKIE}, redirects.
 * 2. **Explicit disable** — `?disable=1`, with or without a session (leaving preview
 *    mode needs no authorization — it only turns a feature off). Calls `.disable()`,
 *    clears {@link LIVE_PREVIEW_COOKIE}, redirects to `redirect` or `/` if absent.
 * 3. **Signed-out disable** — no session, no `?disable=1`, but `redirect` IS present.
 *    This is the shape the proxy hands off (`redirect` is always the page the visitor
 *    was on): a session that expired between the page load and this request should
 *    not leave a stale `__prerender_bypass` cookie granting Draft Mode to a now-
 *    anonymous visitor, so this disables and redirects exactly like an explicit
 *    disable rather than leaving them on a bare error page.
 *
 * **Signed-out stays distinguishable when there's nothing to redirect to.** No
 * session, no `?disable=1`, AND no `redirect` param is the one case that still
 * returns `401` — a caller hitting this route directly (not through the proxy's
 * hand-off, which always sets `redirect`) gets a real "you are not authorized"
 * signal instead of being silently bounced to `/`.
 *
 * **Open-redirect guarded on every redirect.** The `redirect` search param, when
 * present, must be a same-origin relative path (a leading `/` that is not `//` or
 * `/\`, the two shapes a browser would resolve as protocol-relative) — anything
 * else is rejected with `400`, never followed, regardless of which of the three
 * outcomes above the request would otherwise take.
 *
 * @param props - The host app's session accessor.
 * @returns `{ GET }` — mount directly as the route module's named export.
 *
 * @example
 * ```ts
 * // app/api/vex/live-preview/route.ts
 * import { createVexDraftModeRoute } from "@vexcms/next/livePreview";
 * import { getToken } from "~/auth/server";
 *
 * export const { GET } = createVexDraftModeRoute({ getToken });
 * ```
 */
export function createVexDraftModeRoute(props: CreateVexDraftModeRouteProps): {
  GET: (request: NextRequest) => Promise<NextResponse>;
} {
  return {
    async GET(request: NextRequest): Promise<NextResponse> {
      const redirectResult = resolveRedirectTarget(request);
      if (redirectResult.kind === "invalid") {
        return NextResponse.json({ error: "Bad Request" }, { status: 400 });
      }

      const disableRequested = request.nextUrl.searchParams.get("disable") === "1";
      if (disableRequested) {
        return disableAndRedirect(request, redirectResult);
      }

      const token = await props.getToken();
      if (token === null || token === undefined || token === "") {
        if (redirectResult.kind === "none") {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        // Signed-out, but the proxy handed this off with a real page to return
        // to — disable rather than 401 so an expired session never leaves the
        // visitor stuck in Draft Mode on a bare error page.
        return disableAndRedirect(request, redirectResult);
      }

      if (redirectResult.kind === "none") {
        return NextResponse.json({ error: "Bad Request" }, { status: 400 });
      }

      const draft = await draftMode();
      draft.enable();

      const response = NextResponse.redirect(new URL(redirectResult.target, request.url));
      response.cookies.set(LIVE_PREVIEW_COOKIE, "1", {
        httpOnly: false,
        maxAge: LIVE_PREVIEW_COOKIE_MAX_AGE_SECONDS,
        path: "/",
        sameSite: "lax",
      });
      return response;
    },
  };
}

/**
 * Disables Draft Mode, clears {@link LIVE_PREVIEW_COOKIE}, and redirects to the
 * already-validated target — the shared tail of the explicit-disable and
 * signed-out-disable outcomes described on {@link createVexDraftModeRoute}.
 *
 * @param request - The incoming request, used to resolve the redirect's origin.
 * @param redirectResult - The already-validated result of {@link resolveRedirectTarget}
 *   — only `"none"` or `"valid"` reach here, `"invalid"` is rejected earlier.
 * @returns A redirect response with Draft Mode disabled and the marker cookie cleared.
 */
async function disableAndRedirect(
  request: NextRequest,
  redirectResult: Exclude<RedirectTarget, { kind: "invalid" }>,
): Promise<NextResponse> {
  const draft = await draftMode();
  draft.disable();

  const target = redirectResult.kind === "valid" ? redirectResult.target : "/";
  const response = NextResponse.redirect(new URL(target, request.url));
  response.cookies.delete(LIVE_PREVIEW_COOKIE);
  return response;
}

/** Result of validating the `redirect` search param — see {@link resolveRedirectTarget}. */
type RedirectTarget =
  | { kind: "invalid" }
  | { kind: "none" }
  | { kind: "valid"; target: string };

/**
 * Validates and normalizes the `redirect` search param into a same-origin
 * path-plus-query-plus-hash string.
 *
 * @param request - The incoming request.
 * @returns `{ kind: "none" }` when `redirect` is absent, `{ kind: "invalid" }` when
 *   present but it looks like it could escape the current origin, or
 *   `{ kind: "valid", target }` with the normalized same-origin target.
 */
function resolveRedirectTarget(request: NextRequest): RedirectTarget {
  const raw = request.nextUrl.searchParams.get("redirect");
  if (!raw) return { kind: "none" };
  // A single leading slash that is NOT `//...` or `/\...` always resolves
  // same-origin below — those two shapes are the ones a browser would instead
  // treat as protocol-relative (scheme-less absolute) URLs.
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return { kind: "invalid" };
  }

  try {
    const resolved = new URL(raw, request.url);
    if (resolved.origin !== request.nextUrl.origin) return { kind: "invalid" };
    return { kind: "valid", target: `${resolved.pathname}${resolved.search}${resolved.hash}` };
  } catch {
    return { kind: "invalid" };
  }
}
