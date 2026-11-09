import { createVexDraftModeRoute } from "@vexcms/next/livePreview"

import { getToken } from "~/auth/server"

/**
 * `GET /api/vex/live-preview` — enables or disables Next.js Draft Mode for
 * this app's live-preview sessions.
 *
 * `proxy.ts`'s `proxy` hands a `?vexLivePreview=1` request off here once it
 * verifies the session itself; this route re-verifies with its own session
 * accessor (`getToken`), enables Draft Mode, and redirects back to `redirect`
 * — `[slug]/page.tsx` checks `(await draftMode()).isEnabled` to let a
 * never-published page skip its 404 for the client-side preview layer.
 *
 * Also handles leaving preview mode: `?disable=1` (no session required —
 * turning preview off needs no authorization) and a signed-out request that
 * still carries a `redirect` target (the proxy's own hand-off shape, so an
 * expired session gets disabled and sent back to the page instead of a bare
 * 401) both disable Draft Mode and clear the `vex-live-preview` marker
 * before redirecting. See `createVexDraftModeRoute`'s own doc comment for
 * the full enable/disable decision tree.
 */
export const { GET } = createVexDraftModeRoute({ getToken })
