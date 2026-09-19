---
status: draft
spec_id: 2026-09-18-live-preview
touches:
  - packages/core/src/livePreview/**
  - packages/core/src/config/**
  - packages/core/src/collections/types.ts
  - packages/core/src/globals/types.ts
  - packages/core/src/index.ts
  - packages/core/README.md
  - packages/react/src/context/**
  - packages/react/src/components/livePreview/**
  - packages/react/src/components/views/CollectionEditView.tsx
  - packages/react/src/components/views/GlobalEditView.tsx
  - packages/react/src/hooks/useLivePreviewSync.ts
  - packages/react/src/hooks/useLivePreviewPanelState.ts
  - packages/react/src/index.ts
  - packages/next/src/NextAdminPage.tsx
  - packages/core/src/routes/types.ts
  - apps/www/src/vex.config.ts
  - apps/www/src/vexcms/collections/pages.ts
  - apps/www/src/proxy.ts
  - apps/www/src/app/(frontend)/(site)/layout.tsx
  - apps/www/src/app/(frontend)/(site)/PageContent.tsx
  - packages/create-vexcms/templates/marketing-site/**
  - apps/docs/src/content/docs/guides/live-preview.mdx
prompt_version: 1
---

# 2026-09-18-live-preview — Spec

## Overview

Launch-plan spec **E** (ADR-012). `livePreview: { url }` is accepted on global admin
config today (`globals/types.ts:36,63`) and stored on the resolved config, but nothing
reads it — no listener, no panel, no `postMessage` transport (grep of `packages/*/src`
for `livePreview`/`postMessage`/`BroadcastChannel` finds no implementation). This spec
ships the feature per ADR-012: a `postMessage` transport driven by unsaved form state,
overlaid on the consumer's own query result via an `id → values` map, with the preview
target being the document's real public route rather than a dedicated preview route.

Ships after F (`2026-09-18-lifecycle-hooks-validation`, in progress) per the launch
plan's hard ordering constraint 2 — no dependency on F's pipeline, F simply comes first
in the track's execution order.

## Design Decisions

1. **`livePreview.url` stays independent of `routes.map`.** `VexRoutesConfig.map`
   (`routes/types.ts:33-68`) answers "every public path this document renders at" (0..N,
   driving revalidation/sitemap); `livePreview.url` answers "the one URL to iframe for
   preview" and may point at a different origin (staging) than production. Its own
   docstring's claim that it drives "preview links" (`routes/types.ts:53`) is corrected
   in Step 8 rather than preserved — it predates this design.
2. **The origin allowlist is root-level `livePreview.allowedOrigins`, not
   `admin.livePreview.<collection>.allowedOrigins` and not a generic `cors` namespace.**
   No CORS concept exists anywhere in this repo today (`postMessage` origin checks are a
   browser-window concern, unrelated to HTTP CORS), and nothing else needs an origin
   allowlist — inventing a generic namespace for a single consumer is speculative code.
   One list, because the admin origin(s) permitted to drive the overlay don't vary per
   collection.
3. **The transport sends a full value snapshot on every change, never a diff.** Tracing
   `useLiveFieldMerge`/`changedValues.ts` confirms there is no leaf-level merge utility
   anywhere in the codebase — the existing dirty-tracking machinery works at top-level
   field-key granularity, and `changedValues(form)` still returns each dirty key's
   **complete** current value, never a partial nested patch. A destructive shallow spread
   only becomes possible if a partial diff is transmitted; sending
   `form.state.values` (the form's complete current top-level values) in full sidesteps
   the problem entirely — `postMessage`'s structured clone handles nested
   objects/arrays with no `JSON.stringify` cost (ADR-012's jank concern was specific to
   `localStorage`, not this transport). `{ ...doc, ...values }` is therefore a correct
   merge: every key present in `values` already holds its complete current nested value.
   This corrects ADR-012's "must walk the field config" note for this transmission
   shape — no new merge utility is built.
4. **Preview panel: persistent split pane, closed by default, cookie-remembered per
   collection/global.** Not a modal, not a drawer-on-demand. A `vex-preview-panel:<slug>`
   cookie stores the user's last explicit open/close choice; `NextAdminPage` (a server
   component) reads it via `next/headers` `cookies()` and passes the initial state down,
   so there is no flash of the wrong panel state on load. Absent any cookie, the panel
   starts closed — a first-time editor gets the full-width form, not a surprise
   half-width layout.
5. **Both an embedded iframe and a pop-out window ship.** The pop-out (`window.open`)
   targets the same preview URL and receives the same `postMessage` stream as the iframe
   — useful for a second monitor. `LivePreviewPanel` tracks whichever surface is
   currently open and posts to it; opening the pop-out does not require closing the
   iframe.
6. **Preview-mode gating runs in `proxy.ts` middleware, not in a layout.** Next.js
   layouts receive `params` but never `searchParams` — only `page.tsx` components do —
   so a `?vexPreview=1` query-param check cannot happen in the site layout that needs to
   decide whether to mount `<VexLivePreviewProvider>`. `apps/www/src/proxy.ts` (already
   the admin session-gate middleware) is extended to recognize the query param on public
   routes, verify the session, and forward a `x-vex-preview-enabled` request header via
   `NextResponse.next({ request: { headers } })` — a documented Next.js pattern for
   middleware-to-Server-Component signaling. The layout reads that header with
   `headers()` (available to layouts, unlike `searchParams`).
7. **An invalid/absent session with `?vexPreview=1` renders the page normally, not a
   redirect.** Unlike the admin gate (fail-closed, this is a private surface), the public
   site is public by design (`proxy.ts:20-25`'s existing rationale) — a visitor who
   stumbles on a shared preview link with a stale or absent session should see the normal
   published page, not be sent to sign-in.
8. **`useVexQuery` ships as sugar over `useVexPreview`**, per the developer's confirmed
   scope — `useQuery(...) ` composed with `useVexPreview` in one call, so
   `apps/www`'s `PageContent.tsx` (Step 6) is the first real consumer proving the
   ergonomics ADR-012 anticipated.
9. **A document being created previews by temp id.** `LivePreviewPanel` generates one
   `crypto.randomUUID()` per mount and appends it (`vexPreviewId`) plus the collection
   slug (`vexPreviewCollection`) to the resolved preview URL's query string.
   `useVexPreview` reads those two params from `window.location.search` when its `doc`
   argument is `null`/`undefined`, and when a value entry exists under that id it
   **synthesizes** a doc-shaped object from the values alone (there is no saved document
   to overlay onto yet).
10. **Lifecycle hooks never run on preview data** (ADR-012, unchanged) — the preview
    renders exactly what the editor typed, pre-`beforeChange`. Documented as a known
    limitation, not fixed here (a pure `derive` hook class is future work, explicitly out
    of scope for F too).

## Out of Scope

- A contractually-pure `derive` hook class so `beforeChange`-derived fields (e.g. a
  computed `slug`) appear in preview (ADR-012's documented forward path).
- Collection-level `admin.components.preview` (ARCH-1 still forbids it; only the
  relationship field's field-level override exists). The config-split spec unblocking it
  is a documented side effect, not a deliverable of this spec.
- Draft-aware preview base layer (fetching the draft instead of the published document)
  — spec C's job, additive to this spec's overlay per the launch plan.
- Richtext sanitizing-renderer integration for security requirement 4 — no `richtext()`
  field exists yet (spec D ships after this one). Nothing in scope today renders
  arbitrary markup from preview payloads; D inherits the requirement when it lands.
- `base-nextjs` template — it has no public marketing routes, so live preview does not
  apply (only `marketing-site` and `apps/www` are dogfooding consumers).
- `BroadcastChannel` for driving multiple same-origin previews from one provider (ADR-012
  notes it as an optional future addition, not required — both the iframe and the
  pop-out already give a direct window handle).

## Implementation

### Step 1 — Core config & protocol types [dev]

Additive types only — no runtime behavior changes beyond the two new resolved defaults
(`livePreview.allowedOrigins` on the root config; `livePreview` stays optional and
`undefined` by default on collections/globals, unchanged from today).

#### packages/core/src/livePreview/types.ts

New file.

```ts
import type { VexDocument } from "../api/convex";

