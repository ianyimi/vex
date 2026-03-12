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

/**
 * Thrown when media configuration is invalid.
 */
export class VexMediaConfigError extends VexError {
  constructor(detail: string) {
    super(`Media configuration error: ${detail}`);
    this.name = "VexMediaConfigError";
  }
}

/**
 * Thrown when access configuration is invalid.
 * For example: orgCollection provided without userOrgField.
 */
export class VexAccessConfigError extends VexError {
  constructor(detail: string) {
    super(`Access configuration error: ${detail}`);
    this.name = "VexAccessConfigError";
  }
}

/**
 * Thrown by `hasPermission` when `throwOnDenied` is true and the user
 * does not have permission for the requested action.
 *
 * Contains structured context about the denied access attempt so callers
 * can log, surface to users, or handle programmatically.
 */
export class VexAccessError extends VexError {
  constructor(
    public readonly resource: string,
    public readonly action: string,
    public readonly field?: string,
  ) {
    const target = field
      ? `field "${field}" on resource "${resource}"`
      : `resource "${resource}"`;
    super(`Access denied: ${action} on ${target}`);
    this.name = "VexAccessError";
  }
}
