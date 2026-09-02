# VexError System

## Overview

Establishes the VexCMS error class hierarchy, DAL result-type utilities, a Convex server-to-client error bridge, and a React error boundary component. After this spec, errors thrown anywhere in the VexCMS stack are typed, carry source metadata (package + module) for pretty console output, and can be caught either by an error boundary (full-screen fallback UI) or by an explicit `.catch()` handler (toasts or other inline feedback).

## Design Decisions

- **`VexError` as the discriminable root** — every error in the VexCMS stack extends `VexError`, which carries `package` and `module` metadata. Client code detects VexCMS errors via `"_vex" in error` or `error instanceof VexError`.
- **Start with `notFound` + `unknown`** — the registry is a plain object; adding new error types later is one entry + one class.
- **`VexDalReturn<T, E>` Result type for composable flows** — functions outside Convex (server actions, etc.) return `{ data, success: true } | { error, success: false }` and callers chain handlers. Use `vexDalThrowError()` when you want the error to propagate to a boundary, or catch manually for toasts.
- **Convex functions throw `ConvexError`, client converts with `fromConvexError()`** — keeps the clean Convex pattern (throw on error), delivers typed errors to the client.
- **Error boundary shows dev-facing UI, not user-facing UI** — `VexErrorFallback` is styled for developers debugging VexCMS configuration and data errors, not for end-users of the site being built.

## Out of Scope

- `noAccess`, `noUser`, `schemaError`, `configError` error types (added per feature)
- `noAccessRedirect`, `noUserRedirect`, `verifySuccess` redirect utilities (need noAccess/noUser types first)
- Upgrading `adminFieldToInputSchema` dispatch throw to a typed `VexConfigError` (future spec)
- Toast infrastructure and `VexErrorToast` component
- CLI-specific error types

## Target Directory Structure

```
packages/core/src/
├── errors/
│   ├── base.ts              [agent] VexError + VexErrorSource
│   ├── dal.ts               [agent] VEX_DAL_ERRORS, VexDalError, VexNotFoundError, VexUnknownError
│   └── index.ts             [agent] re-exports
├── dal/
│   ├── types.ts             [agent] VexDalReturn<T, E>
│   ├── helpers.ts           [dev]   ok(), err(), vexDalThrowError()
│   ├── convex.ts            [dev]   createConvexDalError(), fromConvexError()
│   └── index.ts             [agent] re-exports
├── convex/vex/
│   └── collections.ts       [dev]   get() throws ConvexError on null
└── index.ts                 updated — add ./errors and ./dal

packages/react/
├── package.json             add react-error-boundary dependency
└── src/
    ├── components/errors/
    │   ├── VexErrorFallback.tsx   [agent]
    │   ├── VexErrorBoundary.tsx   [agent]
    │   └── index.ts               [agent]
    └── index.ts                   updated — add error component exports
```

## Implementation Order

> **Key:**
>
> - `[agent]` — Boilerplate or pattern-following; no novel logic required
> - `[dev]` — Custom logic; developer implements this, read these to understand how the system works

1. `[agent]` **Setup** — add `react-error-boundary` to `packages/react`, run install, verify build and tests pass
2. `[agent]` **`VexError` base class** — `errors/base.ts` + tests. Foundation for all subsequent steps.
3. `[agent]` **`VexDalError` subtypes + registry** — `errors/dal.ts` + tests. Error types are now discriminable by `.type`.
4. `[dev]` **`VexDalReturn` + helpers** — `dal/types.ts` + `dal/helpers.ts` + tests. Key functions: `err()`, `vexDalThrowError()`.
5. `[dev]` **Convex bridge** — `dal/convex.ts` + tests. Key functions: `createConvexDalError()`, `fromConvexError()`.
6. `[dev]` **Update `collections.ts` `get()`** — throw `ConvexError` on null instead of returning null.
7. `[agent]` **`VexErrorFallback` + `VexErrorBoundary`** — `components/errors/`.
8. `[agent]` **Wire exports** — update both package index files, run full build + tests.

---

## Step 1 — Setup

- [ ] Add `react-error-boundary` to `dependencies` in `packages/react/package.json`
- [ ] Run `pnpm install` at the workspace root
- [ ] Run `pnpm build` — all packages build successfully
- [ ] Run `pnpm test` — all existing tests pass before any new code is added

**File: `packages/react/package.json`** (add one line inside `"dependencies"`)

```json
"react-error-boundary": "^5.0.0",
```

---

## Step 2 — `VexError` base class

- [ ] Create `packages/core/src/errors/base.ts`
- [ ] Create `packages/core/src/errors/base.test.ts`
- [ ] Run `pnpm test` in `packages/core` — new tests pass

**File: `packages/core/src/errors/base.ts`**

````typescript
/**
 * Source location metadata attached to every VexError.
 *
 * Used by `VexErrorFallback` to show which package and module originated
 * the error, and by `toString()` for formatted console output.
 */
