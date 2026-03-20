import type { Metadata } from "next"

import ClientProviders from "~/components/providers/client"
import ServerProviders from "~/components/providers/server"

import "./globals.css"

export const metadata: Metadata = {
  description: "Test application for Vex CMS development",
  title: "Vex CMS Test App",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ServerProviders>
          <ClientProviders>
            {children}
          </ClientProviders>
        </ServerProviders>
      </body>
    </html>
  )
}
