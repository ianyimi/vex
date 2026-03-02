import type { AuthFieldDefinition, AuthTableDefinition } from "@vexcms/core";

/**
 * Table slug configuration extracted from BetterAuthOptions.
 * Each value comes from `config.<table>?.modelName ?? "<default>"`.
 */
export interface TableSlugs {
  userSlug: string;
  sessionSlug: string;
  accountSlug: string;
  verificationSlug: string;
}

/**
 * Return type of resolvePluginContributions().
 * Contains the merged user fields and tables after applying all plugin contributions.
 */
export interface ResolvedContributions {
  userFields: Record<string, AuthFieldDefinition>;
  tables: AuthTableDefinition[];
}
