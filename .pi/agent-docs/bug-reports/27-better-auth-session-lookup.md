# Bug: Better Auth Session Lookup Failing

## Summary

User can sign in successfully, but navigating to `/admin` redirects back to sign-in page. The `getSession()` utility function in `apps/www/src/auth/serverUtils.ts` returns null.

## Root Cause

The `better-auth.session_token` cookie contains a **JWT token** (format: `header.payload.signature`), not a raw session token. The `getSessionWithUser` query in `apps/www/convex/auth/sessions.ts` looks up sessions by the raw `token` field using the `by_token` index, but receives a JWT.

### Example of what's in the cookie:
```
Th6d45b0nB5oMGgsgRgtHhqi6Jy1sGT5.YDjTSo9zIiGqNEmehQUYqULXIqkZxMYSxKplWVFmLMs=
```
This is a JWT with 3 parts separated by `.`

### What's in the database:
```
Th6d45b0nB5oMGgsgRgtHhqi6Jy1sGT5
```
This is only the first part of the JWT (the header), stored as the raw `token` field.

### What the JWT payload contains:
The better-auth convex plugin creates JWTs with this payload structure:
```javascript
{
  ...(user fields, excluding "id" and "image"),
  sessionId: session.id,  // The session's _id (Convex ID), NOT the token!
  iat: Math.floor(new Date().getTime() / 1000)
}
```

**Key insight:** The JWT payload contains `sessionId` (the session's `_id` Convex ID), NOT the raw session token.

## Files Involved

### `apps/www/src/auth/serverUtils.ts`
- Contains `getSessionToken()`, `getCurrentUser()`, `getSession()`
- Reads cookie `better-auth.session_token`
- Calls Convex query `api.auth.sessions.getSessionWithUser`

### `apps/www/convex/auth/sessions.ts`
- Contains `getSessionWithUser` query (looks up by `token` field)
- Contains `getSessionById` query (looks up by `_id` field) - added during debugging
- Contains `listAllSessions` query - for debugging

### `apps/www/convex/auth/db.ts`
- Uses `authDbApi` from `@vexcms/better-auth/convex`
- Creates db operations: `dbCreate`, `dbFindOne`, `dbFindMany`, `dbCount`, `dbUpdate`, `dbUpdateMany`, `dbDelete`, `dbDeleteMany`

### `apps/www/convex/auth/index.ts`
- Uses `createBetterAuthAdapter` from `@vexcms/better-auth/convex`

### `packages/better-auth/src/convex/`
- Contains `authDbApi`, `createBetterAuthAdapter`, `convexAdapter`
- Adapter uses `anyApi.auth.db.dbCreate` etc. for db operations

## Everything We Tried That Did NOT Work

### 1. Initial hypothesis: Wrong cookie being read
**Fix attempted:** Added logging to show both `better-auth.session_token` and `convex_jwt` cookies
**Result:** `better-auth.session_token` exists with 77 chars, `convex_jwt` is null. Token was JWT format.

### 2. Checked if better-auth was using different token format
**Fix attempted:** Examined cookie values - found cookie contains JWT, not raw token
**Result:** Confirmed the cookie contains a JWT, not the raw session token

### 3. Tried using `convex_jwt` cookie instead
**Fix attempted:** Changed code to read `better-auth.convex_jwt` cookie
**Result:** That cookie also contains a JWT (different one), same issue

### 4. Attempted to decode JWT and extract session token
**Fix attempted:** Modified `getSessionToken()` to detect JWT (contains `.`) and decode payload
**Result:** JWT payload does NOT contain `sessionToken` field - it contains `sessionId`

### 5. Cleared all sessions in database
**Fix attempted:** Deleted all session records from database
**Result:** New session created, but issue persisted - still receiving JWT, not raw token

### 6. Added path mapping for better-auth package hot reload
**Fix attempted:** Added to `apps/www/tsconfig.json`:
```json
"@vexcms/better-auth": ["../../packages/better-auth/src/index.ts"],
"@vexcms/better-auth/convex": ["../../packages/better-auth/src/convex/index.ts"]
```
**Result:** Fixed hot reload issue

### 7. Added debug logging to query to see token comparison
**Fix attempted:** Added logging showing full tokens and diff
**Result:** Confirmed tokens are different (JWT vs raw token). The log showed:
```
received token: 'Th6d45b0nB5oMGgsgRgtHhqi6Jy1sGT5.YDjTSo9zIiGqNEmehQUYqULXIqkZxMYSxKplWVFmLMs='
token=Th6d45b0nB5oMGgsgRgtHhqi6Jy1sGT5 (diff: qi6Jy1sGT5 vs plWVFmLMs=)
```

## Current State (Not Working Yet)

The most recent attempt was to:
1. Decode JWT to get `sessionId` from payload
2. Return a marker `__sessionId__:<id>` so `getSession()` knows to use `getSessionById` instead of `getSessionWithUser`
3. `getSessionById` looks up session by `_id` using `ctx.db.get()` directly

**But it's still failing** because the JWT payload decoding is not extracting the sessionId properly. The logs show:
```
[getSessionToken] cookie contains JWT, decoding...
[getSessionToken] could not extract session token from JWT
```

The code is detecting the JWT but failing to extract the sessionId from the payload.

## What Should Work

The fix should:
1. Decode the JWT payload (base64 decode the middle part)
2. Extract `sessionId` from the payload (it's the session's `_id` Convex ID)
3. Look up the session by `_id` instead of by `token`

OR:

4. Change the better-auth configuration to store the raw session token in the cookie instead of a JWT

## Key Reference: better-auth convex plugin JWT payload

From `packages/better-auth/node_modules/@convex-dev/better-auth/dist/plugins/convex/index.js`:
```javascript
definePayload: ({ user, session }) => ({
  ...(opts.jwt?.definePayload
      ? opts.jwt.definePayload({ user, session })
      : omit(user, ["id", "image"])),
  sessionId: session.id,  // session.id is the session's _id
  iat: Math.floor(new Date().getTime() / 1000),
}),
```

The `sessionId` field contains the session's `_id` (Convex ID), not the raw `token` field.

## Questions to Answer

1. Is the JWT payload being decoded correctly?
2. Does the JWT payload actually contain `sessionId`?
3. What's in the JWT payload exactly?
4. Is there a different field name for the session ID in the payload?

## Suggested Next Steps

1. Add detailed logging to decode the JWT and print ALL fields in the payload
2. Verify the JWT payload structure from better-auth
3. Consider changing better-auth config to use raw session token instead of JWT
4. Consider modifying the session table to store the `_id` in a way that can be looked up from the JWT