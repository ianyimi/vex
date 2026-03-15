import type { MigrationOp, RemovedFieldInfo, VexConfig } from "@vexcms/core";
import { logger } from "./logger.js";

export interface BackfillVersionStatusOptions {
  /** Convex deployment URL. */
  convexUrl: string;
  /** VEX config to inspect for versioned collections. */
  config: VexConfig;
}

export interface MigrateOptions {
  /** Convex deployment URL. */
  convexUrl: string;
  /** Migration operations to execute. */
  operations: MigrationOp[];
}

export interface RemovalOptions {
  /** Convex deployment URL. */
  convexUrl: string;
  /** Fields to remove from documents. */
  fields: RemovedFieldInfo[];
}

/** Timeout for each individual mutation call (30 seconds). */
const MUTATION_TIMEOUT_MS = 30_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Migration timed out after ${ms}ms`)),
      ms,
    );
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); },
    );
  });
}

async function getClient(convexUrl: string): Promise<any> {
  const convexModule = await import("convex/browser");
  return new convexModule.ConvexHttpClient(convexUrl);
}

/**
 * Execute migration operations against a Convex deployment.
 *
 * Uses the `ConvexHttpClient` to call the deployed `vex/migrate:backfillField`
 * mutation in a paginated loop until all documents are processed.
 *
 * The caller must ensure the schema is already deployed (via `pushSchema`)
 * before calling this function.
 */
export async function executeMigration(options: MigrateOptions): Promise<void> {
  const { convexUrl, operations } = options;

  let client: any;
  try {
    client = await getClient(convexUrl);
  } catch {
    logger.warn(
      "Could not import convex/browser — install `convex` to enable auto-migration",
    );
    return;
  }

  try {
    for (const op of operations) {
      let cursor: string | undefined;
      let totalPatched = 0;

      logger.info(
        `Migrating "${op.table}": setting "${op.field}" = ${JSON.stringify(op.defaultValue)}`,
      );

      try {
        do {
          const result: { patched: number; isDone: boolean; cursor: string } =
            await withTimeout(
              client.mutation("vex/migrate:backfillField" as any, {
                table: op.table,
                field: op.field,
                value: op.defaultValue,
                cursor,
              }),
              MUTATION_TIMEOUT_MS,
            );

          totalPatched += result.patched;
          cursor = result.cursor;

          if (result.isDone) break;
        } while (true);

        if (totalPatched > 0) {
          logger.success(
            `Migrated ${totalPatched} documents in "${op.table}": set "${op.field}" = ${JSON.stringify(op.defaultValue)}`,
          );
        }
      } catch (err) {
        if (
          err instanceof Error &&
          err.message.includes("Could not find")
        ) {
          logger.warn(
            `Migration function not found. Deploy convex/vex/migrate.ts to your Convex project first.`,
          );
          return;
        }
        throw err;
      }
    }
  } finally {
    client.close?.();
  }
}

/**
 * Remove fields from existing documents.
 *
 * The caller must ensure the interim schema (with removed fields as optional)
 * is already deployed (via `pushSchema`) before calling this function.
 */
export async function executeFieldRemoval(
  options: RemovalOptions,
): Promise<void> {
  const { convexUrl, fields } = options;

  let client: any;
  try {
    client = await getClient(convexUrl);
  } catch {
    logger.warn(
      "Could not import convex/browser — install `convex` to enable auto-migration",
    );
    return;
  }

  try {
    for (const { table, field } of fields) {
      let cursor: string | undefined;
      let totalPatched = 0;

      logger.info(`Removing field "${field}" from "${table}" documents`);

      try {
        do {
          const result: { patched: number; isDone: boolean; cursor: string } =
            await withTimeout(
              client.mutation("vex/migrate:removeField" as any, {
                table,
                field,
                cursor,
              }),
              MUTATION_TIMEOUT_MS,
            );

          totalPatched += result.patched;
          cursor = result.cursor;

          if (result.isDone) break;
        } while (true);

        if (totalPatched > 0) {
          logger.success(
            `Removed "${field}" from ${totalPatched} documents in "${table}"`,
          );
        }
      } catch (err) {
        if (
          err instanceof Error &&
          err.message.includes("Could not find")
        ) {
          logger.warn(
            `Migration function not found. Deploy convex/vex/migrate.ts (with removeField) to your Convex project first.`,
          );
          return;
        }
        throw err;
      }
    }
  } finally {
    client.close?.();
  }
}

/**
 * Backfill `vex_status` on existing documents in versioned collections.
 *
 * For each collection with `versions.drafts` enabled, calls
 * `vex/versions:backfillVersionStatus` which sets `vex_status: "published"`
 * on documents that don't have the field yet.
 *
 * Safe to run on every schema push — the mutation only patches documents
 * missing `vex_status`, so most runs will patch 0 documents.
 */
export async function backfillVersionStatus(
  options: BackfillVersionStatusOptions,
): Promise<void> {
  const { convexUrl, config } = options;
  const versionedSlugs = config.collections
    .filter((c) => c.versions?.drafts)
    .map((c) => c.slug);

  if (versionedSlugs.length === 0) return;

  let client: any;
  try {
    client = await getClient(convexUrl);
  } catch {
    logger.warn(
      "Could not import convex/browser — install `convex` to enable version backfill",
    );
    return;
  }

  try {
    for (const slug of versionedSlugs) {
      let cursor: string | undefined;
      let totalPatched = 0;

      try {
        do {
          const result: { patched: number; isDone: boolean; cursor: string } =
            await withTimeout(
              client.mutation("vex/versions:backfillVersionStatus" as any, {
                collectionSlug: slug,
                cursor,
              }),
              MUTATION_TIMEOUT_MS,
            );

          totalPatched += result.patched;
          cursor = result.cursor;

          if (result.isDone) break;
        } while (true);

        if (totalPatched > 0) {
          logger.success(
            `Backfilled vex_status on ${totalPatched} documents in "${slug}"`,
          );
        }
      } catch (err) {
        if (
          err instanceof Error &&
          err.message.includes("Could not find")
        ) {
          logger.warn(
            `Backfill function not found. Deploy convex/vex/versions.ts to your Convex project first.`,
          );
          return;
        }
        logger.warn(`Failed to backfill "${slug}": ${err}`);
      }
    }
  } finally {
    client.close?.();
  }
}