export interface VexErrorSource {
  /** The npm package name (e.g. `"@vexcms/core"`). */
  package: string;
  /** The module path within the package (e.g. `"convex/vex/collections"`). */
  module: string;
}

/**
 * Base class for all VexCMS errors.
 *
 * Extends the native `Error` with `package` and `module` source metadata
 * and a `_vex` discriminator for runtime detection.
 *
 * All VexCMS error classes extend this. Check `"_vex" in error` to detect
 * any VexCMS error without importing the class.
 *
 * @example
 * ```ts
 * throw new VexError({
 *   message: "Something went wrong",
 *   package: "@vexcms/core",
 *   module: "convex/vex/collections",
 * });
 * // Console: [VexCMS:@vexcms/core/convex/vex/collections] VexError: Something went wrong
 *
 * @see {@link VexErrorSource} for the source metadata shape
 */
export class VexError extends Error {
  /** Discriminator present on every VexCMS error. Use `"_vex" in error` to detect. */
  readonly _vex = true as const;
  /** The npm package that threw this error (e.g. `"@vexcms/core"`). */
  readonly package: string;
  /** The module within the package that threw this error (e.g. `"convex/vex/collections"`). */
  readonly module: string;

  constructor(props: {
    /** Human-readable description of what went wrong. */
    message: string;
    /** The npm package name (e.g. `"@vexcms/core"`). */
    package: string;
    /** The module path within the package (e.g. `"convex/vex/collections"`). */
    module: string;
    /** The originating error, if any. Stored as `error.cause`. */
    cause?: unknown;
  }) {
    super(props.message, { cause: props.cause });
    this.name = "VexError";
    this.package = props.package;
    this.module = props.module;
  }

  /**
   * Returns a formatted string including the source location.
   *
   * @returns A string in the format `[VexCMS:<package>/<module>] <name>: <message>`.
   *
   * @example
   * ```ts
   * const error = new VexError({ message: "oops", package: "@vexcms/core", module: "fields" });
   * console.log(String(error));
   * // "[VexCMS:@vexcms/core/fields] VexError: oops"
   */
  override toString(): string {
    return `[VexCMS:${this.package}/${this.module}] ${this.name}: ${this.message}`;
  }
}
````

**File: `packages/core/src/errors/base.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { VexError } from "./base";

describe("VexError", () => {
  it("stores message, package, and module", () => {
    const error = new VexError({
      message: "Something went wrong",
      package: "@vexcms/core",
      module: "convex/vex/collections",
    });
    expect(error.message).toBe("Something went wrong");
    expect(error.package).toBe("@vexcms/core");
    expect(error.module).toBe("convex/vex/collections");
    expect(error.name).toBe("VexError");
  });

  it("is an instance of Error", () => {
    const error = new VexError({
      message: "test",
      package: "@vexcms/core",
      module: "test",
    });
    expect(error instanceof Error).toBe(true);
    expect(error instanceof VexError).toBe(true);
  });

  it("has _vex discriminator set to true", () => {
    const error = new VexError({
      message: "test",
      package: "@vexcms/core",
      module: "test",
    });
    expect("_vex" in error).toBe(true);
    expect(error._vex).toBe(true);
  });

  it("formats toString with source location", () => {
    const error = new VexError({
      message: "Something went wrong",
      package: "@vexcms/core",
      module: "convex/vex/collections",
    });
    expect(error.toString()).toBe(
      "[VexCMS:@vexcms/core/convex/vex/collections] VexError: Something went wrong",
    );
  });

  it("stores cause when provided", () => {
    const cause = new Error("original");
    const error = new VexError({
      message: "wrapped",
      package: "@vexcms/core",
      module: "test",
      cause,
    });
    expect(error.cause).toBe(cause);
  });
});
```

---

## Step 3 — `VexDalError` subtypes + `VEX_DAL_ERRORS` registry

- [ ] Create `packages/core/src/errors/dal.ts`
- [ ] Create `packages/core/src/errors/index.ts`
- [ ] Create `packages/core/src/errors/dal.test.ts`
- [ ] Run `pnpm test` in `packages/core` — all tests pass

**File: `packages/core/src/errors/dal.ts`**

