import type { CollectionConfig } from "../collections";
import type { GlobalConfig } from "../globals";

/** An enum representing either a collection config or a global config.
 *  @example { kind: "collection"; config: CollectionConfig }
 *  @example { kind: "global"; config: GlobalConfig }
 *  @see {@link CollectionConfig}
 *  @see {@link GlobalConfig}
 */
export type CollectionOrGlobal =
  | { kind: "collection"; config: CollectionConfig }
  | { kind: "global"; config: GlobalConfig };