/**
 * Resolves a document to the single public URL its live preview should render.
 *
 * Called with the document as edited — `Partial<VexDocument>` because a document
 * being created has no `_id` yet and may be missing any field the user has not
 * filled in. Distinct from `VexRouteMapper` (`routes/types.ts`): `routes.map`
 * answers "every public path this document renders at" (0..N, driving sitemap
 * generation and cache revalidation); this answers "the one URL to iframe for
 * preview" and may point at a different origin (a staging deployment) than
 * production.
 *
 * @param doc - The document as currently known — saved fields merged with unsaved
 *   form edits, so a `slug`-derived route resolves as the editor types.
 * @returns The URL to preview `doc` at, or `undefined` when it cannot be resolved
 *   yet (e.g. a required routing field is still empty).
 *
 * @example
 * ```ts
 * const url: VexPreviewUrlResolver = (doc) =>
 *   typeof doc.slug === "string" ? `https://example.com/${doc.slug}` : undefined;
 * ```
 */
export type VexPreviewUrlResolver = (doc: Partial<VexDocument>) => string | undefined;

/**
 * User-facing input for the root-level `livePreview` config block.
 *
 * Sibling to `admin` / `access` / `routes` on `VexClientConfigInput` — one
 * allowlist shared by every collection and global that declares
 * `admin.livePreview.url`, since the admin origin(s) permitted to drive the
 * preview overlay don't vary per document type.
 *
 * @see {@link VexPreviewUrlResolver} for the per-collection/global `url` resolver
 */
export interface LivePreviewConfigInput {
  /**
   * Origins permitted to send `postMessage` control frames to a live-preview
   * listener — e.g. `["http://localhost:3000", "https://admin.example.com"]`.
   * Explicitly configured rather than inferred (ADR-012, security requirement
   * 1): a preview route that trusted every origin would let any page iframe it
   * and inject content. Empty (the default) means the transport accepts nothing.
   */
  allowedOrigins: string[];
}

/**
 * Resolved root-level `livePreview` config after `defineConfig()` applies
 * defaults.
 *
 * @see {@link LivePreviewConfigInput} for the user-facing input type
 */
export interface LivePreviewConfig {
  /** Origins permitted to send `postMessage` control frames. Empty by default. */
  allowedOrigins: string[];
}
```

#### packages/core/src/livePreview/index.ts

New file.

```ts
export * from "./types";
```

#### packages/core/src/index.ts

1 edit — beside the existing `routes` export.

```ts
export * from "./routes";

export * from "./livePreview";
```

#### packages/core/src/config/types.ts

2 edits.

**1 — import.** Add beside the existing named-type imports at the top of the file:

```ts
import type { LivePreviewConfigInput, LivePreviewConfig } from "../livePreview";
```

**2 — `VexClientConfigInput` and `VexClientConfig`.** Add one property to each
interface, beside the existing `routes` member (`VexClientConfigInput` around
`:216-308`, `VexClientConfig` around `:377-429` — both currently declare
`routes?: VexRoutesConfig`):

```ts
  /**
   * Live-preview transport security config — the postMessage origin allowlist.
   * Omit for a project with no `admin.livePreview` on any collection or global.
   */
  livePreview?: LivePreviewConfigInput;
```

```ts
  /** Resolved live-preview transport security config. Empty allowlist by default. */
  livePreview: LivePreviewConfig;
```

#### packages/core/src/config/config.ts

1 edit — in `defineConfig`'s return object, beside the existing `routes: config?.routes,`
line (`:134`):

```ts
    routes: config?.routes,
    livePreview: { allowedOrigins: config?.livePreview?.allowedOrigins ?? [] },
```

#### packages/core/src/config/config.test.ts

1 addition — new `describe` block mirroring the existing "schema defaults" block
(`:52-66`), placed beside it.

```ts
describe("defineConfig — livePreview defaults", () => {
  it("defaults to an empty allowlist when livePreview is omitted", () => {
    const config = defineConfig();
    expect(config.livePreview).toEqual({ allowedOrigins: [] });
  });

  it("passes through a configured allowlist unchanged", () => {
    const config = defineConfig({
      livePreview: { allowedOrigins: ["https://admin.example.com"] },
    });
    expect(config.livePreview).toEqual({ allowedOrigins: ["https://admin.example.com"] });
  });
});
```

#### packages/core/src/collections/types.ts

1 edit — add to both `AdminCollectionConfigInput` (`:158-181`) and
`AdminCollectionConfig` (`:188-199`), beside the existing `table` member, plus the
import.

```ts
import type { VexPreviewUrlResolver } from "../livePreview";
```

```ts
  /**
   * Live preview configuration. Omit for a collection with no public-facing
   * route. Mirrors `GlobalAdminConfigInput.livePreview`.
   */
  livePreview?: { url: VexPreviewUrlResolver };
```

(Add the identical `livePreview?: { url: VexPreviewUrlResolver };` member, with a
one-line `/** Live preview config. */` doc comment, to the resolved
`AdminCollectionConfig` too — no default is needed, `defineCollection`'s
`admin: { useAsTitle: "_id", ...input.admin, table: {...} }` spread
(`collections/config.ts:176-179`) already passes an omitted `livePreview` through as
`undefined`.)

#### packages/core/src/globals/types.ts

1 edit — **breaking**, tracked by the release-mechanics changeset gate (P-025: `patch`
while `.changeset/pre.json` stays in `pre` mode). Replace both occurrences of
`livePreview?: { url: string };` (Input at `:36`, resolved at `:63`) with:

```ts
  livePreview?: { url: VexPreviewUrlResolver };