```typescript
import { VexError } from "./base";
import type { VexErrorSource } from "./base";

/**
 * Registry of DAL error type definitions.
 *
 * Each entry provides the canonical `type` string (used as the runtime
 * discriminator on `VexDalError.type`), the error class `name`, and the
 * default `message`.
 *
 * To add a new DAL error type (e.g. `noAccess`), add an entry here and
 * create the corresponding subclass below.
 *
 * @internal
 */
export const VEX_DAL_ERRORS = {
  notFound: {
    type: "not-found" as const,
    name: "VexNotFoundError",
    message: "Resource not found",
  },
  unknown: {
    type: "unknown" as const,
    name: "VexUnknownError",
    message: "An unknown error occurred",
  },
} as const;

/** Union of all registered DAL error type strings (e.g. `"not-found" | "unknown"`). */
export type VexDalErrorType =
  (typeof VEX_DAL_ERRORS)[keyof typeof VEX_DAL_ERRORS]["type"];

/** Keys of the `VEX_DAL_ERRORS` registry (e.g. `"notFound" | "unknown"`). */
export type VexDalErrorKey = keyof typeof VEX_DAL_ERRORS;

/**
 * Base class for all DAL errors.
 *
 * Extends `VexError` with a `type` string discriminator so callers can
 * switch on `error.type` without `instanceof` checks.
 *
 * @see {@link VexNotFoundError}
 * @see {@link VexUnknownError}
 */
export class VexDalError extends VexError {
  /** Discriminator string identifying the specific DAL error kind (e.g. `"not-found"`). */
  readonly type: VexDalErrorType;

  constructor(
    props: VexErrorSource & {
      /** The DAL error type string (e.g. `"not-found"`). */
      type: VexDalErrorType;
      /** Human-readable description. Defaults to `"DAL error"`. */
      message?: string;
      /** The originating error, if any. */
      cause?: unknown;
    },
  ) {
    super({
      message: props.message ?? "DAL error",
      package: props.package,
      module: props.module,
      cause: props.cause,
    });
    this.name = "VexDalError";
    this.type = props.type;
  }
}

/**
 * Thrown when a requested resource does not exist in the database.
 *
 * @see {@link VexDalError}
 */
export class VexNotFoundError extends VexDalError {
  /** Narrowed to `"not-found"` for precise TypeScript discrimination. */
  declare readonly type: "not-found";

  constructor(
    props: VexErrorSource & {
      /** Custom message. Defaults to `"Resource not found"`. */
      message?: string;
      /** The originating error, if any. */
      cause?: unknown;
    },
  ) {
    super({
      type: "not-found",
      message: props.message ?? VEX_DAL_ERRORS.notFound.message,
      package: props.package,
      module: props.module,
      cause: props.cause,
    });
    this.name = "VexNotFoundError";
  }
}

/**
 * Thrown when an error occurs that doesn't match any registered DAL error type.
 *
 * @see {@link VexDalError}
 */
export class VexUnknownError extends VexDalError {
  /** Narrowed to `"unknown"` for precise TypeScript discrimination. */
  declare readonly type: "unknown";

  constructor(
    props: VexErrorSource & {
      /** Custom message. Defaults to `"An unknown error occurred"`. */
      message?: string;
      /** The originating error, if any. */
      cause?: unknown;
    },
  ) {
    super({
      type: "unknown",
      message: props.message ?? VEX_DAL_ERRORS.unknown.message,
      package: props.package,
      module: props.module,
      cause: props.cause,
    });
    this.name = "VexUnknownError";
  }
}
```

**File: `packages/core/src/errors/index.ts`**

```typescript
export * from "./base";
export * from "./dal";
```

**File: `packages/core/src/errors/dal.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { VexError } from "./base";
import {
  VexDalError,
  VexNotFoundError,
  VexUnknownError,
  VEX_DAL_ERRORS,
} from "./dal";

const SOURCE = { package: "@vexcms/core", module: "test" } as const;

describe("VexNotFoundError", () => {
  it("has type 'not-found'", () => {
    expect(new VexNotFoundError(SOURCE).type).toBe("not-found");
  });

  it("uses the default message from VEX_DAL_ERRORS", () => {
    expect(new VexNotFoundError(SOURCE).message).toBe(
      VEX_DAL_ERRORS.notFound.message,
    );
  });

  it("uses custom message when provided", () => {
    const error = new VexNotFoundError({
      ...SOURCE,
      message: "Post not found",
    });
    expect(error.message).toBe("Post not found");
  });

  it("has name 'VexNotFoundError'", () => {
    expect(new VexNotFoundError(SOURCE).name).toBe("VexNotFoundError");
  });

  it("is instanceof VexNotFoundError, VexDalError, VexError, and Error", () => {
    const error = new VexNotFoundError(SOURCE);
    expect(error instanceof VexNotFoundError).toBe(true);
    expect(error instanceof VexDalError).toBe(true);
    expect(error instanceof VexError).toBe(true);
    expect(error instanceof Error).toBe(true);
  });

  it("formats toString with source location", () => {
    const error = new VexNotFoundError({
      package: "@vexcms/core",
      module: "convex/vex/collections",
    });
    expect(error.toString()).toContain("@vexcms/core/convex/vex/collections");
    expect(error.toString()).toContain("VexNotFoundError");
  });

  it("stores cause when provided", () => {
    const cause = new Error("original");
    const error = new VexNotFoundError({ ...SOURCE, cause });
    expect(error.cause).toBe(cause);
  });
});

describe("VexUnknownError", () => {
  it("has type 'unknown'", () => {
    expect(new VexUnknownError(SOURCE).type).toBe("unknown");
  });

  it("uses the default message from VEX_DAL_ERRORS", () => {
    expect(new VexUnknownError(SOURCE).message).toBe(
      VEX_DAL_ERRORS.unknown.message,
    );
  });

  it("is instanceof VexDalError and VexError", () => {
    const error = new VexUnknownError(SOURCE);
    expect(error instanceof VexDalError).toBe(true);
    expect(error instanceof VexError).toBe(true);
  });
});
```

