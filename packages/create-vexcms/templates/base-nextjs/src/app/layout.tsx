import type { Metadata } from "next"

import "./globals.css"

import { LivePreviewProvider } from "@vexcms/react"
import localFont from "next/font/local"

import ClientProviders from "~/components/providers/client"
import ServerProviders from "~/components/providers/server"
import { ThemeScript } from "~/components/ThemeScript"

/**
 * Loaded from the `geist` package rather than `next/font/google`: Google Fonts
 * intermittently serves extensionless `/l/font?kit=…&skey=…` URLs that break
 * Turbopack builds (vercel/next.js#99114).
 */
const geistSans = localFont({
  display: "swap",
  src: "../../node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2",
  variable: "--font-sans",
  weight: "100 900",
})

const geistMono = localFont({
  display: "swap",
  src: "../../node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
})

export const metadata: Metadata = {
  description: "Built with VexCMS",
  icons: { icon: "/favicons/favicon.ico" },
  title: "VexCMS",
}

export default function RootLayout({
  auth,
  children,
}: Readonly<{
  auth: React.ReactNode
  children: React.ReactNode
}>) {
  return (
    <html className={`${geistSans.variable} ${geistMono.variable} antialiased`} lang="en" suppressHydrationWarning>
      <head>
        {/* Applies the persisted light/dark class before first paint —
            without it the admin flashes light before the saved mode lands. */}
        <ThemeScript />
      </head>
      <body>
        <ServerProviders>
          <ClientProviders>
            {/* Wraps the whole app: the overlay only reaches consumers inside
                the provider. It reads collections, globals and allowed origins
                from `VexConfigContext`, and gates itself on the
                session-verified cookie plus `?vexLivePreview=1` (or the
                preview window name it writes on first activation), so every
                public route stays prerenderable. Inert until a collection or
                global sets `admin.livePreview.url`. */}
            <LivePreviewProvider>
              {children}
              {/* `@auth` parallel slot (`app/@auth/`), sibling of this layout —
                  covers both `(frontend)` and `(vexcms)` since both groups share
                  this root. Rendered after `children` so the intercepted
                  `/auth/[pathname]` dialog/full-screen card portals/paints over
                  whichever page (site or admin) triggered it. */}
              {auth}
            </LivePreviewProvider>
          </ClientProviders>
        </ServerProviders>
      </body>
    </html>
  )
}
