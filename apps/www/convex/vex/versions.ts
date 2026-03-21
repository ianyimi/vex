import type { DataModel } from "@convex/_generated/dataModel"
import type { GenericQueryCtx, TableNamesInDataModel } from "convex/server"

import { mutation, query } from "@convex/_generated/server"
import {
  hasPermission,
  extractUserFields,
  DEFAULT_MAX_VERSIONS_PER_DOC,
} from "@vexcms/core"
import { ConvexError, v } from "convex/values"

import { TABLE_SLUG_USERS } from "~/db/constants"

import config from "../../vex.config"
import { access } from "../../src/vexcms/access"
import * as Versions from "./model/versions"

function requireVersionedCollection(slug: string) {
  const collections = [...config.collections, ...(config.media?.collections ?? [])]
  const match = collections.find((c) => c.slug === slug)
  if (!match) {
    throw new ConvexError(`Collection not found: ${slug}`)
  }
  if (!match.versions?.drafts) {
    throw new ConvexError(`Collection "${slug}" does not have versioning enabled`)
  }
  return match
}

async function getUser(ctx: GenericQueryCtx<DataModel>) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity?.email) return null
  const user = await ctx.db
    .query(TABLE_SLUG_USERS)
    .withIndex("by_email", (q) => q.eq("email", identity.email!))
    .first()
  if (!user) return null
  return {
    user: user as Record<string, unknown>,
    roles: (user.role as string[]) ?? [],
    email: identity.email,
  }
}

async function requireUser(ctx: GenericQueryCtx<DataModel>) {
  const result = await getUser(ctx)
  if (!result) throw new ConvexError("Not authenticated")
  return result
}

function checkPermission(props: Parameters<typeof hasPermission>[0]) {
  const result = hasPermission(props)
  const denied =
    result === false ||
    (typeof result === "object" && !Object.values(result).some(Boolean))
  if (denied) {
    throw new ConvexError(`Access denied: "${props.action}" on "${props.resource}"`)
  }
  return result
}

/**
 * Creates a new document in a versioned collection.
 * The document starts with vex_status: "draft" and an initial version is created.
 */
export const createDraftDocument = mutation({
  args: {
    collectionSlug: v.string(),
    fields: v.any(),
  },
  handler: async (ctx, { collectionSlug, fields }) => {
    const collection = requireVersionedCollection(collectionSlug)
    const { user, roles, email } = await requireUser(ctx)

    checkPermission({
      access,
      user,
      userRoles: roles,
      resource: collectionSlug,
      action: "create",
      data: fields as Record<string, unknown>,
    })

    const validatedFields = fields as Record<string, unknown>

    const tableName = (collection.tableName ?? collectionSlug) as TableNamesInDataModel<DataModel>
    const newDocId = await (ctx.db as any).insert(tableName, {
      ...validatedFields,
      vex_status: "draft",
      vex_version: 1,
      vex_publishedAt: undefined,
    })

    await Versions.createVersion<DataModel>({
      ctx,
      collection: collectionSlug,
      documentId: newDocId as string,
      snapshot: validatedFields,
      status: "draft",
      createdBy: email,
    })

    return { documentId: newDocId as string, version: 1 }
  },
})

/**
 * Saves a draft version without publishing.
 * Creates a new version record in vex_versions.
 * Does NOT update the main document's content fields.
 */
