import { NextAdminPage } from "@vexcms/next/server";
import { redirect } from "next/navigation";

import { getSession } from "~/auth/serverUtils";
import config from "~/vex.config";

export const dynamic = "force-dynamic";

export default async function AdminPage({ params }: { params: Promise<{ path?: string[] }> }) {
  const session = await getSession();
  if (!session) {
    redirect("/auth/sign-in?redirectTo=/admin");
  }
  return <NextAdminPage config={config} params={params} />;
}
