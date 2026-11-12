---
status: draft
spec_id: 2026-11-11-live-preview-cross-page
touches:
  - "packages/core/src/livePreview/constants.ts"
  - "packages/react/src/livePreview/useIsLivePreviewActive.ts"
  - "packages/react/src/livePreview/useIsLivePreviewActive.test.ts"
  - "packages/react/src/livePreview/LivePreviewContext.tsx"
  - "packages/react/src/livePreview/LivePreviewContext.test.tsx"
  - "packages/react/src/livePreview/livePreviewProtocol.ts"
  - "packages/react/src/livePreview/livePreviewProtocol.test.ts"
  - "packages/react/src/livePreview/useLivePreviewSync.ts"
  - "packages/react/src/livePreview/useLivePreviewSync.test.ts"
  - "packages/react/src/livePreview/LivePreviewPanel.tsx"
  - "packages/react/src/livePreview/index.ts"
  - "packages/react/src/index.ts"
  - "packages/next/src/livePreview/createVexDraftModeRoute.ts"
  - "apps/{test,www}/src/lib/useSitePreviewMode.ts"
  - "apps/{test,www}/src/app/layout.tsx"
  - "apps/{test,www}/src/app/(frontend)/(site)/**"
  - "apps/{test,www}/convex/{pages,posts}.ts"
  - "packages/create-vexcms/templates/marketing-site/src/lib/useSitePreviewMode.ts"
  - "packages/create-vexcms/templates/marketing-site/src/app/layout.tsx"
  - "packages/create-vexcms/templates/marketing-site/src/app/(frontend)/(site)/**"
  - "packages/create-vexcms/templates/marketing-site/convex/pages.ts"
  - "packages/create-vexcms/templates/base-nextjs/src/app/layout.tsx"
  - "packages/create-vexcms/templates/base-nextjs/src/app/api/vex/live-preview/route.ts"
  - "packages/create-vexcms/templates/base-nextjs/src/proxy.ts"
  - "scripts/scaffold-smoke.mjs"
  - "apps/docs/src/content/docs/guides/live-preview.mdx"
  - ".changeset/live-preview-cross-page.md"
prompt_version: 1
---

# 2026-11-11-live-preview-cross-page — Spec

## Overview

Live preview breaks as soon as the editor navigates inside the preview panel. The gate reads
`?vexLivePreview=1`, so any reload or hard navigation that drops the param switches the
overlay off. A page that does load with the overlay on also waits for the next keystroke
before it shows unsaved values. This spec makes the gate sticky for the life of the preview
surface and makes a freshly loaded page pull the editor's current values at once. It replaces
seven copies of `useSitePreviewMode` with one public hook, and ships the full preview wiring
in the `base-nextjs` template so `--bare` apps stop hand-rolling it. Done before 0.1.0 so the
golden demo apps can be tested entirely inside the admin. The `vex-examples` half (provider
mounts, preview-aware list queries, server-only pages) is handed to GU in
`examples-handoff.md`. The deep overlay is backlogged. Evidence:
`.agent/docs/research/live-preview-cross-page.md`.

## Design Decisions

1. **The gate becomes sticky through `window.name`.** `LivePreviewProvider` writes
   `LIVE_PREVIEW_WINDOW_NAME` into an unnamed window the first time the gate opens through
   the query param. From then on, the gate accepts that name in place of the param. A
   window's name survives every navigation inside its iframe or tab and never reaches
   another tab. It is set by the page itself, so the panel iframe, the pop-out tab and a
   pasted URL all become sticky the same way. The two required signals do not change: the
   session-verified cookie is still mandatory. Security posture is unchanged: anyone can
   append the param or set a window name, the cookie is set only after session verification,
   and draft content stays gated server-side by `readDrafts`.
   - *Rejected: `sessionStorage`.* A same-origin iframe shares it with its top-level admin
     tab, so that admin tab would flip into preview mode the moment it navigated to the
     public site.
   - *Deviation from the interview answer.* The interview picked a named pop-out tab
     (`target="vex-live-preview-tab"`) as the way to make the pop-out sticky. Self-naming
     gives the pop-out the same stickiness without that answer's side effect: reusing one
     tab for every Preview click. So the pop-out link stays `target="_blank"` and the panel
     names nothing. Flag it if tab reuse was wanted for its own sake.
2. **An existing `window.name` is never overwritten.** Another page may target that window by
   name. Consequence: a window that was already named gets the old, non-sticky behaviour.
   It's documented under Limits.
3. **One public hook, `useIsLivePreviewActive()`.** It reads through `useSyncExternalStore`
   with a `false` server snapshot, the shape every app's `useSitePreviewMode` copy already
   uses, so pages stay prerenderable and hydrate without a mismatch. The provider gates on
   it too, so the provider and the app's base-query choice can no longer disagree. The
   seven app copies are deleted (clean cutover): `apps/test`, `apps/www` and the
   marketing-site template in this spec, the four examples through GU. The `useIs*` name
   mirrors `useIsMobile`, and boolean names are `isXxx`.
4. **A provider-level `vex-live-preview-ready` message replaces the per-document mount
   handshake.**
   - **Today's handshake has a race.** `useLivePreview` posts it from a child effect, which
     runs before the provider's listener effect, so the reply can arrive before anything
     listens.
   - **It misses on key mismatch.** It is answered only when the document key matches
     exactly.
   - **Half of it goes unread.** Its `postMessage` copy to `window.parent`/`window.opener`
     is never read by the admin, which listens only on `BroadcastChannel`.

   The ready message is posted once by the provider, right after its listeners attach, on
   both transports. It carries no data, so `"*"` as the target origin leaks nothing. The
   admin replies with its full current values whatever the key. The provider's existing
   update routing already filters by key, as it does for every broadcast update. The admin
   accepts ready from `BroadcastChannel`, or from a window message whose `event.source` is
   the exact frame window it holds. That identity check can't be forged, so the admin side
   needs no origin list. Cross-origin previews (`allowedOrigins`) gain mount recovery, which
   they never had.