---

## Step 4 — `VexDalReturn<T, E>`, `ok()`, `err()`, `vexDalThrowError()`

- [ ] Create `packages/core/src/dal/types.ts`
- [ ] Create `packages/core/src/dal/helpers.ts`
- [ ] Create `packages/core/src/dal/helpers.test.ts`
- [ ] Run `pnpm test` in `packages/core` — all tests pass

**File: `packages/core/src/dal/types.ts`**

````typescript
import type { VexDalError } from "../errors";

/**
 * Result type for DAL functions.
 *
 * A discriminated union: either `{ data, success: true }` on success or
 * `{ error, success: false }` on failure. Construct values with `ok()` and
 * `err()`. Convert to a thrown error with `vexDalThrowError()`.
 *
 * `E` is constrained to `VexDalError` so callers can narrow the error union
 * and switch on `error.type`.
 *
 * @example
 * ```ts
 * async function fetchPost(id: string): Promise<VexDalReturn<Post, VexNotFoundError>> {
 *   const post = await db.get(id);
 *   if (!post) return err({ type: "notFound", source: { package: "@vexcms/core", module: "posts" } });
 *   return ok(post);
 * }
 *
 * @see {@link ok} for the success constructor
 * @see {@link err} for the error constructor
 * @see {@link vexDalThrowError} to convert failure to a thrown error
 */
export type VexDalReturn<T, E extends VexDalError = VexDalError> =
  | { data: T; success: true }
  | { error: E; success: false };
````

**File: `packages/core/src/dal/helpers.ts`**

````typescript
import { VexNotFoundError, VexUnknownError } from "../errors";
import type { VexDalError, VexDalErrorKey } from "../errors";
import type { VexErrorSource } from "../errors";
import type { VexDalReturn } from "./types";

/**
 * Constructs a successful `VexDalReturn` wrapping `data`.
 *
 * @param data - The success value to wrap.
 * @returns `{ data, success: true }`
 *
 * @example
 * ```ts
 * return ok(post);
 * // → { data: post, success: true }
 */
export const ok = <T>(data: T): VexDalReturn<T> => ({ data, success: true });

/**
 * Constructs a failed `VexDalReturn` containing a typed `VexDalError`.
 *
 * Creates the appropriate error subclass for `props.type` and attaches
 * the `source` metadata. Extend the switch when adding new DAL error types.
 *
 * @param props - Error construction props.
 * @param props.type - The DAL error key (e.g. `"notFound"`, `"unknown"`).
 * @param props.source - Package and module metadata attached to the error.
 * @param props.message - Optional message override. Defaults to the type's registered default.
 * @param props.cause - Optional originating error.
 * @returns `{ error: VexDalError, success: false }`
 *
 * @example
 * ```ts
 * return err({ type: "notFound", source: { package: "@vexcms/core", module: "posts" } });
 * // → { error: VexNotFoundError, success: false }
 */
export const err = (props: {
  type: VexDalErrorKey;
  source: VexErrorSource;
  message?: string;
  cause?: unknown;
}): VexDalReturn<never, VexDalError> => {
  // TODO: implement
  //
  // 1. Build a base props object with source + optional overrides:
  //    const base = { ...props.source, message: props.message, cause: props.cause }
  //
  // 2. Switch on props.type and create the correct subclass:
  //    - "notFound" → new VexNotFoundError(base)
  //    - "unknown"  → new VexUnknownError(base)
  //    When adding noAccess, schemaError etc., add a case here and import the class.
  //
  // 3. Return { success: false, error: <created error> }
  throw new Error("Not implemented");
};

/**
 * Extracts the success data from a `VexDalReturn`, or throws the error.
 *
 * Use this when you want to propagate the error to a React error boundary
 * or a wrapping `try/catch`. To show a toast instead, catch the error
 * manually rather than calling this function.
 *
 * @param props - Props.
 * @param props.dalReturn - The `VexDalReturn` to unwrap.
 * @returns The `dalReturn` narrowed to `{ data: T; success: true }`.
 * @throws {VexDalError} When `dalReturn.success` is `false`.
 *
 * @example
 * ```ts
 * const result = await fetchPost(id);
 * const { data: post } = vexDalThrowError({ dalReturn: result });
 * // post is Post — error was thrown if result was a failure
 */
export function vexDalThrowError<T, E extends VexDalError>(props: {
  dalReturn: VexDalReturn<T, E>;
}): { data: T; success: true } {
  // TODO: implement
  //
  // 1. If props.dalReturn.success is true, return props.dalReturn
  //    → TypeScript narrows it to { data: T; success: true }
  //
  // 2. Otherwise throw props.dalReturn.error
  //
  // Edge cases:
  // - The caller may want to catch and toast instead of letting it propagate —
  //   that's valid. This function is one consumption pattern, not the only one.
  throw new Error("Not implemented");
}
````

