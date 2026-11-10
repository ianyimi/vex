import { afterEach, describe, expect, it, vi } from "vitest";

// `~/env.mjs` throws at import time when `NEXT_PUBLIC_CONVEX_URL`/etc. aren't
// set (real `createEnv()` validation) — mocked so importing `./convex` here
// doesn't require the app's real `.env.local`. `~/auth/client` is mocked for
// the same reason one level up: it imports `~/env.mjs` itself.
vi.mock("~/env.mjs", () => ({ env: { NEXT_PUBLIC_CONVEX_URL: "https://example.convex.cloud" } }));
vi.mock("~/auth/client", () => ({
  authClient: { useSession: () => ({ data: null, isPending: false }) },
}));

import { hasSessionHint } from "./convex";

describe("hasSessionHint (apps/test)", () => {
  afterEach(() => {
    document.head.innerHTML = "";
  });

  it("returns false when the admin layout never rendered the SSR session hint", () => {
    expect(hasSessionHint()).toBe(false);
  });

  it('returns true once the `<meta name="vex-session">` hint the admin layout renders is in the DOM', () => {
    const meta = document.createElement("meta");
    meta.setAttribute("name", "vex-session");
    meta.setAttribute("content", "1");
    document.head.appendChild(meta);

    expect(hasSessionHint()).toBe(true);
  });

  it("ignores an unrelated meta tag", () => {
    const meta = document.createElement("meta");
    meta.setAttribute("name", "description");
    meta.setAttribute("content", "something else");
    document.head.appendChild(meta);

    expect(hasSessionHint()).toBe(false);
  });
});
