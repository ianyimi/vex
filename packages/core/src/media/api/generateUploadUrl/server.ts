import { GenericDataModel } from "convex/server";
import { VexStorageConfigError } from "../../types";
import type { GenerateUploadUrlServerArgs } from "../types";
import { CRUD_ACTIONS, hasPermission, PERMISSION_SCOPES } from "../../../access";
import { resolveAccessCall } from "../../../access/resolveAccessCall";

/**
 * Generates a URL to upload a file to the storage adapter.
 * Server-side only — call inside a Convex mutation handler.
 *
 * Looks up the adapter by name from `args.config.storage?.adapters` and
 * calls `adapter.generateUploadUrl(ctx)`.
 *
 * Import from `@vexcms/core/server`.
 *
 * @typeParam DataModel - Convex data model (inferred from `args.ctx`).
 * @param args - `{ ctx, config, adapter }`.
 * @returns Promise resolving to `{ url: string }` — the upload URL.
 * @example
 * ```ts
 * import { generateUploadUrl } from "@vexcms/core/server";
 *
 * export const uploadFile = mutation({
 *   args: { adapter: v.string() },
 *   handler: (ctx, args) =>
 *     generateUploadUrl({ ctx, config: myConfig, adapter: args.adapter }),
 * });
 */
export async function generateUploadUrl<TDataModel extends GenericDataModel = GenericDataModel>(
  args: GenerateUploadUrlServerArgs<TDataModel>,
): Promise<{ url: string }> {
  if (args.config.access !== undefined) {
    const { access, action, resource } = resolveAccessCall({
      config: args.config,
      access: args.access,
      defaultAction: CRUD_ACTIONS.create,
      resource: args.collection,
    });
    hasPermission({
      throwOnDenied: true,
      user: args.auth?.user ?? null,
      organization: args.auth?.organization,
      access,
      resource,
      action,
      scope: PERMISSION_SCOPES.any,
    });
  }
  const adapter = args.config.storage?.adapters.find((a) => a.name === args.adapter);
  if (!adapter) {
    throw new VexStorageConfigError(`Storage adapter "${args.adapter}" not found`);
  }
  return await adapter.generateUploadUrl(args.ctx);
}
