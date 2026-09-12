import type {
  CollectionSlug,
  CrudWriteAction,
  VexConfig,
  VexDocument,
  VexMutationOperation,
  VexRevalidateChange,
  VexRevalidateRequest,
  VexRevalidateResponse,
} from "@vexcms/core";
import {
  hasPermission,
  PERMISSION_SCOPES,
  resolveTargets,
  VEX_REVALIDATE_BATCH_SIZE,
} from "@vexcms/core";
import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/** Props for {@link createVexRevalidateRoute}. */
export interface CreateVexRevalidateRouteProps {
  /**
   * The resolved VexCMS config. Supplies `access` for the write-permission
   * check and `routes.map` for target resolution.
   */
  config: VexConfig;
  /**
   * Resolves the authenticated user and active organization for the current
   * request. Wire to `() => fetchAuthQuery(api.auth.api.getUserOrg, {})` — the
   * same call the admin panel route already makes.
   */
  getAuth: () => Promise<{
    organization?: Record<string, unknown>;
    user: null | Record<string, unknown>;
  }>;
  /**
   * Reads the caller's session token for the current request. Wire to the host
   * app's `getToken` export (`convexBetterAuthNextJs`'s output, re-exported
   * from e.g. `~/auth/server`). A falsy return means "no session".
   */
  getToken: () => Promise<null | string | undefined>;
  /**
   * Lists every document in a collection, for the collection-wide purge
   * (`{ collection, all: true }`). Wire to a read through the app's own
   * `publishedSlugs`-style query — the factory cannot know an app's generated
   * Convex `api`, which is why this is injected like `getToken`/`getAuth`.
   *
   * Omit to leave the collection-wide branch unwired: it then purges nothing
   * and reports that in `errors`, rather than silently succeeding.
   */
  listCollection?: (collection: CollectionSlug) => Promise<Partial<VexDocument>[]>;
}

/**
 * Maps the wire verb to the CRUD action `hasPermission` and `resolveTargets`
 * accept.
 *
 * `VexMutationOperation` is named for the `vexConvexApi` function that produced
 * the write (`vexConvexApi.remove`), while `hasPermission` only accepts
 * `CRUD_ACTIONS`. Mapping happens exactly once per request so the same value
 * drives both the permission check and target resolution.
 *
 * @param operation - The wire operation from the request body.
 * @returns The equivalent CRUD action.
 */
function toCrudAction(operation: VexMutationOperation): CrudWriteAction {
  if (operation === "remove") return "delete";
  if (operation === "upsert") return "update";
  return operation;
}

/**
 * Creates a Next.js route handler that purges the cached paths affected by a
 * document write. The admin panel calls this via `useVexMutation` after every
 * successful create/update/delete, same-origin, as a relative fetch — no URL
 * config, no shared secret.
 *
 * **Session-authorized, not secret-authorized.** The caller is a signed-in
 * admin, so this reuses `getToken`/`getAuth` exactly like the admin panel route
 * does, rather than introducing an env var or a shared secret. There is no
 * API-key fallback: a caller with no browser session cannot reach this route as
 * designed.
 *
 * **Path-based, not tag-based.** `revalidatePath` is the only purge mechanism.
 * `cacheComponents: true` — required for `cacheTag`/`revalidateTag` — is
 * incompatible with the `dynamic`/`runtime` segment configs the auth and admin
 * routes require (measured: 5 files fail to build with it enabled), so
 * `revalidateTag` is not an option in this codebase. Do not "upgrade" this to
 * tag-based revalidation without first removing that segment-config dependency
 * everywhere.
 *
 * **Never fails the caller past authorization.** A missing session returns 401,
 * a session without write permission 403, and an oversized `changes` batch 413
 * — all three reject before any map work runs. Past that point the handler
 * never throws or returns 5xx: an unconfigured map, a throwing map, or an
 * individual `revalidatePath` failure all resolve to 200 with the failures
 * reported in the body. A failed purge is a stale page; failing the endpoint
 * would only teach the fire-and-forget caller to retry pointlessly.
 *
 * @param props - Config and the host app's auth accessors.
 * @returns `{ POST }` — mount directly as the route module's named export.
 *
 * @example
 * ```ts
 * // app/api/vex/revalidate/route.ts
 * import { api } from "@convex/_generated/api";
 * import { createVexRevalidateRoute } from "@vexcms/next/cache";
 * import { fetchAuthQuery, getToken } from "~/auth/server";
 * import config from "~/vex.config";
 *
 * export const { POST } = createVexRevalidateRoute({
 *   config,
 *   getToken,
 *   getAuth: () => fetchAuthQuery(api.auth.api.getUserOrg, {}),
 * });
 * ```
 */
