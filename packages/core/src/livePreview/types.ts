import type { VexDocument } from "../api/convex";
import type {
  CollectionSlug,
  DocumentByCollectionSlug,
  GlobalSlug,
  VexQueryCtx,
} from "../types/generated";
import type { DocumentByGlobalSlug } from "../types/generated";
import type { LucideIconName } from "../utils";
import type { VexCallbackApi } from "../api/server";

/**
 * Resolves a document to the single public URL its live preview should render.
 *
 * `TDoc` is supplied by the caller — `AdminLivePreviewConfigInput` instantiates it with
 * `Partial<DocumentByCollectionSlug<...>>` / `Partial<DocumentByGlobalSlug<...>>`, so a
 * resolver authored inside `defineCollection`/`defineGlobal` sees the exact generated
 * fields for its own collection/global — not a bare `VexDocument`.
 *
 * Distinct from `VexRouteMapper` (`routes/types.ts`): `routes.map` answers "every
 * public path this document renders at" (0..N); this answers "the one URL to iframe
 * for preview" and may point at a different origin than production.
 *
 * @param doc - The document as currently known — saved fields merged with unsaved
 *   form edits. `Partial` because a document being created has no `_id` yet.
 * @returns The URL to preview `doc` at, or `undefined` when it cannot be resolved yet.
 *
 * @example
 * ```ts
 * defineCollection({
 *   slug: "pages",
 *   admin: {
 *     livePreview: {
 *       // doc: Partial<PagesDocument> — doc.slug is typed, not unknown
 *       url: (doc) => (doc.slug ? `https://example.com/${doc.slug}` : undefined),
 *     },
 *   },
 * });
 * ```
 */
export type LivePreviewUrlResolver<TDoc extends Partial<VexDocument> = Partial<VexDocument>> = {
  // Method syntax, read back through an index access: that is what makes `TDoc`
  // bivariant. A plain `(doc: TDoc) => …` type is strictly contravariant, so a
  // `CollectionConfig` whose slug is still generic stops being assignable to the
  // concrete union the admin views hold — it broke `useCollectionForm`,
  // `defineConfig` and every `access` resource the first time this was written
  // that way. The property could use method shorthand directly until `url`
  // became `string | resolver`; a union member cannot.
  bivariantResolve(doc: TDoc): string | undefined;
}["bivariantResolve"];

/**
 * A preview-URL resolver that runs on Convex with a real `ctx`.
 *
 * Authored in the CLIENT config, beside the collection it belongs to — exactly
 * as a field's `validate()` callback is, and for the same reason: the server
 * config wraps the client config, so `convex/vex.ts` can reach it. The closure
 * is therefore bundled into the browser even though it never runs there, so it
 * must not capture secrets.
 *
 * `ctx` is the project's own `VexQueryCtx`, read from the `vex generate`
 * augmentation — no type parameter, because a project has exactly one data
 * model and a callback always runs against it.
 *
 * @typeParam TDoc - The document as currently known: saved fields merged with
 *   the editor's unsaved form values.
 */
export type LivePreviewServerUrlResolver<TDoc extends Partial<VexDocument> = Partial<VexDocument>> = {
  bivariantResolve(props: {
    ctx: VexQueryCtx;
    /**
     * Read-only VexCMS API — flat globals, populated relationships,
     * access-aware reads. `ctx` above remains for a direct `ctx.db` probe.
     */
    vex: VexCallbackApi;
    doc: TDoc;
  }): Promise<string | undefined> | string | undefined;
}["bivariantResolve"];

/**
 * The `{ server }` wrapper marking a resolver as server-executed.
 *
 * An object, not a bare async function: at runtime a function returning a
 * promise is still just a function, indistinguishable from the sync client
 * resolver, and misrouting it would mean calling `ctx.db` in the browser.
 */
export interface LivePreviewServerUrl<TDoc extends Partial<VexDocument> = Partial<VexDocument>> {
  server: LivePreviewServerUrlResolver<TDoc>;
}

/** Every accepted `admin.livePreview.url` form. */
export type LivePreviewUrl<TDoc extends Partial<VexDocument> = Partial<VexDocument>> =
  | string
  | LivePreviewUrlResolver<TDoc>
  // The server form's `ctx` is the project's own `VexQueryCtx`, supplied by the
  // `vex generate` augmentation — so a resolver is written inline wherever it is
  // declared, with no type parameter and no helper wrapper.
  | LivePreviewServerUrl<TDoc>;

/**
 * One toggle-able simulated viewport width, offered as a button in the
 * embedded preview panel's breakpoint row and the floating indicator's
 * pop-out resize controls.
 *
 * Rendering precedence: `icon`, when set, renders instead of `label` as the
 * button's visible content, with `label` becoming the hover title/tooltip
 * instead. With no `icon`, `label` renders as plain text. `label` is
 * therefore always required — even an icon-only button needs it for the
 * tooltip and for accessibility (it becomes the button's `aria-label`).
 */
export interface LivePreviewBreakpoint {
  /**
   * Always required. The button's visible text when `icon` is unset; the
   * hover title and `aria-label` when `icon` is set.
   */
  label: string;
  /** The viewport width, in pixels, this breakpoint simulates. */
  width: number;
  /**
   * Renders instead of `label` in the toggle button when set — e.g. a
   * `"Smartphone"`/`"Tablet"`/`"Laptop"`/`"Monitor"` icon per breakpoint so a
   * project can show device silhouettes instead of pixel numbers. Omit to
   * show `label` as plain text.
   */
  icon?: LucideIconName;
}

