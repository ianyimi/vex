import type { VexDocument } from "../api/convex";
import type { LucideIconName } from "../utils";

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
export type LivePreviewUrlResolver<TDoc extends Partial<VexDocument> = Partial<VexDocument>> = (
  doc: TDoc,
) => string | undefined;

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
   * Resolves the document being edited to its public preview URL.
   *
   * Declared with method syntax, not `url: LivePreviewUrlResolver<TDoc>`, so
   * the parameter is checked bivariantly: a `CollectionConfig<…, TSlug>` with a
   * still-generic `TSlug` has to stay assignable to the concrete union form the
   * admin views hold, and a property-position function type makes `TDoc`
   * strictly contravariant, which breaks exactly that assignment.
   */
  url(doc: TDoc): string | undefined;
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
 * Resolved `admin.livePreview` config after `defineCollection()`/`defineGlobal()` applies
 * defaults.
 */
export interface AdminLivePreviewConfig<TDoc extends Partial<VexDocument> = Partial<VexDocument>> {
  /** See {@link AdminLivePreviewConfigInput.url} for why this is method syntax. */
  url(doc: TDoc): string | undefined;
  debounceMs: number;
  defaultOpen: boolean;
  /** Overrides the root breakpoints for this collection/global. `undefined` = inherit. */
  breakpoints?: LivePreviewBreakpoint[];
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
}

/** Resolved root-level `livePreview` config after `defineConfig()` applies defaults. */
export interface LivePreviewConfig {
  allowedOrigins: string[];
  breakpoints: LivePreviewBreakpoint[];
}
