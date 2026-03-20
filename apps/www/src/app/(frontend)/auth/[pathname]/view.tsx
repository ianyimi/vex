"use client"

import { AuthView } from "@daveyplate/better-auth-ui"

export default function AuthCard({ pathname }: { pathname: string }) {
  return (
    <main className="absolute inset-0 grid place-items-center">
      <AuthView path={pathname} />
    </main>
  )
}
