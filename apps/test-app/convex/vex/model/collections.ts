import type {
  GenericDataModel,
  GenericQueryCtx,
  PaginationOptions,
  TableNamesInDataModel,
} from "convex/server"

export async function listDocuments<DataModel extends GenericDataModel>(props: {
  args: {
    collectionSlug: TableNamesInDataModel<DataModel>
    paginationOpts: PaginationOptions
  }
  ctx: GenericQueryCtx<DataModel>
}) {
  const { args, ctx } = props
  const docs = await ctx.db.query(args.collectionSlug).paginate(args.paginationOpts)
  return docs
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
  return docs
}