5. **`base-nextjs` ships the provider, the Draft Mode route and the proxy hand-off.** The
   provider alone does nothing: its gate needs the marker cookie, and only
   `createVexDraftModeRoute` sets it, reached through the proxy. The wiring stays inert until
   a collection sets `admin.livePreview.url`, and users delete it if they don't want it. A
   CLI opt-out flag is backlogged.
   - **The hand-off verifies the session first and fails open.** For an anonymous visitor,
     the route's signed-out branch redirects back to the same `?vexLivePreview=1` URL, so an
     unchecked hand-off redirects forever. Magazine's hand-rolled proxy has exactly that
     loop; it's flagged in the GU hand-off.
   - **Session verification mirrors `apps/test/src/proxy.ts`'s `resolveSessionStatus`,** so
     a request verifies the session at most once.
   - **The matcher stops excluding `/`,** so a page previewed at `/` gets the hand-off too.
6. **Not shipped by a package.** `@vexcms/next` cannot add anything to the app's
   `app/layout.tsx`. The one package-side option is `VexConfigProvider` mounting the
   provider internally, since every template already renders `VexConfigProvider` at the
   root. It's backlogged beside the CLI flag as the alternative to weigh when that flag is
   designed.
7. **Lists across pages come from the server, not a client overlay.** In preview mode, list
   queries read drafts (`find({ drafts: true })` already merges each published row with its
   draft). With autosave, that gets membership, order, populated relationships and derived
   fields right on every page within about 1–2s. A client-side deep overlay can't get
   membership or order right, so it's backlogged. The guide documents the pattern; the
   examples adopt it via GU.

## Out of Scope

- Deep overlay hook (`useLivePreviewData` or similar) for arbitrary query results.
- Relationship-safe merge in `useLivePreview`: the overlay still replaces a populated
  relationship with raw ids.
- Panel navigation chrome (current path, back to document, reload).
- CLI flag to scaffold `--bare` without preview wiring; `VexConfigProvider` auto-mount.
- Anything in `vex-examples` (GU, `examples-handoff.md`).
- Preview-aware list queries in `apps/test`/`apps/www`/templates. They have no list blocks
  today.
- Cross-device preview; list membership for unsaved edits on collections without autosave.

## Implementation

### Step 1 — Sticky preview gate: `LIVE_PREVIEW_WINDOW_NAME` + `useIsLivePreviewActive` [agent]

Agent-implemented. The developer handed both `[dev]` steps over on 2026-11-11. Fill each
`// TODO: implement` stub from its numbered pseudo-code, then delete the TODO comments and
the `throw` (P-026).

- [ ] `packages/core/src/livePreview/constants.ts`: add `LIVE_PREVIEW_WINDOW_NAME`, reword the cookie doc
- [ ] `packages/react/src/livePreview/useIsLivePreviewActive.ts`: new hook
- [ ] `packages/react/src/livePreview/useIsLivePreviewActive.test.ts`: gate matrix
- [ ] `packages/react/src/livePreview/LivePreviewContext.tsx`: provider uses the hook and writes the window name; `useLivePreviewEnabled` deleted
- [ ] `packages/react/src/livePreview/LivePreviewContext.test.tsx`: gate describe rewritten
- [ ] `packages/react/src/livePreview/index.ts`, `packages/react/src/index.ts`: export the hook

#### packages/core/src/livePreview/constants.ts

Two edits; everything not shown is unchanged.

**1 — `LIVE_PREVIEW_COOKIE` doc.** Replace its first paragraph:

```ts
/**
 * Marker cookie the project's own middleware sets after verifying a
 * `LIVE_PREVIEW_QUERY_PARAM` request carries a valid admin session.
 * `useIsLivePreviewActive` — and so `LivePreviewProvider` — requires this
 * cookie AND a preview request: the query param, or a window already carrying
 * {@link LIVE_PREVIEW_WINDOW_NAME}.
 *
```

**2 — new constant**, directly below `LIVE_PREVIEW_COOKIE_MAX_AGE_SECONDS`:

```ts
/**
 * `window.name` of a live-preview surface. `LivePreviewProvider` writes it into
 * an unnamed window the first time preview activates there through
 * {@link LIVE_PREVIEW_QUERY_PARAM}, and `useIsLivePreviewActive` accepts it in
 * place of that param. A window's name survives every navigation inside its
 * iframe or tab and is never shared with another tab, so a reload or an in-site
 * link that drops the query param keeps the preview on.
 */
export const LIVE_PREVIEW_WINDOW_NAME = "vex-live-preview";
```

#### packages/react/src/livePreview/useIsLivePreviewActive.ts

New file. Guided stub.

```ts
"use client";

import { useSyncExternalStore } from "react";
import {
  LIVE_PREVIEW_COOKIE,
  LIVE_PREVIEW_QUERY_PARAM,
  LIVE_PREVIEW_WINDOW_NAME,
} from "@vexcms/core";

/**
 * Whether this page is a live-preview surface: the session-verified
 * `LIVE_PREVIEW_COOKIE` marker holds `"1"`, AND the page asked to preview —
 * `?vexLivePreview=1` is in the URL, or the window carries
 * `LIVE_PREVIEW_WINDOW_NAME` (written by `LivePreviewProvider` the first time
 * preview activated in this window, so it survives navigations that drop the
 * param).
 *
 * `false` during the server render and hydration, then the browser's answer,
 * so a page reading it stays statically prerenderable and hydrates without a
 * mismatch. Advisory: picking a draft-reading query on `true` is safe because
 * every draft read is gated server-side by its own `readDrafts` check.
 *
 * @returns `true` once the cookie and a preview request are both present.
 */
export function useIsLivePreviewActive(): boolean {
  // TODO: implement
  // 1. return useSyncExternalStore(subscribeNever, readIsLivePreviewActive, readServerSnapshot)
  //    → module-level functions, so their identity is stable across renders
  //      (useSyncExternalStore resubscribes whenever `subscribe` changes).
  throw new Error("Not implemented");
}

/**
 * Neither signal has a change event to subscribe to; every render re-reads the
 * snapshot instead.
 *
 * @returns A no-op unsubscribe.
 */
function subscribeNever(): () => void {
  // TODO: implement
  // 1. return () => undefined
  throw new Error("Not implemented");
}

/**
 * Reads both gate signals from the browser.
 *
 * @returns `true` when the marker cookie holds `"1"` and the URL carries the
 *   query param or the window carries the preview name.
 */
function readIsLivePreviewActive(): boolean {
  // TODO: implement
  // 1. isPreviewRequested = URLSearchParams(window.location.search).get(LIVE_PREVIEW_QUERY_PARAM) === "1"
  //      || window.name === LIVE_PREVIEW_WINDOW_NAME
  // 2. isSessionVerified = document.cookie.split("; ").some(cookie => cookie === `${LIVE_PREVIEW_COOKIE}=1`)
  // 3. return isPreviewRequested && isSessionVerified
  // Edge cases:
  // - Any other window name ("" or a name another page targets) counts as NOT requested.
  throw new Error("Not implemented");
}

/**
 * Server and hydration snapshot.
 *
 * @returns Always `false`.
 */
function readServerSnapshot(): boolean {
  // TODO: implement
  // 1. return false
  throw new Error("Not implemented");
}
```

