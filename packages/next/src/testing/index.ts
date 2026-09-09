// Re-exports the full public surface of `@vexcms/react/testing` so Next.js
// consumers can import the entire VexCMS test kit from `@vexcms/next`
// without also depending on `@vexcms/react` directly. A wildcard re-export
// (rather than an enumerated list) keeps this file in sync automatically as
// `@vexcms/react/testing`'s own surface grows.
export * from "@vexcms/react/testing";