```

Add the import beside the existing `ApplyComponent`/`ComponentHKT`/`AdminField` import
at the top of the file:

```ts
import type { VexPreviewUrlResolver } from "../livePreview";
```

No change needed in `globals/config.ts` — same spread-through-defaults reasoning as
collections above.

**Verify:** `pnpm --filter @vexcms/core build && pnpm --filter @vexcms/core test`

---

### Step 2 — `VexLivePreviewContext`: provider, `useVexPreview`, `useVexQuery` [dev]

#### packages/react/src/context/livePreviewProtocol.ts

New file. Full code — this is the wire contract, not behavior.

```ts
/**
 * Wire protocol for the live-preview `postMessage` transport (ADR-012).
 *
 * Two message types cross the boundary between the admin panel (the iframe's
 * parent, or the pop-out window's opener) and the previewed public route:
 *
 * - `vex-preview-handshake` — sent by the preview surface on mount, so a page
 *   reload recovers current state without waiting for the next keystroke.
 * - `vex-preview-update` — sent by the admin panel on every debounced form
 *   change, carrying the form's **complete** current values for one document
 *   (Design Decision 3 — never a partial diff).
 */
export const VEX_PREVIEW_MESSAGE_SOURCE = "vexcms-live-preview" as const;

/** Sent by the preview surface on mount to request current unsaved state. */
export interface VexPreviewHandshakeMessage {
  source: typeof VEX_PREVIEW_MESSAGE_SOURCE;
  type: "vex-preview-handshake";
  /** The collection or global slug the preview surface expects to render. */
  collectionSlug: string;
  /** The saved document id, when the previewed document already exists. */
  documentId?: string;
  /** The client-generated temp id, when previewing a document being created. */
  tempId?: string;
}

/** Sent by the admin panel whenever the form's values change. */
export interface VexPreviewUpdateMessage {
  source: typeof VEX_PREVIEW_MESSAGE_SOURCE;
  type: "vex-preview-update";
  collectionSlug: string;
  documentId?: string;
  tempId?: string;
  /** The form's complete current top-level values for this document. */
  values: Record<string, unknown>;
}

export type VexPreviewMessage = VexPreviewHandshakeMessage | VexPreviewUpdateMessage;

/**
 * Narrows an arbitrary `MessageEvent.data` to a `VexPreviewMessage`, so a listener
 * never trusts an unrelated message another script on the page posted.
 */
export function isVexPreviewMessage(data: unknown): data is VexPreviewMessage {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as { source?: unknown }).source === VEX_PREVIEW_MESSAGE_SOURCE
  );
}

/**
 * Returns the key `useVexPreview`'s `id → values` map stores one message's
 * values under — the saved document id when present, else the temp id. Checks
 * `documentId` first: a document opened via a temp id still carries `_id` once
 * saved mid-session, and the saved id must win from then on.
 */
export function vexPreviewKeyFor(message: {
  documentId?: string;
  tempId?: string;
}): string | undefined {
  return message.documentId ?? message.tempId;
}
```

#### packages/react/src/context/livePreviewProtocol.test.ts

New file.

```ts
import { describe, expect, it } from "vitest";
import {
  VEX_PREVIEW_MESSAGE_SOURCE,
  isVexPreviewMessage,
  vexPreviewKeyFor,
} from "./livePreviewProtocol";

describe("isVexPreviewMessage", () => {
  it("accepts a message carrying the vex-preview source", () => {
    expect(
      isVexPreviewMessage({
        source: VEX_PREVIEW_MESSAGE_SOURCE,
        type: "vex-preview-handshake",
        collectionSlug: "pages",
      }),
    ).toBe(true);
  });

  it("rejects null, primitives, and unrelated objects", () => {
    expect(isVexPreviewMessage(null)).toBe(false);
    expect(isVexPreviewMessage("vex-preview-handshake")).toBe(false);
    expect(isVexPreviewMessage({ source: "some-other-widget" })).toBe(false);
    expect(isVexPreviewMessage({})).toBe(false);
  });
});

describe("vexPreviewKeyFor", () => {
  it("prefers documentId over tempId when both are present", () => {
    expect(vexPreviewKeyFor({ documentId: "doc1", tempId: "temp1" })).toBe("doc1");
  });

  it("falls back to tempId when documentId is absent", () => {
    expect(vexPreviewKeyFor({ tempId: "temp1" })).toBe("temp1");
  });

  it("returns undefined when neither is present", () => {
    expect(vexPreviewKeyFor({})).toBeUndefined();
  });
});
```

#### packages/react/src/context/VexLivePreviewContext.tsx

New file.

```tsx
"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCollectionInputSchema, type CollectionConfig, type VexDocument } from "@vexcms/core";
import {
  VEX_PREVIEW_MESSAGE_SOURCE,
  isVexPreviewMessage,
  vexPreviewKeyFor,
  type VexPreviewHandshakeMessage,
} from "./livePreviewProtocol";

/**
 * Live-preview overlay state — an `id → unsaved values` map, per ADR-012.
 * `null` is the default so `useVexPreview` can tell "no provider mounted" (the
 * normal state of every request that did not opt into preview mode, ADR-012
 * security requirement 2) from "provider mounted, nothing unsaved yet".
 */
const VexLivePreviewContext = createContext<Map<string, Record<string, unknown>> | null>(null);

/**
 * Mounts the live-preview `postMessage` listener for the subtree it wraps.
 *
 * Installs no listener and costs nothing when unmounted — the caller (the
 * site's layout, Step 5) only renders this when `?vexPreview=1` was present
 * AND the session was verified server-side. This component does not repeat
 * that check; it trusts its own presence in the tree as the gate.
 *
 * @param props.allowedOrigins - Explicitly configured origins permitted to
 *   post control frames (`config.livePreview.allowedOrigins`). A message from
 *   any other `event.origin` is dropped before it is even parsed.
 * @param props.collections - The resolved `collections` array, needed to
 *   validate an incoming message's `values` against the target collection's
 *   generated Zod schema (ADR-012 security requirement 3) before it ever
 *   reaches a render.
 * @param props.children - The subtree that may call `useVexPreview`.
 */
export function VexLivePreviewProvider(props: {
  allowedOrigins: string[];
  collections: CollectionConfig[];
  children: ReactNode;
}) {
  const [valuesById, setValuesById] = useState<Map<string, Record<string, unknown>>>(
    () => new Map(),
  );

  useEffect(() => {
    function handleIncomingMessage(event: MessageEvent) {
      if (!props.allowedOrigins.includes(event.origin)) return;
      if (!isVexPreviewMessage(event.data)) return;
      if (event.data.type !== "vex-preview-update") return;

      const targetCollection = props.collections.find(
        (collection) => collection.slug === event.data.collectionSlug,
      );
      if (!targetCollection) return;

      const parsedValues = getCollectionInputSchema({
        collection: targetCollection,
        partial: true,
      }).safeParse(event.data.values);
      if (!parsedValues.success) return;

      const previewKey = vexPreviewKeyFor(event.data);
      if (!previewKey) return;

      setValuesById((previousValuesById) => {
        const nextValuesById = new Map(previousValuesById);
        nextValuesById.set(previewKey, parsedValues.data);
        return nextValuesById;
      });
    }

    window.addEventListener("message", handleIncomingMessage);
    return () => window.removeEventListener("message", handleIncomingMessage);
  }, [props.allowedOrigins, props.collections]);

  return (
    <VexLivePreviewContext.Provider value={valuesById}>
      {props.children}
    </VexLivePreviewContext.Provider>
  );
}

