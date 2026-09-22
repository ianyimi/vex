---
"@vexcms/core": patch
"@vexcms/react": patch
"@vexcms/next": patch
"create-vexcms": patch
---

Live preview reaches globals, resolves URLs on the server, and hands config callbacks a
typed `vex` api. Several pieces of this were unreachable before: a global's unsaved values
never applied at all, and a server-resolved preview URL loaded an ordinary page.

**Globals are previewable.** `LivePreviewProvider` matched an incoming `collectionSlug`
against `collections` only and returned early on a miss, so every global update was dropped
before validation. It now falls through to `globals` and validates with
`getGlobalInputSchema(...).partial()`. The overlay map is keyed by preview key — `_id` for a
collection document, the slug for a global, matching what `GlobalEditView` sends — and
`useLivePreview`/`useLivePreviewDocumentQuery` accept a `VexResourceSlug`, so a global slug
is no longer a compile error.

**`LivePreviewProvider` takes no props.** It reads `collections`, `globals`, and
`admin.livePreview.allowedOrigins` from `VexConfigContext`. Mount `VexConfigProvider` once
at the app root — it now serves the admin panel and the public site — and render
`<LivePreviewProvider>` directly.

**Server-resolved preview URLs carry the preview params.** `appendLivePreviewParams` moved
into `@vexcms/core` and `NextAdminPage` applies it to what `livePreviewUrl` returns;
previously the iframe was handed a plain public URL and silently listened to nothing.
`useLivePreviewServerUrl` holds the last resolved URL while a later edit's query is in
flight (`keepPreviousData`) instead of reverting to the server-rendered one, which was
changing the iframe `src` and reloading the preview between edits.

**Root `admin.livePreview.collections`/`.globals` maps.** Preview settings may be declared
centrally or on the collection/global, resolved by one precedence function. `url` accepts a
`{ server }` resolver that reads the database, invoked with `ctx` and a read-only `vex` api.

**`VexCallbackApi`.** Config callbacks receive `vex` — `find`, `get`, `search`, and
`globals.get`/`globals.find` — bound to the caller's `ctx` and config, access-bypassed by
default so a uniqueness check cannot miss rows the caller may not read.

**Typed `ctx` without type parameters.** `vex generate` emits the project's `DataModel` into
the `GeneratedVexTypes` augmentation, so `VexQueryCtx`/`VexMutationCtx` name the project's
own context and every `TCtx`/`TDataModel` parameter on config callbacks is gone. A project
that generated types before this must run `vex generate` once, or `ctx` stays
`GenericDataModel`.

**`validate()` throws.** A field validator raises a `ConvexError` instead of returning a
string; `validateFields` normalizes every failure to one error shape. Field generics are
slug-first (`VexResourceSlug`, `DocumentByResourceSlug`).

**Removed:** the floating `LivePreviewIndicator`. The previewed page renders no chrome of
its own — the admin panel frames the preview and owns its controls.
