// @vexcms/next v0.1.0-alpha.1
// Use sub-path imports to avoid mixing server and client bundles:
//   import { NextAdminPage } from "@vexcms/next/server"   ← async server component
//   import { NextAdminLayout } from "@vexcms/next/client"  ← "use client" component
export * from "./NextAdminPage";
export * from "./NextAdminLayout";