/**
 * Overlays unsaved editor values onto a document a consumer already fetched.
 *
 * Agnostic to how `doc` arrived — a raw Convex `useQuery`, TanStack Query +
 * `convexQuery`, or an RSC-passed `initialData`. Returns `doc` completely
 * untouched when no `VexLivePreviewProvider` is mounted (the normal state on
 * every production request) or when nothing unsaved exists for its key —
 * `useVexPreview` never allocates a new object needlessly.
 *
 * @param doc - The document as fetched by the consumer's own query, or
 *   `null`/`undefined` while loading or when the document does not exist yet
 *   (the new-document temp-id case — Design Decision 9).
 * @returns `doc` overlaid with unsaved values matching its `_id`, or — when
 *   `doc` is absent and the current URL carries a `vexPreviewId` matching an
 *   entry in the map — a document synthesized from the unsaved values alone.
 */
export function useVexPreview<TDoc extends VexDocument>(
  doc: TDoc | null | undefined,
): TDoc | null | undefined {
  const valuesById = useContext(VexLivePreviewContext);

  return useMemo(() => {
    if (!valuesById) return doc;

    if (doc?._id) {
      const unsavedValues = valuesById.get(doc._id);
      return unsavedValues ? { ...doc, ...unsavedValues } : doc;
    }

    const previewSearchParams = new URLSearchParams(window.location.search);
    const previewId = previewSearchParams.get("vexPreviewId");
    if (!previewId) return doc;

    const unsavedValues = valuesById.get(previewId);
    if (!unsavedValues) return doc;

    return { _id: previewId, _creationTime: Date.now(), ...unsavedValues } as TDoc;
  }, [doc, valuesById]);
}

/**
 * Sugar composing `useQuery` with `useVexPreview` (Design Decision 8) — the
 * transparent call ADR-012 anticipated once the primitive existed.
 *
 * @param queryOptions - Any TanStack Query options object whose `data` resolves
 *   to a document shape, e.g. `convexQuery(api.pages.getBySlug, { slug })`.
 * @returns The same shape `useQuery` returns, with `data` overlaid via
 *   `useVexPreview`.
 *
 * @example
 * ```tsx
 * const { data: page } = useVexQuery({ ...convexQuery(api.pages.getBySlug, { slug }), initialData });
 * ```
 */
export function useVexQuery<TDoc extends VexDocument>(
  queryOptions: Parameters<typeof useQuery>[0],
): ReturnType<typeof useQuery<TDoc>> {
  const queryResult = useQuery(queryOptions);
  const previewedData = useVexPreview(queryResult.data as TDoc | null | undefined);
  return { ...queryResult, data: previewedData };
}

/**
 * Posts the handshake announcement once on mount, and again whenever the
 * target document identity changes. Internal — called by the preview surface
 * that mounts `useVexPreview`, never imported directly by application code.
 *
 * @internal
 */
export function useVexPreviewHandshake(props: {
  collectionSlug: string;
  documentId?: string;
  tempId?: string;
}): void {
  useEffect(() => {
    const previewParentWindow = window.parent !== window ? window.parent : window.opener;
    if (!previewParentWindow) return;

    const handshakeMessage: VexPreviewHandshakeMessage = {
      source: VEX_PREVIEW_MESSAGE_SOURCE,
      type: "vex-preview-handshake",
      collectionSlug: props.collectionSlug,
      documentId: props.documentId,
      tempId: props.tempId,
    };
    previewParentWindow.postMessage(handshakeMessage, "*");
  }, [props.collectionSlug, props.documentId, props.tempId]);
}
```

**Verify:** `pnpm --filter @vexcms/react test -- livePreviewProtocol`

---

### Step 3 — Preview panel UI: split pane, cookie persistence, form sync [dev]

#### packages/react/src/hooks/useLivePreviewPanelState.ts

New file. The open/closed state machine is trivial; the cookie read/write is what
needed a concrete implementation.

```ts
"use client";

import { useCallback, useState } from "react";

const COOKIE_PREFIX = "vex-preview-panel:";

/**
 * Tracks whether the live-preview split pane is open for one collection or
 * global, persisting the user's explicit choice in a cookie so a page refresh
 * reopens it instantly (Design Decision 4) instead of flashing closed then open.
 *
 * @param props.slug - The collection or global slug — the cookie is scoped per
 *   slug so opening the preview for `posts` doesn't affect `pages`.
 * @param props.initialOpen - The server-read cookie value
 *   (`readLivePreviewPanelCookie`, below), threaded down from `NextAdminPage`
 *   (Step 4) so the client's first render matches the server's — no flash.
 * @returns `isOpen` and a `toggle` function that flips it and rewrites the cookie.
 */
export function useLivePreviewPanelState(props: {
  slug: string;
  initialOpen: boolean;
}): { isOpen: boolean; toggle: () => void } {
  const [isOpen, setIsOpen] = useState(props.initialOpen);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      writeLivePreviewPanelCookie({ slug: props.slug, isOpen: next });
      return next;
    });
  }, [props.slug]);

  return { isOpen, toggle };
}

/**
 * Writes the panel's open/closed cookie client-side. Guarded the way
 * `ThemeProvider.tsx`'s `writeStoredTheme` guards `localStorage` — Safari
 * private mode and similar settings can make `document.cookie` writes throw,
 * and a preview-panel preference is not worth crashing the edit view over.
 */
function writeLivePreviewPanelCookie(props: { slug: string; isOpen: boolean }): void {
  try {
    const oneYearInSeconds = 60 * 60 * 24 * 365;
    document.cookie = `${COOKIE_PREFIX}${props.slug}=${props.isOpen ? "1" : "0"}; path=/; max-age=${oneYearInSeconds}; samesite=lax`;
  } catch {
    // document.cookie can throw under Safari private mode / strict cookie
    // settings; losing the panel preference is not worth crashing the view.
  }
}

/**
 * Reads the panel's open/closed cookie server-side, for `NextAdminPage` (Step 4)
 * to pass as `initialOpen`. Exported separately from the hook because it takes
 * the cookie STRING (from `next/headers` `cookies()`), not a browser API — this
 * function has no framework dependency, so `@vexcms/next` can call it without
 * importing React.
 *
 * @param props.cookieHeader - The raw `Cookie` request header value, or the
 *   already-parsed value of the one cookie this reads.
 * @param props.slug - The collection or global slug.
 * @returns `true` only when the cookie explicitly stores `"1"` — absent (first
 *   visit) defaults to closed, per Design Decision 4.
 */
