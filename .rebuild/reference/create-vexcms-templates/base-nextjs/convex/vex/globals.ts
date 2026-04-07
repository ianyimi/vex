import type { DataModel } from "@convex/_generated/dataModel"
import type { TableNamesInDataModel } from "convex/server"

import { query } from "@convex/_generated/server"
import { getPreviewSnapshot } from "@vexcms/core"
import { v } from "convex/values"

import config from "../../vex.config"
import * as Versions from "./model/versions"

/**
 * Get the single document for a global, with draft awareness.
 *
 * - No _vexDrafts or _vexDrafts: false → returns the published document
 * - _vexDrafts: true → returns the latest version (draft or published)
 * - _vexDrafts: "snapshot" → overlays the preview snapshot on the document
 */
export const get = query({
  args: {
    globalSlug: v.string(),
    _vexDrafts: v.optional(v.union(v.literal("snapshot"), v.boolean())),
  },
  handler: async (ctx, { globalSlug, _vexDrafts }) => {
    const doc = await ctx.db
      .query(globalSlug as TableNamesInDataModel<DataModel>)
      .first()

    if (!doc) return null

    const documentId = doc._id as string

    // Check if this global has versioning enabled
    const globalDef = config.globals?.find((g) => g.slug === globalSlug)
    const isVersioned = !!globalDef?.versions?.drafts

    // If draft mode is "snapshot", overlay the preview snapshot
    if (_vexDrafts === "snapshot") {
      const snapshot = await getPreviewSnapshot<DataModel>({
        ctx,
        collection: globalSlug,
        documentId,
      })

      if (snapshot) {
        return {
          ...doc,
          ...(snapshot as Record<string, unknown>),
          _id: doc._id,
          _creationTime: doc._creationTime,
        }
      }
    }

    // If versioned and draft-aware, return the latest version's snapshot
    if (isVersioned && _vexDrafts !== false) {
      const latestVersion = await Versions.getLatestVersion<DataModel>({
        ctx,
        collection: globalSlug,
        documentId,
      })

      if (latestVersion) {
        return {
          _id: doc._id,
          ...(latestVersion.snapshot as Record<string, unknown>),
          vex_status: (latestVersion as any).status ?? (doc as any).vex_status ?? "draft",
          vex_version: latestVersion.version,
          vex_publishedAt: (doc as any).vex_publishedAt,
          _creationTime: doc._creationTime,
        }
      }

      // No versions yet — treat as published
      const raw = doc as Record<string, unknown>
      if (!raw.vex_status) {
        raw.vex_status = "published"
      }
    }

    return doc
  },
})
