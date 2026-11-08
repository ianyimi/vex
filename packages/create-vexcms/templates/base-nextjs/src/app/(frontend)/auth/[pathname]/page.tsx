import type { Metadata } from "next"

import { resolveAuthPageTitle } from "~/lib/authPageTitle"

import AuthView from "./view"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pathname: string }>
}): Promise<Metadata> {
  const { pathname } = await params
  return { title: `${resolveAuthPageTitle(pathname)} | Vex CMS` }
}

export default async function AuthPage({ params }: { params: Promise<{ pathname: string }> }) {
  const { pathname } = await params

  return <AuthView pathname={pathname} />
}