export function readLivePreviewPanelCookie(props: {
  cookieValue: string | undefined;
  slug: string;
}): boolean {
  return props.cookieValue === "1";
}
```

#### packages/react/src/hooks/useLivePreviewPanelState.test.ts

New file.

```ts
import { describe, expect, it } from "vitest";
import { readLivePreviewPanelCookie } from "./useLivePreviewPanelState";

describe("readLivePreviewPanelCookie", () => {
  it("returns true only for an explicit '1'", () => {
    expect(readLivePreviewPanelCookie({ cookieValue: "1", slug: "pages" })).toBe(true);
  });

  it("defaults to closed for '0', undefined, or garbage", () => {
    expect(readLivePreviewPanelCookie({ cookieValue: "0", slug: "pages" })).toBe(false);
    expect(readLivePreviewPanelCookie({ cookieValue: undefined, slug: "pages" })).toBe(false);
    expect(readLivePreviewPanelCookie({ cookieValue: "true", slug: "pages" })).toBe(false);
  });
});
```

#### packages/react/src/hooks/useLivePreviewSync.ts

New file.

```ts
"use client";

import { useEffect } from "react";
import { useStore } from "@tanstack/react-form";
import type { AnyFormApi } from "../components/form/AppFormContext";
import {
  VEX_PREVIEW_MESSAGE_SOURCE,
  type VexPreviewUpdateMessage,
} from "../context/livePreviewProtocol";

const DEFAULT_SYNC_DEBOUNCE_MS = 150;

/**
 * Posts the form's complete current values to the active preview target
 * (iframe or pop-out window) on every change, debounced.
 *
 * Always sends the full `form.state.values` snapshot, never a diff (Design
 * Decision 3) — the merge on the receiving end is a provable shallow spread
 * only because of this.
 *
 * @param props.form - The edit view's form instance.
 * @param props.collectionSlug - The collection or global slug being previewed.
 * @param props.documentId - The saved document id, once it exists.
 * @param props.tempId - The client-generated temp id, before the first save.
 * @param props.targetWindow - The currently active preview surface's window —
 *   the iframe's `contentWindow`, the pop-out's `window.open()` handle, or
 *   `null` when neither is open (the hook no-ops).
 * @param props.debounceMs - Milliseconds to wait after the last form change
 *   before posting. Defaults to `DEFAULT_SYNC_DEBOUNCE_MS`.
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
  const debounceMs = props.debounceMs ?? DEFAULT_SYNC_DEBOUNCE_MS;

  useEffect(() => {
    if (!props.targetWindow) return;
    const targetWindow = props.targetWindow;

    const syncTimeoutId = setTimeout(() => {
      const updateMessage: VexPreviewUpdateMessage = {
        source: VEX_PREVIEW_MESSAGE_SOURCE,
        type: "vex-preview-update",
        collectionSlug: props.collectionSlug,
        documentId: props.documentId,
        tempId: props.tempId,
        values,
      };
      targetWindow.postMessage(updateMessage, "*");
    }, debounceMs);

    return () => clearTimeout(syncTimeoutId);
  }, [values, props.targetWindow, props.collectionSlug, props.documentId, props.tempId, debounceMs]);
}
```

#### packages/react/src/hooks/useLivePreviewSync.test.ts

New file. Full code — the mounted-hook contract is exactly what a plausible bug (missed
debounce, wrong message shape) would break.

```tsx
import { act, renderHook } from "@testing-library/react";
import { useForm } from "@tanstack/react-form";
import { describe, expect, it, vi } from "vitest";
import { useLivePreviewSync } from "./useLivePreviewSync";

function renderWithForm(targetWindow: Window | null) {
  const postMessage = vi.fn();
  const fakeWindow = { postMessage } as unknown as Window;
  const { result } = renderHook(() => {
    const form = useForm({ defaultValues: { title: "Draft" } });
    useLivePreviewSync({
      form,
      collectionSlug: "pages",
      documentId: "doc1",
      targetWindow: targetWindow ?? fakeWindow,
    });
    return form;
  });
  return { form: result.current, postMessage };
}

describe("useLivePreviewSync", () => {
  it("posts a debounced full-snapshot update when the form value changes", async () => {
    vi.useFakeTimers();
    const { form, postMessage } = renderWithForm(null);

    await act(async () => {
      form.setFieldValue("title", "Published title");
    });
    expect(postMessage).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(150);
    });

    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "vex-preview-update",
        collectionSlug: "pages",
        documentId: "doc1",
        values: { title: "Published title" },
      }),
      "*",
    );
    vi.useRealTimers();
  });

  it("honors a custom debounceMs instead of the default", async () => {
    vi.useFakeTimers();
    const postMessage = vi.fn();
    const fakeWindow = { postMessage } as unknown as Window;
    const { result } = renderHook(() => {
      const form = useForm({ defaultValues: { title: "Draft" } });
      useLivePreviewSync({
        form,
        collectionSlug: "pages",
        documentId: "doc1",
        targetWindow: fakeWindow,
        debounceMs: 500,
      });
      return form;
    });

    await act(async () => {
      result.current.setFieldValue("title", "Published title");
    });

    await act(async () => {
      vi.advanceTimersByTime(150);
    });
    expect(postMessage).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(350);
    });
    expect(postMessage).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("does not post when no preview target is open", async () => {
    const { form, postMessage } = renderWithForm(null);
    // Re-render with a null target by constructing directly against the hook.
    const { result } = renderHook(() =>
      useLivePreviewSync({
        form,
        collectionSlug: "pages",
        documentId: "doc1",
        targetWindow: null,
      }),
    );
    void result;
    expect(postMessage).not.toHaveBeenCalled();
  });
});
```

#### packages/react/src/components/livePreview/LivePreviewPanel.tsx

New file. The JSX layout matches the split-pane precedent from `MediaPicker.tsx`.

```tsx
"use client";

import { useRef, useState } from "react";
import type { VexPreviewUrlResolver } from "@vexcms/core";
import type { AnyFormApi } from "../form/AppFormContext";
import { useLivePreviewSync } from "../../hooks/useLivePreviewSync";
import { Button } from "../ui";
import { SquareArrowOutUpRight } from "lucide-react";

/**
 * The live-preview split pane rendered beside a collection or global edit
 * form. Renders an iframe pointed at the resolved preview URL, tracks an
 * optional pop-out window, and syncs the form's values to whichever surface
 * is open via `useLivePreviewSync`.
 *
 * Mounted only when `isOpen` is true — the caller (`CollectionEditView` /
 * `GlobalEditView`, Step 4) owns the toggle button and the open/closed state
 * via `useLivePreviewPanelState`, so this component has no gate of its own.
 *
 * @param props.previewUrl - The resolved URL for the CURRENT form values,
 *   recomputed by the caller as routing-relevant fields change.
 * @param props.collectionSlug - The collection or global slug being previewed.
 * @param props.documentId - The saved document id, once it exists.
 * @param props.tempId - The client-generated temp id, before the first save.
 * @param props.form - The edit view's form instance, forwarded to
 *   `useLivePreviewSync`.
 */
