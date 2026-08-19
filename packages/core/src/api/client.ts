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

// Shared return-type contracts used by the wrappers above. Also available from
// the package root (`@vexcms/core`).
export type {
  DocReturnItem,
  FindReturn,
  FindReturnPaginated,
  GetReturn,
  SearchReturn,
  SearchReturnPaginated,
  VexQueryOptions,
} from "./types";
export { findQueryKey } from "./find/client";
export type { GetGlobalReturn } from "./globals/get.server";

// GLOBALS API

export { getGlobal } from "./globals/get.client";
export type { GetGlobalClientArgs } from "./globals/get.client";

export { findGlobals } from "./globals/find.client";

export { updateGlobal } from "./globals/upsert.client";