/**
 * User-facing input for a collection or global's `admin.livePreview` block.
 *
 * @typeParam TDoc - The exact generated document interface this collection/global's
 *   `url` resolver receives — see {@link LivePreviewUrlResolver}.
 */
export interface AdminLivePreviewConfigInput<
  TDoc extends Partial<VexDocument> = Partial<VexDocument>,
> {
  /**
   * The document's public preview URL, as a literal path for a collection or
   * global that always previews at one place (`url: "/"`), or a resolver for
   * one whose URL depends on the document.
   *
   * Declared with method syntax, not `url: LivePreviewUrlResolver<TDoc>`, so
   * the parameter is checked bivariantly: a `CollectionConfig<…, TSlug>` with a
   * still-generic `TSlug` has to stay assignable to the concrete union form the
   * admin views hold, and a property-position function type makes `TDoc`
   * strictly contravariant, which breaks exactly that assignment.
   */
  url: LivePreviewUrl<TDoc>;
  /**
   * Milliseconds `useLivePreviewSync` waits after the last form change before
   * posting an update.
   * @defaultValue `DEFAULT_LIVE_PREVIEW_DEBOUNCE_MS` (150ms)
   */
  debounceMs?: number;
  /**
   * Whether the preview panel starts open before the editor has ever made an
   * explicit choice. A `vex-live-preview-panel:<slug>` cookie remembers an explicit
   * choice once made and always wins over this default.
   * @defaultValue `false`
   */
  defaultOpen?: boolean;
  /**
   * Overrides the root `livePreview.breakpoints` for this collection/global's own
   * panel only. You are very likely looking for the root-level
   * `livePreview.breakpoints` instead — set there once, it applies to every
   * collection/global that declares `admin.livePreview.url`. Override here only
   * for the rare collection whose previewed layout genuinely needs different
   * simulated widths than the rest of the project.
   */
  breakpoints?: LivePreviewBreakpoint[];
}

/**
 * `admin.livePreview` as it survives `defineCollection()`/`defineGlobal()`.
 *
 * Structurally identical to {@link AdminLivePreviewConfigInput}: those factories
 * deliberately apply NO defaults here. They resolve in isolation, before
 * `defineConfig()` has seen the root `livePreview.collections`/`globals` entry
 * for the same slug, so a default applied at define time would be
 * indistinguishable from an explicit value and would silently outrank the root
 * entry. Every default lands in `resolveLivePreviewSettings` instead.
 */
export type AdminLivePreviewConfig<TDoc extends Partial<VexDocument> = Partial<VexDocument>> =
  AdminLivePreviewConfigInput<TDoc>;

/**
 * Root-level per-collection preview settings, keyed by slug.
 *
 * Whole config blocks rather than a bare `slug -> url` map: a project that wants
 * its preview URLs in one place wants its preview *settings* in one place. The
 * key supplies the slug, so each entry's `url` resolver is typed against that
 * collection's generated document with no annotation at the call site.
 */
export type LivePreviewCollectionMap = {
  [TSlug in CollectionSlug]?: AdminLivePreviewConfigInput<Partial<DocumentByCollectionSlug<TSlug>>>;
};

/** Root-level per-global preview settings, keyed by slug. Mirrors {@link LivePreviewCollectionMap}. */
export type LivePreviewGlobalMap = {
  [TSlug in GlobalSlug]?: AdminLivePreviewConfigInput<Partial<DocumentByGlobalSlug<TSlug>>>;
};

/**
 * One collection or global's preview settings after every layer has been
 * applied — what the admin views and the preview panel actually consume.
 */
export interface ResolvedLivePreviewSettings<
  TDoc extends Partial<VexDocument> = Partial<VexDocument>,
> {
  url: LivePreviewUrl<TDoc>;
  debounceMs: number;
  defaultOpen: boolean;
  breakpoints: LivePreviewBreakpoint[];
}

/**
 * User-facing input for the root-level `livePreview` config block — sibling to
 * `admin` / `access` / `routes` on `VexClientConfigInput`.
 */
export interface LivePreviewConfigInput {
  /**
   * Origins permitted to send `postMessage` control frames to a live-preview
   * listener — e.g. `["http://localhost:3000", "https://admin.example.com"]`.
   * Explicitly configured rather than inferred. Empty (the default) means the
   * `postMessage` transport accepts nothing — `BroadcastChannel` is unaffected,
   * since it cannot cross origins at all.
   */
  allowedOrigins: string[];
  /**
   * Breakpoints offered as toggle buttons in every collection/global's
   * preview panel and the floating indicator's pop-out controls, unless a
   * collection/global overrides them via its own `admin.livePreview.breakpoints`.
   * @defaultValue `DEFAULT_LIVE_PREVIEW_BREAKPOINTS`
   */
  breakpoints?: LivePreviewBreakpoint[];
  /**
   * Preview settings per collection, as an alternative to declaring them on each
   * `defineCollection({ admin: { livePreview } })`. A collection's own block wins
   * field by field over its entry here — see `resolveLivePreviewSettings`.
   */
  collections?: LivePreviewCollectionMap;
  /** Preview settings per global. Mirrors {@link LivePreviewConfigInput.collections}. */
  globals?: LivePreviewGlobalMap;
}

/** Resolved root-level `livePreview` config after `defineConfig()` applies defaults. */
export interface LivePreviewConfig {
  allowedOrigins: string[];
  breakpoints: LivePreviewBreakpoint[];
  /** Per-collection settings; `{}` when the project declared none. */
  collections: LivePreviewCollectionMap;
  /** Per-global settings; `{}` when the project declared none. */
  globals: LivePreviewGlobalMap;
}