**File: `packages/core/src/dal/helpers.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { VexDalError, VexNotFoundError, VexUnknownError } from "../errors";
import { ok, err, vexDalThrowError } from "./helpers";

const SOURCE = { package: "@vexcms/core", module: "test" } as const;

describe("ok()", () => {
  it("wraps data with success: true", () => {
    const result = ok({ id: "123", title: "Post" });
    expect(result.success).toBe(true);
    if (result.success)
      expect(result.data).toEqual({ id: "123", title: "Post" });
  });

  it("works with primitive values", () => {
    const result = ok(42);
    if (result.success) expect(result.data).toBe(42);
  });
});

describe("err()", () => {
  it("returns success: false", () => {
    expect(err({ type: "notFound", source: SOURCE }).success).toBe(false);
  });

  it("creates VexNotFoundError for notFound type", () => {
    const result = err({ type: "notFound", source: SOURCE });
    if (!result.success) {
      expect(result.error instanceof VexNotFoundError).toBe(true);
      expect(result.error.type).toBe("not-found");
    }
  });

  it("creates VexUnknownError for unknown type", () => {
    const result = err({ type: "unknown", source: SOURCE });
    if (!result.success) {
      expect(result.error instanceof VexUnknownError).toBe(true);
      expect(result.error.type).toBe("unknown");
    }
  });

  it("applies custom message when provided", () => {
    const result = err({
      type: "notFound",
      source: SOURCE,
      message: "Post not found",
    });
    if (!result.success) expect(result.error.message).toBe("Post not found");
  });

  it("attaches source metadata to the error", () => {
    const result = err({
      type: "notFound",
      source: { package: "@vexcms/core", module: "posts" },
    });
    if (!result.success) {
      expect(result.error.package).toBe("@vexcms/core");
      expect(result.error.module).toBe("posts");
    }
  });
});

describe("vexDalThrowError()", () => {
  it("returns the dalReturn unchanged on success", () => {
    const dalReturn = ok("hello");
    const result = vexDalThrowError({ dalReturn });
    expect(result.success).toBe(true);
    expect(result.data).toBe("hello");
  });

  it("throws the error on failure", () => {
    const dalReturn = err({ type: "notFound", source: SOURCE });
    expect(() => vexDalThrowError({ dalReturn })).toThrow(VexDalError);
  });

  it("thrown error is the correct subtype", () => {
    const dalReturn = err({ type: "notFound", source: SOURCE });
    expect(() => vexDalThrowError({ dalReturn })).toThrow(VexNotFoundError);
  });
});
```

---

## Step 5 — Convex bridge: `createConvexDalError()` + `fromConvexError()`

- [ ] Create `packages/core/src/dal/convex.ts`
- [ ] Create `packages/core/src/dal/index.ts`
- [ ] Create `packages/core/src/dal/convex.test.ts`
- [ ] Run `pnpm test` in `packages/core` — all tests pass

**File: `packages/core/src/dal/convex.ts`**

````typescript
import { ConvexError } from "convex/values";
import { VEX_DAL_ERRORS, VexNotFoundError, VexUnknownError } from "../errors";
import type { VexDalError, VexDalErrorKey, VexDalErrorType } from "../errors";

/**
 * The serialized payload stored inside a `ConvexError` thrown by a VexCMS
 * Convex function. Created by `createConvexDalError()` and read by
 * `fromConvexError()` on the client.
 */
export interface VexConvexErrorPayload {
  /** The DAL error type string (e.g. `"not-found"`). */
  type: VexDalErrorType;
  /** The npm package that threw this error (e.g. `"@vexcms/core"`). */
  package: string;
  /** The module within the package (e.g. `"convex/vex/collections"`). */
  module: string;
  /** Human-readable error message. */
  message: string;
}

/**
 * Creates the payload object for `new ConvexError(...)` from a DAL error key.
 *
 * Use this inside Convex handler functions when you want to throw a typed
 * VexCMS error that `fromConvexError()` can convert back to a `VexDalError`
 * on the client.
 *
 * @param props - Props.
 * @param props.type - The DAL error key (e.g. `"notFound"`).
 * @param props.module - The module path within `@vexcms/core` that is throwing.
 * @param props.message - Optional message override. Defaults to the type's registered default.
 * @returns A `VexConvexErrorPayload` to pass directly to `new ConvexError(...)`.
 *
 * @example
 * ```ts
 * import { ConvexError } from "convex/values";
 * import { createConvexDalError } from "@vexcms/core";
 *
 * // Inside a Convex query handler:
 * const doc = await ctx.db.get(args.id);
 * if (!doc) {
 *   throw new ConvexError(
 *     createConvexDalError({ type: "notFound", module: "convex/vex/collections" })
 *   );
 * }
 *
 * @see {@link fromConvexError} to convert the caught error on the client
 */
