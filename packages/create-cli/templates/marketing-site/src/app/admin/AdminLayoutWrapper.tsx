"use client"

import { useCallback } from "react"
import { useMutation, useQuery } from "convex/react"
import { useRouter } from "next/navigation"
import { AdminLayout, OnboardingTour, useOnboardingTour } from "@vexcms/admin-next"
import type { PermissionUser } from "@vexcms/admin-next"
import type { ClientVexConfig } from "@vexcms/core"
import { api } from "@convex/_generated/api"
import { access } from "~/vexcms/access"

/**
 * Client wrapper that provides the access config directly (not through RSC serialization).
 * Includes the onboarding tour for the marketing site template.
 */
export function AdminLayoutWrapper({
  config,
  user,
  permissionUser,
  children,
}: {
  config: ClientVexConfig
  user?: { name: string; email: string; avatar?: string }
  permissionUser?: PermissionUser
  children: React.ReactNode
}) {
  const router = useRouter()
  const onboardingStatus = useQuery(api.vex.firstUser.getOnboardingStatus)
  const completeOnboarding = useMutation(api.vex.firstUser.completeOnboarding)
  const resetOnboarding = useMutation(api.vex.firstUser.resetOnboarding)

  const handleComplete = useCallback(() => {
    completeOnboarding()
  }, [completeOnboarding])

  const handleReset = useCallback(() => {
    resetOnboarding()
  }, [resetOnboarding])

  const navigate = useCallback((path: string) => {
    router.push(path)
  }, [router])

  const { showTour, completeTour } = useOnboardingTour({
    config,
    isComplete: onboardingStatus?.complete ?? true,
    onComplete: handleComplete,
    onReset: handleReset,
  })

  // Use the first collection as the example for the tour
  const exampleCollection = config.collections[0]?.slug

  return (
    <AdminLayout
      config={config}
      user={user}
      permissionUser={permissionUser}
      access={access}
    >
      {children}
      <OnboardingTour
        active={showTour}
        onComplete={completeTour}
        basePath={config.basePath}
        exampleCollection={exampleCollection}
        navigate={navigate}
      />
    </AdminLayout>
  )
}
