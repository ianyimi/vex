import type { GenericDataModel, GenericQueryCtx } from "convex/server";
import type { GenericId } from "convex/values";

import { CRUD_ACTIONS, hasPermission } from "../access";
import { createVexCallbackApi } from "../api/server";
import { toVexQueryCtx } from "../api/utils";
import type { VexApiAuth } from "../api/types";
import type { VexConfig } from "../config";
import type { CollectionSlug } from "../types/generated";
import { resolveLivePreviewSettings } from "./resolveSettings";
import type { LivePreviewServerUrlResolver } from "./types";

/**
 * Runs a `{ server }` preview-URL resolver with a real Convex `ctx`.
 *
 * The admin panel cannot evaluate this form itself: the resolver reads the
 * database, and the values it reads it against include the editor's *unsaved*
 * form state, which exists only in the browser. So the browser ships the values
 * here and the resolver runs where `ctx` is real.
 *
 * Gated by the same read permission the collection's own `get` enforces. Without
 * that check this endpoint is an unauthenticated oracle: the caller controls
 * `values`, the resolver may read anything through `ctx.db`, and the returned
 * URL can encode what it read.
 *
 * @param props.ctx - Convex query context.
 * @param props.config - The resolved server config.
 * @param props.auth - The resolved caller, as every other API entry point receives it.
 * @param props.kind - Whether `slug` names a collection or a global.
 * @param props.slug - The collection or global being previewed.
 * @param props.documentId - The saved document's id, absent while it is being created.
 * @param props.values - The editor's current form values, merged over the saved document.
 * @returns The resolved preview URL, or `undefined` when this slug has no
 *   `{ server }` resolver or the resolver itself cannot resolve one yet.
 */
export async function resolveLivePreviewUrlOnServer<DataModel extends GenericDataModel>(props: {
  ctx: GenericQueryCtx<DataModel>;
  config: VexConfig;
  auth?: VexApiAuth;
  kind: "collection" | "global";
  slug: string;
  documentId?: string;
  values: Record<string, unknown>;
}): Promise<string | undefined> {
  const collection =
    props.kind === "collection"
      ? props.config.collections.find((candidate) => candidate.slug === props.slug)
      : props.config.globals.find((candidate) => candidate.slug === props.slug);
  if (!collection) return undefined;

  const settings = resolveLivePreviewSettings({
    config: props.config.admin.livePreview,
    kind: props.kind,
    slug: props.slug,
    admin: collection.admin.livePreview,
  });
  const serverResolver = readServerResolver(settings?.url);
  if (!serverResolver) return undefined;

  const savedDocument = props.documentId
    ? await props.ctx.db.get(props.documentId as GenericId<CollectionSlug>)
    : null;
  const previewDocument = { ...(savedDocument ?? {}), ...props.values };

  if (props.config.access !== undefined) {
    hasPermission({
      throwOnDenied: true,
      access: props.config.access,
      user: props.auth?.user ?? null,
      organization: props.auth?.organization,
      resource: props.slug,
      action: CRUD_ACTIONS.read,
      data: previewDocument,
    });
  }

  // The resolver is declared against the project's own data model, which this
  // generic function cannot name. @see {@link toVexQueryCtx}
  const resolverCtx = toVexQueryCtx(props.ctx);
  return await serverResolver({
    ctx: resolverCtx,
    vex: createVexCallbackApi({ ctx: resolverCtx, config: props.config }),
    doc: previewDocument,
  });
}

/**
 * Narrows a configured `url` to its server-resolver form.
 *
 * The server form is an object (`{ server: fn }`) precisely so this check can
 * exist: at runtime an `async (doc) => …` is indistinguishable from the sync
 * client resolver, and guessing wrong would mean calling `ctx.db` in a browser.
 *
 * @param url - A configured `url` in any of its three forms.
 * @returns The server resolver, or `undefined` for the string and client forms.
 */
function readServerResolver(url: unknown): LivePreviewServerUrlResolver | undefined {
  if (typeof url !== "object" || url === null) return undefined;
  const candidate = (url as { server?: unknown }).server;
  return typeof candidate === "function"
    ? (candidate as LivePreviewServerUrlResolver)
    : undefined;
}
