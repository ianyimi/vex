import type {
  GenericDataModel,
  GenericMutationCtx,
  GenericQueryCtx,
  PaginationOptions,
  TableNamesInDataModel,
} from "convex/server"

export async function createMediaDocument<DataModel extends GenericDataModel>(props: {
  ctx: GenericMutationCtx<DataModel>
  args: {
    collectionSlug: TableNamesInDataModel<DataModel>
    fields: Record<string, unknown>
  }
}): Promise<string> {
  const id = await props.ctx.db.insert(props.args.collectionSlug as any, props.args.fields as any)
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

  return await (ctx.db.query(args.collectionSlug) as any)
    .withSearchIndex(args.searchIndexName, (q: any) => q.search(args.searchField, args.query))
    .paginate(args.paginationOpts)
}
