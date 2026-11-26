import type { ReactNode } from "react"

import { render } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// `~/env.mjs` throws at import time when `NEXT_PUBLIC_CONVEX_URL`/etc. aren't
// set (real `createEnv()` validation) — mocked the same way
// `components/providers/convex.test.tsx` mocks it.
vi.mock("~/env.mjs", () => ({ env: { NEXT_PUBLIC_SITE_URL: "https://example.com" } }));

// `vi.hoisted` — NOT plain `const` — because `vi.mock` factories below run
// during THIS file's import phase (ES import evaluation always runs before
// any of a module's own top-level statements), and `./client` calls
// `createAuthClient(...)` at ITS OWN module-eval time too — by the time that
// nested call reaches this factory, a plain `const signOutMock = vi.fn()`
// written below would still be in its temporal dead zone.
const { signOutMock, beginTransitionMock } = vi.hoisted(() => ({
  signOutMock: vi.fn(),
  beginTransitionMock: vi.fn(),
}));
vi.mock("better-auth/react", () => ({
  createAuthClient: () => ({
    signIn: {},
    signOut: signOutMock,
    useSession: () => ({ data: null, isPending: false }),
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    $store: { listen: () => {} },
  }),
}));
vi.mock("@better-auth/api-key/client", () => ({ apiKeyClient: () => ({}) }));
vi.mock("@convex-dev/better-auth/client/plugins", () => ({ convexClient: () => ({}) }));
vi.mock("better-auth/client/plugins", () => ({
  adminClient: () => ({}),
  anonymousClient: () => ({}),
}));

vi.mock("@vexcms/react", () => ({
  useAuthTransition: () => ({ beginTransition: beginTransitionMock }),
  clearEditScrollStorage: () => undefined,
}));

let capturedSignOut: (() => Promise<void>) | undefined;
vi.mock("@vexcms/next/auth", () => ({
  VexAdminAuthAdapterProvider: ({
    value,
    children,
  }: {
    children: ReactNode;
    value: { signOut: () => Promise<void> };
  }) => {
    capturedSignOut = value.signOut;
    return children;
  },
}));

// Imported after the mocks above — `vi.mock` calls are hoisted by Vitest's
// transform regardless of source position, so this static import always
// resolves against the mocked modules, same as every other call site.
import BetterAuthClientProvider from "./client"

describe("BetterAuthClientProvider — signOut (apps/www)", () => {
  let originalLocation: Location;

  beforeEach(() => {
    signOutMock.mockReset();
    beginTransitionMock.mockReset();
    capturedSignOut = undefined;
    originalLocation = window.location;
    // jsdom's real `Location` throws "Not implemented: navigation" on a
    // `reload()` call — replaced with a spy so the full-reload in `signOut`
    // is just an observable call.
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...originalLocation, reload: vi.fn() },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
  });

  it("full-reloads the current page once signOut() resolves", async () => {
    signOutMock.mockResolvedValue(undefined);
    render(<BetterAuthClientProvider>{null}</BetterAuthClientProvider>);

    expect(capturedSignOut).toBeDefined();
    await capturedSignOut!();

    expect(beginTransitionMock).toHaveBeenCalledWith(null, { skipRefresh: true });
    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(window.location.reload).toHaveBeenCalledTimes(1);
  });

  it("still full-reloads the current page when signOut() rejects", async () => {
    signOutMock.mockRejectedValue(new Error("network error"));
    render(<BetterAuthClientProvider>{null}</BetterAuthClientProvider>);

    await capturedSignOut!();

    expect(window.location.reload).toHaveBeenCalledTimes(1);
  });
});