export function createVexRevalidateRoute(props: CreateVexRevalidateRouteProps): {
  POST: (request: NextRequest) => Promise<NextResponse<{ error: string } | VexRevalidateResponse>>;
} {
  return {
    async POST(
      request: NextRequest,
    ): Promise<NextResponse<{ error: string } | VexRevalidateResponse>> {
      const token = await props.getToken();
      if (token === null || token === undefined || token === "") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      let body: VexRevalidateRequest;
      try {
        body = (await request.json()) as VexRevalidateRequest;
      } catch {
        return NextResponse.json({ error: "Bad Request" }, { status: 400 });
      }

      const { organization, user } = await props.getAuth();

      // One mapping, used for BOTH the permission check and target resolution.
      const operation: VexMutationOperation = "all" in body ? "update" : body.operation;
      const action = toCrudAction(operation);

      const allowed = hasPermission({
        access: props.config.access,
        action,
        organization,
        resource: body.collection,
        user,
        // A purge writes no document fields — this asks whether the caller
        // may act on the collection at all, not against a specific payload.
        scope: PERMISSION_SCOPES.any,
      });
      if (!allowed) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const errors: unknown[] = [];
      let changes: VexRevalidateChange[];

      if ("all" in body) {
        // Server-derived, so no client-supplied batch to bound. Each document
        // is mapped as its current state.
        if (props.listCollection === undefined) {
          errors.push(
            new Error(
              "createVexRevalidateRoute: a collection-wide purge was requested but `listCollection` is not wired",
            ),
          );
          changes = [];
        } else {
          try {
            const docs = await props.listCollection(body.collection);
            changes = docs.map((doc) => ({ after: doc }));
          } catch (error) {
            // An unreachable deployment must not 500 a purge request.
            errors.push(error);
            changes = [];
          }
        }
      } else {
        changes = body.changes;
        if (changes.length > VEX_REVALIDATE_BATCH_SIZE) {
          return NextResponse.json(
            {
              error: `Cannot revalidate more than ${VEX_REVALIDATE_BATCH_SIZE} changes in a single request`,
            },
            { status: 413 },
          );
        }
      }

      const routesConfig = props.config.routes;
      if (routesConfig === undefined) {
        // A project with no route map still gets a working, harmless
        // endpoint rather than a 500. Any error already accumulated (e.g. an
        // unwired collection-wide purge) is still reported.
        return NextResponse.json({ errors, revalidated: [] }, { status: 200 });
      }

      const pool: string[] = [];

      for (const change of changes) {
        // A throwing map is contained inside `resolveTargets` — its failure
        // lands in that call's `errors` and never propagates here.
        const target = resolveTargets({
          after: change.after,
          before: change.before,
          collection: body.collection,
          map: routesConfig.map,
          operation: action,
        });
        pool.push(...target.paths);
        errors.push(...target.errors);
      }

      // Dedupe across the whole batch, preserving first-seen order — the same
      // contract `resolveTargets` applies to one document's before/after.
      const revalidated: string[] = [];
      for (const path of new Set(pool)) {
        try {
          revalidatePath(path);
          revalidated.push(path);
        } catch (error) {
          // `revalidatePath` is a Next API called here, so it is not covered by
          // `resolveTargets`' containment.
          errors.push(error);
        }
      }

      return NextResponse.json({ errors, revalidated }, { status: 200 });
    },
  };
}
