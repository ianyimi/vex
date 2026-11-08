export interface ContentSecurityPolicyInput {
  /** `new URL(env.NEXT_PUBLIC_CONVEX_URL).hostname`, or `""` when no deployment is configured. */
  convexHost: string;
  /** The `frame-ancestors` source list, e.g. `"'self'"`. */
  frameAncestors: string;
}

/**
 * Builds the static `Content-Security-Policy` header value for `apps/test`.
 *
 * `script-src` carries `'unsafe-inline'`, not a hash list: Next's App Router
 * inlines a fresh `self.__next_f.push(...)` Flight payload (and, on a
 * dynamically rendered route, a random `self.__next_r="..."` resume token)
 * into every single response — static, ISR, or dynamic — and neither can be
 * pinned by a finite set of `sha256` hashes (confirmed against both `next
 * dev`'s and a real `next build`'s HTML output; see `findings.md` F-102).
 * Next's own nonce mechanism would avoid `'unsafe-inline'`, but requires
 * every route to render dynamically, which would drop this app's ISR/CDN
 * caching entirely — out of scope here (the task itself asks for no nonces).
 *
 * @param props - Input props.
 * @returns The `;`-joined directive list.
 */
export function buildContentSecurityPolicy(props: ContentSecurityPolicyInput): string {
  const convexOrigin = props.convexHost ? ` https://${props.convexHost}` : "";
  const convexSocket = props.convexHost ? ` wss://${props.convexHost}` : "";

  return [
    `default-src 'self'`,
    `script-src 'self' 'unsafe-inline'`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self'${convexOrigin}`,
    `font-src 'self'`,
    `connect-src 'self'${convexOrigin}${convexSocket}`,
    `media-src 'self'`,
    `frame-src 'self'`,
    `frame-ancestors ${props.frameAncestors}`,
    `worker-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ].join("; ");
}
