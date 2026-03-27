import type { AdminInitialData } from "@vexcms/admin-next"
import { isMediaCollection, sanitizeConfigForClient } from "@vexcms/core"
import { anyApi } from "convex/server"

import config from "~/../vex.config"
import { fetchAuthQuery } from "~/auth/server"
import { AdminPageWrapper } from "../AdminPageWrapper"

const clientConfig = sanitizeConfigForClient(config)

const allCollections = [
  ...config.collections,
  ...(config.media?.collections ?? []),
]

interface Props {
  params: Promise<{ path?: string[] }>
}

export default async function Page({ params }: Props) {
  const { path } = await params
  const [collectionSlug, documentID] = path ?? []

  let initialData: AdminInitialData | undefined

  try {
    if (!collectionSlug) {
      // Dashboard — prefetch counts for all collections
      const counts: Record<string, number> = {}
      const results = await Promise.all(
        allCollections.map(async (c) => {
          const count = await fetchAuthQuery(
            anyApi.vex.collections.countDocuments,
            { collectionSlug: c.slug },
          )
          return { slug: c.slug, count: count as number }
        }),
      )
      for (const r of results) {
        counts[r.slug] = r.count
      }
      initialData = { counts }
    } else {
      // Check if this is a global
      const global = config.globals?.find((g) => g.slug === collectionSlug)

      if (global && !documentID) {
        // Global edit view — prefetch the global document
        const globalDoc = await fetchAuthQuery(
          anyApi.vex.globals.get,
          { globalSlug: collectionSlug },
        )
        initialData = { globalDocument: globalDoc as Record<string, unknown> | null }
      } else if (documentID) {
        // Edit view — prefetch the document
        const collection = global
          ? global
          : allCollections.find((c) => c.slug === collectionSlug)
        const isVersioned = !!collection?.versions?.drafts

        const doc = await fetchAuthQuery(
          isVersioned
            ? anyApi.vex.versions.getDocumentForEdit
            : anyApi.vex.collections.getDocument,
          {
            collectionSlug,
            documentId: documentID,
          },
        )
        initialData = { document: doc as Record<string, unknown> | null }
      } else {
        // List view — prefetch the count
        const count = await fetchAuthQuery(
          anyApi.vex.collections.countDocuments,
          { collectionSlug },
        )
        initialData = { count: count as number }
      }
    }
  } catch {
    // Auth not available or query failed — fall back to client-only fetch
    initialData = undefined
  }

  return (
    <AdminPageWrapper
      config={clientConfig}
      path={path}
      initialData={initialData}
    />
  )
}
