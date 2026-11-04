import { getToken, getUserOrg } from "~/auth/server";
import { AuthProvider } from "~/context/AuthContext";

export async function AuthServerProvider(props: { children: React.ReactNode }) {
  // Started together, not sequentially — see `page.tsx`'s identical comment. Both calls
  // are `cache()`-memoized (`auth/server.ts`), so this reuses whichever of `layout.tsx`'s/
  // `page.tsx`'s own calls for the same values resolves first, instead of firing a third
  // round trip for identical data (fixes ~1s warm reloads).
  const [sessionToken, auth] = await Promise.all([getToken(), getUserOrg()]);
  if (!sessionToken) {
    return <AuthProvider value={{ user: null }}>{props.children}</AuthProvider>;
  }
  return <AuthProvider value={auth}>{props.children}</AuthProvider>;
}
