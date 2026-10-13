import { VexVersionStatus } from "./constants";

/** One history entry — summary only, never the full snapshot. */
export interface VersionSummary {
  /** History sequence number within `(collection, documentId)`. */
  version: number;
  /** Lifecycle state this version was recorded at. */
  status: VexVersionStatus;
  /** The user id that produced this version, or `null` when unattributed. */
  createdBy: string | null;
  /** Row creation timestamp (`_creationTime`). */
  createdAt: number;
  /** When this version was published, or `null` for a version never published. */
  publishedAt: number | null;
}
