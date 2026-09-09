// vitest's setupFiles resolver does not honor package.json `exports` subpaths
// for symlinked workspace packages the way its normal module-transform
// pipeline does (importing "@vexcms/next/testing" from a test file itself
// resolves fine); routing through a same-project relative file sidesteps
// that gap while still running the exact same import-time side effect.
export * from "@vexcms/next/testing";
