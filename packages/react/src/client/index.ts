export { find } from "../collections/api/find/client";
export type { FindClientArgs, FindClientPaginatedArgs } from "../collections/api/find/client";

export { get } from "../collections/api/get/client";
export type { GetClientArgs } from "../collections/api/get/client";

export { search } from "../collections/api/search/client";
export type { SearchClientArgs, SearchClientPaginatedArgs } from "../collections/api/search/client";

export { create } from "../collections/api/create/client";
export type { CreateClientArgs } from "../collections/api/create/client";

export { update } from "../collections/api/update/client";
export type { UpdateClientArgs } from "../collections/api/update/client";

export { remove } from "../collections/api/remove/client";
export type { RemoveClientArgs } from "../collections/api/remove/client";

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

export { updateGlobal } from "../globals/api/upsert/client";

// VERSIONS API

export { saveDraft, type SaveDraftClientArgs } from "../versions/api/saveDraft/client";

export { publish, type PublishClientArgs } from "../versions/api/publish/client";

export { unpublish, type UnpublishClientArgs } from "../versions/api/unpublish/client";

export { listVersions, type ListVersionsClientArgs } from "../versions/api/listVersions/client";

export {
  getVersionSnapshot,
  type GetVersionSnapshotClientArgs,
} from "../versions/api/getVersionSnapshot/client";

export { deleteVersion } from "../versions/api/deleteVersion/client";

export type { VersionSummary } from "@vexcms/core";
export type { VersionSnapshotResult } from "@vexcms/core";
