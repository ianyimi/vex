import type {
  GenericDataModel,
  GenericMutationCtx,
  GenericQueryCtx,
  PaginationOptions,
  TableNamesInDataModel,
} from "convex/server"

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
  const docs = await q.paginate(args.paginationOpts)
  return docs
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
  return await props.ctx.db.get(props.args.documentId as any)
}

export async function updateDocument<DataModel extends GenericDataModel>(props: {
  ctx: GenericMutationCtx<DataModel>
  args: {
    collectionSlug: TableNamesInDataModel<DataModel>
    documentId: string
    fields: Record<string, unknown>
  }
}) {
  await props.ctx.db.patch(props.args.documentId as any, props.args.fields as any)
  return props.args.documentId
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