export const saveDraft = mutation({
  args: {
    collectionSlug: v.string(),
    documentId: v.string(),
    fields: v.any(),
    restoredFrom: v.optional(v.number()),
  },
  handler: async (ctx, { collectionSlug, documentId, fields, restoredFrom }) => {
    const collection = requireVersionedCollection(collectionSlug)
    const { user, roles, email } = await requireUser(ctx)

    checkPermission({
      access,
      user,
      userRoles: roles,
      resource: collectionSlug,
      action: "update",
      data: fields as Record<string, unknown>,
    })

    const doc = await ctx.db.get(documentId as any)
    if (!doc) throw new ConvexError("Document not found")

    // If no versions exist yet, snapshot the current main doc as v1 published
    // (preserves the original state before any edits)
    const latestVersion = await Versions.getLatestVersion<DataModel>({
      ctx,
      collection: collectionSlug,
      documentId,
    })
    if (!latestVersion) {
      const originalSnapshot = extractUserFields({
        document: doc as Record<string, unknown>,
      })
      await Versions.createVersion<DataModel>({
        ctx,
        collection: collectionSlug,
        documentId,
        snapshot: originalSnapshot,
        status: "published",
        createdBy: null,
      })
    }

    // The frontend sends ALL field values as a complete snapshot
    const snapshot = fields as Record<string, unknown>

    const { version } = await Versions.createVersion<DataModel>({
      ctx,
      collection: collectionSlug,
      documentId,
      snapshot,
      status: "draft",
      createdBy: email,
      restoredFrom,
    })

    await Versions.cleanupOldVersions<DataModel>({
      ctx,
      collection: collectionSlug,
      documentId,
      maxPerDoc: collection.versions?.maxPerDoc ?? DEFAULT_MAX_VERSIONS_PER_DOC,
    })

    return { version }
  },
})

/**
 * Publishes the latest draft version.
 * Copies the latest version's snapshot to the main document's fields,
 * sets vex_status to "published", and creates a published version record.
 */
export const publish = mutation({
  args: {
    collectionSlug: v.string(),
    documentId: v.string(),
    fields: v.optional(v.any()),
  },
  handler: async (ctx, { collectionSlug, documentId, fields }) => {
    const collection = requireVersionedCollection(collectionSlug)
    const { user, roles, email } = await requireUser(ctx)

    checkPermission({
      access,
      user,
      userRoles: roles,
      resource: collectionSlug,
      action: "update",
    })

    const doc = await ctx.db.get(documentId as any)
    if (!doc) throw new ConvexError("Document not found")

    // Check if this document has any version history yet
    const latestVersion = await Versions.getLatestVersion<DataModel>({
      ctx,
      collection: collectionSlug,
      documentId,
    })

    // If no versions exist, snapshot the current main doc as v1 published
    // (preserves the original state before any edits)
    if (!latestVersion) {
      const originalSnapshot = extractUserFields({
        document: doc as Record<string, unknown>,
      })
      await Versions.createVersion<DataModel>({
        ctx,
        collection: collectionSlug,
        documentId,
        snapshot: originalSnapshot,
        status: "published",
        createdBy: null,
      })
    }

    let snapshot: Record<string, unknown>

    if (fields) {
      snapshot = fields as Record<string, unknown>
    } else if (latestVersion) {
      snapshot = latestVersion.snapshot as Record<string, unknown>
    } else {
      // No fields provided and no prior versions — republish current doc as-is
      snapshot = extractUserFields({
        document: doc as Record<string, unknown>,
      })
    }

    // If the latest version is already published with the same snapshot,
    // don't create a duplicate — just ensure the main doc is up to date
    if (
      latestVersion &&
      (latestVersion as any).status === "published" &&
      JSON.stringify((latestVersion as any).snapshot) === JSON.stringify(snapshot)
    ) {
      const existingVersion = (latestVersion as any).version as number
      // Ensure main doc reflects published state
      if ((doc as any).vex_status !== "published") {
        await (ctx.db as any).patch(documentId as any, {
          vex_status: "published",
          vex_publishedAt: Date.now(),
          vex_version: existingVersion,
        })
      }
      return { version: existingVersion }
    }

    // If the latest version is a draft with the same snapshot, promote it
    // to published instead of creating a new version entry
    if (
      latestVersion &&
      (latestVersion as any).status === "draft" &&
      JSON.stringify((latestVersion as any).snapshot) === JSON.stringify(snapshot)
    ) {
      const existingVersion = (latestVersion as any).version as number
      await (ctx.db as any).patch((latestVersion as any)._id, {
        status: "published",
        createdAt: Date.now(),
      })
      await (ctx.db as any).patch(documentId as any, {
        ...snapshot,
        vex_status: "published",
        vex_publishedAt: Date.now(),
        vex_version: existingVersion,
      })
      return { version: existingVersion }
    }

    // Create a new published version record
    const { version } = await Versions.createVersion<DataModel>({
      ctx,
      collection: collectionSlug,
      documentId,
      snapshot,
      status: "published",
      createdBy: email,
    })

    // Update the main document
    await (ctx.db as any).patch(documentId as any, {
      ...snapshot,
      vex_status: "published",
      vex_publishedAt: Date.now(),
      vex_version: version,
    })

    await Versions.cleanupOldVersions<DataModel>({
      ctx,
      collection: collectionSlug,
      documentId,
      maxPerDoc: collection.versions?.maxPerDoc ?? DEFAULT_MAX_VERSIONS_PER_DOC,
    })

    return { version }
  },
})