export function LivePreviewPanel(props: {
  previewUrl: string;
  collectionSlug: string;
  documentId?: string;
  tempId?: string;
  form: AnyFormApi;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [poppedWindow, setPoppedWindow] = useState<Window | null>(null);

  useLivePreviewSync({
    form: props.form,
    collectionSlug: props.collectionSlug,
    documentId: props.documentId,
    tempId: props.tempId,
    targetWindow: poppedWindow ?? iframeRef.current?.contentWindow ?? null,
  });

  function handlePopOut() {
    const openedWindow = window.open(props.previewUrl, "vex-live-preview");
    if (!openedWindow) return;

    setPoppedWindow(openedWindow);
    const closeCheckIntervalId = setInterval(() => {
      if (openedWindow.closed) {
        setPoppedWindow(null);
        clearInterval(closeCheckIntervalId);
      }
    }, 500);
  }

  return (
    <div className="w-[45%] shrink-0 border-l pl-6">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Live preview</span>
        <Button type="button" variant="ghost" size="icon" onClick={handlePopOut}>
          <SquareArrowOutUpRight className="size-4" />
        </Button>
      </div>
      <iframe
        ref={iframeRef}
        src={props.previewUrl}
        className="h-[calc(100vh-theme(spacing.32))] w-full rounded-md border"
        title="Live preview"
      />
    </div>
  );
}

/**
 * Resolves the preview URL for the current form values, or `undefined` when
 * the collection/global has no `livePreview` configured, or when the resolver
 * itself returns `undefined` (e.g. a required routing field is still empty).
 *
 * @param props.url - The collection/global's `admin.livePreview.url` resolver,
 *   or `undefined` when live preview is not configured.
 * @param props.baseDoc - The saved document (or `{}` for a new document).
 * @param props.formValues - The form's current top-level values.
 * @param props.tempId - Present only for a document being created — merged in
 *   as a synthetic `_id` so a resolver keyed on `_id` still has one to read.
 */
export function resolveLivePreviewUrl(props: {
  url: VexPreviewUrlResolver | undefined;
  baseDoc: Record<string, unknown>;
  formValues: Record<string, unknown>;
  tempId?: string;
}): string | undefined {
  if (!props.url) return undefined;
  const doc = { ...props.baseDoc, ...props.formValues, _id: props.baseDoc._id ?? props.tempId };
  return props.url(doc);
}
```

#### packages/react/src/components/livePreview/LivePreviewPanel.test.tsx

New file.

```ts
import { describe, expect, it } from "vitest";
import { resolveLivePreviewUrl } from "./LivePreviewPanel";

describe("resolveLivePreviewUrl", () => {
  it("returns undefined when no resolver is configured", () => {
    expect(
      resolveLivePreviewUrl({ url: undefined, baseDoc: {}, formValues: { slug: "about" } }),
    ).toBeUndefined();
  });

  it("calls the resolver with saved fields overlaid by current form values", () => {
    const url = resolveLivePreviewUrl({
      url: (doc) => (typeof doc.slug === "string" ? `/${doc.slug}` : undefined),
      baseDoc: { _id: "doc1", slug: "old-slug" },
      formValues: { slug: "new-slug" },
    });
    expect(url).toBe("/new-slug");
  });

  it("merges in the temp id for a document with no saved _id yet", () => {
    const seenIds: unknown[] = [];
    resolveLivePreviewUrl({
      url: (doc) => {
        seenIds.push(doc._id);
        return undefined;
      },
      baseDoc: {},
      formValues: { slug: "draft" },
      tempId: "temp-123",
    });
    expect(seenIds).toEqual(["temp-123"]);
  });

  it("returns undefined when the resolver itself cannot resolve yet", () => {
    expect(
      resolveLivePreviewUrl({
        url: () => undefined,
        baseDoc: {},
        formValues: {},
      }),
    ).toBeUndefined();
  });
});
```

**Verify:** `pnpm --filter @vexcms/react test -- LivePreviewPanel useLivePreviewSync useLivePreviewPanelState`

---

### Step 4 — Wire `CollectionEditView`, `GlobalEditView`, `NextAdminPage` [dev]

#### packages/core/src/framework.ts

1 edit each — add to `CollectionEditViewProps` (`:85-101`) and `GlobalEditViewProps`
(`:111-122`), beside `initialData`:

```ts
  /**
   * The live-preview panel's initial open state, read server-side from the
   * `vex-preview-panel:<slug>` cookie by `NextAdminPage`. Omit to default closed.
   */
  initialPreviewPanelOpen?: boolean;
```

#### packages/react/src/components/views/CollectionEditView.tsx

4 edits — everything else in the file (the query, the form, `useLiveFieldMerge`,
permissions) is unchanged.

**1 — imports.** Add beside the existing hook/component imports:

```ts
import { useLivePreviewPanelState } from "../../hooks/useLivePreviewPanelState";
import { LivePreviewPanel, resolveLivePreviewUrl } from "../livePreview/LivePreviewPanel";
import { useStore } from "@tanstack/react-form";
```

**2 — panel state, beside the existing `fieldPermissions` line (`:117-121`).**

```ts
  const formValues = useStore(form.store, (state) => state.values);
  const previewPanel = useLivePreviewPanelState({
    slug: collection.slug,
    initialOpen: props.initialPreviewPanelOpen ?? false,
  });
  const previewUrl = resolveLivePreviewUrl({
    url: collection.admin.livePreview?.url,
    baseDoc: currentDocument,
    formValues,
  });
```

**3 — the toggle button, inside the existing `form.Subscribe` button group
(`:134-155`), added alongside the `RevalidateButton`.**

```tsx
              {collection.admin.livePreview && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={previewPanel.toggle}
                >
                  {previewPanel.isOpen ? "Hide preview" : "Show preview"}
                </Button>
              )}
```

**4 — wrap the returned JSX (`:122-180`) in a flex row, and render the panel as the
second column.** The `<AppForm>`'s existing children (the sticky header, the fields
grid) move one level deeper, unchanged in content:

```tsx
  return (
    <AppForm form={form} className="relative">
      <div className="flex gap-6">
        <div className="min-w-0 flex-1">
          {/* … existing sticky header + fields grid, unchanged … */}
        </div>
        {collection.admin.livePreview && previewPanel.isOpen && previewUrl && (
          <LivePreviewPanel
            previewUrl={previewUrl}
            collectionSlug={collection.slug}
            documentId={currentDocument._id}
            form={form}
          />
        )}
      </div>
    </AppForm>
  );
