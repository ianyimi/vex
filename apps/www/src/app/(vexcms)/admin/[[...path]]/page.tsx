import { NextAdminPage } from "@vexcms/next/server";
import { redirect } from "next/navigation";

import { getToken } from "~/auth/server";
import config from "~/vex.config";

export const dynamic = "force-dynamic";

export default async function AdminPage({ params }: { params: Promise<{ path?: string[] }> }) {
  const token = await getToken();
  if (!token) {
    redirect("/auth/sign-in?redirectTo=/admin");
  }
  return <NextAdminPage config={config} params={params} token={token} />;
}