export function createConvexDalError(props: {
  type: VexDalErrorKey;
  module: string;
  message?: string;
}): VexConvexErrorPayload {
  // TODO: implement
  //
  // 1. Look up the error definition: const errDef = VEX_DAL_ERRORS[props.type]
  //
  // 2. Return a VexConvexErrorPayload:
  //    {
  //      type: errDef.type,         ← the string "not-found", not the key "notFound"
  //      package: "@vexcms/core",   ← always @vexcms/core for this function
  //      module: props.module,
  //      message: props.message ?? errDef.message,
  //    }
  throw new Error("Not implemented");
}

/**
 * Converts a raw caught error from a Convex call to a typed `VexDalError`.
 *
 * Use this in React components or client utilities when catching errors from
 * `useMutation` callbacks or `fetchQuery` calls. After conversion, either
 * throw the result (propagates to the nearest error boundary) or handle it
 * for toast display.
 *
 * @param props - Props.
 * @param props.error - The raw caught error (`unknown`).
 * @param props.module - Fallback module name used when the payload doesn't include one.
 * @returns A typed `VexDalError` — the correct subclass when recognized, otherwise `VexUnknownError`.
 *
 * @example
 * ```ts
 * try {
 *   await updateMutation({ collection: "posts", id, data });
 * } catch (rawError) {
 *   const vexError = fromConvexError({ error: rawError, module: "posts/update" });
 *   if (vexError.type === "not-found") {
 *     showToast("Post was deleted — it no longer exists");
 *   } else {
 *     throw vexError; // let error boundary handle it
 *   }
 * }
 *
 * @see {@link createConvexDalError} for the server-side counterpart
 */
export function fromConvexError(props: {
  error: unknown;
  module: string;
}): VexDalError {
  // TODO: implement
  //
  // 1. If props.error is NOT a ConvexError instance:
  //    → return new VexUnknownError({ package: "@vexcms/core", module: props.module, cause: props.error })
  //
  // 2. Extract the payload: const payload = props.error.data
  //
  // 3. Guard: if payload is not a non-null object with a string `type` field:
  //    → return new VexUnknownError({ package: "@vexcms/core", module: props.module, cause: props.error })
  //
  // 4. Build source with fallbacks:
  //    const pkg = (payload as any).package ?? "@vexcms/core"
  //    const mod = (payload as any).module ?? props.module
  //    const msg = (payload as any).message as string | undefined
  //
  // 5. Switch on payload.type string:
  //    - "not-found" → return new VexNotFoundError({ package: pkg, module: mod, message: msg })
  //    - "unknown"   → return new VexUnknownError({ package: pkg, module: mod, message: msg })
  //    - default     → return new VexUnknownError({ package: "@vexcms/core", module: props.module,
  //                      message: `Unrecognized Convex error type: ${payload.type}`, cause: props.error })
  //
  // Edge cases:
  // - payload.package/module/message may be absent — use ?? fallbacks
  // - payload.type may be a string not in VEX_DAL_ERRORS — fall through to VexUnknownError
  throw new Error("Not implemented");
}
````

**File: `packages/core/src/dal/index.ts`**

```typescript
export * from "./types";
export * from "./helpers";
export * from "./convex";
```

