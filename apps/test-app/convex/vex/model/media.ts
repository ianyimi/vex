import type {
  GenericDataModel,
  GenericMutationCtx,
  GenericQueryCtx,
  PaginationOptions,
  TableNamesInDataModel,
} from "convex/server"

import { ConvexError } from "convex/values"
import { generateFormSchema } from "@vexcms/core"
import type { VexField } from "@vexcms/core"

export async function createMediaDocument<DataModel extends GenericDataModel>(props: {
  ctx: GenericMutationCtx<DataModel>
  args: {
    collectionSlug: TableNamesInDataModel<DataModel>
    fields: Record<string, unknown>
    collectionFields: Record<string, VexField>
  }
}): Promise<string> {
  const f = { ...props.args.fields }

  // Extract system fields that bypass form schema validation
  const storageId = f.storageId
  delete f.storageId

  // Resolve the file URL from storageId before inserting
  if (storageId && (!f.url || f.url === "")) {
    const url = await props.ctx.storage.getUrl(storageId as any)
    if (url) f.url = url
  }

  const schema = generateFormSchema({
    fields: props.args.collectionFields,
  })

  const result = schema.safeParse(f)
  if (!result.success) {
    throw new ConvexError({
      message: "Validation failed",
      errors: result.error.flatten(),
    })
  }

  // Re-attach storageId for the DB insert
  const data = { ...result.data, ...(storageId ? { storageId } : {}) } as any
  const id = await props.ctx.db.insert(props.args.collectionSlug as any, data)
  return id as string
}

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

export async function paginatedSearchDocuments<DataModel extends GenericDataModel>(props: {
  args: {
    collectionSlug: TableNamesInDataModel<DataModel>
    searchIndexName: string
    searchField: string
    query: string
    paginationOpts: PaginationOptions
  }
  ctx: GenericQueryCtx<DataModel>
}) {
  const { args, ctx } = props

  let result
  if (args.query === "") {
    result = await ctx.db.query(args.collectionSlug).paginate(args.paginationOpts)
  } else {
    result = await (ctx.db.query(args.collectionSlug))
      .withSearchIndex(args.searchIndexName, (q) => q.search(args.searchField, args.query))
      .paginate(args.paginationOpts)
  }

  const resolvedPage = await Promise.all(
    result.page.map((doc: any) => resolveStorageUrl(ctx, doc)),
  )
  return { ...result, page: resolvedPage }
}
