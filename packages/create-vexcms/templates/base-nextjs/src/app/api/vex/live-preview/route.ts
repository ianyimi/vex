import { createVexDraftModeRoute } from "@vexcms/next/livePreview"

import { getToken } from "~/auth/server"

/**
 * `GET /api/vex/live-preview` — enables or disables Next.js Draft Mode for
 * this app's live-preview sessions.
 *
 * `proxy.ts`'s `proxy` hands a `?vexLivePreview=1` request off here once it
 * verifies the session itself; this route re-verifies with its own session
 * accessor (`getToken`), enables Draft Mode, sets the `vex-live-preview`
 * marker cookie, and redirects back to `redirect`. A public page can then
 * check `(await draftMode()).isEnabled` to render a never-published document
 * instead of a 404, for the client-side preview layer to take over.
 *
 * Also handles leaving preview mode: `?disable=1` (no session required —
 * turning preview off needs no authorization) and a signed-out request that
 * still carries a `redirect` target both disable Draft Mode and clear the
 * marker before redirecting. See `createVexDraftModeRoute`'s own doc comment
 * for the full enable/disable decision tree.
 */
export const { GET } = createVexDraftModeRoute({ getToken })
