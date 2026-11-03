export { find } from "../collections/api/find/client";
export type { FindClientArgs, FindClientPaginatedArgs } from "../collections/api/find/client";

export { get } from "../collections/api/get/client";
export type { GetClientArgs } from "../collections/api/get/client";

export { search } from "../collections/api/search/client";
export type { SearchClientArgs, SearchClientPaginatedArgs } from "../collections/api/search/client";

export { useCreate } from "../collections/api/create/client";
export type { CreateClientArgs } from "../collections/api/create/client";

export { useUpdate } from "../collections/api/update/client";
export type { UpdateClientArgs } from "../collections/api/update/client";

export { useRemove } from "../collections/api/remove/client";
export type { RemoveClientArgs } from "../collections/api/remove/client";

// VIEWS API

export { listViews, type ListViewsClientArgs } from "../collections/api/listViews/client";

export { useSaveView, type SaveViewClientArgs } from "../collections/api/saveView/client";

export { useRemoveView, type RemoveViewClientArgs } from "../collections/api/removeView/client";

export type { VexStoredView, VexViewConfig } from "@vexcms/core";

// Shared return-type contracts used by the wrappers above, re-exported from
// `@vexcms/core`.
export type {
  DocReturnItem,
  FindReturn,
  FindReturnPaginated,
  GetReturn,
  SearchReturn,
  SearchReturnPaginated,
} from "@vexcms/core";
export { findQueryKey } from "../collections/api/find/client";
export type { VexQueryOptions } from "./types";
export type { GetGlobalReturn } from "@vexcms/core";

// GLOBALS API

export { getGlobal, type GetGlobalClientArgs } from "../globals/api/get/client";

export { findGlobals } from "../globals/api/find/client";

export { useUpdateGlobal } from "../globals/api/upsert/client";

// VERSIONS API

export { useSaveDraft, type SaveDraftClientArgs } from "../versions/api/saveDraft/client";

export { usePublish, type PublishClientArgs } from "../versions/api/publish/client";

export { useUnpublish, type UnpublishClientArgs } from "../versions/api/unpublish/client";

export { listVersions, type ListVersionsClientArgs } from "../versions/api/listVersions/client";

export {
  getVersionSnapshot,
  type GetVersionSnapshotClientArgs,
} from "../versions/api/getVersionSnapshot/client";

export { useDeleteVersion } from "../versions/api/deleteVersion/client";

export type { VersionSummary } from "@vexcms/core";
export type { VersionSnapshotResult } from "@vexcms/core";