**File: `packages/core/src/dal/convex.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { ConvexError } from "convex/values";
import { VexNotFoundError, VexUnknownError, VEX_DAL_ERRORS } from "../errors";
import { createConvexDalError, fromConvexError } from "./convex";

describe("createConvexDalError()", () => {
  it("returns the correct type string for notFound", () => {
    const payload = createConvexDalError({
      type: "notFound",
      module: "convex/vex/collections",
    });
    expect(payload.type).toBe("not-found");
  });

  it("returns the correct type string for unknown", () => {
    const payload = createConvexDalError({
      type: "unknown",
      module: "convex/vex/collections",
    });
    expect(payload.type).toBe("unknown");
  });

  it("sets package to @vexcms/core", () => {
    const payload = createConvexDalError({
      type: "notFound",
      module: "convex/vex/collections",
    });
    expect(payload.package).toBe("@vexcms/core");
  });

  it("sets module from props", () => {
    const payload = createConvexDalError({
      type: "notFound",
      module: "convex/vex/collections",
    });
    expect(payload.module).toBe("convex/vex/collections");
  });

  it("uses the default message when none is provided", () => {
    const payload = createConvexDalError({
      type: "notFound",
      module: "convex/vex/collections",
    });
    expect(payload.message).toBe(VEX_DAL_ERRORS.notFound.message);
  });

  it("uses a custom message when provided", () => {
    const payload = createConvexDalError({
      type: "notFound",
      module: "convex/vex/collections",
      message: "Post not found",
    });
    expect(payload.message).toBe("Post not found");
  });
});

describe("fromConvexError()", () => {
  it("converts a ConvexError with not-found type to VexNotFoundError", () => {
    const convexErr = new ConvexError({
      type: "not-found",
      package: "@vexcms/core",
      module: "convex/vex/collections",
      message: "Resource not found",
    });
    const result = fromConvexError({
      error: convexErr,
      module: "convex/vex/collections",
    });
    expect(result instanceof VexNotFoundError).toBe(true);
    expect(result.type).toBe("not-found");
  });

  it("converts a ConvexError with unknown type to VexUnknownError", () => {
    const convexErr = new ConvexError({
      type: "unknown",
      package: "@vexcms/core",
      module: "convex/vex/collections",
      message: "An unknown error occurred",
    });
    const result = fromConvexError({
      error: convexErr,
      module: "convex/vex/collections",
    });
    expect(result instanceof VexUnknownError).toBe(true);
  });

  it("returns VexUnknownError for a non-ConvexError", () => {
    const result = fromConvexError({
      error: new Error("network error"),
      module: "test",
    });
    expect(result instanceof VexUnknownError).toBe(true);
  });

  it("returns VexUnknownError for a ConvexError with a non-object payload", () => {
    const result = fromConvexError({
      error: new ConvexError("just a string"),
      module: "test",
    });
    expect(result instanceof VexUnknownError).toBe(true);
  });

  it("returns VexUnknownError for an unrecognized type string", () => {
    const convexErr = new ConvexError({
      type: "schema-error",
      package: "@vexcms/core",
      module: "test",
      message: "bad",
    });
    const result = fromConvexError({ error: convexErr, module: "test" });
    expect(result instanceof VexUnknownError).toBe(true);
  });

  it("preserves package and module from the ConvexError payload", () => {
    const convexErr = new ConvexError({
      type: "not-found",
      package: "@vexcms/core",
      module: "convex/vex/collections",
      message: "Specific message",
    });
    const result = fromConvexError({ error: convexErr, module: "fallback" });
    expect(result.package).toBe("@vexcms/core");
    expect(result.module).toBe("convex/vex/collections");
    expect(result.message).toBe("Specific message");
  });

  it("falls back to props.module when the payload has no module", () => {
    const convexErr = new ConvexError({
      type: "not-found",
      package: "@vexcms/core",
      message: "oops",
    });
    const result = fromConvexError({ error: convexErr, module: "my-fallback" });
    expect(result.module).toBe("my-fallback");
  });
});
```

---

## Step 6 — Update `collections.ts` `get()` to throw `ConvexError`

- [ ] Modify `packages/core/src/convex/vex/collections.ts` — update the `get` export only
- [ ] Run `pnpm build` in `packages/core` — verify build passes

No new files. The `get` query currently returns `null` when `ctx.db.get()` finds nothing. Replace it with a `ConvexError` throw so the client receives a structured, convertible error payload.

**File: `packages/core/src/convex/vex/collections.ts`** (modifications only)

Add these two imports at the top alongside the existing imports:

```typescript
import { ConvexError } from "convex/values";
import { createConvexDalError } from "../dal/convex";
```

Replace the existing `get` export:

```typescript
/**
 * Fetches a single document by Convex ID.
 *
 * Used internally by `CollectionEditView` in `@vexcms/react` via `vexConvexApi.get`.
 *
 * @param collection - Collection slug (must match a Convex table name)
 * @param id - The Convex document ID as a string
 * @returns The document.
 * @throws {ConvexError} When no document with `id` exists in `collection`.
 *   On the client, convert with `fromConvexError()` to get a `VexNotFoundError`.
 */
export const get = query({
  args: {
    collection: v.string(),
    id: v.string(),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(
      args.id as Id<TableNamesInDataModel<DataModel>>,
    );
    if (!doc) {
      throw new ConvexError(
        createConvexDalError({
          type: "notFound",
          module: "convex/vex/collections",
        }),
      );
    }
    return doc;
  },
});
```

---

## Step 7 — `VexErrorFallback` + `VexErrorBoundary`

- [ ] Create `packages/react/src/components/errors/VexErrorFallback.tsx`
- [ ] Create `packages/react/src/components/errors/VexErrorBoundary.tsx`
- [ ] Create `packages/react/src/components/errors/index.ts`
- [ ] Run `pnpm build` in `packages/react` — verify build passes

**File: `packages/react/src/components/errors/VexErrorFallback.tsx`**

````tsx
import type { FallbackProps } from "react-error-boundary";
import type { VexError } from "@vexcms/core";

/**
 * Default fallback UI rendered by `VexErrorBoundary` when a child throws.
 *
 * Shows the error name, message, and source package/module for VexCMS errors.
 * Non-VexCMS errors show a generic heading. Includes a "Try again" button
 * that calls `resetErrorBoundary` to retry rendering.
 *
 * This is a developer-facing component — it surfaces internal VexCMS errors
 * (e.g. a missing document, an unrecognized field type) so you can debug them.
 * It is not intended as a user-facing error page for the site being built.
 *
 * @param props - Props forwarded automatically by `react-error-boundary`.
 * @param props.error - The caught error.
 * @param props.resetErrorBoundary - Resets the boundary and re-renders children.
 * @returns A `<div>` with error details and a reset button.
 *
 * @example
 * ```tsx
 * // Used automatically by VexErrorBoundary — no need to pass it manually:
 * <VexErrorBoundary>
 *   <CollectionEditView ... />
 * </VexErrorBoundary>
 *
 * // Use directly with react-error-boundary for custom wrappers:
 * <ErrorBoundary fallbackRender={VexErrorFallback}>
 *   {children}
 * </ErrorBoundary>
 *
 * @see {@link VexErrorBoundary}
 */
