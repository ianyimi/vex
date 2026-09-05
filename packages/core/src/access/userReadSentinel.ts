/**
 * Builds the `user` a constraints callback receives when the caller is
 * sessionless (`user` is `null`/`undefined`), plus a way to tell afterward
 * whether the callback ever read anything off it.
 *
 * Shared by {@link resolveConstrainedCheck} (`hasPermission`'s per-document
 * pass) and `classifyRole` (`resolveAccessRule`'s query-shaping pass) — both
 * evaluate the SAME rule against a SAME-shaped caller and must reach the same
 * verdict, or `find`'s indexed path and its per-document check would silently
 * disagree.
 *
 * A rule keyed to the caller (`fq.eq("email", user.email)`) has nothing to
 * scope to when there is no caller — it must deny, never widen. Handing it a
 * plain `{}` would instead compile `eq("email", undefined)`, and Convex
 * treats `undefined` as "field is absent," so the range/filter would match
 * every row missing that field — a silent widening, worse than the error it
 * replaces. A rule that never asks who the caller is (`fq.eq("published",
 * true)`) must keep working unauthenticated — that is the whole point of
 * `anonRole`.
 *
 * The sentinel `Proxy` tells the two cases apart without guessing which shape
 * a rule will read (`user.id`, `user._id`, `"email" in user`, …): if the
 * callback's evaluation never touched a property, the rule was
 * caller-independent and its outcome stands untouched.
 *
 * @param user - The resolved caller, or `null`/`undefined` for sessionless.
 * @returns `user` — the real document when present, otherwise a
 *   read-tracking `Proxy` standing in for `{}` — and `wasRead()`, `true` once
 *   any property has been read or probed off that proxy.
 */
export function createUserReadSentinel<TUser>(
  user: TUser | null | undefined,
): { user: TUser; wasRead: () => boolean } {
  if (user != null) return { user, wasRead: () => false };

  let read = false;
  const sentinel = new Proxy(
    {},
    {
      get: (_target, key) => {
        // `then` is probed by promise-resolution machinery, not by the rule.
        if (key !== "then") read = true;
        return undefined;
      },
      has: (_target, key) => {
        if (key !== "then") read = true;
        return false;
      },
    },
  ) as TUser;

  return { user: sentinel, wasRead: () => read };
}
