import { AuthView } from "@daveyplate/better-auth-ui";

import { resolveAuthPageTitle } from "~/lib/authPageTitle";

export default function AuthCard({ pathname }: { pathname: string }) {
  return (
    <main className="absolute inset-0 grid place-items-center">
      <h1 className="sr-only">{resolveAuthPageTitle(pathname)}</h1>
      <AuthView path={pathname} />
    </main>
  );
}
