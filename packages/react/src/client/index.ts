export { find } from "./find/client";
export type { FindClientArgs, FindClientPaginatedArgs } from "./find/client";

export { get } from "./get/client";
export type { GetClientArgs } from "./get/client";

export { search } from "./search/client";
export type { SearchClientArgs, SearchClientPaginatedArgs } from "./search/client";

export { create } from "./create/client";
export type { CreateClientArgs } from "./create/client";

export { update } from "./update/client";
export type { UpdateClientArgs } from "./update/client";

export { remove } from "./remove/client";
export type { RemoveClientArgs } from "./remove/client";

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
export { findQueryKey } from "./find/client";
export type { VexQueryOptions } from "./types";
export type { GetGlobalReturn } from "@vexcms/core";

// GLOBALS API

export { getGlobal, type GetGlobalClientArgs } from "./globals/get.client";

export { findGlobals } from "./globals/find.client";

export { updateGlobal } from "./globals/upsert.client";

// VERSIONS API

export { saveDraft, type SaveDraftClientArgs } from "./versions/saveDraft.client";

export { publish, type PublishClientArgs } from "./versions/publish.client";

export { unpublish, type UnpublishClientArgs } from "./versions/unpublish.client";

export { listVersions, type ListVersionsClientArgs } from "./versions/listVersions.client";

export {
  getVersionSnapshot,
  type GetVersionSnapshotClientArgs,
} from "./versions/getVersionSnapshot.client";

export { deleteVersion } from "./versions/deleteVersion.client";

export type { VersionSummary } from "@vexcms/core";
export type { VersionSnapshotResult } from "@vexcms/core";
