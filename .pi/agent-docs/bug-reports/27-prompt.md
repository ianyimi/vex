# Prompt for Another Agent: Fix Better Auth Session Lookup

## The Bug
User can sign in successfully, but navigating to `/admin` redirects back to sign-in page.

## Root Cause
The `better-auth.session_token` cookie contains a **JWT token** (format: `header.payload.signature`), but the `getSessionWithUser` query looks up sessions by the raw `token` field.

Example:
- Cookie: `Th6d45b0nB5oMGgsgRgtHhqi6Jy1sGT5.YDjTSo9zIiGqNEmehQUYqULXIqkZxMYSxKplWVFmLMs=` (JWT)
- DB: `Th6d45b0nB5oMGgsgRgtHhqi6Jy1sGT5` (raw token - only the JWT header!)

## Key Files
- `apps/www/src/auth/serverUtils.ts` - `getSessionToken()` reads cookie, calls query
- `apps/www/convex/auth/sessions.ts` - queries `getSessionWithUser` (by token) and `getSessionById` (by _id)

## What the JWT Contains
The better-auth convex plugin creates JWTs with payload:
```javascript
{
  ...(user fields),
  sessionId: session.id,  // The session's _id (Convex ID), NOT the token!
  iat: timestamp
}
```

## Current Code State
The latest attempt decodes the JWT to get `sessionId`, returns `__sessionId__:<id>` marker, then calls `getSessionById` to look up by `_id`.

But it's STILL failing - JWT is detected but sessionId is not extracted.

## Reference Document
See `.pi/agent-docs/bug-reports/27-better-auth-session-lookup.md` for full details.

## Your Task
1. Read the reference document
2. Check why JWT payload decoding is failing
3. Add logging to see what's actually IN the JWT payload
4. Fix the extraction to get `sessionId` properly
5. Ensure `getSessionById` query is called and works

## Debug Command
Restart dev server: `rm -rf apps/www/.next && pnpm --filter www dev`
Check Convex logs in the tmux pane where `npx convex dev` is running.

## Known Issue
The logging shows:
```
[getSessionToken] cookie contains JWT, decoding...
[getSessionToken] could not extract session token from JWT
```

This means the JWT is being detected but the extraction is failing. The payload might not have `sessionId` field, or the base64 decoding is failing.