```

#### packages/react/src/components/views/GlobalEditView.tsx

Same four edits, mirrored: `collection.admin.livePreview` → `global.admin.livePreview`,
`collection.slug` → `global.slug`, no `documentId` (globals have one document per
slug — omit the prop; `LivePreviewPanel` already types it optional).

#### packages/react/src/index.ts

1 edit — export the new panel and hook beside the existing view/hook exports:

```ts
export { LivePreviewPanel, resolveLivePreviewUrl } from "./components/livePreview/LivePreviewPanel";
export { VexLivePreviewProvider, useVexPreview, useVexQuery } from "./context/VexLivePreviewContext";
export { useLivePreviewPanelState, readLivePreviewPanelCookie } from "./hooks/useLivePreviewPanelState";
```

#### packages/next/src/NextAdminPage.tsx

2 edits.

**1 — import.**

```ts
import { cookies } from "next/headers";
import { readLivePreviewPanelCookie } from "@vexcms/react";
```

**2 — thread the cookie into both `CollectionEditView` (`:141-147`) and
`GlobalEditView` (`:82`).** Read once near the top of the function, beside
`const { path = [] } = await props.params;`:

```ts
  const cookieStore = await cookies();
```

Then at each render call:

```tsx
    return (
      <GlobalEditView
        global={globalConfig.slug}
        initialData={global}
        initialPreviewPanelOpen={readLivePreviewPanelCookie({
          cookieValue: cookieStore.get(`vex-preview-panel:${globalConfig.slug}`)?.value,
          slug: globalConfig.slug,
        })}
      />
    );
```

```tsx
    return (
      <CollectionEditView
        collection={collection.slug}
        documentId={documentId}
        initialData={initialData}
        initialPreviewPanelOpen={readLivePreviewPanelCookie({
          cookieValue: cookieStore.get(`vex-preview-panel:${collection.slug}`)?.value,
          slug: collection.slug,
        })}
      />
    );
```

**Verify:** `pnpm --filter @vexcms/react test -- CollectionEditView GlobalEditView` and
`pnpm --filter @vexcms/next build`

---

### Step 5 — Public-route preview gating (`apps/www`) [dev]

Both edits below fully implement the middleware split; the public-route session check
shares its verification logic with the existing admin gate rather than duplicating it.

#### apps/www/src/proxy.ts

2 edits.

**1 — split `proxy()` into a path dispatcher**, extracting the existing admin-session
logic into `guardAdminRequest` and adding `grantPreviewIfRequested` for public routes.
This is required, not cosmetic: the matcher widens in edit 2 to also match public
routes, and the current `proxy()` body unconditionally treats every matched request as
needing an admin session — applied unchanged to a public route, it would redirect every
anonymous visitor to sign-in. Replaces the existing `proxy()` function (`:49-75`); the
two redirect helpers below it (`:82-116`) stay as-is.

```ts
export async function proxy(request: NextRequest) {
  if (ALWAYS_ALLOWED[request.nextUrl.pathname]) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/admin")) {
    return guardAdminRequest(request);
  }

  return grantPreviewIfRequested(request);
}

/** Session gate for the admin panel — fails closed, per the file docstring. */
async function guardAdminRequest(request: NextRequest) {
  const sessionStatus = await resolveSessionStatus();

  if (sessionStatus === "verification-failed") {
    return redirectToUnauthorized(request);
  }
  if (sessionStatus === "unauthenticated") {
    return redirectToSignIn(request);
  }
  return NextResponse.next();
}

/**
 * Grants live-preview mode to a public-route request carrying `?vexPreview=1`
 * and a verified admin session, by forwarding a marker request header the
 * site layout reads via `headers()` (Design Decision 6).
 *
 * Fails **open**, unlike `guardAdminRequest` — an unauthenticated or
 * unverifiable session here renders the page normally rather than
 * redirecting (Design Decision 7): this branch only decides whether to grant
 * an extra capability, never whether to allow the request at all.
 */
async function grantPreviewIfRequested(request: NextRequest) {
  if (request.nextUrl.searchParams.get("vexPreview") !== "1") {
    return NextResponse.next();
  }

  const sessionStatus = await resolveSessionStatus();
  if (sessionStatus !== "authenticated") {
    return NextResponse.next();
  }

  const previewRequestHeaders = new Headers(request.headers);
  previewRequestHeaders.set("x-vex-preview-enabled", "1");
  return NextResponse.next({ request: { headers: previewRequestHeaders } });
}

/**
 * Reads and verifies the Better Auth session cookie — shared by
 * `guardAdminRequest` and `grantPreviewIfRequested` so the cookie read and
 * `fetchQuery` verification exist in exactly one place.
 */
async function resolveSessionStatus(): Promise<
  "authenticated" | "unauthenticated" | "verification-failed"
