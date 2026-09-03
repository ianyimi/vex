import type { Metadata } from "next"

import "./globals.css"

import { ThemeScript } from "@vexcms/react"
import { Geist, Geist_Mono } from "next/font/google"

import ClientProviders from "~/components/providers/client"
import ServerProviders from "~/components/providers/server"
import { ThemeLive } from "~/components/ThemeLive"
import { ThemeStyle } from "~/components/ThemeStyle"

/**
 * Geist carries the whole type system — display through body — so weight is
 * the only axis the design varies. 800 is the hero display weight; without it
 * next/font would synthesise it and the -0.04em tracking would fall apart.
 *
 * `--font-sans` is also written by the active theme record's `fontFamily`
 * (THEME_SHARED_TOKENS). Both land at specificity (0,1,0), so the theme's
 * stack acts as the fallback and an editor can change the family without a
 * redeploy.
 */
const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
})

const geistMono = Geist_Mono({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-geist-mono",
  weight: ["400", "500"],
})

/**
 * `icons.icon` lists the SVG first: browsers pick the last format they
 * understand, and every current engine understands `image/svg+xml`, so the
 * `.ico` only serves older ones. Both are the ember chevron from
 * `BrandMark` — the scaffold shipped Next.js's own black-triangle `.ico`
 * here, which is what put the wrong mark in the tab strip.
 */
export const metadata: Metadata = {
  description: "Built with VexCMS",
  icons: {
    apple: "/favicons/apple-touch-icon.png",
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicons/favicon.ico", sizes: "16x16 32x32 48x48" },
    ],
  },
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
