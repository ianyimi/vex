import { VexSlugConflictError, VexAuthConfigError } from "../errors";
import type { VexConfig } from "../types";

// =============================================================================
// SLUG REGISTRY — tracks table slugs and validates uniqueness on register
// =============================================================================

/**
 * Where a slug was registered from.
 */
export const SLUG_SOURCES = {
  userCollection: "user-collection",
  userGlobal: "user-global",
  authTable: "auth-table",
  system: "system",
} as const;
export type SlugSource = (typeof SLUG_SOURCES)[keyof typeof SLUG_SOURCES];

/**
 * A registered slug with its source information.
 */
export interface SlugRegistration {
  slug: string;
  source: SlugSource;
  /** Human-readable description of where this slug was defined */
  location: string;
}

/**
 * Registry that collects all table slugs and validates uniqueness.
 * Throws immediately on duplicate — fail fast during schema generation.
 */
export class SlugRegistry {
  private registrations = new Map<string, SlugRegistration>();

  /**
   * Register a slug with its source.
   * Throws VexSlugConflictError immediately if the slug is already registered,
   * UNLESS an auth table slug overlaps with a user collection slug — this is
   * expected behavior indicating the user wants to customize that auth table's
   * admin UI. In that case, the user collection's registration takes precedence
   * (it was registered first as "user-collection") and the auth table is
   * silently skipped in the registry. The merge happens during schema generation.
   *
   * @param props.slug - The table slug to register
   * @param props.source - Where this slug comes from (e.g., "user-collection", "auth-table")
   * @param props.location - Human-readable location for error messages (e.g., `collection "posts"`)
   *
   * Edge cases:
   * - Auth table slug matches user collection slug: NOT a conflict — skip
   *   registration (user collection already registered, merge happens later)
   * - System table prefixed with "vex_" should not conflict with user tables
   *   because defineCollection already warns about "vex_" prefix
   */
  register(props: {
    slug: string;
    source: SlugSource;
    location: string;
  }): void {
    const existing = this.registrations.get(props.slug);
    if (existing) {
      // Auth table overlapping with user collection is expected — it means
      // the user wants to customize that auth table. The user collection
      // registration takes precedence; merge happens during schema generation.
      if (
        (existing.source === "user-collection" &&
          props.source === "auth-table") ||
        (existing.source === "auth-table" && props.source === "user-collection")
      ) {
        // Keep the user-collection registration, skip the auth-table one
        if (props.source === "user-collection") {
          this.registrations.set(props.slug, {
            slug: props.slug,
            source: props.source,
            location: props.location,
          });
        }
        return;
      }
      throw new VexSlugConflictError(
        props.slug,
        existing.source,
        existing.location,
        props.source,
        props.location,
      );
    }
    this.registrations.set(props.slug, {
      slug: props.slug,
      source: props.source,
      location: props.location,
    });
  }

  /**
   * Get all registered slugs.
   */
  getAll(): SlugRegistration[] {
    return [...this.registrations.values()];
  }
}

/**
 * Populate a SlugRegistry from a VexConfig.
 *
 * Registers slugs from:
 * 1. User collections (source: "user-collection")
 * 2. User globals (source: "user-global")
 * 3. Auth tables (source: "auth-table") — including the user table
 * 4. System tables like vex_globals (source: "system")
 *
 * Each register() call throws immediately on duplicate slug, except
 * when an auth table slug matches a user collection slug — this is
 * expected behavior indicating the user wants to customize that auth
 * table's admin UI. The merge happens during schema generation.
 *
 * Edge cases:
 * - No globals: skip global registration
 * - Auth table slug matches user collection slug: NOT a conflict —
 *   the user collection registration takes precedence, merge happens later
 */
export function buildSlugRegistry(props: { config: VexConfig }): SlugRegistry {
  const registry = new SlugRegistry();

  for (const collection of props.config.collections) {
    registry.register({
      slug: collection.slug,
      source: SLUG_SOURCES.userCollection,
      location: `Collection ${collection.slug}`,
    });
  }

  for (const global of props.config.globals) {
    registry.register({
      slug: global.slug,
      source: SLUG_SOURCES.userGlobal,
      location: `Global ${global.slug}`,
    });
  }

  for (const table of props.config.auth.tables) {
    registry.register({
      slug: table.slug,
      source: SLUG_SOURCES.authTable,
      location: `Auth Table ${table.slug}`,
    });
  }

  return registry;
}