/**
 * Unpublishes a document by setting vex_status back to "draft".
 */
export const unpublish = mutation({
  args: {
    collectionSlug: v.string(),
    documentId: v.string(),
  },
  handler: async (ctx, { collectionSlug, documentId }) => {
    requireVersionedCollection(collectionSlug)
    const { user, roles, email } = await requireUser(ctx)

    checkPermission({
      access,
      user,
      userRoles: roles,
      resource: collectionSlug,
      action: "update",
    })

    const doc = await ctx.db.get(documentId as any)
    if (!doc) throw new ConvexError("Document not found")

    if ((doc as any).vex_status !== "published") {
      throw new ConvexError("Document is not published")
    }

    // Patch the main document status back to draft
    await (ctx.db as any).patch(documentId as any, {
      vex_status: "draft",
    })

    // Patch the latest published version back to draft instead of creating a new one
    const latestVersion = await Versions.getLatestVersion<DataModel>({
      ctx,
      collection: collectionSlug,
      documentId,
    })

    if (latestVersion && (latestVersion as any).status === "published") {
      await (ctx.db as any).patch((latestVersion as any)._id, {
        status: "draft",
      })
    }

    return { version: (latestVersion as any)?.version ?? 0 }
  },
})

/**
 * Autosave — coalesces into a single autosave version record.
 */
export const autosave = mutation({
  args: {
    collectionSlug: v.string(),
    documentId: v.string(),
    fields: v.any(),
  },
  handler: async (ctx, { collectionSlug, documentId, fields }) => {
    requireVersionedCollection(collectionSlug)
    const { user, roles, email } = await requireUser(ctx)

    checkPermission({
      access,
      user,
      userRoles: roles,
      resource: collectionSlug,
      action: "update",
    })

    const doc = await ctx.db.get(documentId as any)
    if (!doc) throw new ConvexError("Document not found")

    const validatedFields = fields as Record<string, unknown>

    // Get latest version to merge snapshot
    const latestVersion = await Versions.getLatestVersion<DataModel>({
      ctx,
      collection: collectionSlug,
      documentId,
    })

    const mergedSnapshot = {
      ...((latestVersion?.snapshot as Record<string, unknown>) ?? {}),
      ...validatedFields,
    }

    const { version } = await Versions.coalesceAutosave<DataModel>({
      ctx,
      collection: collectionSlug,
      documentId,
      snapshot: mergedSnapshot,
      createdBy: email,
    })

    return { version }
  },
})

/**
 * Gets a version's snapshot for restoring into the edit form.
 * Does NOT create a new version — the user must explicitly save
 * after reviewing the restored values in the form.
 */
export const getVersionSnapshot = query({
  args: {
    collectionSlug: v.string(),
    documentId: v.string(),
    version: v.number(),
  },
  handler: async (ctx, { collectionSlug, documentId, version: versionNum }) => {
    requireVersionedCollection(collectionSlug)

    const targetVersion = await Versions.getVersion<DataModel>({
      ctx,
      collection: collectionSlug,
      documentId,
      version: versionNum,
    })
    if (!targetVersion) throw new ConvexError("Version not found")

    return {
      version: targetVersion.version as number,
      snapshot: targetVersion.snapshot as Record<string, unknown>,
    }
  },
})

/**
 * Permanently deletes a specific version record.
 */
