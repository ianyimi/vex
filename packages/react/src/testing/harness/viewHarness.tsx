import { createElement, type ReactNode } from "react";
import type { RenderResult } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexProvider, type ConvexReactClient } from "convex/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import {
  defineConfig,
  defineGlobal,
  text,
  type VexAccessConfig,
  type VexApiAuth,
  type VexClientConfig,
} from "@vexcms/core";
import { defineMediaCollection } from "@vexcms/file-storage-convex/client";
import { useVexConfig, VexConfigProvider } from "../../context/VexConfigContext";
import { createFakeConvexClient, type ConvexTestInstance } from "../convex/bridge";
import { renderWithVexProviders, testCollection } from "./accessFixtures";

const testMediaCollection = defineMediaCollection({ slug: "images" });

/**
 * A global carries none of a media collection's storage complexity, so — unlike
 * `testMediaCollection` above — there is no reason not to use the real `defineGlobal()`.
 */
const testGlobal = defineGlobal({
  slug: "settings",
  label: "Settings",
  // Two fields for the same reason `testCollection` declares two: a per-FIELD
  // assertion needs one field to keep and another to drop. `tagline` carries a
  // declared default so create-mode behaviour is observable too.
  fields: {
    siteName: text({ required: false }),
    tagline: text({ required: false, defaultValue: "Untitled" }),
  },
});

/** Default stub client config: one `posts` collection, one `images` media collection, one global. */
export const testClientConfig: VexClientConfig = defineConfig({
  collections: [testCollection],
  mediaCollections: [testMediaCollection],
  globals: [testGlobal],
});

/** Options for {@link renderView} and {@link wrapWithViewProviders}. */
export interface ViewHarnessOptions {
  /** convex-test instance whose seeded data the view reads. */
  convex: ConvexTestInstance;
  /** Client config the view resolves collections/globals from. */
  config?: VexClientConfig;
  /** RBAC matrix to render against. Omit to leave RBAC unconfigured (every check passes). */
  access?: VexAccessConfig;
  /** The caller to render against. Defaults to `{ user: null }`. */
  auth?: VexApiAuth;
}

/**
 * Provides `props.config` to the subtree while inheriting `access` from the
 * enclosing `VexConfigProvider` (mounted by `renderWithVexProviders`), so a
 * per-scenario RBAC matrix supplied outside this wrapper still governs the
 * view rendered inside it.
 *
 * @param props - The view config to provide and the subtree that consumes it.
 * @returns The nested config provider.
 */
function ViewConfigProvider(props: { config: VexClientConfig; children: ReactNode }) {
  const outer = useVexConfig();
  return createElement(VexConfigProvider, {
    config: { ...props.config, access: outer.access },
    children: props.children,
  });
}

/**
 * Wraps `ui` in every provider a view reads OTHER than auth: a Convex client backed
 * by `options.convex` via the convex-test bridge, a `QueryClient` wired to that same client
 * (`usePaginatedQuery`/`useQuery` read through this), `NuqsTestingAdapter` (the create-document
 * and media-upload modals read URL state), and `VexConfigContext` (views resolve their live
 * collection/global config from context). The config it mounts inherits `access` from the
 * enclosing `VexConfigProvider`, so `renderWithVexProviders`'s per-scenario RBAC matrix still
 * applies.
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
        createElement(ViewConfigProvider, {
          config: options.config ?? testClientConfig,
          children: ui,
        }),
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
