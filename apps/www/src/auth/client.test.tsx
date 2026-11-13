import type { ReactNode } from "react"

import { render } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// `~/env.mjs` throws at import time when `NEXT_PUBLIC_CONVEX_URL`/etc. aren't
// set (real `createEnv()` validation) — mocked the same way
// `components/providers/convex.test.tsx` mocks it.
vi.mock("~/env.mjs", () => ({ env: { NEXT_PUBLIC_SITE_URL: "https://example.com" } }));

// `~/vex.config` pulls in the project's real collections/globals — mocked
// down to the one field this test reads, `auth.signOut.redirectTo`.
vi.mock("~/vex.config", () => ({
  default: { auth: { signOut: { redirectTo: "/goodbye" } } },
}));

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
    // jsdom's real `Location` throws "Not implemented: navigation" on an
    // `href` assignment — swapped for a plain object so the hard-navigation
    // assignment in `signOut` is just an observable write.
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...originalLocation, href: originalLocation.href },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
  });

  it("hard-navigates to the resolved auth.signOut.redirectTo once signOut() resolves", async () => {
    signOutMock.mockResolvedValue(undefined);
    render(<BetterAuthClientProvider>{null}</BetterAuthClientProvider>);

    expect(capturedSignOut).toBeDefined();
    await capturedSignOut!();

    expect(beginTransitionMock).toHaveBeenCalledWith(null, { skipRefresh: true });
    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(window.location.href).toBe("/goodbye");
  });

  it("still hard-navigates to the resolved destination when signOut() rejects", async () => {
    signOutMock.mockRejectedValue(new Error("network error"));
    render(<BetterAuthClientProvider>{null}</BetterAuthClientProvider>);

    await capturedSignOut!();

    expect(window.location.href).toBe("/goodbye");
  });
});
