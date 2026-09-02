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

  // Resolve the file URL from storageId before inserting
  if (f.storageId && (!f.url || f.url === "")) {
    const url = await props.ctx.storage.getUrl(f.storageId as any)
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

  const id = await props.ctx.db.insert(props.args.collectionSlug as any, result.data as any)
  return id as string
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

  if (args.query === "") {
    return await ctx.db.query(args.collectionSlug).paginate(args.paginationOpts)
  }

  return await (ctx.db.query(args.collectionSlug))
    .withSearchIndex(args.searchIndexName, (q) => q.search(args.searchField, args.query))
    .paginate(args.paginationOpts)
}
