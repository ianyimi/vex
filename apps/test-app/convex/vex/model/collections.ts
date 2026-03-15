import type {
  GenericDataModel,
  GenericMutationCtx,
  GenericQueryCtx,
  PaginationOptions,
  TableNamesInDataModel,
} from "convex/server"

import { ConvexError } from "convex/values"
import { generateFormSchema } from "@vexcms/core"
import type { VexField, CollectionKind } from "@vexcms/core"

async function resolveStorageUrl(
  ctx: { storage: { getUrl: (id: any) => Promise<string | null> } },
  doc: any,
) {
  if (doc?.storageId) {
    const url = await ctx.storage.getUrl(doc.storageId)
    if (url) return { ...doc, url }
  }
  return doc
}

export async function listDocuments<DataModel extends GenericDataModel>(props: {
  args: {
    collectionSlug: TableNamesInDataModel<DataModel>
    paginationOpts: PaginationOptions
    order?: "asc" | "desc"
  }
  ctx: GenericQueryCtx<DataModel>
}) {
  const { args, ctx } = props
  const q = args.order === "desc"
    ? ctx.db.query(args.collectionSlug).order("desc")
    : ctx.db.query(args.collectionSlug)
  const result = await q.paginate(args.paginationOpts)
  const resolvedPage = await Promise.all(
    result.page.map((doc: any) => resolveStorageUrl(ctx, doc)),
  )
  return { ...result, page: resolvedPage }
}

export async function countDocuments<DataModel extends GenericDataModel>(props: {
  ctx: GenericQueryCtx<DataModel>
  args: { collectionSlug: TableNamesInDataModel<DataModel> }
}): Promise<number> {
  return await (props.ctx.db.query(props.args.collectionSlug) as any).count()
}

export async function getDocument<DataModel extends GenericDataModel>(props: {
  ctx: GenericQueryCtx<DataModel>
  args: {
    collectionSlug: TableNamesInDataModel<DataModel>
    documentId: string
  }
}) {
  const doc = await props.ctx.db.get(props.args.documentId as any)
  return await resolveStorageUrl(props.ctx, doc)
}

export async function updateDocument<DataModel extends GenericDataModel>(props: {
  ctx: GenericMutationCtx<DataModel>
  args: {
    collectionSlug: TableNamesInDataModel<DataModel>
    documentId: string
    fields: Record<string, unknown>
    collectionFields: Record<string, VexField>
  }
}) {
  const f = { ...props.args.fields }

  // Resolve the file URL from storageId when replacing a media file
  if (f.storageId && f.url === "") {
    const url = await props.ctx.storage.getUrl(f.storageId as any)
    if (url) f.url = url
  }

  const schema = generateFormSchema({
    fields: props.args.collectionFields,
  }).partial()

  const result = schema.safeParse(f)
  if (!result.success) {
    throw new ConvexError({
      message: "Validation failed",
      errors: result.error.flatten(),
    })
  }

  await props.ctx.db.patch(props.args.documentId as any, result.data as any)
  return props.args.documentId
}

export async function createDocument<DataModel extends GenericDataModel>(props: {
  ctx: GenericMutationCtx<DataModel>
  args: {
    collectionSlug: TableNamesInDataModel<DataModel>
    fields: Record<string, unknown>
    collectionFields: Record<string, VexField>
    kind: CollectionKind
  }
}): Promise<string> {
  if (props.args.kind === "global") {
    const existing = await props.ctx.db.query(props.args.collectionSlug).first()
    if (existing) {
      throw new ConvexError(
        `Global "${props.args.collectionSlug}" already exists. Globals can only have one document.`,
      )
    }
  }

  const schema = generateFormSchema({
    fields: props.args.collectionFields,
  })

  const result = schema.safeParse(props.args.fields)
  if (!result.success) {
    throw new ConvexError({
      message: "Validation failed",
      errors: result.error.flatten(),
    })
  }

  const data = result.data as Record<string, unknown>
  // Default vex_status to "published" for all user collections
  if (!data.vex_status) {
    data.vex_status = "published"
  }
  const id = await props.ctx.db.insert(props.args.collectionSlug as any, data as any)
  return id as string
}

export async function deleteDocument<DataModel extends GenericDataModel>(props: {
  ctx: GenericMutationCtx<DataModel>
  args: {
    collectionSlug: TableNamesInDataModel<DataModel>
    documentId: string
    kind: CollectionKind
  }
}): Promise<void> {
  if (props.args.kind === "global") {
    const existing = await props.ctx.db.get(props.args.documentId as any)
    if (!existing) {
      throw new ConvexError(
        `Global "${props.args.collectionSlug}" document not found. Cannot delete a non-existent global.`,
      )
    }
  }

  await props.ctx.db.delete(props.args.documentId as any)
}

export async function bulkDeleteDocuments<DataModel extends GenericDataModel>(props: {
  ctx: GenericMutationCtx<DataModel>
  args: {
    documentIds: string[]
  }
}): Promise<{ deleted: number }> {
  for (const id of props.args.documentIds) {
    await props.ctx.db.delete(id as any)
  }
  return { deleted: props.args.documentIds.length }
}

export async function searchDocuments<DataModel extends GenericDataModel>(props: {
  args: {
    collectionSlug: TableNamesInDataModel<DataModel>
    searchIndexName: string
    searchField: string
    query: string
  }
  ctx: GenericQueryCtx<DataModel>
}) {
  const { args, ctx } = props
  const docs = await (ctx.db.query(args.collectionSlug) as any)
    .withSearchIndex(args.searchIndexName, (q: any) => q.search(args.searchField, args.query))
    .take(50)
  return Promise.all(docs.map((doc: any) => resolveStorageUrl(ctx, doc)))
}
