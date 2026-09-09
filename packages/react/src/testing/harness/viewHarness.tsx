import { createElement, type ReactNode } from "react";
import type { RenderResult } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexProvider, type ConvexReactClient } from "convex/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import {
  defineGlobal,
  text,
  type ClientVexConfig,
  type MediaCollectionConfig,
  type VexAccessConfig,
  type VexApiAuth,
} from "@vexcms/core";
import { VexConfigContext } from "../../context/VexConfigContext";
import { createFakeConvexClient, type ConvexTestInstance } from "../convex/bridge";
import { renderWithVexProviders, testCollection } from "./accessFixtures";

/**
 * Hand-built the same way `fieldInputContract.ts`'s and `nestedFieldContainer.ts`'s own
 * stub media collections are: a media collection is never produced by a public builder
 * function (in production it is derived from a regular collection's storage config by
 * `validateAndMergeStorageConfig`, which needs a real registered storage adapter this test
 * kit does not stand up), so the shape is authored directly.
 */
const testMediaCollection = {
  slug: "images",
  fields: { alt: text({ required: false }) },
  labels: { singular: "Image", plural: "Images" },
  admin: {
    useAsTitle: "_id",
    components: {},
    table: { defaultPageSize: 10, serverPageSize: 100 },
  },
  meta: { storageAdapter: "convex" },
} as unknown as MediaCollectionConfig;

/**
 * A global carries none of a media collection's storage complexity, so — unlike
 * `testMediaCollection` above — there is no reason not to use the real `defineGlobal()`.
 */
const testGlobal = defineGlobal({
  slug: "settings",
  label: "Settings",
  fields: { siteName: text({ required: false }) },
});

/** Default stub client config: one `posts` collection, one `images` media collection, one global. */
export const testClientConfig: ClientVexConfig = {
  basePath: "/admin",
  admin: { sidebar: { side: "left", collapsible: "offcanvas" } },
  collections: [testCollection],
  mediaCollections: [testMediaCollection],
  globals: [testGlobal],
  schema: { outputPath: "/convex/vex.schema.ts" },
  types: { outputPath: "/src/vex.types.ts" },
  // `ClientVexConfig` is `defineConfig()`'s sanitized (function-stripped) output shape, built
  // directly here rather than round-tripped through `sanitizeConfigForClient(defineConfig())`
  // — `defineConfig()` derives `mediaCollections` from a real registered storage adapter via
  // `validateAndMergeStorageConfig`, which is real backend wiring this test kit does not stand
  // up. Mirrors the established `stubClientConfig` cast in `fieldInputContract.ts`/
  // `nestedFieldContainer.ts`.
} as unknown as ClientVexConfig;

/** Options for {@link renderView} and {@link wrapWithViewProviders}. */
export interface ViewHarnessOptions {
  /** convex-test instance whose seeded data the view reads. */
  convex: ConvexTestInstance;
  /** Client config the view resolves collections/globals from. */
  config?: ClientVexConfig;
  /** RBAC matrix to render against. Omit to leave RBAC unconfigured (every check passes). */
  access?: VexAccessConfig;
  /** The caller to render against. Defaults to `{ user: null }`. */
  auth?: VexApiAuth;
}

/**
 * Wraps `ui` in every provider a view reads OTHER than access/auth: a Convex client backed
 * by `options.convex` via the convex-test bridge, a `QueryClient` wired to that same client
 * (`usePaginatedQuery`/`useQuery` read through this), `NuqsTestingAdapter` (the create-document
 * and media-upload modals read URL state), and `VexConfigContext` (views resolve their live
 * collection/global config from context, falling back to their RSC-serialized prop).
 *
 * Split out from {@link renderView} so `runRbacStateSuite`'s `render` callback — which must
 * return a `ReactNode`, not call `render()` itself — can wrap a view in exactly these
 * providers while `runRbacStateSuite`'s own `renderWithVexProviders` call supplies the
 * per-scenario access/auth pair around it.
 *
 * @param ui - The view tree to wrap.
 * @param options - The convex-test instance and optional config override.
 * @returns `ui` wrapped in the Convex/QueryClient/nuqs/VexConfigContext provider stack.
 */
export function wrapWithViewProviders(
  ui: ReactNode,
  options: Pick<ViewHarnessOptions, "convex" | "config">,
): ReactNode {
  const fakeClient = createFakeConvexClient(options.convex) as ConvexReactClient;
  const convexQueryClient = new ConvexQueryClient(fakeClient);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { queryFn: convexQueryClient.queryFn(), retry: false } },
  });
  return createElement(
    ConvexProvider,
    { client: fakeClient },
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(
        NuqsTestingAdapter,
        null,
        createElement(VexConfigContext.Provider, { value: options.config ?? testClientConfig }, ui),
      ),
    ),
  );
}

/**
 * Mounts a view with every provider it reads: ConvexProvider + QueryClientProvider
 * (wired to the convex bridge), NuqsTestingAdapter, VexConfigContext, and the
 * VexAccess/VexAuth pair. Composes `renderWithVexProviders`; does not duplicate it.
 *
 * @param ui - The view tree to render.
 * @param options - Convex-test instance, plus optional config/access/auth overrides.
 * @returns The `@testing-library/react` render result.
 */
export function renderView(ui: ReactNode, options: ViewHarnessOptions): RenderResult {
  return renderWithVexProviders(wrapWithViewProviders(ui, options), {
    access: options.access,
    auth: options.auth,
  });
}
