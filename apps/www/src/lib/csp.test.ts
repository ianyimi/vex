import { buildContentSecurityPolicy } from "./csp";

describe("buildContentSecurityPolicy", () => {
  it("includes the Convex host in img-src and connect-src (https + wss)", () => {
    const csp = buildContentSecurityPolicy({
      convexHost: "striped-raven-123.convex.cloud",
      frameAncestors: "'self'",
    });

    expect(csp).toBe(
      "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' https://striped-raven-123.convex.cloud; " +
        "font-src 'self'; " +
        "connect-src 'self' https://striped-raven-123.convex.cloud wss://striped-raven-123.convex.cloud; " +
        "media-src 'self'; " +
        "frame-src 'self'; " +
        "frame-ancestors 'self'; " +
        "worker-src 'none'; " +
        "base-uri 'self'; " +
        "form-action 'self'",
    );
  });

  it("omits the Convex origin from img-src and connect-src when no deployment is configured", () => {
    const csp = buildContentSecurityPolicy({
      convexHost: "",
      frameAncestors: "'self'",
    });

    expect(csp).toBe(
      "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self'; " +
        "font-src 'self'; " +
        "connect-src 'self'; " +
        "media-src 'self'; " +
        "frame-src 'self'; " +
        "frame-ancestors 'self'; " +
        "worker-src 'none'; " +
        "base-uri 'self'; " +
        "form-action 'self'",
    );
  });
});
