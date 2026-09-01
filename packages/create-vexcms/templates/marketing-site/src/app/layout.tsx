import type { Metadata } from "next"

import "./globals.css"

import { ThemeScript } from "@vexcms/react"
import { Geist, Geist_Mono } from "next/font/google"

import ClientProviders from "~/components/providers/client"
import ServerProviders from "~/components/providers/server"
import { ThemeLive } from "~/components/ThemeLive"
import { ThemeStyle } from "~/components/ThemeStyle"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  description: "Built with VexCMS",
  icons: { icon: "/favicons/favicon.ico" },
  title: "VexCMS",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      lang="en"
      suppressHydrationWarning
    >
      <head>
        {/* ThemeScript applies the persisted light/dark class before first
            paint (no flash); ThemeStyle server-renders the active site theme
            once for the whole app — the admin layout re-emits its own scope
            at higher specificity, so `siteSettings.adminTheme` opts out. */}
        <ThemeScript />
        <ThemeStyle />
      </head>
      <body>
        <ServerProviders>
          <ClientProviders>
            <ThemeLive />
            {children}
          </ClientProviders>
        </ServerProviders>
      </body>
    </html>
  )
}
