# 2026-09-18-live-preview — Tasks

Launch-plan spec **E** (ADR-012). Ships after F (`2026-09-18-lifecycle-hooks-validation`)
per hard ordering constraint 2 in `v0.1.0-launch-plan.md` — F is in progress and expected
complete before this spec starts.

## Step 1 — Core config & protocol types [dev]

**Why:** Every later step imports these types. `livePreview.url` widens from a string
(globals only, today) to a `Partial<VexDocument> => string | undefined` resolver on both
collections and globals (ADR-012, ADR-013), and a new root-level `livePreview.allowedOrigins`
config gives the postMessage transport an explicit, non-inferred origin allowlist (ADR-012
security requirement 1). The message-protocol types are the wire contract both the admin
panel and the public site's provider compile against.

**Verify:** `pnpm --filter @vexcms/core build && pnpm --filter @vexcms/core test`

## Step 2 — `VexLivePreviewContext`: provider, `useVexPreview`, `useVexQuery` [dev]

**Why:** The core primitive from ADR-012 — an `id → unsaved values` map, a `postMessage`
listener with origin + payload validation, the mount handshake, and the overlay hook that
shadows a consumer's own query result. `useVexQuery` ships as sugar per the developer's
confirmed scope.

**Verify:** `pnpm --filter @vexcms/react test -- VexLivePreviewContext`

## Step 3 — Preview panel UI: split pane, cookie persistence, form sync [dev]

**Why:** The admin-side half of the loop — a toggleable split pane beside the edit form,
a pop-out window button, a cookie that remembers the open/closed choice per collection or
global, and the hook that posts the form's full current values on every change.

**Verify:** `pnpm --filter @vexcms/react test -- LivePreviewPanel useLivePreviewSync useLivePreviewPanelState`

## Step 4 — Wire `CollectionEditView`, `GlobalEditView`, `NextAdminPage` [dev]

**Why:** Mounts the panel only when `livePreview` is configured, threads the
cookie-derived initial open state from the server component down to the client view (no
flash of an unwanted panel state), and covers the new-document temp-id path.

**Verify:** `pnpm --filter @vexcms/react test -- CollectionEditView GlobalEditView` and
`pnpm --filter @vexcms/next build`

## Step 5 — Public-route preview gating (apps/www) [dev]

**Why:** ADR-012 security requirements 2–4. The public site must not install a
`postMessage` listener on every request — only when a request opts in with
`?vexPreview=1` AND carries a verified admin session. Next.js layouts cannot read
`searchParams`, so the gate runs in `proxy.ts` (already the session-gate middleware) and
forwards a signed marker header the site layout reads via `headers()`.

**Verify:** `pnpm --filter www build` and a manual `curl` smoke test against the dev
server per P-024 (never start one; attach to the developer's).

## Step 6 — apps/www dogfooding: pages collection + `PageContent.tsx` [dev]

**Why:** Closes the loop end-to-end on the one real consumer: `pages` gets
`admin.livePreview.url`, the root config gets `livePreview.allowedOrigins`, and
`PageContent.tsx` switches from a bare `useQuery` to `useVexQuery` so editing a page's
title/blocks in the admin panel updates `apps/www`'s own preview live.

**Verify:** Manual browser verification — edit a page in the admin panel with the preview
panel open, confirm keystroke-level updates, per this spec's `## Verification` section.

## Step 7 — `create-vexcms/templates/marketing-site` parity [dev]

**Why:** P-018 — the template and `apps/www` stay in lockstep. Mirrors steps 5 and 6
onto the template so a scaffolded project gets live preview for free.

**Verify:** `scripts/verify-scaffold.mjs` (marketing-site mode)

## Step 8 — Docs and cross-references [dev]

**Why:** `core/README.md` currently documents `livePreview: { url }` as a plain string on
globals only (`:192-197`) — both halves are now wrong. `routes/types.ts`'s docstring
claims `routes.map` drives "preview links", which this spec's design explicitly does not
do (Step 1's Design Decision 1) — that claim needs correcting, not preserving.

**Verify:** `grep -rn "livePreview" core/README.md docs/` shows only the corrected text.