#### packages/react/src/livePreview/useIsLivePreviewActive.test.ts

New file, complete.

```ts
import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  LIVE_PREVIEW_COOKIE,
  LIVE_PREVIEW_QUERY_PARAM,
  LIVE_PREVIEW_WINDOW_NAME,
} from "@vexcms/core";
import { useIsLivePreviewActive } from "./useIsLivePreviewActive";

function setPreviewCookie(value: "1" | "0") {
  document.cookie = `${LIVE_PREVIEW_COOKIE}=${value}; path=/`;
}

function setSearch(search: string) {
  window.history.replaceState({}, "", search === "" ? "/" : `/?${search}`);
}

function readIsActive(): boolean {
  return renderHook(() => useIsLivePreviewActive()).result.current;
}

afterEach(() => {
  document.cookie = `${LIVE_PREVIEW_COOKIE}=; path=/; max-age=0`;
  setSearch("");
  window.name = "";
});

describe("useIsLivePreviewActive", () => {
  it("is on with the query param and the verified cookie", () => {
    setSearch(`${LIVE_PREVIEW_QUERY_PARAM}=1`);
    setPreviewCookie("1");
    expect(readIsActive()).toBe(true);
  });

  it("stays on after a navigation dropped the query param, through the preview window name", () => {
    window.name = LIVE_PREVIEW_WINDOW_NAME;
    setPreviewCookie("1");
    expect(readIsActive()).toBe(true);
  });

  it("is off with the query param alone — an unverified visitor", () => {
    setSearch(`${LIVE_PREVIEW_QUERY_PARAM}=1`);
    expect(readIsActive()).toBe(false);
  });

  it("is off with the preview window name alone — the session marker expired", () => {
    window.name = LIVE_PREVIEW_WINDOW_NAME;
    expect(readIsActive()).toBe(false);
  });

  it("is off with the verified cookie in a window that never asked to preview", () => {
    setPreviewCookie("1");
    expect(readIsActive()).toBe(false);
  });

  it("is off under any window name other than the preview name", () => {
    window.name = "editor-target";
    setPreviewCookie("1");
    expect(readIsActive()).toBe(false);
  });

  it("is off when the marker cookie holds anything other than the verified value", () => {
    setSearch(`${LIVE_PREVIEW_QUERY_PARAM}=1`);
    setPreviewCookie("0");
    expect(readIsActive()).toBe(false);
  });
});
```

#### packages/react/src/livePreview/LivePreviewContext.tsx

Four edits; everything not shown is unchanged. Step 2 edits this file again.

**1 — imports.** Drop `LIVE_PREVIEW_COOKIE` and `LIVE_PREVIEW_QUERY_PARAM` from the
`@vexcms/core` import, add `LIVE_PREVIEW_WINDOW_NAME`, and import the hook:

```ts
import {
  getFieldsInputSchema,
  LIVE_PREVIEW_ID_PARAM,
  LIVE_PREVIEW_WINDOW_NAME,
  type DocumentByResourceSlug,
  type VexResourceSlug,
} from "@vexcms/core";
import { useIsLivePreviewActive } from "./useIsLivePreviewActive";
```

**2 — delete `useLivePreviewEnabled`** and its doc comment entirely. `useIsLivePreviewActive`
is its replacement.

**3 — `LivePreviewProvider` doc + gate.** In the doc comment, replace "once
{@link useLivePreviewEnabled} confirms both the query param and the session-verified
marker cookie are present" with:

```ts
 * once {@link useIsLivePreviewActive} confirms the session-verified marker
 * cookie and a preview request (the query param, or the preview window name
 * this provider writes on first activation) are both present.
```

