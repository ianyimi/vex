# Environment Variables

| VAR | required | description |
|---|---|---|
| NEXT_PUBLIC_CONVEX_URL | yes | Convex deployment URL for the www app client |
| NEXT_PUBLIC_CONVEX_SITE_URL | yes | Convex site URL (HTTP actions) for the www app |
| CONVEX_DEPLOYMENT | yes | Deployment name used by `npx convex dev` |
| NEXT_PUBLIC_SITE_URL | yes | Public site URL (http://localhost:3020 in dev) |
| BETTER_AUTH_SECRET | yes | Better Auth session signing secret |
| NPM_TOKEN | no | npm publish token (root .env.local) — only needed for `pnpm release` |
