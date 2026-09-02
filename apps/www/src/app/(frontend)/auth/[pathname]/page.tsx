import AuthView from "./view"

export const dynamic = "force-dynamic"

export default async function AuthPage({ params }: { params: Promise<{ pathname: string }> }) {
  const { pathname } = await params

  return <AuthView pathname={pathname} />
}