export function VexErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const isVexError = "_vex" in error;
  const vexError = isVexError ? (error as unknown as VexError) : null;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-destructive/50 bg-destructive/5 p-6 text-sm">
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-destructive">
          {vexError ? vexError.name : "Something went wrong"}
        </p>
        <p className="text-muted-foreground">{error.message}</p>
        {vexError && (
          <p className="font-mono text-xs text-muted-foreground/70">
            {vexError.package}/{vexError.module}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={resetErrorBoundary}
        className="w-fit rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
      >
        Try again
      </button>
    </div>
  );
}
````

**File: `packages/react/src/components/errors/VexErrorBoundary.tsx`**

````tsx
"use client";

import { ErrorBoundary } from "react-error-boundary";
import type { ReactNode } from "react";
import { VexErrorFallback } from "./VexErrorFallback";

/**
 * Error boundary for VexCMS admin views.
 *
 * Wraps `ErrorBoundary` from `react-error-boundary` with `VexErrorFallback`
 * as the default fallback renderer. Place this around view components that
 * use Convex queries — when a query throws (e.g. `get()` on a missing document),
 * the boundary catches it and renders `VexErrorFallback` instead of crashing
 * the page.
 *
 * @param props - Props.
 * @param props.children - Content to render. On error, replaced by `VexErrorFallback`.
 * @param props.onReset - Optional callback fired when `resetErrorBoundary` is called
 *   (e.g. use `router.refresh()` to refetch after a transient error).
 * @returns An `ErrorBoundary` wrapping `children` with `VexErrorFallback`.
 *
 * @example
 * ```tsx
 * // In a Next.js page — wrap the view so document-not-found errors show fallback UI:
 * <VexErrorBoundary>
 *   <CollectionEditView ... />
 * </VexErrorBoundary>
 *
 * // With a reset callback to refetch after "Try again":
 * <VexErrorBoundary onReset={() => router.refresh()}>
 *   <CollectionListView ... />
 * </VexErrorBoundary>
 *
 * @see {@link VexErrorFallback} for the default fallback component
 */
export function VexErrorBoundary(props: {
  children: ReactNode;
  onReset?: () => void;
}) {
  return (
    <ErrorBoundary fallbackRender={VexErrorFallback} onReset={props.onReset}>
      {props.children}
    </ErrorBoundary>
  );
}
````

**File: `packages/react/src/components/errors/index.ts`**

```typescript
export { VexErrorFallback } from "./VexErrorFallback";
export { VexErrorBoundary } from "./VexErrorBoundary";
```

---

## Step 8 — Wire exports

- [ ] Add `./errors` and `./dal` to `packages/core/src/index.ts`
- [ ] Add error component exports to `packages/react/src/index.ts`
- [ ] Run `pnpm build` — all packages build successfully
- [ ] Run `pnpm test` — all tests pass across the monorepo

**File: `packages/core/src/index.ts`** (add section at the bottom)

```typescript
// ============================================================================
// ERRORS & DAL
// ============================================================================

export * from "./errors";
export * from "./dal";
```

**File: `packages/react/src/index.ts`** (add one line)

```typescript
export { VexErrorBoundary, VexErrorFallback } from "./components/errors";
```

---

## Verification

**Every spec MUST include this section. The implementer MUST run these commands and fix any failures before considering the spec complete.**

- [ ] `pnpm build` — `@vexcms/core` and `@vexcms/react` build successfully
- [ ] `pnpm test` — all tests pass across the entire monorepo
- [ ] Manually verify: wrap a component that throws `new VexNotFoundError({ package: "@vexcms/core", module: "test" })` in `<VexErrorBoundary>` — confirm `VexErrorFallback` renders with the correct name, message, and source path
- [ ] Manually verify: navigate to a collection edit view with a non-existent document ID — confirm the error boundary catches the `ConvexError` thrown by `get()` and renders the fallback
- [ ] Fix any type errors introduced by your changes

---

## Success Criteria

- [ ] `VexError` base class with `package`/`module` metadata and formatted `toString()`
- [ ] `VexNotFoundError` and `VexUnknownError` extend `VexDalError` and discriminate via `.type`
- [ ] `ok()` and `err()` construct `VexDalReturn<T>` values with correct types
- [ ] `vexDalThrowError()` propagates errors to the nearest boundary, passes through successes
- [ ] `createConvexDalError()` produces the correct payload for `new ConvexError(...)`
- [ ] `fromConvexError()` converts a `ConvexError` to the correct `VexDalError` subclass
- [ ] `collections.ts` `get()` throws `ConvexError` on null instead of returning null
- [ ] `VexErrorBoundary` and `VexErrorFallback` are exported from `@vexcms/react`
- [ ] All unit tests pass
