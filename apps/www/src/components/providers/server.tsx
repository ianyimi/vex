import { NuqsAdapter } from "nuqs/adapters/next/app"
import { type PropsWithChildren } from "react"

import ConvexClientProvider from "./convex"
import { ThemeProvider } from "./theme"

export default function ServerProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" disableTransitionOnChange enableSystem>
      <ConvexClientProvider>
        <NuqsAdapter>{children}</NuqsAdapter>
      </ConvexClientProvider>
    </ThemeProvider>
  )
}