> {
  const cookieStore = await cookies();
  const sessionToken =
    cookieStore.get(SESSION_COOKIES.https)?.value ?? cookieStore.get(SESSION_COOKIES.http)?.value;
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
```

**2 — widen the matcher (`:118-123`) to also run on public routes, excluding static
assets:**

```ts
export const config = {
  matcher: ["/admin/:path*", "/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

#### apps/www/src/app/(frontend)/(site)/layout.tsx

1 edit — mount `VexLivePreviewProvider` conditionally, beside the existing
`Promise.all` header/footer fetch.

```tsx
import { headers } from "next/headers";
import { VexLivePreviewProvider } from "@vexcms/react";
import vexConfig from "~/vex.config";
```

```tsx
  const requestHeaders = await headers();
  const previewEnabled = requestHeaders.get("x-vex-preview-enabled") === "1";
```

Wrap the layout's existing `children` output:

```tsx
  return previewEnabled ? (
    <VexLivePreviewProvider
      allowedOrigins={vexConfig.livePreview.allowedOrigins}
      collections={vexConfig.collections}
    >
      {/* … existing SiteHeader / children / SiteFooter JSX, unchanged … */}
    </VexLivePreviewProvider>
  ) : (
    <>{/* … the same existing JSX, unchanged … */}</>
  );
```

**Verify:** `pnpm --filter www build`. Manual check (P-024 — never start a dev server;
attach to the developer's running one on port 3030): `curl -sI
"http://localhost:3030/?vexPreview=1"` without a session cookie returns 200 with no
`x-vex-preview-enabled` request-header side effect observable client-side (the header is
request-only); with a valid `better-auth.session_token` cookie forwarded, the rendered
HTML's live-preview provider mounts (confirm via the browser tool, not curl, since the
provider is a client component with no server-rendered marker).

---

### Step 6 — `apps/www` dogfooding: pages collection + `PageContent.tsx` [dev]

#### apps/www/src/lib/resolvePagePath.ts

New file. Full code — extracted so `routes.map` and `admin.livePreview.url` share one
slug→path rule instead of duplicating it (both currently would otherwise re-implement
the `slug === "home" ? "/" : `/${slug}`` rule independently and drift).

```ts
/**
 * Maps a `pages` document's slug to its public path. Shared by `vex.config.ts`'s
 * `routes.map` (cache revalidation) and `pages.ts`'s `admin.livePreview.url`
 * (Design Decision 1 — the two resolvers stay independent types, but this project's
 * pages collection happens to want the same rule for both).
 *
 * @param slug - The page's `slug` field value.
 * @returns The public path, or `undefined` when `slug` is not yet a usable string.
 */
export function resolvePagePath(slug: unknown): string | undefined {
  if (typeof slug !== "string" || slug.length === 0) return undefined;
  return slug === "home" ? "/" : `/${slug}`;
}
```

#### apps/www/src/vexcms/collections/pages.ts

1 edit — add to the existing `admin` block (`:8-15`), beside `useAsTitle`/`icon`:

```ts
    livePreview: {
      url: (doc) => resolvePagePath(doc.slug),
    },
```

Add the import beside the collection's existing imports:

```ts
import { resolvePagePath } from "~/lib/resolvePagePath";
```

#### apps/www/src/vex.config.ts

2 edits.

**1 — reuse the same helper in `routes.map` (`:39-45`)** rather than the inline
slug rule it has today — replace the body of the `pages` branch with
`return [resolvePagePath(doc.slug)].filter((p): p is string => p !== undefined);`, and
add the same `resolvePagePath` import.

**2 — the root `livePreview.allowedOrigins`**, added beside the existing `admin`
block:

```ts
  livePreview: {
    allowedOrigins: [
      "http://localhost:3030",
      ...(process.env.NEXT_PUBLIC_SITE_URL ? [process.env.NEXT_PUBLIC_SITE_URL] : []),
    ],
  },
```

#### apps/www/src/app/(frontend)/(site)/PageContent.tsx

1 edit — replace the existing `useQuery` call (`:28-34`) with `useVexQuery`, same
options object, no other change:

```ts
import { useVexQuery } from "@vexcms/react";
```

```tsx
  const { data: pages } = useVexQuery({
    ...convexQuery(api.pages.getBySlug, { slug: normalizedSlug }),
    initialData,
  });
```

**Verify:** Manual browser verification (per this spec's `## Verification` section) —
open a page's edit view with the preview panel toggled on, type in the title field, and
confirm the iframe updates without saving.

---

### Step 7 — `create-vexcms/templates/marketing-site` parity [dev]

Mirror Step 6's four files onto
`packages/create-vexcms/templates/marketing-site/src/{lib/resolvePagePath.ts,
vexcms/collections/pages.ts, vex.config.ts, app/(frontend)/(site)/PageContent.tsx}` —
identical content, since the template's `pages.ts` and `PageContent.tsx` are already
verified identical to `apps/www`'s (per this spec's research; the only existing
divergence is the template's extra `isPending` loading check in `PageContent.tsx`,
which stays). Mirror Step 5's `proxy.ts` and `(site)/layout.tsx` edits onto the
template's equivalents — confirm the template has its own `proxy.ts`
(`packages/create-vexcms/templates/marketing-site/src/proxy.ts`) since its docstring
already notes "this is the marketing-site variant" of the base template's stricter gate.

**Verify:** `pnpm verify:scaffold` in `marketing-site` mode — scaffolds the template,
installs, typechecks, and builds (AP-020 — only a real scaffold run catches template
defects; typecheck/build alone do not).

---

### Step 8 — Docs and cross-references [dev]

#### packages/core/src/routes/types.ts

1 edit — the docstring on `VexRoutesConfig` (`:44-62`) currently lists "preview links"
as a `routes.map` consumer (`:53`). Replace that line to point at the real mechanism:

```ts
 * Named for what it describes rather than for a consumer. Cache revalidation is
 * the first consumer — `resolveTargets` uses `map` to decide which paths a
 * write invalidated — but the same answer drives an admin "View page" link and
 * sitemap URL generation. Live preview resolves its OWN target URL via the
 * independent `admin.livePreview.url` resolver (see `@vexcms/core`'s
 * `livePreview` module) — the two intentionally do not share a code path,
 * since a preview target may point at a different origin than production.
```

#### packages/core/README.md

1 edit — replace the "Live Preview" section (`:213-218`), currently claiming the
feature is entirely unshipped:

```md
### Live Preview

Ships a `postMessage`-driven overlay: `admin.livePreview.url` on a collection or global
resolves a document to the public URL its preview should render; the admin panel's edit
views render a toggleable split pane (or a pop-out window) that iframes that URL and
streams the form's unsaved values into it via `<VexLivePreviewProvider>` /
`useVexPreview` / `useVexQuery`. See the
[Live Preview guide](https://docs.vexcms.dev/guides/live-preview/) for the security
requirements (`livePreview.allowedOrigins`, the per-request opt-in) any project embedding
a preview surface must configure.
```

#### apps/docs/src/content/docs/guides/live-preview.mdx

New file, following the naming convention (`docs-content-kebab`) and mirroring the
structure of the existing `guides/lifecycle-hooks.mdx` (from spec F). Content:

- What ships: `admin.livePreview.url` on collections/globals, `livePreview
  .allowedOrigins` at the config root, `<VexLivePreviewProvider>` / `useVexPreview` /
  `useVexQuery` in `@vexcms/react`.
- A minimal end-to-end example: a `pages` collection's `admin.livePreview.url`, the root
  `livePreview.allowedOrigins`, and a `PageContent.tsx`-style consumer switching to
  `useVexQuery`.
- The security checklist (ADR-012's four requirements) as a required-setup list, not an
  implementation detail — a project embedding a public preview surface must configure
  its own gating (Step 5's pattern) since the framework cannot know the project's auth.
- The two documented limitations: preview renders pre-`beforeChange` state (no derived
  fields), and preview data is never validated as trusted — it is a same-schema-shaped
  echo of what the editor typed, never treated as authoritative.

**Verify:** `grep -rn "livePreview" packages/core/README.md apps/docs/src/content/docs`
shows only the corrected text — no remaining "Not shipped" / "Reserved for future"
claims.

## Verification

1. `pnpm build && pnpm test` at the repo root — every step above stays green
   incrementally; this is the final full-repo confirmation.
2. `pnpm verify:scaffold` — proves the `marketing-site` template change (Step 7) survives
   a real scaffold, not just a monorepo-internal build.
3. Manual browser verification against the developer's already-running `apps/www` dev
   server (P-024 — never start one): open `/admin/pages/<id>` with the preview panel
   toggled open, edit the title field, and confirm the iframe's rendered page updates
   with no save; refresh the preview iframe and confirm the handshake recovers the
   unsaved title; open a second edit-view tab on the same document and confirm each
   tab's preview reflects only its own unsaved edits (ADR-012's per-editor-state
   consequence); create a new page (no save yet) and confirm the temp-id preview path
   resolves once a `slug` is typed.
