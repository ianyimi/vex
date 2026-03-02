/**
 * Base error class for all Vex CMS errors.
 * Provides consistent error formatting with a [vex] prefix.
 */
export class VexError extends Error {
  constructor(message: string) {
    super(`[vex] ${message}`);
    this.name = "VexError";
  }
}

/**
 * Thrown when a duplicate table slug is detected during schema generation.
 * Includes both registrations so the user can identify the conflict.
 */
export class VexSlugConflictError extends VexError {
  constructor(
    public readonly slug: string,
    public readonly existingSource: string,
    public readonly existingLocation: string,
    public readonly newSource: string,
    public readonly newLocation: string,
  ) {
    super(
      `Duplicate table slug "${slug}":\n` +
      `  - ${existingSource}: ${existingLocation}\n` +
      `  - ${newSource}: ${newLocation}\n` +
      `Rename one of these to resolve the conflict.`,
    );
    this.name = "VexSlugConflictError";
  }
}

/**
 * Thrown when a field fails validation during schema generation.
 * For example: required field with no defaultValue, or wrong defaultValue type.
 */
export class VexFieldValidationError extends VexError {
  constructor(
    public readonly collectionSlug: string,
    public readonly fieldName: string,
    public readonly detail: string,
  ) {
    super(`Field "${fieldName}" in collection "${collectionSlug}": ${detail}`);
    this.name = "VexFieldValidationError";
  }
}

/**
 * Thrown when auth configuration is invalid.
 * For example: userCollection not found in collections.
 */
export class VexAuthConfigError extends VexError {
  constructor(detail: string) {
    super(`Auth configuration error: ${detail}`);
    this.name = "VexAuthConfigError";
  }
}
