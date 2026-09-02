import { api } from "@convex/_generated/api";

import { fetchAuthQuery, getToken } from "~/auth/server";
import { AuthProvider } from "~/context/AuthContext";

export async function AuthServerProvider(props: { children: React.ReactNode }) {
  const sessionToken = await getToken();
  if (!sessionToken) {
    return <AuthProvider value={{ user: null }}>{props.children}</AuthProvider>;
  }
  const auth = await fetchAuthQuery(api.auth.api.getUserOrg, {});
  return <AuthProvider value={auth}>{props.children}</AuthProvider>;
}
