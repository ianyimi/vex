function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />
}

/**
 * Full-page skeleton matching the marketing page layout.
 * Shows a hero skeleton, feature cards skeleton, and content block skeleton.
 */
export function PageSkeleton() {
  return (
    <div>
      {/* Hero skeleton */}
      <section className="flex min-h-[90vh] flex-col items-center justify-center px-6">
        <div className="mx-auto w-full max-w-3xl space-y-6 text-center">
          <Skeleton className="mx-auto h-8 w-40 rounded-full" />
          <Skeleton className="mx-auto h-14 w-full max-w-xl" />
          <Skeleton className="mx-auto h-6 w-full max-w-lg" />
          <div className="flex items-center justify-center gap-3 pt-4">
            <Skeleton className="h-11 w-32 rounded-xl" />
            <Skeleton className="h-11 w-36 rounded-xl" />
          </div>
        </div>
      </section>

      {/* Features skeleton */}
      <section className="py-16 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <div className="space-y-4 text-center">
            <Skeleton className="mx-auto h-10 w-96" />
            <Skeleton className="mx-auto h-5 w-80" />
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-4 rounded-xl border p-6">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content block skeleton */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl space-y-4 px-6">
          <Skeleton className="mx-auto h-10 w-72" />
          <Skeleton className="mx-auto h-5 w-96" />
          <div className="mt-8 space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
