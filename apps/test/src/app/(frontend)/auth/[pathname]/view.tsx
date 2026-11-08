import { AuthView } from "@daveyplate/better-auth-ui";

import AuthViewProvider from "~/auth/AuthViewProvider";
import { resolveAuthPageTitle } from "~/lib/authPageTitle";

export default function AuthCard({ pathname }: { pathname: string }) {
  return (
    <AuthViewProvider>
      <main className="absolute inset-0 grid place-items-center">
        <h1 className="sr-only">{resolveAuthPageTitle(pathname)}</h1>
        <AuthView path={pathname} />
      </main>
    </AuthViewProvider>
  );
}
