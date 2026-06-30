import type { ReactNode } from "react";

import { NextAdminLayout } from "@vexcms/next/client";

import { getCurrentUser } from "~/auth/serverUtils";
import config from "~/vex.config";

import { ClientProviders } from "./clientProviders";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  return (
    <ClientProviders>
      <NextAdminLayout config={config} user={user ?? undefined}>
        {children}
      </NextAdminLayout>
    </ClientProviders>
  );
}
