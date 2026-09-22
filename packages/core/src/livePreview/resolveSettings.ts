import { DEFAULT_LIVE_PREVIEW_BREAKPOINTS, DEFAULT_LIVE_PREVIEW_DEBOUNCE_MS } from "./constants";
import type {
  AdminLivePreviewConfigInput,
  LivePreviewConfig,
  ResolvedLivePreviewSettings,
} from "./types";

/**
 * Resolves one collection or global's live-preview settings from every layer
 * that may declare them.
 *
 * The single place this precedence is written. Four call sites need a
 * document's preview settings — `CollectionEditView`, `GlobalEditView`,
 * `NextAdminPage`, and the server-side URL endpoint — and they must not
 * disagree about where a document previews or how fast it syncs.
 *
 * Order per field, highest first:
 *
 * 1. the collection/global's own `admin.livePreview.<field>`
 * 2. `config.livePreview.collections[slug].<field>` / `.globals[slug].<field>`
 * 3. `config.livePreview.<field>` (root `breakpoints` only)
 * 4. the field's built-in default
 *
 * Merged field by field, not whole-object: a collection that sets only
 * `defaultOpen` still inherits the root entry's `url`. Whole-object replacement
 * would make the root block useless as soon as one setting was overridden.
 *
 * @param props.config - Resolved root `livePreview` config.
 * @param props.kind - Which map to read the root entry from.
 * @param props.slug - The collection or global slug.
 * @param props.admin - The collection/global's own `admin.livePreview`, if any.
 * @returns Fully resolved settings, or `undefined` when no layer supplied a
 *   `url` — i.e. live preview is not configured for this slug.
 */
export function resolveLivePreviewSettings(props: {
  config: LivePreviewConfig;
  kind: "collection" | "global";
  slug: string;
  admin?: AdminLivePreviewConfigInput;
}): ResolvedLivePreviewSettings | undefined {
  const rootMap = props.kind === "collection" ? props.config.collections : props.config.globals;
  const rootEntry = (rootMap as Record<string, AdminLivePreviewConfigInput | undefined>)[
    props.slug
  ];

  const url = props.admin?.url ?? rootEntry?.url;
  if (url === undefined) return undefined;

  return {
    url,
    debounceMs:
      props.admin?.debounceMs ?? rootEntry?.debounceMs ?? DEFAULT_LIVE_PREVIEW_DEBOUNCE_MS,
    defaultOpen: props.admin?.defaultOpen ?? rootEntry?.defaultOpen ?? false,
    breakpoints:
      props.admin?.breakpoints ??
      rootEntry?.breakpoints ??
      props.config.breakpoints ??
      DEFAULT_LIVE_PREVIEW_BREAKPOINTS,
  };
}
