import type { ReactNode } from "react"

import { render } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("~/env.mjs", () => ({ env: { NEXT_PUBLIC_SITE_URL: "https://example.com" } }));
vi.mock("better-auth/react", () => ({
  createAuthClient: () => ({
    signOut: vi.fn(),
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
  organizationClient: () => ({}),
}));

type CapturedAuthUIProviderProps = {
  navigate: (href: string) => void;
  replace: (href: string) => void;
};

let captured: CapturedAuthUIProviderProps | undefined;
vi.mock("@daveyplate/better-auth-ui", () => ({
  AuthUIProvider: (props: CapturedAuthUIProviderProps & { children: ReactNode }) => {
    captured = props;
    return props.children;
  },
}));

// Imported after the mocks above — `vi.mock` calls are hoisted by Vitest's
// transform regardless of source position.
import AuthViewProvider from "./AuthViewProvider"

describe("AuthViewProvider — navigate/replace (apps/test)", () => {
  let originalLocation: Location;
  let replaceSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    captured = undefined;
    originalLocation = window.location;
    replaceSpy = vi.fn();
    // jsdom's real `Location` throws "Not implemented: navigation" on both
    // an `href` assignment and `.replace()` — swapped for a plain object so
    // both are just observable writes/calls.
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...originalLocation, href: originalLocation.href, replace: replaceSpy },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
  });

  it("navigate() hard-navigates via window.location.href, never router.push", () => {
    render(<AuthViewProvider>{null}</AuthViewProvider>);

    expect(captured).toBeDefined();
    captured!.navigate("/admin/posts");

    expect(window.location.href).toBe("/admin/posts");
  });

  it("replace() hard-navigates via window.location.replace, never router.replace", () => {
    render(<AuthViewProvider>{null}</AuthViewProvider>);

    captured!.replace("/admin");

    expect(replaceSpy).toHaveBeenCalledWith("/admin");
  });
});