In the body, `const enabled = useLivePreviewEnabled();` becomes
`const isActive = useIsLivePreviewActive();`. Rename every `enabled` read in the provider
(both effects' guards and deps, and the final `if (!enabled)`) to `isActive`.

**4 — window-name effect.** New effect, directly after `isActive` is read:

```ts
  useEffect(() => {
    // TODO: implement
    // 1. if (!isActive) return
    // 2. if (window.name === "") window.name = LIVE_PREVIEW_WINDOW_NAME
    //    → every later load of this iframe/tab passes the gate without the query param
    // Edge cases:
    // - A non-empty name is left alone: another page may target this window by name.
  }, [isActive]);
```

#### packages/react/src/livePreview/LivePreviewContext.test.tsx

Three edits; everything not shown is unchanged.

**1 — imports.** Add `cleanup` and `waitFor` to the `@testing-library/react` import, and
`LIVE_PREVIEW_WINDOW_NAME` to the `@vexcms/core` import.

**2 — `afterEach`** also resets the window name, since the provider now writes it:

```tsx
afterEach(() => {
  clearPreviewCookie();
  setSearch("");
  window.name = "";
});
```

**3 — replace the whole `describe("LivePreviewProvider gate", …)` block.** The
cookie/param matrix moves to `useIsLivePreviewActive.test.ts`. What stays here is what only
the provider does:

```tsx
describe("LivePreviewProvider gate", () => {
  /**
   * Whether an update reaches the overlay IS the gate's verdict — the provider
   * renders no affordance of its own, so there is nothing else to observe.
   */
  async function overlayReceivesUpdate(): Promise<boolean> {
    renderOverlay({ _id: "doc1", title: "Saved title", subtitle: "Saved subtitle" });
    await screen.findByText(/title: Saved title/);

    await act(async () => {
      broadcastUpdate({ title: "Unsaved title" }, "doc1");
      await sleep(10);
    });

    return screen.queryByText(/title: Unsaved title/) !== null;
  }

  it("attaches no listener for a visitor without the verified cookie", async () => {
    setSearch(`${LIVE_PREVIEW_QUERY_PARAM}=1`);
    expect(await overlayReceivesUpdate()).toBe(false);
  });

  it("names the window on activation and keeps overlaying once a navigation drops the query param", async () => {
    setSearch(`${LIVE_PREVIEW_QUERY_PARAM}=1`);
    setPreviewCookie("1");
    renderOverlay({ _id: "doc1", title: "Saved title", subtitle: "Saved subtitle" });
    await waitFor(() => expect(window.name).toBe(LIVE_PREVIEW_WINDOW_NAME));
    cleanup();

    setSearch("");
    expect(await overlayReceivesUpdate()).toBe(true);
  });

  it("leaves a window that already has a name untouched", async () => {
    window.name = "editor-target";
    setSearch(`${LIVE_PREVIEW_QUERY_PARAM}=1`);
    setPreviewCookie("1");
    expect(await overlayReceivesUpdate()).toBe(true);
    expect(window.name).toBe("editor-target");
  });
});
```

#### packages/react/src/livePreview/index.ts

Add beside the other `export *` lines:

```ts
export * from "./useIsLivePreviewActive";
```

#### packages/react/src/index.ts

Add directly after the `LivePreviewProvider`/`useLivePreview*` export block:

```ts
export { useIsLivePreviewActive } from "./livePreview/useIsLivePreviewActive";
```

Verify: `pnpm --filter @vexcms/react test -- livePreview` and
`pnpm --filter @vexcms/react typecheck` green. With `apps/test` running on :3020, open a post's
edit view with the preview panel. In the panel, right-click → Reload frame on a URL stripped
of `?vexLivePreview=1` (or run `location.href = location.pathname` in the frame's console),
then type in the title. The title still updates in the panel.

### Step 2 — Ready message replaces the per-document handshake [agent]

Agent-implemented; stubs are filled the same way as in Step 1.

- [ ] `packages/react/src/livePreview/livePreviewProtocol.ts`: `LivePreviewReadyMessage` replaces `LivePreviewHandshakeMessage`
- [ ] `packages/react/src/livePreview/livePreviewProtocol.test.ts`: fixture uses the ready message
- [ ] `packages/react/src/livePreview/LivePreviewContext.tsx`: post ready after listeners attach; delete `useLivePreviewHandshake`
- [ ] `packages/react/src/livePreview/LivePreviewContext.test.tsx`: ready round-trip test
- [ ] `packages/react/src/livePreview/useLivePreviewSync.ts`: reply to ready on both transports
- [ ] `packages/react/src/livePreview/useLivePreviewSync.test.ts`: handshake tests → ready tests
- [ ] `packages/react/src/livePreview/LivePreviewPanel.tsx`: comments

#### packages/react/src/livePreview/livePreviewProtocol.ts

Two edits; everything not shown is unchanged.

**1 — module doc.** Replace the handshake bullet:

```ts
 * - `vex-live-preview-ready` — posted by `LivePreviewProvider` once its
 *   listeners are attached, so every open edit view replies with its current
 *   values instead of waiting for the next keystroke.
```

**2 — replace `LivePreviewHandshakeMessage`** (interface and doc) and the union:

```ts
/**
 * Posted by the preview surface's provider once it is listening. Carries no
 * data — every edit view that receives it replies with a full
 * `vex-live-preview-update`, and the provider keeps what it renders.
 */
export interface LivePreviewReadyMessage {
  source: typeof LIVE_PREVIEW_MESSAGE_SOURCE;
  type: "vex-live-preview-ready";
}
```

```ts
/** Either message the live-preview transport carries. */
export type LivePreviewMessage = LivePreviewReadyMessage | LivePreviewUpdateMessage;
```

#### packages/react/src/livePreview/livePreviewProtocol.test.ts

In `"accepts a message carrying the live-preview source"`, the fixture becomes:

```ts
      isLivePreviewMessage({
        source: LIVE_PREVIEW_MESSAGE_SOURCE,
        type: "vex-live-preview-ready",
      }),
```

and in `"rejects null, primitives, and unrelated objects"`, the string probe becomes
`isLivePreviewMessage("vex-live-preview-ready")`.

#### packages/react/src/livePreview/LivePreviewContext.tsx

Three edits; everything not shown is unchanged.

**1 — protocol import.** `type LivePreviewHandshakeMessage` becomes
`type LivePreviewReadyMessage`.

**2 — post ready.** In the provider's listener effect, after
`channel?.addEventListener("message", handleBroadcastMessage);` and before the cleanup
`return`:

```ts
    // TODO: implement
    // 1. readyMessage: LivePreviewReadyMessage = { source: LIVE_PREVIEW_MESSAGE_SOURCE, type: "vex-live-preview-ready" }
    // 2. channel?.postMessage(readyMessage)                       → same-origin edit views
    // 3. previewHostWindow = window.parent !== window ? window.parent : window.opener
    //    previewHostWindow?.postMessage(readyMessage, "*")       → the admin that embeds/opened this page,
    //                                                              including a cross-origin one
    // Edge cases:
    // - Posted AFTER both listeners attach — the reply can only arrive once something listens.
    // - Re-runs when the effect's deps change (config identity); a repeated ready only
    //   re-applies identical values.
```

**3 — delete `useLivePreviewHandshake`** (function and doc), and its call inside
`useLivePreview`. In `useLivePreview`'s doc comment, delete "and announces this render site
to the admin panel via the mount handshake". `previewId` stays: it still keys the
synthesized unsaved document.

#### packages/react/src/livePreview/LivePreviewContext.test.tsx

Two edits.

**1 — import** `isLivePreviewMessage` beside `LIVE_PREVIEW_MESSAGE_SOURCE` from
`./livePreviewProtocol`.

**2 — new describe**, after `"LivePreviewProvider overlay"`. It fails today: nothing answers
a page that has only mounted.

```tsx
describe("LivePreviewProvider ready message", () => {
  beforeEach(() => {
    setSearch(`${LIVE_PREVIEW_QUERY_PARAM}=1`);
    setPreviewCookie("1");
  });

  it("shows the editor's reply to its ready message without waiting for another keystroke", async () => {
    const editorChannel = new BroadcastChannel("vexcms-live-preview");
    editorChannel.addEventListener("message", (event: MessageEvent) => {
      if (!isLivePreviewMessage(event.data) || event.data.type !== "vex-live-preview-ready") return;
      editorChannel.postMessage({
        source: LIVE_PREVIEW_MESSAGE_SOURCE,
        type: "vex-live-preview-update",
        collectionSlug: "pages",
        documentId: "doc1",
        values: { title: "Unsaved title" },
      });
    });

    try {
      renderOverlay({ _id: "doc1", title: "Saved title", subtitle: "Saved subtitle" });
      expect(await screen.findByText(/title: Unsaved title/)).toBeInTheDocument();
    } finally {
      editorChannel.close();
    }
  });
});
```

#### packages/react/src/livePreview/useLivePreviewSync.ts

The function body changes throughout, so here it is complete as a guided stub. Imports:
drop `livePreviewKeyFor` from the protocol import.

```ts
/**
 * Posts the form's complete current values to the active preview target, on
 * both `BroadcastChannel` and (when a window reference is held) `postMessage`,
 * on every change, debounced. Also replies at once to a
 * `vex-live-preview-ready` — over `BroadcastChannel` from any same-origin
 * preview surface, or over `postMessage` from the exact frame this panel holds —
 * so a preview page that just loaded or reloaded shows the current unsaved
 * values without waiting for the next keystroke.
 *
 * @param props.form - The edit view's form instance.
 * @param props.collectionSlug - The collection or global slug being previewed.
 * @param props.documentId - The saved document id, once it exists.
 * @param props.tempId - The client-generated temp id, before the first save.
 * @param props.targetWindow - A preview surface this panel holds a reference
 *   to — in practice the embedded iframe's `contentWindow`, or `null`. A tab
 *   opened from the preview link leaves no reference, so it is reached over
 *   `BroadcastChannel`: `postMessage` no-ops without a window, the broadcast
 *   posts regardless.
 * @param props.debounceMs - Milliseconds to wait after the last form change
 *   before posting. Defaults to `DEFAULT_LIVE_PREVIEW_DEBOUNCE_MS`.
 */
export function useLivePreviewSync(props: {
  form: AnyFormApi;
  collectionSlug: string;
  documentId?: string;
  tempId?: string;
  targetWindow: Window | null;
  debounceMs?: number;
}): void {
  const values = useStore(props.form.store, (state) => state.values);
  const debounceMs = Math.max(
    props.debounceMs ?? DEFAULT_LIVE_PREVIEW_DEBOUNCE_MS,
    DEFAULT_LIVE_PREVIEW_DEBOUNCE_MS,
  );
  const previewKey = props.documentId ?? props.tempId;
  const { collectionSlug, documentId, tempId, targetWindow } = props;

  useEffect(() => {
    // TODO: implement
    // 1. if (!previewKey) return
    // 2. channel = openLivePreviewBroadcastChannel()
    // 3. postUpdate(): build the LivePreviewUpdateMessage exactly as today;
    //    channel?.postMessage(message); targetWindow?.postMessage(message, "*")
    // 4. isReadyMessage(data) = isLivePreviewMessage(data) && data.type === "vex-live-preview-ready"
    // 5. handleChannelMessage(event): if isReadyMessage(event.data) → postUpdate()
    // 6. handleWindowMessage(event): if targetWindow && event.source === targetWindow
    //      && isReadyMessage(event.data) → postUpdate()
    // 7. channel?.addEventListener("message", handleChannelMessage)
    //    window.addEventListener("message", handleWindowMessage)
    // 8. syncTimeoutId = setTimeout(postUpdate, debounceMs)
    // 9. cleanup: clearTimeout(syncTimeoutId); window.removeEventListener("message", handleWindowMessage);
    //    channel?.close()
    // Edge cases:
    // - No key match: the ready message names no document; the provider routes the reply by key.
    // - event.source identity, not origin, admits a postMessage ready — a window this panel
    //   does not hold is ignored even when same-origin.
    // - A same-origin frame sends ready on both transports; two identical replies are idempotent.
  }, [values, previewKey, debounceMs, targetWindow, collectionSlug, documentId, tempId]);
}
```

#### packages/react/src/livePreview/useLivePreviewSync.test.ts

Replace the two handshake tests (`"replies immediately over BroadcastChannel to a matching
handshake"`, `"ignores a handshake for a different document"`) with these. Add, above
`describe`:

```ts
const readyMessage = { source: LIVE_PREVIEW_MESSAGE_SOURCE, type: "vex-live-preview-ready" };
```

```ts
  it("replies over BroadcastChannel to a ready message", async () => {
    renderWithForm(null);
    await act(async () => vi.advanceTimersByTime(150));
    const channel = FakeBroadcastChannel.instances.at(-1);
    channel?.postMessage.mockClear();

    await act(async () => channel?.emit(readyMessage));

    expect(channel?.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "vex-live-preview-update",
        documentId: "doc1",
        values: { title: "Draft" },
      }),
    );
  });

  it("replies to a ready message posted by the frame it holds", async () => {
    const frame = document.createElement("iframe");
    document.body.append(frame);
    const frameWindow = frame.contentWindow;
    if (!frameWindow) throw new Error("jsdom iframe has no contentWindow");
    const postMessage = vi.spyOn(frameWindow, "postMessage").mockImplementation(() => undefined);
    renderWithForm(frameWindow);
    await act(async () => vi.advanceTimersByTime(150));
    postMessage.mockClear();

    await act(async () => {
      window.dispatchEvent(new MessageEvent("message", { data: readyMessage, source: frameWindow }));
    });

    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: "vex-live-preview-update", documentId: "doc1" }),
      "*",
    );
    frame.remove();
  });

  it("ignores a ready message from a window it does not hold", async () => {
    const postMessage = vi.fn();
    const heldWindow = { postMessage } as unknown as Window;
    renderWithForm(heldWindow);
    await act(async () => vi.advanceTimersByTime(150));
    postMessage.mockClear();

    await act(async () => {
      window.dispatchEvent(new MessageEvent("message", { data: readyMessage, source: window }));
    });

    expect(postMessage).not.toHaveBeenCalled();
  });
```

#### packages/react/src/livePreview/LivePreviewPanel.tsx

Two edits, no behaviour change.

**1 —** In `LivePreviewPanel`'s doc comment, "and its mount handshake pulls the current values
immediately" becomes "and its provider's ready message pulls the current values
immediately".

**2 —** Delete the inline comment above `targetWindow:` in the `useLivePreviewSync` call. It
describes the deleted handshake, and the doc comment already covers the tab case.

Verify: `pnpm --filter @vexcms/react test -- livePreview` and
`pnpm --filter @vexcms/react typecheck` green.
`rg "handshake" packages/react/src/livePreview` returns nothing. Smoke on :3020: type an
unsaved title, then reload the frame without the query param. The unsaved title re-appears
without another keystroke.

### Step 3 — Apps and templates cut over; base-nextjs ships the preview wiring; docs [agent]

Take the `apps/test/**` lock on the coordination board for the duration.

- [ ] Delete `apps/test/src/lib/useSitePreviewMode.ts`, `apps/www/src/lib/useSitePreviewMode.ts`, `packages/create-vexcms/templates/marketing-site/src/lib/useSitePreviewMode.ts`
- [ ] Migrate call sites, doc comments, and test mocks (list below)
- [ ] Layout gate comments in `apps/test`, `apps/www`, the marketing-site template
- [ ] `packages/next/src/livePreview/createVexDraftModeRoute.ts`: drop the stale inline comment
- [ ] `packages/create-vexcms/templates/base-nextjs/src/app/layout.tsx`: mount the provider
- [ ] `packages/create-vexcms/templates/base-nextjs/src/app/api/vex/live-preview/route.ts`: new
- [ ] `packages/create-vexcms/templates/base-nextjs/src/proxy.ts`: hand-off + `resolveSessionStatus` + matcher
- [ ] `scripts/scaffold-smoke.mjs`: bare scaffold requires the route
- [ ] `apps/docs/src/content/docs/guides/live-preview.mdx`
- [ ] `.changeset/live-preview-cross-page.md`

#### apps/test/src/app/(frontend)/(site)/PageContent.tsx

The same edit applies to `apps/test/src/app/(frontend)/(site)/posts/[slug]/PostContent.tsx`,
`apps/www/src/app/(frontend)/(site)/PageContent.tsx`,
`apps/www/src/app/(frontend)/(site)/posts/[slug]/PostContent.tsx` and
`packages/create-vexcms/templates/marketing-site/src/app/(frontend)/(site)/PageContent.tsx`.
Drop the `~/lib/useSitePreviewMode` import. Add `useIsLivePreviewActive` to the file's
existing `@vexcms/react` import, and change the call:

```tsx
  const previewModeActive = useIsLivePreviewActive() || Boolean(draftMode)
```

In every doc comment in those files, replace the name `useSitePreviewMode` with
`useIsLivePreviewActive`. Its contract (`false` until after mount) is unchanged. The same
rename applies to the doc-comment-only mentions in `apps/{test,www}/convex/{pages,posts}.ts`,
`apps/{test,www}/src/app/(frontend)/(site)/[slug]/page.tsx`,
`apps/{test,www}/src/app/(frontend)/(site)/posts/[slug]/page.tsx`,
`packages/create-vexcms/templates/marketing-site/convex/pages.ts` and
`packages/create-vexcms/templates/marketing-site/src/app/(frontend)/(site)/[slug]/page.tsx`.
`rg useSitePreviewMode apps packages` must return nothing afterwards.

#### apps/test/src/app/(frontend)/(site)/PageContent.test.tsx

The same edit applies to `apps/test/src/app/(frontend)/(site)/posts/[slug]/PostContent.test.tsx`,
`apps/www/src/app/(frontend)/(site)/PageContent.test.tsx` and
`apps/www/src/app/(frontend)/(site)/posts/[slug]/PostContent.test.tsx`. Delete the
`vi.mock("~/lib/useSitePreviewMode", …)` line. Each file's `@vexcms/react` mock spreads the
real module, and the real hook returns `false` in jsdom with no cookie, which is what the
deleted mock returned.

#### apps/test/src/app/layout.tsx

The same edit applies to `apps/www/src/app/layout.tsx` and
`packages/create-vexcms/templates/marketing-site/src/app/layout.tsx`. In the JSX comment above
`<LivePreviewProvider>`, "gates itself on `?vexLivePreview=1` plus the session-verified
cookie" becomes:

```tsx
                and gates itself on the session-verified cookie plus
                `?vexLivePreview=1` (or the preview window name it writes on
                first activation), so
```

#### packages/next/src/livePreview/createVexDraftModeRoute.ts

Delete the inline comment block above `response.cookies.set(LIVE_PREVIEW_COOKIE, …)`. It
names the deleted `useSitePreviewMode`, and the function's doc comment already explains the
marker cookie.

#### packages/create-vexcms/templates/base-nextjs/src/app/layout.tsx

Two edits; everything not shown is unchanged.

**1 — import**, beside the `next/font/google` import:

```tsx
import { LivePreviewProvider } from "@vexcms/react"
```

**2 — wrap the providers' children:**

```tsx
          <ClientProviders>
            {/* Wraps the whole app: the overlay only reaches consumers inside
                the provider. It reads collections, globals and allowed origins
                from `VexConfigContext`, and gates itself on the
                session-verified cookie plus `?vexLivePreview=1` (or the
                preview window name it writes on first activation), so every
                public route stays prerenderable. Inert until a collection or
                global sets `admin.livePreview.url`. */}
            <LivePreviewProvider>
              {children}
              {/* `@auth` parallel slot (`app/@auth/`), sibling of this layout —
                  covers both `(frontend)` and `(vexcms)` since both groups share
                  this root. Rendered after `children` so the intercepted
                  `/auth/[pathname]` dialog/full-screen card portals/paints over
                  whichever page (site or admin) triggered it. */}
              {auth}
            </LivePreviewProvider>
          </ClientProviders>
```

#### packages/create-vexcms/templates/base-nextjs/src/app/api/vex/live-preview/route.ts

New file, a copy of the marketing-site route except for the doc comment's page reference.

```ts
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
```

#### packages/create-vexcms/templates/base-nextjs/src/proxy.ts

Four edits; everything not shown (`SESSION_COOKIES`, `ALWAYS_ALLOWED`, `extractToken`,
`redirectToSignIn`, `redirectToUnauthorized`) is unchanged.

**1 — imports.** Add, in the file's import order:

```ts
import { LIVE_PREVIEW_COOKIE, LIVE_PREVIEW_QUERY_PARAM } from "@vexcms/core";
import { DRAFT_MODE_BYPASS_COOKIE } from "@vexcms/next/livePreview";
```

**2 — replace `proxy` and its doc comment:**

```ts
/**
 * Session gate for every route except the public ones in `config.matcher`,
 * plus the live-preview hand-off.
 *
 * `/admin/*` is one of those exclusions: its own page component
 * (`src/app/(vexcms)/admin/[[...path]]/page.tsx`) is its only gate, and fails
 * closed the same way this one does (see that file's doc comment).
 *
 * **Live preview.** A `?vexLivePreview=1` request from a verified session that
 * has not yet been through `/api/vex/live-preview` is redirected there: Draft
 * Mode can only be enabled from a Route Handler, never from middleware. "Been
 * through" means BOTH the `vex-live-preview` marker and Next's
 * `__prerender_bypass` cookie are present — the marker outlives Draft Mode
 * (1h vs. browser session), so the marker alone would skip re-enabling it. The
 * hand-off fails open: without a verified session the request continues as if
 * it carried no param, because the route's signed-out branch redirects back to
 * this same URL and would otherwise loop.
 *
 * Fails **closed** on guarded routes: if the session cannot be verified — no
 * cookie, no matching session, or the Convex lookup throwing — the request is
 * redirected rather than served. A verification error is not evidence of a
 * valid session, and serving the page anyway would drop authentication for
 * every guarded route the moment Convex became unreachable.
 *
 * Two distinct outcomes, deliberately:
 * - **No/invalid session** → `/auth/sign-in`, clearing the stale cookie so the
 *   presence check cannot lie on the next request.
 * - **Verification failed** (Convex unreachable, timeout) → `/unauthorized`,
 *   leaving cookies intact: the session may well be fine, so signing the user
 *   out and discarding it would be wrong.
 *
 * @param request - The incoming request.
 * @returns A redirect to the Draft Mode hand-off, to sign-in, or to the
 *   unauthorized page; otherwise `NextResponse.next()`.
 */
export async function proxy(request: NextRequest) {
  const isAlwaysAllowed = ALWAYS_ALLOWED[request.nextUrl.pathname] === true;
  const isPreviewHandOff =
    request.nextUrl.searchParams.get(LIVE_PREVIEW_QUERY_PARAM) === "1" &&
    !hasPreviewHandOffCookies(request);
  if (isAlwaysAllowed && !isPreviewHandOff) {
    return NextResponse.next();
  }

  const sessionStatus = await resolveSessionStatus(request);
  if (isPreviewHandOff && sessionStatus === "authenticated") {
    return redirectToDraftModeRoute(request);
  }
  if (isAlwaysAllowed) {
    return NextResponse.next();
  }
  if (sessionStatus === "unauthenticated") {
    return redirectToSignIn(request);
  }
  if (sessionStatus === "verification-failed") {
    return redirectToUnauthorized(request);
  }
  return NextResponse.next();
}
```

**3 — new helpers**, after `proxy`:

```ts
/**
 * Reads and verifies the Better Auth session cookie, through Better Auth's own
 * reader (it checks the `__Secure-` name, then the bare one).
 *
 * @param request - The incoming request.
 * @returns `"authenticated"` for a session with a user, `"unauthenticated"`
 *   for no cookie or no matching session, `"verification-failed"` when the
 *   Convex lookup throws.
 */
async function resolveSessionStatus(
  request: NextRequest,
): Promise<"authenticated" | "unauthenticated" | "verification-failed"> {
  const sessionToken = getSessionCookie(request, { cookiePrefix: AUTH_COOKIE_PREFIX });
  if (!sessionToken) return "unauthenticated";

  try {
    const session = await fetchQuery(api.auth.sessions.getSessionWithUser, {
      sessionToken: extractToken(sessionToken),
    });
    return session?.user ? "authenticated" : "unauthenticated";
  } catch {
    return "verification-failed";
  }
}

/**
 * Whether this request already round-tripped through `/api/vex/live-preview`
 * with Draft Mode still on.
 *
 * @param request - The incoming request.
 * @returns `true` when both the marker and Next's Draft Mode cookie are present.
 */
function hasPreviewHandOffCookies(request: NextRequest): boolean {
  return (
    request.cookies.get(LIVE_PREVIEW_COOKIE)?.value === "1" &&
    request.cookies.has(DRAFT_MODE_BYPASS_COOKIE)
  );
}

/**
 * Redirect to the Draft Mode Route Handler, which re-verifies the session,
 * enables Draft Mode, sets the marker cookie, and sends the editor back here.
 *
 * @param request - The `?vexLivePreview=1` request to return to.
 * @returns A redirect to `/api/vex/live-preview?redirect=<this path + query>`.
 */
function redirectToDraftModeRoute(request: NextRequest) {
  const draftModeUrl = new URL("/api/vex/live-preview", request.url);
  draftModeUrl.searchParams.set("redirect", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(draftModeUrl);
}
```

**4 — matcher.** Drop the `|$` alternative, so `/` runs the proxy and gets the hand-off.
`ALWAYS_ALLOWED` still serves it without a session check:

```ts
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|favicons|models/*|staging/*|auth/sign-in|auth/sign-up|admin).*)",
  ],
};
```

#### scripts/scaffold-smoke.mjs

Append to `BARE_REQUIRED` (marketing inherits it through `full.required`):

```js
  'src/app/api/vex/live-preview/route.ts',
```

#### apps/docs/src/content/docs/guides/live-preview.mdx

Five edits; everything not shown is unchanged.

**1 — "How it works", item 4** becomes:

```mdx
4. Once listening, the provider posts a ready message; every open edit view replies with
   its current values immediately, so a duplicated tab, or a page you just navigated or
   reloaded to inside the preview, catches up without waiting for the next keystroke.
```

**2 — "Wire the public site".** After the paragraph ending "…reads `headers()` or
`cookies()` on the server.", add:

````mdx
Projects scaffolded with `create-vexcms` (either template) already ship the provider
mount, the Draft Mode route and the proxy hand-off described below. They stay inert until a
collection or global sets `admin.livePreview.url`.

To switch a page's own query to a draft-reading variant while it is being previewed, read
`useIsLivePreviewActive()`. It returns `false` during the server render and hydration,
then the gate's real answer:

```tsx
const isPreviewing = useIsLivePreviewActive()
const { data: page } = useLivePreviewQuery(
  { ...convexQuery(isPreviewing ? api.pages.getBySlugPreview : api.pages.getBySlug, { slug }), initialData },
  "pages",
)
```
````

**3 — new section**, directly before `## Declaring previews in one place`:

```mdx
## Navigating inside the preview

Preview stays on for every page you open inside the panel or the pop-out tab. That holds
for links, back/forward and reloads, including pages whose URL no longer carries
`?vexLivePreview=1`. What updates where depends on how each page reads its data:

| Data | Updates in the preview | What it takes |
|---|---|---|
| A document read through `useLivePreview`, `useLivePreviewQuery` or `useLivePreviewDocumentQuery` (headers, footers, globals in a layout, the page's own document) | On every keystroke | Already wired |
| Lists and related documents on other pages, for a collection with `versions: { drafts: true, autosave: … }` | About a second after typing, once autosave writes the draft | List queries take a `preview` arg and call `find({ …, drafts: true })` when it is set; pass `preview: useIsLivePreviewActive()` |
| A collection without drafts | On Save | A client query (`useQuery`, seeded with server `initialData`), not a server-component-only render |

`find({ drafts: true })` returns one row per document, with a pending draft merged over its
published row, so a preview list shows each document once, as its latest draft, plus
documents that exist only as drafts. A caller without the `readDrafts` permission silently
gets the published rows.
```

**4 — "Security: the gate is yours to set".** The first bullet becomes:

```mdx
- the URL carries `?vexLivePreview=1` (`LIVE_PREVIEW_QUERY_PARAM`) — the admin panel
  appends this to whatever `admin.livePreview.url` returns, so your resolver returns a
  plain public path and never has to know about it — **or** the window is named
  `LIVE_PREVIEW_WINDOW_NAME`, which the provider writes into an unnamed window the first
  time the gate opens there, so later navigations inside that frame or tab stay in preview,
  and
```

In the middleware example below it, add two comment lines directly above
`if ((await resolveSessionStatus()) !== "authenticated") {`:

```ts
  // Unverified callers continue without the hand-off: the route's signed-out
  // branch redirects back to this same URL, so handing them off would loop.
```

**5 — "Limits"**, new bullet:

```mdx
- **A window that already has a name is not sticky.** The provider never overwrites an
  existing `window.name`, so a preview opened into a named window turns off on the first
  navigation that drops `?vexLivePreview=1`.
```

#### .changeset/live-preview-cross-page.md

```md
---
"@vexcms/core": patch
"@vexcms/react": patch
"create-vexcms": patch
---

Live preview now survives navigation inside the preview. Once the gate opens through
`?vexLivePreview=1`, the provider names its window `LIVE_PREVIEW_WINDOW_NAME` (new in
`@vexcms/core`), and the gate accepts that name in place of the query param. Links, back/forward
and reloads inside the panel or pop-out tab keep the overlay on, and a freshly loaded page
announces itself with a ready message that every open edit view answers immediately. The
per-document mount handshake is gone.

New `useIsLivePreviewActive()` hook in `@vexcms/react`: the same gate the provider uses
(session-verified cookie plus the query param or the preview window name), `false` during
server render and hydration. Use it to pick a draft-reading query while previewing; it replaces
the per-app `useSitePreviewMode` copy.

`create-vexcms`: the `base-nextjs` template (and so `--bare`) now ships the preview wiring: the
`<LivePreviewProvider>` mount, `/api/vex/live-preview` (`createVexDraftModeRoute`), and the
proxy hand-off, which runs only for a verified session. It stays inert until a collection sets
`admin.livePreview.url`. The marketing-site template's `src/lib/useSitePreviewMode.ts` is
removed in favour of the hook.
```

Verify:
- `pnpm --filter test test` and `pnpm --filter www test` green; `pnpm typecheck` green.
- `rg useSitePreviewMode apps packages` returns nothing.
- `pnpm --filter "@vexcms/*" --filter create-vexcms build`, then
  `node scripts/scaffold-smoke.mjs --bare`, `node scripts/scaffold-smoke.mjs`, and
  `node scripts/verify-scaffold.mjs` all green. The bare template's `/` must stay in the
  prerender manifest.
- `pnpm --filter docs build` green.
- Runtime, AP-020: smoke the marketing scaffold path on `apps/www` (:3030). Navigate inside
  the preview panel with a link, then a frame reload; the overlay stays on. The bare
  template's runtime proof is magazine (:3200), a `--bare` app, once it adopts the template
  proxy shape (`examples-handoff.md` Part 2). Record the result in the coordination board's
  § Log.

## Verification

- `pnpm test` and `pnpm typecheck` at the root.
- `pnpm lint`.
- `node scripts/verify-scaffold.mjs` (after building the packages).
- Browser: on :3020 and :3030, open a document's preview, follow an in-site link and reload
  the frame. Unsaved values stay visible without another keystroke.
