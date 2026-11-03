/**
 * Built-in contribution ids for G's slots (`vex.` prefix — S4). A plugin or
 * project hides one of these via `{ id: BUILTIN_CONTRIBUTION_IDS.block.duplicate, hidden: true }`
 * in the matching `admin.components` list (S9) — never by re-using the id for a
 * different component.
 */
export const BUILTIN_CONTRIBUTION_IDS = {
  block: {
    duplicate: "vex.block.duplicate",
    insertAbove: "vex.block.insertAbove",
    insertBelow: "vex.block.insertBelow",
    moveUp: "vex.block.moveUp",
    moveDown: "vex.block.moveDown",
    remove: "vex.block.remove",
    copy: "vex.block.copy",
    pasteAbove: "vex.block.pasteAbove",
    pasteBelow: "vex.block.pasteBelow",
  },
  blocksHeader: {
    copyAll: "vex.blocksHeader.copyAll",
    pasteAppend: "vex.blocksHeader.pasteAppend",
    replaceAll: "vex.blocksHeader.replaceAll",
  },
  array: {
    duplicate: "vex.array.duplicate",
    moveUp: "vex.array.moveUp",
    moveDown: "vex.array.moveDown",
    remove: "vex.array.remove",
  },
  edit: {
    save: "vex.save",
    publish: "vex.publish",
    unpublish: "vex.unpublish",
    delete: "vex.delete",
    duplicate: "vex.duplicate",
    revalidate: "vex.revalidate",
    versionHistory: "vex.versionHistory",
    livePreview: "vex.livePreview",
    cancel: "vex.cancel",
  },
  list: {
    create: "vex.list.create",
    search: "vex.list.search",
    filters: "vex.list.filters",
    columns: "vex.list.columns",
    views: "vex.list.views",
    rowOpen: "vex.list.row.open",
    rowInspect: "vex.list.row.inspect",
    rowCopyId: "vex.list.row.copyId",
    rowDelete: "vex.list.row.delete",
    bulkDelete: "vex.list.bulk.delete",
  },
} as const;