export const deleteVersion = mutation({
  args: {
    collectionSlug: v.string(),
    documentId: v.string(),
    version: v.number(),
  },
  handler: async (ctx, { collectionSlug, documentId, version: versionNum }) => {
    requireVersionedCollection(collectionSlug)
    const { user, roles } = await requireUser(ctx)

    checkPermission({
      access,
      user,
      userRoles: roles,
      resource: collectionSlug,
      action: "update",
    })

    const targetVersion = await Versions.getVersion<DataModel>({
      ctx,
      collection: collectionSlug,
      documentId,
      version: versionNum,
    })
    if (!targetVersion) throw new ConvexError("Version not found")

    await (ctx.db as any).delete(targetVersion._id)

    return { deleted: versionNum }
  },
})

/**
 * Lists version history for a document.
 */
export const listVersions = query({
  args: {
    collectionSlug: v.string(),
    documentId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { collectionSlug, documentId, limit }) => {
    requireVersionedCollection(collectionSlug)

    return await Versions.listVersions<DataModel>({
      ctx,
      collection: collectionSlug,
      documentId,
      limit,
    })
  },
})

/**
 * Gets the document content for the admin edit view.
 * Returns the latest version's snapshot if versions exist,
 * otherwise falls back to the main document's fields.
 */
export const getDocumentForEdit = query({
  args: {
    collectionSlug: v.string(),
    documentId: v.string(),
  },
  handler: async (ctx, { collectionSlug, documentId }) => {
    requireVersionedCollection(collectionSlug)

    const mainDoc = await ctx.db.get(documentId as any)
    if (!mainDoc) return null

    const latestVersion = await Versions.getLatestVersion<DataModel>({
      ctx,
      collection: collectionSlug,
      documentId,
    })

    if (latestVersion) {
      return {
        _id: mainDoc._id,
        ...(latestVersion.snapshot as Record<string, unknown>),
        // Use the latest version's status, not the main doc's — the main doc
        // only updates on publish, but the latest version may be a draft
        vex_status: (latestVersion as any).status ?? (mainDoc as any).vex_status ?? "draft",
        vex_version: latestVersion.version,
        vex_publishedAt: (mainDoc as any).vex_publishedAt,
        _creationTime: mainDoc._creationTime,
      }
    }

    // Fallback: return main doc as-is (e.g., versioning just enabled on existing collection)
    // Pre-existing documents without vex_status are treated as published
    const doc = mainDoc as Record<string, unknown>
    if (!doc.vex_status) {
      doc.vex_status = "published"
    }
    return doc
  },
})

/**
 * Backfills vex_status on existing documents in a versioned collection
 * that don't have the field yet (e.g. versioning was just enabled on
 * a collection with existing data, or VEX was added to an existing project).
 *
 * Only sets vex_status to "published" — does NOT create version records.
 * Version records are created lazily on first saveDraft or publish, which
 * avoids doubling the collection data in one go.
 *
 * Called by the VEX CLI in a paginated loop (cursor-based) so it can
 * handle production tables with thousands of documents without hitting
 * Convex mutation limits.
 *
 * Safe to run repeatedly — skips documents that already have vex_status.
 */
export const backfillVersionStatus = mutation({
  args: {
    collectionSlug: v.string(),
    cursor: v.optional(v.string()),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, { collectionSlug, cursor, batchSize = 100 }) => {
    const collection = requireVersionedCollection(collectionSlug)

    // No auth check — this is a system migration called by the VEX CLI,
    // not a user-facing action. The ConvexHttpClient has no auth session.

    const tableName = (collection.tableName ?? collectionSlug) as TableNamesInDataModel<DataModel>
    const results = await (ctx.db as any)
      .query(tableName)
      .paginate({ cursor: cursor ?? null, numItems: batchSize })

    let patched = 0
    for (const doc of results.page) {
      if (!doc.vex_status) {
        await (ctx.db as any).patch(doc._id, {
          vex_status: "published",
        })
        patched++
      }
    }

    return {
      patched,
      isDone: results.isDone,
      cursor: results.continueCursor,
    }
  },
})
